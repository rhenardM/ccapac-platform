<?php

namespace App\Tests\Enum;

use App\Enum\PaymentOperator;
use PHPUnit\Framework\TestCase;

class PaymentOperatorTest extends TestCase
{
    public function testMobileMoneyFlags(): void
    {
        $mpesa = PaymentOperator::DRC_MPESA;
        $this->assertTrue($mpesa->isMobileMoney());
        $this->assertTrue($mpesa->requiresPayNumber());
        $this->assertFalse($mpesa->isCard());
        $this->assertFalse($mpesa->requiresEmail());
        $this->assertFalse($mpesa->requiresOtp());
    }

    public function testRakkacashRequiresOtp(): void
    {
        $this->assertTrue(PaymentOperator::DRC_RAKKACASH->requiresOtp());
    }

    public function testVisaCnpFlags(): void
    {
        $visa = PaymentOperator::DRC_VISA_CNP;
        $this->assertTrue($visa->isCard());
        $this->assertTrue($visa->requiresEmail());
        $this->assertFalse($visa->isMobileMoney());
        $this->assertFalse($visa->requiresPayNumber());
    }
}
