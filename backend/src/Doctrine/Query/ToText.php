<?php

namespace App\Doctrine\Query;

use Doctrine\DBAL\Platforms\PostgreSQLPlatform;
use Doctrine\ORM\Query\AST\Functions\FunctionNode;
use Doctrine\ORM\Query\AST\Node;
use Doctrine\ORM\Query\Parser;
use Doctrine\ORM\Query\SqlWalker;
use Doctrine\ORM\Query\TokenType;

/**
 * TO_TEXT(expr) : convertit une date/heure en texte ISO ('YYYY-MM-DD[ HH:MM:SS]'),
 * quel que soit le moteur. Permet SUBSTRING(TO_TEXT(m.eventDate), 1, 4) :
 * MySQL accepte SUBSTRING directement sur une date, PostgreSQL non.
 */
class ToText extends FunctionNode
{
    public Node $expression;

    public function parse(Parser $parser): void
    {
        $parser->match(TokenType::T_IDENTIFIER);
        $parser->match(TokenType::T_OPEN_PARENTHESIS);
        $this->expression = $parser->ArithmeticPrimary();
        $parser->match(TokenType::T_CLOSE_PARENTHESIS);
    }

    public function getSql(SqlWalker $sqlWalker): string
    {
        $type = $sqlWalker->getConnection()->getDatabasePlatform() instanceof PostgreSQLPlatform ? 'TEXT' : 'CHAR';

        return sprintf('CAST(%s AS %s)', $this->expression->dispatch($sqlWalker), $type);
    }
}
