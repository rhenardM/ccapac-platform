<?php

namespace App\Controller\Admin;

use App\Repository\NewsletterSubscriberRepository;
use App\Service\Audit\AuditLogger;
use App\Service\Newsletter\NewsletterImporter;
use App\Service\Newsletter\NewsletterMailer;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Outils newsletter du back-office : import CSV, export CSV, envoi de campagne.
 * Sous /admin (protégé par le pare-feu + ROLE_ADMIN).
 */
#[Route('/admin/newsletter')]
#[IsGranted('ROLE_CONTENT')]
class NewsletterAdminController extends AbstractController
{
    public function __construct(
        private NewsletterSubscriberRepository $subscriberRepository,
        private NewsletterMailer $newsletterMailer,
        private NewsletterImporter $importer,
        private AuditLogger $auditLogger,
    ) {}

    #[Route('/import', name: 'admin_newsletter_import', methods: ['GET', 'POST'])]
    public function import(Request $request): Response
    {
        if ($request->isMethod('POST')) {
            if (!$this->isCsrfTokenValid('newsletter_import', (string) $request->request->get('_token'))) {
                $this->addFlash('danger', 'Jeton CSRF invalide.');

                return $this->redirectToRoute('admin_newsletter_import');
            }

            $file = $request->files->get('csv');
            if (!$file || !$file->isValid()) {
                $this->addFlash('danger', 'Veuillez sélectionner un fichier CSV valide.');

                return $this->redirectToRoute('admin_newsletter_import');
            }

            $r = $this->importer->importFile($file->getPathname());

            $this->auditLogger->log('newsletter.import', sprintf('Import CSV : %d ajoutés, %d mis à jour', $r['created'], $r['updated']), 'NewsletterSubscriber');
            $this->addFlash('success', sprintf('Import terminé : %d ajouté(s), %d mis à jour, %d ignoré(s).', $r['created'], $r['updated'], $r['skipped']));

            return $this->redirectToRoute('admin_newsletter_import');
        }

        return $this->render('admin/newsletter/import.html.twig', [
            'count' => $this->subscriberRepository->count([]),
        ]);
    }

    #[Route('/export', name: 'admin_newsletter_export', methods: ['GET'])]
    public function export(): StreamedResponse
    {
        $subscribers = $this->subscriberRepository->findBy([], ['createdAt' => 'DESC']);

        $response = new StreamedResponse(function () use ($subscribers) {
            $out = fopen('php://output', 'wb');
            // BOM UTF-8 pour qu'Excel affiche correctement les accents.
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, ['email', 'nom', 'actif', 'source', 'inscrit_le'], ';');
            foreach ($subscribers as $s) {
                fputcsv($out, [
                    $s->getEmail(),
                    $s->getName() ?? '',
                    $s->isActive() ? 'oui' : 'non',
                    $s->getSource() ?? '',
                    $s->getCreatedAt()->format('Y-m-d H:i'),
                ], ';');
            }
            fclose($out);
        });

        $response->headers->set('Content-Type', 'text/csv; charset=UTF-8');
        $response->headers->set('Content-Disposition', 'attachment; filename="abonnes-newsletter.csv"');

        return $response;
    }

    #[Route('/campaign', name: 'admin_newsletter_campaign', methods: ['GET', 'POST'])]
    public function campaign(Request $request): Response
    {
        $activeCount = $this->subscriberRepository->count(['isActive' => true]);

        if ($request->isMethod('POST')) {
            if (!$this->isCsrfTokenValid('newsletter_campaign', (string) $request->request->get('_token'))) {
                $this->addFlash('danger', 'Jeton CSRF invalide.');

                return $this->redirectToRoute('admin_newsletter_campaign');
            }

            $subject = trim((string) $request->request->get('subject'));
            $body = trim((string) $request->request->get('body'));

            if ($subject === '' || $body === '') {
                $this->addFlash('danger', 'Le sujet et le message sont requis.');

                return $this->redirectToRoute('admin_newsletter_campaign');
            }

            $result = $this->newsletterMailer->sendCampaign($subject, $body);

            $this->auditLogger->log(
                'newsletter.campaign',
                sprintf('Campagne « %s » : %d envoyés / %d', $subject, $result['sent'], $result['total']),
                'NewsletterSubscriber',
                null,
                ['subject' => $subject, 'sent' => $result['sent'], 'failed' => $result['failed']],
            );
            $this->addFlash('success', sprintf('Campagne envoyée : %d réussi(s), %d échec(s) sur %d abonné(s).', $result['sent'], $result['failed'], $result['total']));

            return $this->redirectToRoute('admin_newsletter_campaign');
        }

        return $this->render('admin/newsletter/campaign.html.twig', [
            'activeCount' => $activeCount,
        ]);
    }
}
