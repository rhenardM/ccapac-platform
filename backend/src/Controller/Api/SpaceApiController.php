<?php

namespace App\Controller\Api;

use App\Entity\Space;
use App\Entity\SpaceGalleryImage;
use App\Repository\SpaceCategoryRepository;
use App\Repository\SpaceRepository;
use App\Repository\SpacesPageSettingsRepository;
use Doctrine\ORM\EntityManagerInterface;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

/**
 * API publique du module Espaces du Grand Tambour. Ne renvoie que les
 * espaces actifs.
 */
#[Route('/api/espaces', name: 'api_espaces_')]
#[OA\Tag(name: 'Espaces du Grand Tambour')]
class SpaceApiController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private SpaceRepository $spaceRepository,
        private SpaceCategoryRepository $spaceCategoryRepository,
        private SpacesPageSettingsRepository $settingsRepository,
    ) {}

    #[OA\Get(summary: 'Liste des espaces actifs')]
    #[Route('/spaces', name: 'spaces', methods: ['GET'])]
    public function spaces(Request $request): JsonResponse
    {
        $base = $request->getSchemeAndHttpHost();

        return $this->json([
            'data' => array_map(
                fn (Space $s) => $this->spaceView($s, $base, false),
                $this->spaceRepository->findActive()
            ),
        ]);
    }

    #[OA\Get(summary: 'Détail d\'un espace actif (avec sa galerie)')]
    #[OA\Parameter(name: 'slug', in: 'path', required: true, schema: new OA\Schema(type: 'string'))]
    #[OA\Response(response: 404, description: 'Introuvable')]
    #[Route('/spaces/{slug}', name: 'space_detail', methods: ['GET'])]
    public function space(string $slug, Request $request): JsonResponse
    {
        $space = $this->spaceRepository->findOneActiveBySlug($slug);
        if (!$space) {
            return $this->json(['error' => 'Espace introuvable.'], Response::HTTP_NOT_FOUND);
        }

        return $this->json(['data' => $this->spaceView($space, $request->getSchemeAndHttpHost(), true)]);
    }

    #[OA\Get(summary: 'Types d\'espaces')]
    #[Route('/categories', name: 'categories', methods: ['GET'])]
    public function categories(): JsonResponse
    {
        return $this->json([
            'data' => array_map(
                fn ($c) => ['slug' => $c->getSlug(), 'name' => $c->getName(), 'icon' => $c->getIcon()],
                $this->spaceCategoryRepository->findAllOrdered()
            ),
        ]);
    }

    #[OA\Get(summary: 'Contenu du hero de la page Espaces')]
    #[Route('/settings', name: 'settings', methods: ['GET'])]
    public function settings(Request $request): JsonResponse
    {
        $settings = $this->settingsRepository->getOrCreate($this->em);
        $base = $request->getSchemeAndHttpHost();

        return $this->json(['data' => [
            'heroKicker' => $settings->getHeroKicker(),
            'heroTitle' => $settings->getHeroTitle(),
            'introText' => $settings->getIntroText(),
            'heroBackgroundImage' => $this->mediaUrl($settings->getHeroBackgroundImage(), $base),
        ]]);
    }

    /** @return array<string,mixed> */
    private function spaceView(Space $s, string $base, bool $full): array
    {
        $category = $s->getCategory();

        $data = [
            'slug' => $s->getSlug(),
            'name' => $s->getName(),
            'shortDescription' => $s->getShortDescription(),
            'category' => $category?->getName(),
            'categoryIcon' => $category?->getIcon(),
            'coverImage' => $this->mediaUrl($s->getCoverImage(), $base),
            'capacity' => $s->getCapacity(),
        ];

        if ($full) {
            $data['fullDescription'] = $s->getFullDescription();
            $data['surfaceM2'] = $s->getSurfaceM2();
            $data['seatedCapacity'] = $s->getSeatedCapacity();
            $data['standingCapacity'] = $s->getStandingCapacity();
            $data['hasPmrAccess'] = $s->hasPmrAccess();
            $data['hasAirConditioning'] = $s->hasAirConditioning();
            $data['hasSoundSystem'] = $s->hasSoundSystem();
            $data['hasProfessionalLighting'] = $s->hasProfessionalLighting();
            $data['hasWifi'] = $s->hasWifi();
            $data['hasParking'] = $s->hasParking();
            $data['usageConditions'] = $s->getUsageConditions();
            $data['isBookable'] = $s->isBookable();
            $data['bookingUrl'] = $s->getBookingUrl();
            $data['quoteRequestUrl'] = $s->getQuoteRequestUrl();
            $data['contactName'] = $s->getContactName();
            $data['contactEmail'] = $s->getContactEmail();
            $data['contactPhone'] = $s->getContactPhone();
            $data['gallery'] = array_map(
                fn (SpaceGalleryImage $g) => [
                    'image' => $this->mediaUrl($g->getImage(), $base),
                    'caption' => $g->getCaption(),
                ],
                $s->getGalleryImages()->toArray()
            );
        }

        return $data;
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
