<?php

namespace App\Entity;

use App\Repository\MediaAssetRepository;
use Doctrine\ORM\Mapping as ORM;

/**
 * Élément de la bibliothèque média : fichier (image/PDF) uploadé et stocké sur
 * le serveur. Le fichier physique vit dans public/uploads/media/ ; il est servi
 * publiquement via la route /uploads/media/{filename}.
 */
#[ORM\Entity(repositoryClass: MediaAssetRepository::class)]
#[ORM\Table(name: 'media_assets')]
#[ORM\Index(name: 'idx_media_created_at', columns: ['created_at'])]
#[ORM\Index(name: 'idx_media_category', columns: ['category_id'])]
#[ORM\Index(name: 'idx_media_event_date', columns: ['event_date'])]
class MediaAsset
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    /** Nom d'affichage (souvent le nom d'origine du fichier). */
    #[ORM\Column(length: 255)]
    private string $name = '';

    /** Nom du fichier stocké sur le serveur (unique). Mappé par l'upload EasyAdmin. */
    #[ORM\Column(length: 255, nullable: true)]
    private ?string $filename = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $alt = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $caption = null;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $mime = null;

    #[ORM\Column(nullable: true)]
    private ?int $size = null;

    /** Catégorie de la médiathèque publique (Concert, Danse…) : sert au filtrage. */
    #[ORM\ManyToOne(targetEntity: MediaCategory::class, inversedBy: 'medias')]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?MediaCategory $category = null;

    /**
     * Date de l'événement photographié (≠ date d'ajout du fichier).
     * Alimente les filtres « Année » et « Mois » de la médiathèque.
     */
    #[ORM\Column(type: 'date_immutable', nullable: true)]
    private ?\DateTimeImmutable $eventDate = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
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

    public function getFilename(): ?string
    {
        return $this->filename;
    }

    public function setFilename(?string $filename): self
    {
        $this->filename = $filename;

        return $this;
    }

    public function getAlt(): ?string
    {
        return $this->alt;
    }

    public function setAlt(?string $alt): self
    {
        $this->alt = $alt;

        return $this;
    }

    public function getCaption(): ?string
    {
        return $this->caption;
    }

    public function setCaption(?string $caption): self
    {
        $this->caption = $caption;

        return $this;
    }

    public function getMime(): ?string
    {
        return $this->mime;
    }

    public function setMime(?string $mime): self
    {
        $this->mime = $mime;

        return $this;
    }

    public function getSize(): ?int
    {
        return $this->size;
    }

    public function setSize(?int $size): self
    {
        $this->size = $size;

        return $this;
    }

    public function getCategory(): ?MediaCategory
    {
        return $this->category;
    }

    public function setCategory(?MediaCategory $category): self
    {
        $this->category = $category;

        return $this;
    }

    public function getEventDate(): ?\DateTimeImmutable
    {
        return $this->eventDate;
    }

    public function setEventDate(?\DateTimeImmutable $eventDate): self
    {
        $this->eventDate = $eventDate;

        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    /** Chemin public relatif (préfixé par MEDIA_BASE_URL côté API/affichage). */
    public function getPath(): ?string
    {
        return $this->filename ? 'media/' . $this->filename : null;
    }

    public function __toString(): string
    {
        return $this->name ?: (string) $this->filename;
    }
}
