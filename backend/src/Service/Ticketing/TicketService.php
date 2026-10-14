<?php

namespace App\Service\Ticketing;

use App\Entity\ScreeningRegistration;
use App\Entity\Ticket;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;
use Endroid\QrCode\Builder\Builder;
use Endroid\QrCode\Writer\SvgWriter;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * Orchestre la génération d'un billet numérique : numéro séquentiel (avec
 * retry sur collision), jeton de validation + QR Code, PDF, et la
 * transition à sens unique ACTIF -> UTILISÉ.
 */
class TicketService
{
    public function __construct(
        private EntityManagerInterface $em,
        private TicketNumberGenerator $numberGenerator,
        private TicketPdfGenerator $pdfGenerator,
        #[Autowire('%kernel.project_dir%/var/tickets')] private string $ticketsDir,
    ) {
    }

    /**
     * @return array{0: Ticket, 1: string} [Ticket, jeton de validation brut]
     */
    public function generateForRegistration(ScreeningRegistration $registration, string $base): array
    {
        $rawToken = bin2hex(random_bytes(32));

        $ticket = new Ticket();
        $ticket->setRegistration($registration);
        $ticket->setScreening($registration->getScreening());
        $ticket->setValidationTokenHash(Ticket::hashToken($rawToken));

        $this->assignSequentialNumberWithRetry($ticket);

        try {
            // Payload QR : URL de validation compacte, scannable dès aujourd'hui et
            // prête pour un futur endpoint de scan sans changement de schéma.
            $qrPayload = sprintf(
                '%s/api/cinematheque/tickets/%s/validate?token=%s',
                rtrim($base, '/'),
                $ticket->getTicketNumber(),
                $rawToken
            );

            $qrFilename = $ticket->getTicketNumber() . '.svg';
            $this->writeQrCode($qrPayload, $qrFilename);
            $ticket->setQrCodePath($qrFilename);

            $pdfFilename = $ticket->getTicketNumber() . '.pdf';
            $this->pdfGenerator->render($ticket, $registration, $qrFilename, $pdfFilename);
            $ticket->setPdfPath($pdfFilename);

            $registration->setTicket($ticket);
            $registration->setTicketGenerated(true);
            $this->em->flush();
        } catch (\Throwable $e) {
            // Le numéro de billet a déjà été réservé (persist+flush dans
            // assignSequentialNumberWithRetry) : si le QR/PDF échoue ensuite, on
            // retire ce billet incomplet plutôt que de laisser une ligne
            // orpheline (sans fichiers, jamais liée à sa réservation).
            $this->em->remove($ticket);
            $this->em->flush();
            throw $e;
        }

        return [$ticket, $rawToken];
    }

    public function verifyToken(Ticket $ticket, string $rawToken): bool
    {
        if ($rawToken === '') {
            return false;
        }

        return hash_equals($ticket->getValidationTokenHash(), Ticket::hashToken($rawToken));
    }

    /** Transition à sens unique ; false si déjà utilisé/annulé (rejeu refusé). */
    public function markAsUsed(Ticket $ticket): bool
    {
        $changed = $ticket->markAsUsed();
        if ($changed) {
            $this->em->flush();
        }

        return $changed;
    }

    /**
     * Ne régénère PAS le jeton/QR (le billet déjà envoyé doit rester valide) ;
     * ne fait que ré-écrire le PDF (ex. après correction d'une info de séance).
     */
    public function regeneratePdf(Ticket $ticket): void
    {
        $registration = $ticket->getRegistration();
        if (!$registration) {
            return;
        }

        $pdfFilename = $ticket->getPdfPath() ?? ($ticket->getTicketNumber() . '.pdf');
        $this->pdfGenerator->render($ticket, $registration, $ticket->getQrCodePath(), $pdfFilename);
        $ticket->setPdfPath($pdfFilename);
        $this->em->flush();
    }

    public function absolutePdfPath(Ticket $ticket): ?string
    {
        return $ticket->getPdfPath() ? $this->ticketsDir . '/' . $ticket->getPdfPath() : null;
    }

    public function absoluteQrPath(Ticket $ticket): ?string
    {
        return $ticket->getQrCodePath() ? $this->ticketsDir . '/qr/' . $ticket->getQrCodePath() : null;
    }

    /** Contenu brut du SVG du QR, pour une intégration <svg> inline dans une page HTML normale. */
    public function readQrSvg(Ticket $ticket): ?string
    {
        $path = $this->absoluteQrPath($ticket);

        return ($path && is_file($path)) ? file_get_contents($path) : null;
    }

    private function assignSequentialNumberWithRetry(Ticket $ticket): void
    {
        [$number, $year, $seq] = $this->numberGenerator->next();

        for ($attempt = 0; $attempt < 5; $attempt++) {
            $ticket->setTicketNumber($number)->setSequenceYear($year)->setSequenceNumber($seq);

            try {
                $this->em->persist($ticket);
                $this->em->flush();

                return;
            } catch (UniqueConstraintViolationException $e) {
                $this->em->detach($ticket);
                if ($attempt === 4) {
                    throw $e;
                }
                [$number, $year, $seq] = $this->numberGenerator->retry($year, $seq);
            }
        }
    }

    private function writeQrCode(string $payload, string $filename): void
    {
        // SVG plutôt que PNG : pur PHP, aucune dépendance à l'extension GD/Imagick
        // (cohérent avec le choix de Dompdf pour le PDF, sans binaire externe).
        // Déclaration XML exclue : le SVG est injecté inline dans le HTML du
        // billet (cf. TicketPdfGenerator), où un prologue XML en tête casserait l'intégration.
        $builder = new Builder(
            writer: new SvgWriter(),
            writerOptions: [SvgWriter::WRITER_OPTION_EXCLUDE_XML_DECLARATION => true],
            data: $payload,
            size: 400,
            margin: 10,
        );
        $result = $builder->build();

        $qrDir = $this->ticketsDir . '/qr';
        if (!is_dir($qrDir)) {
            mkdir($qrDir, 0775, true);
        }
        $result->saveToFile($qrDir . '/' . $filename);
    }
}
