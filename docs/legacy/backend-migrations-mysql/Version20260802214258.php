<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260802214258 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Convertit les heures de projection (start_time/end_time) en vrai type TIME';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE screenings CHANGE start_time start_time TIME NOT NULL, CHANGE end_time end_time TIME DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE screenings CHANGE start_time start_time VARCHAR(5) NOT NULL, CHANGE end_time end_time VARCHAR(5) DEFAULT NULL');
    }
}
