<?php

namespace App\Form;

use App\EasyAdmin\UploadConstraints;
use App\Entity\SpacesPageSettings;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\FileType;
use Symfony\Component\Form\Extension\Core\Type\TextareaType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class SpacesPageSettingsType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('heroKicker', TextType::class, [
                'label' => 'Sur-titre (petit texte au-dessus du titre)',
                'required' => false,
            ])
            ->add('heroTitle', TextType::class, [
                'label' => 'Titre principal',
                'required' => false,
            ])
            ->add('introText', TextareaType::class, [
                'label' => 'Texte d\'introduction',
                'required' => false,
                'attr' => ['rows' => 4],
            ])
            ->add('heroBackgroundImageFile', FileType::class, [
                'label' => 'Image de fond (laisser vide pour ne pas changer)',
                'required' => false,
                'mapped' => false,
                'constraints' => UploadConstraints::image(),
                'help' => UploadConstraints::helpText(),
            ]);
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults(['data_class' => SpacesPageSettings::class]);
    }
}
