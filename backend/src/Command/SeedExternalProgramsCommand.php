<?php

namespace App\Command;

use App\Entity\Program;
use App\Enum\ContentStatus;
use App\Enum\ProgramScope;
use App\Repository\ProgramRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * Peuple les programmes EXTERNES (partenaires) à partir des exemples
 * historiquement statiques (caapac/src/data/programmes-externes.ts).
 * Idempotent (upsert par slug). Pas de rubrique (category null), scope=externe.
 *
 *   php bin/console app:content:seed-external-programs
 */
#[AsCommand(
    name: 'app:content:seed-external-programs',
    description: 'Initialise les programmes externes (partenaires)',
)]
class SeedExternalProgramsCommand extends Command
{
    public function __construct(
        private EntityManagerInterface $em,
        private ProgramRepository $programRepo,
    ) {
        parent::__construct();
    }

    /** @var list<array<string,mixed>> */
    private const PROGRAMS = [
        ['slug' => 'salon-imprimerie', 'title' => "Salon de l'Imprimerie", 'organizer' => 'Grand Tambour', 'discipline' => 'Arts graphiques', 'description' => "Le Salon de l'Imprimerie est une rencontre culturelle dédiée à l'art de l'imprimerie, réunissant professionnels, artistes et amateurs autour du livre, de l'édition et des arts graphiques.", 'image' => '/images/Programe-externe/Salon-imprimerie/ER8A4108.jpg', 'location' => 'Grand Tambour, Kinshasa', 'period' => null, 'externalUrl' => null],
        ['slug' => 'programme-partenaire-exemple', 'title' => 'Programme partenaire (exemple)', 'organizer' => 'Partenaire culturel', 'discipline' => 'Arts vivants', 'description' => "Exemple de programme culturel porté par une structure partenaire, accueilli ou soutenu par le Grand Tambour. À remplacer par un programme réel.", 'image' => '/images/events/event1.jpg', 'location' => 'Kinshasa', 'period' => 'À venir', 'externalUrl' => null],
        ['slug' => 'residence-croisee-exemple', 'title' => 'Résidence croisée (exemple)', 'organizer' => 'Institution partenaire', 'discipline' => 'Résidences', 'description' => "Exemple de résidence ou d'échange organisé avec une institution externe. À remplacer par un programme réel.", 'image' => '/images/media/media4.jpg', 'location' => 'Kinshasa', 'period' => 'À venir', 'externalUrl' => null],
        ['slug' => 'festival-invite-exemple', 'title' => 'Festival invité (exemple)', 'organizer' => 'Collectif partenaire', 'discipline' => 'Cinéma', 'description' => "Exemple de festival ou d'événement invité, programmé en collaboration avec un acteur culturel externe. À remplacer par un programme réel.", 'image' => '/images/media/cinema.jpg', 'location' => 'Kinshasa', 'period' => 'À venir', 'externalUrl' => null],
    ];

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $created = 0;
        $updated = 0;
        foreach (self::PROGRAMS as $i => $data) {
            $existing = $this->programRepo->findOneBySlug($data['slug']);
            $prog = $existing ?? new Program();
            $prog->setSlug($data['slug']);
            $prog->setTitle($data['title']);
            $prog->setCategory(null); // externe : pas de rubrique interne
            $prog->setScope(ProgramScope::EXTERNE);
            $prog->setOrganizer($data['organizer']);
            $prog->setDiscipline($data['discipline']);
            $prog->setDescription($data['description']);
            $prog->setCoverImage($data['image']);
            $prog->setLocation($data['location']);
            $prog->setPeriod($data['period']);
            $prog->setExternalUrl($data['externalUrl']);
            $prog->setPosition($i);
            $prog->setStatus(ContentStatus::PUBLISHED);
            $this->em->persist($prog);
            $existing ? $updated++ : $created++;
        }
        $this->em->flush();

        $io->success(sprintf('Programmes externes : %d créé(s), %d mis à jour.', $created, $updated));

        return Command::SUCCESS;
    }
}
