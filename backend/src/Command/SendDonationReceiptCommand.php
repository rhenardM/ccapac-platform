<?php

namespace App\Command;

use App\Entity\Donation;
use App\Repository\DonationRepository;
use App\Service\Notification\ReceiptMailer;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * (Re)envoie le reçu d'un don déjà PAYÉ — utile quand l'envoi initial a échoué
 * (ex. SMTP mal configuré au moment de la confirmation).
 *
 *   php bin/console app:donations:send-receipt GT-DON-2026-334LTU
 *   php bin/console app:donations:send-receipt --all-paid   (tous les payés)
 */
#[AsCommand(
    name: 'app:donations:send-receipt',
    description: 'Renvoie le reçu par e-mail d\'un don payé',
)]
class SendDonationReceiptCommand extends Command
{
    public function __construct(
        private DonationRepository $donationRepository,
        private ReceiptMailer $receiptMailer,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addArgument('reference', InputArgument::OPTIONAL, 'Référence du don (ex. GT-DON-2026-334LTU)')
            ->addOption('all-paid', null, InputOption::VALUE_NONE, 'Renvoie le reçu de TOUS les dons payés')
            ->addOption('to', null, InputOption::VALUE_REQUIRED, 'Envoyer à cette adresse (aperçu/test) au lieu du destinataire')
            ->addOption('honor', null, InputOption::VALUE_NONE, 'Envoyer la NOTIFICATION au bénéficiaire (don en son honneur) au lieu du reçu');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $reference = $input->getArgument('reference');
        $allPaid = (bool) $input->getOption('all-paid');
        $overrideTo = $input->getOption('to') ?: null;
        $honor = (bool) $input->getOption('honor');

        if (!$reference && !$allPaid) {
            $io->error('Fournis une référence, ou --all-paid.');

            return Command::INVALID;
        }

        if ($allPaid) {
            $donations = $this->donationRepository->findBy(['status' => Donation::STATUS_PAID]);
        } else {
            $donation = $this->donationRepository->findByReference((string) $reference);
            if (!$donation) {
                $io->error(sprintf('Don introuvable : %s', $reference));

                return Command::FAILURE;
            }
            $donations = [$donation];
        }

        $sent = 0;
        foreach ($donations as $donation) {
            if ($donation->getStatus() !== Donation::STATUS_PAID) {
                $io->warning(sprintf('%s ignoré (statut : %s)', $donation->getReference(), $donation->getStatus()));
                continue;
            }
            // Envoi best-effort : ReceiptMailer journalise succès/échec (il
            // n'interrompt jamais). Valider le SMTP au préalable via `mailer:test`.
            if ($honor) {
                $target = $overrideTo ?? $donation->getBeneficiaryEmail();
                if (!$target) {
                    $io->warning(sprintf('%s : aucun bénéficiaire (utilise --to=…).', $donation->getReference()));
                    continue;
                }
                $this->receiptMailer->sendBeneficiaryNotification($donation, $overrideTo);
                $io->writeln(sprintf('  Notification bénéficiaire : %s → %s', $donation->getReference(), $target));
            } else {
                $this->receiptMailer->sendDonationReceipt($donation, $overrideTo);
                $io->writeln(sprintf(
                    '  Reçu envoyé : %s → %s',
                    $donation->getReference(),
                    $overrideTo ?? $donation->getDonor()->getEmail()
                ));
            }
            $sent++;
        }

        $io->success(sprintf('%d reçu(s) traité(s).', $sent));

        return Command::SUCCESS;
    }
}
