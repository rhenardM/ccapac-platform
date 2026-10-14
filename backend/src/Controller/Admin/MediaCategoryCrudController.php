<?php

namespace App\Controller\Admin;

use Symfony\Component\Security\Http\Attribute\IsGranted;

use App\Entity\MediaCategory;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IntegerField;
use EasyCorp\Bundle\EasyAdminBundle\Field\SlugField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;

#[IsGranted('ROLE_CONTENT')]
class MediaCategoryCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return MediaCategory::class;
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setEntityLabelInSingular('Catégorie média')
            ->setEntityLabelInPlural('Catégories média')
            ->setDefaultSort(['position' => 'ASC'])
            ->setSearchFields(['name', 'slug'])
            ->setHelp(
                Crud::PAGE_INDEX,
                'Ces catégories alimentent les filtres de la médiathèque du site. '
                . 'Une catégorie sans média n\'apparaît pas dans les filtres publics.'
            );
    }

    public function configureFields(string $pageName): iterable
    {
        yield IdField::new('id')->onlyOnDetail();
        yield TextField::new('name', 'Nom')
            ->setHelp('Libellé affiché dans les filtres du site (ex. « Concert »).');
        yield SlugField::new('slug', 'Slug')
            ->setTargetFieldName('name')
            ->setHelp('Identifiant technique utilisé dans l\'URL de filtrage.')
            ->hideOnIndex();
        yield IntegerField::new('position', 'Ordre')
            ->setHelp('Ordre d\'affichage dans la liste des filtres (croissant).');
    }
}
