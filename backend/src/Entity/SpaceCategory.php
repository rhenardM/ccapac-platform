<?php

namespace App\Entity;

use App\Repository\SpaceCategoryRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Type d'espace du Grand Tambour (Théâtre, Salle polyvalente, Résidence,
 * Cafétéria, Média, Studio, Galerie, Salle de conférence...). Porte l'icône
 * affichée sur les cartes/slider — ajouter un nouveau type ne nécessite
 * aucune modification de code, juste une entrée ici.
 */
#[ORM\Entity(repositoryClass: SpaceCategoryRepository::class)]
#[ORM\Table(name: 'space_categories')]
#[ORM\HasLifecycleCallbacks]
class SpaceCategory
{
    /**
     * Icônes disponibles (clés reconnues par le dictionnaire d'icônes du front,
     * voir `src/lib/iconUtils.tsx` dans caapac). Ajouter un type d'espace qui
     * réutilise une de ces icônes ne nécessite aucune modification de code.
     *
     * @return array<string,string> label => clé
     */
    public static function iconChoices(): array
    {
        return [
            'Théâtre' => 'theater',
            'Salle polyvalente' => 'multipurpose',
            'Résidence' => 'residence',
            'Cafétéria' => 'cafe',
            'Média' => 'media',
            'Studio' => 'studio',
            'Galerie' => 'gallery',
            'Salle de conférence' => 'conference',
            'Générique' => 'building',
        ];
    }

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255, unique: true)]
    #[Assert\NotBlank]
    private string $slug = '';

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    private string $name = '';

    /** Clé d'icône choisie parmi une liste prédéfinie (voir SpaceIcon côté front). */
    #[ORM\Column(length: 50)]
    #[Assert\NotBlank]
    private string $icon = 'building';

    #[ORM\Column]
    private int $position = 0;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $updatedAt;

    /** @var Collection<int,Space> */
    #[ORM\OneToMany(mappedBy: 'category', targetEntity: Space::class)]
    private Collection $spaces;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
        $this->spaces = new ArrayCollection();
    }

    #[ORM\PreUpdate]
    public function touch(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getSlug(): string
    {
        return $this->slug;
    }

    public function setSlug(string $slug): self
    {
        $this->slug = $slug;

        return $this;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): self
    {
        $this->name = $name;

        return $this;
    }

    public function getIcon(): string
    {
        return $this->icon;
    }

    public function setIcon(string $icon): self
    {
        $this->icon = $icon;

        return $this;
    }

    public function getPosition(): int
    {
        return $this->position;
    }

    public function setPosition(int $position): self
    {
        $this->position = $position;

        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): \DateTimeImmutable
    {
        return $this->updatedAt;
    }

    /** @return Collection<int,Space> */
    public function getSpaces(): Collection
    {
        return $this->spaces;
    }

    public function __toString(): string
    {
        return $this->name ?: $this->slug;
    }
}
