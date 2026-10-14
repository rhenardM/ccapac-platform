"use client";

import { useEffect, useState } from "react";
import { Loader2, ShieldCheck, Smartphone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function OtpDialog({
  open,
  isConfirming,
  error,
  onSubmit,
  onClose,
}: {
  open: boolean;
  isConfirming: boolean;
  error: string;
  onSubmit: (code: string) => void;
  onClose: () => void;
}) {
  const [code, setCode] = useState("");

  // Réinitialise le champ à chaque ouverture.
  useEffect(() => {
    if (open) setCode("");
  }, [open]);

  const canSubmit = /^\d{4,8}$/.test(code) && !isConfirming;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !isConfirming) onClose();
      }}
    >
      <DialogContent
        showCloseButton
        className="w-[calc(100vw-1.5rem)] max-w-[480px] overflow-hidden p-0"
      >
        <div className="bg-primary px-5 py-5 text-white sm:px-6">
          <DialogHeader className="text-left">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold uppercase leading-tight sm:text-xl">
              <Smartphone className="h-5 w-5 text-[#ffcc02]" />
              Confirmation requise
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-white/72">
              Un code de confirmation a été envoyé sur votre téléphone.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form
          className="space-y-5 p-5 sm:p-6"
          onSubmit={(event) => {
            event.preventDefault();
            if (canSubmit) onSubmit(code);
          }}
        >
          <div className="rounded-md border border-secondary/20 bg-[#f8f1e7] p-4">
            <p className="text-sm font-semibold leading-relaxed text-primary">
              Saisissez le code reçu par SMS pour valider votre don. Ne fermez
              pas cette fenêtre avant la confirmation.
            </p>
          </div>

          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-secondary">
              Code de confirmation
            </span>
            <input
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, "").slice(0, 8))
              }
              placeholder="• • • • • •"
              className="h-14 w-full rounded-md border border-[#eadcc7] bg-[#fdfbf6] px-4 text-center text-2xl font-bold tracking-[0.5em] text-primary outline-none transition focus:border-primary focus:bg-white"
            />
          </label>

          {error && (
            <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={isConfirming}
              onClick={onClose}
              className="inline-flex flex-1 items-center justify-center rounded-md border border-secondary/35 bg-white px-5 py-3 text-xs font-bold uppercase tracking-wide text-primary transition hover:bg-[#f8f1e7] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isConfirming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              {isConfirming ? "Confirmation..." : "Confirmer le don"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
