<?php

namespace App\Controller\Api;

use App\Entity\ArticleView;
use App\Repository\ArticleRepository;
use App\Repository\ArticleViewRepository;
use Doctrine\ORM\EntityManagerInterface;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Comptage des vues d'un article. Un visiteur ne compte qu'une seule fois par
 * article et par fenêtre de dédoublonnage (30 minutes), quel que soit le
 * nombre de rechargements de page.
 */
#[Route('/api/content', name: 'api_content_')]
#[OA\Tag(name: 'Statistiques')]
class ArticleViewApiController extends AbstractController
{
    private const DEDUP_WINDOW_MINUTES = 30;

    public function __construct(
        private EntityManagerInterface $em,
        private ArticleRepository $articleRepository,
        private ArticleViewRepository $articleViewRepository,
        #[Autowire(service: 'limiter.article_view_limiter')]
        private RateLimiterFactory $viewLimiter,
        #[Autowire('%env(APP_SECRET)%')]
        private string $appSecret,
    ) {}

    #[OA\Post(summary: 'Comptabilise une consultation d\'article (une par visiteur/30 min)')]
    #[OA\Parameter(name: 'slug', in: 'path', required: true, schema: new OA\Schema(type: 'string'))]
    #[OA\Response(response: 200, description: 'Vue comptabilisée (ou déjà comptée récemment)')]
    #[OA\Response(response: 404, description: 'Article introuvable')]
    #[Route('/articles/{slug}/view', name: 'article_view', methods: ['POST'])]
    public function view(string $slug, Request $request): JsonResponse
    {
        $article = $this->articleRepository->findOnePublishedBySlug($slug);
        if (!$article) {
            return $this->json(['error' => 'Article introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $ipHash = $this->hashIp($request->getClientIp() ?? 'anon');

        $limiter = $this->viewLimiter->create($ipHash);
        if (!$limiter->consume(1)->isAccepted()) {
            return $this->json(['error' => 'Trop de requêtes.'], Response::HTTP_TOO_MANY_REQUESTS);
        }

        $since = new \DateTimeImmutable(sprintf('-%d minutes', self::DEDUP_WINDOW_MINUTES));

        if (!$this->articleViewRepository->hasRecentView($article, $ipHash, $since)) {
            $view = new ArticleView();
            $view->setArticle($article);
            $view->setIpHash($ipHash);
            $article->incrementViewCount();

            $this->em->persist($view);
            $this->em->flush();
        }

        return $this->json(['data' => ['viewCount' => $article->getViewCount()]]);
    }

    private function hashIp(string $ip): string
    {
        return hash('sha256', $ip . $this->appSecret);
    }
}
