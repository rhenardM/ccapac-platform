<?php

namespace App\Controller\Admin;

use Symfony\Component\Security\Http\Attribute\IsGranted;

use App\Entity\Event;
use App\EasyAdmin\UploadConstraints;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\BooleanField;
use EasyCorp\Bundle\EasyAdminBundle\Field\ChoiceField;
use EasyCorp\Bundle\EasyAdminBundle\Field\DateTimeField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\ImageField;
use EasyCorp\Bundle\EasyAdminBundle\Field\SlugField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextEditorField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;

#[IsGranted('ROLE_CONTENT')]
class EventCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return Event::class;
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setEntityLabelInSingular('Événement')
            ->setEntityLabelInPlural('Événements')
            ->setDefaultSort(['startsAt' => 'DESC'])
            ->setSearchFields(['title', 'slug', 'location']);
    }

    public function configureFields(string $pageName): iterable
    {
        yield IdField::new('id')->onlyOnDetail();
        yield TextField::new('title', 'Titre');
        yield SlugField::new('slug', 'Slug')->setTargetFieldName('title')->hideOnIndex();
        yield ChoiceField::new('status', 'Statut');
        yield BooleanField::new('featured', 'À la une');
        yield BooleanField::new('isRegistrationOpen', 'Inscriptions ouvertes')
            ->setHelp('Affiche un bouton "S\'inscrire" (formulaire anonyme, sans compte) sur la page publique de l\'événement.');
        yield TextField::new('category', 'Catégorie');
        yield DateTimeField::new('startsAt', 'Date de début');
        yield DateTimeField::new('endsAt', 'Date de fin')->hideOnIndex();
        yield TextField::new('startTime', 'Heure début')->hideOnIndex();
        yield TextField::new('endTime', 'Heure fin')->hideOnIndex();
        yield TextField::new('location', 'Lieu');
        yield TextField::new('organizer', 'Organisateur')->hideOnIndex();
        yield ImageField::new('coverImage', 'Image')
            ->setBasePath('/uploads/media')
            ->setUploadDir('public/uploads/media')
            ->setUploadedFileNamePattern('[slug]-[timestamp].[extension]')
            ->setFileConstraints(UploadConstraints::image())
            ->setHelp(UploadConstraints::helpText())
            ->setRequired(false);
        yield TextEditorField::new('description', 'Description')->hideOnIndex();
        yield DateTimeField::new('publishedAt', 'Publié le')->hideOnForm();
    }
}
