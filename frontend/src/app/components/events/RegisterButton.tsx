"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "../ui/button";
import EventRegistrationModal from "./EventRegistrationModal";
import {
  registerEventAction,
  checkEventRegistration,
} from "@/app/evenement/[slug]/actions";
import { toast } from "sonner";
import { FaCircleCheck, FaClock } from "react-icons/fa6";

interface RegisterButtonProps {
  eventId: string;
  eventTitle: string;
  eventSlug: string;
  isRegistrationOpen: boolean;
  user: {
    id: string;
    emailVerified: boolean;
  } | null;
}

export default function RegisterButton({
  eventId,
  eventTitle,
  eventSlug,
  isRegistrationOpen,
  user,
}: RegisterButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<string | null>(
    null
  );
  const router = useRouter();
  const searchParams = useSearchParams();

  // Vérifier si l'utilisateur est déjà inscrit
  useEffect(() => {
    if (user && isRegistrationOpen) {
      checkEventRegistration(eventId).then((result) => {
        setIsRegistered(result.isRegistered);
        setRegistrationStatus(result.status || null);
      });
    }
  }, [user, eventId, isRegistrationOpen]);

  // Vérifier l'inscription après une redirection depuis le callback Google
  useEffect(() => {
    const registered = searchParams.get("registered");
    if (registered === "true" && user && isRegistrationOpen) {
      // Re-vérifier l'inscription pour mettre à jour l'état du bouton
      checkEventRegistration(eventId).then((result) => {
        setIsRegistered(result.isRegistered);
        setRegistrationStatus(result.status || null);
      });
    }
  }, [searchParams, user, eventId, isRegistrationOpen]);

  const handleDirectRegister = async () => {
    if (!user) {
      setIsModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await registerEventAction(eventId);

      if (result.success) {
        toast.success(result.message || "Vous êtes inscrit à cet événement !");
        setIsRegistered(true);
        setRegistrationStatus("PENDING");
      } else {
        if (result.redirectTo) {
          router.push(result.redirectTo);
          return;
        }
        toast.error(result.error || "Erreur lors de l'inscription");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue lors de l'inscription"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isRegistrationOpen) {
    return null;
  }

  // Si l'utilisateur est connecté mais email non vérifié
  if (user && !user.emailVerified) {
    return (
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 max-w-[calc(100vw-2rem)] sm:max-w-sm">
        <div className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 sm:p-4 shadow-lg">
          <div className="flex items-start gap-2 sm:gap-3">
            <FaClock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-amber-900 dark:text-amber-100">
                Email non vérifié
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                Veuillez vérifier votre adresse email avant de vous inscrire.
                Consultez votre boîte de réception pour le lien de vérification.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si l'utilisateur est déjà inscrit
  if (isRegistered) {
    return (
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
        <Button
          size="lg"
          disabled
          className="h-12 sm:h-14 px-4 sm:px-6 cursor-not-allowed shadow-2xl bg-green-500 hover:bg-green-500 text-white"
        >
          <FaCircleCheck className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
          <span className="text-sm sm:text-lg font-bold whitespace-nowrap">
            {registrationStatus === "CONFIRMED"
              ? "Inscription confirmée"
              : "Déjà inscrit"}
          </span>
        </Button>
      </div>
    );
  }

  // Bouton d'inscription
  return (
    <>
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
        <Button
          size="lg"
          onClick={handleDirectRegister}
          disabled={isSubmitting}
          className="h-12 sm:h-14 px-4 sm:px-6 cursor-pointer shadow-2xl bg-accent hover:bg-accent/90 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-black text-sm sm:text-lg font-bold whitespace-nowrap">
            {isSubmitting ? "Inscription..." : "S'inscrire"}
          </span>
        </Button>
      </div>

      <EventRegistrationModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        eventTitle={eventTitle}
        eventSlug={eventSlug}
        eventId={eventId}
      />
    </>
  );
}
