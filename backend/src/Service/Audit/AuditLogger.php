<?php

namespace App\Service\Audit;

use App\Entity\AuditLog;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\RequestStack;

/**
 * Enregistre les actions sensibles du back-office dans audit_logs.
 * N'échoue jamais l'action métier appelante (erreur seulement journalisée).
 */
class AuditLogger
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private RequestStack $requestStack,
        private ?Security $security = null,
    ) {}

    /**
     * @param array<string,mixed>|null $details
     */
    public function log(
        string $action,
        ?string $summary = null,
        ?string $entityType = null,
        ?string $entityId = null,
        ?array $details = null,
        ?string $performedBy = null,
    ): void {
        try {
            $log = (new AuditLog())
                ->setAction($action)
                ->setSummary($summary)
                ->setEntityType($entityType)
                ->setEntityId($entityId)
                ->setDetails($details)
                ->setPerformedBy($performedBy ?? $this->currentActor())
                ->setIp($this->requestStack->getCurrentRequest()?->getClientIp());

            $this->entityManager->persist($log);
            $this->entityManager->flush();
        } catch (\Throwable) {
            // L'audit ne doit jamais bloquer l'action métier.
        }
    }

    private function currentActor(): string
    {
        $user = $this->security?->getUser();

        if ($user instanceof User) {
            return (string) $user->getEmail();
        }

        return 'system';
    }
}
