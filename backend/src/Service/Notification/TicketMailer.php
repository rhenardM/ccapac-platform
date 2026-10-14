<?php

namespace App\Service\Notification;

use App\Entity\ScreeningRegistration;
use App\Entity\Ticket;
use App\Service\Ticketing\TicketService;
use Psr\Log\LoggerInterface;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;

/**
 * Envoie le billet numérique (PDF joint) au participant inscrit à une séance
 * gratuite. Distinct de la notification staff existante (ScreeningApiController) :
 * celle-ci s'adresse au PARTICIPANT, jamais envoyée avant cette fonctionnalité.
 */
class TicketMailer
{
    public function __construct(
        private MailerInterface $mailer,
        private LoggerInterface $logger,
        private TicketService $ticketService,
        private string $fromAddress = 'munongo.bonkey@centreculturel.cd',
        private string $fromName = 'Biblio-Librairie du Grand Tambour',
        #[Autowire('%kernel.project_dir%/public/CCAPAC.png')]
        private string $logoPath = '',
    ) {
    }

    private function embedLogo(TemplatedEmail $email): bool
    {
        if ($this->logoPath === '' || !is_file($this->logoPath)) {
            return false;
        }
        $email->embedFromPath($this->logoPath, 'logo', 'image/png');

        return true;
    }

    public function sendTicketConfirmation(ScreeningRegistration $registration, Ticket $ticket, string $rawToken, string $base): void
    {
        $viewUrl = sprintf(
            '%s/cinematheque/billet/%s?t=%s',
            rtrim($base, '/'),
            $ticket->getTicketNumber(),
            $rawToken
        );

        $email = (new TemplatedEmail())
            ->from(new Address($this->fromAddress, $this->fromName))
            ->to(new Address($registration->getEmail(), $registration->getFullName()))
            ->replyTo(new Address($this->fromAddress, $this->fromName))
            ->subject(sprintf('Votre billet — %s', $ticket->getScreening()?->getFilm()?->getTitle() ?? 'Séance'))
            ->htmlTemplate('emails/ticket_confirmation.html.twig')
            ->text($this->buildTextFallback($registration, $ticket, $viewUrl));

        $email->context([
            'registration' => $registration,
            'ticket' => $ticket,
            'viewUrl' => $viewUrl,
            'hasLogo' => $this->embedLogo($email),
        ]);

        $pdfPath = $this->ticketService->absolutePdfPath($ticket);
        if ($pdfPath && is_file($pdfPath)) {
            $email->attachFromPath($pdfPath, $ticket->getTicketNumber() . '.pdf', 'application/pdf');
        }

        try {
            $this->mailer->send($email);
            $this->logger->info('Billet envoyé par e-mail', [
                'ticketNumber' => $ticket->getTicketNumber(),
                'to' => $registration->getEmail(),
            ]);
        } catch (\Throwable $e) {
            // Un échec d'envoi ne doit jamais bloquer l'inscription/la génération du billet.
            $this->logger->warning('Envoi du billet par e-mail échoué', [
                'ticketNumber' => $ticket->getTicketNumber(),
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function buildTextFallback(ScreeningRegistration $registration, Ticket $ticket, string $viewUrl): string
    {
        $screening = $ticket->getScreening();
        $film = $screening?->getFilm();

        return implode("\n", [
            sprintf('Bonjour %s,', $registration->getFullName()),
            '',
            sprintf('Votre inscription à la séance « %s » est confirmée.', $film?->getTitle() ?? 'Séance'),
            '',
            '--- Votre billet ---',
            sprintf('Numéro   : %s', $ticket->getTicketNumber()),
            sprintf('Date     : %s', $screening?->getScheduledDate()?->format('d/m/Y') ?? '—'),
            sprintf('Heure    : %s', $screening?->getStartTime()?->format('H:i') ?? '—'),
            sprintf('Lieu     : %s', $screening?->getVenue() ?? '—'),
            '---',
            '',
            'Votre billet PDF est joint à ce message. Vous pouvez aussi le consulter en ligne :',
            $viewUrl,
            '',
            'Présentez ce billet (imprimé ou sur smartphone) à l\'entrée de la séance.',
            '',
            "L'équipe du Grand Tambour",
        ]);
    }
}
