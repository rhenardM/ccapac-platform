<?php

namespace App\Command;

use App\Entity\Article;
use App\Entity\ArticleCategory;
use App\Enum\ContentStatus;
use App\Repository\ArticleCategoryRepository;
use App\Repository\ArticleRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\String\Slugger\AsciiSlugger;

/**
 * Peuple la « Presse du Grand Tambour » à partir des articles historiquement
 * statiques du front (données dans src/Command/data/press-articles.json,
 * contenu déjà converti en HTML). Idempotent (upsert par slug).
 *
 *   php bin/console app:content:seed-articles
 */
#[AsCommand(
    name: 'app:content:seed-articles',
    description: 'Initialise les articles de presse + leurs catégories',
)]
class SeedArticlesCommand extends Command
{
    public function __construct(
        private EntityManagerInterface $em,
        private ArticleRepository $articleRepo,
        private ArticleCategoryRepository $categoryRepo,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $slugger = new AsciiSlugger('fr');

        $file = __DIR__ . '/data/press-articles.json';
        if (!is_file($file)) {
            $io->error("Fichier introuvable : $file");

            return Command::FAILURE;
        }
        /** @var list<array<string,mixed>> $data */
        $data = json_decode((string) file_get_contents($file), true) ?? [];

        // 1. Catégories (dérivées des articles), dans l'ordre d'apparition.
        $categories = [];
        $pos = 0;
        foreach ($data as $row) {
            $name = (string) $row['category'];
            if ($name === '' || isset($categories[$name])) {
                continue;
            }
            $slug = strtolower((string) $slugger->slug($name));
            $cat = $this->categoryRepo->findOneBySlug($slug) ?? new ArticleCategory();
            $cat->setSlug($slug);
            $cat->setName($name);
            $cat->setPosition($pos++);
            $this->em->persist($cat);
            $categories[$name] = $cat;
        }
        $this->em->flush();

        // 2. Articles
        $created = 0;
        $updated = 0;
        foreach ($data as $row) {
            $existing = $this->articleRepo->findOneBySlug((string) $row['slug']);
            $article = $existing ?? new Article();
            $article->setSlug((string) $row['slug']);
            $article->setTitle((string) $row['title']);
            $article->setExcerpt($row['excerpt'] ?? null);
            $article->setContent($row['contentHtml'] ?? null);
            $article->setAuthor($row['author'] ?? null);
            $article->setCategory($categories[$row['category']] ?? null);
            $article->setImage($row['image'] ?? null);
            $article->setCoverImage($row['coverImage'] ?? null);
            $article->setReadingTime((int) ($row['readingTime'] ?? 3));
            $article->setFeatured((bool) ($row['featured'] ?? false));
            $article->setStatus(ContentStatus::PUBLISHED);
            if (!empty($row['date'])) {
                $article->setPublishedAt(new \DateTimeImmutable((string) $row['date']));
            }
            $this->em->persist($article);
            $existing ? $updated++ : $created++;
        }
        $this->em->flush();

        $io->success(sprintf(
            '%d catégorie(s), %d article(s) créé(s), %d mis à jour.',
            count($categories),
            $created,
            $updated
        ));

        return Command::SUCCESS;
    }
}
