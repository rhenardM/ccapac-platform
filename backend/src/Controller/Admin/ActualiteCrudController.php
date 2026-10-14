<?php

namespace App\Controller\Admin;

use Symfony\Component\Security\Http\Attribute\IsGranted;

use App\Entity\Actualite;
use App\EasyAdmin\UploadConstraints;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
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

#[IsGranted('ROLE_CONTENT')]
class ActualiteCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return Actualite::class;
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setEntityLabelInSingular('Actualité')
            ->setEntityLabelInPlural('Actualités')
            ->setDefaultSort(['createdAt' => 'DESC'])
            ->setSearchFields(['title', 'slug', 'summary']);
    }

    public function configureFields(string $pageName): iterable
    {
        yield IdField::new('id')->onlyOnDetail();
        yield TextField::new('title', 'Titre');
        yield SlugField::new('slug', 'Slug')->setTargetFieldName('title')->hideOnIndex();
        yield ChoiceField::new('type', 'Type');
        yield ChoiceField::new('status', 'Statut');
        yield BooleanField::new('isFeatured', 'À la une');
        yield ImageField::new('coverImage', 'Image de couverture')
            ->setBasePath('/uploads/media')
            ->setUploadDir('public/uploads/media')
            ->setUploadedFileNamePattern('[slug]-[timestamp].[extension]')
            ->setFileConstraints(UploadConstraints::image())
            ->setHelp(UploadConstraints::helpText())
            ->setRequired(false);
        yield ImageField::new('pdf', 'Fichier PDF (newsletter)')
            ->setBasePath('/uploads/media')
            ->setUploadDir('public/uploads/media')
            ->setUploadedFileNamePattern('[slug]-[timestamp].[extension]')
            ->setFileConstraints(UploadConstraints::pdf())
            ->setHelp(UploadConstraints::helpText('PDF'))
            ->setRequired(false)
            ->onlyOnForms();
        yield TextField::new('mois', 'Mois')->hideOnIndex();
        yield IntegerField::new('annee', 'Année')->hideOnIndex();
        yield TextareaField::new('summary', 'Résumé')->hideOnIndex();
        yield TextEditorField::new('content', 'Contenu')->hideOnIndex();
        yield DateTimeField::new('publishedAt', 'Publié le')->hideOnForm();
        yield DateTimeField::new('updatedAt', 'Modifié le')->onlyOnDetail();
    }
}
