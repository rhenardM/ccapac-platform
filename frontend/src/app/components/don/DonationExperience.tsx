"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  HandCoins,
  HeartHandshake,
  Loader2,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { OtpDialog } from "./OtpDialog";
import { PAYMENT_ENABLED, contactInfo, impactItems } from "./config";
import { formatMoney, formatTierRange } from "./formatters";
import { paymentCategories } from "./operators";
import { useDonationFlow } from "./useDonationFlow";
import type { DonationTier, DonorType, Step } from "./types";
import {
  Field,
  PrimaryButton,
  ReceiptLine,
  SecondaryButton,
  Stepper,
  SummaryBar,
} from "./ui";

/** Choix « pour qui » proposés à l'entrée du parcours. */
const donorTypeOptions: Array<{
  id: DonorType;
  icon: typeof User;
  label: string;
  detail: string;
}> = [
  {
    id: "self",
    icon: User,
    label: "Pour moi-même",
    detail: "Je fais ce don en mon nom.",
  },
  {
    id: "relative",
    icon: Users,
    label: "Pour un proche",
    detail: "J'offre ce don au nom d'un proche.",
  },
  {
    id: "organization",
    icon: Building2,
    label: "Pour une organisation",
    detail: "Je donne au nom d'une structure.",
  },
];

/** Personnalisation du formulaire bénéficiaire (proche / organisation). */
const beneficiaryConfig: Record<
  Exclude<DonorType, "self">,
  {
    title: string;
    subtitle: string;
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
  }
> = {
  relative: {
    title: "Les coordonnées du proche",
    subtitle:
      "Nous préviendrons cette personne, par e-mail, du don réalisé en son honneur.",
    nameLabel: "Nom du proche",
    namePlaceholder: "Ex. Marie Kalala",
    emailLabel: "Adresse e-mail du proche",
    emailPlaceholder: "proche@exemple.com",
  },
  organization: {
    title: "L'organisation bénéficiaire",
    subtitle:
      "Nous préviendrons cette structure, par e-mail, du don réalisé en son honneur.",
    nameLabel: "Nom de l'organisation",
    namePlaceholder: "Ex. Fondation CCAPAC",
    emailLabel: "E-mail de l'organisation",
    emailPlaceholder: "contact@organisation.org",
  },
};

const identityIntro = {
  eyebrow: "Étape 1 · Profil",
  title: "Commençons par vous",
  subtitle: "Vos informations resteront confidentielles et nous permettront d'émettre votre reçu ainsi que de finaliser votre don.",
};

const audienceIntro = {
  eyebrow: "Étape 1 · Profil",
  title: "Pour qui faites-vous ce don ?",
  subtitle:
    "Cela nous permet de personnaliser votre don et notre suivi. Choisissez pour continuer.",
};

const amountIntro = {
  eyebrow: "Étape 2 · Montant",
  title: "Choisissez votre contribution",
  subtitle: "Sélectionnez un niveau d'engagement ou saisissez un montant libre.",
};

const paymentIntro = {
  eyebrow: "Étape 3 · Paiement",
  title: "Finalisez votre don",
  subtitle: "Choisissez votre moyen de paiement sécurisé.",
};

function getStepIntro(step: Step, donorType: DonorType | null) {
  if (step === "amount") return amountIntro;
  if (step === "payment") return paymentIntro;
  if (step === "audience") return audienceIntro;
  if (step === "beneficiary") {
    const config =
      donorType === "organization"
        ? beneficiaryConfig.organization
        : beneficiaryConfig.relative;
    return {
      eyebrow: "Étape 1 · Profil",
      title: config.title,
      subtitle: config.subtitle,
    };
  }
  return identityIntro;
}

export default function DonationExperience() {
  const flow = useDonationFlow();
  const { campaign, currency } = flow;
  const intro = getStepIntro(flow.step, flow.donorType);

  return (
    <section
      id="faire-un-don"
      className="bg-[#f4efe4] py-16 text-primary sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid overflow-hidden rounded-2xl border border-[#e3d2b8] bg-white shadow-2xl lg:grid-cols-[0.82fr_1.18fr]">
          {/* Panneau de marque */}
          <aside className="relative flex flex-col justify-between gap-10 overflow-hidden bg-primary p-7 text-white sm:p-9">
            <Image
              src={campaign.coverImage}
              alt={campaign.coverImageAlt}
              fill
              priority
              className="object-cover opacity-25"
              sizes="(min-width: 1024px) 40vw, 100vw"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/92 via-primary/82 to-primary/95" />
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#ffcc02]/15 blur-3xl" />

            <div className="relative">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/12 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] backdrop-blur-md">
                <HandCoins className="h-4 w-4 text-[#ffcc02]" />
                Collecte Grand Tambour
              </div>

              <h2 className="text-2xl font-bold uppercase leading-[1.1] tracking-tight sm:text-3xl">
                {campaign.title}
              </h2>

              {campaign.description && (
                <p className="mt-4 max-w-md text-sm font-medium leading-relaxed text-white/80">
                  {campaign.description}
                </p>
              )}

              <div className="mt-6 rounded-xl border border-white/15 bg-white/8 p-4 backdrop-blur-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-white/55">
                  Objectif de la collecte
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {formatMoney(campaign.goalAmount, currency)}
                </p>
                {flow.progressPercent !== null && campaign.stats && (
                  <>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/14">
                      <div
                        className="h-full rounded-full bg-[#ffcc02]"
                        style={{ width: `${Math.max(flow.progressPercent, 2)}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs font-medium text-white/60">
                      {formatMoney(campaign.stats.raisedAmount, currency)} déjà
                      réunis ({flow.progressPercent.toFixed(0)}%).
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="relative space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide">
                  <BookOpen className="h-4 w-4 text-[#ffcc02]" />
                  Ce que le don finance
                </div>
                <ul className="space-y-2.5">
                  {impactItems.map((item) => (
                    <li
                      key={item}
                      className="flex gap-3 text-sm leading-relaxed text-white/78"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-[#ffcc02]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-1 gap-3 border-t border-white/12 pt-6 sm:grid-cols-2">
                <ValueProp
                  icon={ShieldCheck}
                  title="Paiement sécurisé"
                  detail="Transaction chiffrée et protégée."
                />
                <ValueProp
                  icon={HeartHandshake}
                  title="100% dédié"
                  detail="Au projet de la Biblio-Librairie."
                />
              </div>
            </div>
          </aside>

          {/* Panneau formulaire */}
          <div className="flex flex-col bg-white p-6 sm:p-8 lg:p-10">
            <Stepper step={flow.step} />

            <div className="mt-8">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-secondary">
                {intro.eyebrow}
              </p>
              <h3 className="mt-2 text-2xl font-bold uppercase leading-tight text-primary sm:text-3xl">
                {intro.title}
              </h3>
              <p className="mt-2 text-sm font-medium leading-relaxed text-primary/60">
                {intro.subtitle}
              </p>
            </div>

            <div className="mt-7 flex-1">
              {flow.step === "identity" && <IdentityStep flow={flow} />}
              {flow.step === "audience" && <AudienceStep flow={flow} />}
              {flow.step === "beneficiary" && <BeneficiaryStep flow={flow} />}
              {flow.step === "amount" && <AmountStep flow={flow} />}
              {flow.step === "payment" && <PaymentStep flow={flow} />}
            </div>

            <div className="mt-8 flex flex-col gap-3 border-t border-[#eadcc7] pt-5 text-xs font-semibold text-primary/60 sm:flex-row sm:items-center sm:justify-between">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-secondary" />
                Paiement sécurisé
              </span>
              <span className="inline-flex items-center gap-2">
                <Mail className="h-4 w-4 text-secondary" />
                {contactInfo.email}
              </span>
              <span className="inline-flex items-center gap-2">
                <Phone className="h-4 w-4 text-secondary" />
                {contactInfo.phone}
              </span>
            </div>
          </div>
        </div>
      </div>

      <OtpDialog
        open={flow.isOtpModalOpen}
        isConfirming={flow.isConfirmingOtp}
        error={flow.otpError}
        onSubmit={flow.submitOtp}
        onClose={flow.closeOtpModal}
      />
    </section>
  );
}

type Flow = ReturnType<typeof useDonationFlow>;

function ValueProp({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof ShieldCheck;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-white/12 text-[#ffcc02]">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-white">
          {title}
        </p>
        <p className="mt-1 text-xs font-medium leading-relaxed text-white/60">
          {detail}
        </p>
      </div>
    </div>
  );
}

function IdentityStep({ flow }: { flow: Flow }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <Field
          label="Votre nom complet"
          inputRef={flow.fullNameInputRef}
          value={flow.fullName}
          onChange={(value) => {
            flow.setFullName(value);
            flow.updateError("fullName");
            flow.clearCheckoutError();
          }}
          placeholder="Ex. Jean Mukendi"
          error={flow.errors.fullName}
          autoComplete="name"
        />
        <Field
          label="Votre adresse e-mail"
          type="email"
          inputMode="email"
          value={flow.email}
          onChange={(value) => {
            flow.setEmail(value);
            flow.updateError("email");
            flow.clearCheckoutError();
          }}
          placeholder="vous@exemple.com"
          error={flow.errors.email}
          autoComplete="email"
        />
        <Field
          label="Téléphone"
          type="tel"
          inputMode="tel"
          value={flow.phone}
          onChange={(value) => {
            flow.setPhone(value);
            flow.clearCheckoutError();
          }}
          placeholder="+243 812 345 678"
          optional
          autoComplete="tel"
        />
      </div>

      <PrimaryButton onClick={flow.submitIdentity}>
        Continuer
        <ArrowRight className="h-4 w-4" />
      </PrimaryButton>
    </div>
  );
}

function AudienceStep({ flow }: { flow: Flow }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-3">
        {donorTypeOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = flow.donorType === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => flow.selectDonorType(option.id)}
              className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition duration-200 ${
                isSelected
                  ? "border-primary bg-primary/[0.06] ring-1 ring-primary/20"
                  : "border-[#eadcc7] bg-white hover:border-secondary/50 hover:bg-[#fdfbf6]"
              }`}
            >
              <span
                className={`grid h-11 w-11 flex-none place-items-center rounded-lg ${
                  isSelected
                    ? "bg-primary text-white"
                    : "bg-secondary/10 text-secondary"
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold uppercase tracking-wide text-primary">
                  {option.label}
                </span>
                <span className="mt-0.5 block text-xs font-medium leading-relaxed text-primary/60">
                  {option.detail}
                </span>
              </span>
              <ArrowRight className="h-4 w-4 flex-none text-secondary" />
            </button>
          );
        })}
      </div>

      <SecondaryButton onClick={flow.goToIdentity}>
        <ArrowLeft className="h-4 w-4" />
        Retour
      </SecondaryButton>
    </div>
  );
}

function BeneficiaryStep({ flow }: { flow: Flow }) {
  const config =
    flow.donorType === "organization"
      ? beneficiaryConfig.organization
      : beneficiaryConfig.relative;

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <Field
          label={config.nameLabel}
          inputRef={flow.beneficiaryNameInputRef}
          value={flow.beneficiaryName}
          onChange={(value) => {
            flow.setBeneficiaryName(value);
            flow.updateError("beneficiaryName");
            flow.clearCheckoutError();
          }}
          placeholder={config.namePlaceholder}
          error={flow.errors.beneficiaryName}
          autoComplete={
            flow.donorType === "organization" ? "organization" : "name"
          }
        />
        <Field
          label={config.emailLabel}
          type="email"
          inputMode="email"
          value={flow.beneficiaryEmail}
          onChange={(value) => {
            flow.setBeneficiaryEmail(value);
            flow.updateError("beneficiaryEmail");
            flow.clearCheckoutError();
          }}
          placeholder={config.emailPlaceholder}
          error={flow.errors.beneficiaryEmail}
        />

        <label className="block">
          <span className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-secondary">
            Message personnel
            <span className="font-semibold normal-case text-primary/45">
              Optionnel
            </span>
          </span>
          <textarea
            value={flow.beneficiaryMessage}
            onChange={(event) => {
              flow.setBeneficiaryMessage(event.target.value);
              flow.clearCheckoutError();
            }}
            rows={3}
            maxLength={500}
            placeholder="Un mot qui accompagnera l'annonce du don…"
            className="w-full rounded-md border border-[#eadcc7] bg-[#fdfbf6] px-4 py-3 text-sm font-semibold text-black outline-none transition placeholder:text-primary/35 focus:border-primary focus:bg-white"
          />
        </label>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <SecondaryButton onClick={flow.goToAudience}>
          <ArrowLeft className="h-4 w-4" />
          Retour
        </SecondaryButton>
        <PrimaryButton onClick={flow.submitBeneficiary}>
          Continuer
          <ArrowRight className="h-4 w-4" />
        </PrimaryButton>
      </div>
    </div>
  );
}

function AmountStep({ flow }: { flow: Flow }) {
  const recommended = flow.tiers.filter((tier) => tier.recommended);
  const others = flow.tiers.filter((tier) => !tier.recommended);

  return (
    <div className="space-y-6">
      {recommended.length > 0 && (
        <div className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-secondary">
            Recommandé
          </p>
          <div className="grid gap-3">
            {recommended.map((tier) => (
              <TierCard key={tier.id} tier={tier} flow={flow} />
            ))}
          </div>
        </div>
      )}

      {others.length > 0 && (
        <div className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-secondary/70">
            Autres niveaux d&apos;engagement
          </p>
          <div className="grid gap-3">
            {others.map((tier) => (
              <TierCard key={tier.id} tier={tier} flow={flow} />
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-dashed border-secondary/45 bg-[#fdfbf6] p-4">
        <button
          type="button"
          onClick={() => {
            flow.setUseCustomAmount(true);
            flow.clearStepFeedback();
            flow.scrollToAmountAction();
          }}
          className="mb-3 flex w-full items-center justify-between gap-3 text-left"
        >
          <span>
            <span className="block text-sm font-bold uppercase tracking-wide">
              Montant libre
            </span>
            <span className="text-xs font-medium text-primary/60">
              À partir de {formatMoney(flow.minimumAmount, flow.currency)}.
            </span>
          </span>
          <span
            className={`grid h-5 w-5 place-items-center rounded-full border transition ${
              flow.useCustomAmount
                ? "border-primary bg-primary"
                : "border-primary/35 bg-white"
            }`}
          >
            {flow.useCustomAmount && (
              <span className="h-2 w-2 rounded-full bg-white" />
            )}
          </span>
        </button>

        <label className="relative block">
          <span className="absolute inset-y-0 left-4 flex items-center text-xs font-bold text-primary/55">
            {flow.currency}
          </span>
          <input
            type="number"
            min={flow.minimumAmount}
            value={flow.customAmount}
            onFocus={() => flow.setUseCustomAmount(true)}
            onChange={(event) => {
              flow.setCustomAmount(event.target.value);
              flow.updateError("amount");
              flow.clearCheckoutError();
            }}
            placeholder="Saisir un montant"
            className="h-12 w-full rounded-lg border border-[#eadcc7] bg-white pl-16 pr-4 text-sm font-bold text-primary outline-none transition focus:border-primary"
          />
        </label>
        {flow.errors.amount && (
          <p className="mt-2 text-xs font-semibold text-red-700">
            {flow.errors.amount}
          </p>
        )}
      </div>

      <div ref={flow.amountActionRef} className="space-y-3">
        <SecondaryButton onClick={flow.goBackFromAmount}>
          <ArrowLeft className="h-4 w-4" />
          Retour
        </SecondaryButton>
        <SummaryBar
          label={flow.selectedLabel}
          amount={flow.selectedAmount}
          currency={flow.currency}
          actionLabel="Continuer"
          onAction={flow.goToPayment}
        />
      </div>
    </div>
  );
}

function TierCard({ tier, flow }: { tier: DonationTier; flow: Flow }) {
  const isSelected = flow.selectedTierId === tier.id && !flow.useCustomAmount;

  return (
    <button
      type="button"
      onClick={() => {
        flow.setSelectedTierId(tier.id);
        flow.setUseCustomAmount(false);
        flow.setCustomAmount("");
        flow.clearStepFeedback();
        flow.scrollToAmountAction();
      }}
      className={`w-full rounded-xl border p-4 text-left transition duration-200 ${
        isSelected
          ? "border-primary bg-primary/[0.06] ring-1 ring-primary/20"
          : "border-[#eadcc7] bg-white hover:border-secondary/50 hover:bg-[#fdfbf6]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold uppercase tracking-wide text-primary">
              {tier.name}
            </span>
            {tier.recommended && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#ffcc02]/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#7a5a12]">
                <Sparkles className="h-3 w-3" />
                Recommandé
              </span>
            )}
          </div>
          {tier.description && (
            <p className="mt-1 text-xs font-medium leading-relaxed text-primary/60">
              {tier.description}
            </p>
          )}
        </div>
        <span
          className={`flex-none rounded-md px-3 py-2 text-sm font-bold ${
            isSelected ? "bg-primary text-white" : "bg-secondary/8 text-primary"
          }`}
        >
          {formatTierRange(tier.minAmount, tier.maxAmount, flow.currency)}
        </span>
      </div>
    </button>
  );
}

function PaymentStep({ flow }: { flow: Flow }) {
  const isRedirect = Boolean(flow.activeOperator?.redirect);
  const hasOperatorChoice = flow.activeCategory.operators.length > 1;
  const [showComingSoon, setShowComingSoon] = useState(false);

  const handleFinalize = () => {
    if (PAYMENT_ENABLED) {
      flow.createCheckout();
      return;
    }
    // Paiement en ligne pas encore disponible : on l'annonce honnêtement.
    setShowComingSoon(true);
  };

  return (
    <div className="space-y-6">
      {/* Catégories */}
      <div className="grid gap-3 sm:grid-cols-3">
        {paymentCategories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = flow.category === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => flow.selectCategory(cat.id)}
              className={`rounded-xl border p-4 text-left transition ${
                isSelected
                  ? "border-primary bg-primary/[0.06] ring-1 ring-primary/20"
                  : "border-[#eadcc7] bg-white hover:border-secondary/50"
              }`}
            >
              <span
                className={`mb-3 grid h-9 w-9 place-items-center rounded-lg ${
                  isSelected
                    ? "bg-primary text-white"
                    : "bg-secondary/10 text-secondary"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="block text-sm font-bold uppercase text-primary">
                {cat.title}
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-primary/55">
                {cat.detail}
              </span>
            </button>
          );
        })}
      </div>

      {/* Choix de l'opérateur (seulement si plusieurs) */}
      {hasOperatorChoice && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-secondary">
            Opérateur
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {flow.activeCategory.operators.map((operator) => {
              const isSelected = flow.operatorCode === operator.code;

              return (
                <button
                  key={operator.code}
                  type="button"
                  onClick={() => flow.selectOperator(operator.code)}
                  className={`w-full rounded-lg border px-3 py-2.5 text-center text-xs font-bold uppercase tracking-wide transition ${
                    isSelected
                      ? "border-primary bg-primary text-white shadow-sm"
                      : "border-[#eadcc7] bg-white text-primary hover:border-secondary/50"
                  }`}
                >
                  {operator.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Carte : message de redirection sécurisée — sinon, champ compte payeur */}
      {isRedirect ? (
        <div className="flex items-start gap-3 rounded-xl border border-secondary/25 bg-[#fdfbf6] p-4">
          <span className="grid h-10 w-10 flex-none place-items-center rounded-lg bg-secondary/10 text-secondary">
            <CreditCard className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-primary">
              Paiement par carte sécurisé
            </p>
            <p className="mt-1 text-sm font-medium leading-relaxed text-primary/65">
              Vous serez redirigé vers la page de paiement sécurisée de Makuta
              pour saisir les informations de votre carte. Aucune donnée
              bancaire ne transite par ce site.
            </p>
          </div>
        </div>
      ) : (
        <Field
          id="don-account-number"
          label={flow.activeCategory.accountLabel}
          type="tel"
          inputMode="tel"
          value={flow.accountNumber}
          onChange={(value) => {
            flow.setAccountNumber(value);
            flow.updateError("accountNumber");
            flow.clearCheckoutError();
          }}
          placeholder={flow.activeCategory.accountPlaceholder}
          hint={flow.activeCategory.accountHint}
          error={flow.errors.accountNumber}
        />
      )}

      {/* Récapitulatif */}
      <div className="rounded-xl border border-[#eadcc7] bg-[#fdfbf6] p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-secondary">
          Récapitulatif
        </p>
        <div className="mt-1">
          <ReceiptLine label="Niveau" value={flow.selectedLabel} />
          <ReceiptLine
            label="Moyen de paiement"
            value={flow.activeOperator?.label || flow.activeCategory.title}
          />
          <ReceiptLine
            label="Montant du don"
            value={formatMoney(flow.selectedAmount, flow.currency)}
            strong
          />
        </div>
      </div>

      {flow.checkoutError && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          {flow.checkoutError}
        </p>
      )}

      {showComingSoon ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-secondary/25 bg-[#fdfbf6] p-5">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-secondary/12 text-secondary">
                <Clock className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-primary">
                  Paiement en ligne bientôt disponible
                </p>
                <p className="mt-1.5 text-sm font-medium leading-relaxed text-primary/65">
                  Le paiement en ligne est en cours de finalisation et sera
                  ouvert très prochainement. Merci pour votre élan de
                  générosité — revenez d&apos;ici peu pour confirmer votre don.
                  Pour contribuer dès maintenant, écrivez-nous à{" "}
                  <a
                    href={`mailto:${contactInfo.email}`}
                    className="font-bold text-secondary underline-offset-2 hover:underline"
                  >
                    {contactInfo.email}
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>

          <SecondaryButton onClick={() => setShowComingSoon(false)}>
            <ArrowLeft className="h-4 w-4" />
            Retour au formulaire
          </SecondaryButton>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-center gap-2 rounded-lg border border-[#eadcc7] bg-[#fdfbf6] px-4 py-3 text-xs font-medium text-primary/70">
            <Lock className="h-4 w-4 flex-none text-secondary" />
            Vos informations sont protégées. Paiement traité de façon sécurisée.
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <SecondaryButton
              onClick={flow.goBackToAmount}
              disabled={flow.isCreatingCheckout}
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </SecondaryButton>
            <PrimaryButton
              onClick={handleFinalize}
              disabled={flow.isCreatingCheckout}
            >
              {flow.isCreatingCheckout ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Traitement en cours…
                </>
              ) : (
                <>
                  Finaliser le don
                  <ShieldCheck className="h-4 w-4" />
                </>
              )}
            </PrimaryButton>
          </div>
        </>
      )}
    </div>
  );
}
