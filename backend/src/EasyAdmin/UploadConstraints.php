<?php

namespace App\EasyAdmin;

use Symfony\Component\Validator\Constraints\File;
use Symfony\Component\Validator\Constraints\Image;

/**
 * Contraintes de taille/type partagées par les champs d'upload EasyAdmin
 * (images de couverture, logos, PDF de newsletter...).
 */
final class UploadConstraints
{
    public const MAX_SIZE = '20M';
    public const MAX_SIZE_LABEL = '20 Mo';

    // Les messages par défaut de Symfony (taille, type MIME...) sont déjà traduits
    // en français par le bundle validator — inutile de les personnaliser ici, il
    // suffit que la locale par défaut de l'app soit "fr" (voir translation.yaml).

    /** @return Image[] */
    public static function image(): array
    {
        return [new Image(maxSize: self::MAX_SIZE)];
    }

    /** @return File[] */
    public static function pdf(): array
    {
        return [new File(
            maxSize: self::MAX_SIZE,
            mimeTypes: ['application/pdf'],
        )];
    }

    /** Texte affiché sous le champ pour indiquer la limite avant l'upload. */
    public static function helpText(string $formats = 'JPG, PNG, WebP'): string
    {
        return sprintf('%s. %s maximum.', $formats, self::MAX_SIZE_LABEL);
    }
}
