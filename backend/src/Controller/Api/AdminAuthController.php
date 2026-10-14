<?php

namespace App\Controller\Api;

use App\Entity\ApiToken;
use App\Entity\User;
use App\Repository\UserRepository;
use App\Service\Audit\AuditLogger;
use Doctrine\ORM\EntityManagerInterface;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Connexion à l'API admin : e-mail + mot de passe → jeton Bearer.
 * Endpoint PUBLIC (voir access_control : ^/api/admin/login = PUBLIC_ACCESS).
 */
#[OA\Tag(name: 'Admin')]
class AdminAuthController extends AbstractController
{
    /** Durée de validité du jeton émis à la connexion (jours). */
    private const TOKEN_TTL_DAYS = 7;

    public function __construct(
        private UserRepository $userRepository,
        private UserPasswordHasherInterface $passwordHasher,
        private EntityManagerInterface $entityManager,
        private AuditLogger $auditLogger,
        #[Autowire(service: 'limiter.login_limiter')]
        private RateLimiterFactory $loginLimiter,
    ) {}

    #[OA\Post(
        summary: 'Connexion — obtenir un jeton Bearer',
        description: 'Vérifie l’e-mail et le mot de passe d’un administrateur et renvoie un jeton '
            . 'Bearer à utiliser dans l’en-tête Authorization des endpoints /api/admin.',
    )]
    #[OA\RequestBody(required: true, content: new OA\JsonContent(
        required: ['email', 'password'],
        properties: [
            new OA\Property(property: 'email', type: 'string', example: 'admin@centreculturel.cd'),
            new OA\Property(property: 'password', type: 'string', example: 'Admin#GrandTambour2026'),
        ],
    ))]
    #[OA\Response(response: 200, description: 'Jeton émis', content: new OA\JsonContent(properties: [
        new OA\Property(property: 'data', type: 'object', example: [
            'token' => 'a1b2c3…(64 hex)',
            'expiresAt' => '2026-07-11T10:00:00+00:00',
            'user' => ['name' => 'Super Admin', 'email' => 'admin@centreculturel.cd', 'roles' => ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN']],
        ]),
    ]))]
    #[OA\Response(response: 401, description: 'Identifiants invalides ou compte désactivé')]
    #[OA\Response(response: 429, description: 'Trop de tentatives')]
    #[Route('/api/admin/login', name: 'api_admin_login', methods: ['POST'])]
    public function login(Request $request): JsonResponse
    {
        if (!$this->loginLimiter->create($request->getClientIp() ?? 'anon')->consume(1)->isAccepted()) {
            return $this->json(['error' => 'Trop de tentatives. Réessayez dans une minute.'], Response::HTTP_TOO_MANY_REQUESTS);
        }

        $payload = json_decode($request->getContent(), true);
        if (!is_array($payload)) {
            return $this->json(['error' => 'Requête JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $email = strtolower(trim((string) ($payload['email'] ?? '')));
        $password = (string) ($payload['password'] ?? '');
        $user = $email ? $this->userRepository->findOneByEmail($email) : null;

        // Message générique (ne révèle pas si l'e-mail existe).
        if (!$user || !$user->isActive() || !$this->passwordHasher->isPasswordValid($user, $password)) {
            $this->auditLogger->log('login.api.failed', sprintf('Échec de connexion (%s)', $email ?: '—'), performedBy: $email ?: 'anon');

            return $this->json(['error' => 'Identifiants invalides.'], Response::HTTP_UNAUTHORIZED);
        }

        [$token, $raw] = ApiToken::createFor($user, 'login', self::TOKEN_TTL_DAYS);
        $this->entityManager->persist($token);
        $user->setLastLoginAt(new \DateTimeImmutable());
        $this->entityManager->flush();

        $this->auditLogger->log('login.api', sprintf('Connexion API de %s', $user->getEmail()), 'User', (string) $user->getId(), performedBy: (string) $user->getEmail());

        return $this->json([
            'data' => [
                'token' => $raw,
                'expiresAt' => $token->getExpiresAt()?->format(\DateTimeInterface::ATOM),
                'user' => [
                    'name' => $user->getName(),
                    'email' => $user->getEmail(),
                    'roles' => $user->getRoles(),
                ],
            ],
        ]);
    }
}
