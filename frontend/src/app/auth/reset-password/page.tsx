"use client";

import type React from "react";
import { useState } from "react"; 
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { AuthLayout } from "@/app/components/auth/AuthLayout";
import ResetPasswordForm, {
  type ResetPasswordFormValues,
} from "@/app/components/auth/ResetPasswordForm";
import { resetPassword } from "@/services/auth";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { isAxiosError } from "axios";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const error = searchParams.get("error");
  const [loading, setLoading] = useState(false);

  if (error === "INVALID_TOKEN" || !token) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Lien invalide ou expiré
          </h1>
          <p className="text-sm text-muted-foreground">
            Ce lien de réinitialisation n&apos;est plus valide. Il a peut-être
            expiré ou a déjà été utilisé.
          </p>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <p className="text-sm text-orange-800 dark:text-orange-200">
            📧 Vous pouvez demander un nouveau lien de réinitialisation.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/auth/forgot-password"
            className="w-full inline-flex items-center justify-center gap-2 h-11 bg-primary text-primary-foreground rounded-md font-semibold hover:bg-primary/90 transition-colors"
          >
            Demander un nouveau lien
          </Link>
          <Link
            href="/auth/login"
            className="text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (values: ResetPasswordFormValues) => {
    setLoading(true);
    try {
      const response = await resetPassword(token, values.newPassword);
      if (response.success) {
        toast.success("Mot de passe réinitialisé avec succès !");
        router.push("/auth/login");
      } else {
        toast.error(response.message || "Une erreur est survenue");
      }
    } catch (error: unknown) {
      const message =
        isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : error instanceof Error
          ? error.message
          : "Erreur lors de la réinitialisation";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Créer un nouveau mot de passe
        </h1>
        <p className="text-sm text-muted-foreground">
          Choisissez un mot de passe sécurisé pour votre compte.
        </p>
      </div>

      <div className="space-y-4">
        <ResetPasswordForm onSubmit={handleSubmit} loading={loading} />
      </div>

      <div className="bg-muted/50 border border-muted rounded-lg p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Conseils pour un mot de passe sécurisé :</strong>
        </p>
        <ul className="text-xs text-muted-foreground/80 space-y-1 mt-2 ml-4 list-disc">
          <li>Au moins 8 caractères</li>
          <li>Mélangez lettres, chiffres et symboles</li>
          <li>Évitez les informations personnelles</li>
        </ul>
      </div>

      <div className="text-center">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Retour à la connexion
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout title="Réinitialiser le mot de passe">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }
      >
        <ResetPasswordContent />
      </Suspense>
    </AuthLayout>
  );
}