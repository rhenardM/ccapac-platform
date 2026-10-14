<?php

namespace App\Service\Newsletter;

use App\Entity\NewsletterSubscriber;
use App\Repository\NewsletterSubscriberRepository;
use Psr\Log\LoggerInterface;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;

/**
 * Envoi d'une campagne (e-mail groupé) aux abonnés actifs de la newsletter.
 * Envoi individuel (un destinataire par message) pour ne pas exposer les adresses.
 */
class NewsletterMailer
{
    public function __construct(
        private MailerInterface $mailer,
        private NewsletterSubscriberRepository $subscriberRepository,
        private LoggerInterface $logger,
        private string $fromAddress = 'dons@grandtambour.example',
        private string $fromName = 'Biblio-Librairie du Grand Tambour',
    ) {}

    /**
     * Envoie la campagne à tous les abonnés actifs.
     *
     * @return array{sent:int, failed:int, total:int}
     */
    public function sendCampaign(string $subject, string $htmlBody): array
    {
        $subscribers = $this->subscriberRepository->findBy(['isActive' => true]);
        $sent = 0;
        $failed = 0;

        foreach ($subscribers as $subscriber) {
            if ($this->sendOne($subscriber, $subject, $htmlBody)) {
                $sent++;
            } else {
                $failed++;
            }
        }

        return ['sent' => $sent, 'failed' => $failed, 'total' => count($subscribers)];
    }

    private function sendOne(NewsletterSubscriber $subscriber, string $subject, string $htmlBody): bool
    {
        try {
            $email = (new Email())
                ->from(new Address($this->fromAddress, $this->fromName))
                ->to(new Address($subscriber->getEmail(), $subscriber->getName() ?? ''))
                ->subject($subject)
                ->html($htmlBody)
                ->text(strip_tags($htmlBody));

            $this->mailer->send($email);

            return true;
        } catch (\Throwable $e) {
            $this->logger->warning('Envoi newsletter échoué', [
                'email' => $subscriber->getEmail(),
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }
}
