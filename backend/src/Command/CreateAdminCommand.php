<?php

namespace App\Command;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Service\Audit\AuditLogger;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

/**
 * Crée un administrateur du back-office (super-admin par défaut).
 *
 *   php bin/console app:admin:create
 *   php bin/console app:admin:create --email=x@y.cd --name="Nom" --admin
 */
#[AsCommand(
    name: 'app:admin:create',
    description: 'Crée un compte administrateur du back-office',
)]
class CreateAdminCommand extends Command
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private UserRepository $userRepository,
        private UserPasswordHasherInterface $passwordHasher,
        private ValidatorInterface $validator,
        private AuditLogger $auditLogger,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('email', null, InputOption::VALUE_REQUIRED, 'Adresse e-mail')
            ->addOption('name', null, InputOption::VALUE_REQUIRED, 'Nom complet')
            ->addOption('password', null, InputOption::VALUE_REQUIRED, 'Mot de passe (sinon demandé en masqué)')
            ->addOption('admin', null, InputOption::VALUE_NONE, 'Créer un ROLE_ADMIN simple (par défaut : ROLE_SUPER_ADMIN)')
            ->addOption('role', null, InputOption::VALUE_REQUIRED, 'Rôle de section : content | action-culturelle | actualites | cinematheque | espaces | admin | super');
    }

    private const ROLE_MAP = [
        'content' => User::ROLE_CONTENT,
        'action-culturelle' => User::ROLE_ACTION_CULTURELLE,
        'actualites' => User::ROLE_ACTUALITES,
        'cinematheque' => User::ROLE_CINEMATHEQUE,
        'espaces' => User::ROLE_ESPACES,
        'admin' => User::ROLE_ADMIN,
        'super' => User::ROLE_SUPER_ADMIN,
    ];

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $email = $input->getOption('email') ?: $io->ask('Adresse e-mail');
        $name = $input->getOption('name') ?: $io->ask('Nom complet');
        $password = $input->getOption('password') ?: $io->askHidden('Mot de passe (min. 8 caractères)');

        $email = strtolower(trim((string) $email));
        $name = trim((string) $name);

        if (!$email || !$name || !$password) {
            $io->error('E-mail, nom et mot de passe sont requis.');

            return Command::INVALID;
        }
        if (strlen((string) $password) < 8) {
            $io->error('Le mot de passe doit contenir au moins 8 caractères.');

            return Command::INVALID;
        }
        if ($this->userRepository->findOneByEmail($email)) {
            $io->error(sprintf('Un utilisateur avec l\'e-mail "%s" existe déjà.', $email));

            return Command::FAILURE;
        }

        // Rôle : --role prioritaire ; sinon --admin (ROLE_ADMIN) ; sinon super-admin.
        $roleKey = $input->getOption('role');
        if ($roleKey !== null) {
            $roleKey = strtolower(trim((string) $roleKey));
            if (!isset(self::ROLE_MAP[$roleKey])) {
                $io->error('Rôle inconnu. Valeurs : ' . implode(', ', array_keys(self::ROLE_MAP)) . '.');

                return Command::INVALID;
            }
            $role = self::ROLE_MAP[$roleKey];
        } else {
            $role = $input->getOption('admin') ? User::ROLE_ADMIN : User::ROLE_SUPER_ADMIN;
        }

        $user = new User();
        $user->setEmail($email);
        $user->setName($name);
        $user->setRoles([$role]);
        $user->setPassword($this->passwordHasher->hashPassword($user, (string) $password));
        $user->setCreatedBy('cli');

        $violations = $this->validator->validate($user);
        if (count($violations) > 0) {
            foreach ($violations as $v) {
                $io->error($v->getPropertyPath() . ' : ' . $v->getMessage());
            }

            return Command::INVALID;
        }

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        $this->auditLogger->log(
            'user.create',
            sprintf('Création admin %s via CLI', $email),
            'User',
            (string) $user->getId(),
            ['roles' => $user->getRoles()],
            'cli',
        );

        $io->success(sprintf(
            '%s créé : %s',
            $user->isSuperAdmin() ? 'Super administrateur' : 'Administrateur',
            $email
        ));
        $io->note('Connexion : ' . $this->adminUrlHint());

        return Command::SUCCESS;
    }

    private function adminUrlHint(): string
    {
        return 'https://api-fundraising.centreculturel.cd/login';
    }
}
