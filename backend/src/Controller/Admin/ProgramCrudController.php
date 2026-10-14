<?php

namespace App\Controller\Admin;

use Symfony\Component\Security\Http\Attribute\IsGranted;

use App\Entity\Program;
use App\EasyAdmin\UploadConstraints;
use EasyCorp\Bundle\EasyAdminBundle\Config\Action;
use EasyCorp\Bundle\EasyAdminBundle\Config\Actions;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\AssociationField;
use EasyCorp\Bundle\EasyAdminBundle\Field\BooleanField;
use EasyCorp\Bundle\EasyAdminBundle\Field\ChoiceField;
use EasyCorp\Bundle\EasyAdminBundle\Field\DateTimeField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\ImageField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IntegerField;
use EasyCorp\Bundle\EasyAdminBundle\Field\SlugField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextareaField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextEditorField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;
use EasyCorp\Bundle\EasyAdminBundle\Router\AdminUrlGenerator;

#[IsGranted('ROLE_ACTION_CULTURELLE')]
class ProgramCrudController extends AbstractCrudController
{
    public function __construct(private AdminUrlGenerator $adminUrlGenerator)
    {
    }

    public static function getEntityFqcn(): string
    {
        return Program::class;
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setEntityLabelInSingular('Programme')
            ->setEntityLabelInPlural('Programmes')
            ->setDefaultSort(['position' => 'ASC'])
            ->setSearchFields(['title', 'slug', 'slogan']);
    }

    public function configureActions(Actions $actions): Actions
    {
        $addGalleryImage = Action::new('addGalleryImage', 'Ajouter une image de galerie', 'fa fa-images')
            ->createAsGlobalAction()
            ->linkToUrl(
                $this->adminUrlGenerator
                    ->setController(ProgramGalleryImageCrudController::class)
                    ->setAction(Action::NEW)
                    ->generateUrl()
            );

        return $actions->add(Crud::PAGE_INDEX, $addGalleryImage);
    }

    public function configureFields(string $pageName): iterable
    {
        yield IdField::new('id')->onlyOnDetail();
        yield TextField::new('title', 'Titre');
        yield SlugField::new('slug', 'Slug')->setTargetFieldName('title')->hideOnIndex();
        yield AssociationField::new('category', 'Rubrique')
            ->setRequired(false)
            ->setHelp('Obligatoire pour un programme interne ; laisser vide pour un externe.');
        yield ChoiceField::new('scope', 'Portée');
        yield ChoiceField::new('status', 'Statut');
        yield BooleanField::new('featured', 'À la une');
        yield BooleanField::new('isFree', 'Gratuit')
            ->setHelp('Pilote le bouton public : payant + lien externe = "Réserver ma place" (billetterie) ; gratuit = "S\'inscrire" (formulaire).');
        yield AssociationField::new('space', 'Espace du Grand Tambour')
            ->setRequired(false)
            ->setHelp('Espace associé, affiché sur la page de l\'événement (facultatif).');
        yield IntegerField::new('position', 'Ordre')->hideOnIndex();
        yield TextField::new('organizer', 'Partenaire / porteur')->hideOnIndex();
        yield TextField::new('externalUrl', 'Lien externe')
            ->setHelp('Si l\'événement est payant : lien vers la plateforme de billetterie.')
            ->hideOnIndex();
        yield TextField::new('slogan', 'Slogan')->hideOnIndex();
        yield TextField::new('discipline', 'Discipline / tag')->hideOnIndex();
        yield TextField::new('period', 'Période')
            ->setHelp('Texte libre, ex. « En novembre », « Chaque 21 mars »')
            ->hideOnIndex();
        yield TextField::new('location', 'Lieu')->hideOnIndex();
        yield DateTimeField::new('startsAt', 'Début')->hideOnIndex();
        yield DateTimeField::new('endsAt', 'Fin')->hideOnIndex();
        yield ImageField::new('coverImage', 'Image')
            ->setBasePath('/uploads/media')
            ->setUploadDir('public/uploads/media')
            ->setUploadedFileNamePattern('[slug]-[timestamp].[extension]')
            ->setFileConstraints(UploadConstraints::image())
            ->setHelp(UploadConstraints::helpText())
            ->setRequired(false);
        yield TextEditorField::new('description', 'Description')->hideOnIndex();
        yield TextareaField::new('objectif', 'Objectif')->hideOnIndex();
        yield TextField::new('publicVise', 'Public visé')->hideOnIndex();
        yield TextareaField::new('impact', 'Impact')->hideOnIndex();
    }
}
