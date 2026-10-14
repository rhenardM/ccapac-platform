<?php

namespace App\Controller\Api;

use App\Repository\DonationRepository;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/fundraising/campaign', name: 'api_fundraising_campaign_')]
#[OA\Tag(name: 'Collecte')]
class CampaignStatsController extends AbstractController
{
    public function __construct(
        private DonationRepository $donationRepository,
        private float $campaignGoalUsd,
    ) {}

    /**
     * Statistiques publiques de la collecte (objectif, montant atteint, progression).
     */
    #[OA\Get(
        summary: 'Statistiques publiques de la collecte',
        description: 'Objectif, montant atteint (dons confirmés), progression (%) et nombre de dons payés.',
    )]
    #[OA\Response(
        response: 200,
        description: 'Statistiques de la collecte',
        content: new OA\JsonContent(properties: [
            new OA\Property(property: 'data', type: 'object', example: [
                'currency' => 'USD',
                'goal' => 517251,
                'collected' => 12450.0,
                'progress' => 2.41,
                'donationsCount' => 37,
            ]),
        ]),
    )]
    #[Route('/stats', name: 'stats', methods: ['GET'])]
    public function stats(): JsonResponse
    {
        $stats = $this->donationRepository->campaignStats();
        $collected = $stats['collected'];
        $progress = $this->campaignGoalUsd > 0
            ? round(min(100, $collected / $this->campaignGoalUsd * 100), 2)
            : 0.0;

        return $this->json([
            'data' => [
                'currency' => 'USD',
                'goal' => $this->campaignGoalUsd,
                'collected' => round($collected, 2),
                'progress' => $progress,
                'donationsCount' => $stats['count'],
            ],
        ]);
    }
}
