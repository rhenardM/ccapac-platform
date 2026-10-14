<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Catégories de la bibliothèque média + date d'événement sur les médias.
 * Permet le filtrage de la médiathèque publique (catégorie, année, mois).
 */
final class Version20260809120000 extends AbstractMigration
{
    /** Catégories de départ, alignées sur les filtres historiques du site. */
    private const DEFAULT_CATEGORIES = [
        ['concert', 'Concert'],
        ['danse', 'Danse'],
        ['theatre', 'Théâtre'],
        ['exposition', 'Exposition'],
        ['atelier', 'Atelier'],
        ['litterature', 'Littérature'],
        ['cinema', 'Cinéma'],
        ['festival', 'Festival'],
        ['conference', 'Conférence'],
        ['autre', 'Autre'],
    ];

    public function getDescription(): string
    {
        return 'Ajoute les catégories média et la date d\'événement sur media_assets.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            CREATE TABLE media_categories (
              id INT AUTO_INCREMENT NOT NULL,
              slug VARCHAR(255) NOT NULL,
              name VARCHAR(255) NOT NULL,
              position INT NOT NULL,
              created_at DATETIME NOT NULL,
              updated_at DATETIME NOT NULL,
              UNIQUE INDEX uniq_media_category_slug (slug),
              PRIMARY KEY (id)
            ) DEFAULT CHARACTER SET utf8mb4
        SQL);

        $this->addSql(<<<'SQL'
            ALTER TABLE media_assets
              ADD category_id INT DEFAULT NULL,
              ADD event_date DATE DEFAULT NULL
        SQL);

        $this->addSql(<<<'SQL'
            ALTER TABLE media_assets
              ADD CONSTRAINT fk_media_assets_category
              FOREIGN KEY (category_id) REFERENCES media_categories (id) ON DELETE SET NULL
        SQL);

        $this->addSql('CREATE INDEX idx_media_category ON media_assets (category_id)');
        $this->addSql('CREATE INDEX idx_media_event_date ON media_assets (event_date)');

        // Catégories de départ : la médiathèque est utilisable immédiatement,
        // l'équipe peut ensuite les renommer/compléter depuis le back-office.
        foreach (self::DEFAULT_CATEGORIES as $i => [$slug, $name]) {
            $this->addSql(
                'INSERT INTO media_categories (slug, name, position, created_at, updated_at) '
                . 'VALUES (:slug, :name, :position, NOW(), NOW())',
                ['slug' => $slug, 'name' => $name, 'position' => $i + 1]
            );
        }
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE media_assets DROP FOREIGN KEY fk_media_assets_category');
        $this->addSql('DROP INDEX idx_media_category ON media_assets');
        $this->addSql('DROP INDEX idx_media_event_date ON media_assets');
        $this->addSql('ALTER TABLE media_assets DROP category_id, DROP event_date');
        $this->addSql('DROP TABLE media_categories');
    }
}
