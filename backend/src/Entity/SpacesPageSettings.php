<?php

namespace App\Entity;

use App\Repository\SpacesPageSettingsRepository;
use Doctrine\ORM\Mapping as ORM;

/**
 * Réglages du hero de la page « Espaces du Grand Tambour ». Table à une
 * seule ligne (id=1, imposé par SpacesPageSettingsRepository::getOrCreate).
 */
#[ORM\Entity(repositoryClass: SpacesPageSettingsRepository::class)]
#[ORM\Table(name: 'spaces_page_settings')]
class SpacesPageSettings
{
    #[ORM\Id]
    #[ORM\Column]
    private int $id = 1;

    /** Petit sur-titre affiché au-dessus du titre principal. */
    #[ORM\Column(length: 255, nullable: true)]
    private ?string $heroKicker = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $heroTitle = 'Les Espaces du Grand Tambour';

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $introText = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $heroBackgroundImage = null;

    public function getId(): int
    {
        return $this->id;
    }

    public function getHeroKicker(): ?string
    {
        return $this->heroKicker;
    }

    public function setHeroKicker(?string $heroKicker): self
    {
        $this->heroKicker = $heroKicker;

        return $this;
    }

    public function getHeroTitle(): ?string
    {
        return $this->heroTitle;
    }

    public function setHeroTitle(?string $heroTitle): self
    {
        $this->heroTitle = $heroTitle;

        return $this;
    }

    public function getIntroText(): ?string
    {
        return $this->introText;
    }

    public function setIntroText(?string $introText): self
    {
        $this->introText = $introText;

        return $this;
    }

    public function getHeroBackgroundImage(): ?string
    {
        return $this->heroBackgroundImage;
    }

    public function setHeroBackgroundImage(?string $heroBackgroundImage): self
    {
        $this->heroBackgroundImage = $heroBackgroundImage;

        return $this;
    }
}
