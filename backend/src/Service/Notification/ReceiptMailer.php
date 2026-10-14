<?php

namespace App\Service\Notification;

use App\Entity\Donation;
use Psr\Log\LoggerInterface;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;

/**
 * Envoie le recu de don par e-mail (HTML + texte brut) au statut paye.
 */
class ReceiptMailer
{
    public function __construct(
        private MailerInterface $mailer,
        private LoggerInterface $logger,
        private string $fromAddress = 'munongo.bonkey@centreculturel.cd',
        private string $fromName = 'Biblio-Librairie du Grand Tambour',
        #[Autowire('%kernel.project_dir%/public/CCAPAC.png')]
        private string $logoPath = '',
    ) {}

    /**
     * Embarque le logo (CID « logo ») s'il est présent sur le disque.
     * Retourne true si embarqué, afin que le template affiche l'image.
     */
    private function embedLogo(TemplatedEmail $email): bool
    {
        if ($this->logoPath === '' || !is_file($this->logoPath)) {
            return false;
        }
        $email->embedFromPath($this->logoPath, 'logo', 'image/png');

        return true;
    }

    /**
     * @param string|null $overrideTo Destinataire de substitution (aperçu/test) ;
     *                                si null, on envoie au donateur du don.
     */
    public function sendDonationReceipt(Donation $donation, ?string $overrideTo = null): void
    {
        $donor = $donation->getDonor();
        $recipient = $overrideTo
            ? new Address($overrideTo, $donor->getName())
            : new Address($donor->getEmail(), $donor->getName());

        $email = (new TemplatedEmail())
            ->from(new Address($this->fromAddress, $this->fromName))
            ->to($recipient)
            ->replyTo(new Address($this->fromAddress, $this->fromName))
            ->subject(sprintf('Merci pour votre don - recu %s', $donation->getReference()))
            ->htmlTemplate('emails/donation_receipt.html.twig')
            ->text($this->buildTextFallback($donation));

        $email->context(['donation' => $donation, 'hasLogo' => $this->embedLogo($email)]);

        try {
            $this->mailer->send($email);
            $this->logger->info('Recu de don envoye', [
                'reference' => $donation->getReference(),
                'to' => $donor->getEmail(),
            ]);
        } catch (\Throwable $e) {
            // Un echec d'envoi ne doit jamais bloquer la confirmation du paiement.
            $this->logger->warning('Envoi du recu de don echoue', [
                'reference' => $donation->getReference(),
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Notifie le BÉNÉFICIAIRE qu'un don a été fait en son honneur
     * (dons « pour un proche » / « pour une organisation »).
     *
     * @param string|null $overrideTo Destinataire de substitution (aperçu/test).
     */
    public function sendBeneficiaryNotification(Donation $donation, ?string $overrideTo = null): void
    {
        $to = $overrideTo ?: $donation->getBeneficiaryEmail();
        if (!$to) {
            return; // pas de bénéficiaire : rien à envoyer.
        }

        $name = $donation->getBeneficiaryName() ?: 'Cher/Chère bénéficiaire';

        $email = (new TemplatedEmail())
            ->from(new Address($this->fromAddress, $this->fromName))
            ->to(new Address($to, $donation->getBeneficiaryName() ?: $to))
            ->replyTo(new Address($this->fromAddress, $this->fromName))
            ->subject(sprintf('%s a fait un don en votre honneur', $donation->getDonor()->getName()))
            ->htmlTemplate('emails/donation_honor.html.twig')
            ->text($this->buildHonorTextFallback($donation, $name));

        $email->context([
            'donation' => $donation,
            'beneficiaryName' => $name,
            'hasLogo' => $this->embedLogo($email),
        ]);

        try {
            $this->mailer->send($email);
            $this->logger->info('Notification bénéficiaire envoyée', [
                'reference' => $donation->getReference(),
                'to' => $to,
            ]);
        } catch (\Throwable $e) {
            $this->logger->warning('Envoi notification bénéficiaire échoué', [
                'reference' => $donation->getReference(),
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function buildHonorTextFallback(Donation $donation, string $beneficiaryName): string
    {
        $donorName = $donation->getDonor()->getName();
        $lines = [
            sprintf('Bonjour %s,', $beneficiaryName),
            '',
            sprintf('%s a fait un don de %s %s en votre honneur, en faveur de la', $donorName, $donation->getAmount(), $donation->getCurrency()),
            'Biblio-Librairie du Grand Tambour.',
        ];
        if ($donation->getBeneficiaryMessage()) {
            $lines[] = '';
            $lines[] = 'Message de la part du donateur :';
            $lines[] = sprintf('« %s »', $donation->getBeneficiaryMessage());
        }
        $lines[] = '';
        $lines[] = 'Avec toute notre gratitude,';
        $lines[] = "L'equipe du Grand Tambour";

        return implode("\n", $lines);
    }

    private function buildTextFallback(Donation $donation): string
    {
        $donor = $donation->getDonor();
        $date = ($donation->getConfirmedAt() ?? $donation->getCreatedAt())->format('d/m/Y H:i');

        return implode("\n", [
            sprintf('Bonjour %s,', $donor->getName()),
            '',
            'Nous vous remercions chaleureusement pour votre don en faveur de la',
            'Biblio-Librairie du Grand Tambour.',
            '',
            '--- Recapitulatif de votre don ---',
            sprintf('Reference    : %s', $donation->getReference()),
            'Statut       : Confirme',
            sprintf('Montant      : %s %s', $donation->getAmount(), $donation->getCurrency()),
            sprintf('Palier       : %s', $donation->getTier()->label()),
            sprintf('Moyen        : %s', $donation->getOperator()->label()),
            sprintf('Date         : %s', $date),
            '---',
            '',
            'Votre contribution est integralement affectee au developpement de la',
            'Biblio-Librairie : espace de lecture, ouvrages, ateliers et mediation culturelle.',
            '',
            'Pour toute question : munongo.bonkey@centreculturel.cd',
            '',
            'Avec toute notre gratitude,',
            "L'equipe du Grand Tambour",
        ]);
    }
}
