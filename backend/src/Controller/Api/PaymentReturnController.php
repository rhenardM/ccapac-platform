<?php

namespace App\Controller\Api;

use App\Repository\DonationRepository;
use App\Service\Payment\DonationService;
use OpenApi\Attributes as OA;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Point d'atterrissage du navigateur après un paiement carte Visa CNP.
 * Makuta redirige le donateur ici ; on le renvoie vers la page de statut du
 * frontend Next.js. La confirmation réelle du paiement arrive par webhook.
 */
class PaymentReturnController extends AbstractController
{
    public function __construct(
        private DonationRepository $donationRepository,
        private DonationService $donationService,
        private LoggerInterface $logger,
        #[Autowire('%env(APP_PUBLIC_URL)%')]
        private string $publicUrl,
    ) {}

    #[OA\Tag(name: 'Webhook')]
    #[OA\Get(
        summary: 'Retour navigateur après paiement carte (interne)',
        description: 'Atterrissage du navigateur après la page carte Makuta (Visa CNP). Redirige (302) vers '
            . '{APP_PUBLIC_URL}/faire-un-don/merci?transaction_id={reference}. Le frontend n’appelle pas cet endpoint directement.',
    )]
    #[OA\Response(response: 302, description: 'Redirection vers la page de remerciement du frontend')]
    #[Route('/api/fundraising/paiement/retour', name: 'fundraising_payment_return', methods: ['GET', 'POST'])]
    public function return(Request $request): RedirectResponse
    {
        // Makuta peut renvoyer la référence sous différents noms, en GET ou en POST.
        $reference = null;
        foreach (['reference', 'thirdPartyReference', 'txnId', 'id'] as $key) {
            $reference = $request->query->get($key) ?? $request->request->get($key);
            if ($reference) {
                break;
            }
        }

        $base = rtrim($this->publicUrl, '/');

        if ($reference) {
            // Résout vers notre référence publique si on a reçu un id Makuta.
            $donation = $this->donationRepository->findByReference((string) $reference);

            // Réconciliation immédiate : le donateur carte revient ici sans qu'un
            // callback ne soit garanti. On revérifie le statut réel auprès de Makuta
            // (requête signée) dès le retour, pour ne pas rester bloqué en « pending ».
            if ($donation && $donation->isPending()) {
                try {
                    $donation = $this->donationService->process($donation);
                } catch (\Throwable $e) {
                    $this->logger->error('Réconciliation au retour paiement échouée', [
                        'reference' => $donation->getReference(),
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            $ref = $donation?->getReference() ?? (string) $reference;

            // Page de remerciement existante du frontend Next.js (polling du statut).
            return new RedirectResponse(
                sprintf('%s/faire-un-don/merci?transaction_id=%s', $base, rawurlencode($ref))
            );
        }

        return new RedirectResponse($base . '/faire-un-don');
    }
}
