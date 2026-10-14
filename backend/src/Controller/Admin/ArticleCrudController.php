<?php

namespace App\Controller\Admin;

use Symfony\Component\Security\Http\Attribute\IsGranted;

use App\Entity\Article;
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

#[IsGranted('ROLE_ACTUALITES')]
class ArticleCrudController extends AbstractCrudController
{
    public function __construct(private AdminUrlGenerator $adminUrlGenerator)
    {
    }

    public static function getEntityFqcn(): string
    {
        return Article::class;
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setEntityLabelInSingular('Article de presse')
            ->setEntityLabelInPlural('Presse du Grand Tambour')
            ->setDefaultSort(['publishedAt' => 'DESC'])
            ->setSearchFields(['title', 'slug', 'author', 'excerpt']);
    }

    public function configureActions(Actions $actions): Actions
    {
        // Bouton « Ajouter une catégorie » directement depuis la liste des articles.
        $addCategory = Action::new('addArticleCategory', 'Ajouter une catégorie', 'fa fa-tags')
            ->createAsGlobalAction()
            ->linkToUrl(
                $this->adminUrlGenerator
                    ->setController(ArticleCategoryCrudController::class)
                    ->setAction(Action::NEW)
                    ->generateUrl()
            );

        return $actions->add(Crud::PAGE_INDEX, $addCategory);
    }

    public function configureFields(string $pageName): iterable
    {
        yield IdField::new('id')->onlyOnDetail();
        yield TextField::new('title', 'Titre');
        yield SlugField::new('slug', 'Slug')->setTargetFieldName('title')->hideOnIndex();
        yield AssociationField::new('category', 'Catégorie');
        yield ChoiceField::new('status', 'Statut');
        yield BooleanField::new('featured', 'À la une');
        yield TextField::new('author', 'Auteur')->hideOnIndex();
        yield IntegerField::new('readingTime', 'Lecture (min)')->hideOnIndex();
        yield DateTimeField::new('publishedAt', 'Publié le');
        yield IntegerField::new('viewCount', 'Vues')
            ->setFormTypeOption('disabled', true)
            ->hideWhenCreating();
        yield ImageField::new('image', 'Image (vignette)')
            ->setBasePath('/uploads/media')
            ->setUploadDir('public/uploads/media')
            ->setUploadedFileNamePattern('[slug]-[timestamp].[extension]')
            ->setFileConstraints(UploadConstraints::image())
            ->setHelp(UploadConstraints::helpText())
            ->setRequired(false);
        yield ImageField::new('coverImage', 'Image de couverture')
            ->setBasePath('/uploads/media')
            ->setUploadDir('public/uploads/media')
            ->setUploadedFileNamePattern('[slug]-cover-[timestamp].[extension]')
            ->setFileConstraints(UploadConstraints::image())
            ->setHelp(UploadConstraints::helpText())
            ->setRequired(false)
            ->hideOnIndex();
        yield TextareaField::new('excerpt', 'Chapô / résumé')->hideOnIndex();
        yield TextEditorField::new('content', 'Contenu')->hideOnIndex();
    }
}
