<?php

namespace App\Controller\Admin;

use App\Entity\AuditLog;
use App\Entity\Donation;
use App\Entity\Donor;
use App\Entity\Film;
use App\Entity\Screening;
use App\Entity\User;
use App\Form\CinemathequeSettingsType;
use App\Form\SpacesPageSettingsType;
use App\Repository\ArticleRepository;
use App\Repository\ArticleViewRepository;
use App\Repository\CinemathequeSettingsRepository;
use App\Repository\DonationRepository;
use App\Repository\FilmRepository;
use App\Repository\FilmViewRepository;
use App\Repository\ScreeningRepository;
use App\Repository\ScreeningViewRepository;
use App\Repository\SpacesPageSettingsRepository;
use App\Repository\TicketRepository;
use Doctrine\ORM\EntityManagerInterface;
use EasyCorp\Bundle\EasyAdminBundle\Config\Dashboard;
use EasyCorp\Bundle\EasyAdminBundle\Config\MenuItem;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractDashboardController;
use EasyCorp\Bundle\EasyAdminBundle\Router\AdminUrlGenerator;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

class DashboardController extends AbstractDashboardController
{
    public function __construct(
        private DonationRepository $donationRepository,
        private ArticleRepository $articleRepository,
        private ArticleViewRepository $articleViewRepository,
        private FilmRepository $filmRepository,
        private ScreeningRepository $screeningRepository,
        private FilmViewRepository $filmViewRepository,
        private ScreeningViewRepository $screeningViewRepository,
        private CinemathequeSettingsRepository $cinemathequeSettingsRepository,
        private SpacesPageSettingsRepository $spacesPageSettingsRepository,
        private TicketRepository $ticketRepository,
        private EntityManagerInterface $em,
        private AdminUrlGenerator $adminUrlGenerator,
        #[Autowire('%campaign.goal_usd%')]
        private float $campaignGoalUsd,
        #[Autowire('%kernel.project_dir%')]
        private string $projectDir,
    ) {}

    #[Route('/admin', name: 'admin')]
    public function index(): Response
    {
        // Cloisonnement : les gestionnaires de section (sans ROLE_ADMIN) n'ont
        // pas accès au tableau de bord collecte → on les envoie sur leur section.
        if (!$this->isGranted(User::ROLE_ADMIN)) {
            $crud = match (true) {
                $this->isGranted(User::ROLE_CONTENT) => \App\Controller\Admin\ActualiteCrudController::class,
                $this->isGranted(User::ROLE_ACTION_CULTURELLE) => \App\Controller\Admin\ProgramCrudController::class,
                $this->isGranted(User::ROLE_ACTUALITES) => \App\Controller\Admin\ArticleCrudController::class,
                $this->isGranted(User::ROLE_CINEMATHEQUE) => \App\Controller\Admin\FilmCrudController::class,
                $this->isGranted(User::ROLE_ESPACES) => \App\Controller\Admin\SpaceCrudController::class,
                default => null,
            };
            if ($crud !== null) {
                return $this->redirect(
                    $this->adminUrlGenerator->setController($crud)->generateUrl()
                );
            }
        }

        $stats = $this->donationRepository->campaignStats();
        $collected = $stats['collected'];
        $byStatus = $this->donationRepository->statusBreakdown();

        $totalCount = array_sum(array_map(static fn ($s) => $s['count'], $byStatus));
        $paidCount = $byStatus[Donation::STATUS_PAID]['count'] ?? 0;
        $failedCount = ($byStatus[Donation::STATUS_FAILED]['count'] ?? 0)
            + ($byStatus[Donation::STATUS_EXPIRED]['count'] ?? 0);
        $pendingCount = $byStatus[Donation::STATUS_PENDING]['count'] ?? 0;

        // Taux de succès : payés / (payés + échoués), en ignorant les "pending".
        $resolved = $paidCount + $failedCount;
        $successRate = $resolved > 0 ? round($paidCount / $resolved * 100, 1) : 0.0;
        $progress = $this->campaignGoalUsd > 0
            ? round(min(100, $collected / $this->campaignGoalUsd * 100), 2)
            : 0.0;

        return $this->render('admin/dashboard.html.twig', [
            'goal' => $this->campaignGoalUsd,
            'collected' => $collected,
            'progress' => $progress,
            'paidCount' => $paidCount,
            'pendingCount' => $pendingCount,
            'failedCount' => $failedCount,
            'totalCount' => $totalCount,
            'successRate' => $successRate,
            'byStatus' => $byStatus,
            'byOperator' => $this->donationRepository->paidByOperator(),
            'recent' => $this->donationRepository->findRecent(10),
        ]);
    }

    #[Route('/admin/article-stats', name: 'admin_article_stats')]
    #[IsGranted(User::ROLE_ACTUALITES)]
    public function articleStats(): Response
    {
        $topArticles = $this->articleRepository->findMostViewed(10);
        $totalViews = array_sum(array_map(
            static fn (\App\Entity\Article $a) => $a->getViewCount(),
            $this->articleRepository->findPublished()
        ));

        return $this->render('admin/article_stats.html.twig', [
            'totalViews' => $totalViews,
            'viewsToday' => $this->articleViewRepository->countSince(new \DateTimeImmutable('today')),
            'viewsThisWeek' => $this->articleViewRepository->countSince(new \DateTimeImmutable('-7 days')),
            'topArticles' => $topArticles,
            'dailyCounts' => $this->articleViewRepository->dailyCounts(14),
        ]);
    }

    #[Route('/admin/cinematheque-stats', name: 'admin_cinematheque_stats')]
    #[IsGranted(User::ROLE_CINEMATHEQUE)]
    public function cinemathequeStats(): Response
    {
        $totalFilmViews = array_sum(array_map(
            static fn (Film $f) => $f->getViewCount(),
            $this->filmRepository->findPublished()
        ));
        $totalScreeningViews = array_sum(array_map(
            static fn (Screening $s) => $s->getViewCount(),
            $this->screeningRepository->findUpcoming(1000)
        )) + array_sum(array_map(
            static fn (Screening $s) => $s->getViewCount(),
            $this->screeningRepository->findPast(1000)
        ));

        $filmDaily = $this->filmViewRepository->dailyCounts(14);
        $screeningDaily = $this->screeningViewRepository->dailyCounts(14);
        $dailyCounts = [];
        foreach ($filmDaily as $day => $count) {
            $dailyCounts[$day] = $count + ($screeningDaily[$day] ?? 0);
        }

        return $this->render('admin/cinematheque_stats.html.twig', [
            'totalViews' => $totalFilmViews + $totalScreeningViews,
            'viewsToday' => $this->filmViewRepository->countSince(new \DateTimeImmutable('today'))
                + $this->screeningViewRepository->countSince(new \DateTimeImmutable('today')),
            'viewsThisWeek' => $this->filmViewRepository->countSince(new \DateTimeImmutable('-7 days'))
                + $this->screeningViewRepository->countSince(new \DateTimeImmutable('-7 days')),
            'topFilms' => $this->filmRepository->findMostViewed(10),
            'topScreenings' => $this->screeningRepository->findMostViewed(10),
            'dailyCounts' => $dailyCounts,
        ]);
    }

    #[Route('/admin/billets-stats', name: 'admin_ticket_stats')]
    #[IsGranted(User::ROLE_CINEMATHEQUE)]
    public function ticketStats(): Response
    {
        $counts = $this->ticketRepository->countByStatus();
        $issued = array_sum($counts);

        return $this->render('admin/ticket_stats.html.twig', [
            'counts' => $counts,
            'issued' => $issued,
            'attendanceRate' => $issued > 0 ? round($counts['used'] / $issued * 100, 1) : 0.0,
            'dailyCounts' => $this->ticketRepository->dailyCounts(14),
            'byFilm' => $this->ticketRepository->rankingByFilm(10),
            'byScreening' => $this->ticketRepository->rankingByScreening(10),
        ]);
    }

    #[Route('/admin/scanner-billets', name: 'admin_ticket_scanner')]
    #[IsGranted(User::ROLE_CINEMATHEQUE)]
    public function ticketScanner(): Response
    {
        return $this->render('admin/ticket_scanner.html.twig');
    }

    #[Route('/admin/cinematheque-settings', name: 'admin_cinematheque_settings')]
    #[IsGranted(User::ROLE_CINEMATHEQUE)]
    public function cinemathequeSettings(Request $request): Response
    {
        $settings = $this->cinemathequeSettingsRepository->getOrCreate($this->em);

        $form = $this->createForm(CinemathequeSettingsType::class, $settings);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $this->em->flush();
            $this->addFlash('success', 'Réglages enregistrés.');

            return $this->redirectToRoute('admin_cinematheque_settings');
        }

        return $this->render('admin/cinematheque_settings.html.twig', [
            'form' => $form,
        ]);
    }

    #[Route('/admin/espaces-settings', name: 'admin_espaces_settings')]
    #[IsGranted(User::ROLE_ESPACES)]
    public function espacesSettings(Request $request): Response
    {
        $settings = $this->spacesPageSettingsRepository->getOrCreate($this->em);

        $form = $this->createForm(SpacesPageSettingsType::class, $settings);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            /** @var UploadedFile|null $file */
            $file = $form->get('heroBackgroundImageFile')->getData();
            if ($file) {
                $filename = sprintf('hero-espaces-%d.%s', time(), $file->guessExtension() ?: 'jpg');
                $file->move($this->projectDir . '/public/uploads/media', $filename);
                $settings->setHeroBackgroundImage($filename);
            }

            $this->em->flush();
            $this->addFlash('success', 'Réglages enregistrés.');

            return $this->redirectToRoute('admin_espaces_settings');
        }

        return $this->render('admin/espaces_settings.html.twig', [
            'form' => $form,
            'settings' => $settings,
        ]);
    }

    public function configureDashboard(): Dashboard
    {
        return Dashboard::new()
            ->setTitle('Grand Tambour — Administration')
            ->setFaviconPath('favicon.ico')
            ->renderContentMaximized();
    }

    public function configureMenuItems(): iterable
    {
        yield MenuItem::linkToDashboard('Tableau de bord', 'fa fa-chart-line')
            ->setPermission(User::ROLE_ADMIN);

        yield MenuItem::section('Collecte')->setPermission(User::ROLE_ADMIN);
        yield MenuItem::linkToCrud('Dons', 'fa fa-hand-holding-heart', Donation::class)
            ->setPermission(User::ROLE_ADMIN);
        yield MenuItem::linkToCrud('Donateurs', 'fa fa-users', Donor::class)
            ->setPermission(User::ROLE_ADMIN);

        yield MenuItem::section('Contenu')->setPermission(User::ROLE_CONTENT);
        yield MenuItem::linkToCrud('Hero — Page d\'accueil', 'fa fa-images', \App\Entity\HomeHeroSlide::class)
            ->setPermission(User::ROLE_CONTENT);
        yield MenuItem::linkToCrud('Newsletters', 'fa fa-envelope-open-text', \App\Entity\Actualite::class)
            ->setPermission(User::ROLE_CONTENT);
        yield MenuItem::linkToCrud('Événements', 'fa fa-calendar-days', \App\Entity\Event::class)
            ->setPermission(User::ROLE_CONTENT);
        yield MenuItem::linkToCrud('Bibliothèque média', 'fa fa-photo-film', \App\Entity\MediaAsset::class)
            ->setPermission(User::ROLE_CONTENT);
        yield MenuItem::linkToCrud('Catégories média', 'fa fa-tags', \App\Entity\MediaCategory::class)
            ->setPermission(User::ROLE_CONTENT);
        yield MenuItem::linkToCrud('Abonnés newsletter', 'fa fa-users', \App\Entity\NewsletterSubscriber::class)
            ->setPermission(User::ROLE_CONTENT);
        yield MenuItem::linkToCrud('Partenaires', 'fa fa-handshake', \App\Entity\Partner::class)
            ->setPermission(User::ROLE_CONTENT);
        yield MenuItem::linkToCrud('Messages de contact', 'fa fa-inbox', \App\Entity\ContactMessage::class)
            ->setPermission(User::ROLE_CONTENT);
        yield MenuItem::linkToCrud('Inscriptions aux événements', 'fa fa-user-check', \App\Entity\EventRegistration::class)
            ->setPermission(User::ROLE_CONTENT);

        yield MenuItem::section('Action culturelle')->setPermission(User::ROLE_ACTION_CULTURELLE);
        yield MenuItem::linkToCrud('Programmes internes', 'fa fa-masks-theater', \App\Entity\Program::class)
            ->setController(\App\Controller\Admin\InternalProgramCrudController::class)
            ->setPermission(User::ROLE_ACTION_CULTURELLE);
        yield MenuItem::linkToCrud('Programmes externes', 'fa fa-handshake', \App\Entity\Program::class)
            ->setController(\App\Controller\Admin\ExternalProgramCrudController::class)
            ->setPermission(User::ROLE_ACTION_CULTURELLE);
        yield MenuItem::linkToCrud('Rubriques', 'fa fa-layer-group', \App\Entity\ProgramCategory::class)
            ->setPermission(User::ROLE_ACTION_CULTURELLE);
        yield MenuItem::linkToCrud('Galerie', 'fa fa-images', \App\Entity\ProgramGalleryImage::class)
            ->setPermission(User::ROLE_ACTION_CULTURELLE);
        yield MenuItem::linkToCrud('Inscriptions (événements gratuits)', 'fa fa-user-check', \App\Entity\ProgramRegistration::class)
            ->setPermission(User::ROLE_ACTION_CULTURELLE);

        yield MenuItem::section('Actualités')->setPermission(User::ROLE_ACTUALITES);
        yield MenuItem::linkToCrud('Presse du Grand Tambour', 'fa fa-newspaper', \App\Entity\Article::class)
            ->setPermission(User::ROLE_ACTUALITES);
        yield MenuItem::linkToCrud('Catégories presse', 'fa fa-tags', \App\Entity\ArticleCategory::class)
            ->setPermission(User::ROLE_ACTUALITES);
        yield MenuItem::linkToCrud('Commentaires', 'fa fa-comments', \App\Entity\Comment::class)
            ->setPermission(User::ROLE_ACTUALITES);
        yield MenuItem::linkToRoute('Statistiques de lecture', 'fa fa-chart-column', 'admin_article_stats')
            ->setPermission(User::ROLE_ACTUALITES);

        yield MenuItem::section('Cinémathèque')->setPermission(User::ROLE_CINEMATHEQUE);
        yield MenuItem::linkToCrud('Films', 'fa fa-film', \App\Entity\Film::class)
            ->setPermission(User::ROLE_CINEMATHEQUE);
        yield MenuItem::linkToCrud('Genres', 'fa fa-tags', \App\Entity\FilmCategory::class)
            ->setPermission(User::ROLE_CINEMATHEQUE);
        yield MenuItem::linkToCrud('Galerie', 'fa fa-images', \App\Entity\FilmGalleryImage::class)
            ->setPermission(User::ROLE_CINEMATHEQUE);
        yield MenuItem::linkToCrud('Projections', 'fa fa-clapperboard', \App\Entity\Screening::class)
            ->setPermission(User::ROLE_CINEMATHEQUE);
        yield MenuItem::linkToCrud('Inscriptions (séances gratuites)', 'fa fa-user-check', \App\Entity\ScreeningRegistration::class)
            ->setPermission(User::ROLE_CINEMATHEQUE);
        yield MenuItem::linkToCrud('Billets Cinéma', 'fa fa-ticket', \App\Entity\Ticket::class)
            ->setPermission(User::ROLE_CINEMATHEQUE);
        yield MenuItem::linkToRoute('Scanner un billet', 'fa fa-qrcode', 'admin_ticket_scanner')
            ->setPermission(User::ROLE_CINEMATHEQUE);
        yield MenuItem::linkToRoute('Statistiques billets', 'fa fa-chart-pie', 'admin_ticket_stats')
            ->setPermission(User::ROLE_CINEMATHEQUE);
        yield MenuItem::linkToRoute('Statistiques', 'fa fa-chart-column', 'admin_cinematheque_stats')
            ->setPermission(User::ROLE_CINEMATHEQUE);
        yield MenuItem::linkToRoute('Réglages billetterie', 'fa fa-gear', 'admin_cinematheque_settings')
            ->setPermission(User::ROLE_CINEMATHEQUE);

        yield MenuItem::section('Espaces du Grand Tambour')->setPermission(User::ROLE_ESPACES);
        yield MenuItem::linkToCrud('Espaces', 'fa fa-door-open', \App\Entity\Space::class)
            ->setPermission(User::ROLE_ESPACES);
        yield MenuItem::linkToCrud('Types d\'espaces', 'fa fa-tags', \App\Entity\SpaceCategory::class)
            ->setPermission(User::ROLE_ESPACES);
        yield MenuItem::linkToCrud('Galerie', 'fa fa-images', \App\Entity\SpaceGalleryImage::class)
            ->setPermission(User::ROLE_ESPACES);
        yield MenuItem::linkToRoute('Réglages page Espaces', 'fa fa-gear', 'admin_espaces_settings')
            ->setPermission(User::ROLE_ESPACES);

        yield MenuItem::section('Administration')->setPermission(User::ROLE_SUPER_ADMIN);
        yield MenuItem::linkToCrud('Utilisateurs', 'fa fa-user-shield', User::class)
            ->setPermission(User::ROLE_SUPER_ADMIN);
        yield MenuItem::linkToCrud('Journal d\'audit', 'fa fa-clipboard-list', AuditLog::class)
            ->setPermission(User::ROLE_SUPER_ADMIN);

        yield MenuItem::section();
        yield MenuItem::linkToUrl('Voir le site', 'fa fa-external-link-alt', 'https://centreculturel.cd/');
        yield MenuItem::linkToUrl('Voir la documentation', 'fa fa-external-link-alt', '/api/doc');
        yield MenuItem::linkToLogout('Déconnexion', 'fa fa-sign-out-alt');
    }
}
