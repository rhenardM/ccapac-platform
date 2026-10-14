<?php

namespace App\Controller\Admin;

use Symfony\Component\Security\Http\Attribute\IsGranted;

use App\Entity\NewsletterSubscriber;
use EasyCorp\Bundle\EasyAdminBundle\Config\Action;
use EasyCorp\Bundle\EasyAdminBundle\Config\Actions;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\BooleanField;
use EasyCorp\Bundle\EasyAdminBundle\Field\DateTimeField;
use EasyCorp\Bundle\EasyAdminBundle\Field\EmailField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;

#[IsGranted('ROLE_CONTENT')]
class NewsletterSubscriberCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return NewsletterSubscriber::class;
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setEntityLabelInSingular('Abonné')
            ->setEntityLabelInPlural('Abonnés newsletter')
            ->setDefaultSort(['createdAt' => 'DESC'])
            ->setSearchFields(['email', 'name']);
    }

    public function configureActions(Actions $actions): Actions
    {
        $import = Action::new('nlImport', 'Importer CSV', 'fa fa-file-import')
            ->linkToRoute('admin_newsletter_import')
            ->createAsGlobalAction();

        $export = Action::new('nlExport', 'Exporter (CSV/Excel)', 'fa fa-file-export')
            ->linkToRoute('admin_newsletter_export')
            ->createAsGlobalAction();

        $campaign = Action::new('nlCampaign', 'Envoyer une campagne', 'fa fa-paper-plane')
            ->linkToRoute('admin_newsletter_campaign')
            ->createAsGlobalAction();

        // Les inscriptions viennent du site ; on consulte, active/désactive,
        // et on gère import / export / campagne depuis les boutons de la liste.
        return $actions
            ->add(Crud::PAGE_INDEX, Action::DETAIL)
            ->add(Crud::PAGE_INDEX, $import)
            ->add(Crud::PAGE_INDEX, $export)
            ->add(Crud::PAGE_INDEX, $campaign);
    }

    public function configureFields(string $pageName): iterable
    {
        yield IdField::new('id')->onlyOnDetail();
        yield EmailField::new('email', 'E-mail');
        yield TextField::new('name', 'Nom')->hideOnIndex();
        yield BooleanField::new('isActive', 'Actif');
        yield TextField::new('source', 'Source')->hideOnIndex();
        yield DateTimeField::new('createdAt', 'Inscrit le')->hideOnForm();
        yield DateTimeField::new('unsubscribedAt', 'Désinscrit le')->onlyOnDetail();
    }
}
