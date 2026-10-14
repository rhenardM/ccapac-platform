<?php

namespace App\Controller\Api;

use App\Entity\Film;
use App\Entity\FilmGalleryImage;
use App\Entity\FilmView;
use App\Entity\Screening;
use App\Repository\CinemathequeSettingsRepository;
use App\Repository\FilmCategoryRepository;
use App\Repository\FilmRepository;
use App\Repository\FilmViewRepository;
use App\Repository\ScreeningRepository;
use Doctrine\ORM\EntityManagerInterface;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\Routing\Attribute\Route;

/**
 * API publique du module Cinémathèque — films et catégories.
 * Ne renvoie que les films publiés et non archivés.
 */
#[Route('/api/cinematheque', name: 'api_cinematheque_')]
#[OA\Tag(name: 'Cinémathèque')]
class FilmApiController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private FilmRepository $filmRepository,
        private FilmCategoryRepository $filmCategoryRepository,
        private ScreeningRepository $screeningRepository,
        private FilmViewRepository $filmViewRepository,
        private CinemathequeSettingsRepository $settingsRepository,
        #[Autowire(service: 'limiter.film_view_limiter')]
        private RateLimiterFactory $viewLimiter,
        #[Autowire('%env(APP_SECRET)%')]
        private string $appSecret,
    ) {}

    #[OA\Get(summary: 'Liste des films publiés')]
    #[OA\Parameter(name: 'category', in: 'query', description: 'Slug de catégorie/genre', schema: new OA\Schema(type: 'string'))]
    #[OA\Parameter(name: 'search', in: 'query', description: 'Recherche sur le titre', schema: new OA\Schema(type: 'string'))]
    #[Route('/films', name: 'films', methods: ['GET'])]
    public function films(Request $request): JsonResponse
    {
        $category = $request->query->get('category') ?: null;
        $search = $request->query->get('search') ?: null;
        $base = $request->getSchemeAndHttpHost();

        $films = $this->filmRepository->findPublished($category, $search);

        return $this->json([
            'data' => array_map(fn (Film $f) => $this->filmView($f, $base, false), $films),
        ]);
    }

    #[OA\Get(summary: 'Détail d\'un film publié (avec sa galerie et ses projections)')]
    #[OA\Parameter(name: 'slug', in: 'path', required: true, schema: new OA\Schema(type: 'string'))]
    #[OA\Response(response: 404, description: 'Introuvable')]
    #[Route('/films/{slug}', name: 'film_detail', methods: ['GET'])]
    public function film(string $slug, Request $request): JsonResponse
    {
        $film = $this->filmRepository->findOnePublishedBySlug($slug);
        if (!$film) {
            return $this->json(['error' => 'Film introuvable.'], Response::HTTP_NOT_FOUND);
        }

        return $this->json(['data' => $this->filmView($film, $request->getSchemeAndHttpHost(), true)]);
    }

    #[OA\Get(summary: 'Catégories / genres de films')]
    #[Route('/categories', name: 'film_categories', methods: ['GET'])]
    public function categories(): JsonResponse
    {
        return $this->json([
            'data' => array_map(
                fn ($c) => ['slug' => $c->getSlug(), 'name' => $c->getName()],
                $this->filmCategoryRepository->findAllOrdered()
            ),
        ]);
    }

    #[OA\Post(summary: 'Comptabilise une consultation de film (une par visiteur/30 min)')]
    #[OA\Parameter(name: 'slug', in: 'path', required: true, schema: new OA\Schema(type: 'string'))]
    #[OA\Response(response: 404, description: 'Film introuvable')]
    #[Route('/films/{slug}/view', name: 'film_view', methods: ['POST'])]
    public function view(string $slug, Request $request): JsonResponse
    {
        $film = $this->filmRepository->findOnePublishedBySlug($slug);
        if (!$film) {
            return $this->json(['error' => 'Film introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $ipHash = hash('sha256', ($request->getClientIp() ?? 'anon') . $this->appSecret);

        $limiter = $this->viewLimiter->create($ipHash);
        if (!$limiter->consume(1)->isAccepted()) {
            return $this->json(['error' => 'Trop de requêtes.'], Response::HTTP_TOO_MANY_REQUESTS);
        }

        $since = new \DateTimeImmutable('-30 minutes');
        if (!$this->filmViewRepository->hasRecentView($film, $ipHash, $since)) {
            $view = new FilmView();
            $view->setFilm($film);
            $view->setIpHash($ipHash);
            $film->incrementViewCount();

            $this->em->persist($view);
            $this->em->flush();
        }

        return $this->json(['data' => ['viewCount' => $film->getViewCount()]]);
    }

    /** @return array<string,mixed> */
    private function filmView(Film $f, string $base, bool $full): array
    {
        $categories = array_map(
            fn ($c) => $c->getName(),
            $f->getCategories()->toArray()
        );

        $data = [
            'slug' => $f->getSlug(),
            'title' => $f->getTitle(),
            'director' => $f->getDirector(),
            'country' => $f->getCountry(),
            'year' => $f->getYear(),
            'duration' => $f->getDuration(),
            'language' => $f->getLanguage(),
            'ageRating' => $f->getAgeRating(),
            'categories' => $categories,
            'poster' => $this->mediaUrl($f->getPoster(), $base),
            'viewCount' => $f->getViewCount(),
        ];

        if ($full) {
            $data['synopsis'] = $f->getSynopsis();
            $data['cast'] = $f->getCast();
            $data['trailerUrl'] = $f->getTrailerUrl();
            $data['backdrop'] = $this->mediaUrl($f->getBackdrop(), $base) ?? $data['poster'];
            $data['gallery'] = array_map(
                fn (FilmGalleryImage $g) => [
                    'image' => $this->mediaUrl($g->getImage(), $base),
                    'caption' => $g->getCaption(),
                ],
                $f->getGalleryImages()->toArray()
            );
            $data['screenings'] = array_map(
                fn ($s) => $this->screeningView($s, $base),
                $this->screeningRepository->findForFilm($f)
            );
        } else {
            $upcoming = array_values(array_filter(
                $f->getScreenings()->toArray(),
                fn ($s) => $s->isVisible() && !$s->isCancelled() && $s->getScheduledDate() >= new \DateTimeImmutable('today')
            ));
            usort($upcoming, fn ($a, $b) => $a->getScheduledDate() <=> $b->getScheduledDate());
            $next = $upcoming[0] ?? null;
            $data['nextScreeningDate'] = $next?->getScheduledDate()?->format('Y-m-d');
            $data['nextScreeningTime'] = $next?->getStartTime()?->format('H:i');
        }

        return $data;
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
