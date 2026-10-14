"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cancelEventRegistrationAction } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface CancelRegistrationButtonProps {
  registrationId: string;
}

export default function CancelRegistrationButton({
  registrationId,
}: CancelRegistrationButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleCancel = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("registrationId", registrationId);
      const result = await cancelEventRegistrationAction(formData);

      if (result.success) {
        toast.success("Inscription annulée avec succès");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de l'annulation");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Une erreur est survenue lors de l'annulation");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive cursor-pointer hover:text-destructive hover:bg-destructive/10 border-destructive/20"
        >
          Annuler l&apos;inscription
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action annulera votre inscription à cet événement. Vous devrez
            vous réinscrire si vous changez d&apos;avis.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Retour</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            disabled={isSubmitting}
            className="bg-destructive text-white cursor-pointer hover:bg-destructive/90"
          >
            {isSubmitting ? "Annulation..." : "Confirmer l'annulation"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
