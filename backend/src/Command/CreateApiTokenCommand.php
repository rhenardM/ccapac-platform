<?php

namespace App\Command;

use App\Entity\ApiToken;
use App\Repository\UserRepository;
use App\Service\Audit\AuditLogger;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * Génère un jeton Bearer pour l'API admin, rattaché à un utilisateur existant.
 *
 *   php bin/console app:admin:token --email=admin@centreculturel.cd --label="Dashboard React" --ttl=90
 */
#[AsCommand(
    name: 'app:admin:token',
    description: 'Génère un jeton Bearer pour l\'API admin (rattaché à un administrateur)',
)]
class CreateApiTokenCommand extends Command
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private UserRepository $userRepository,
        private AuditLogger $auditLogger,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('email', null, InputOption::VALUE_REQUIRED, 'E-mail de l\'administrateur')
            ->addOption('label', null, InputOption::VALUE_REQUIRED, 'Libellé du jeton (ex. "Dashboard React")')
            ->addOption('ttl', null, InputOption::VALUE_REQUIRED, 'Durée de validité en jours (0 = illimité)', '30');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $email = strtolower(trim((string) ($input->getOption('email') ?: $io->ask('E-mail de l\'administrateur'))));
        $user = $this->userRepository->findOneByEmail($email);
        if (!$user) {
            $io->error(sprintf('Aucun utilisateur avec l\'e-mail "%s". Créez-le d\'abord avec app:admin:create.', $email));

            return Command::FAILURE;
        }

        $ttl = (int) $input->getOption('ttl');
        [$token, $raw] = ApiToken::createFor($user, $input->getOption('label'), $ttl > 0 ? $ttl : null);

        $this->entityManager->persist($token);
        $this->entityManager->flush();

        $this->auditLogger->log(
            'apitoken.create',
            sprintf('Jeton API généré pour %s', $email),
            'ApiToken',
            (string) $token->getId(),
            ['label' => $token->getLabel(), 'ttlDays' => $ttl > 0 ? $ttl : null],
            'cli',
        );

        $io->success('Jeton généré (copie-le maintenant, il ne sera plus affiché).');
        $io->writeln('<comment>Bearer :</comment> ' . $raw);
        $io->newLine();
        $io->writeln('Exemple : <info>curl -H "Authorization: Bearer ' . $raw . '" https://api-fundraising.centreculturel.cd/api/admin/stats</info>');

        return Command::SUCCESS;
    }
}
