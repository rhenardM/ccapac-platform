<?php

namespace App\Tests\Service;

use App\Service\Payment\MakutaSignatureService;
use phpseclib3\Crypt\PublicKeyLoader;
use phpseclib3\Crypt\RSA;
use PHPUnit\Framework\TestCase;

class MakutaSignatureServiceTest extends TestCase
{
    private string $privatePem;
    private RSA\PublicKey $publicKey;

    protected function setUp(): void
    {
        // Paire de clés générée à la volée (aucun fichier sur disque).
        $private = RSA::createKey(2048);
        $this->privatePem = (string) $private;
        $this->publicKey = $private->getPublicKey()
            ->withPadding(RSA::SIGNATURE_PKCS1)
            ->withHash('sha256');
    }

    public function testSignatureIsVerifiableWithPublicKey(): void
    {
        $service = new MakutaSignatureService(privateKeyPem: $this->privatePem);

        // JSON compact, exactement comme envoyé à Makuta.
        $payload = '{"operator":"DRC_MPESA","accountNumber":"243812345678","currency":"USD","amount":5}';
        $signatureB64 = $service->sign($payload);

        $this->assertNotEmpty($signatureB64);
        $this->assertTrue(
            $this->publicKey->verify($payload, base64_decode($signatureB64)),
            'La signature doit être vérifiable avec la clé publique (RSA/SHA-256/PKCS#1 v1.5).'
        );
    }

    public function testSignatureRejectsTamperedPayload(): void
    {
        $service = new MakutaSignatureService(privateKeyPem: $this->privatePem);
        $signatureB64 = $service->sign('/api/transactions/abc-123');

        $this->assertFalse(
            $this->publicKey->verify('/api/transactions/abc-124', base64_decode($signatureB64)),
            'Un payload modifié ne doit pas passer la vérification.'
        );
    }

    public function testIsConfiguredReflectsKeyPresence(): void
    {
        $this->assertFalse((new MakutaSignatureService())->isConfigured());
        $this->assertTrue((new MakutaSignatureService(privateKeyPem: $this->privatePem))->isConfigured());
    }
}
