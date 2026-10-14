<?php

namespace App\Controller\Admin;

use Symfony\Component\Security\Http\Attribute\IsGranted;

use App\Entity\FilmCategory;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IntegerField;
use EasyCorp\Bundle\EasyAdminBundle\Field\SlugField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;

#[IsGranted('ROLE_CINEMATHEQUE')]
class FilmCategoryCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return FilmCategory::class;
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setEntityLabelInSingular('Genre de film')
            ->setEntityLabelInPlural('Genres de films')
            ->setDefaultSort(['position' => 'ASC'])
            ->setSearchFields(['name', 'slug']);
    }

    public function configureFields(string $pageName): iterable
    {
        yield IdField::new('id')->onlyOnDetail();
        yield TextField::new('name', 'Nom');
        yield SlugField::new('slug', 'Slug')->setTargetFieldName('name')->hideOnIndex();
        yield IntegerField::new('position', 'Ordre');
    }
}
