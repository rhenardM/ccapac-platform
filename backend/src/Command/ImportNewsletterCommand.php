<?php

namespace App\Command;

use App\Service\Newsletter\NewsletterImporter;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * Importe des abonnés newsletter depuis un fichier CSV (email + nom).
 *
 *   php bin/console app:newsletter:import abonnes.csv
 */
#[AsCommand(
    name: 'app:newsletter:import',
    description: 'Importe des abonnés newsletter depuis un fichier CSV',
)]
class ImportNewsletterCommand extends Command
{
    public function __construct(private NewsletterImporter $importer)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addArgument('file', InputArgument::REQUIRED, 'Chemin du fichier CSV (colonnes email[, nom])');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $file = (string) $input->getArgument('file');

        if (!is_readable($file)) {
            $io->error("Fichier introuvable ou illisible : {$file}");

            return Command::FAILURE;
        }

        $r = $this->importer->importFile($file, 'cli');

        $io->success(sprintf(
            '%d ajouté(s), %d mis à jour, %d ignoré(s).',
            $r['created'],
            $r['updated'],
            $r['skipped']
        ));

        return Command::SUCCESS;
    }
}
