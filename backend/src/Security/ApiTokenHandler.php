<?php

namespace App\Security;

use App\Repository\ApiTokenRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Security\Core\Exception\BadCredentialsException;
use Symfony\Component\Security\Http\AccessToken\AccessTokenHandlerInterface;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;

/**
 * Résout un jeton Bearer opaque en utilisateur via la table api_tokens
 * (on ne stocke que le hash). Vérifie l'expiration et l'état du compte.
 */
class ApiTokenHandler implements AccessTokenHandlerInterface
{
    public function __construct(
        private ApiTokenRepository $apiTokenRepository,
        private EntityManagerInterface $entityManager,
    ) {}

    public function getUserBadgeFrom(string $accessToken): UserBadge
    {
        $token = $this->apiTokenRepository->findOneByRawToken($accessToken);

        if (!$token || $token->isExpired()) {
            throw new BadCredentialsException('Jeton invalide ou expiré.');
        }

        $user = $token->getUser();
        if (!$user->isActive()) {
            throw new BadCredentialsException('Compte désactivé.');
        }

        $token->setLastUsedAt(new \DateTimeImmutable());
        $this->entityManager->flush();

        return new UserBadge($user->getUserIdentifier(), static fn () => $user);
    }
}
