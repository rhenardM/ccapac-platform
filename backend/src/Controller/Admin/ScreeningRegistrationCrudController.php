<?php

namespace App\Controller\Admin;

use Symfony\Component\Security\Http\Attribute\IsGranted;

use App\Entity\ScreeningRegistration;
use App\Enum\RegistrationSource;
use App\Service\Notification\TicketMailer;
use App\Service\Ticketing\TicketService;
use Doctrine\ORM\EntityManagerInterface;
use EasyCorp\Bundle\EasyAdminBundle\Config\Action;
use EasyCorp\Bundle\EasyAdminBundle\Config\Actions;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\AssociationField;
use EasyCorp\Bundle\EasyAdminBundle\Field\BooleanField;
use EasyCorp\Bundle\EasyAdminBundle\Field\ChoiceField;
use EasyCorp\Bundle\EasyAdminBundle\Field\DateTimeField;
use EasyCorp\Bundle\EasyAdminBundle\Field\EmailField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IntegerField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextareaField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;
use Symfony\Component\HttpFoundation\RequestStack;

/**
 * Inscriptions aux séances gratuites : consultées en ligne (site public),
 * ou saisies au guichet pour un visiteur venu physiquement — dans ce dernier
 * cas, la création déclenche aussitôt la génération du billet (cf.
 * persistEntity()), imprimable depuis "Billets Cinéma" (TicketCrudController).
 */
#[IsGranted('ROLE_CINEMATHEQUE')]
class ScreeningRegistrationCrudController extends AbstractCrudController
{
    public function __construct(
        private TicketService $ticketService,
        private TicketMailer $ticketMailer,
        private RequestStack $requestStack,
    ) {
    }

    public static function getEntityFqcn(): string
    {
        return ScreeningRegistration::class;
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setEntityLabelInSingular('Inscription')
            ->setEntityLabelInPlural('Inscriptions aux séances gratuites')
            ->setDefaultSort(['createdAt' => 'DESC'])
            ->setSearchFields(['firstName', 'lastName', 'email']);
    }

    public function configureActions(Actions $actions): Actions
    {
        // Consultation + inscription au guichet (nouvelle) + marquer lu/non-lu
        // (édition limitée) : pas de suppression, pas d'édition libre des
        // champs saisis en ligne par le visiteur.
        return $actions->add(Crud::PAGE_INDEX, Action::DETAIL);
    }

    public function createEntity(string $entityFqcn): ScreeningRegistration
    {
        // Seul point d'entrée pour créer une inscription depuis l'admin :
        // toujours une inscription au guichet (l'inscription en ligne passe
        // exclusivement par ScreeningApiController::register()).
        $registration = new ScreeningRegistration();
        $registration->setSource(RegistrationSource::WALKIN);

        return $registration;
    }

    public function persistEntity(EntityManagerInterface $entityManager, $entityInstance): void
    {
        parent::persistEntity($entityManager, $entityInstance);

        if (!$entityInstance instanceof ScreeningRegistration) {
            return;
        }

        $base = $this->requestStack->getCurrentRequest()?->getSchemeAndHttpHost() ?? '';

        try {
            [$ticket, $rawToken] = $this->ticketService->generateForRegistration($entityInstance, $base);

            if ($entityInstance->getEmail()) {
                $this->ticketMailer->sendTicketConfirmation($entityInstance, $ticket, $rawToken, $base);
            }

            $this->addFlash('success', sprintf(
                'Inscription enregistrée : billet %s généré. Imprimez-le depuis "Billets Cinéma".',
                $ticket->getTicketNumber()
            ));
        } catch (\Throwable $e) {
            // L'inscription reste enregistrée même si le billet échoue : il
            // pourra être régénéré depuis "Billets Cinéma" une fois le souci résolu.
            $this->addFlash('warning', 'Inscription enregistrée, mais la génération du billet a échoué : ' . $e->getMessage());
        }
    }

    public function configureFields(string $pageName): iterable
    {
        if (Crud::PAGE_NEW === $pageName) {
            yield AssociationField::new('screening', 'Séance');
            yield TextField::new('firstName', 'Prénom');
            yield TextField::new('lastName', 'Nom');
            yield EmailField::new('email', 'E-mail')
                ->setRequired(false)
                ->setHelp('Facultatif au guichet : le billet imprimé sur place fait office de justificatif. S\'il est renseigné, le billet est aussi envoyé par e-mail.');
            yield TextField::new('phone', 'Téléphone')->setRequired(false);
            yield IntegerField::new('numberOfSeats', 'Places')->setRequired(false);
            yield TextField::new('gender', 'Sexe')->setRequired(false);
            yield TextField::new('ageRange', 'Tranche d\'âge')->setRequired(false);
            yield TextareaField::new('message', 'Message')->setRequired(false);

            return;
        }

        yield IdField::new('id')->onlyOnDetail();
        yield DateTimeField::new('createdAt', 'Reçue le')->hideOnForm();
        yield ChoiceField::new('source', 'Origine')
            ->setChoices(RegistrationSource::choices())
            ->renderAsBadges([
                RegistrationSource::ONLINE->value => 'info',
                RegistrationSource::WALKIN->value => 'success',
            ])
            ->hideOnForm();
        yield AssociationField::new('screening', 'Séance')->hideOnForm();
        yield TextField::new('fullName', 'De')->hideOnForm();
        yield EmailField::new('email', 'E-mail')->hideOnForm();
        yield TextField::new('phone', 'Téléphone')->hideOnIndex()->hideOnForm();
        yield IntegerField::new('numberOfSeats', 'Places')->hideOnForm();
        yield TextField::new('gender', 'Sexe')->hideOnIndex()->hideOnForm();
        yield TextField::new('ageRange', 'Tranche d\'âge')->hideOnIndex()->hideOnForm();
        yield BooleanField::new('isRead', 'Lu');
        yield BooleanField::new('ticketGenerated', 'Billet généré')->hideOnForm();
        yield AssociationField::new('ticket', 'Billet')->hideOnForm()->hideOnIndex();
        yield TextareaField::new('message', 'Message')->hideOnIndex()->hideOnForm();
    }
}
