<?php

namespace App\Command;

use App\Entity\Partner;
use App\Repository\PartnerRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * Initialise les partenaires affichés dans « Ils nous accompagnent ».
 * Idempotent (upsert par nom).
 *
 *   php bin/console app:content:seed-partners
 */
#[AsCommand(
    name: 'app:content:seed-partners',
    description: 'Initialise les partenaires du centre',
)]
class SeedPartnersCommand extends Command
{
    public function __construct(
        private EntityManagerInterface $em,
        private PartnerRepository $repo,
    ) {
        parent::__construct();
    }

    /** @var list<array{name:string,logo:string}> */
    private const PARTNERS = [
        ['name' => 'Orange', 'logo' => '/images/partners/orange.png'],
        ['name' => 'ADN', 'logo' => '/images/partners/adn.png'],
    ];

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $created = 0;
        $updated = 0;
        foreach (self::PARTNERS as $i => $data) {
            $existing = $this->repo->findOneByName($data['name']);
            $partner = $existing ?? new Partner();
            $partner->setName($data['name']);
            $partner->setLogo($data['logo']);
            $partner->setPosition($i);
            $partner->setIsActive(true);
            $this->em->persist($partner);
            $existing ? $updated++ : $created++;
        }
        $this->em->flush();

        $io->success(sprintf('Partenaires : %d créé(s), %d mis à jour.', $created, $updated));

        return Command::SUCCESS;
    }
}
