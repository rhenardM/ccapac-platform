<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260823091040 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // Toutes les inscriptions déjà en base viennent du site public : défaut 'online'.
        $this->addSql(<<<'SQL'
            ALTER TABLE
              screening_registrations
            ADD
              source VARCHAR(20) NOT NULL DEFAULT 'online',
            CHANGE
              email email VARCHAR(180) DEFAULT NULL
        SQL);
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE screening_registrations DROP source, CHANGE email email VARCHAR(180) NOT NULL');
    }
}
