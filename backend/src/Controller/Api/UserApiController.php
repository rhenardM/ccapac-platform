<?php

namespace App\Controller\Api;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Service\Audit\AuditLogger;
use Doctrine\ORM\EntityManagerInterface;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Validator\Validator\ValidatorInterface;

/**
 * API admin de gestion des utilisateurs (JSON), réservée au super-administrateur.
 * Jeton Bearer requis (firewall admin_api).
 */
#[Route('/api/admin/users', name: 'api_admin_users_')]
#[IsGranted(User::ROLE_SUPER_ADMIN)]
#[OA\Tag(name: 'Admin · Utilisateurs')]
#[OA\Response(response: 401, description: 'Jeton Bearer manquant ou invalide')]
#[OA\Response(response: 403, description: 'Réservé au super-administrateur')]
class UserApiController extends AbstractController
{
    private const ALLOWED_ROLES = [User::ROLE_ADMIN, User::ROLE_SUPER_ADMIN];

    public function __construct(
        private UserRepository $userRepository,
        private EntityManagerInterface $entityManager,
        private UserPasswordHasherInterface $passwordHasher,
        private ValidatorInterface $validator,
        private AuditLogger $auditLogger,
        private Security $security,
    ) {}

    #[OA\Get(summary: 'Liste des administrateurs', security: [['Bearer' => []]])]
    #[OA\Response(response: 200, description: 'Liste des utilisateurs')]
    #[Route('', name: 'list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $users = $this->userRepository->findBy([], ['createdAt' => 'DESC']);

        return $this->json(['data' => array_map($this->toArray(...), $users)]);
    }

    #[OA\Post(
        summary: 'Créer un administrateur',
        security: [['Bearer' => []]],
    )]
    #[OA\RequestBody(required: true, content: new OA\JsonContent(
        required: ['name', 'email', 'password'],
        properties: [
            new OA\Property(property: 'name', type: 'string', example: 'Jean Kabasele'),
            new OA\Property(property: 'email', type: 'string', example: 'jean@centreculturel.cd'),
            new OA\Property(property: 'password', type: 'string', example: 'MotDePasse#2026'),
            new OA\Property(property: 'roles', type: 'array', items: new OA\Items(type: 'string'), example: ['ROLE_ADMIN']),
            new OA\Property(property: 'isActive', type: 'boolean', example: true),
        ],
    ))]
    #[OA\Response(response: 201, description: 'Utilisateur créé')]
    #[OA\Response(response: 422, description: 'Données invalides')]
    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $payload = json_decode($request->getContent(), true);
        if (!is_array($payload)) {
            return $this->json(['error' => 'Requête JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $email = strtolower(trim((string) ($payload['email'] ?? '')));
        $name = trim((string) ($payload['name'] ?? ''));
        $password = (string) ($payload['password'] ?? '');

        if (strlen($password) < 8) {
            return $this->json(['error' => 'Le mot de passe doit contenir au moins 8 caractères.', 'field' => 'password'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }
        if ($this->userRepository->findOneByEmail($email)) {
            return $this->json(['error' => 'Un utilisateur avec cet e-mail existe déjà.', 'field' => 'email'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user = new User();
        $user->setEmail($email);
        $user->setName($name);
        $user->setRoles($this->sanitizeRoles($payload['roles'] ?? [User::ROLE_ADMIN]));
        $user->setIsActive((bool) ($payload['isActive'] ?? true));
        $user->setPassword($this->passwordHasher->hashPassword($user, $password));
        $user->setCreatedBy($this->currentActor());

        if ($error = $this->firstViolation($user)) {
            return $this->json(['error' => $error], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        $this->auditLogger->log('user.create', sprintf('Création de %s (API)', $email), 'User', (string) $user->getId(), ['roles' => $user->getRoles()]);

        return $this->json(['data' => $this->toArray($user)], Response::HTTP_CREATED);
    }

    #[OA\Patch(
        summary: 'Modifier un administrateur (rôles, activation, nom, mot de passe)',
        security: [['Bearer' => []]],
    )]
    #[OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))]
    #[OA\RequestBody(content: new OA\JsonContent(properties: [
        new OA\Property(property: 'name', type: 'string'),
        new OA\Property(property: 'roles', type: 'array', items: new OA\Items(type: 'string')),
        new OA\Property(property: 'isActive', type: 'boolean'),
        new OA\Property(property: 'password', type: 'string'),
    ]))]
    #[OA\Response(response: 200, description: 'Utilisateur modifié')]
    #[OA\Response(response: 404, description: 'Utilisateur introuvable')]
    #[Route('/{id}', name: 'update', methods: ['PATCH'], requirements: ['id' => '\d+'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $user = $this->userRepository->find($id);
        if (!$user) {
            return $this->json(['error' => 'Utilisateur introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $payload = json_decode($request->getContent(), true);
        if (!is_array($payload)) {
            return $this->json(['error' => 'Requête JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $isSelf = $this->security->getUser() instanceof User
            && $this->security->getUser()->getUserIdentifier() === $user->getUserIdentifier();

        if (array_key_exists('name', $payload)) {
            $user->setName(trim((string) $payload['name']));
        }
        if (array_key_exists('roles', $payload)) {
            if ($isSelf) {
                return $this->json(['error' => 'Vous ne pouvez pas modifier vos propres rôles.'], Response::HTTP_UNPROCESSABLE_ENTITY);
            }
            $user->setRoles($this->sanitizeRoles($payload['roles']));
        }
        if (array_key_exists('isActive', $payload)) {
            if ($isSelf && !$payload['isActive']) {
                return $this->json(['error' => 'Vous ne pouvez pas désactiver votre propre compte.'], Response::HTTP_UNPROCESSABLE_ENTITY);
            }
            $user->setIsActive((bool) $payload['isActive']);
        }
        if (!empty($payload['password'])) {
            if (strlen((string) $payload['password']) < 8) {
                return $this->json(['error' => 'Le mot de passe doit contenir au moins 8 caractères.', 'field' => 'password'], Response::HTTP_UNPROCESSABLE_ENTITY);
            }
            $user->setPassword($this->passwordHasher->hashPassword($user, (string) $payload['password']));
        }

        if ($error = $this->firstViolation($user)) {
            return $this->json(['error' => $error], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $this->entityManager->flush();

        $this->auditLogger->log('user.update', sprintf('Modification de %s (API)', $user->getEmail()), 'User', (string) $user->getId(), ['roles' => $user->getRoles(), 'active' => $user->isActive()]);

        return $this->json(['data' => $this->toArray($user)]);
    }

    /** @param mixed $roles @return string[] */
    private function sanitizeRoles($roles): array
    {
        $roles = is_array($roles) ? $roles : [];
        $clean = array_values(array_intersect($roles, self::ALLOWED_ROLES));

        return $clean ?: [User::ROLE_ADMIN];
    }

    private function firstViolation(User $user): ?string
    {
        $violations = $this->validator->validate($user);

        return count($violations) > 0 ? $violations[0]->getMessage() : null;
    }

    private function currentActor(): string
    {
        $u = $this->security->getUser();

        return $u instanceof User ? (string) $u->getEmail() : 'system';
    }

    /** @return array<string,mixed> */
    private function toArray(User $user): array
    {
        return [
            'id' => $user->getId(),
            'name' => $user->getName(),
            'email' => $user->getEmail(),
            'roles' => $user->getRoles(),
            'isActive' => $user->isActive(),
            'createdAt' => $user->getCreatedAt()->format(\DateTimeInterface::ATOM),
            'lastLoginAt' => $user->getLastLoginAt()?->format(\DateTimeInterface::ATOM),
        ];
    }
}
