<?php

namespace App\Form;

use App\Entity\CinemathequeSettings;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\UrlType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class CinemathequeSettingsType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder->add('bookingUrl', UrlType::class, [
            'label' => 'URL de la billetterie',
            'required' => false,
            'help' => 'Pour les séances payantes, le bouton « Réserver ma place » redirigera '
                . 'vers cette adresse en attendant l\'intégration de la vraie plateforme de billetterie. '
                . 'Les séances gratuites affichent un formulaire d\'inscription à la place.',
            'attr' => ['placeholder' => 'https://billetterie.centreculturel.cd/...'],
        ]);
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults(['data_class' => CinemathequeSettings::class]);
    }
}
