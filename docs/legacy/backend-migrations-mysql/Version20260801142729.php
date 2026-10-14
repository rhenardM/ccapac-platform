<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260801142729 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajoute le compteur de vues des articles (view_count) et la table article_views';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE article_views (id INT AUTO_INCREMENT NOT NULL, ip_hash VARCHAR(64) NOT NULL, viewed_at DATETIME NOT NULL, article_id INT NOT NULL, INDEX IDX_6647EE967294869C (article_id), INDEX idx_article_view_article_viewed_at (article_id, viewed_at), INDEX idx_article_view_dedup (article_id, ip_hash, viewed_at), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE article_views ADD CONSTRAINT FK_6647EE967294869C FOREIGN KEY (article_id) REFERENCES articles (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE articles ADD view_count INT NOT NULL DEFAULT 0');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE article_views DROP FOREIGN KEY FK_6647EE967294869C');
        $this->addSql('DROP TABLE article_views');
        $this->addSql('ALTER TABLE articles DROP view_count');
    }
}
