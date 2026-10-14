<?php

namespace App\Repository;

use App\Entity\SpacesPageSettings;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<SpacesPageSettings>
 */
class SpacesPageSettingsRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, SpacesPageSettings::class);
    }

    /** Charge l'unique ligne de réglages, en la créant si elle n'existe pas encore. */
    public function getOrCreate(EntityManagerInterface $em): SpacesPageSettings
    {
        $settings = $this->find(1);
        if ($settings) {
            return $settings;
        }

        $settings = new SpacesPageSettings();
        $em->persist($settings);
        $em->flush();

        return $settings;
    }
}
