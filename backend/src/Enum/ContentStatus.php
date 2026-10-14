<?php

namespace App\Enum;

/** Statut de publication d'un contenu éditorial. */
enum ContentStatus: string
{
    case DRAFT = 'draft';
    case PUBLISHED = 'published';

    public function label(): string
    {
        return match ($this) {
            self::DRAFT => 'Brouillon',
            self::PUBLISHED => 'Publié',
        };
    }

    /** @return array<string,string> label => value (pour EasyAdmin/validation) */
    public static function choices(): array
    {
        return [
            self::DRAFT->label() => self::DRAFT->value,
            self::PUBLISHED->label() => self::PUBLISHED->value,
        ];
    }
}
