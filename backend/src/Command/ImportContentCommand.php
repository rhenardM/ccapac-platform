<?php

namespace App\Command;

use App\Entity\Actualite;
use App\Entity\Event;
use App\Entity\MediaAsset;
use App\Enum\ActualiteType;
use App\Enum\ContentStatus;
use App\Repository\ActualiteRepository;
use App\Repository\EventRepository;
use App\Repository\MediaAssetRepository;
use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\String\Slugger\SluggerInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

/**
 * Importe les anciennes données Strapi (tables brutes `actualite` et `media`,
 * importées au préalable dans la même base) vers les tables du module contenu,
 * en téléchargeant les fichiers (images/PDF) depuis Strapi Cloud vers uploads/media.
 *
 *   php bin/console app:content:import                 # actualités + média
 *   php bin/console app:content:import --dry-run       # simulation (rien écrit)
 *   php bin/console app:content:import --skip-download  # métadonnées seulement
 */
#[AsCommand(
    name: 'app:content:import',
    description: 'Importe les actualités et médias depuis les tables Strapi (actualite, media)',
)]
class ImportContentCommand extends Command
{
    public function __construct(
        private Connection $connection,
        private EntityManagerInterface $entityManager,
        private ActualiteRepository $actualiteRepository,
        private EventRepository $eventRepository,
        private MediaAssetRepository $mediaAssetRepository,
        private HttpClientInterface $httpClient,
        private SluggerInterface $slugger,
        #[Autowire('%kernel.project_dir%/public/uploads/media')] private string $mediaDir,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('dry-run', null, InputOption::VALUE_NONE, 'Simule sans rien écrire')
            ->addOption('skip-download', null, InputOption::VALUE_NONE, 'N\'écrit pas les fichiers (métadonnées seulement)');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $dryRun = (bool) $input->getOption('dry-run');
        $skipDownload = (bool) $input->getOption('skip-download');

        if (!$dryRun && !$skipDownload && !is_dir($this->mediaDir) && !@mkdir($this->mediaDir, 0775, true)) {
            $io->error("Dossier d'upload introuvable/non créable : {$this->mediaDir}");

            return Command::FAILURE;
        }

        $io->title($dryRun ? 'Import contenu Strapi (SIMULATION)' : 'Import contenu Strapi');

        $mediaCount = $this->importMedia($io, $dryRun, $skipDownload);
        $actuCount = $this->importActualites($io, $dryRun, $skipDownload);
        $eventCount = $this->importEvents($io, $dryRun, $skipDownload);

        if (!$dryRun) {
            $this->entityManager->flush();
        }

        $io->success(sprintf('%d média(s), %d actualité(s) et %d événement(s) importés.', $mediaCount, $actuCount, $eventCount));
        $io->note('Tu peux ensuite supprimer les tables brutes : DROP TABLE actualite, media;');

        return Command::SUCCESS;
    }

    private function importMedia(SymfonyStyle $io, bool $dryRun, bool $skipDownload): int
    {
        $rows = $this->safeFetchAll('media');
        if ($rows === null) {
            $io->warning('Table `media` absente — étape média ignorée.');

            return 0;
        }

        $count = 0;
        /** @var string[] $failed */
        $failed = [];

        foreach ($rows as $r) {
            $filename = $this->safeFilename((string) ($r['hash'] ?? ''), (string) ($r['ext'] ?? ''));
            $url = (string) ($r['url'] ?? '');
            if (!$filename || !$url) {
                continue;
            }
            if ($this->mediaAssetRepository->findOneBy(['filename' => $filename])) {
                continue; // idempotent
            }

            // Sans fichier écrit, créer la ligne produirait une image cassée sur
            // le site — et l'idempotence ci-dessus empêcherait toute réparation
            // par une nouvelle exécution. On saute donc l'entrée entièrement.
            if (!$dryRun && !$skipDownload && !$this->download($url, $filename, $io)) {
                $failed[] = $filename;
                continue;
            }

            if (!$dryRun) {
                $asset = (new MediaAsset())
                    ->setName((string) ($r['name'] ?? $filename))
                    ->setFilename($filename)
                    ->setAlt($r['alternative_text'] ?? null)
                    ->setCaption($r['caption'] ?? null)
                    ->setMime($r['mime'] ?? null)
                    ->setSize(isset($r['size']) ? (int) round((float) $r['size'] * 1024) : null);
                $this->entityManager->persist($asset);
            }
            $count++;
        }

        if ($failed !== []) {
            $io->warning(sprintf(
                "%d fichier(s) non téléchargés — aucune ligne créée pour eux.\n"
                . "Relancez la commande pour retenter : \n  - %s",
                count($failed),
                implode("\n  - ", $failed)
            ));
        }

        return $count;
    }

    private function importActualites(SymfonyStyle $io, bool $dryRun, bool $skipDownload): int
    {
        $rows = $this->safeFetchAll('actualite');
        if ($rows === null) {
            $io->warning('Table `actualite` absente — étape actualités ignorée.');

            return 0;
        }

        $count = 0;
        foreach ($rows as $r) {
            $title = trim((string) ($r['title'] ?? ''));
            $slug = trim((string) ($r['slug'] ?? '')) ?: strtolower($this->slugger->slug($title ?: 'actualite')->toString());
            if (!$slug) {
                continue;
            }
            if ($this->actualiteRepository->findOneBy(['slug' => $slug])) {
                continue; // idempotent
            }

            $cover = $this->fileFromJson($r['coverImage'] ?? null, $dryRun, $skipDownload, $io);
            $pdf = $this->fileFromJson($r['pdf'] ?? null, $dryRun, $skipDownload, $io);

            if (!$dryRun) {
                $type = ActualiteType::tryFrom((string) ($r['type'] ?? '')) ?? ActualiteType::ARTICLE;
                $a = (new Actualite())
                    ->setSlug($slug)
                    ->setTitle($title ?: $slug)
                    ->setType($type)
                    ->setSummary($r['summary'] ?? null)
                    ->setMois($r['mois'] ?? null)
                    ->setAnnee(isset($r['annee']) ? (int) $r['annee'] : null)
                    ->setIsFeatured((bool) ($r['isFeatured'] ?? 0))
                    ->setCoverImage($cover)
                    ->setPdf($pdf)
                    ->setStatus(ContentStatus::PUBLISHED);

                $when = $this->parseDate($r['createdAt'] ?? null);
                if ($when) {
                    $a->setPublishedAt($when);
                }
                $this->entityManager->persist($a);
            }
            $count++;
        }

        return $count;
    }

    private function importEvents(SymfonyStyle $io, bool $dryRun, bool $skipDownload): int
    {
        $rows = $this->safeFetchAll('event');
        if ($rows === null) {
            $io->warning('Table `event` absente — étape événements ignorée.');

            return 0;
        }

        $count = 0;
        foreach ($rows as $r) {
            $title = trim((string) ($r['title'] ?? ''));
            $slug = trim((string) ($r['slug'] ?? '')) ?: strtolower($this->slugger->slug($title ?: 'evenement')->toString());
            if (!$slug) {
                continue;
            }
            if ($this->eventRepository->findOneBy(['slug' => $slug])) {
                continue; // idempotent
            }

            $cover = $this->fileFromJson($r['image'] ?? null, $dryRun, $skipDownload, $io);

            if (!$dryRun) {
                $e = (new Event())
                    ->setSlug($slug)
                    ->setTitle($title ?: $slug)
                    ->setDescription($r['description'] ?? null)
                    ->setLocation($r['location'] ?? null)
                    ->setCategory($r['discipline'] ?? $r['category'] ?? null)
                    ->setOrganizer($r['organizer'] ?? null)
                    ->setStartTime($r['startTime'] ?? null)
                    ->setEndTime($r['endTime'] ?? null)
                    ->setFeatured((bool) ($r['featured'] ?? 0))
                    ->setStartsAt($this->parseDate($r['startDate'] ?? null))
                    ->setEndsAt($this->parseDate($r['endDate'] ?? null))
                    ->setCoverImage($cover)
                    ->setStatus(ContentStatus::PUBLISHED);

                $when = $this->parseDate($r['createdAt'] ?? null);
                if ($when) {
                    $e->setPublishedAt($when);
                }
                $this->entityManager->persist($e);
            }
            $count++;
        }

        return $count;
    }

    /** Extrait l'url+hash+ext d'un champ JSON Strapi, télécharge, renvoie le filename local. */
    private function fileFromJson(mixed $json, bool $dryRun, bool $skipDownload, SymfonyStyle $io): ?string
    {
        if (!$json) {
            return null;
        }
        $data = is_array($json) ? $json : json_decode((string) $json, true);
        if (!is_array($data) || empty($data['url'])) {
            return null;
        }

        $filename = $this->safeFilename((string) ($data['hash'] ?? ''), (string) ($data['ext'] ?? ''));
        if (!$filename) {
            return null;
        }

        if (!$dryRun && !$skipDownload && !is_file($this->mediaDir . '/' . $filename)) {
            // Mieux vaut un contenu sans visuel qu'un contenu dont l'image est
            // cassée : on n'attache le fichier que s'il est réellement là.
            if (!$this->download((string) $data['url'], $filename, $io)) {
                return null;
            }
        }

        return $filename;
    }

    /**
     * Télécharge un fichier depuis Strapi Cloud vers uploads/media.
     *
     * @return bool true UNIQUEMENT si le fichier est bien présent sur le disque
     *              à la sortie. L'appelant doit renoncer à créer la ligne en
     *              base quand c'est false, sinon le site affiche une image
     *              cassée pointant vers un fichier inexistant.
     */
    private function download(string $url, string $filename, SymfonyStyle $io): bool
    {
        $path = $this->mediaDir . '/' . $filename;

        try {
            // Délai généreux : les visuels dépassent souvent plusieurs Mo et le
            // défaut (30 s) s'est révélé trop court sur les plus gros fichiers.
            $content = $this->httpClient->request('GET', $url, ['timeout' => 120])->getContent();
        } catch (\Throwable $e) {
            $io->warning(sprintf('Téléchargement échoué (%s) : %s', $filename, $e->getMessage()));

            return false;
        }

        if (@file_put_contents($path, $content) === false) {
            $io->warning(sprintf('Écriture impossible (%s) dans %s', $filename, $this->mediaDir));
            // Pas de fichier tronqué laissé derrière : il passerait pour valide.
            @unlink($path);

            return false;
        }

        return true;
    }

    private function safeFilename(string $hash, string $ext): ?string
    {
        $hash = preg_replace('/[^A-Za-z0-9._-]/', '', $hash);
        $ext = ltrim(preg_replace('/[^A-Za-z0-9.]/', '', $ext), '.');
        if (!$hash) {
            return null;
        }

        return $ext ? "{$hash}.{$ext}" : $hash;
    }

    private function parseDate(?string $value): ?\DateTimeImmutable
    {
        if (!$value) {
            return null;
        }
        try {
            return new \DateTimeImmutable($value);
        } catch (\Throwable) {
            return null;
        }
    }

    /** @return array<int,array<string,mixed>>|null null si la table n'existe pas */
    private function safeFetchAll(string $table): ?array
    {
        try {
            return $this->connection->fetchAllAssociative('SELECT * FROM ' . $table);
        } catch (\Throwable) {
            return null;
        }
    }
}
