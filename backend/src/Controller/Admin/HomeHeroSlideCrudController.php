<?php

namespace App\Controller\Admin;

use Symfony\Component\Security\Http\Attribute\IsGranted;

use App\Entity\HomeHeroSlide;
use App\EasyAdmin\UploadConstraints;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\ChoiceField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\ImageField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IntegerField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextareaField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;

/**
 * Diapositives du grand bandeau (« Hero ») de la page d'accueil.
 */
#[IsGranted('ROLE_CONTENT')]
class HomeHeroSlideCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return HomeHeroSlide::class;
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setEntityLabelInSingular('Diapositive')
            ->setEntityLabelInPlural('Hero Section Page d\'accueil')
            ->setDefaultSort(['position' => 'ASC'])
            ->setSearchFields(['title', 'subtitle']);
    }

    public function configureFields(string $pageName): iterable
    {
        yield IdField::new('id')->onlyOnDetail();
        yield TextField::new('title', 'Titre');
        yield TextField::new('subtitle', 'Sous-titre')->hideOnIndex();
        yield TextareaField::new('description', 'Description')->hideOnIndex();
        yield ChoiceField::new('status', 'Statut');
        yield IntegerField::new('position', 'Ordre')
            ->setHelp('Détermine l\'ordre de passage dans le carrousel.');
        yield ImageField::new('image', 'Image de fond')
            ->setBasePath('/uploads/media')
            ->setUploadDir('public/uploads/media')
            ->setUploadedFileNamePattern('home-hero-[randomhash].[extension]')
            ->setFileConstraints(UploadConstraints::image())
            ->setHelp(UploadConstraints::helpText() . ' Obligatoire : une diapositive sans image ne s\'affiche pas correctement.')
            ->setRequired(true);
        yield TextField::new('buttonText', 'Texte du bouton')
            ->setHelp('Ex. « Voir l\'agenda », « Découvrir »')
            ->hideOnIndex();
        yield TextField::new('buttonLink', 'Lien du bouton')
            ->setHelp('Chemin d\'une page du site (ex. /agenda, /cinematheque, /grand-tambour/espaces) ou URL externe complète.')
            ->hideOnIndex();
    }
}
