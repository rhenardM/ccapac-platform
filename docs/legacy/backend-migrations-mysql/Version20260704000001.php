<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * API admin : table api_tokens (jetons Bearer opaques, hash uniquement).
 */
final class Version20260704000001 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Création de la table api_tokens (authentification de l\'API admin)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE api_tokens (id INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, token_hash VARCHAR(64) NOT NULL, label VARCHAR(100) DEFAULT NULL, created_at DATETIME NOT NULL, last_used_at DATETIME DEFAULT NULL, expires_at DATETIME DEFAULT NULL, UNIQUE INDEX UNIQ_2CAD560EB3BC57DA (token_hash), INDEX IDX_2CAD560EA76ED395 (user_id), INDEX idx_token_hash (token_hash), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE api_tokens ADD CONSTRAINT FK_2CAD560EA76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE api_tokens DROP FOREIGN KEY FK_2CAD560EA76ED395');
        $this->addSql('DROP TABLE api_tokens');
    }
}
