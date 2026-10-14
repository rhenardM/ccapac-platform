"use client";

import {
  Suspense,
  useState,
} from "react";
import Link from "next/link";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import { isAxiosError } from "axios";
import { toast } from "sonner";

import { AuthLayout } from "@/app/components/auth/AuthLayout";
import LoginForm, {
  type LoginFormValues,
} from "@/app/components/auth/LoginForm";
import GoogleAuthButton from "@/app/components/auth/GoogleAuthButton";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import type { User } from "@/services/auth";

type ApiErrorResponse = {
  success?: boolean;
  message?: string;
  code?: string;
  needsVerification?: boolean;
};

type LoginNotice = {
  message: string;
  type:
    | "ACCESS_DENIED"
    | "EMAIL_VERIFICATION";
};

const MEMBER_DESTINATION =
  "/espace-membre/membre";

const INTERNAL_LOGIN_PATH =
  "/auth/equipe-validation-7d2f9a4c81";

const PUBLIC_ACCESS_DENIED_MESSAGE =
  "Ce compte n’est pas autorisé à utiliser cet espace de connexion.";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    login,
    loginWithGoogle,
    logout,
  } = useAuth();

  const requestedRedirect =
    searchParams.get("redirectUrl");

  const safeRequestedRedirect =
    requestedRedirect?.startsWith("/") &&
    !requestedRedirect.startsWith("//")
      ? requestedRedirect
      : null;

  const [isLoading, setIsLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [notice, setNotice] =
    useState<LoginNotice | null>(null);

  const clearMessages = () => {
    setError(null);
    setNotice(null);
  };

  const getMemberDestination = () => {
    const requestedRouteIsAllowed =
      Boolean(
        safeRequestedRedirect &&
          (
            safeRequestedRedirect ===
              MEMBER_DESTINATION ||
            safeRequestedRedirect.startsWith(
              `${MEMBER_DESTINATION}/`
            ) ||
            safeRequestedRedirect ===
              "/espace-membre/profile"
          )
      );

    return requestedRouteIsAllowed &&
      safeRequestedRedirect
      ? safeRequestedRedirect
      : MEMBER_DESTINATION;
  };

  const showAccessDeniedNotice = () => {
    setError(null);

    setNotice({
      message:
        PUBLIC_ACCESS_DENIED_MESSAGE,
      type: "ACCESS_DENIED",
    });

    toast.info(
      PUBLIC_ACCESS_DENIED_MESSAGE
    );
  };

  const finishMemberLogin = async (
    user: User
  ): Promise<boolean> => {
    const normalizedRole = String(
      user.role || ""
    )
      .trim()
      .toUpperCase();

    /*
     * La connexion publique est réservée
     * uniquement aux utilisateurs MEMBER.
     */
    if (normalizedRole !== "MEMBER") {
      /*
       * La méthode login() peut avoir enregistré
       * temporairement le token. On détruit cette
       * session avant d'afficher le lien interne.
       */
      await logout();

      showAccessDeniedNotice();

      return false;
    }

    const destination =
      getMemberDestination();

    toast.success(
      "Connexion réussie",
      {
        description: `Bienvenue ${
          user.first_name ||
          user.email
        }`,
      }
    );

    router.replace(destination);

    return true;
  };

  const resendVerificationEmail =
    async (
      email: string
    ): Promise<void> => {
      try {
        await api.post(
          "/auth/resend-verification",
          {
            email: email
              .trim()
              .toLowerCase(),
          }
        );

        toast.info(
          "Un nouveau lien de vérification vous a été envoyé."
        );
      } catch {
        /*
         * L'échec du renvoi automatique ne doit
         * pas remplacer le message principal.
         */
      }
    };

  const handleAuthenticationError =
    async (
      err: unknown,
      email?: string
    ): Promise<void> => {
      if (
        isAxiosError<ApiErrorResponse>(
          err
        )
      ) {
        const status =
          err.response?.status;

        const backendData =
          err.response?.data;

        const backendMessage =
          backendData?.message;

        const verificationRequired =
          backendData?.needsVerification ===
            true ||
          backendData?.code ===
            "EMAIL_NOT_VERIFIED";

        /*
         * Le statut 403 est une réponse attendue.
         * Il n'est pas envoyé dans console.error.
         */
        if (status === 403) {
          if (verificationRequired) {
            const message =
              backendMessage ||
              "Veuillez vérifier votre adresse email avant de vous connecter.";

            setError(null);

            setNotice({
              message,
              type:
                "EMAIL_VERIFICATION",
            });

            toast.info(message);

            if (email) {
              await resendVerificationEmail(
                email
              );
            }

            return;
          }

          showAccessDeniedNotice();

          return;
        }

        /*
         * Le statut 401 correspond à des
         * identifiants incorrects.
         */
        if (status === 401) {
          const message =
            backendMessage ||
            "Email ou mot de passe incorrect.";

          setNotice(null);
          setError(message);
          toast.error(message);

          return;
        }

        /*
         * Le statut 400 correspond à des
         * données invalides ou incomplètes.
         */
        if (status === 400) {
          const message =
            backendMessage ||
            "Veuillez vérifier les informations saisies.";

          setNotice(null);
          setError(message);
          toast.error(message);

          return;
        }

        if (
          err.code ===
          "ERR_NETWORK"
        ) {
          const message =
            "Impossible de contacter le serveur.";

          setNotice(null);
          setError(message);
          toast.error(message);

          console.error(
            "Serveur d’authentification inaccessible :",
            err
          );

          return;
        }

        const message =
          backendMessage ||
          "Une erreur inattendue est survenue pendant la connexion.";

        setNotice(null);
        setError(message);
        toast.error(message);

        /*
         * Seules les véritables erreurs serveur
         * sont affichées dans la console.
         */
        console.error(
          "Erreur serveur pendant la connexion :",
          err
        );

        return;
      }

      const message =
        err instanceof Error
          ? err.message
          : "Une erreur inattendue est survenue pendant la connexion.";

      setNotice(null);
      setError(message);
      toast.error(message);

      console.error(
        "Erreur inattendue pendant la connexion :",
        err
      );
    };

  const handleSubmit = async (
    values: LoginFormValues
  ) => {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    clearMessages();

    try {
      const user = await login(
        values.email,
        values.password
      );

      await finishMemberLogin(user);
    } catch (err: unknown) {
      await handleAuthenticationError(
        err,
        values.email
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleCredential = async (
    credential: string
  ) => {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    clearMessages();

    try {
      const user =
        await loginWithGoogle(
          credential
        );

      await finishMemberLogin(user);
    } catch (err: unknown) {
      await handleAuthenticationError(
        err
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Connexion">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            Accédez à votre espace membre
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Entrez vos identifiants pour
            accéder à vos réservations et à
            vos demandes.
          </p>
        </div>

        {notice && (
          <div
            role="status"
            className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800"
          >
            <p>
              {notice.message}
            </p>

            {notice.type ===
              "ACCESS_DENIED" && (
              <Link
                href={
                  INTERNAL_LOGIN_PATH
                }
                className="mt-3 inline-flex font-semibold text-amber-900 underline underline-offset-4 transition hover:text-amber-700"
              >
                Accéder à l&apos;espace privé
              </Link>
            )}

            {notice.type ===
              "EMAIL_VERIFICATION" && (
              <p className="mt-2 text-xs text-amber-700">
                Consultez votre boîte de
                réception et vos courriers
                indésirables.
              </p>
            )}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700"
          >
            {error}
          </div>
        )}

        <div className="space-y-4">
          <GoogleAuthButton
            onCredential={
              handleGoogleCredential
            }
            disabled={isLoading}
          />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>

            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                ou continuer avec
              </span>
            </div>
          </div>

          <LoginForm
            onSubmit={handleSubmit}
            loading={isLoading}
          />
        </div>

        <div className="text-center text-sm">
          <p>
            Vous n&apos;avez pas de
            compte ?{" "}
            <Link
              href="/auth/signup"
              className="font-medium text-primary hover:underline"
            >
              Créer un compte
            </Link>
          </p>
        </div>

        <div className="text-center">
          <Link
            href="/auth/forgot-password"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Mot de passe oublié ?
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}

function LoginLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="space-y-4 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />

        <p className="text-sm text-muted-foreground">
          Chargement de la connexion...
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={<LoginLoading />}
    >
      <LoginContent />
    </Suspense>
  );
}