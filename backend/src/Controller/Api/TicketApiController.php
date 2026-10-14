<?php

namespace App\Controller\Api;

use App\Entity\Ticket;
use App\Repository\TicketRepository;
use App\Service\Audit\AuditLogger;
use App\Service\Ticketing\TicketService;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\Routing\Attribute\Route;

/**
 * API publique de consultation/téléchargement d'un billet numérique.
 * Accès protégé par un jeton (query « token »), pas par la seule référence
 * (un numéro de billet séquentiel est énumérable) : voir resolveTicketOrFail().
 */
#[Route('/api/cinematheque/tickets', name: 'api_cinematheque_tickets_')]
#[OA\Tag(name: 'Billets Cinémathèque')]
class TicketApiController extends AbstractController
{
    public function __construct(
        private TicketRepository $ticketRepository,
        private TicketService $ticketService,
        private AuditLogger $auditLogger,
    ) {
    }

    #[OA\Get(summary: 'Détail public d\'un billet (nécessite le jeton reçu à l\'inscription)')]
    #[OA\Parameter(name: 'reference', in: 'path', required: true, schema: new OA\Schema(type: 'string'))]
    #[OA\Parameter(name: 'token', in: 'query', required: true, schema: new OA\Schema(type: 'string'))]
    #[OA\Response(response: 404, description: 'Billet introuvable ou jeton invalide')]
    #[Route('/{reference}', name: 'show', methods: ['GET'])]
    public function show(string $reference, Request $request): JsonResponse
    {
        $ticket = $this->resolveTicketOrFail($reference, $request);
        $base = $request->getSchemeAndHttpHost();
        $token = (string) $request->query->get('token', '');

        $registration = $ticket->getRegistration();
        $screening = $ticket->getScreening();
        $film = $screening?->getFilm();

        return $this->json(['data' => [
            'ticketNumber' => $ticket->getTicketNumber(),
            'status' => $ticket->getStatus()->value,
            'statusLabel' => $ticket->getStatus()->label(),
            'generatedAt' => $ticket->getGeneratedAt()->format(\DateTimeInterface::ATOM),
            'participantName' => $registration?->getFullName(),
            'registrationDate' => $registration?->getCreatedAt()->format(\DateTimeInterface::ATOM),
            'film' => [
                'title' => $film?->getTitle(),
                'poster' => $this->mediaUrl($film?->getPoster(), $base),
                'language' => $film?->getLanguage(),
                'director' => $film?->getDirector(),
            ],
            'screening' => [
                'date' => $screening?->getScheduledDate()?->format('Y-m-d'),
                'startTime' => $screening?->getStartTime()?->format('H:i'),
                'venue' => $screening?->getVenue(),
            ],
            'qrCodeUrl' => $base . $this->generateUrl('api_cinematheque_tickets_qr', ['reference' => $reference])
                . '?token=' . urlencode($token),
        ]]);
    }

    #[OA\Get(summary: 'Télécharge le PDF du billet')]
    #[OA\Parameter(name: 'reference', in: 'path', required: true, schema: new OA\Schema(type: 'string'))]
    #[OA\Parameter(name: 'token', in: 'query', required: true, schema: new OA\Schema(type: 'string'))]
    #[OA\Response(response: 404, description: 'Billet ou PDF introuvable')]
    #[Route('/{reference}/download', name: 'download', methods: ['GET'])]
    public function download(string $reference, Request $request): BinaryFileResponse
    {
        $ticket = $this->resolveTicketOrFail($reference, $request);
        $path = $this->ticketService->absolutePdfPath($ticket);
        if (!$path || !is_file($path)) {
            throw $this->createNotFoundException('PDF introuvable pour ce billet.');
        }

        $response = new BinaryFileResponse($path);
        $response->setContentDisposition(ResponseHeaderBag::DISPOSITION_ATTACHMENT, $ticket->getTicketNumber() . '.pdf');
        $response->headers->set('Cache-Control', 'private, no-store');

        return $response;
    }

    #[OA\Get(summary: 'Sert l\'image QR du billet')]
    #[OA\Parameter(name: 'reference', in: 'path', required: true, schema: new OA\Schema(type: 'string'))]
    #[OA\Parameter(name: 'token', in: 'query', required: true, schema: new OA\Schema(type: 'string'))]
    #[OA\Response(response: 404, description: 'Billet ou QR introuvable')]
    #[Route('/{reference}/qr', name: 'qr', methods: ['GET'])]
    public function qr(string $reference, Request $request): BinaryFileResponse
    {
        $ticket = $this->resolveTicketOrFail($reference, $request);
        $path = $this->ticketService->absoluteQrPath($ticket);
        if (!$path || !is_file($path)) {
            throw $this->createNotFoundException('QR Code introuvable pour ce billet.');
        }

        $response = new BinaryFileResponse($path);
        $response->headers->set('Content-Type', 'image/svg+xml');
        $response->headers->set('Cache-Control', 'private, no-store');

        return $response;
    }

    #[OA\Get(summary: 'Page de contrôle à l\'entrée (ouverte en scannant le QR Code du billet)')]
    #[OA\Parameter(name: 'reference', in: 'path', required: true, schema: new OA\Schema(type: 'string'))]
    #[OA\Parameter(name: 'token', in: 'query', required: true, schema: new OA\Schema(type: 'string'))]
    #[OA\Response(response: 200, description: 'Page HTML : infos du billet + bouton de validation')]
    #[OA\Response(response: 404, description: 'Billet introuvable ou jeton invalide')]
    #[Route('/{reference}/validate', name: 'validate', methods: ['GET', 'POST'])]
    public function validate(string $reference, Request $request): Response
    {
        $ticket = $this->resolveTicketOrFail($reference, $request);

        $justChecked = false;
        if ($request->isMethod('POST')) {
            $justChecked = $this->ticketService->markAsUsed($ticket);
            if ($justChecked) {
                $this->auditLogger->log(
                    'ticket.scan_checkin',
                    'Billet validé à l\'entrée (scan QR Code)',
                    'Ticket',
                    (string) $ticket->getId()
                );
            }
        }

        $registration = $ticket->getRegistration();
        $screening = $ticket->getScreening();

        return $this->render('ticket/scan.html.twig', [
            'ticket' => $ticket,
            'registration' => $registration,
            'screening' => $screening,
            'film' => $screening?->getFilm(),
            'token' => (string) $request->query->get('token', ''),
            'justChecked' => $justChecked,
        ]);
    }

    /**
     * Retourne toujours 404 (jamais 403) pour une référence inconnue OU un
     * jeton invalide/manquant : sinon, énumérer CCD-2026-000001..999999 sans
     * le jeton permettrait de distinguer les références réelles des fausses.
     */
    private function resolveTicketOrFail(string $reference, Request $request): Ticket
    {
        $ticket = $this->ticketRepository->findOneByReference($reference);
        $token = (string) $request->query->get('token', '');

        if (!$ticket || !$this->ticketService->verifyToken($ticket, $token)) {
            throw $this->createNotFoundException('Billet introuvable.');
        }

        return $ticket;
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
