<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Enrichit la table events : catégorie, organisateur, horaires (texte), à la une.
 */
final class Version20260707000002 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajout des colonnes category, organizer, start_time, end_time, featured à events';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE events ADD category VARCHAR(100) DEFAULT NULL, ADD organizer VARCHAR(255) DEFAULT NULL, ADD start_time VARCHAR(20) DEFAULT NULL, ADD end_time VARCHAR(20) DEFAULT NULL, ADD featured TINYINT NOT NULL DEFAULT 0');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE events DROP category, DROP organizer, DROP start_time, DROP end_time, DROP featured');
    }
}
