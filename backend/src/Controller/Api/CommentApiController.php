<?php

namespace App\Controller\Api;

use App\Entity\Article;
use App\Entity\Comment;
use App\Enum\CommentAuthorRole;
use App\Repository\ArticleRepository;
use App\Repository\CommentRepository;
use Doctrine\ORM\EntityManagerInterface;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

/**
 * Commentaires publics sur les articles de presse.
 *
 * Un commentaire de premier niveau peut être posté par n'importe quel visiteur
 * (nom + e-mail). Une réponse ne peut être postée que pour le compte d'un membre
 * connecté sur le site Next.js (caapac) : celui-ci relaie l'appel côté serveur
 * en joignant la clé partagée `INTERNAL_API_KEY`, après avoir vérifié la session.
 */
#[Route('/api/content', name: 'api_content_')]
#[OA\Tag(name: 'Commentaires')]
class CommentApiController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private ValidatorInterface $validator,
        private ArticleRepository $articleRepository,
        private CommentRepository $commentRepository,
        #[Autowire(service: 'limiter.comment_limiter')]
        private RateLimiterFactory $commentLimiter,
        #[Autowire(service: 'limiter.reply_limiter')]
        private RateLimiterFactory $replyLimiter,
        #[Autowire('%env(INTERNAL_API_KEY)%')]
        private string $internalApiKey,
    ) {}

    #[OA\Get(summary: 'Commentaires visibles d\'un article (avec leurs réponses)')]
    #[Route('/articles/{slug}/comments', name: 'article_comments', methods: ['GET'])]
    public function list(string $slug): JsonResponse
    {
        $article = $this->articleRepository->findOnePublishedBySlug($slug);
        if (!$article) {
            return $this->json(['error' => 'Article introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $comments = array_map(
            fn (Comment $c) => $this->commentView($c, $this->commentRepository->findVisibleReplies($c)),
            $this->commentRepository->findVisibleForArticle($article)
        );

        return $this->json(['data' => $comments]);
    }

    #[OA\Post(summary: 'Poste un commentaire de premier niveau (visiteur anonyme)')]
    #[OA\RequestBody(required: true, content: new OA\JsonContent(
        required: ['authorName', 'authorEmail', 'content'],
        properties: [
            new OA\Property(property: 'authorName', type: 'string', example: 'Jean K.'),
            new OA\Property(property: 'authorEmail', type: 'string', example: 'jean@example.com'),
            new OA\Property(property: 'content', type: 'string', example: 'Très bel article !'),
        ],
    ))]
    #[OA\Response(response: 201, description: 'Commentaire publié')]
    #[OA\Response(response: 422, description: 'Données invalides')]
    #[OA\Response(response: 429, description: 'Trop de commentaires depuis cette IP')]
    #[Route('/articles/{slug}/comments', name: 'article_comments_create', methods: ['POST'])]
    public function create(string $slug, Request $request): JsonResponse
    {
        $article = $this->articleRepository->findOnePublishedBySlug($slug);
        if (!$article) {
            return $this->json(['error' => 'Article introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $limiter = $this->commentLimiter->create($request->getClientIp() ?? 'anon');
        if (!$limiter->consume(1)->isAccepted()) {
            return $this->json(['error' => 'Trop de commentaires. Réessayez dans quelques minutes.'], Response::HTTP_TOO_MANY_REQUESTS);
        }

        $payload = json_decode($request->getContent(), true) ?? [];

        $comment = new Comment();
        $comment->setArticle($article);
        $comment->setAuthorName(trim((string) ($payload['authorName'] ?? '')));
        $comment->setAuthorEmail(strtolower(trim((string) ($payload['authorEmail'] ?? ''))));
        $comment->setAuthorRole(CommentAuthorRole::VISITOR);
        $comment->setContent(strip_tags(trim((string) ($payload['content'] ?? ''))));

        if (count($this->validator->validate($comment)) > 0) {
            return $this->json(['error' => 'Commentaire invalide. Vérifiez les champs requis.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $this->em->persist($comment);
        $this->em->flush();

        return $this->json(['data' => $this->commentView($comment, [])], Response::HTTP_CREATED);
    }

    #[OA\Post(
        summary: 'Répond à un commentaire (relayé par caapac pour un membre connecté)',
        description: 'Réservé au backend Next.js : nécessite l\'en-tête `X-Internal-Api-Key`. '
            . 'Impossible de répondre à une réponse (un seul niveau d\'imbrication).',
    )]
    #[OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))]
    #[OA\RequestBody(required: true, content: new OA\JsonContent(
        required: ['authorName', 'authorEmail', 'authorRole', 'content'],
        properties: [
            new OA\Property(property: 'authorName', type: 'string'),
            new OA\Property(property: 'authorEmail', type: 'string'),
            new OA\Property(property: 'authorRole', type: 'string', enum: ['member', 'admin']),
            new OA\Property(property: 'content', type: 'string'),
        ],
    ))]
    #[OA\Response(response: 201, description: 'Réponse publiée')]
    #[OA\Response(response: 403, description: 'Clé interne manquante ou invalide')]
    #[OA\Response(response: 404, description: 'Commentaire introuvable')]
    #[OA\Response(response: 422, description: 'Données invalides ou tentative de réponse à une réponse')]
    #[Route('/comments/{id}/replies', name: 'comment_reply', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function reply(int $id, Request $request): JsonResponse
    {
        $providedKey = (string) $request->headers->get('X-Internal-Api-Key', '');
        if ($this->internalApiKey === '' || !hash_equals($this->internalApiKey, $providedKey)) {
            return $this->json(['error' => 'Accès refusé.'], Response::HTTP_FORBIDDEN);
        }

        $parent = $this->commentRepository->find($id);
        if (!$parent) {
            return $this->json(['error' => 'Commentaire introuvable.'], Response::HTTP_NOT_FOUND);
        }
        if ($parent->getParent() !== null) {
            return $this->json(['error' => 'Impossible de répondre à une réponse.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $payload = json_decode($request->getContent(), true) ?? [];

        $role = CommentAuthorRole::tryFrom((string) ($payload['authorRole'] ?? ''));
        if (!in_array($role, [CommentAuthorRole::MEMBER, CommentAuthorRole::ADMIN], true)) {
            return $this->json(['error' => 'Rôle d\'auteur invalide.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $limiter = $this->replyLimiter->create(strtolower(trim((string) ($payload['authorEmail'] ?? 'anon'))));
        if (!$limiter->consume(1)->isAccepted()) {
            return $this->json(['error' => 'Trop de réponses. Réessayez dans quelques minutes.'], Response::HTTP_TOO_MANY_REQUESTS);
        }

        $reply = new Comment();
        $reply->setArticle($parent->getArticle());
        $reply->setParent($parent);
        $reply->setAuthorName(trim((string) ($payload['authorName'] ?? '')));
        $reply->setAuthorEmail(strtolower(trim((string) ($payload['authorEmail'] ?? ''))));
        $reply->setAuthorRole($role);
        $reply->setContent(strip_tags(trim((string) ($payload['content'] ?? ''))));

        if (count($this->validator->validate($reply)) > 0) {
            return $this->json(['error' => 'Réponse invalide. Vérifiez les champs requis.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $this->em->persist($reply);
        $this->em->flush();

        return $this->json(['data' => $this->commentView($reply, [])], Response::HTTP_CREATED);
    }

    /**
     * @param Comment[] $replies
     * @return array<string,mixed>
     */
    private function commentView(Comment $c, array $replies): array
    {
        return [
            'id' => $c->getId(),
            'authorName' => $c->getAuthorName(),
            'authorRole' => $c->getAuthorRole()->value,
            'content' => $c->getContent(),
            'createdAt' => $c->getCreatedAt()->format(\DateTimeInterface::ATOM),
            'replies' => array_map(fn (Comment $r) => $this->commentView($r, []), $replies),
        ];
    }
}
