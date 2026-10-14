<?php

namespace App\Controller\Admin;

use App\Entity\AuditLog;
use App\Entity\User;
use EasyCorp\Bundle\EasyAdminBundle\Config\Action;
use EasyCorp\Bundle\EasyAdminBundle\Config\Actions;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\CodeEditorField;
use EasyCorp\Bundle\EasyAdminBundle\Field\DateTimeField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;
use EasyCorp\Bundle\EasyAdminBundle\Filter\DateTimeFilter;
use EasyCorp\Bundle\EasyAdminBundle\Filter\TextFilter;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted(User::ROLE_SUPER_ADMIN)]
class AuditLogCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return AuditLog::class;
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setEntityLabelInSingular('Entrée d\'audit')
            ->setEntityLabelInPlural('Journal d\'audit')
            ->setDefaultSort(['createdAt' => 'DESC'])
            ->setSearchFields(['action', 'performedBy', 'summary', 'entityId'])
            ->setPaginatorPageSize(50);
    }

    public function configureActions(Actions $actions): Actions
    {
        // Journal en lecture seule.
        return $actions
            ->add(Crud::PAGE_INDEX, Action::DETAIL)
            ->disable(Action::NEW, Action::EDIT, Action::DELETE, Action::BATCH_DELETE);
    }

    public function configureFilters(\EasyCorp\Bundle\EasyAdminBundle\Config\Filters $filters): \EasyCorp\Bundle\EasyAdminBundle\Config\Filters
    {
        return $filters
            ->add(TextFilter::new('action', 'Action'))
            ->add(TextFilter::new('performedBy', 'Auteur'))
            ->add(DateTimeFilter::new('createdAt', 'Date'));
    }

    public function configureFields(string $pageName): iterable
    {
        yield IdField::new('id')->onlyOnDetail();
        yield DateTimeField::new('createdAt', 'Date');
        yield TextField::new('action', 'Action');
        yield TextField::new('performedBy', 'Auteur');
        yield TextField::new('summary', 'Résumé');
        yield TextField::new('entityType', 'Type')->hideOnIndex();
        yield TextField::new('entityId', 'ID cible')->hideOnIndex();
        yield TextField::new('ip', 'IP')->hideOnIndex();
        yield CodeEditorField::new('detailsJson', 'Détails')
            ->onlyOnDetail()
            ->setLanguage('js');
    }
}
