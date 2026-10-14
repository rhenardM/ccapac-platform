<?php

namespace App\Service\Newsletter;

use App\Entity\NewsletterSubscriber;
use App\Repository\NewsletterSubscriberRepository;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Importe des abonnés depuis un fichier CSV (email + nom), en upsert par e-mail.
 * Séparateur détecté automatiquement (; ou ,), en-tête optionnel.
 */
class NewsletterImporter
{
    private const EMAIL_HEADERS = ['email', 'e-mail', 'mail', 'courriel'];
    private const NAME_HEADERS = ['nom', 'name', 'prénom', 'prenom', 'fullname'];

    public function __construct(
        private NewsletterSubscriberRepository $subscriberRepository,
        private EntityManagerInterface $entityManager,
    ) {}

    /**
     * @return array{created:int, updated:int, skipped:int}
     */
    public function importFile(string $path, string $source = 'import'): array
    {
        $created = $updated = $skipped = 0;
        $handle = fopen($path, 'rb');
        if ($handle === false) {
            return ['created' => 0, 'updated' => 0, 'skipped' => 0];
        }

        $firstLine = (string) fgets($handle);
        rewind($handle);
        $delimiter = substr_count($firstLine, ';') >= substr_count($firstLine, ',') ? ';' : ',';

        $header = fgetcsv($handle, 0, $delimiter);
        [$emailIdx, $nameIdx] = $this->resolveColumns($header);

        // En-tête non reconnu → on suppose colonne 0 = email, 1 = nom, et on
        // retraite cette première ligne comme une donnée.
        if ($emailIdx === null) {
            $emailIdx = 0;
            $nameIdx = 1;
            if (is_array($header)) {
                $this->upsert($header, $emailIdx, $nameIdx, $source, $created, $updated, $skipped);
            }
        }

        while (($row = fgetcsv($handle, 0, $delimiter)) !== false) {
            $this->upsert($row, $emailIdx, $nameIdx, $source, $created, $updated, $skipped);
        }
        fclose($handle);

        $this->entityManager->flush();

        return ['created' => $created, 'updated' => $updated, 'skipped' => $skipped];
    }

    /**
     * @param array<int,string>|false $header
     * @return array{0:?int,1:?int}
     */
    private function resolveColumns($header): array
    {
        if ($header === false) {
            return [null, null];
        }
        $emailIdx = $nameIdx = null;
        foreach ($header as $i => $col) {
            $c = strtolower(trim((string) $col));
            if (in_array($c, self::EMAIL_HEADERS, true)) {
                $emailIdx = $i;
            } elseif (in_array($c, self::NAME_HEADERS, true)) {
                $nameIdx = $i;
            }
        }

        return [$emailIdx, $nameIdx];
    }

    /**
     * @param array<int,string> $row
     */
    private function upsert(array $row, int $emailIdx, ?int $nameIdx, string $source, int &$created, int &$updated, int &$skipped): void
    {
        $email = strtolower(trim((string) ($row[$emailIdx] ?? '')));
        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $skipped++;

            return;
        }
        $name = $nameIdx !== null ? trim((string) ($row[$nameIdx] ?? '')) : null;

        $subscriber = $this->subscriberRepository->findOneByEmail($email);
        if ($subscriber) {
            if ($name) {
                $subscriber->setName($name);
            }
            $updated++;

            return;
        }

        $subscriber = (new NewsletterSubscriber())->setEmail($email)->setSource($source);
        if ($name) {
            $subscriber->setName($name);
        }
        $this->entityManager->persist($subscriber);
        $created++;
    }
}
