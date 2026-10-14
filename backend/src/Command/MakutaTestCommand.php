<?php

namespace App\Command;

use App\Service\Payment\MakutaClient;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * Outil de diagnostic Makuta (sandbox/prod).
 *
 *   app:makuta:test                                         -> teste l'auth OAuth2
 *   app:makuta:test --number=243XXXXXXXXX --amount=1        -> crée une transaction
 *   app:makuta:test --retrieve=<makutaTransactionId>        -> lit le statut d'une transaction
 */
#[AsCommand(
    name: 'app:makuta:test',
    description: 'Teste la connexion à Makuta (OAuth, création et lecture de transaction)',
)]
class MakutaTestCommand extends Command
{
    public function __construct(private MakutaClient $makutaClient)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('operator', null, InputOption::VALUE_REQUIRED, 'Opérateur Mobile Money', 'DRC_MPESA')
            ->addOption('number', null, InputOption::VALUE_REQUIRED, 'Numéro Mobile Money (ex: 243XXXXXXXXX) pour créer une transaction de test')
            ->addOption('amount', null, InputOption::VALUE_REQUIRED, 'Montant', '1')
            ->addOption('currency', null, InputOption::VALUE_REQUIRED, 'Devise', 'USD')
            ->addOption('email', null, InputOption::VALUE_REQUIRED, 'Email (requis pour DRC_VISA_CNP)', 'test@grandtambour.cd')
            ->addOption('retrieve', null, InputOption::VALUE_REQUIRED, 'Lit le statut d\'une transaction par son id Makuta');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        if (!$this->makutaClient->isConfigured()) {
            $io->error('Makuta non configuré : vérifie MAKUTA_CLIENT_ID, MAKUTA_CLIENT_SECRET, MAKUTA_X_EXTENSION et la clé privée RSA dans .env.local.');

            return Command::FAILURE;
        }

        // 1. Lecture d'une transaction (si --retrieve)
        if ($txnId = $input->getOption('retrieve')) {
            try {
                $data = $this->makutaClient->retrieveTransaction($txnId);
                $io->success('retrieve_transaction OK');
                $io->writeln(json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

                return Command::SUCCESS;
            } catch (\Throwable $e) {
                $io->error('retrieve_transaction a échoué : ' . $e->getMessage());

                return Command::FAILURE;
            }
        }

        // 2. Test d'authentification OAuth2 (toujours)
        try {
            $scope = $this->makutaClient->authenticate('ctob');
            $io->success("Authentification OAuth2 OK (scope: {$scope})");
        } catch (\Throwable $e) {
            $io->error('Authentification OAuth2 échouée : ' . $e->getMessage());
            $io->note('Vérifie client_id / client_secret et MAKUTA_ENV (dev|prod).');

            return Command::FAILURE;
        }

        // 3. Création d'une transaction (seulement si --number fourni)
        $number = $input->getOption('number');
        if (!$number) {
            $io->note('Pour créer une vraie transaction de test, relance avec --number=243XXXXXXXXX (un push Mobile Money sera envoyé).');

            return Command::SUCCESS;
        }

        $operator = $input->getOption('operator');
        $body = [
            'operator' => $operator,
            'accountNumber' => ltrim($number, '+'),
            'currency' => $input->getOption('currency'),
            'amount' => (float) $input->getOption('amount'),
            'thirdPartyReference' => 'TEST-' . time(),
            'reason' => 'Test integration Makuta dons',
        ];
        // VISA Card Not Present : l'email est obligatoire, et la réponse contient
        // une "url" de redirection vers la page de paiement carte (pas de push).
        if ($operator === 'DRC_VISA_CNP') {
            $body['email'] = $input->getOption('email');
        }

        $io->section('create_transaction');
        $io->writeln('<comment>Requête :</comment> ' . json_encode($body, JSON_UNESCAPED_SLASHES));

        try {
            $response = $this->makutaClient->createTransaction($body);
            $io->writeln('<comment>Réponse :</comment> ' . json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

            $id = $response['id'] ?? $response['transactionId'] ?? null;
            $url = $response['url'] ?? null;

            // Pas d'id ni d'url => Makuta a REFUSÉ (ex: 403 {"message":"Forbidden"}).
            if (!$id && !$url) {
                $io->error('create_transaction REFUSÉ par Makuta : ' . ($response['message'] ?? 'réponse sans id/url'));
                $io->note([
                    'OAuth OK mais transaction refusée => cause quasi certaine :',
                    '  1) la clé publique enregistrée chez Makuta != ta clé privée (X-Signature rejetée)',
                    '  2) MAKUTA_X_EXTENSION incorrect/non autorisé',
                    'Envoie config/makuta_public.pem à Makuta et fais confirmer l\'autorisation ctob (dev).',
                ]);

                return Command::FAILURE;
            }

            $io->success('create_transaction OK');
            if ($url) {
                $io->note("Paiement carte : ouvre cette URL dans un navigateur pour payer →\n{$url}");
            }
            if ($id) {
                $io->note("Pour suivre le statut : php bin/console app:makuta:test --retrieve={$id}");
            }

            return Command::SUCCESS;
        } catch (\Throwable $e) {
            $io->error('create_transaction a échoué : ' . $e->getMessage());

            return Command::FAILURE;
        }
    }
}
