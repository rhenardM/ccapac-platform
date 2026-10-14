<?php

namespace App\Command;

use App\Repository\DonationRepository;
use App\Service\Payment\DonationService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * Réconcilie les dons en attente avec Makuta (rattrape les callbacks perdus).
 * À planifier en cron (ex: toutes les 2 minutes).
 *
 *   php bin/console app:donations:reconcile [--older-than=2]
 */
#[AsCommand(
    name: 'app:donations:reconcile',
    description: 'Rafraîchit le statut des dons en attente depuis Makuta',
)]
class ReconcileDonationsCommand extends Command
{
    public function __construct(
        private DonationRepository $donationRepository,
        private DonationService $donationService,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('older-than', null, InputOption::VALUE_REQUIRED, 'Âge minimum (minutes) des dons à réconcilier', '2');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $minutes = max(0, (int) $input->getOption('older-than'));

        $pending = $this->donationRepository->findStalePending($minutes);
        if (!$pending) {
            $io->success('Aucun don en attente à réconcilier.');

            return Command::SUCCESS;
        }

        $resolved = 0;
        foreach ($pending as $donation) {
            $before = $donation->getStatus();
            $this->donationService->process($donation);
            if ($donation->getStatus() !== $before) {
                $resolved++;
                $io->writeln(sprintf('  %s : %s → %s', $donation->getReference(), $before, $donation->getStatus()));
            }
        }

        $io->success(sprintf('%d don(s) examiné(s), %d résolu(s).', count($pending), $resolved));

        return Command::SUCCESS;
    }
}
