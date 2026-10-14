<?php

namespace App\Enum;

/** Statut de l'auteur d'un commentaire d'article, pour l'affichage (badge) côté site. */
enum CommentAuthorRole: string
{
    case VISITOR = 'visitor';
    case MEMBER = 'member';
    case ADMIN = 'admin';

    public function label(): string
    {
        return match ($this) {
            self::VISITOR => 'Visiteur',
            self::MEMBER => 'Membre',
            self::ADMIN => 'Centre culturel',
        };
    }

    /** @return array<string,string> label => value (pour EasyAdmin) */
    public static function choices(): array
    {
        return [
            self::VISITOR->label() => self::VISITOR->value,
            self::MEMBER->label() => self::MEMBER->value,
            self::ADMIN->label() => self::ADMIN->value,
        ];
    }
}
