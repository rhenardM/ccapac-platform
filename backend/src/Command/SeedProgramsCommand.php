<?php

namespace App\Command;

use App\Entity\Program;
use App\Entity\ProgramCategory;
use App\Enum\ContentStatus;
use App\Repository\ProgramCategoryRepository;
use App\Repository\ProgramRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * Peuple les rubriques + programmes de l'action culturelle à partir des données
 * historiquement codées en dur dans le front (programmes-data.ts).
 * Idempotent (upsert par slug) — relançable sans doublon.
 *
 *   php bin/console app:content:seed-programs
 */
#[AsCommand(
    name: 'app:content:seed-programs',
    description: 'Initialise les rubriques et programmes de l\'action culturelle',
)]
class SeedProgramsCommand extends Command
{
    public function __construct(
        private EntityManagerInterface $em,
        private ProgramCategoryRepository $categoryRepo,
        private ProgramRepository $programRepo,
    ) {
        parent::__construct();
    }

    /** @var list<array{slug:string,title:string,description:string,image:string,color:string}> */
    private const CATEGORIES = [
        ['slug' => 'musique-arts-vivants', 'title' => 'Arts', 'description' => 'Célébration de la richesse musicale et des performances scéniques congolaises', 'image' => '/images/events/event1.jpg', 'color' => 'from-red-600 to-orange-600'],
        ['slug' => 'theatre-arts-scene', 'title' => 'Dramathèque', 'description' => 'En novembre, dix jours de célébration réunissant troupes locales et internationales.', 'image' => '/images/events/event2.jpg', 'color' => 'from-purple-600 to-pink-600'],
        ['slug' => 'cinema-audiovisuel', 'title' => 'Cinémathèque', 'description' => 'Valorisation du cinéma et de la création audiovisuelle congolaise', 'image' => '/images/media/cinema.jpg', 'color' => 'from-blue-600 to-cyan-600'],
        ['slug' => 'litterature-pensee', 'title' => 'Biblio librairies', 'description' => 'Préservation et transmission du patrimoine culturel et littéraire', 'image' => '/images/media/media7.jpg', 'color' => 'from-green-600 to-teal-600'],
    ];

    /** @var list<array<string,mixed>> */
    private const PROGRAMS = [
        ['slug' => 'cinematheque-congolaise', 'title' => 'Cinémathèque congolaise', 'category' => 'cinema-audiovisuel', 'slogan' => 'Mémoire du cinéma congolais', 'description' => 'Chaque semaine, diffusion d’œuvres congolaises pour valoriser le cinéma national et assurer sa circulation.', 'objectif' => "Préserver et valoriser l'histoire du cinéma congolais", 'publicVise' => 'Cinéphiles, chercheurs, étudiants en cinéma', 'impact' => 'Sauvegarde de films historiques et éducation cinématographique', 'image' => '/images/media/media11.jpg', 'discipline' => 'Atelier', 'featured' => true],
        ['slug' => 'festival-kasala', 'title' => 'Festival KASALA', 'category' => 'cinema-audiovisuel', 'slogan' => 'Documentaires du Congo et d’Afrique', 'description' => 'Programme dédié au documentaire congolais et africain, avec résidences, ateliers et projections.', 'objectif' => 'Promouvoir la production cinématographique africaine', 'publicVise' => 'Réalisateurs, producteurs, distributeurs, grand public', 'impact' => 'Visibilité internationale du cinéma africain', 'image' => '/images/media/media9.jpg', 'discipline' => 'Atelier', 'featured' => false],
        ['slug' => 'coproductions-audiovisuel', 'title' => 'Coproductions & diffusion audiovisuelle', 'category' => 'cinema-audiovisuel', 'slogan' => 'Soutien à la création audiovisuelle', 'description' => 'Soutien à la création et à la circulation des œuvres audiovisuelles.', 'objectif' => "Faciliter la production et la diffusion d'œuvres audiovisuelles", 'publicVise' => 'Producteurs, réalisateurs, diffuseurs', 'impact' => 'Augmentation de la production audiovisuelle nationale', 'image' => '/images/events/event1.jpg', 'discipline' => 'Atelier', 'featured' => false],
        ['slug' => 'missa-congo', 'title' => 'Missa Congo', 'category' => 'musique-arts-vivants', 'slogan' => 'La messe congolaise qui unit tradition et spiritualité', 'description' => "Un grand concert caritatif avec la Fondation Joseph Diangienda Kutima et l'Orchestre Symphonique Kimbanguiste. Acte de mémoire, solidarité et élévation spirituelle par la musique.", 'objectif' => 'Valoriser la musique sacrée congolaise et créer un pont entre tradition religieuse et culture locale', 'publicVise' => 'Communautés religieuses, mélomanes, chercheurs en musicologie', 'impact' => 'Reconnaissance internationale de la Missa Congo comme patrimoine culturel immatériel', 'image' => '/images/events/event1.jpg', 'discipline' => 'Atelier', 'featured' => false],
        ['slug' => 'hommage-a-papa-wemba', 'title' => 'Papa Wemba, artiste majeur', 'category' => 'musique-arts-vivants', 'slogan' => 'Le maître de la rumba', 'description' => 'En avril, concerts, expositions et concours célèbrent l’œuvre et l’héritage du chanteur.', 'objectif' => "Perpétuer la mémoire et l'influence de Papa Wemba dans la musique africaine", 'publicVise' => 'Fans de rumba, jeunes artistes, public international', 'impact' => "Transmission de l'héritage musical aux nouvelles générations", 'image' => '/images/events/papa-wemba.jpg', 'discipline' => 'Atelier', 'featured' => true],
        ['slug' => 'african-fiesta-guitare-festival', 'title' => 'African Fiesta Guitare Festival', 'category' => 'musique-arts-vivants', 'slogan' => "La guitare africaine à l'honneur", 'description' => 'Un festival dédié à la guitare congolaise et africaine, emblème de la rumba.', 'objectif' => "Promouvoir l'excellence guitaristique africaine et créer des échanges entre musiciens", 'publicVise' => 'Guitaristes, musiciens, amateurs de musique africaine', 'impact' => "Création d'un réseau de guitaristes africains et formation de jeunes talents", 'image' => '/images/events/event1.jpg', 'discipline' => 'Atelier', 'featured' => false],
        ['slug' => 'maitre-rumba', 'title' => 'Le Maître de la Rumba', 'category' => 'musique-arts-vivants', 'slogan' => 'Retraçant l’odyssée culturelle des racines congolaises', 'description' => 'Festival bi-annuel retraçant l’odyssée culturelle des racines congolaises, symbole des liens avec la diaspora.', 'objectif' => "Documenter et célébrer l'histoire de la rumba congolaise", 'publicVise' => 'Historiens de la musique, danseurs, public intergénérationnel', 'impact' => 'Préservation de la mémoire collective de la rumba', 'image' => '/images/events/event1.jpg', 'discipline' => 'Atelier', 'featured' => false],
        ['slug' => 'fete-musique', 'title' => 'Fête de la Musique, Autrement', 'category' => 'musique-arts-vivants', 'slogan' => 'La musique dans tous ses états', 'description' => 'Le 22 juin, une édition innovante, ouverte aux fusions musicales et talents émergents.', 'objectif' => "Offrir une plateforme d'expression à tous les genres musicaux", 'publicVise' => 'Grand public, familles, artistes émergents', 'impact' => "Démocratisation de l'accès à la culture musicale", 'image' => '/images/events/event1.jpg', 'discipline' => 'Atelier', 'featured' => false],
        ['slug' => 'dramatheque-congolaise', 'title' => 'Dramathèque congolaise', 'category' => 'theatre-arts-scene', 'slogan' => 'Dépôt de la culture théâtrale congolaise et africaine', 'description' => 'Programme permanent dédié aux dramaturges et comédiens congolais et africains.', 'objectif' => 'Constituer une bibliothèque vivante des œuvres théâtrales congolaises et internationales', 'publicVise' => 'Comédiens, metteurs en scène, chercheurs, étudiants', 'impact' => 'Préservation et accessibilité du patrimoine théâtral national', 'image' => '/images/events/event1.jpg', 'discipline' => 'Atelier', 'featured' => true],
        ['slug' => 'festival-des-deux-rives', 'title' => 'Festival des Deux Rives', 'category' => 'theatre-arts-scene', 'slogan' => 'Dialogue interculturel entre Kinshasa et Brazzaville', 'description' => 'Rencontre Kinshasa-Brazzaville, spectacles et ateliers favorisent un dialogue interculturel.', 'objectif' => 'Promouvoir la création théâtrale contemporaine congolaise', 'publicVise' => 'Professionnels du théâtre, public amateur, institutions culturelles', 'impact' => 'Structuration du secteur théâtral et émergence de nouveaux talents', 'image' => '/images/events/event1.jpg', 'discipline' => 'Atelier', 'featured' => false],
        ['slug' => 'rencontres-africaines-theatre', 'title' => 'Rencontres africaines du théâtre', 'category' => 'theatre-arts-scene', 'slogan' => 'Le théâtre africain en dialogue', 'description' => 'En avril, dramaturges et comédiens de tout le continent se retrouvent au Centre.', 'objectif' => 'Créer un réseau panafricain de professionnels du théâtre', 'publicVise' => 'Professionnels du théâtre africain, programmateurs internationaux', 'impact' => 'Circulation des œuvres théâtrales africaines', 'image' => '/images/events/event1.jpg', 'discipline' => 'Atelier', 'featured' => false],
        ['slug' => 'au-temps-en-rire', 'title' => 'Au Temps en Rire', 'category' => 'theatre-arts-scene', 'slogan' => 'Une scène vivante pour l’humour et la comédie', 'description' => 'Une programmation mensuelle dédiée à l’humour et à la comédie.', 'objectif' => "Promouvoir l'humour comme vecteur de cohésion sociale", 'publicVise' => 'Grand public, familles, humoristes émergents', 'impact' => "Professionnalisation du secteur de l'humour", 'image' => '/images/events/event1.jpg', 'discipline' => 'Atelier', 'featured' => false],
        ['slug' => 'nuit-poesie', 'title' => 'Nuit de la poésie', 'category' => 'litterature-pensee', 'slogan' => 'La poésie en vers et en voix', 'description' => 'Chaque 21 mars, poètes et écrivains célèbrent la puissance de la parole à travers lectures et ateliers.', 'objectif' => 'Promouvoir la poésie comme art vivant et accessible', 'publicVise' => 'Poètes, étudiants, amateurs de littérature', 'impact' => "Renouveau de l'intérêt pour la poésie", 'image' => '/images/events/event1.jpg', 'discipline' => 'Atelier', 'featured' => false],
        ['slug' => 'rencontres-litteraires', 'title' => 'Rencontres littéraires', 'category' => 'litterature-pensee', 'slogan' => 'Dialogue autour du livre', 'description' => 'Un espace de dialogue entre écrivains, éditeurs et lecteurs pour promouvoir la littérature congolaise et africaine.', 'objectif' => "Créer des espaces d'échange autour de la littérature", 'publicVise' => 'Écrivains, lecteurs, éditeurs, bibliothécaires', 'impact' => 'Dynamisation du secteur du livre', 'image' => '/images/media/media7.jpg', 'discipline' => 'Atelier', 'featured' => true],
        ['slug' => 'pensee-panafricaine', 'title' => 'Pensée panafricaine', 'category' => 'litterature-pensee', 'slogan' => "Réflexion sur l'avenir de l'Afrique", 'description' => 'Forum réunissant chercheurs, artistes, écrivains et acteurs autour des grands thèmes du panafricanisme contemporain.', 'objectif' => "Stimuler la réflexion intellectuelle sur l'Afrique", 'publicVise' => 'Intellectuels, étudiants, décideurs, société civile', 'impact' => 'Contribution au débat panafricain', 'image' => '/images/events/event1.jpg', 'discipline' => 'Atelier', 'featured' => false],
        ['slug' => 'journees-image-femme-africaine', 'title' => "Journées de l'Image de la Femme Africaine", 'category' => 'litterature-pensee', 'slogan' => 'Célébration de la femme africaine', 'description' => 'Rencontres, projections et débats autour de la représentation des femmes dans les médias et arts visuels.', 'objectif' => "Valoriser le rôle et l'image de la femme dans la société", 'publicVise' => 'Femmes artistes, associations féminines, grand public', 'impact' => 'Changement des représentations et empowerment', 'image' => '/images/events/event1.jpg', 'discipline' => 'Atelier', 'featured' => false],
        ['slug' => 'territoires', 'title' => 'Territoires', 'category' => 'litterature-pensee', 'slogan' => 'Exploration des identités culturelles', 'description' => 'Programme annuel valorisant coutumes, langues, danses et musiques de chaque région.', 'objectif' => 'Cartographier la diversité culturelle congolaise', 'publicVise' => 'Chercheurs, communautés locales, étudiants', 'impact' => 'Documentation des pratiques culturelles locales', 'image' => '/images/media/media8.jpg', 'discipline' => 'Atelier', 'featured' => true],
        ['slug' => '450-gouts-pondu', 'title' => 'Les 450 goûts de Pondu', 'category' => 'litterature-pensee', 'slogan' => 'Patrimoine culinaire congolais', 'description' => 'Festival culinaire mettant en valeur le saka-saka, décliné en centaines de recettes régionales.', 'objectif' => 'Documenter et promouvoir le patrimoine culinaire', 'publicVise' => 'Cuisiniers, familles, chercheurs en anthropologie', 'impact' => 'Préservation des recettes traditionnelles', 'image' => '/images/events/event1.jpg', 'discipline' => 'Atelier', 'featured' => false],
        ['slug' => 'route-rumba', 'title' => 'Route de la Rumba', 'category' => 'litterature-pensee', 'slogan' => 'Sur les traces de la rumba', 'description' => 'Biennale retraçant les voyages des racines congolaises, symbole du lien avec la diaspora.', 'objectif' => "Créer un itinéraire touristique et culturel de la rumba congolaise", 'publicVise' => 'Touristes, mélomanes, historiens', 'impact' => 'Développement du tourisme culturel', 'image' => '/images/events/event1.jpg', 'discipline' => 'Atelier', 'featured' => false],
        ['slug' => 'parole-vivante', 'title' => 'Festival de la Parole vivante', 'category' => 'litterature-pensee', 'slogan' => 'Transmission orale des savoirs', 'description' => 'Dédié aux arts oratoires et à la littérature orale congolaise et africaine, mémoire et transmission des valeurs.', 'objectif' => 'Préserver les traditions orales congolaises', 'publicVise' => 'Anciens, jeunes, chercheurs, communautés', 'impact' => 'Sauvegarde du patrimoine immatériel', 'image' => '/images/events/event1.jpg', 'discipline' => 'Atelier', 'featured' => false],
        ['slug' => 'langues-nationales', 'title' => 'Langues nationales', 'category' => 'litterature-pensee', 'slogan' => 'Sagesse ancestrale', 'description' => 'Programme d’apprentissage du lingala, kikongo, swahili et tshiluba pour renforcer l’identité culturelle.', 'objectif' => "Valoriser les langues comme acteurs de l'identité culturelle", 'publicVise' => 'Communautés traditionnelles, jeunes, éducateurs', 'impact' => "Lutte contre l'érosion linguistique", 'image' => '/images/events/event1.jpg', 'discipline' => 'Atelier', 'featured' => false],
        ['slug' => 'contes-chants-proverbes', 'title' => 'Ateliers intergénérationnels', 'category' => 'litterature-pensee', 'slogan' => "Trésors de l'oralité", 'description' => 'Espaces d’expression artistique pour enfants et jeunes, développant discipline, confiance et solidarité.', 'objectif' => 'Favoriser le développement de la créativité et de la solidarité entre les générations', 'publicVise' => 'Enfants, familles, enseignants, chercheurs', 'impact' => "Enrichissement de l'éducation culturelle", 'image' => '/images/events/event1.jpg', 'discipline' => 'Atelier', 'featured' => false],
    ];

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        // 1. Rubriques
        $categories = [];
        foreach (self::CATEGORIES as $i => $data) {
            $cat = $this->categoryRepo->findOneBySlug($data['slug']) ?? new ProgramCategory();
            $cat->setSlug($data['slug']);
            $cat->setTitle($data['title']);
            $cat->setDescription($data['description']);
            $cat->setCoverImage($data['image']);
            $cat->setColorGradient($data['color']);
            $cat->setPosition($i);
            $cat->setStatus(ContentStatus::PUBLISHED);
            $this->em->persist($cat);
            $categories[$data['slug']] = $cat;
        }
        $this->em->flush();

        // 2. Programmes
        $created = 0;
        $updated = 0;
        foreach (self::PROGRAMS as $i => $data) {
            $existing = $this->programRepo->findOneBySlug($data['slug']);
            $prog = $existing ?? new Program();
            $prog->setSlug($data['slug']);
            $prog->setTitle($data['title']);
            $prog->setCategory($categories[$data['category']] ?? null);
            $prog->setSlogan($data['slogan']);
            $prog->setDescription($data['description']);
            $prog->setObjectif($data['objectif']);
            $prog->setPublicVise($data['publicVise']);
            $prog->setImpact($data['impact']);
            $prog->setCoverImage($data['image']);
            $prog->setDiscipline($data['discipline']);
            $prog->setFeatured((bool) $data['featured']);
            $prog->setPosition($i);
            $prog->setStatus(ContentStatus::PUBLISHED);
            $this->em->persist($prog);
            $existing ? $updated++ : $created++;
        }
        $this->em->flush();

        $io->success(sprintf(
            '%d rubrique(s), %d programme(s) créé(s), %d mis à jour.',
            count(self::CATEGORIES),
            $created,
            $updated
        ));

        return Command::SUCCESS;
    }
}
