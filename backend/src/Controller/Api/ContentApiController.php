<?php

namespace App\Controller\Api;

use App\Entity\Actualite;
use App\Entity\Article;
use App\Entity\ArticleCategory;
use App\Entity\ContactMessage;
use App\Entity\Event;
use App\Entity\EventRegistration;
use App\Entity\HomeHeroSlide;
use App\Entity\MediaAsset;
use App\Entity\MediaCategory;
use App\Entity\NewsletterSubscriber;
use App\Entity\Partner;
use App\Entity\Program;
use App\Entity\ProgramCategory;
use App\Entity\ProgramGalleryImage;
use App\Entity\ProgramRegistration;
use App\Enum\ActualiteType;
use App\Enum\ProgramScope;
use App\Repository\ActualiteRepository;
use App\Repository\ArticleCategoryRepository;
use App\Repository\ArticleRepository;
use App\Repository\EventRepository;
use App\Repository\HomeHeroSlideRepository;
use App\Repository\MediaAssetRepository;
use App\Repository\MediaCategoryRepository;
use App\Repository\NewsletterSubscriberRepository;
use App\Repository\PartnerRepository;
use App\Repository\ProgramCategoryRepository;
use App\Repository\ProgramRepository;
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
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

/**
 * API publique de contenu éditorial (consommée par le site Next.js).
 * Ne renvoie que les contenus publiés.
 */
#[Route('/api/content', name: 'api_content_')]
#[OA\Tag(name: 'Contenu')]
class ContentApiController extends AbstractController
{
    #[OA\Get(summary: 'Liste des actualités publiées')]
    #[OA\Parameter(name: 'type', in: 'query', description: 'ARTICLE ou NEWSLETTER', schema: new OA\Schema(type: 'string'))]
    #[OA\Parameter(name: 'page', in: 'query', schema: new OA\Schema(type: 'integer', default: 1))]
    #[OA\Parameter(name: 'perPage', in: 'query', description: 'Taille de page (1 à 50)', schema: new OA\Schema(type: 'integer', default: 12))]
    #[Route('/actualites', name: 'actualites', methods: ['GET'])]
    public function actualites(Request $request, ActualiteRepository $repo): JsonResponse
    {
        $type = ActualiteType::tryFrom((string) $request->query->get('type', ''));
        $result = $repo->findPublished(
            $type,
            (int) $request->query->get('page', 1),
            (int) $request->query->get('perPage', 12)
        );
        $base = $request->getSchemeAndHttpHost();

        return $this->json([
            'data' => array_map(fn (Actualite $a) => $this->actualiteView($a, $base, false), $result['items']),
            'meta' => $this->meta($result),
        ]);
    }

    #[OA\Get(summary: 'Détail d\'une actualité publiée')]
    #[OA\Parameter(name: 'slug', in: 'path', required: true, schema: new OA\Schema(type: 'string'))]
    #[OA\Response(response: 404, description: 'Introuvable')]
    #[Route('/actualites/{slug}', name: 'actualite_detail', methods: ['GET'])]
    public function actualite(string $slug, Request $request, ActualiteRepository $repo): JsonResponse
    {
        $a = $repo->findOnePublishedBySlug($slug);
        if (!$a) {
            return $this->json(['error' => 'Actualité introuvable.'], Response::HTTP_NOT_FOUND);
        }

        return $this->json(['data' => $this->actualiteView($a, $request->getSchemeAndHttpHost(), true)]);
    }

    #[OA\Get(summary: 'Liste des événements publiés')]
    #[OA\Parameter(name: 'page', in: 'query', schema: new OA\Schema(type: 'integer', default: 1))]
    #[Route('/events', name: 'events', methods: ['GET'])]
    public function events(Request $request, EventRepository $repo): JsonResponse
    {
        $result = $repo->findPublished((int) $request->query->get('page', 1));
        $base = $request->getSchemeAndHttpHost();

        return $this->json([
            'data' => array_map(fn (Event $e) => $this->eventView($e, $base, false), $result['items']),
            'meta' => $this->meta($result),
        ]);
    }

    #[OA\Get(summary: 'Détail d\'un événement publié')]
    #[OA\Parameter(name: 'slug', in: 'path', required: true, schema: new OA\Schema(type: 'string'))]
    #[OA\Response(response: 404, description: 'Introuvable')]
    #[Route('/events/{slug}', name: 'event_detail', methods: ['GET'])]
    public function event(string $slug, Request $request, EventRepository $repo): JsonResponse
    {
        $e = $repo->findOnePublishedBySlug($slug);
        if (!$e) {
            return $this->json(['error' => 'Événement introuvable.'], Response::HTTP_NOT_FOUND);
        }

        return $this->json(['data' => $this->eventView($e, $request->getSchemeAndHttpHost(), true)]);
    }

    #[OA\Post(summary: 'Inscription anonyme à un événement d\'agenda (quand les inscriptions sont ouvertes)')]
    #[OA\Parameter(name: 'slug', in: 'path', required: true, schema: new OA\Schema(type: 'string'))]
    #[OA\RequestBody(required: true, content: new OA\JsonContent(
        required: ['firstName', 'lastName', 'email'],
        properties: [
            new OA\Property(property: 'firstName', type: 'string'),
            new OA\Property(property: 'lastName', type: 'string'),
            new OA\Property(property: 'email', type: 'string'),
            new OA\Property(property: 'phone', type: 'string'),
            new OA\Property(property: 'message', type: 'string'),
        ],
    ))]
    #[OA\Response(response: 200, description: 'Inscription enregistrée')]
    #[OA\Response(response: 400, description: 'Inscriptions fermées ou événement déjà passé')]
    #[OA\Response(response: 404, description: 'Introuvable')]
    #[OA\Response(response: 422, description: 'Données invalides')]
    #[Route('/events/{slug}/register', name: 'event_register', methods: ['POST'])]
    public function registerForEvent(
        string $slug,
        Request $request,
        EventRepository $repo,
        EntityManagerInterface $em,
        ValidatorInterface $validator,
        MailerInterface $mailer,
        LoggerInterface $logger,
        #[Autowire('%env(MAILER_FROM_ADDRESS)%')] string $notifyAddress,
        #[Autowire('%env(MAILER_FROM_NAME)%')] string $notifyName,
    ): JsonResponse {
        $event = $repo->findOnePublishedBySlug($slug);
        if (!$event) {
            return $this->json(['error' => 'Événement introuvable.'], Response::HTTP_NOT_FOUND);
        }
        if (!$event->isRegistrationOpen()) {
            return $this->json(['error' => 'Les inscriptions sont fermées pour cet événement.'], Response::HTTP_BAD_REQUEST);
        }
        $reference = $event->getEndsAt() ?? $event->getStartsAt();
        if ($reference !== null && $reference < new \DateTimeImmutable()) {
            return $this->json(['error' => 'Cet événement est déjà passé.'], Response::HTTP_BAD_REQUEST);
        }

        $payload = json_decode($request->getContent(), true) ?? [];

        $registration = new EventRegistration();
        $registration->setEvent($event);
        $registration->setFirstName(trim((string) ($payload['firstName'] ?? '')));
        $registration->setLastName(trim((string) ($payload['lastName'] ?? '')));
        $registration->setEmail(strtolower(trim((string) ($payload['email'] ?? ''))));
        $registration->setPhone(!empty($payload['phone']) ? trim((string) $payload['phone']) : null);
        $registration->setMessage(!empty($payload['message']) ? trim((string) $payload['message']) : null);

        if (count($validator->validate($registration)) > 0) {
            return $this->json(['error' => 'Inscription invalide. Vérifiez les champs requis.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $em->persist($registration);
        $em->flush();

        // Notification e-mail à l'adresse du centre (réponse directe possible).
        try {
            $email = (new Email())
                ->from(new Address($notifyAddress, $notifyName))
                ->to(new Address($notifyAddress, $notifyName))
                ->replyTo(new Address($registration->getEmail(), $registration->getFullName()))
                ->subject('Nouvelle inscription — ' . $event->getTitle())
                ->text(sprintf(
                    "Nouvelle inscription à l'événement « %s ».\n\nDe      : %s\nE-mail  : %s\nTél.    : %s\n\nMessage :\n%s",
                    $event->getTitle(),
                    $registration->getFullName(),
                    $registration->getEmail(),
                    $registration->getPhone() ?: '—',
                    $registration->getMessage() ?: '—'
                ));
            $mailer->send($email);
        } catch (\Throwable $e) {
            $logger->warning('Notification d\'inscription événement non envoyée', ['error' => $e->getMessage()]);
        }

        return $this->json(['data' => ['status' => 'registered']]);
    }

    #[OA\Get(summary: 'Bibliothèque média (galerie publique), filtrable et paginée')]
    #[OA\Parameter(name: 'category', in: 'query', description: 'Slug de catégorie (ex. « concert »). Répétable (category[]=concert&category[]=danse) : les catégories sont alors combinées en OU.', schema: new OA\Schema(type: 'string'))]
    #[OA\Parameter(name: 'search', in: 'query', description: 'Recherche sur le nom, la légende et le texte alternatif', schema: new OA\Schema(type: 'string'))]
    #[OA\Parameter(name: 'year', in: 'query', description: 'Année de l\'événement', schema: new OA\Schema(type: 'integer'))]
    #[OA\Parameter(name: 'month', in: 'query', description: 'Mois de l\'événement (1 à 12)', schema: new OA\Schema(type: 'integer'))]
    #[OA\Parameter(name: 'page', in: 'query', schema: new OA\Schema(type: 'integer', default: 1))]
    #[OA\Parameter(name: 'perPage', in: 'query', description: 'Taille de page (1 à 100)', schema: new OA\Schema(type: 'integer', default: 24))]
    #[Route('/media', name: 'media', methods: ['GET'])]
    public function media(Request $request, MediaAssetRepository $repo): JsonResponse
    {
        $month = (int) $request->query->get('month', 0);

        // « category » accepte une valeur simple (?category=concert) ou répétée
        // (?category[]=concert&category[]=danse) : le site coche plusieurs cases
        // de filtre, on combine alors les catégories en OU.
        $rawCategories = $request->query->all()['category'] ?? null;
        $categories = [];
        foreach (is_array($rawCategories) ? $rawCategories : [$rawCategories] as $slug) {
            $slug = trim((string) $slug);
            if ($slug !== '') {
                $categories[] = $slug;
            }
        }

        $result = $repo->findForGallery(
            $categories,
            trim((string) $request->query->get('search')) ?: null,
            (int) $request->query->get('year') ?: null,
            ($month >= 1 && $month <= 12) ? $month : null,
            (int) $request->query->get('page', 1),
            (int) $request->query->get('perPage', 24),
        );
        $base = $request->getSchemeAndHttpHost();

        return $this->json([
            'data' => array_map(function (MediaAsset $m) use ($base) {
                $category = $m->getCategory();

                return [
                    'id' => $m->getId(),
                    'name' => $m->getName(),
                    'url' => $m->getPath() ? $base . '/uploads/' . $m->getPath() : null,
                    'alt' => $m->getAlt(),
                    'caption' => $m->getCaption(),
                    'category' => $category?->getName(),
                    'categorySlug' => $category?->getSlug(),
                    'eventDate' => $m->getEventDate()?->format('Y-m-d'),
                ];
            }, $result['items']),
            'meta' => $this->meta($result),
        ]);
    }

    #[OA\Get(summary: 'Catégories de la médiathèque (filtres) et années disponibles')]
    #[OA\Parameter(
        name: 'all',
        in: 'query',
        description: '1 pour inclure les catégories sans aucun média (par défaut, seules celles qui donnent des résultats sont renvoyées)',
        schema: new OA\Schema(type: 'integer')
    )]
    #[Route('/media-categories', name: 'media_categories', methods: ['GET'])]
    public function mediaCategories(
        Request $request,
        MediaCategoryRepository $repo,
        MediaAssetRepository $mediaRepo,
    ): JsonResponse {
        // Par défaut on n'expose que les catégories réellement utilisées : le site
        // n'affiche ainsi jamais un filtre qui ne renverrait aucune image.
        if ($request->query->getBoolean('all')) {
            $categories = array_map(
                static fn (MediaCategory $c) => ['category' => $c, 'total' => 0],
                $repo->findAllOrdered()
            );
        } else {
            $categories = $repo->findUsedWithCounts();
        }

        return $this->json([
            'data' => array_map(static fn (array $row) => [
                'slug' => $row['category']->getSlug(),
                'name' => $row['category']->getName(),
                'total' => $row['total'],
            ], $categories),
            'meta' => ['years' => $mediaRepo->findEventYears()],
        ]);
    }

    #[OA\Get(summary: 'Rubriques de l\'action culturelle')]
    #[Route('/program-categories', name: 'program_categories', methods: ['GET'])]
    public function programCategories(Request $request, ProgramCategoryRepository $repo): JsonResponse
    {
        $base = $request->getSchemeAndHttpHost();

        return $this->json([
            'data' => array_map(
                fn (ProgramCategory $c) => $this->categoryView($c, $base),
                $repo->findPublishedOrdered()
            ),
        ]);
    }

    #[OA\Get(summary: 'Liste des programmes publiés')]
    #[OA\Parameter(name: 'category', in: 'query', description: 'Slug de rubrique', schema: new OA\Schema(type: 'string'))]
    #[OA\Parameter(name: 'featured', in: 'query', description: '1 pour les programmes à la une', schema: new OA\Schema(type: 'integer'))]
    #[OA\Parameter(name: 'scope', in: 'query', description: 'interne ou externe', schema: new OA\Schema(type: 'string'))]
    #[Route('/programs', name: 'programs', methods: ['GET'])]
    public function programs(Request $request, ProgramRepository $repo): JsonResponse
    {
        $category = $request->query->get('category') ?: null;
        $featured = $request->query->getBoolean('featured');
        $scope = ProgramScope::tryFrom((string) $request->query->get('scope', ''));
        $base = $request->getSchemeAndHttpHost();

        return $this->json([
            'data' => array_map(
                fn (Program $p) => $this->programView($p, $base),
                $repo->findPublished($category, $featured, $scope)
            ),
        ]);
    }

    #[OA\Get(summary: 'Détail d\'un programme publié')]
    #[OA\Parameter(name: 'slug', in: 'path', required: true, schema: new OA\Schema(type: 'string'))]
    #[OA\Response(response: 404, description: 'Introuvable')]
    #[Route('/programs/{slug}', name: 'program_detail', methods: ['GET'])]
    public function program(string $slug, Request $request, ProgramRepository $repo): JsonResponse
    {
        $p = $repo->findOnePublishedBySlug($slug);
        if (!$p) {
            return $this->json(['error' => 'Programme introuvable.'], Response::HTTP_NOT_FOUND);
        }

        return $this->json(['data' => $this->programView($p, $request->getSchemeAndHttpHost())]);
    }

    #[OA\Post(summary: 'Inscription à un événement externe gratuit')]
    #[OA\Parameter(name: 'slug', in: 'path', required: true, schema: new OA\Schema(type: 'string'))]
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
    #[OA\Response(response: 400, description: 'Événement payant : pas d\'inscription possible')]
    #[OA\Response(response: 404, description: 'Introuvable')]
    #[OA\Response(response: 422, description: 'Données invalides')]
    #[Route('/programs/{slug}/register', name: 'program_register', methods: ['POST'])]
    public function registerToProgram(
        string $slug,
        Request $request,
        ProgramRepository $repo,
        EntityManagerInterface $em,
        ValidatorInterface $validator,
        MailerInterface $mailer,
        LoggerInterface $logger,
        #[Autowire('%env(MAILER_FROM_ADDRESS)%')] string $notifyAddress,
        #[Autowire('%env(MAILER_FROM_NAME)%')] string $notifyName,
    ): JsonResponse {
        $p = $repo->findOnePublishedBySlug($slug);
        if (!$p) {
            return $this->json(['error' => 'Événement introuvable.'], Response::HTTP_NOT_FOUND);
        }
        if (!$p->isFree()) {
            return $this->json(['error' => 'Cet événement est payant : utilisez le lien de billetterie.'], Response::HTTP_BAD_REQUEST);
        }

        $payload = json_decode($request->getContent(), true) ?? [];

        $registration = new ProgramRegistration();
        $registration->setProgram($p);
        $registration->setFirstName(trim((string) ($payload['firstName'] ?? '')));
        $registration->setLastName(trim((string) ($payload['lastName'] ?? '')));
        $registration->setEmail(strtolower(trim((string) ($payload['email'] ?? ''))));
        $registration->setPhone(!empty($payload['phone']) ? trim((string) $payload['phone']) : null);
        $registration->setNumberOfSeats(!empty($payload['numberOfSeats']) ? (int) $payload['numberOfSeats'] : null);
        $registration->setMessage(!empty($payload['message']) ? trim((string) $payload['message']) : null);

        if (count($validator->validate($registration)) > 0) {
            return $this->json(['error' => 'Inscription invalide. Vérifiez les champs requis.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $em->persist($registration);
        $em->flush();

        try {
            $email = (new Email())
                ->from(new Address($notifyAddress, $notifyName))
                ->to(new Address($notifyAddress, $notifyName))
                ->replyTo(new Address($registration->getEmail(), $registration->getFullName()))
                ->subject('Nouvelle inscription — ' . $p->getTitle())
                ->text(sprintf(
                    "Nouvelle inscription à l'événement « %s ».\n\nDe      : %s\nE-mail  : %s\nTél.    : %s\nPlaces  : %s\n\nMessage :\n%s",
                    $p->getTitle(),
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

        return $this->json(['data' => ['status' => 'registered']]);
    }

    #[OA\Get(summary: 'Rubriques de la presse')]
    #[Route('/article-categories', name: 'article_categories', methods: ['GET'])]
    public function articleCategories(ArticleCategoryRepository $repo): JsonResponse
    {
        return $this->json([
            'data' => array_map(
                fn (ArticleCategory $c) => ['slug' => $c->getSlug(), 'name' => $c->getName()],
                $repo->findAllOrdered()
            ),
        ]);
    }

    #[OA\Get(summary: 'Liste des articles de presse publiés')]
    #[OA\Parameter(name: 'category', in: 'query', description: 'Slug de rubrique', schema: new OA\Schema(type: 'string'))]
    #[OA\Parameter(name: 'featured', in: 'query', description: '1 pour les articles à la une', schema: new OA\Schema(type: 'integer'))]
    #[Route('/articles', name: 'articles', methods: ['GET'])]
    public function articles(Request $request, ArticleRepository $repo): JsonResponse
    {
        $category = $request->query->get('category') ?: null;
        $featured = $request->query->getBoolean('featured');
        $base = $request->getSchemeAndHttpHost();

        return $this->json([
            'data' => array_map(
                fn (Article $a) => $this->articleView($a, $base, false),
                $repo->findPublished($category, $featured)
            ),
        ]);
    }

    #[OA\Get(summary: 'Détail d\'un article de presse publié')]
    #[OA\Parameter(name: 'slug', in: 'path', required: true, schema: new OA\Schema(type: 'string'))]
    #[OA\Response(response: 404, description: 'Introuvable')]
    #[Route('/articles/{slug}', name: 'article_detail', methods: ['GET'])]
    public function article(string $slug, Request $request, ArticleRepository $repo): JsonResponse
    {
        $a = $repo->findOnePublishedBySlug($slug);
        if (!$a) {
            return $this->json(['error' => 'Article introuvable.'], Response::HTTP_NOT_FOUND);
        }

        return $this->json(['data' => $this->articleView($a, $request->getSchemeAndHttpHost(), true)]);
    }

    #[OA\Get(summary: 'Partenaires actifs (« Ils nous accompagnent »)')]
    #[Route('/partners', name: 'partners', methods: ['GET'])]
    public function partners(Request $request, PartnerRepository $repo): JsonResponse
    {
        $base = $request->getSchemeAndHttpHost();

        return $this->json([
            'data' => array_map(fn (Partner $p) => [
                'name' => $p->getName(),
                'logo' => $this->mediaUrl($p->getLogo(), $base),
                'url' => $p->getUrl(),
            ], $repo->findActiveOrdered()),
        ]);
    }

    #[OA\Get(summary: 'Diapositives publiées du Hero de la page d\'accueil')]
    #[Route('/home-hero-slides', name: 'home_hero_slides', methods: ['GET'])]
    public function homeHeroSlides(Request $request, HomeHeroSlideRepository $repo): JsonResponse
    {
        $base = $request->getSchemeAndHttpHost();

        return $this->json([
            'data' => array_map(fn (HomeHeroSlide $s) => [
                'id' => $s->getId(),
                'title' => $s->getTitle(),
                'subtitle' => $s->getSubtitle(),
                'description' => $s->getDescription(),
                'buttonText' => $s->getButtonText(),
                'buttonLink' => $s->getButtonLink(),
                'image' => $this->mediaUrl($s->getImage(), $base),
                'order' => $s->getPosition(),
                'isActive' => true,
                'createdAt' => $s->getCreatedAt()->format(\DateTimeInterface::ATOM),
                'updatedAt' => $s->getUpdatedAt()->format(\DateTimeInterface::ATOM),
                'publishedAt' => $s->getPublishedAt()?->format(\DateTimeInterface::ATOM),
            ], $repo->findPublishedOrdered()),
        ]);
    }

    #[OA\Post(summary: 'Envoi d\'un message de contact (formulaire /infos)')]
    #[OA\RequestBody(required: true, content: new OA\JsonContent(
        required: ['firstName', 'lastName', 'email', 'message'],
        properties: [
            new OA\Property(property: 'firstName', type: 'string'),
            new OA\Property(property: 'lastName', type: 'string'),
            new OA\Property(property: 'email', type: 'string'),
            new OA\Property(property: 'phone', type: 'string'),
            new OA\Property(property: 'subject', type: 'string'),
            new OA\Property(property: 'message', type: 'string'),
        ],
    ))]
    #[OA\Response(response: 200, description: 'Message reçu')]
    #[OA\Response(response: 422, description: 'Données invalides')]
    #[Route('/contact', name: 'contact', methods: ['POST'])]
    public function contact(
        Request $request,
        EntityManagerInterface $em,
        ValidatorInterface $validator,
        MailerInterface $mailer,
        LoggerInterface $logger,
        #[Autowire('%env(MAILER_FROM_ADDRESS)%')] string $notifyAddress,
        #[Autowire('%env(MAILER_FROM_NAME)%')] string $notifyName,
    ): JsonResponse {
        $payload = json_decode($request->getContent(), true) ?? [];

        $contact = new ContactMessage();
        $contact->setFirstName(trim((string) ($payload['firstName'] ?? '')));
        $contact->setLastName(trim((string) ($payload['lastName'] ?? '')));
        $contact->setEmail(strtolower(trim((string) ($payload['email'] ?? ''))));
        $contact->setPhone(!empty($payload['phone']) ? trim((string) $payload['phone']) : null);
        $contact->setSubject(!empty($payload['subject']) ? trim((string) $payload['subject']) : null);
        $contact->setMessage(trim((string) ($payload['message'] ?? '')));

        if (count($validator->validate($contact)) > 0) {
            return $this->json(['error' => 'Message invalide. Vérifiez les champs requis.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $em->persist($contact);
        $em->flush();

        // Notification e-mail à l'adresse du centre (réponse directe possible).
        try {
            $email = (new Email())
                ->from(new Address($notifyAddress, $notifyName))
                ->to(new Address($notifyAddress, $notifyName))
                ->replyTo(new Address($contact->getEmail(), $contact->getFullName()))
                ->subject('Nouveau message de contact — ' . ($contact->getSubject() ?: 'Site web'))
                ->text($this->contactEmailBody($contact))
                ->html($this->contactEmailHtml($contact));
            $mailer->send($email);
        } catch (\Throwable $e) {
            // L'échec d'envoi ne bloque pas l'enregistrement (visible au dashboard).
            $logger->warning('Notification de contact non envoyée', ['error' => $e->getMessage()]);
        }

        return $this->json(['data' => ['status' => 'received']]);
    }

    private function contactEmailBody(ContactMessage $c): string
    {
        return implode("\n", [
            'Nouveau message depuis le formulaire de contact du site.',
            '',
            'De      : ' . $c->getFullName(),
            'E-mail  : ' . $c->getEmail(),
            'Tél.    : ' . ($c->getPhone() ?: '—'),
            'Sujet   : ' . ($c->getSubject() ?: '—'),
            '',
            'Message :',
            $c->getMessage(),
        ]);
    }

    private function contactEmailHtml(ContactMessage $c): string
    {
        $e = fn (?string $v) => htmlspecialchars((string) $v, ENT_QUOTES, 'UTF-8');

        return '<div style="font-family:Arial,sans-serif;font-size:14px;color:#333">'
            . '<h2 style="color:#CD935B;margin:0 0 12px">Nouveau message de contact</h2>'
            . '<p><strong>De :</strong> ' . $e($c->getFullName()) . '<br>'
            . '<strong>E-mail :</strong> ' . $e($c->getEmail()) . '<br>'
            . '<strong>Téléphone :</strong> ' . $e($c->getPhone() ?: '—') . '<br>'
            . '<strong>Sujet :</strong> ' . $e($c->getSubject() ?: '—') . '</p>'
            . '<p style="white-space:pre-wrap;border-left:3px solid #CD935B;padding-left:12px">'
            . nl2br($e($c->getMessage())) . '</p></div>';
    }

    #[OA\Post(summary: 'Inscription à la newsletter')]
    #[OA\RequestBody(required: true, content: new OA\JsonContent(
        required: ['email'],
        properties: [
            new OA\Property(property: 'email', type: 'string', example: 'donateur@example.com'),
            new OA\Property(property: 'name', type: 'string', example: 'Jean Dupont'),
        ],
    ))]
    #[OA\Response(response: 200, description: 'Inscrit (idempotent)')]
    #[OA\Response(response: 422, description: 'E-mail invalide')]
    #[Route('/newsletter/subscribe', name: 'newsletter_subscribe', methods: ['POST'])]
    public function subscribe(
        Request $request,
        NewsletterSubscriberRepository $repo,
        EntityManagerInterface $em,
        ValidatorInterface $validator,
    ): JsonResponse {
        $payload = json_decode($request->getContent(), true);
        $email = strtolower(trim((string) ($payload['email'] ?? '')));

        $existing = $repo->findOneByEmail($email);
        if ($existing) {
            // Réactive si l'abonné s'était désinscrit ; idempotent sinon.
            if (!$existing->isActive()) {
                $existing->setIsActive(true);
                $em->flush();
            }

            return $this->json(['data' => ['status' => 'subscribed']]);
        }

        $subscriber = new NewsletterSubscriber();
        $subscriber->setEmail($email);
        if (!empty($payload['name'])) {
            $subscriber->setName(trim((string) $payload['name']));
        }
        $subscriber->setSource('site');

        if (count($validator->validate($subscriber)) > 0) {
            return $this->json(['error' => 'Adresse e-mail invalide.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $em->persist($subscriber);
        $em->flush();

        return $this->json(['data' => ['status' => 'subscribed']]);
    }

    /** @param array{total:int,page:int,perPage:int,pages:int} $r @return array<string,int> */
    private function meta(array $r): array
    {
        return ['total' => $r['total'], 'page' => $r['page'], 'perPage' => $r['perPage'], 'pages' => $r['pages']];
    }

    /**
     * Résout une URL d'image :
     *  - null si vide ;
     *  - telle quelle si déjà absolue (http) ou chemin site (« /images/... » servi par le front) ;
     *  - sinon considérée comme un fichier uploadé → {base}/uploads/media/{nom}.
     */
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

    /** @return array<string,mixed> */
    private function categoryView(ProgramCategory $c, string $base): array
    {
        return [
            'slug' => $c->getSlug(),
            'title' => $c->getTitle(),
            'description' => $c->getDescription(),
            'image' => $this->mediaUrl($c->getCoverImage(), $base),
            'color' => $c->getColorGradient(),
        ];
    }

    /** @return array<string,mixed> */
    private function programView(Program $p, string $base): array
    {
        $category = $p->getCategory();
        $space = $p->getSpace();

        return [
            'slug' => $p->getSlug(),
            'title' => $p->getTitle(),
            'category' => $category?->getTitle(),
            'categorySlug' => $category?->getSlug(),
            'organizer' => $p->getOrganizer(),
            'externalUrl' => $p->getExternalUrl(),
            'slogan' => $p->getSlogan(),
            'description' => $p->getDescription(),
            'objectif' => $p->getObjectif(),
            'publicVise' => $p->getPublicVise(),
            'impact' => $p->getImpact(),
            'image' => $this->mediaUrl($p->getCoverImage(), $base),
            'discipline' => $p->getDiscipline(),
            'scope' => $p->getScope()->value,
            'period' => $p->getPeriod(),
            'location' => $p->getLocation(),
            'startsAt' => $p->getStartsAt()?->format(\DateTimeInterface::ATOM),
            'endsAt' => $p->getEndsAt()?->format(\DateTimeInterface::ATOM),
            'featured' => $p->isFeatured(),
            'isFree' => $p->isFree(),
            'spaceName' => $space?->getName(),
            'spaceSlug' => $space?->getSlug(),
            'gallery' => array_map(fn (ProgramGalleryImage $g) => [
                'image' => $this->mediaUrl($g->getImage(), $base),
                'caption' => $g->getCaption(),
            ], $p->getGalleryImages()->toArray()),
        ];
    }

    /** @return array<string,mixed> */
    private function articleView(Article $a, string $base, bool $full): array
    {
        $category = $a->getCategory();
        $image = $this->mediaUrl($a->getImage(), $base);
        $data = [
            'slug' => $a->getSlug(),
            'title' => $a->getTitle(),
            'excerpt' => $a->getExcerpt(),
            'category' => $category?->getName(),
            'categorySlug' => $category?->getSlug(),
            'author' => $a->getAuthor(),
            'image' => $image,
            'coverImage' => $this->mediaUrl($a->getCoverImage(), $base) ?? $image,
            'readingTime' => $a->getReadingTime(),
            'featured' => $a->isFeatured(),
            'publishedAt' => $a->getPublishedAt()?->format(\DateTimeInterface::ATOM),
            'viewCount' => $a->getViewCount(),
        ];
        if ($full) {
            $data['content'] = $a->getContent();
        }

        return $data;
    }

    /** @return array<string,mixed> */
    private function actualiteView(Actualite $a, string $base, bool $full): array
    {
        $data = [
            'slug' => $a->getSlug(),
            'title' => $a->getTitle(),
            'type' => $a->getType()->value,
            'summary' => $a->getSummary(),
            'coverImage' => $a->getCoverImagePath() ? $base . '/uploads/' . $a->getCoverImagePath() : null,
            'pdf' => $a->getPdfPath() ? $base . '/uploads/' . $a->getPdfPath() : null,
            'mois' => $a->getMois(),
            'annee' => $a->getAnnee(),
            'isFeatured' => $a->isFeatured(),
            'publishedAt' => $a->getPublishedAt()?->format(\DateTimeInterface::ATOM),
        ];
        if ($full) {
            $data['content'] = $a->getContent();
        }

        return $data;
    }

    /** @return array<string,mixed> */
    private function eventView(Event $e, string $base, bool $full): array
    {
        $data = [
            'slug' => $e->getSlug(),
            'title' => $e->getTitle(),
            'category' => $e->getCategory(),
            'location' => $e->getLocation(),
            'organizer' => $e->getOrganizer(),
            'featured' => $e->isFeatured(),
            'isRegistrationOpen' => $e->isRegistrationOpen(),
            'coverImage' => $e->getCoverImagePath() ? $base . '/uploads/' . $e->getCoverImagePath() : null,
            'startsAt' => $e->getStartsAt()?->format(\DateTimeInterface::ATOM),
            'endsAt' => $e->getEndsAt()?->format(\DateTimeInterface::ATOM),
            'startTime' => $e->getStartTime(),
            'endTime' => $e->getEndTime(),
            'publishedAt' => $e->getPublishedAt()?->format(\DateTimeInterface::ATOM),
        ];
        if ($full) {
            $data['description'] = $e->getDescription();
        }

        return $data;
    }
}
