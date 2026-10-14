<?php

namespace App\Repository;

use App\Entity\CinemathequeSettings;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<CinemathequeSettings>
 */
class CinemathequeSettingsRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CinemathequeSettings::class);
    }

    /** Charge l'unique ligne de réglages, en la créant si elle n'existe pas encore. */
    public function getOrCreate(EntityManagerInterface $em): CinemathequeSettings
    {
        $settings = $this->find(1);
        if ($settings) {
            return $settings;
        }

        $settings = new CinemathequeSettings();
        $em->persist($settings);
        $em->flush();

        return $settings;
    }
}
