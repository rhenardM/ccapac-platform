<?php

namespace App\Controller\Admin;

use App\Entity\Program;
use App\Enum\ProgramScope;
use Doctrine\ORM\QueryBuilder;
use EasyCorp\Bundle\EasyAdminBundle\Collection\FieldCollection;
use EasyCorp\Bundle\EasyAdminBundle\Collection\FilterCollection;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Dto\EntityDto;
use EasyCorp\Bundle\EasyAdminBundle\Dto\SearchDto;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Programmes INTERNES (produits par le Grand Tambour).
 * Même entité que ProgramCrudController, mais filtrée sur scope = interne
 * et pré-remplie en interne à la création.
 */
#[IsGranted('ROLE_ACTION_CULTURELLE')]
class InternalProgramCrudController extends ProgramCrudController
{
    public function configureCrud(Crud $crud): Crud
    {
        return parent::configureCrud($crud)
            ->setEntityLabelInSingular('Programme interne')
            ->setEntityLabelInPlural('Programmes internes');
    }

    public function createIndexQueryBuilder(
        SearchDto $searchDto,
        EntityDto $entityDto,
        FieldCollection $fields,
        FilterCollection $filters,
    ): QueryBuilder {
        return parent::createIndexQueryBuilder($searchDto, $entityDto, $fields, $filters)
            ->andWhere('entity.scope = :scope')
            ->setParameter('scope', ProgramScope::INTERNE->value);
    }

    public function createEntity(string $entityFqcn): Program
    {
        $program = new Program();
        $program->setScope(ProgramScope::INTERNE);

        return $program;
    }
}
