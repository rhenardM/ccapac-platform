<?php

namespace App;

use Symfony\Component\Console\Messenger\RunCommandMessage;
use Symfony\Component\Scheduler\Attribute\AsSchedule;
use Symfony\Component\Scheduler\RecurringMessage;
use Symfony\Component\Scheduler\Schedule as SymfonySchedule;
use Symfony\Component\Scheduler\ScheduleProviderInterface;
use Symfony\Contracts\Cache\CacheInterface;

/**
 * Tâches récurrentes, consommées par le conteneur `scheduler`
 * (`messenger:consume scheduler_default`). Remplace les cron jobs hPanel
 * documentés dans DEPLOY_HOSTINGER.md (mêmes fréquences).
 */
#[AsSchedule]
class Schedule implements ScheduleProviderInterface
{
    public function __construct(
        private CacheInterface $cache,
    ) {
    }

    public function getSchedule(): SymfonySchedule
    {
        return (new SymfonySchedule())
            ->stateful($this->cache) // l'état survit aux redémarrages (Redis)
            ->processOnlyLastMissedRun(true) // pas de rafale après une coupure
            ->add(
                // Rafraîchit les dons en attente auprès de Makuta.
                RecurringMessage::every('2 minutes', new RunCommandMessage('app:donations:reconcile')),
                // Expire les dons restés en attente trop longtemps.
                RecurringMessage::every('10 minutes', new RunCommandMessage('app:donations:expire')),
            );
    }
}
