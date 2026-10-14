<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260709233838 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Crée les tables program_categories et programs (Action culturelle)';
    }

    public function up(Schema $schema): void
    {
        // Ne crée QUE les tables programmes. (Le diff avait aussi proposé de
        // supprimer les tables brutes Strapi actualite/event/media et de toucher
        // events.featured : écarté car non lié et risqué en prod.)
        $this->addSql('CREATE TABLE program_categories (id INT AUTO_INCREMENT NOT NULL, slug VARCHAR(255) NOT NULL, title VARCHAR(255) NOT NULL, description LONGTEXT DEFAULT NULL, cover_image VARCHAR(255) DEFAULT NULL, color_gradient VARCHAR(100) DEFAULT NULL, position INT NOT NULL, status VARCHAR(20) NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, UNIQUE INDEX UNIQ_2CC9BBDC989D9B62 (slug), INDEX idx_program_category_status (status), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE programs (id INT AUTO_INCREMENT NOT NULL, slug VARCHAR(255) NOT NULL, title VARCHAR(255) NOT NULL, slogan VARCHAR(255) DEFAULT NULL, description LONGTEXT DEFAULT NULL, objectif LONGTEXT DEFAULT NULL, public_vise VARCHAR(255) DEFAULT NULL, impact LONGTEXT DEFAULT NULL, cover_image VARCHAR(255) DEFAULT NULL, discipline VARCHAR(100) DEFAULT NULL, period VARCHAR(255) DEFAULT NULL, location VARCHAR(255) DEFAULT NULL, starts_at DATETIME DEFAULT NULL, ends_at DATETIME DEFAULT NULL, featured TINYINT NOT NULL, position INT NOT NULL, status VARCHAR(20) NOT NULL, published_at DATETIME DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, category_id INT NOT NULL, UNIQUE INDEX UNIQ_F1496545989D9B62 (slug), INDEX IDX_F149654512469DE2 (category_id), INDEX idx_program_status (status), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE programs ADD CONSTRAINT FK_F149654512469DE2 FOREIGN KEY (category_id) REFERENCES program_categories (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE programs DROP FOREIGN KEY FK_F149654512469DE2');
        $this->addSql('DROP TABLE programs');
        $this->addSql('DROP TABLE program_categories');
    }
}
