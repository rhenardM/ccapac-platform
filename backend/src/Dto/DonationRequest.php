<?php

namespace App\Dto;

use App\Enum\ContributionTier;
use App\Enum\PaymentOperator;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Charge utile attendue par POST /api/donations.
 */
class DonationRequest
{
    #[Assert\NotBlank(message: 'Le nom complet ou le nom de l\'organisation est requis.')]
    #[Assert\Length(max: 255)]
    public string $donorName = '';

    #[Assert\NotBlank(message: 'L\'adresse e-mail est requise.')]
    #[Assert\Email(message: 'L\'adresse e-mail n\'est pas valide.')]
    #[Assert\Length(max: 180)]
    public string $donorEmail = '';

    #[Assert\Length(max: 32)]
    public ?string $donorPhone = null;

    #[Assert\NotNull(message: 'Le montant est requis.')]
    #[Assert\Positive(message: 'Le montant doit être supérieur à zéro.')]
    public ?float $amount = null;

    #[Assert\NotBlank(message: 'Le palier de contribution est requis.')]
    #[Assert\Choice(callback: [ContributionTier::class, 'values'], message: 'Palier inconnu.')]
    public string $tier = '';

    #[Assert\NotBlank(message: 'Le moyen de paiement est requis.')]
    #[Assert\Choice(callback: [PaymentOperator::class, 'values'], message: 'Moyen de paiement non supporté.')]
    public string $operator = '';

    /** Numéro Mobile Money (requis pour les opérateurs Mobile Money). */
    #[Assert\Length(max: 32)]
    public ?string $payNumber = null;

    /** E-mail spécifique pour le paiement carte (Visa CNP) ; sinon donorEmail. */
    #[Assert\Email(message: 'L\'adresse e-mail de paiement n\'est pas valide.')]
    public ?string $email = null;

    /**
     * Pour qui le don est fait : self (soi-même), relative (un proche),
     * organization (une structure). Sert au suivi.
     */
    #[Assert\Choice(choices: ['self', 'relative', 'organization'], message: 'Type de donateur inconnu.')]
    public string $donorType = 'self';

    /** Nom du bénéficiaire (proche/organisation) quand le don est offert au nom d'autrui. */
    #[Assert\Length(max: 255)]
    public ?string $beneficiaryName = null;

    /** E-mail du bénéficiaire (pour l'e-mail « en votre honneur »). */
    #[Assert\Email(message: 'L\'adresse e-mail du bénéficiaire n\'est pas valide.')]
    #[Assert\Length(max: 180)]
    public ?string $beneficiaryEmail = null;

    /** Message personnel adressé au bénéficiaire. */
    #[Assert\Length(max: 1000)]
    public ?string $beneficiaryMessage = null;
}
