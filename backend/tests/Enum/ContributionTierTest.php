<?php

namespace App\Tests\Enum;

use App\Enum\ContributionTier;
use PHPUnit\Framework\TestCase;

class ContributionTierTest extends TestCase
{
    public function testBoundsAreEnforced(): void
    {
        $this->assertTrue(ContributionTier::AMI_CITOYEN->accepts(1));
        $this->assertTrue(ContributionTier::AMI_CITOYEN->accepts(4999));
        $this->assertFalse(ContributionTier::AMI_CITOYEN->accepts(5000));
        $this->assertFalse(ContributionTier::AMI_CITOYEN->accepts(0.5));

        $this->assertTrue(ContributionTier::PARRAIN->accepts(5000));
        $this->assertTrue(ContributionTier::PARRAIN->accepts(24999));
        $this->assertFalse(ContributionTier::PARRAIN->accepts(25000));
    }

    public function testUnboundedTiers(): void
    {
        $this->assertTrue(ContributionTier::PARTENAIRE_FONDATEUR->accepts(100000));
        $this->assertTrue(ContributionTier::PARTENAIRE_FONDATEUR->accepts(10_000_000));
        $this->assertFalse(ContributionTier::PARTENAIRE_FONDATEUR->accepts(99999));

        $this->assertTrue(ContributionTier::LIBRE->accepts(1));
        $this->assertTrue(ContributionTier::LIBRE->accepts(500000));
        $this->assertFalse(ContributionTier::LIBRE->accepts(0));
    }

    public function testValuesHelper(): void
    {
        $values = ContributionTier::values();
        $this->assertContains('ami_citoyen', $values);
        $this->assertContains('libre', $values);
        $this->assertCount(6, $values);
    }
}
