<?php

namespace App\EventListener;

use App\Entity\User;
use App\Service\Audit\AuditLogger;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\Security\Http\Event\LoginSuccessEvent;

/**
 * À chaque connexion réussie : met à jour lastLoginAt et journalise l'événement.
 */
#[AsEventListener(event: LoginSuccessEvent::class)]
class LoginListener
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private AuditLogger $auditLogger,
    ) {}

    public function __invoke(LoginSuccessEvent $event): void
    {
        $user = $event->getUser();
        if (!$user instanceof User) {
            return;
        }

        $user->setLastLoginAt(new \DateTimeImmutable());
        $this->entityManager->flush();

        $this->auditLogger->log(
            'login',
            sprintf('Connexion de %s', $user->getEmail()),
            'User',
            (string) $user->getId(),
            performedBy: (string) $user->getEmail(),
        );
    }
}
