<?php

namespace App\Controller\Api;

use App\Dto\DonationRequest;
use App\Dto\DonationView;
use App\Exception\PaymentException;
use App\Repository\DonationRepository;
use App\Service\Payment\DonationService;
use Nelmio\ApiDocBundle\Attribute\Model;
use OpenApi\Attributes as OA;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\Exception\ExceptionInterface as SerializerException;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/fundraising/donations', name: 'api_fundraising_donations_')]
#[OA\Tag(name: 'Dons')]
class DonationController extends AbstractController
{
    /** Exemple de représentation d'un don (champ `data` des réponses). */
    private const EXAMPLE_DONATION = [
        'reference' => 'GT-DON-2026-AB7K9P',
        'status' => 'pending',
        'amount' => '50.00',
        'currency' => 'USD',
        'tier' => 'ami_citoyen',
        'tierLabel' => 'Ami & Citoyen',
        'operator' => 'DRC_MPESA',
        'operatorLabel' => 'M-Pesa',
        'makutaTransactionId' => '0197cb6f-776f-7df0-9535-96082bbff7f9',
        'redirectUrl' => null,
        'requiresOtp' => false,
        'message' => null,
        'createdAt' => '2026-06-20T14:30:00+00:00',
        'confirmedAt' => null,
    ];

    public function __construct(
        private DonationService $donationService,
        private DonationRepository $donationRepository,
        private SerializerInterface $serializer,
        private ValidatorInterface $validator,
        private LoggerInterface $logger,
        #[Autowire(service: 'limiter.donation_limiter')]
        private RateLimiterFactory $donationLimiter,
    ) {}

    /**
     * Crée un don et initie le paiement Makuta.
     */
    #[OA\Post(
        summary: 'Créer un don et initier le paiement',
        description: 'Crée le donateur (réutilisé par e-mail) et le don, puis initie la transaction Makuta. '
            . 'Selon la réponse : Mobile Money → poller le statut ; `requiresOtp=true` → confirmer l’OTP ; '
            . '`redirectUrl` renseigné (Visa CNP) → rediriger le navigateur vers cette URL.',
    )]
    #[OA\RequestBody(required: true, content: new Model(type: DonationRequest::class))]
    #[OA\Response(
        response: 201,
        description: 'Don créé, paiement initié',
        content: new OA\JsonContent(properties: [
            new OA\Property(property: 'data', type: 'object', example: self::EXAMPLE_DONATION),
        ]),
    )]
    #[OA\Response(response: 400, description: 'Corps JSON invalide')]
    #[OA\Response(response: 422, description: 'Données invalides ou paiement refusé (voir `error`, `code`, `field`)')]
    #[OA\Response(response: 429, description: 'Trop de tentatives (limite par IP)')]
    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        // Anti-abus : limite par IP.
        $limiter = $this->donationLimiter->create($request->getClientIp() ?? 'anon');
        if (!$limiter->consume(1)->isAccepted()) {
            return $this->json(['error' => 'Trop de tentatives. Réessayez dans quelques minutes.'], Response::HTTP_TOO_MANY_REQUESTS);
        }

        try {
            $dto = $this->serializer->deserialize($request->getContent(), DonationRequest::class, 'json');
        } catch (SerializerException $e) {
            return $this->json(['error' => 'Requête JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $violations = $this->validator->validate($dto);
        if (count($violations) > 0) {
            $fields = [];
            foreach ($violations as $v) {
                $fields[$v->getPropertyPath()] = $v->getMessage();
            }

            return $this->json(['error' => 'Données invalides.', 'fields' => $fields], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        try {
            $donation = $this->donationService->createDonation($dto);
        } catch (PaymentException $e) {
            return $this->json([
                'error' => $e->getMessage(),
                'code' => $e->getErrorCode(),
                'field' => $e->getField(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        } catch (\Throwable $e) {
            $this->logger->error('Erreur création de don', ['error' => $e->getMessage()]);

            return $this->json(['error' => 'Une erreur interne est survenue.'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        return $this->json(['data' => DonationView::fromEntity($donation)], Response::HTTP_CREATED);
    }

    /**
     * Confirme une transaction par OTP (DRC_RAKKACASH).
     */
    #[OA\Post(
        summary: 'Confirmer un code OTP (Rakkacash)',
        description: 'Valide le code OTP reçu par SMS pour un don en attente, puis rafraîchit son statut.',
    )]
    #[OA\Parameter(name: 'reference', in: 'path', required: true, description: 'Référence du don', schema: new OA\Schema(type: 'string'), example: 'GT-DON-2026-AB7K9P')]
    #[OA\RequestBody(required: true, content: new OA\JsonContent(
        required: ['otpCode'],
        properties: [new OA\Property(property: 'otpCode', type: 'string', example: '256532')],
    ))]
    #[OA\Response(
        response: 200,
        description: 'Statut rafraîchi',
        content: new OA\JsonContent(properties: [
            new OA\Property(property: 'data', type: 'object', example: self::EXAMPLE_DONATION),
        ]),
    )]
    #[OA\Response(response: 404, description: 'Don introuvable')]
    #[OA\Response(response: 422, description: 'Code OTP manquant, invalide ou expiré')]
    #[Route('/{reference}/confirm-otp', name: 'confirm_otp', methods: ['POST'])]
    public function confirmOtp(string $reference, Request $request): JsonResponse
    {
        $donation = $this->donationRepository->findByReference($reference);
        if (!$donation) {
            return $this->json(['error' => 'Don introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $payload = json_decode($request->getContent(), true) ?? [];
        $otpCode = isset($payload['otpCode']) ? trim((string) $payload['otpCode']) : '';
        if ($otpCode === '') {
            return $this->json(['error' => 'Le code OTP est requis.', 'field' => 'otpCode'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        try {
            $donation = $this->donationService->confirmOtp($donation, $otpCode);
        } catch (PaymentException $e) {
            return $this->json([
                'error' => $e->getMessage(),
                'code' => $e->getErrorCode(),
                'field' => $e->getField(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        return $this->json(['data' => DonationView::fromEntity($donation)]);
    }
}
