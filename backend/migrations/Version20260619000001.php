<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Schéma initial de la collecte de dons : donors + donations.
 */
final class Version20260619000001 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Création des tables donors et donations (collecte Grand Tambour)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE donors (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(255) NOT NULL, email VARCHAR(180) NOT NULL, phone VARCHAR(32) DEFAULT NULL, created_at DATETIME NOT NULL, UNIQUE INDEX UNIQ_75B23BACE7927C74 (email), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE donations (id INT AUTO_INCREMENT NOT NULL, donor_id INT NOT NULL, reference VARCHAR(100) NOT NULL, makuta_transaction_id VARCHAR(100) DEFAULT NULL, tier VARCHAR(50) NOT NULL, operator VARCHAR(50) NOT NULL, amount NUMERIC(12, 2) NOT NULL, currency VARCHAR(10) NOT NULL, status VARCHAR(20) NOT NULL, redirect_url LONGTEXT DEFAULT NULL, callback_payload JSON DEFAULT NULL, message VARCHAR(255) DEFAULT NULL, created_at DATETIME NOT NULL, confirmed_at DATETIME DEFAULT NULL, UNIQUE INDEX UNIQ_CDE98962AEA34913 (reference), INDEX IDX_CDE989623DD7B7A7 (donor_id), INDEX idx_donation_makuta_txn (makuta_transaction_id), INDEX idx_donation_status (status), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE donations ADD CONSTRAINT FK_CDE989623DD7B7A7 FOREIGN KEY (donor_id) REFERENCES donors (id) ON DELETE RESTRICT');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE donations DROP FOREIGN KEY FK_CDE989623DD7B7A7');
        $this->addSql('DROP TABLE donations');
        $this->addSql('DROP TABLE donors');
    }
}
