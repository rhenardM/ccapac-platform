<?php

namespace App\Controller\Admin;

use Symfony\Component\Security\Http\Attribute\IsGranted;

use App\Entity\FilmGalleryImage;
use App\EasyAdmin\UploadConstraints;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\AssociationField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\ImageField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IntegerField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;

#[IsGranted('ROLE_CINEMATHEQUE')]
class FilmGalleryImageCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return FilmGalleryImage::class;
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setEntityLabelInSingular('Image de galerie')
            ->setEntityLabelInPlural('Cinémathèque — Galerie')
            ->setDefaultSort(['film' => 'DESC', 'position' => 'ASC']);
    }

    public function configureFields(string $pageName): iterable
    {
        yield IdField::new('id')->onlyOnDetail();
        yield AssociationField::new('film', 'Film');
        yield ImageField::new('image', 'Image')
            ->setBasePath('/uploads/media')
            ->setUploadDir('public/uploads/media')
            ->setUploadedFileNamePattern('gallery-[randomhash].[extension]')
            ->setFileConstraints(UploadConstraints::image())
            ->setHelp(UploadConstraints::helpText());
        yield TextField::new('caption', 'Légende')->hideOnIndex();
        yield IntegerField::new('position', 'Ordre');
    }
}
