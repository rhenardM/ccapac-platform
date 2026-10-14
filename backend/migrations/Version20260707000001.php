<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Module contenu éditorial : actualités, événements, bibliothèque média,
 * abonnés newsletter.
 */
final class Version20260707000001 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Création des tables actualites, events, media_assets, newsletter_subscribers';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE actualites (id INT AUTO_INCREMENT NOT NULL, slug VARCHAR(255) NOT NULL, title VARCHAR(255) NOT NULL, type VARCHAR(20) NOT NULL, summary LONGTEXT DEFAULT NULL, content LONGTEXT DEFAULT NULL, cover_image VARCHAR(255) DEFAULT NULL, pdf VARCHAR(255) DEFAULT NULL, mois VARCHAR(20) DEFAULT NULL, annee INT DEFAULT NULL, is_featured TINYINT NOT NULL, status VARCHAR(20) NOT NULL, published_at DATETIME DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, UNIQUE INDEX UNIQ_75315B6D989D9B62 (slug), INDEX idx_actualite_status (status), INDEX idx_actualite_published_at (published_at), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE events (id INT AUTO_INCREMENT NOT NULL, slug VARCHAR(255) NOT NULL, title VARCHAR(255) NOT NULL, description LONGTEXT DEFAULT NULL, cover_image VARCHAR(255) DEFAULT NULL, location VARCHAR(255) DEFAULT NULL, starts_at DATETIME DEFAULT NULL, ends_at DATETIME DEFAULT NULL, status VARCHAR(20) NOT NULL, published_at DATETIME DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, UNIQUE INDEX UNIQ_5387574A989D9B62 (slug), INDEX idx_event_status (status), INDEX idx_event_starts_at (starts_at), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE media_assets (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(255) NOT NULL, filename VARCHAR(255) DEFAULT NULL, alt VARCHAR(255) DEFAULT NULL, caption LONGTEXT DEFAULT NULL, mime VARCHAR(100) DEFAULT NULL, size INT DEFAULT NULL, created_at DATETIME NOT NULL, INDEX idx_media_created_at (created_at), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE newsletter_subscribers (id INT AUTO_INCREMENT NOT NULL, email VARCHAR(180) NOT NULL, name VARCHAR(120) DEFAULT NULL, is_active TINYINT NOT NULL, source VARCHAR(50) DEFAULT NULL, created_at DATETIME NOT NULL, unsubscribed_at DATETIME DEFAULT NULL, UNIQUE INDEX uniq_subscriber_email (email), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE actualites');
        $this->addSql('DROP TABLE events');
        $this->addSql('DROP TABLE media_assets');
        $this->addSql('DROP TABLE newsletter_subscribers');
    }
}
