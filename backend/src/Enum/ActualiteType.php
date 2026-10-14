<?php

namespace App\Enum;

/** Type d'actualité : article éditorial ou édition de newsletter (PDF). */
enum ActualiteType: string
{
    case ARTICLE = 'ARTICLE';
    case NEWSLETTER = 'NEWSLETTER';

    public function label(): string
    {
        return match ($this) {
            self::ARTICLE => 'Article',
            self::NEWSLETTER => 'Newsletter',
        };
    }

    /** @return array<string,string> */
    public static function choices(): array
    {
        return [
            self::ARTICLE->label() => self::ARTICLE->value,
            self::NEWSLETTER->label() => self::NEWSLETTER->value,
        ];
    }
}
