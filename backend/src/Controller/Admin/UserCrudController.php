<?php

namespace App\Controller\Admin;

use App\Entity\User;
use App\Service\Audit\AuditLogger;
use Doctrine\ORM\EntityManagerInterface;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\BooleanField;
use EasyCorp\Bundle\EasyAdminBundle\Field\ChoiceField;
use EasyCorp\Bundle\EasyAdminBundle\Field\DateTimeField;
use EasyCorp\Bundle\EasyAdminBundle\Field\EmailField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Form\Extension\Core\Type\PasswordType;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted(User::ROLE_SUPER_ADMIN)]
class UserCrudController extends AbstractCrudController
{
    public function __construct(
        private UserPasswordHasherInterface $passwordHasher,
        private AuditLogger $auditLogger,
        private Security $security,
    ) {}

    public static function getEntityFqcn(): string
    {
        return User::class;
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setEntityLabelInSingular('Utilisateur')
            ->setEntityLabelInPlural('Utilisateurs')
            ->setDefaultSort(['createdAt' => 'DESC'])
            ->setSearchFields(['email', 'name']);
    }

    public function configureFields(string $pageName): iterable
    {
        yield IdField::new('id')->onlyOnDetail();
        yield TextField::new('name', 'Nom');
        yield EmailField::new('email', 'E-mail');
        yield ChoiceField::new('roles', 'Rôles')
            ->setChoices([
                'Contenu (actualités, événements, média, partenaires…)' => User::ROLE_CONTENT,
                'Action culturelle (programmes, rubriques)' => User::ROLE_ACTION_CULTURELLE,
                'Actualités / Presse' => User::ROLE_ACTUALITES,
                'Administrateur (tout + collecte)' => User::ROLE_ADMIN,
                'Super administrateur (+ utilisateurs)' => User::ROLE_SUPER_ADMIN,
            ])
            ->allowMultipleChoices()
            ->renderExpanded()
            ->renderAsBadges()
            ->setHelp('Un gestionnaire de section ne voit que sa section. « Administrateur » voit tout.');
        yield BooleanField::new('isActive', 'Actif');
        yield TextField::new('plainPassword', 'Mot de passe')
            ->setFormType(PasswordType::class)
            ->onlyOnForms()
            ->setRequired($pageName === Crud::PAGE_NEW)
            ->setHelp($pageName === Crud::PAGE_NEW ? 'Min. 8 caractères.' : 'Laisser vide pour ne pas changer.');
        yield DateTimeField::new('createdAt', 'Créé le')->hideOnForm();
        yield DateTimeField::new('lastLoginAt', 'Dernière connexion')->onlyOnDetail();
        yield TextField::new('createdBy', 'Créé par')->onlyOnDetail();
    }

    public function persistEntity(EntityManagerInterface $entityManager, $entityInstance): void
    {
        if ($entityInstance instanceof User) {
            $this->applyPassword($entityInstance);
            $entityInstance->setCreatedBy($this->currentActor());
        }

        parent::persistEntity($entityManager, $entityInstance);

        if ($entityInstance instanceof User) {
            $this->auditLogger->log(
                'user.create',
                sprintf('Création de l\'utilisateur %s', $entityInstance->getEmail()),
                'User',
                (string) $entityInstance->getId(),
                ['roles' => $entityInstance->getRoles()],
            );
        }
    }

    public function updateEntity(EntityManagerInterface $entityManager, $entityInstance): void
    {
        if ($entityInstance instanceof User) {
            $this->applyPassword($entityInstance);
        }

        parent::updateEntity($entityManager, $entityInstance);

        if ($entityInstance instanceof User) {
            $this->auditLogger->log(
                'user.update',
                sprintf('Modification de l\'utilisateur %s', $entityInstance->getEmail()),
                'User',
                (string) $entityInstance->getId(),
                ['roles' => $entityInstance->getRoles(), 'active' => $entityInstance->isActive()],
            );
        }
    }

    private function applyPassword(User $user): void
    {
        $plain = $user->getPlainPassword();
        if ($plain) {
            $user->setPassword($this->passwordHasher->hashPassword($user, $plain));
            $user->eraseCredentials();
        }
    }

    private function currentActor(): string
    {
        $user = $this->security->getUser();

        return $user instanceof User ? (string) $user->getEmail() : 'system';
    }
}
