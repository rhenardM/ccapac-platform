<?php

namespace App\Controller\Admin;

use Symfony\Component\Security\Http\Attribute\IsGranted;

use App\Entity\Ticket;
use App\Enum\TicketStatus;
use App\Service\Audit\AuditLogger;
use App\Service\Ticketing\TicketService;
use EasyCorp\Bundle\EasyAdminBundle\Config\Action;
use EasyCorp\Bundle\EasyAdminBundle\Config\Actions;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Config\Filters;
use EasyCorp\Bundle\EasyAdminBundle\Context\AdminContext;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\AssociationField;
use EasyCorp\Bundle\EasyAdminBundle\Field\ChoiceField;
use EasyCorp\Bundle\EasyAdminBundle\Field\DateTimeField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;
use EasyCorp\Bundle\EasyAdminBundle\Filter\ChoiceFilter;
use EasyCorp\Bundle\EasyAdminBundle\Filter\EntityFilter;
use EasyCorp\Bundle\EasyAdminBundle\Router\AdminUrlGenerator;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;

/**
 * Billets numériques générés pour les inscriptions aux séances gratuites.
 * Lecture/actions seulement : aucun billet ne se crée ni ne s'édite à la main
 * (généré automatiquement à l'inscription, cf. ScreeningApiController).
 */
#[IsGranted('ROLE_CINEMATHEQUE')]
class TicketCrudController extends AbstractCrudController
{
    public function __construct(
        private TicketService $ticketService,
        private AuditLogger $auditLogger,
        private AdminUrlGenerator $adminUrlGenerator,
    ) {
    }

    public static function getEntityFqcn(): string
    {
        return Ticket::class;
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setEntityLabelInSingular('Billet')
            ->setEntityLabelInPlural('Billets Cinéma')
            ->setDefaultSort(['createdAt' => 'DESC'])
            ->setSearchFields([
                'ticketNumber',
                'registration.firstName',
                'registration.lastName',
                'registration.email',
                'screening.film.title',
            ]);
    }

    public function configureFilters(Filters $filters): Filters
    {
        return $filters
            ->add(ChoiceFilter::new('status', 'Statut')->setChoices(TicketStatus::choices()))
            ->add(EntityFilter::new('screening', 'Séance'));
    }

    public function configureActions(Actions $actions): Actions
    {
        $markUsed = Action::new('markAsUsed', 'Marquer comme utilisé', 'fa fa-check-circle')
            ->linkToCrudAction('markAsUsed')
            ->displayAsButton()
            ->askConfirmation(
                'Confirmer l\'utilisation de ce billet ? Cette action est définitive.',
                'Marquer comme utilisé'
            )
            ->displayIf(static fn (Ticket $ticket) => $ticket->getStatus() === TicketStatus::ACTIVE);

        $downloadPdf = Action::new('downloadPdf', 'Télécharger le PDF', 'fa fa-file-pdf')
            ->linkToCrudAction('downloadPdf');

        $printTicket = Action::new('printTicket', 'Imprimer (guichet)', 'fa fa-print')
            ->linkToCrudAction('printTicket')
            ->setHtmlAttributes(['target' => '_blank']);

        $regenerate = Action::new('regenerate', 'Régénérer le billet', 'fa fa-rotate')
            ->linkToCrudAction('regeneratePdf')
            ->askConfirmation('Régénérer le PDF de ce billet ? Le numéro et le QR Code ne changent pas.', 'Régénérer');

        return $actions
            ->add(Crud::PAGE_INDEX, Action::DETAIL)
            ->add(Crud::PAGE_INDEX, $markUsed)
            ->add(Crud::PAGE_INDEX, $downloadPdf)
            ->add(Crud::PAGE_INDEX, $printTicket)
            ->add(Crud::PAGE_DETAIL, $markUsed)
            ->add(Crud::PAGE_DETAIL, $downloadPdf)
            ->add(Crud::PAGE_DETAIL, $printTicket)
            ->add(Crud::PAGE_DETAIL, $regenerate)
            ->disable(Action::NEW, Action::EDIT, Action::DELETE, Action::BATCH_DELETE);
    }

    public function configureFields(string $pageName): iterable
    {
        yield IdField::new('id')->onlyOnDetail();
        yield TextField::new('ticketNumber', 'N° de billet');
        yield TextField::new('registration.fullName', 'Participant')->setSortable(false);
        yield TextField::new('registration.email', 'E-mail')->onlyOnDetail();
        yield AssociationField::new('screening', 'Séance');
        yield TextField::new('screening.film.title', 'Film')->setSortable(false)->hideOnForm();
        yield ChoiceField::new('status', 'Statut')
            ->setChoices(TicketStatus::choices())
            ->renderAsBadges([
                TicketStatus::ACTIVE->value => 'success',
                TicketStatus::USED->value => 'secondary',
                TicketStatus::CANCELLED->value => 'danger',
            ]);
        yield DateTimeField::new('generatedAt', 'Généré le')->hideOnForm();
        yield DateTimeField::new('usedAt', 'Utilisé le')->hideOnIndex()->hideOnForm();
        yield DateTimeField::new('createdAt', 'Créé le')->hideOnIndex()->hideOnForm();
    }

    public function markAsUsed(AdminContext $context): RedirectResponse
    {
        /** @var Ticket $ticket */
        $ticket = $context->getEntity()->getInstance();

        if (!$this->ticketService->markAsUsed($ticket)) {
            $this->addFlash('danger', sprintf('Le billet %s a déjà été utilisé ou annulé.', $ticket->getTicketNumber()));
        } else {
            $this->addFlash('success', sprintf('Billet %s marqué comme utilisé.', $ticket->getTicketNumber()));
            $this->auditLogger->log('ticket.mark_used', 'Billet marqué comme utilisé', 'Ticket', (string) $ticket->getId());
        }

        return $this->redirect($context->getReferrer() ?? $this->indexUrl());
    }

    public function downloadPdf(AdminContext $context): BinaryFileResponse
    {
        /** @var Ticket $ticket */
        $ticket = $context->getEntity()->getInstance();
        $path = $this->ticketService->absolutePdfPath($ticket);
        if (!$path || !is_file($path)) {
            throw $this->createNotFoundException('PDF introuvable pour ce billet.');
        }

        $response = new BinaryFileResponse($path);
        $response->setContentDisposition(ResponseHeaderBag::DISPOSITION_ATTACHMENT, $ticket->getTicketNumber() . '.pdf');
        $response->headers->set('Cache-Control', 'private, no-store');

        return $response;
    }

    /**
     * Vue imprimable minimale (talon 80mm), destinée à une imprimante
     * thermique de guichet — page HTML normale (pas un PDF Dompdf) : le
     * navigateur gère l'impression via son propre pilote/dialogue.
     */
    public function printTicket(AdminContext $context): Response
    {
        /** @var Ticket $ticket */
        $ticket = $context->getEntity()->getInstance();
        $registration = $ticket->getRegistration();
        $screening = $ticket->getScreening();

        return $this->render('ticket/print.html.twig', [
            'ticket' => $ticket,
            'registration' => $registration,
            'screening' => $screening,
            'film' => $screening?->getFilm(),
            'qrSvgContent' => $this->ticketService->readQrSvg($ticket),
        ]);
    }

    public function regeneratePdf(AdminContext $context): RedirectResponse
    {
        /** @var Ticket $ticket */
        $ticket = $context->getEntity()->getInstance();
        $this->ticketService->regeneratePdf($ticket);
        $this->addFlash('success', sprintf('PDF du billet %s régénéré.', $ticket->getTicketNumber()));
        $this->auditLogger->log('ticket.regenerate_pdf', 'PDF du billet régénéré', 'Ticket', (string) $ticket->getId());

        return $this->redirect($context->getReferrer() ?? $this->indexUrl());
    }

    private function indexUrl(): string
    {
        return $this->adminUrlGenerator->setController(self::class)->setAction(Action::INDEX)->generateUrl();
    }
}
