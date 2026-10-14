<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260806101156 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            CREATE TABLE screening_registrations (
              id INT AUTO_INCREMENT NOT NULL,
              first_name VARCHAR(120) NOT NULL,
              last_name VARCHAR(120) NOT NULL,
              email VARCHAR(180) NOT NULL,
              phone VARCHAR(40) DEFAULT NULL,
              number_of_seats INT DEFAULT NULL,
              message LONGTEXT DEFAULT NULL,
              is_read TINYINT NOT NULL,
              created_at DATETIME NOT NULL,
              screening_id INT NOT NULL,
              INDEX IDX_E54C8E3470F5295D (screening_id),
              INDEX idx_screening_registration_created_at (created_at),
              PRIMARY KEY (id)
            ) DEFAULT CHARACTER SET utf8mb4
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE
              screening_registrations
            ADD
              CONSTRAINT FK_E54C8E3470F5295D FOREIGN KEY (screening_id) REFERENCES screenings (id) ON DELETE CASCADE
        SQL);
        $this->addSql('ALTER TABLE screenings ADD is_free TINYINT NOT NULL DEFAULT 1');
        // Séances déjà tarifées : conservent leur statut payant après la migration.
        $this->addSql('UPDATE screenings SET is_free = 0 WHERE price IS NOT NULL AND price > 0');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE screening_registrations DROP FOREIGN KEY FK_E54C8E3470F5295D');
        $this->addSql('DROP TABLE screening_registrations');
        $this->addSql('ALTER TABLE screenings DROP is_free');
    }
}
