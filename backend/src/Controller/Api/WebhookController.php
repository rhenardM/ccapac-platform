<?php

namespace App\Controller\Api;

use App\Service\Payment\DonationService;
use OpenApi\Attributes as OA;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/fundraising/webhooks', name: 'api_fundraising_webhooks_')]
#[OA\Tag(name: 'Webhook')]
class WebhookController extends AbstractController
{
    /**
     * Callback Makuta (non signé) : { scope, status, message, txnId, callbackReference }.
     *
     * Pas de secret dans l'URL (demande Makuta : chemin trop long). La sécurité ne
     * repose PAS sur ce callback : on ne lui fait jamais confiance pour le statut.
     * `confirm()` rappelle Makuta via retrieve_transaction (requête authentifiée +
     * signée RSA) et c'est cette réponse qui fait foi. Un faux callback ne peut donc
     * rien confirmer, et une référence inconnue ne déclenche aucun appel sortant.
     *
     * On répond TOUJOURS 200 pour éviter les renvois en boucle de la passerelle.
     */
    #[OA\Post(
        summary: 'Callback Makuta (interne)',
        description: 'Appelé par Makuta quand une transaction change de statut. Réponse toujours 200. '
            . 'Le statut réel est re-vérifié côté serveur via une requête signée — le callback n’est pas une source de vérité.',
    )]
    #[OA\RequestBody(content: new OA\JsonContent(
        properties: [
            new OA\Property(property: 'scope', type: 'string', example: 'ctob'),
            new OA\Property(property: 'status', type: 'string', example: 'TS'),
            new OA\Property(property: 'message', type: 'string', example: 'Payment processed successfully.'),
            new OA\Property(property: 'txnId', type: 'string', example: 'GT-DON-2026-AB7K9P'),
            new OA\Property(property: 'callbackReference', type: 'string', example: 'cb-ref-00123'),
        ],
    ))]
    #[OA\Response(response: 200, description: 'Toujours 200 (accusé de réception)')]
    #[Route('/makuta', name: 'makuta', methods: ['POST'])]
    public function makuta(
        Request $request,
        DonationService $donationService,
        LoggerInterface $logger,
    ): JsonResponse {
        // Journalise le payload BRUT (niveau notice) pour audit/débogage.
        $logger->notice('Callback Makuta reçu', [
            'ip' => $request->getClientIp(),
            'contentType' => $request->headers->get('Content-Type'),
            'rawBody' => $request->getContent(),
        ]);

        $data = json_decode($request->getContent(), true) ?? [];
        $txnId = $data['txnId'] ?? null;

        if (!$txnId) {
            $logger->warning('Callback Makuta: txnId manquant', ['payload' => $data]);

            return $this->json(['received' => true]);
        }

        try {
            $donationService->confirm((string) $txnId, $data);
        } catch (\Throwable $e) {
            $logger->error('Erreur traitement callback Makuta', [
                'txnId' => $txnId,
                'error' => $e->getMessage(),
            ]);
        }

        return $this->json(['received' => true]);
    }
}
