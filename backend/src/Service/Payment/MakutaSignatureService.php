<?php

namespace App\Service\Payment;

use phpseclib3\Crypt\PublicKeyLoader;
use phpseclib3\Crypt\RSA;

/**
 * Génère la signature RSA exigée par Makuta (header X-Signature).
 *
 * Spec Makuta : RSA, SHA-256, padding PKCS#1 v1.5, sortie base64.
 * - POST : on signe le JSON compact (exactement le corps envoyé).
 * - GET  : on signe le chemin de la requête (ex: /api/transactions/abc).
 */
class MakutaSignatureService
{
    private ?RSA\PrivateKey $privateKey = null;

    public function __construct(
        private ?string $privateKeyPath = null,
        private ?string $privateKeyPem = null,
        private ?string $projectDir = null,
    ) {}

    public function isConfigured(): bool
    {
        return (bool) ($this->privateKeyPem ?: $this->privateKeyPath);
    }

    /**
     * Signe une chaîne (payload JSON compact ou chemin) → base64.
     */
    public function sign(string $data): string
    {
        return base64_encode($this->key()->sign($data));
    }

    private function key(): RSA\PrivateKey
    {
        if ($this->privateKey !== null) {
            return $this->privateKey;
        }

        $pem = $this->privateKeyPem;
        if (!$pem && $this->privateKeyPath) {
            // Résout %kernel.project_dir% s'il a été laissé dans la variable d'env
            // (la syntaxe %...% n'est pas interprétée à l'intérieur d'un .env).
            $path = $this->projectDir
                ? str_replace('%kernel.project_dir%', rtrim($this->projectDir, '/'), $this->privateKeyPath)
                : $this->privateKeyPath;

            if (!is_readable($path)) {
                throw new \RuntimeException("Clé privée Makuta introuvable: {$path}");
            }
            $pem = file_get_contents($path);
        }

        if (!$pem) {
            throw new \RuntimeException('Clé privée Makuta non configurée (MAKUTA_PRIVATE_KEY_PATH ou MAKUTA_PRIVATE_KEY_PEM).');
        }

        $key = PublicKeyLoader::loadPrivateKey($pem)
            ->withPadding(RSA::SIGNATURE_PKCS1)
            ->withHash('sha256');

        return $this->privateKey = $key;
    }
}
