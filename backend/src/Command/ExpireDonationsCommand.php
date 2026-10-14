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
 * Marque comme expirés les dons restés en attente trop longtemps.
 * À planifier en cron (ex: toutes les 10 minutes).
 *
 *   php bin/console app:donations:expire [--older-than=30]
 */
#[AsCommand(
    name: 'app:donations:expire',
    description: 'Expire les dons en attente trop anciens',
)]
class ExpireDonationsCommand extends Command
{
    public function __construct(
        private DonationRepository $donationRepository,
        private DonationService $donationService,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('older-than', null, InputOption::VALUE_REQUIRED, 'Âge (minutes) au-delà duquel un don en attente expire', '30');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $minutes = max(1, (int) $input->getOption('older-than'));

        $stale = $this->donationRepository->findStalePending($minutes);
        if (!$stale) {
            $io->success('Aucun don à expirer.');

            return Command::SUCCESS;
        }

        foreach ($stale as $donation) {
            $this->donationService->expire($donation);
            $io->writeln(sprintf('  %s expiré.', $donation->getReference()));
        }

        $io->success(sprintf('%d don(s) expiré(s).', count($stale)));

        return Command::SUCCESS;
    }
}
