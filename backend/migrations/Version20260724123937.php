<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260724123937 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajoute la table comments (commentaires d\'articles + réponses)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE comments (id INT AUTO_INCREMENT NOT NULL, author_name VARCHAR(120) NOT NULL, author_email VARCHAR(180) NOT NULL, author_role VARCHAR(20) NOT NULL, content LONGTEXT NOT NULL, is_hidden TINYINT NOT NULL, created_at DATETIME NOT NULL, article_id INT NOT NULL, parent_id INT DEFAULT NULL, INDEX idx_comment_article (article_id), INDEX idx_comment_parent (parent_id), INDEX idx_comment_created_at (created_at), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE comments ADD CONSTRAINT FK_5F9E962A7294869C FOREIGN KEY (article_id) REFERENCES articles (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE comments ADD CONSTRAINT FK_5F9E962A727ACA70 FOREIGN KEY (parent_id) REFERENCES comments (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE comments DROP FOREIGN KEY FK_5F9E962A7294869C');
        $this->addSql('ALTER TABLE comments DROP FOREIGN KEY FK_5F9E962A727ACA70');
        $this->addSql('DROP TABLE comments');
    }
}
