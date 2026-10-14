<?php

namespace App\Controller\Admin;

use Symfony\Component\Security\Http\Attribute\IsGranted;

use App\Entity\MediaAsset;
use App\EasyAdmin\UploadConstraints;
use EasyCorp\Bundle\EasyAdminBundle\Config\Action;
use EasyCorp\Bundle\EasyAdminBundle\Config\Actions;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Config\Filters;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\AssociationField;
use EasyCorp\Bundle\EasyAdminBundle\Field\DateField;
use EasyCorp\Bundle\EasyAdminBundle\Field\DateTimeField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\ImageField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextareaField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;
use EasyCorp\Bundle\EasyAdminBundle\Filter\DateTimeFilter;
use EasyCorp\Bundle\EasyAdminBundle\Filter\EntityFilter;
use EasyCorp\Bundle\EasyAdminBundle\Router\AdminUrlGenerator;

#[IsGranted('ROLE_CONTENT')]
class MediaAssetCrudController extends AbstractCrudController
{
    public function __construct(private AdminUrlGenerator $adminUrlGenerator)
    {
    }

    public static function getEntityFqcn(): string
    {
        return MediaAsset::class;
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setEntityLabelInSingular('Média')
            ->setEntityLabelInPlural('Bibliothèque média')
            ->setDefaultSort(['createdAt' => 'DESC'])
            ->setSearchFields(['name', 'alt', 'caption']);
    }

    public function configureFilters(Filters $filters): Filters
    {
        return $filters
            ->add(EntityFilter::new('category', 'Catégorie'))
            ->add(DateTimeFilter::new('eventDate', 'Date de l\'événement'));
    }

    public function configureActions(Actions $actions): Actions
    {
        $manageCategories = Action::new('manageMediaCategories', 'Gérer les catégories', 'fa fa-tags')
            ->createAsGlobalAction()
            ->linkToUrl(
                $this->adminUrlGenerator
                    ->setController(MediaCategoryCrudController::class)
                    ->setAction(Action::INDEX)
                    ->generateUrl()
            );

        return $actions->add(Crud::PAGE_INDEX, $manageCategories);
    }

    public function configureFields(string $pageName): iterable
    {
        yield IdField::new('id')->onlyOnDetail();
        yield TextField::new('name', 'Nom');
        yield ImageField::new('filename', 'Fichier')
            ->setBasePath('/uploads/media')
            ->setUploadDir('public/uploads/media')
            ->setUploadedFileNamePattern('[slug]-[timestamp].[extension]')
            ->setFileConstraints(UploadConstraints::image())
            ->setHelp(UploadConstraints::helpText())
            ->setRequired($pageName === Crud::PAGE_NEW);
        yield AssociationField::new('category', 'Catégorie')
            ->setHelp('Détermine le filtre sous lequel l\'image apparaît dans la médiathèque du site.');
        yield DateField::new('eventDate', 'Date de l\'événement')
            ->setHelp('Date à laquelle la photo a été prise. Alimente les filtres « Année » et « Mois ». Laisser vide si inconnue.');
        yield TextField::new('alt', 'Texte alternatif')->hideOnIndex();
        yield TextareaField::new('caption', 'Légende')->hideOnIndex();
        yield TextField::new('mime', 'Type MIME')->onlyOnDetail();
        yield DateTimeField::new('createdAt', 'Ajouté le')->hideOnForm();
    }
}
