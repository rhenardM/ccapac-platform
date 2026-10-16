<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Médias ajoutés via l'admin sans type MIME (bug corrigé dans
 * MediaAssetCrudController) : invisibles dans la médiathèque publique, qui ne
 * liste que `image/*`. Le type est déduit de l'extension du fichier.
 */
final class Version20261016090000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Renseigne le type MIME manquant des médias d\'après l\'extension du fichier';
    }

    public function up(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            UPDATE media_assets SET mime = CASE
                WHEN LOWER(filename) LIKE '%.jpg' OR LOWER(filename) LIKE '%.jpeg' THEN 'image/jpeg'
                WHEN LOWER(filename) LIKE '%.png' THEN 'image/png'
                WHEN LOWER(filename) LIKE '%.webp' THEN 'image/webp'
                WHEN LOWER(filename) LIKE '%.gif' THEN 'image/gif'
                WHEN LOWER(filename) LIKE '%.pdf' THEN 'application/pdf'
            END
            WHERE mime IS NULL
            SQL);
    }

    public function down(Schema $schema): void
    {
        // Donnée corrigée : pas de retour arrière pertinent.
    }
}
