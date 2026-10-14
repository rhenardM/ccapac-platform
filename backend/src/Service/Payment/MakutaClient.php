<?php

namespace App\Service\Payment;

use Symfony\Contracts\Cache\CacheInterface;
use Symfony\Contracts\Cache\ItemInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

/**
 * Client HTTP bas niveau pour Makuta Payment Gateway.
 * Gère l'OAuth2 (token mis en cache), la signature RSA et les en-têtes requis.
 */
class MakutaClient
{
    private const AUTH_URLS = [
        'dev' => 'https://auth-dev-pg.makuta.cash',
        'prod' => 'https://auth-pg.makuta.cash',
    ];
    private const PG_URLS = [
        'dev' => 'https://dev-pg.makuta.cash',
        'prod' => 'https://pg.makuta.cash',
    ];

    public function __construct(
        private HttpClientInterface $httpClient,
        private CacheInterface $cache,
        private MakutaSignatureService $signatureService,
        private ?string $env = 'dev',
        private ?string $clientId = null,
        private ?string $clientSecret = null,
        private ?string $xExtension = null,
    ) {}

    public function isConfigured(): bool
    {
        return $this->clientId && $this->clientSecret && $this->xExtension
            && $this->signatureService->isConfigured();
    }

    /**
     * Crée une transaction Customer-to-Business (Mobile Money / carte).
     *
     * @param array $body operator, accountNumber, currency, amount, thirdPartyReference, reason[, email]
     * @return array réponse Makuta (id, url, qr, ...)
     */
    public function createTransaction(array $body, string $operation = 'ctob'): array
    {
        // Le payload signé DOIT être exactement le corps envoyé (JSON compact).
        $json = json_encode($body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $signature = $this->signatureService->sign($json);

        $send = fn (string $token) => $this->httpClient->request('POST', $this->pgUrl() . '/api/transactions/' . $operation, [
            'headers' => [
                'Authorization' => 'Bearer ' . $token,
                'Content-Type' => 'application/json',
                'X-Signature' => $signature,
                'X-Extension' => $this->xExtension,
            ],
            'body' => $json,
        ]);

        $response = $send($this->getToken($operation));
        $status = $response->getStatusCode();
        $data = $response->toArray(false);

        // Token expiré côté Makuta ("Expired token" / 401) : on purge le cache
        // et on réessaie une fois avec un token frais.
        if ($status === 401 || $this->isTokenError($data)) {
            $this->forgetToken($operation);
            $data = $send($this->getToken($operation))->toArray(false);
        }

        return $data;
    }

    /**
     * Confirme une transaction par OTP (ex: DRC_RAKKACASH).
     */
    public function confirmOtp(string $transactionId, string $otpCode): array
    {
        $body = [
            'transactionId' => $transactionId,
            'otpCode' => $otpCode,
        ];
        $json = json_encode($body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $signature = $this->signatureService->sign($json);

        $send = fn (string $token) => $this->httpClient->request('POST', $this->pgUrl() . '/api/rakkacash-confirm-otp-txn', [
            'headers' => [
                'Authorization' => 'Bearer ' . $token,
                'Content-Type' => 'application/json',
                'X-Signature' => $signature,
                'X-Extension' => $this->xExtension,
            ],
            'body' => $json,
        ]);

        $response = $send($this->getToken('ctob'));
        $status = $response->getStatusCode();
        $data = $response->toArray(false);

        if ($status === 401 || $this->isTokenError($data)) {
            $this->forgetToken('ctob');
            $data = $send($this->getToken('ctob'))->toArray(false);
        }

        return $data;
    }

    private function isTokenError(array $data): bool
    {
        $message = $data['message'] ?? $data['error'] ?? '';

        return is_string($message) && stripos($message, 'token') !== false;
    }

    private function forgetToken(string $operation): void
    {
        $this->cache->delete('makuta_token_' . md5($this->env . '/' . $operation));
    }

    /**
     * Récupère le statut d'une transaction. La signature porte sur le chemin.
     */
    public function retrieveTransaction(string $makutaTransactionId): array
    {
        $token = $this->getToken('txn');
        $path = '/api/transactions/' . $makutaTransactionId;

        $response = $this->httpClient->request('GET', $this->pgUrl() . $path, [
            'headers' => [
                'Authorization' => 'Bearer ' . $token,
                'Content-Type' => 'application/json',
                'X-Signature' => $this->signatureService->sign($path),
                'X-Extension' => $this->xExtension,
            ],
        ]);

        return $response->toArray(false);
    }

    /**
     * Diagnostic : valide l'authentification OAuth2 et renvoie le scope utilisé.
     * Lève une exception si les credentials sont invalides.
     */
    public function authenticate(string $operation = 'ctob'): string
    {
        $this->getToken($operation);

        return $this->env . '/' . $operation;
    }

    /**
     * Récupère un access_token (mis en cache, TTL < 300 s imposé par Makuta).
     */
    private function getToken(string $operation): string
    {
        $scope = $this->env . '/' . $operation;

        return $this->cache->get('makuta_token_' . md5($scope), function (ItemInterface $item) use ($scope) {
            $item->expiresAfter(280);

            $response = $this->httpClient->request('POST', $this->authUrl() . '/oauth2/token', [
                'auth_basic' => [$this->clientId, $this->clientSecret],
                'headers' => ['Content-Type' => 'application/x-www-form-urlencoded'],
                'body' => [
                    'grant_type' => 'client_credentials',
                    'scope' => $scope,
                ],
            ]);

            $data = $response->toArray(false);
            $token = $data['access_token'] ?? null;
            if (!$token) {
                throw new \RuntimeException('Authentification Makuta échouée (pas d\'access_token).');
            }

            // Respecte expires_in si fourni (marge de 20 s).
            if (isset($data['expires_in']) && (int) $data['expires_in'] > 20) {
                $item->expiresAfter((int) $data['expires_in'] - 20);
            }

            return $token;
        });
    }

    private function authUrl(): string
    {
        return self::AUTH_URLS[$this->env] ?? self::AUTH_URLS['dev'];
    }

    private function pgUrl(): string
    {
        return self::PG_URLS[$this->env] ?? self::PG_URLS['dev'];
    }
}
