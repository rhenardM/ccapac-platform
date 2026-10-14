<?php

namespace App\Controller\Admin;

use Symfony\Component\Security\Http\Attribute\IsGranted;

use App\Entity\Film;
use App\EasyAdmin\UploadConstraints;
use EasyCorp\Bundle\EasyAdminBundle\Config\Action;
use EasyCorp\Bundle\EasyAdminBundle\Config\Actions;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\ArrayField;
use EasyCorp\Bundle\EasyAdminBundle\Field\AssociationField;
use EasyCorp\Bundle\EasyAdminBundle\Field\BooleanField;
use EasyCorp\Bundle\EasyAdminBundle\Field\ChoiceField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\ImageField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IntegerField;
use EasyCorp\Bundle\EasyAdminBundle\Field\SlugField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextareaField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;
use EasyCorp\Bundle\EasyAdminBundle\Field\UrlField;
use EasyCorp\Bundle\EasyAdminBundle\Router\AdminUrlGenerator;

#[IsGranted('ROLE_CINEMATHEQUE')]
class FilmCrudController extends AbstractCrudController
{
    public function __construct(private AdminUrlGenerator $adminUrlGenerator)
    {
    }

    public static function getEntityFqcn(): string
    {
        return Film::class;
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setEntityLabelInSingular('Film')
            ->setEntityLabelInPlural('Cinémathèque — Films')
            ->setDefaultSort(['createdAt' => 'DESC'])
            ->setSearchFields(['title', 'slug', 'director', 'synopsis']);
    }

    public function configureActions(Actions $actions): Actions
    {
        $addGalleryImage = Action::new('addGalleryImage', 'Ajouter une image de galerie', 'fa fa-images')
            ->createAsGlobalAction()
            ->linkToUrl(
                $this->adminUrlGenerator
                    ->setController(FilmGalleryImageCrudController::class)
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
        yield AssociationField::new('categories', 'Genres');
        yield ChoiceField::new('status', 'Statut');
        yield BooleanField::new('archived', 'Archivé');
        yield TextField::new('director', 'Réalisateur')->hideOnIndex();
        yield TextField::new('country', 'Pays')->hideOnIndex();
        yield IntegerField::new('year', 'Année')->hideOnIndex();
        yield IntegerField::new('duration', 'Durée (min)')->hideOnIndex();
        yield TextField::new('language', 'Langue')->hideOnIndex();
        yield TextField::new('ageRating', 'Classification d\'âge')->hideOnIndex();
        yield UrlField::new('trailerUrl', 'Bande-annonce (YouTube/Vimeo)')->hideOnIndex();
        yield ArrayField::new('cast', 'Casting')->hideOnIndex();
        yield TextareaField::new('synopsis', 'Synopsis')->hideOnIndex();
        yield ImageField::new('poster', 'Affiche')
            ->setBasePath('/uploads/media')
            ->setUploadDir('public/uploads/media')
            ->setUploadedFileNamePattern('[slug]-poster-[timestamp].[extension]')
            ->setFileConstraints(UploadConstraints::image())
            ->setHelp(UploadConstraints::helpText())
            ->setRequired(false);
        yield ImageField::new('backdrop', 'Image de fond')
            ->setBasePath('/uploads/media')
            ->setUploadDir('public/uploads/media')
            ->setUploadedFileNamePattern('[slug]-backdrop-[timestamp].[extension]')
            ->setFileConstraints(UploadConstraints::image())
            ->setHelp(UploadConstraints::helpText())
            ->setRequired(false)
            ->hideOnIndex();
        yield IntegerField::new('viewCount', 'Vues')
            ->setFormTypeOption('disabled', true)
            ->hideWhenCreating();
    }
}
