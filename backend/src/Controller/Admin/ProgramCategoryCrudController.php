<?php

namespace App\Controller\Admin;

use Symfony\Component\Security\Http\Attribute\IsGranted;

use App\Entity\ProgramCategory;
use App\EasyAdmin\UploadConstraints;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\ChoiceField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\ImageField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IntegerField;
use EasyCorp\Bundle\EasyAdminBundle\Field\SlugField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextareaField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;

#[IsGranted('ROLE_ACTION_CULTURELLE')]
class ProgramCategoryCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return ProgramCategory::class;
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setEntityLabelInSingular('Rubrique')
            ->setEntityLabelInPlural('Rubriques (Action culturelle)')
            ->setDefaultSort(['position' => 'ASC'])
            ->setSearchFields(['title', 'slug']);
    }

    public function configureFields(string $pageName): iterable
    {
        yield IdField::new('id')->onlyOnDetail();
        yield TextField::new('title', 'Titre');
        yield SlugField::new('slug', 'Slug')->setTargetFieldName('title')->hideOnIndex();
        yield ChoiceField::new('status', 'Statut');
        yield IntegerField::new('position', 'Ordre');
        yield TextareaField::new('description', 'Description')->hideOnIndex();
        yield TextField::new('colorGradient', 'Dégradé (Tailwind)')
            ->setHelp('ex. « from-red-600 to-orange-600 »')
            ->hideOnIndex();
        yield ImageField::new('coverImage', 'Image')
            ->setBasePath('/uploads/media')
            ->setUploadDir('public/uploads/media')
            ->setUploadedFileNamePattern('[slug]-[timestamp].[extension]')
            ->setFileConstraints(UploadConstraints::image())
            ->setHelp(UploadConstraints::helpText())
            ->setRequired(false);
    }
}
