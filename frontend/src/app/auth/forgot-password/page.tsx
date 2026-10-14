"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { AuthLayout } from "@/app/components/auth/AuthLayout";
import ForgotPasswordForm, {
  type ForgotPasswordFormValues,
} from "@/app/components/auth/ForgotPasswordForm";
import { forgotPassword } from "@/services/auth";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle } from "lucide-react";


export default function ForgotPasswordPage() {
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: ForgotPasswordFormValues) => {
    setLoading(true);
    try {
      const response = await forgotPassword(values.email);
      if (response.success) {
        setSentEmail(values.email);
        setEmailSent(true);
        toast.success("Email de réinitialisation envoyé !");
      } else {
        toast.error(response.message || "Une erreur est survenue");
      }
    } catch (error) {
      toast.error("Erreur lors de l'envoi de l'email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Mot de passe oublié">
      <div className="space-y-6">
        {!emailSent ? (
          <>
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Mot de passe oublié ?
              </h1>
              <p className="text-sm text-muted-foreground">
                Entrez votre adresse email et nous vous enverrons un lien pour
                réinitialiser votre mot de passe.
              </p>
            </div>

            <div className="space-y-4">
              <ForgotPasswordForm onSubmit={handleSubmit} loading={loading} />
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
          </>
        ) : (
          <>
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Email envoyé !
              </h1>
              <p className="text-sm text-muted-foreground">
                Nous avons envoyé un lien de réinitialisation à{" "}
                <strong className="text-foreground">{sentEmail}</strong>
              </p>
            </div>

            <div className="bg-muted/50 border border-muted rounded-lg p-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong>Prochaines étapes :</strong>
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                <li>Vérifiez votre boîte de réception</li>
                <li>Cliquez sur le lien dans l&apos;email</li>
                <li>Créez un nouveau mot de passe</li>
              </ul>
              <p className="text-xs text-muted-foreground/70 pt-2">
                Si vous ne recevez pas l&apos;email, vérifiez vos spams ou{" "}
                <button
                  onClick={() => setEmailSent(false)}
                  className="text-primary hover:underline font-medium"
                >
                  essayez avec une autre adresse
                </button>
                .
              </p>
            </div>

            <div className="text-center">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour à la connexion
              </Link>
            </div>
          </>
        )}
      </div>
    </AuthLayout>
  );
}