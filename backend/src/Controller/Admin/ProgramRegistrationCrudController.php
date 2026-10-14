<?php

namespace App\Controller\Admin;

use Symfony\Component\Security\Http\Attribute\IsGranted;

use App\Entity\ProgramRegistration;
use EasyCorp\Bundle\EasyAdminBundle\Config\Action;
use EasyCorp\Bundle\EasyAdminBundle\Config\Actions;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\AssociationField;
use EasyCorp\Bundle\EasyAdminBundle\Field\BooleanField;
use EasyCorp\Bundle\EasyAdminBundle\Field\DateTimeField;
use EasyCorp\Bundle\EasyAdminBundle\Field\EmailField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IntegerField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextareaField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;

#[IsGranted('ROLE_ACTION_CULTURELLE')]
class ProgramRegistrationCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return ProgramRegistration::class;
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setEntityLabelInSingular('Inscription')
            ->setEntityLabelInPlural('Inscriptions aux événements gratuits')
            ->setDefaultSort(['createdAt' => 'DESC'])
            ->setSearchFields(['firstName', 'lastName', 'email']);
    }

    public function configureActions(Actions $actions): Actions
    {
        // Consultation + marquer lu/non-lu (édition limitée), pas de création manuelle.
        return $actions
            ->add(Crud::PAGE_INDEX, Action::DETAIL)
            ->disable(Action::NEW);
    }

    public function configureFields(string $pageName): iterable
    {
        yield IdField::new('id')->onlyOnDetail();
        yield DateTimeField::new('createdAt', 'Reçue le')->hideOnForm();
        yield AssociationField::new('program', 'Événement')->hideOnForm();
        yield TextField::new('fullName', 'De')->hideOnForm();
        yield EmailField::new('email', 'E-mail')->hideOnForm();
        yield TextField::new('phone', 'Téléphone')->hideOnIndex()->hideOnForm();
        yield IntegerField::new('numberOfSeats', 'Places')->hideOnForm();
        yield BooleanField::new('isRead', 'Lu');
        yield TextareaField::new('message', 'Message')->hideOnIndex()->hideOnForm();
    }
}
