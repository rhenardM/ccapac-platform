<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260805235257 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            CREATE TABLE program_gallery_images (
              id INT AUTO_INCREMENT NOT NULL,
              image VARCHAR(255) NOT NULL,
              caption VARCHAR(255) DEFAULT NULL,
              position INT NOT NULL,
              program_id INT NOT NULL,
              INDEX IDX_BCED00AE3EB8070A (program_id),
              PRIMARY KEY (id)
            ) DEFAULT CHARACTER SET utf8mb4
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE program_registrations (
              id INT AUTO_INCREMENT NOT NULL,
              first_name VARCHAR(120) NOT NULL,
              last_name VARCHAR(120) NOT NULL,
              email VARCHAR(180) NOT NULL,
              phone VARCHAR(40) DEFAULT NULL,
              number_of_seats INT DEFAULT NULL,
              message LONGTEXT DEFAULT NULL,
              is_read TINYINT NOT NULL,
              created_at DATETIME NOT NULL,
              program_id INT NOT NULL,
              INDEX IDX_F697417F3EB8070A (program_id),
              INDEX idx_program_registration_created_at (created_at),
              PRIMARY KEY (id)
            ) DEFAULT CHARACTER SET utf8mb4
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE
              program_gallery_images
            ADD
              CONSTRAINT FK_BCED00AE3EB8070A FOREIGN KEY (program_id) REFERENCES programs (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE
              program_registrations
            ADD
              CONSTRAINT FK_F697417F3EB8070A FOREIGN KEY (program_id) REFERENCES programs (id) ON DELETE CASCADE
        SQL);
        $this->addSql('ALTER TABLE programs ADD is_free TINYINT NOT NULL DEFAULT 1, ADD space_id INT DEFAULT NULL');
        $this->addSql(<<<'SQL'
            ALTER TABLE
              programs
            ADD
              CONSTRAINT FK_F149654523575340 FOREIGN KEY (space_id) REFERENCES spaces (id) ON DELETE
            SET
              NULL
        SQL);
        $this->addSql('CREATE INDEX IDX_F149654523575340 ON programs (space_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE program_gallery_images DROP FOREIGN KEY FK_BCED00AE3EB8070A');
        $this->addSql('ALTER TABLE program_registrations DROP FOREIGN KEY FK_F697417F3EB8070A');
        $this->addSql('DROP TABLE program_gallery_images');
        $this->addSql('DROP TABLE program_registrations');
        $this->addSql('ALTER TABLE programs DROP FOREIGN KEY FK_F149654523575340');
        $this->addSql('DROP INDEX IDX_F149654523575340 ON programs');
        $this->addSql('ALTER TABLE programs DROP is_free, DROP space_id');
    }
}
