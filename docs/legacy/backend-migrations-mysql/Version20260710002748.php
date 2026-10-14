<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260710002748 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE programs DROP FOREIGN KEY `FK_F149654512469DE2`');
        $this->addSql('ALTER TABLE programs ADD organizer VARCHAR(255) DEFAULT NULL, ADD external_url VARCHAR(500) DEFAULT NULL, CHANGE category_id category_id INT DEFAULT NULL, CHANGE scope scope VARCHAR(20) NOT NULL');
        $this->addSql('ALTER TABLE programs ADD CONSTRAINT FK_F149654512469DE2 FOREIGN KEY (category_id) REFERENCES program_categories (id) ON DELETE SET NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE programs DROP FOREIGN KEY FK_F149654512469DE2');
        $this->addSql('ALTER TABLE programs DROP organizer, DROP external_url, CHANGE scope scope VARCHAR(20) DEFAULT \'interne\' NOT NULL, CHANGE category_id category_id INT NOT NULL');
        $this->addSql('ALTER TABLE programs ADD CONSTRAINT `FK_F149654512469DE2` FOREIGN KEY (category_id) REFERENCES program_categories (id) ON UPDATE NO ACTION ON DELETE CASCADE');
    }
}
