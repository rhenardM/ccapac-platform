<?php

namespace App\Command;

use App\Entity\MediaAsset;
use App\Repository\MediaAssetRepository;
use App\Service\Audit\AuditLogger;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * Repère les médias dont le fichier a disparu de public/uploads/media : ils
 * s'affichent en image cassée (404) sur le site. Simulation par défaut, la
 * suppression exige --force.
 *
 *   php bin/console app:media:prune-orphans            # liste seulement
 *   php bin/console app:media:prune-orphans --force    # supprime les lignes
 */
#[AsCommand(
    name: 'app:media:prune-orphans',
    description: 'Liste (et supprime avec --force) les médias sans fichier sur le disque',
)]
class PruneOrphanMediaCommand extends Command
{
    public function __construct(
        private MediaAssetRepository $mediaAssetRepository,
        private EntityManagerInterface $entityManager,
        private AuditLogger $auditLogger,
        #[Autowire('%kernel.project_dir%/public/uploads/media')]
        private string $mediaDir,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('force', null, InputOption::VALUE_NONE, 'Supprime réellement les lignes (sinon simulation)');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $force = (bool) $input->getOption('force');

        $orphans = [];
        foreach ($this->mediaAssetRepository->findBy([], ['id' => 'ASC']) as $media) {
            $filename = $media->getFilename();
            // Une ligne sans nom de fichier est tout aussi inexploitable qu'une
            // ligne dont le fichier a disparu : les deux cassent l'affichage.
            if (!$filename || !is_file($this->mediaDir . '/' . $filename)) {
                $orphans[] = $media;
            }
        }

        if ($orphans === []) {
            $io->success('Aucun média orphelin : tous les fichiers sont présents.');

            return Command::SUCCESS;
        }

        $io->section(sprintf('%d média(s) sans fichier sur le disque', count($orphans)));
        $io->table(
            ['ID', 'Nom', 'Fichier attendu', 'Taille en base'],
            array_map(static fn (MediaAsset $m) => [
                $m->getId(),
                $m->getName(),
                $m->getFilename() ?? '(aucun)',
                $m->getSize() ? sprintf('%.1f Mo', $m->getSize() / 1048576) : '—',
            ], $orphans)
        );

        if (!$force) {
            $io->warning('SIMULATION — rien n\'a été supprimé. Relancez avec --force pour supprimer ces lignes.');

            return Command::SUCCESS;
        }

        $removed = array_map(static fn (MediaAsset $m) => [
            'id' => $m->getId(),
            'name' => $m->getName(),
            'filename' => $m->getFilename(),
        ], $orphans);

        foreach ($orphans as $media) {
            $this->entityManager->remove($media);
        }
        $this->entityManager->flush();

        $this->auditLogger->log(
            'media.prune_orphans',
            sprintf('Suppression de %d média(s) sans fichier', count($removed)),
            'MediaAsset',
            null,
            ['removed' => $removed],
        );

        $io->success(sprintf('%d ligne(s) supprimée(s).', count($removed)));

        return Command::SUCCESS;
    }
}
