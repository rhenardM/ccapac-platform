<?php

namespace App\Controller\Api;

use App\Dto\DonationView;
use App\Entity\Donation;
use App\Entity\User;
use App\Repository\DonationRepository;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * API admin en lecture (JSON), protégée par jeton Bearer + ROLE_ADMIN.
 * Destinée à un futur dashboard React/Next.js (l'UI EasyAdmin reste disponible en //).
 */
#[Route('/api/admin', name: 'api_admin_')]
#[IsGranted(User::ROLE_ADMIN)]
#[OA\Tag(name: 'Admin')]
#[OA\Response(response: 401, description: 'Jeton Bearer manquant ou invalide')]
#[OA\Response(response: 403, description: 'Accès refusé (rôle insuffisant)')]
class AdminApiController extends AbstractController
{
    public function __construct(
        private DonationRepository $donationRepository,
        #[Autowire('%campaign.goal_usd%')]
        private float $campaignGoalUsd,
    ) {}

    #[OA\Get(
        summary: 'Statistiques du tableau de bord',
        description: 'KPIs de la collecte : total encaissé, objectif, progression, répartition par statut et par opérateur.',
        security: [['Bearer' => []]],
    )]
    #[OA\Response(response: 200, description: 'Statistiques agrégées')]
    #[Route('/stats', name: 'stats', methods: ['GET'])]
    public function stats(): JsonResponse
    {
        $s = $this->donationRepository->campaignStats();
        $byStatus = $this->donationRepository->statusBreakdown();

        $paid = $byStatus[Donation::STATUS_PAID]['count'] ?? 0;
        $failed = ($byStatus[Donation::STATUS_FAILED]['count'] ?? 0)
            + ($byStatus[Donation::STATUS_EXPIRED]['count'] ?? 0);
        $resolved = $paid + $failed;

        return $this->json([
            'data' => [
                'currency' => 'USD',
                'goal' => $this->campaignGoalUsd,
                'collected' => round($s['collected'], 2),
                'progress' => $this->campaignGoalUsd > 0
                    ? round(min(100, $s['collected'] / $this->campaignGoalUsd * 100), 2)
                    : 0.0,
                'donationsCount' => $s['count'],
                'successRate' => $resolved > 0 ? round($paid / $resolved * 100, 1) : 0.0,
                'byStatus' => $byStatus,
                'byOperator' => $this->donationRepository->paidByOperator(),
            ],
        ]);
    }

    #[OA\Get(
        summary: 'Liste paginée des dons',
        description: 'Filtrable par statut et opérateur, triée par date décroissante.',
        security: [['Bearer' => []]],
    )]
    #[OA\Parameter(name: 'status', in: 'query', description: 'pending | paid | failed | expired', schema: new OA\Schema(type: 'string'))]
    #[OA\Parameter(name: 'operator', in: 'query', description: 'Code opérateur (ex. DRC_MPESA)', schema: new OA\Schema(type: 'string'))]
    #[OA\Parameter(name: 'page', in: 'query', schema: new OA\Schema(type: 'integer', default: 1))]
    #[OA\Parameter(name: 'perPage', in: 'query', schema: new OA\Schema(type: 'integer', default: 30))]
    #[OA\Response(response: 200, description: 'Page de dons + métadonnées de pagination')]
    #[Route('/donations', name: 'donations', methods: ['GET'])]
    public function donations(Request $request): JsonResponse
    {
        $result = $this->donationRepository->paginateForAdmin(
            $request->query->get('status') ?: null,
            $request->query->get('operator') ?: null,
            (int) $request->query->get('page', 1),
            (int) $request->query->get('perPage', 30),
        );

        return $this->json([
            'data' => array_map(fn (Donation $d) => $this->toArray($d), $result['items']),
            'meta' => [
                'total' => $result['total'],
                'page' => $result['page'],
                'perPage' => $result['perPage'],
                'pages' => $result['pages'],
            ],
        ]);
    }

    #[OA\Get(
        summary: 'Détail d\'un don',
        description: 'Détail complet (donateur + payload callback) par référence.',
        security: [['Bearer' => []]],
    )]
    #[OA\Parameter(name: 'reference', in: 'path', required: true, schema: new OA\Schema(type: 'string'), example: 'GT-DON-2026-AB7K9P')]
    #[OA\Response(response: 200, description: 'Détail du don')]
    #[OA\Response(response: 404, description: 'Don introuvable')]
    #[Route('/donations/{reference}', name: 'donation_detail', methods: ['GET'])]
    public function donation(string $reference): JsonResponse
    {
        $donation = $this->donationRepository->findByReference($reference);
        if (!$donation) {
            return $this->json(['error' => 'Don introuvable.'], Response::HTTP_NOT_FOUND);
        }

        return $this->json(['data' => $this->toArray($donation, true)]);
    }

    /** @return array<string,mixed> */
    private function toArray(Donation $d, bool $full = false): array
    {
        $donor = $d->getDonor();
        $data = DonationView::fromEntity($d);
        $data['donor'] = [
            'name' => $donor->getName(),
            'email' => $donor->getEmail(),
            'phone' => $donor->getPhone(),
        ];

        if ($full) {
            $data['callbackPayload'] = $d->getCallbackPayload();
        }

        return $data;
    }
}
