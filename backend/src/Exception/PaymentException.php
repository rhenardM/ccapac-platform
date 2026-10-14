<?php

namespace App\Exception;

/**
 * Erreur métier de paiement, destinée à être renvoyée au frontend (HTTP 422).
 */
class PaymentException extends \RuntimeException
{
    public function __construct(
        string $message,
        private ?string $field = null,
        private ?string $errorCode = null,
        ?\Throwable $previous = null,
    ) {
        parent::__construct($message, 0, $previous);
    }

    public function getField(): ?string
    {
        return $this->field;
    }

    public function getErrorCode(): ?string
    {
        return $this->errorCode;
    }
}
