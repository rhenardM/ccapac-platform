<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Back-office : tables users (administrateurs) et audit_logs (journalisation).
 */
final class Version20260703000001 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Création des tables users et audit_logs (administration)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE users (id INT AUTO_INCREMENT NOT NULL, email VARCHAR(180) NOT NULL, name VARCHAR(100) NOT NULL, roles JSON NOT NULL, password VARCHAR(255) NOT NULL, is_active TINYINT NOT NULL, created_by VARCHAR(180) DEFAULT NULL, created_at DATETIME NOT NULL, last_login_at DATETIME DEFAULT NULL, UNIQUE INDEX uniq_user_email (email), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE audit_logs (id INT AUTO_INCREMENT NOT NULL, action VARCHAR(80) NOT NULL, performed_by VARCHAR(180) DEFAULT NULL, entity_type VARCHAR(80) DEFAULT NULL, entity_id VARCHAR(100) DEFAULT NULL, summary VARCHAR(255) DEFAULT NULL, details JSON DEFAULT NULL, ip VARCHAR(45) DEFAULT NULL, created_at DATETIME NOT NULL, INDEX idx_audit_action (action), INDEX idx_audit_created_at (created_at), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE audit_logs');
        $this->addSql('DROP TABLE users');
    }
}
