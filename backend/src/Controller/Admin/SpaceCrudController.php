<?php

namespace App\Controller\Admin;

use Symfony\Component\Security\Http\Attribute\IsGranted;

use App\Entity\Space;
use App\EasyAdmin\UploadConstraints;
use EasyCorp\Bundle\EasyAdminBundle\Config\Action;
use EasyCorp\Bundle\EasyAdminBundle\Config\Actions;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\AssociationField;
use EasyCorp\Bundle\EasyAdminBundle\Field\BooleanField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\ImageField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IntegerField;
use EasyCorp\Bundle\EasyAdminBundle\Field\SlugField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextareaField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;
use EasyCorp\Bundle\EasyAdminBundle\Field\UrlField;
use EasyCorp\Bundle\EasyAdminBundle\Router\AdminUrlGenerator;

#[IsGranted('ROLE_ESPACES')]
class SpaceCrudController extends AbstractCrudController
{
    public function __construct(private AdminUrlGenerator $adminUrlGenerator)
    {
    }

    public static function getEntityFqcn(): string
    {
        return Space::class;
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setEntityLabelInSingular('Espace')
            ->setEntityLabelInPlural('Espaces du Grand Tambour')
            ->setDefaultSort(['position' => 'ASC'])
            ->setSearchFields(['name', 'slug', 'shortDescription']);
    }

    public function configureActions(Actions $actions): Actions
    {
        $addGalleryImage = Action::new('addGalleryImage', 'Ajouter une image de galerie', 'fa fa-images')
            ->createAsGlobalAction()
            ->linkToUrl(
                $this->adminUrlGenerator
                    ->setController(SpaceGalleryImageCrudController::class)
                    ->setAction(Action::NEW)
                    ->generateUrl()
            );

        return $actions->add(Crud::PAGE_INDEX, $addGalleryImage);
    }

    public function configureFields(string $pageName): iterable
    {
        yield IdField::new('id')->onlyOnDetail();
        yield TextField::new('name', 'Nom');
        yield SlugField::new('slug', 'Slug')->setTargetFieldName('name')->hideOnIndex();
        yield AssociationField::new('category', 'Type d\'espace');
        yield BooleanField::new('isActive', 'Actif');
        yield IntegerField::new('capacity', 'Capacité d\'accueil')->setHelp('Ex. 100, 500, 1500 personnes');
        yield TextareaField::new('shortDescription', 'Description courte')->hideOnIndex();
        yield TextareaField::new('fullDescription', 'Description complète')->hideOnIndex();
        yield ImageField::new('coverImage', 'Image de couverture')
            ->setBasePath('/uploads/media')
            ->setUploadDir('public/uploads/media')
            ->setUploadedFileNamePattern('[slug]-cover-[timestamp].[extension]')
            ->setFileConstraints(UploadConstraints::image())
            ->setHelp(UploadConstraints::helpText())
            ->setRequired(false);

        yield IntegerField::new('surfaceM2', 'Surface (m²)')->hideOnIndex();
        yield IntegerField::new('seatedCapacity', 'Places assises')->hideOnIndex();
        yield IntegerField::new('standingCapacity', 'Places debout')->hideOnIndex();
        yield BooleanField::new('hasPmrAccess', 'Accessibilité PMR')->hideOnIndex();
        yield BooleanField::new('hasAirConditioning', 'Climatisation')->hideOnIndex();
        yield BooleanField::new('hasSoundSystem', 'Sonorisation')->hideOnIndex();
        yield BooleanField::new('hasProfessionalLighting', 'Éclairage professionnel')->hideOnIndex();
        yield BooleanField::new('hasWifi', 'Wi-Fi')->hideOnIndex();
        yield BooleanField::new('hasParking', 'Parking')->hideOnIndex();
        yield TextareaField::new('usageConditions', 'Conditions d\'utilisation')->hideOnIndex();

        yield BooleanField::new('isBookable', 'Réservable')->hideOnIndex();
        yield UrlField::new('bookingUrl', 'URL de réservation')->hideOnIndex();
        yield UrlField::new('quoteRequestUrl', 'URL demande de devis')->hideOnIndex();
        yield TextField::new('contactName', 'Contact — nom')->hideOnIndex();
        yield TextField::new('contactEmail', 'Contact — e-mail')->hideOnIndex();
        yield TextField::new('contactPhone', 'Contact — téléphone')->hideOnIndex();

        yield IntegerField::new('position', 'Ordre')->hideOnIndex();
    }
}
