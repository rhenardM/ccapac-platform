<?php

namespace App\Tests\Dto;

use App\Dto\DonationRequest;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

/**
 * Garantit que le corps JSON envoyé par le frontend se désérialise et se valide
 * (régression : un type union sur `amount` cassait la désérialisation → HTTP 400).
 */
class DonationRequestDeserializationTest extends KernelTestCase
{
    public function testValidPayloadDeserializesAndValidates(): void
    {
        self::bootKernel();
        /** @var SerializerInterface $serializer */
        $serializer = static::getContainer()->get(SerializerInterface::class);
        /** @var ValidatorInterface $validator */
        $validator = static::getContainer()->get(ValidatorInterface::class);

        $json = json_encode([
            'donorName' => 'Rhenard Munongo',
            'donorEmail' => 'rhenardbonkey@gmail.com',
            'donorPhone' => '243814014247',
            'amount' => 1,
            'tier' => 'ami_citoyen',
            'operator' => 'DRC_MPESA',
            'payNumber' => '243814014247',
        ]);

        $dto = $serializer->deserialize($json, DonationRequest::class, 'json');

        $this->assertInstanceOf(DonationRequest::class, $dto);
        $this->assertSame(1.0, $dto->amount);
        $this->assertCount(0, $validator->validate($dto), 'Le payload valide ne doit produire aucune violation.');
    }

    public function testMissingAmountFailsValidation(): void
    {
        self::bootKernel();
        $serializer = static::getContainer()->get(SerializerInterface::class);
        $validator = static::getContainer()->get(ValidatorInterface::class);

        $json = json_encode([
            'donorName' => 'Sans Montant',
            'donorEmail' => 'x@y.com',
            'tier' => 'ami_citoyen',
            'operator' => 'DRC_MPESA',
            'payNumber' => '243814014247',
        ]);

        $dto = $serializer->deserialize($json, DonationRequest::class, 'json');

        $this->assertGreaterThan(0, $validator->validate($dto)->count());
    }
}
