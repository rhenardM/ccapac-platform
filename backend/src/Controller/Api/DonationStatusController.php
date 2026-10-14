<?php

namespace App\Controller\Api;

use App\Dto\DonationView;
use App\Repository\DonationRepository;
use App\Service\Payment\DonationService;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/fundraising/donations', name: 'api_fundraising_donations_')]
#[OA\Tag(name: 'Dons')]
class DonationStatusController extends AbstractController
{
    public function __construct(
        private DonationRepository $donationRepository,
        private DonationService $donationService,
    ) {}

    /**
     * Statut d'un don (polling depuis le frontend pendant l'attente du paiement).
     * Rafraîchit activement depuis Makuta si le don est encore en attente.
     */
    #[OA\Get(
        summary: 'Suivre le statut d’un don (polling)',
        description: 'Renvoie le don. S’il est encore `pending`, le backend interroge Makuta en direct '
            . '(rattrape un callback perdu). Statuts : pending, paid, failed, expired.',
    )]
    #[OA\Parameter(name: 'reference', in: 'path', required: true, description: 'Référence du don', schema: new OA\Schema(type: 'string'), example: 'GT-DON-2026-AB7K9P')]
    #[OA\Response(response: 200, description: 'État courant du don')]
    #[OA\Response(response: 404, description: 'Don introuvable')]
    #[Route('/status/{reference}', name: 'status', methods: ['GET'])]
    public function status(string $reference): JsonResponse
    {
        $donation = $this->donationRepository->findByReference($reference);
        if (!$donation) {
            return $this->json(['error' => 'Don introuvable.'], Response::HTTP_NOT_FOUND);
        }

        // Si encore en attente, on interroge Makuta (capte les callbacks perdus).
        if ($donation->isPending()) {
            $donation = $this->donationService->process($donation);
        }

        return $this->json(['data' => DonationView::fromEntity($donation)]);
    }
}
