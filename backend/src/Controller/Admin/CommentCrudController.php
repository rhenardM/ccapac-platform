<?php

namespace App\Controller\Admin;

use App\Entity\Comment;
use App\Enum\CommentAuthorRole;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\AssociationField;
use EasyCorp\Bundle\EasyAdminBundle\Field\BooleanField;
use EasyCorp\Bundle\EasyAdminBundle\Field\ChoiceField;
use EasyCorp\Bundle\EasyAdminBundle\Field\DateTimeField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextareaField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_ACTUALITES')]
class CommentCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return Comment::class;
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setEntityLabelInSingular('Commentaire')
            ->setEntityLabelInPlural('Commentaires (Presse)')
            ->setDefaultSort(['createdAt' => 'DESC'])
            ->setSearchFields(['authorName', 'authorEmail', 'content']);
    }

    public function configureFields(string $pageName): iterable
    {
        yield IdField::new('id')->onlyOnDetail();
        yield AssociationField::new('article', 'Article');
        yield AssociationField::new('parent', 'Réponse à')->hideOnIndex();
        yield TextField::new('authorName', 'Auteur');
        yield TextField::new('authorEmail', 'E-mail')->hideOnIndex();
        yield ChoiceField::new('authorRole', 'Rôle')
            ->setChoices([
                CommentAuthorRole::VISITOR->label() => CommentAuthorRole::VISITOR,
                CommentAuthorRole::MEMBER->label() => CommentAuthorRole::MEMBER,
                CommentAuthorRole::ADMIN->label() => CommentAuthorRole::ADMIN,
            ])
            ->renderAsBadges();
        yield TextareaField::new('content', 'Message');
        yield BooleanField::new('isHidden', 'Masqué');
        yield DateTimeField::new('createdAt', 'Publié le')->hideOnForm();
    }
}
