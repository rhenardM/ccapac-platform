<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260805173624 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajoute le module Espaces du Grand Tambour (espaces, types, galerie, réglages hero)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE space_categories (id INT AUTO_INCREMENT NOT NULL, slug VARCHAR(255) NOT NULL, name VARCHAR(255) NOT NULL, icon VARCHAR(50) NOT NULL, position INT NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, UNIQUE INDEX UNIQ_3C6C5239989D9B62 (slug), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE space_gallery_images (id INT AUTO_INCREMENT NOT NULL, image VARCHAR(255) NOT NULL, caption VARCHAR(255) DEFAULT NULL, position INT NOT NULL, space_id INT NOT NULL, INDEX IDX_35B8024323575340 (space_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE spaces (id INT AUTO_INCREMENT NOT NULL, slug VARCHAR(255) NOT NULL, name VARCHAR(255) NOT NULL, short_description LONGTEXT DEFAULT NULL, full_description LONGTEXT DEFAULT NULL, cover_image VARCHAR(255) DEFAULT NULL, capacity INT DEFAULT NULL, surface_m2 INT DEFAULT NULL, seated_capacity INT DEFAULT NULL, standing_capacity INT DEFAULT NULL, has_pmr_access TINYINT NOT NULL, has_air_conditioning TINYINT NOT NULL, has_sound_system TINYINT NOT NULL, has_professional_lighting TINYINT NOT NULL, has_wifi TINYINT NOT NULL, has_parking TINYINT NOT NULL, usage_conditions LONGTEXT DEFAULT NULL, is_bookable TINYINT NOT NULL, booking_url VARCHAR(500) DEFAULT NULL, quote_request_url VARCHAR(500) DEFAULT NULL, contact_name VARCHAR(255) DEFAULT NULL, contact_email VARCHAR(255) DEFAULT NULL, contact_phone VARCHAR(50) DEFAULT NULL, is_active TINYINT NOT NULL, position INT DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, category_id INT DEFAULT NULL, UNIQUE INDEX UNIQ_DD2B6478989D9B62 (slug), INDEX IDX_DD2B647812469DE2 (category_id), INDEX idx_space_active (is_active), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE spaces_page_settings (id INT NOT NULL, hero_kicker VARCHAR(255) DEFAULT NULL, hero_title VARCHAR(255) DEFAULT NULL, intro_text LONGTEXT DEFAULT NULL, hero_background_image VARCHAR(255) DEFAULT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE space_gallery_images ADD CONSTRAINT FK_35B8024323575340 FOREIGN KEY (space_id) REFERENCES spaces (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE spaces ADD CONSTRAINT FK_DD2B647812469DE2 FOREIGN KEY (category_id) REFERENCES space_categories (id) ON DELETE SET NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE space_gallery_images DROP FOREIGN KEY FK_35B8024323575340');
        $this->addSql('ALTER TABLE spaces DROP FOREIGN KEY FK_DD2B647812469DE2');
        $this->addSql('DROP TABLE space_categories');
        $this->addSql('DROP TABLE space_gallery_images');
        $this->addSql('DROP TABLE spaces');
        $this->addSql('DROP TABLE spaces_page_settings');
    }
}
