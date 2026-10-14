<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260823020251 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            CREATE TABLE tickets (
              id INT AUTO_INCREMENT NOT NULL,
              ticket_number VARCHAR(30) NOT NULL,
              sequence_year INT NOT NULL,
              sequence_number INT NOT NULL,
              validation_token_hash VARCHAR(64) NOT NULL,
              qr_code_path VARCHAR(255) DEFAULT NULL,
              pdf_path VARCHAR(255) DEFAULT NULL,
              status VARCHAR(20) NOT NULL,
              generated_at DATETIME NOT NULL,
              used_at DATETIME DEFAULT NULL,
              created_at DATETIME NOT NULL,
              updated_at DATETIME NOT NULL,
              registration_id INT NOT NULL,
              screening_id INT NOT NULL,
              UNIQUE INDEX UNIQ_54469DF4ECD2759F (ticket_number),
              UNIQUE INDEX UNIQ_54469DF42BE52E77 (validation_token_hash),
              UNIQUE INDEX UNIQ_54469DF4833D8F43 (registration_id),
              INDEX idx_ticket_screening (screening_id),
              INDEX idx_ticket_status (status),
              INDEX idx_ticket_year_seq (sequence_year, sequence_number),
              PRIMARY KEY (id)
            ) DEFAULT CHARACTER SET utf8mb4
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE
              tickets
            ADD
              CONSTRAINT FK_54469DF4833D8F43 FOREIGN KEY (registration_id) REFERENCES screening_registrations (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE
              tickets
            ADD
              CONSTRAINT FK_54469DF470F5295D FOREIGN KEY (screening_id) REFERENCES screenings (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE
              screening_registrations
            ADD
              gender VARCHAR(20) DEFAULT NULL,
            ADD
              age_range VARCHAR(20) DEFAULT NULL,
            ADD
              ticket_generated TINYINT NOT NULL
        SQL);
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE tickets DROP FOREIGN KEY FK_54469DF4833D8F43');
        $this->addSql('ALTER TABLE tickets DROP FOREIGN KEY FK_54469DF470F5295D');
        $this->addSql('DROP TABLE tickets');
        $this->addSql('ALTER TABLE screening_registrations DROP gender, DROP age_range, DROP ticket_generated');
    }
}
