<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260802195344 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajoute le module Cinémathèque (films, catégories, galerie, projections, vues, réglages)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE cinematheque_settings (id INT NOT NULL, booking_url VARCHAR(500) DEFAULT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE film_categories (id INT AUTO_INCREMENT NOT NULL, slug VARCHAR(255) NOT NULL, name VARCHAR(255) NOT NULL, position INT NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, UNIQUE INDEX UNIQ_8517EB20989D9B62 (slug), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE film_gallery_images (id INT AUTO_INCREMENT NOT NULL, image VARCHAR(255) NOT NULL, caption VARCHAR(255) DEFAULT NULL, position INT NOT NULL, film_id INT NOT NULL, INDEX IDX_AC5074DC567F5183 (film_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE film_views (id INT AUTO_INCREMENT NOT NULL, ip_hash VARCHAR(64) NOT NULL, viewed_at DATETIME NOT NULL, film_id INT NOT NULL, INDEX IDX_889C62D7567F5183 (film_id), INDEX idx_film_view_film_viewed_at (film_id, viewed_at), INDEX idx_film_view_dedup (film_id, ip_hash, viewed_at), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE films (id INT AUTO_INCREMENT NOT NULL, slug VARCHAR(255) NOT NULL, title VARCHAR(255) NOT NULL, synopsis LONGTEXT DEFAULT NULL, director VARCHAR(255) DEFAULT NULL, country VARCHAR(255) DEFAULT NULL, year INT DEFAULT NULL, duration INT DEFAULT NULL, language VARCHAR(255) DEFAULT NULL, age_rating VARCHAR(50) DEFAULT NULL, trailer_url VARCHAR(500) DEFAULT NULL, cast JSON DEFAULT NULL, poster VARCHAR(255) DEFAULT NULL, backdrop VARCHAR(255) DEFAULT NULL, status VARCHAR(20) NOT NULL, archived TINYINT NOT NULL, view_count INT NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, UNIQUE INDEX UNIQ_CEECCA51989D9B62 (slug), INDEX idx_film_status (status), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE film_film_category (film_id INT NOT NULL, film_category_id INT NOT NULL, INDEX IDX_668CEEAA567F5183 (film_id), INDEX IDX_668CEEAA6AFEB0ED (film_category_id), PRIMARY KEY (film_id, film_category_id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE screening_views (id INT AUTO_INCREMENT NOT NULL, ip_hash VARCHAR(64) NOT NULL, viewed_at DATETIME NOT NULL, screening_id INT NOT NULL, INDEX IDX_E500E30B70F5295D (screening_id), INDEX idx_screening_view_screening_viewed_at (screening_id, viewed_at), INDEX idx_screening_view_dedup (screening_id, ip_hash, viewed_at), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE screenings (id INT AUTO_INCREMENT NOT NULL, scheduled_date DATE NOT NULL, start_time VARCHAR(5) NOT NULL, end_time VARCHAR(5) DEFAULT NULL, venue VARCHAR(255) NOT NULL, description LONGTEXT DEFAULT NULL, is_visible TINYINT NOT NULL, is_cancelled TINYINT NOT NULL, featured TINYINT NOT NULL, position INT DEFAULT NULL, capacity_total INT DEFAULT NULL, capacity_taken INT DEFAULT NULL, price INT DEFAULT NULL, view_count INT NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, film_id INT NOT NULL, INDEX IDX_350DCAA3567F5183 (film_id), INDEX idx_screening_date (scheduled_date), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE film_gallery_images ADD CONSTRAINT FK_AC5074DC567F5183 FOREIGN KEY (film_id) REFERENCES films (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE film_views ADD CONSTRAINT FK_889C62D7567F5183 FOREIGN KEY (film_id) REFERENCES films (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE film_film_category ADD CONSTRAINT FK_668CEEAA567F5183 FOREIGN KEY (film_id) REFERENCES films (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE film_film_category ADD CONSTRAINT FK_668CEEAA6AFEB0ED FOREIGN KEY (film_category_id) REFERENCES film_categories (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE screening_views ADD CONSTRAINT FK_E500E30B70F5295D FOREIGN KEY (screening_id) REFERENCES screenings (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE screenings ADD CONSTRAINT FK_350DCAA3567F5183 FOREIGN KEY (film_id) REFERENCES films (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE film_gallery_images DROP FOREIGN KEY FK_AC5074DC567F5183');
        $this->addSql('ALTER TABLE film_views DROP FOREIGN KEY FK_889C62D7567F5183');
        $this->addSql('ALTER TABLE film_film_category DROP FOREIGN KEY FK_668CEEAA567F5183');
        $this->addSql('ALTER TABLE film_film_category DROP FOREIGN KEY FK_668CEEAA6AFEB0ED');
        $this->addSql('ALTER TABLE screening_views DROP FOREIGN KEY FK_E500E30B70F5295D');
        $this->addSql('ALTER TABLE screenings DROP FOREIGN KEY FK_350DCAA3567F5183');
        $this->addSql('DROP TABLE cinematheque_settings');
        $this->addSql('DROP TABLE film_categories');
        $this->addSql('DROP TABLE film_gallery_images');
        $this->addSql('DROP TABLE film_views');
        $this->addSql('DROP TABLE films');
        $this->addSql('DROP TABLE film_film_category');
        $this->addSql('DROP TABLE screening_views');
        $this->addSql('DROP TABLE screenings');
    }
}
