<?php

namespace App\Service\Payment;

use App\Dto\DonationRequest;
use App\Entity\Donation;
use App\Entity\Donor;
use App\Enum\ContributionTier;
use App\Enum\PaymentOperator;
use App\Exception\PaymentException;
use App\Repository\DonationRepository;
use App\Repository\DonorRepository;
use App\Service\Notification\ReceiptMailer;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;

/**
 * Orchestration des dons : création + initiation Makuta, puis confirmation.
 *
 * Statuts Makuta : TS = succès, TF = échec, TP = en attente.
 */
class DonationService
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private MakutaClient $makutaClient,
        private DonationRepository $donationRepository,
        private DonorRepository $donorRepository,
        private DonationReferenceGenerator $referenceGenerator,
        private ReceiptMailer $receiptMailer,
        private LoggerInterface $logger,
    ) {}

    /**
     * Crée le don et initie la transaction côté Makuta.
     */
    public function createDonation(DonationRequest $request): Donation
    {
        $tier = ContributionTier::from($request->tier);
        $operator = PaymentOperator::from($request->operator);
        $amount = (float) $request->amount;

        // Validation métier (le client ne décide jamais seul des règles).
        if (!$tier->accepts($amount)) {
            throw new PaymentException(
                sprintf('Le montant %s USD n\'entre pas dans le palier « %s ».', $amount, $tier->label()),
                'amount',
                'AMOUNT_OUT_OF_TIER',
            );
        }
        if ($operator->requiresPayNumber() && !$request->payNumber) {
            throw new PaymentException('Le numéro Mobile Money est requis.', 'payNumber', 'PAYNUMBER_REQUIRED');
        }
        if ($operator->requiresEmail() && !$request->email && !$request->donorEmail) {
            throw new PaymentException('L\'adresse e-mail est requise pour le paiement par carte.', 'email', 'EMAIL_REQUIRED');
        }

        $donor = $this->resolveDonor($request);

        $donation = new Donation();
        $donation->setDonor($donor);
        $donation->setReference($this->referenceGenerator->generate());
        $donation->setTier($tier);
        $donation->setOperator($operator);
        $donation->setAmount(number_format($amount, 2, '.', ''));
        $donation->setCurrency('USD');

        // Suivi « pour qui » : soi / un proche / une organisation (+ bénéficiaire).
        $donation->setDonorType(in_array($request->donorType, ['self', 'relative', 'organization'], true) ? $request->donorType : 'self');
        if ($request->donorType !== 'self') {
            $donation->setBeneficiaryName($request->beneficiaryName ? trim($request->beneficiaryName) : null);
            $donation->setBeneficiaryEmail($request->beneficiaryEmail ? strtolower(trim($request->beneficiaryEmail)) : null);
            $donation->setBeneficiaryMessage($request->beneficiaryMessage ? trim($request->beneficiaryMessage) : null);
        }

        $this->entityManager->persist($donation);
        $this->entityManager->flush();

        $body = [
            'operator' => $operator->value,
            'accountNumber' => $operator->requiresPayNumber()
                ? $this->normalizeAccount((string) $request->payNumber)
                : $this->normalizeAccount((string) ($request->payNumber ?? $donor->getPhone() ?? '')),
            'currency' => 'USD',
            'amount' => (float) $donation->getAmount(),
            'thirdPartyReference' => $donation->getReference(),
            'reason' => $this->sanitizeReason('Don Grand Tambour ' . $donation->getReference()),
        ];
        if ($operator->requiresEmail()) {
            $body['email'] = $request->email ?: $donor->getEmail();
        }

        try {
            $response = $this->makutaClient->createTransaction($body);
        } catch (\Throwable $e) {
            $donation->setStatus(Donation::STATUS_FAILED);
            $this->entityManager->flush();
            $this->logger->error('Appel createTransaction Makuta en échec', [
                'reference' => $donation->getReference(),
                'error' => $e->getMessage(),
            ]);

            throw new PaymentException(
                'Le service de paiement est momentanément indisponible. Réessayez dans un instant.',
                'payNumber',
                'PAYMENT_GATEWAY_UNAVAILABLE',
                $e,
            );
        }

        $transactionId = $response['id'] ?? $response['transactionId'] ?? null;
        $redirectUrl = $response['url'] ?? null;

        // Ni id ni url => Makuta a refusé (numéro invalide, opérateur indisponible, signature…).
        if (!$transactionId && empty($redirectUrl)) {
            $donation->setStatus(Donation::STATUS_FAILED);
            $donation->setCallbackPayload($response);
            $donation->setMessage($this->extractMakutaError($response));
            $this->entityManager->flush();

            $this->logger->warning('Initiation paiement Makuta refusée', [
                'reference' => $donation->getReference(),
                'response' => $response,
            ]);

            throw new PaymentException($this->extractMakutaError($response), 'payNumber', 'PAYMENT_REFUSED');
        }

        $donation->setMakutaTransactionId($transactionId);
        if (!empty($redirectUrl)) {
            $donation->setRedirectUrl($redirectUrl);
        }
        $this->entityManager->flush();

        return $donation;
    }

    /**
     * Confirme un don à partir d'une référence reçue dans le callback.
     * Re-vérifie le statut réel via retrieve_transaction (le callback n'est pas signé).
     */
    public function confirm(string $reference, ?array $callbackPayload = null): ?Donation
    {
        $donation = $this->donationRepository->findByReference($reference);
        if (!$donation) {
            $this->logger->warning('Callback Makuta: don introuvable', ['reference' => $reference]);

            return null;
        }

        if ($callbackPayload !== null) {
            $donation->setCallbackPayload($callbackPayload);
            if (!empty($callbackPayload['message']) && is_string($callbackPayload['message'])) {
                $donation->setMessage($callbackPayload['message']);
            }
            $this->entityManager->flush();
        }

        return $this->process($donation);
    }

    /**
     * Confirme une transaction OTP (DRC_RAKKACASH) puis applique le statut.
     */
    public function confirmOtp(Donation $donation, string $otpCode): Donation
    {
        if (!$donation->getMakutaTransactionId()) {
            throw new PaymentException('Transaction introuvable pour la confirmation OTP.', 'otpCode', 'TXN_NOT_FOUND');
        }

        try {
            $this->makutaClient->confirmOtp($donation->getMakutaTransactionId(), $otpCode);
        } catch (\Throwable $e) {
            $this->logger->error('Confirmation OTP Makuta en échec', [
                'reference' => $donation->getReference(),
                'error' => $e->getMessage(),
            ]);

            throw new PaymentException('Code OTP invalide ou expiré.', 'otpCode', 'OTP_INVALID', $e);
        }

        return $this->process($donation);
    }

    /**
     * Vérifie le statut réel d'un don et applique la transition (idempotent).
     * Utilisé par le callback, le polling et la réconciliation.
     */
    public function process(Donation $donation): Donation
    {
        if (!$donation->isPending()) {
            return $donation;
        }

        if (!$donation->getMakutaTransactionId()) {
            $this->logger->warning('Don sans makutaTransactionId, statut indéterminable', [
                'reference' => $donation->getReference(),
            ]);

            return $donation;
        }

        $data = [];
        try {
            $data = $this->makutaClient->retrieveTransaction($donation->getMakutaTransactionId());
        } catch (\Throwable $e) {
            $this->logger->error('Échec retrieve_transaction Makuta', [
                'reference' => $donation->getReference(),
                'error' => $e->getMessage(),
            ]);

            return $donation; // reste pending, sera retenté
        }

        // Le statut peut arriver à plusieurs emplacements selon l'opérateur (carte
        // vs mobile money). On les couvre tous, puis on normalise.
        $status = $data['status']
            ?? $data['data']['status']
            ?? $data['transaction']['status']
            ?? null;
        $status = is_string($status) ? strtoupper(trim($status)) : $status;

        return match ($status) {
            'TS' => $this->markPaid($donation),
            'TF' => $this->markFailed($donation),
            'TP' => $donation, // toujours en cours côté Makuta : on attend
            default => $this->onUnknownStatus($donation, $status, $data),
        };
    }

    /**
     * Statut Makuta non reconnu : on reste prudemment en attente et on journalise
     * la réponse BRUTE pour diagnostic (évite qu'un « payé » sous une clé/valeur
     * inattendue passe inaperçu). Ne modifie jamais le statut du don.
     */
    private function onUnknownStatus(Donation $donation, mixed $status, array $data): Donation
    {
        $this->logger->warning('Statut Makuta non reconnu (don laissé en attente)', [
            'reference' => $donation->getReference(),
            'operator' => $donation->getOperator()->value,
            'status' => $status,
            'raw' => $data,
        ]);

        return $donation;
    }

    private function markPaid(Donation $donation): Donation
    {
        $donation->setStatus(Donation::STATUS_PAID);
        $donation->setConfirmedAt(new \DateTimeImmutable());
        $this->entityManager->flush();

        // Reçu envoyé APRÈS confirmation du paiement (au donateur).
        $this->receiptMailer->sendDonationReceipt($donation);

        // Don offert au nom d'autrui : on notifie AUSSI le bénéficiaire, automatiquement.
        if ($donation->getDonorType() !== 'self' && $donation->getBeneficiaryEmail()) {
            $this->receiptMailer->sendBeneficiaryNotification($donation);
        }

        return $donation;
    }

    private function markFailed(Donation $donation): Donation
    {
        $donation->setStatus(Donation::STATUS_FAILED);
        $donation->setConfirmedAt(new \DateTimeImmutable());
        $this->entityManager->flush();

        return $donation;
    }

    /**
     * Expire un don resté en attente (commande cron).
     */
    public function expire(Donation $donation): Donation
    {
        if (!$donation->isPending()) {
            return $donation;
        }

        $donation->setStatus(Donation::STATUS_EXPIRED);
        $donation->setConfirmedAt(new \DateTimeImmutable());
        $this->entityManager->flush();

        return $donation;
    }

    /**
     * Récupère le donateur existant (par e-mail) ou le crée.
     */
    private function resolveDonor(DonationRequest $request): Donor
    {
        $email = strtolower(trim($request->donorEmail));
        $donor = $this->donorRepository->findOneByEmail($email);

        if (!$donor) {
            $donor = new Donor();
            $donor->setEmail($email);
            $this->entityManager->persist($donor);
        }

        // On rafraîchit nom/téléphone avec les dernières infos fournies.
        $donor->setName(trim($request->donorName));
        if ($request->donorPhone) {
            $donor->setPhone(trim($request->donorPhone));
        }

        return $donor;
    }

    private function extractMakutaError(array $response): string
    {
        foreach (['message', 'error', 'detail', 'description', 'error_description'] as $key) {
            if (!empty($response[$key]) && is_string($response[$key])) {
                return $response[$key];
            }
        }

        return 'Paiement refusé. Vérifiez vos informations et réessayez.';
    }

    /**
     * Nettoie le motif pour Makuta : lettres/chiffres/espaces uniquement
     * (tirets, accents et autres caractères provoquent "Invalid reason").
     */
    private function sanitizeReason(string $reason): string
    {
        $ascii = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $reason) ?: $reason;
        $clean = preg_replace('/[^A-Za-z0-9 ]/', ' ', $ascii);
        $clean = trim(preg_replace('/\s+/', ' ', $clean));

        return mb_substr($clean !== '' ? $clean : 'Don Grand Tambour', 0, 60);
    }

    /**
     * Format attendu par Makuta : indicatif sans '+' (ex: 243827780774).
     */
    private function normalizeAccount(string $phone): string
    {
        $cleaned = preg_replace('/[^\d+]/', '', trim($phone));
        $cleaned = ltrim($cleaned, '+');

        if (str_starts_with($cleaned, '243')) {
            return $cleaned;
        }
        if (str_starts_with($cleaned, '0')) {
            return '243' . substr($cleaned, 1);
        }
        if (strlen($cleaned) === 9) {
            return '243' . $cleaned;
        }

        return $cleaned;
    }
}
