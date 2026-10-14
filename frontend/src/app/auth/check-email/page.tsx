"use client";

import {
  Suspense,
  useState,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { isAxiosError } from "axios";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Mail,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import api from "@/lib/api";

type ApiErrorResponse = {
  message?: string;
};

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email")?.trim() || "";

  const [resending, setResending] =
    useState(false);

  const handleResend = async () => {
    if (!email || resending) {
      if (!email) {
        toast.error(
          "Adresse email introuvable. Retournez à la page de connexion."
        );
      }
      return;
    }

    try {
      setResending(true);

      const response = await api.post<{
        success: boolean;
        message?: string;
      }>("/auth/resend-verification", {
        email,
      });

      toast.success(
        response.data.message ||
          "Un nouvel email de vérification a été envoyé."
      );
    } catch (error) {
      console.error(
        "Resend verification error:",
        isAxiosError(error)
          ? error.response?.data
          : error
      );

      const message =
        isAxiosError<ApiErrorResponse>(error)
          ? error.response?.data?.message
          : null;

      toast.error(
        message ||
          "Impossible de renvoyer l’email de vérification."
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F3EEE5] px-4 py-10">
      <section className="w-full max-w-xl overflow-hidden rounded-3xl border border-[#D1965B]/20 bg-white shadow-xl">
        <div className="bg-[#D1965B] px-6 py-9 text-center text-white sm:px-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white/15">
            <Mail className="h-10 w-10" />
          </div>

          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-white/75">
            CCAPAC · Espace membre
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Vérifiez votre email
          </h1>
        </div>

        <div className="p-6 text-center sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>

          <h2 className="mt-5 text-xl font-bold text-[#5C4033]">
            Votre compte a été créé
          </h2>

          <p className="mt-3 text-sm leading-7 text-[#5C4033]/70">
            Un lien de vérification a été envoyé
            {email ? (
              <>
                {" à "}
                <strong className="break-all text-[#5C4033]">
                  {email}
                </strong>
              </>
            ) : (
              " à votre adresse email"
            )}
            . Cliquez sur ce lien pour activer votre compte avant de vous connecter.
          </p>

          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left">
            <p className="text-sm font-semibold text-amber-900">
              Vous ne voyez pas le message ?
            </p>

            <p className="mt-1 text-xs leading-5 text-amber-800">
              Consultez les dossiers Spam, Promotions ou Courrier indésirable. Le lien reste valable pendant 24 heures.
            </p>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              disabled={!email || resending}
              onClick={handleResend}
              className="border-[#D1965B]/35 text-[#5C4033] hover:bg-[#F3EEE5]"
            >
              {resending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}

              {resending
                ? "Envoi en cours..."
                : "Renvoyer l’email"}
            </Button>

            <Button
              asChild
              className="bg-[#D1965B] text-white hover:bg-[#B97D47]"
            >
              <Link href="/auth/login">
                Aller à la connexion
              </Link>
            </Button>
          </div>

          <Link
            href="/auth/signup"
            className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-[#5C4033]/65 hover:text-[#D1965B]"
          >
            <ArrowLeft className="h-4 w-4" />
            Corriger mon adresse email
          </Link>
        </div>
      </section>
    </main>
  );
}

function CheckEmailFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F3EEE5]">
      <Loader2 className="h-10 w-10 animate-spin text-[#D1965B]" />
    </main>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense fallback={<CheckEmailFallback />}>
      <CheckEmailContent />
    </Suspense>
  );
}