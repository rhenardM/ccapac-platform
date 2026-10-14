<?php

namespace App\Controller\Api;

use App\Entity\Screening;
use App\Entity\ScreeningRegistration;
use App\Entity\ScreeningView;
use App\Enum\RegistrationSource;
use App\Repository\CinemathequeSettingsRepository;
use App\Repository\ScreeningRepository;
use App\Repository\ScreeningViewRepository;
use App\Service\Notification\TicketMailer;
use App\Service\Ticketing\TicketService;
use Doctrine\ORM\EntityManagerInterface;
use OpenApi\Attributes as OA;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

/**
 * API publique du module Cinémathèque — projections, toutes confondues
 * (widgets « prochaines séances » / « séances passées » / vedette).
 */
#[Route('/api/cinematheque', name: 'api_cinematheque_')]
#[OA\Tag(name: 'Cinémathèque')]
class ScreeningApiController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private ScreeningRepository $screeningRepository,
        private ScreeningViewRepository $screeningViewRepository,
        private CinemathequeSettingsRepository $settingsRepository,
        #[Autowire(service: 'limiter.screening_view_limiter')]
        private RateLimiterFactory $viewLimiter,
        #[Autowire('%env(APP_SECRET)%')]
        private string $appSecret,
    ) {}

    #[OA\Get(summary: 'Liste des projections (à venir ou passées)')]
    #[OA\Parameter(name: 'when', in: 'query', description: '"upcoming" (défaut) ou "past"', schema: new OA\Schema(type: 'string'))]
    #[OA\Parameter(name: 'featured', in: 'query', description: '1 pour les séances en vedette', schema: new OA\Schema(type: 'integer'))]
    #[OA\Parameter(name: 'limit', in: 'query', schema: new OA\Schema(type: 'integer', default: 10))]
    #[Route('/screenings', name: 'screenings', methods: ['GET'])]
    public function screenings(Request $request): JsonResponse
    {
        $when = $request->query->get('when', 'upcoming');
        $featuredOnly = $request->query->getBoolean('featured');
        $limit = max(1, min(50, (int) $request->query->get('limit', 10)));
        $base = $request->getSchemeAndHttpHost();

        $screenings = $when === 'past'
            ? $this->screeningRepository->findPast($limit)
            : $this->screeningRepository->findUpcoming($limit, $featuredOnly);

        return $this->json([
            'data' => array_map(fn (Screening $s) => $this->screeningView($s, $base), $screenings),
        ]);
    }

    #[OA\Post(summary: 'Comptabilise une consultation de projection (une par visiteur/30 min)')]
    #[OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))]
    #[OA\Response(response: 404, description: 'Projection introuvable')]
    #[Route('/screenings/{id}/view', name: 'screening_view', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function view(int $id, Request $request): JsonResponse
    {
        $screening = $this->screeningRepository->find($id);
        if (!$screening || !$screening->isVisible()) {
            return $this->json(['error' => 'Projection introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $ipHash = hash('sha256', ($request->getClientIp() ?? 'anon') . $this->appSecret);

        $limiter = $this->viewLimiter->create($ipHash);
        if (!$limiter->consume(1)->isAccepted()) {
            return $this->json(['error' => 'Trop de requêtes.'], Response::HTTP_TOO_MANY_REQUESTS);
        }

        $since = new \DateTimeImmutable('-30 minutes');
        if (!$this->screeningViewRepository->hasRecentView($screening, $ipHash, $since)) {
            $view = new ScreeningView();
            $view->setScreening($screening);
            $view->setIpHash($ipHash);
            $screening->incrementViewCount();

            $this->em->persist($view);
            $this->em->flush();
        }

        return $this->json(['data' => ['viewCount' => $screening->getViewCount()]]);
    }

    #[OA\Post(summary: 'Inscription à une séance gratuite')]
    #[OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))]
    #[OA\RequestBody(required: true, content: new OA\JsonContent(
        required: ['firstName', 'lastName', 'email'],
        properties: [
            new OA\Property(property: 'firstName', type: 'string'),
            new OA\Property(property: 'lastName', type: 'string'),
            new OA\Property(property: 'email', type: 'string'),
            new OA\Property(property: 'phone', type: 'string'),
            new OA\Property(property: 'numberOfSeats', type: 'integer'),
            new OA\Property(property: 'message', type: 'string'),
        ],
    ))]
    #[OA\Response(response: 200, description: 'Inscription enregistrée')]
    #[OA\Response(response: 400, description: 'Séance payante : pas d\'inscription possible')]
    #[OA\Response(response: 404, description: 'Introuvable')]
    #[OA\Response(response: 422, description: 'Données invalides')]
    #[Route('/screenings/{id}/register', name: 'screening_register', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function register(
        int $id,
        Request $request,
        ValidatorInterface $validator,
        MailerInterface $mailer,
        LoggerInterface $logger,
        TicketService $ticketService,
        TicketMailer $ticketMailer,
        #[Autowire('%env(MAILER_FROM_ADDRESS)%')] string $notifyAddress,
        #[Autowire('%env(MAILER_FROM_NAME)%')] string $notifyName,
    ): JsonResponse {
        $screening = $this->screeningRepository->find($id);
        if (!$screening || !$screening->isVisible()) {
            return $this->json(['error' => 'Séance introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $payload = json_decode($request->getContent(), true) ?? [];

        // L'e-mail est facultatif sur l'entité (inscriptions au guichet, cf.
        // ScreeningRegistrationCrudController), mais reste exigé ici : c'est
        // le seul canal anonyme/en ligne, sans billet remis en main propre.
        if (empty($payload['email'])) {
            return $this->json(['error' => 'L\'adresse e-mail est obligatoire.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $registration = new ScreeningRegistration();
        $registration->setScreening($screening);
        $registration->setSource(RegistrationSource::ONLINE);
        $registration->setFirstName(trim((string) ($payload['firstName'] ?? '')));
        $registration->setLastName(trim((string) ($payload['lastName'] ?? '')));
        $registration->setEmail(strtolower(trim((string) $payload['email'])));
        $registration->setPhone(!empty($payload['phone']) ? trim((string) $payload['phone']) : null);
        $registration->setNumberOfSeats(!empty($payload['numberOfSeats']) ? (int) $payload['numberOfSeats'] : null);
        $registration->setMessage(!empty($payload['message']) ? trim((string) $payload['message']) : null);
        $registration->setGender(!empty($payload['gender']) ? trim((string) $payload['gender']) : null);
        $registration->setAgeRange(!empty($payload['ageRange']) ? trim((string) $payload['ageRange']) : null);

        if (count($validator->validate($registration)) > 0) {
            return $this->json(['error' => 'Inscription invalide. Vérifiez les champs requis.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $this->em->persist($registration);
        $this->em->flush();

        $base = $request->getSchemeAndHttpHost();
        $ticket = null;
        $rawToken = null;
        try {
            [$ticket, $rawToken] = $ticketService->generateForRegistration($registration, $base);
        } catch (\Throwable $e) {
            // La génération du billet ne doit jamais faire échouer l'inscription
            // elle-même : le participant reste inscrit même si le billet doit
            // être régénéré manuellement ensuite (cf. action admin "Régénérer").
            $logger->error('Génération du billet échouée', [
                'registrationId' => $registration->getId(),
                'error' => $e->getMessage(),
            ]);
        }

        // --- Notification STAFF (existante, inchangée) ---
        try {
            $film = $screening->getFilm();
            $email = (new Email())
                ->from(new Address($notifyAddress, $notifyName))
                ->to(new Address($notifyAddress, $notifyName))
                ->replyTo(new Address($registration->getEmail(), $registration->getFullName()))
                ->subject('Nouvelle inscription — ' . ($film?->getTitle() ?? 'Séance'))
                ->text(sprintf(
                    "Nouvelle inscription à la séance « %s » du %s.\n\nDe      : %s\nE-mail  : %s\nTél.    : %s\nPlaces  : %s\n\nMessage :\n%s",
                    $film?->getTitle() ?? 'Séance',
                    $screening->getScheduledDate()?->format('d/m/Y') ?? '',
                    $registration->getFullName(),
                    $registration->getEmail(),
                    $registration->getPhone() ?: '—',
                    $registration->getNumberOfSeats() ?? '—',
                    $registration->getMessage() ?: '—'
                ));
            $mailer->send($email);
        } catch (\Throwable $e) {
            $logger->warning('Notification d\'inscription non envoyée', ['error' => $e->getMessage()]);
        }

        // --- Nouvelle notification PARTICIPANT avec billet PDF joint ---
        if ($ticket !== null && $rawToken !== null) {
            try {
                $ticketMailer->sendTicketConfirmation($registration, $ticket, $rawToken, $base);
            } catch (\Throwable $e) {
                $logger->warning('E-mail de confirmation de billet non envoyé', ['error' => $e->getMessage()]);
            }
        }

        return $this->json(['data' => [
            'status' => 'registered',
            'ticketReference' => $ticket?->getTicketNumber(),
            'ticketToken' => $rawToken,
            'ticketViewUrl' => $ticket !== null
                ? sprintf('/cinematheque/billet/%s?t=%s', $ticket->getTicketNumber(), $rawToken)
                : null,
        ]]);
    }

    /** @return array<string,mixed> */
    private function screeningView(Screening $s, string $base): array
    {
        $film = $s->getFilm();

        return [
            'id' => $s->getId(),
            'filmSlug' => $film?->getSlug(),
            'filmTitle' => $film?->getTitle(),
            'filmPoster' => $this->mediaUrl($film?->getPoster(), $base),
            'date' => $s->getScheduledDate()?->format('Y-m-d'),
            'startTime' => $s->getStartTime()?->format('H:i'),
            'endTime' => $s->getEndTime()?->format('H:i'),
            'venue' => $s->getVenue(),
            'description' => $s->getDescription(),
            'status' => $s->getStatus()->value,
            'featured' => $s->isFeatured(),
            'capacityTotal' => $s->getCapacityTotal(),
            'capacityTaken' => $s->getCapacityTaken(),
            'isFree' => $s->isFree(),
            'price' => $s->getPrice(),
            'viewCount' => $s->getViewCount(),
            'bookingUrl' => $this->settingsRepository->getOrCreate($this->em)->getBookingUrl(),
        ];
    }

    private function mediaUrl(?string $value, string $base): ?string
    {
        if (!$value) {
            return null;
        }
        if (str_starts_with($value, 'http') || str_starts_with($value, '/')) {
            return $value;
        }

        return $base . '/uploads/media/' . $value;
    }
}
