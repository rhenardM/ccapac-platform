<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260926110048 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            CREATE TABLE event_registrations (
              id INT AUTO_INCREMENT NOT NULL,
              first_name VARCHAR(120) NOT NULL,
              last_name VARCHAR(120) NOT NULL,
              email VARCHAR(180) NOT NULL,
              phone VARCHAR(40) DEFAULT NULL,
              message LONGTEXT DEFAULT NULL,
              is_read TINYINT NOT NULL,
              created_at DATETIME NOT NULL,
              event_id INT NOT NULL,
              INDEX IDX_7787E14B71F7E88B (event_id),
              INDEX idx_event_registration_created_at (created_at),
              PRIMARY KEY (id)
            ) DEFAULT CHARACTER SET utf8mb4
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE
              event_registrations
            ADD
              CONSTRAINT FK_7787E14B71F7E88B FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
        SQL);
        $this->addSql('ALTER TABLE events ADD is_registration_open TINYINT(1) NOT NULL DEFAULT 0');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE event_registrations DROP FOREIGN KEY FK_7787E14B71F7E88B');
        $this->addSql('DROP TABLE event_registrations');
        $this->addSql('ALTER TABLE events DROP is_registration_open');
    }
}
