<?php

namespace App\Controller\Admin;

use Symfony\Component\Security\Http\Attribute\IsGranted;

use App\Entity\Donation;
use App\Enum\ContributionTier;
use App\Enum\PaymentOperator;
use EasyCorp\Bundle\EasyAdminBundle\Config\Action;
use EasyCorp\Bundle\EasyAdminBundle\Config\Actions;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Config\Filters;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\AssociationField;
use EasyCorp\Bundle\EasyAdminBundle\Field\ChoiceField;
use EasyCorp\Bundle\EasyAdminBundle\Field\CodeEditorField;
use EasyCorp\Bundle\EasyAdminBundle\Field\DateTimeField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\NumberField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;
use EasyCorp\Bundle\EasyAdminBundle\Filter\ChoiceFilter;
use EasyCorp\Bundle\EasyAdminBundle\Filter\DateTimeFilter;
use EasyCorp\Bundle\EasyAdminBundle\Filter\NumericFilter;

#[IsGranted('ROLE_ADMIN')]
class DonationCrudController extends AbstractCrudController
{
    private const STATUS_CHOICES = [
        'En attente' => Donation::STATUS_PENDING,
        'Payé' => Donation::STATUS_PAID,
        'Échoué' => Donation::STATUS_FAILED,
        'Expiré' => Donation::STATUS_EXPIRED,
    ];

    public static function getEntityFqcn(): string
    {
        return Donation::class;
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setEntityLabelInSingular('Don')
            ->setEntityLabelInPlural('Dons')
            ->setDefaultSort(['createdAt' => 'DESC'])
            ->setSearchFields(['reference', 'makutaTransactionId', 'message', 'donor.name', 'donor.email'])
            ->setPaginatorPageSize(30);
    }

    public function configureActions(Actions $actions): Actions
    {
        // Les dons sont pilotés par le système (Makuta) : consultation seulement.
        return $actions
            ->add(Crud::PAGE_INDEX, Action::DETAIL)
            ->disable(Action::NEW, Action::EDIT, Action::DELETE, Action::BATCH_DELETE);
    }

    public function configureFilters(Filters $filters): Filters
    {
        return $filters
            ->add(ChoiceFilter::new('status', 'Statut')->setChoices(self::STATUS_CHOICES))
            ->add(ChoiceFilter::new('operator', 'Opérateur')->setChoices($this->operatorChoices()))
            ->add(ChoiceFilter::new('tier', 'Palier')->setChoices($this->tierChoices()))
            ->add(NumericFilter::new('amount', 'Montant'))
            ->add(DateTimeFilter::new('createdAt', 'Date de création'));
    }

    public function configureFields(string $pageName): iterable
    {
        yield IdField::new('id')->onlyOnDetail();
        yield TextField::new('reference', 'Référence');
        yield AssociationField::new('donor', 'Donateur');
        yield NumberField::new('amount', 'Montant')->setNumDecimals(2);
        yield TextField::new('currency', 'Devise')->hideOnIndex();
        yield TextField::new('tierLabel', 'Palier');
        yield TextField::new('operatorLabel', 'Opérateur');
        yield ChoiceField::new('status', 'Statut')
            ->setChoices(self::STATUS_CHOICES)
            ->renderAsBadges([
                Donation::STATUS_PAID => 'success',
                Donation::STATUS_PENDING => 'warning',
                Donation::STATUS_FAILED => 'danger',
                Donation::STATUS_EXPIRED => 'secondary',
            ]);
        yield TextField::new('makutaTransactionId', 'ID Makuta')->hideOnIndex();
        // Suivi « pour qui » : soi / un proche / une organisation (+ bénéficiaire).
        yield TextField::new('donorTypeLabel', 'Pour qui');
        yield TextField::new('beneficiaryName', 'Bénéficiaire')->hideOnIndex();
        yield TextField::new('beneficiaryEmail', 'E-mail bénéficiaire')->onlyOnDetail();
        yield TextField::new('beneficiaryMessage', 'Message au bénéficiaire')->onlyOnDetail();
        yield DateTimeField::new('createdAt', 'Créé le');
        yield DateTimeField::new('confirmedAt', 'Confirmé le')->hideOnIndex();
        yield TextField::new('message', 'Message')->hideOnIndex();
        yield TextField::new('redirectUrl', 'URL de redirection')->onlyOnDetail();
        yield CodeEditorField::new('callbackPayloadJson', 'Payload callback (audit)')
            ->onlyOnDetail()
            ->setLanguage('js');
    }

    /** @return array<string,string> */
    private function operatorChoices(): array
    {
        $out = [];
        foreach (PaymentOperator::cases() as $op) {
            $out[$op->label()] = $op->value;
        }

        return $out;
    }

    /** @return array<string,string> */
    private function tierChoices(): array
    {
        $out = [];
        foreach (ContributionTier::cases() as $t) {
            $out[$t->label()] = $t->value;
        }

        return $out;
    }
}
