"use client";

import {
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { isAxiosError } from "axios";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MailCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import api from "@/lib/api";

type VerificationState =
  | "loading"
  | "success"
  | "error";

type ApiErrorResponse = {
  success?: boolean;
  message?: string;
};

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim();

  const verificationStarted = useRef(false);

  const [status, setStatus] =
    useState<VerificationState>("loading");

  const [message, setMessage] = useState(
    "Vérification de votre adresse email en cours..."
  );

  useEffect(() => {
    if (verificationStarted.current) {
      return;
    }

    verificationStarted.current = true;

    if (!token) {
      setStatus("error");
      setMessage(
        "Le lien de vérification est incomplet : aucun token n’a été fourni."
      );
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await api.get<{
          success: boolean;
          message?: string;
        }>("/auth/verify-email", {
          params: { token },
        });

        setStatus("success");
        setMessage(
          response.data.message ||
            "Votre adresse email a été vérifiée avec succès."
        );
      } catch (error) {
        console.error(
          "Email verification error:",
          isAxiosError(error)
            ? error.response?.data
            : error
        );

        let errorMessage =
          "Impossible de vérifier votre adresse email.";

        if (isAxiosError<ApiErrorResponse>(error)) {
          errorMessage =
            error.response?.data?.message ||
            (error.code === "ERR_NETWORK"
              ? "Impossible de contacter le serveur."
              : errorMessage);
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        setStatus("error");
        setMessage(errorMessage);
      }
    };

    void verifyEmail();
  }, [token]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F3EEE5] px-4 py-10">
      <section className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#D1965B]/20 bg-white shadow-lg">
        <div className="bg-[#D1965B] px-6 py-8 text-center text-white sm:px-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15">
            <MailCheck className="h-8 w-8" />
          </div>

          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/75">
            CCAPAC
          </p>

          <h1 className="mt-2 text-2xl font-bold">
            Vérification de l’email
          </h1>
        </div>

        <div className="p-6 text-center sm:p-8">
          {status === "loading" && (
            <>
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#D1965B]" />

              <h2 className="mt-5 text-xl font-bold text-[#5C4033]">
                Veuillez patienter
              </h2>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-9 w-9 text-emerald-600" />
              </div>

              <h2 className="mt-5 text-xl font-bold text-[#5C4033]">
                Email vérifié
              </h2>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-9 w-9 text-red-600" />
              </div>

              <h2 className="mt-5 text-xl font-bold text-[#5C4033]">
                Vérification impossible
              </h2>
            </>
          )}

          <p
            className={`mt-3 text-sm leading-6 ${
              status === "error"
                ? "text-red-700"
                : "text-[#5C4033]/70"
            }`}
          >
            {message}
          </p>

          {status === "success" && (
            <Button
              asChild
              className="mt-7 w-full bg-[#D1965B] text-white hover:bg-[#B97D47]"
            >
              <Link href="/auth/login">
                Se connecter
              </Link>
            </Button>
          )}

          {status === "error" && (
            <div className="mt-7 space-y-3">
              <Button
                asChild
                className="w-full bg-[#D1965B] text-white hover:bg-[#B97D47]"
              >
                <Link href="/auth/login">
                  Retour à la connexion
                </Link>
              </Button>

              <p className="text-xs text-[#5C4033]/55">
                Depuis la page de connexion, vous pourrez demander le renvoi d’un email de vérification.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function VerificationFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F3EEE5]">
      <div className="text-center">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#D1965B]" />

        <p className="mt-4 text-sm text-[#5C4033]/70">
          Chargement de la vérification...
        </p>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerificationFallback />}>
      <VerifyEmailContent />
    </Suspense>
  );
}