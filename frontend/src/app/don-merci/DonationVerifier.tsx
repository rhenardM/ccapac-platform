"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  HeartHandshake,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";

type DonationStatus =
  | "pending"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "refunded";

type VerificationState =
  | "loading"
  | "succeeded"
  | "pending"
  | "failed"
  | "unavailable";

type VerificationCopy = {
  eyebrow: string;
  title: string;
  description: string;
  detail: string;
};

const stateCopy: Record<VerificationState, VerificationCopy> = {
  loading: {
    eyebrow: "Validation en cours",
    title: "Nous confirmons votre paiement",
    description:
      "Merci de patienter quelques instants. Cette étape permet de confirmer votre don avant de mettre à jour la collecte.",
    detail: "Vérification du paiement en cours...",
  },
  succeeded: {
    eyebrow: "Don confirmé",
    title: "Votre don a bien été effectué",
    description:
      "Merci pour votre soutien. Votre contribution est confirmée et sera prise en compte dans la progression de la collecte.",
    detail: "Paiement confirmé avec succès.",
  },
  pending: {
    eyebrow: "Confirmation en attente",
    title: "Votre paiement est en cours de confirmation",
    description:
      "Nous n'avons pas encore reçu la confirmation finale. Vous pouvez patienter ou relancer la vérification.",
    detail: "La confirmation peut prendre quelques instants.",
  },
  failed: {
    eyebrow: "Paiement non abouti",
    title: "Votre don n'a pas été confirmé",
    description:
      "Le paiement n'a pas pu être finalisé. Vous pouvez retourner à la campagne et réessayer avec le moyen de paiement de votre choix.",
    detail: "Aucun don confirmé n'a été enregistré pour cette tentative.",
  },
  unavailable: {
    eyebrow: "Vérification indisponible",
    title: "Nous ne pouvons pas confirmer ce paiement",
    description:
      "La référence du don est introuvable ou la vérification n'est pas disponible pour le moment.",
    detail: "Vous pouvez revenir à la campagne ou réessayer plus tard.",
  },
};

function stateIcon(state: VerificationState) {
  if (state === "succeeded") return CheckCircle2;
  if (state === "failed") return XCircle;
  if (state === "unavailable") return AlertCircle;
  if (state === "pending") return Clock3;
  return Loader2;
}

function stateStyles(state: VerificationState) {
  if (state === "succeeded") {
    return {
      icon: "bg-green-100 text-green-800",
      ring: "border-green-200 bg-green-50 text-green-800",
      accent: "bg-green-600",
    };
  }

  if (state === "failed" || state === "unavailable") {
    return {
      icon: "bg-red-100 text-red-800",
      ring: "border-red-200 bg-red-50 text-red-800",
      accent: "bg-red-600",
    };
  }

  return {
    icon: "bg-secondary/12 text-primary",
    ring: "border-secondary/25 bg-[#fdfbf6] text-primary",
    accent: "bg-secondary",
  };
}

export default function DonationVerifier() {
  const [state, setState] = useState<VerificationState>("loading");
  const [donationId, setDonationId] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const copy = stateCopy[state];
  const styles = stateStyles(state);
  const Icon = stateIcon(state);
  const canRetry = state === "pending" || state === "unavailable";
  const isBusy = state === "loading" || isRetrying;

  const resolveDonationId = useCallback(() => {
    const id =
      new URLSearchParams(window.location.search).get("donation_id") ||
      sessionStorage.getItem("ccapac.last_donation_id");

    setDonationId(id);
    return id;
  }, []);

  const verifyDonation = useCallback(async (id: string) => {
    setState("loading");

    const response = await fetch(`/api/fundraising/donations/${id}/verify`, {
      method: "POST",
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error?.message || "verification_failed");
    }

    const status = data.status as DonationStatus;

    if (status === "succeeded") {
      setState("succeeded");
      sessionStorage.removeItem("ccapac.last_donation_id");
      return;
    }

    if (status === "pending") {
      setState("pending");
      return;
    }

    setState("failed");
  }, []);

  useEffect(() => {
    const id = resolveDonationId();

    if (!id) {
      setState("unavailable");
      return;
    }

    verifyDonation(id).catch(() => setState("unavailable"));
  }, [resolveDonationId, verifyDonation]);

  const steps = useMemo(
    () => [
      {
        label: "Paiement reçu",
        done: state !== "loading" && state !== "unavailable",
      },
      {
        label: "Validation",
        done: state === "succeeded" || state === "failed",
      },
      {
        label: "Confirmation",
        done: state === "succeeded",
      },
    ],
    [state]
  );

  const retryVerification = async () => {
    const id = donationId || resolveDonationId();

    if (!id) {
      setState("unavailable");
      return;
    }

    setIsRetrying(true);
    try {
      await verifyDonation(id);
    } catch {
      setState("unavailable");
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <section className="mx-auto grid max-w-5xl gap-5 sm:gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-stretch mt-36">
      <aside className="relative order-2 overflow-hidden rounded-lg bg-primary p-5 text-white shadow-2xl sm:p-7 lg:order-1 lg:p-8">
        <div className="absolute inset-x-0 top-0 h-1 bg-secondary" />
        <div className="flex h-full flex-col justify-between gap-8 lg:gap-12">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] sm:px-4 sm:text-xs">
              <HeartHandshake className="h-4 w-4 text-[#ffcc02]" />
              Collecte Grand Tambour
            </div>
            <h1 className="text-2xl font-bold uppercase leading-[1.08] tracking-tight sm:text-3xl lg:text-4xl">
              Merci de soutenir la Biblio-Librairie
            </h1>
            <p className="mt-5 text-sm font-medium leading-relaxed text-white/72">
              Votre contribution aide à faire vivre un espace de lecture, de
              transmission et de rencontre au service de la jeunesse.
            </p>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-3 lg:grid-cols-1 lg:gap-3">
            {steps.map((step, index) => (
              <div
                key={step.label}
                className="flex items-center gap-3 rounded-md bg-white/8 px-3 py-3 sm:flex-col sm:items-start lg:flex-row lg:items-center lg:px-4"
              >
                <span
                  className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
                    step.done
                      ? "bg-[#ffcc02] text-primary"
                      : "bg-white/10 text-white/55"
                  }`}
                >
                  {index + 1}
                </span>
                <span
                  className={`text-xs font-bold sm:text-sm ${
                    step.done ? "text-white" : "text-white/55"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <div className="order-1 rounded-lg border border-[#d5b58d]/45 bg-white p-5 shadow-xl sm:p-7 lg:order-2 lg:p-8">
        <div
          className={`mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] sm:px-4 sm:text-xs ${styles.ring}`}
        >
          <span className={`h-2 w-2 rounded-full ${styles.accent}`} />
          {copy.eyebrow}
        </div>

        <div
          className={`mb-5 grid h-14 w-14 place-items-center rounded-full sm:h-16 sm:w-16 ${styles.icon}`}
        >
          <Icon className={`h-7 w-7 sm:h-8 sm:w-8 ${isBusy ? "animate-spin" : ""}`} />
        </div>

        <h2 className="max-w-xl text-2xl font-bold uppercase leading-tight text-primary sm:text-3xl lg:text-4xl">
          {copy.title}
        </h2>
        <p className="mt-4 max-w-2xl text-sm font-medium leading-relaxed text-primary/70 sm:text-base">
          {copy.description}
        </p>

        <div className="mt-7 rounded-md border border-[#eadcc7] bg-[#fdfbf6] p-4">
          <p className="text-sm font-bold text-primary">{copy.detail}</p>
          {donationId && (
            <p className="mt-2 break-all text-xs font-semibold text-primary/55">
              Référence: {donationId}
            </p>
          )}
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          {canRetry && (
            <button
              type="button"
              onClick={retryVerification}
              disabled={isRetrying}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRetrying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Relancer la vérification
            </button>
          )}

          <Link
            href="/#fundraising"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-secondary/30 bg-white px-5 py-3 text-xs font-bold uppercase tracking-wide text-primary transition hover:bg-[#f8f1e7]"
          >
            Voir la campagne
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
