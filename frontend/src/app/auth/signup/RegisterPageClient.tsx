"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import { toast } from "sonner";

import { AuthLayout } from "@/app/components/auth/AuthLayout";
import GoogleAuthButton from "@/app/components/auth/GoogleAuthButton";
import SignupForm, {
  type SignupFormValues,
} from "@/app/components/auth/SignupForm";
import { useAuth } from "@/context/AuthContext";
import { register } from "@/services/auth";

type RegisterPageClientProps = {
  initialEmail: string;
};

type ApiErrorResponse = {
  success?: boolean;
  message?: string;
  errors?: Array<{
    msg?: string;
    message?: string;
  }>;
};

export function RegisterPageClient({
  initialEmail,
}: RegisterPageClientProps) {
  const router = useRouter();

  const {
    loginWithGoogle,
    logout,
  } = useAuth();

  const [loading, setLoading] =
    useState(false);

  const handleSignupSubmit = async (
    values: SignupFormValues
  ) => {
    if (loading) {
      return;
    }

    const normalizedEmail = values.email
      .trim()
      .toLowerCase();

    try {
      setLoading(true);

      const response = await register({
        email: normalizedEmail,
        password: values.password,
        first_name:
          values.firstName.trim(),
        last_name:
          values.lastName.trim(),
        phone:
          values.phone?.trim() || "",
      });

      if (!response.success) {
        toast.error(
          response.message ||
            "Erreur lors de l'inscription."
        );

        return;
      }

      toast.success(
        response.message ||
          "Compte créé. Un email de vérification vous a été envoyé."
      );

      /*
       * Ne pas rediriger directement vers
       * /auth/verify-email.
       *
       * Cette page nécessite le token contenu
       * dans le lien envoyé par email.
       */
      router.replace(
        `/auth/check-email?email=${encodeURIComponent(
          normalizedEmail
        )}`
      );
    } catch (error: unknown) {
      console.error(
        "Registration error:",
        isAxiosError(error)
          ? error.response?.data
          : error
      );

      let message =
        "Erreur lors de l'inscription.";

      if (
        isAxiosError<ApiErrorResponse>(
          error
        )
      ) {
        const backendMessage =
          error.response?.data?.message;

        const validationMessage =
          error.response?.data?.errors?.[0]
            ?.msg ||
          error.response?.data?.errors?.[0]
            ?.message;

        if (backendMessage) {
          message = backendMessage;
        } else if (validationMessage) {
          message = validationMessage;
        } else if (
          error.code === "ERR_NETWORK"
        ) {
          message =
            "Impossible de contacter le serveur.";
        }
      } else if (
        error instanceof Error
      ) {
        message = error.message;
      }

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (
    credential: string
  ) => {
    if (loading) {
      return;
    }

    try {
      setLoading(true);

      const user =
        await loginWithGoogle(
          credential
        );

      const normalizedRole = String(
        user.role || ""
      )
        .trim()
        .toUpperCase();

      /*
       * La page d'inscription publique est
       * réservée aux membres.
       */
      if (normalizedRole !== "MEMBER") {
        await logout();

        toast.error(
          "Cette connexion est réservée aux membres."
        );

        return;
      }

      toast.success(
        "Connexion Google réussie",
        {
          description: `Bienvenue ${
            user.first_name ||
            user.email
          }`,
        }
      );

      router.replace(
        "/espace-membre/membre"
      );
    } catch (error: unknown) {
      console.error(
        "Google registration error:",
        isAxiosError(error)
          ? error.response?.data
          : error
      );

      let message =
        "Impossible de continuer avec Google.";

      if (
        isAxiosError<ApiErrorResponse>(
          error
        )
      ) {
        const backendMessage =
          error.response?.data?.message;

        if (backendMessage) {
          message = backendMessage;
        } else if (
          error.code === "ERR_NETWORK"
        ) {
          message =
            "Impossible de contacter le serveur.";
        }
      } else if (
        error instanceof Error
      ) {
        message = error.message;
      }

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Créer un compte">
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Créer un compte
          </h1>

          <p className="text-sm text-muted-foreground">
            Inscrivez-vous pour accéder à
            votre espace membre.
          </p>
        </div>

        <div className="space-y-4">
          <GoogleAuthButton
            onCredential={
              handleGoogleCredential
            }
            disabled={loading}
          />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted/50" />
            </div>

            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                ou s&apos;inscrire avec
              </span>
            </div>
          </div>

          <SignupForm
            initialEmail={initialEmail}
            onSubmit={
              handleSignupSubmit
            }
            loading={loading}
          />
        </div>

        <div className="text-center text-sm">
          <p className="text-muted-foreground">
            Vous avez déjà un compte ?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-primary underline-offset-4 transition-all hover:text-primary/90 hover:underline"
            >
              Se connecter
            </Link>
          </p>
        </div>

        <div className="px-4 text-center text-xs text-muted-foreground/60">
          En créant un compte, vous
          acceptez nos{" "}
          <Link
            href="#"
            className="underline hover:text-foreground"
          >
            Conditions
            d&apos;utilisation
          </Link>{" "}
          et notre{" "}
          <Link
            href="#"
            className="underline hover:text-foreground"
          >
            Politique de
            confidentialité
          </Link>
          .
        </div>
      </div>
    </AuthLayout>
  );
}