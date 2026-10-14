"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaCheck } from "react-icons/fa6";
import { toast } from "sonner";

import { createEventRegistrationAction } from "@/app/evenement/[slug]/actions";
import SignupForm, {
  type SignupFormValues,
} from "@/app/components/auth/SignupForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { signUp } from "@/lib/auth-client";

interface EventRegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventTitle: string;
  eventSlug: string;
  eventId: string;
}

type ModalStep =
  | "info"
  | "signup"
  | "success";

export default function EventRegistrationModal({
  open,
  onOpenChange,
  eventTitle,
  eventSlug,
  eventId,
}: EventRegistrationModalProps) {
  const [step, setStep] =
    useState<ModalStep>("info");

  const router = useRouter();

  const handleClose = () => {
    setStep("info");
    onOpenChange(false);
  };

  const handleSignup = async (
    values: SignupFormValues
  ) => {
    try {
      const registrationResponse =
        await signUp({
          email: values.email,
          password: values.password,
          first_name: values.firstName,
          last_name: values.lastName,
          phone: values.phone,
        });

      if (!registrationResponse.success) {
        toast.error(
          registrationResponse.message ||
            "Impossible de créer le compte"
        );

        return;
      }

      const eventRegistration =
        await createEventRegistrationAction(
          eventId,
          values.email,
          values.phone
        );

      if (!eventRegistration.success) {
        toast.error(
          eventRegistration.error ||
            "Erreur lors de l'inscription à l'événement"
        );

        return;
      }

      toast.success(
        registrationResponse.message ||
          "Compte créé avec succès"
      );

      setStep("success");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Une erreur est survenue pendant l'inscription";

      console.error(
        "[EventRegistrationModal] Erreur d'inscription :",
        error
      );

      toast.error(message);
    }
  };

  const handleLoginClick = () => {
    onOpenChange(false);

    router.push(
      `/auth/login?redirect=${encodeURIComponent(
        `/evenement/${eventSlug}`
      )}`
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleClose}
    >
      <DialogContent
        className="max-w-md w-full p-6 sm:p-8 rounded-lg bg-background border-muted/20 shadow-xl"
        showCloseButton
      >
        {step === "info" && (
          <div className="space-y-6 text-center">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
                Rejoignez l&apos;événement
              </DialogTitle>

              <p className="text-sm text-muted-foreground leading-relaxed">
                Vous êtes sur le point de vous
                inscrire à
                <br />

                <span className="font-medium text-foreground">
                  {eventTitle}
                </span>
              </p>
            </DialogHeader>

            <div className="space-y-3 pt-2">
              <Button
                type="button"
                onClick={() =>
                  setStep("signup")
                }
                className="w-full cursor-pointer h-11 text-base font-medium"
              >
                Créer un compte pour
                m&apos;inscrire
              </Button>

              <div className="relative text-center">
                <div className="absolute inset-0 top-1/2 border-t border-border" />

                <span className="relative bg-background px-2 text-xs text-muted-foreground uppercase">
                  ou
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleLoginClick}
                className="w-full cursor-pointer h-11 text-base font-medium border-muted/40 hover:bg-muted/10 hover:text-foreground"
              >
                J&apos;ai déjà un compte
              </Button>
            </div>

            <p className="text-xs text-muted-foreground/60 max-w-xs mx-auto pt-2">
              L&apos;inscription est gratuite et
              vous donne accès à d&apos;autres
              avantages exclusifs.
            </p>
          </div>
        )}

        {step === "signup" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-border/40 pb-4 mb-2">
              <button
                type="button"
                onClick={() =>
                  setStep("info")
                }
                className="p-1 cursor-pointer -ml-1 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted/10"
                aria-label="Retour"
              >
                <FaArrowLeft className="w-4 h-4" />
              </button>

              <h2 className="text-lg font-semibold text-foreground">
                Créer un compte
              </h2>
            </div>

            <SignupForm
              onSubmit={handleSignup}
            />
          </div>
        )}

        {step === "success" && (
          <div className="text-center py-8 space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/10 text-green-600 dark:text-green-400 mb-2">
              <FaCheck className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">
                Inscription enregistrée !
              </h2>

              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Votre demande d&apos;inscription
                pour{" "}
                <strong>{eventTitle}</strong> a
                été enregistrée.
              </p>
            </div>

            <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground">
              Un email de confirmation a été
              envoyé à votre adresse. Cliquez sur
              le lien reçu pour activer votre
              compte.
            </div>

            <Button
              type="button"
              onClick={handleClose}
              className="w-full h-11"
            >
              Terminer
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}