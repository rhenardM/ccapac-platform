<?php

namespace App\Controller\Admin;

use Symfony\Component\Security\Http\Attribute\IsGranted;

use App\Entity\Screening;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\AssociationField;
use EasyCorp\Bundle\EasyAdminBundle\Field\BooleanField;
use EasyCorp\Bundle\EasyAdminBundle\Field\DateField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IntegerField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextareaField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TimeField;

#[IsGranted('ROLE_CINEMATHEQUE')]
class ScreeningCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return Screening::class;
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setEntityLabelInSingular('Projection')
            ->setEntityLabelInPlural('Cinémathèque — Projections')
            ->setDefaultSort(['scheduledDate' => 'DESC'])
            ->setSearchFields(['venue', 'description']);
    }

    public function configureFields(string $pageName): iterable
    {
        yield IdField::new('id')->onlyOnDetail();
        yield AssociationField::new('film', 'Film');
        yield DateField::new('scheduledDate', 'Date');
        yield TimeField::new('startTime', 'Heure de début')->setFormTypeOption('widget', 'single_text');
        yield TimeField::new('endTime', 'Heure de fin')
            ->setFormTypeOption('widget', 'single_text')
            ->setHelp('Optionnel')
            ->hideOnIndex();
        yield TextField::new('venue', 'Lieu');
        yield TextField::new('statusLabel', 'Statut')->hideOnForm();
        yield BooleanField::new('isVisible', 'Visible sur le site')
            ->setHelp('Décochez pour masquer cette séance du site sans la supprimer.');
        yield BooleanField::new('featured', 'En vedette')
            ->setHelp('Optionnel : la prochaine séance à venir est déjà mise en avant automatiquement.');
        yield IntegerField::new('position', 'Ordre')->hideOnIndex();
        yield BooleanField::new('isFree', 'Gratuit')
            ->setHelp('Active le bouton "S\'inscrire" (gratuit) ou "Réserver ma place" avec le tarif ci-dessous (payant, redirige vers la billetterie réglée dans Réglages billetterie).');
        yield IntegerField::new('price', 'Prix (FC)')
            ->setHelp('À renseigner si la séance est payante.')
            ->hideOnIndex();
        yield IntegerField::new('capacityTotal', 'Places totales')->hideOnIndex();
        yield IntegerField::new('capacityTaken', 'Places prises')->hideOnIndex();
        yield TextareaField::new('description', 'Description de la séance')->hideOnIndex();
        yield IntegerField::new('viewCount', 'Vues')
            ->setFormTypeOption('disabled', true)
            ->hideWhenCreating();
        yield BooleanField::new('isCancelled', '⚠ Annuler cette séance')
            ->setHelp('N\'activez que si la séance n\'aura pas lieu : elle disparaîtra alors des listes du site.')
            ->hideOnIndex();
    }
}
