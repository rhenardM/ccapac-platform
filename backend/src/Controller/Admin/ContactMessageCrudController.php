<?php

namespace App\Controller\Admin;

use Symfony\Component\Security\Http\Attribute\IsGranted;

use App\Entity\ContactMessage;
use EasyCorp\Bundle\EasyAdminBundle\Config\Action;
use EasyCorp\Bundle\EasyAdminBundle\Config\Actions;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\BooleanField;
use EasyCorp\Bundle\EasyAdminBundle\Field\DateTimeField;
use EasyCorp\Bundle\EasyAdminBundle\Field\EmailField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextareaField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;

#[IsGranted('ROLE_CONTENT')]
class ContactMessageCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return ContactMessage::class;
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setEntityLabelInSingular('Message de contact')
            ->setEntityLabelInPlural('Messages de contact')
            ->setDefaultSort(['createdAt' => 'DESC'])
            ->setSearchFields(['firstName', 'lastName', 'email', 'subject', 'message']);
    }

    public function configureActions(Actions $actions): Actions
    {
        // Consultation + marquer lu/non-lu (édition limitée), pas de création.
        return $actions
            ->add(Crud::PAGE_INDEX, Action::DETAIL)
            ->disable(Action::NEW);
    }

    public function configureFields(string $pageName): iterable
    {
        yield IdField::new('id')->onlyOnDetail();
        yield DateTimeField::new('createdAt', 'Reçu le')->hideOnForm();
        yield TextField::new('fullName', 'De')->hideOnForm();
        yield EmailField::new('email', 'E-mail')->hideOnForm();
        yield TextField::new('phone', 'Téléphone')->hideOnIndex()->hideOnForm();
        yield TextField::new('subject', 'Sujet');
        yield BooleanField::new('isRead', 'Lu');
        yield TextareaField::new('message', 'Message')->hideOnIndex()->hideOnForm();
    }
}
