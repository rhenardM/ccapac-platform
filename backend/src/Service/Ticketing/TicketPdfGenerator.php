<?php

namespace App\Service\Ticketing;

use App\Entity\ScreeningRegistration;
use App\Entity\Ticket;
use Dompdf\Dompdf;
use Dompdf\Options;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Twig\Environment;

/**
 * Génère le PDF d'un billet : rendu Twig -> HTML -> Dompdf, format billet de
 * cinéma à l'italienne (talon + souche), sur le modèle graphique fourni par
 * le Centre (noir/or, sans photo). Le logo est dessiné en CSS (monogramme),
 * pas en image bitmap : ce rendu doit rester correct même sans l'extension
 * GD (absente sur certains environnements, cf. QR toujours en SVG vectoriel).
 */
class TicketPdfGenerator
{
    /** Format billet à l'italienne : 560 x 300 points (~19.8cm x 10.6cm). */
    private const PAGE_WIDTH = 560;
    private const PAGE_HEIGHT = 300;

    public function __construct(
        private Environment $twig,
        #[Autowire('%kernel.project_dir%')] private string $projectDir,
        #[Autowire('%kernel.project_dir%/var/tickets')] private string $ticketsDir,
    ) {
    }

    public function render(Ticket $ticket, ScreeningRegistration $registration, ?string $qrFilename, string $pdfFilename): void
    {
        $screening = $ticket->getScreening();
        $film = $screening?->getFilm();

        // Dompdf ne sait pas interpréter une balise <svg> inline dans le HTML :
        // son support SVG (via php-svg-lib) ne s'active que pour un <img src="...">
        // pointant vers un fichier .svg — d'où le chemin de fichier, pas le contenu.
        $qrAbsolutePath = null;
        if ($qrFilename) {
            $qrPath = $this->ticketsDir . '/qr/' . $qrFilename;
            $qrAbsolutePath = is_file($qrPath) ? $qrPath : null;
        }

        $html = $this->twig->render('ticket/pdf.html.twig', [
            'ticket' => $ticket,
            'registration' => $registration,
            'screening' => $screening,
            'film' => $film,
            // file:// requis par Dompdf pour résoudre un chemin de fichier local.
            'qrCodeAbsolutePath' => $qrAbsolutePath ? 'file://' . $qrAbsolutePath : null,
        ]);

        $options = new Options();
        $options->set('isRemoteEnabled', false);
        $options->set('defaultFont', 'DejaVu Sans');
        // Par défaut, Dompdf restreint la lecture de fichiers locaux ("chroot")
        // à son propre répertoire vendor : sans ceci, le QR (stocké sous ce
        // projet, hors de vendor/dompdf) serait rejeté en silence et affiché
        // comme une image cassée.
        $options->setChroot([$this->projectDir]);

        $dompdf = new Dompdf($options);
        // Les dimensions explicites encodent déjà le format à l'italienne
        // (largeur > hauteur) : passer 'landscape' ici inverserait W et H.
        $dompdf->setPaper([0, 0, self::PAGE_WIDTH, self::PAGE_HEIGHT], 'portrait');
        $dompdf->loadHtml($html);
        $dompdf->render();

        if (!is_dir($this->ticketsDir)) {
            mkdir($this->ticketsDir, 0775, true);
        }
        file_put_contents($this->ticketsDir . '/' . $pdfFilename, $dompdf->output());
    }
}
