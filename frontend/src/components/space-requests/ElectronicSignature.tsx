"use client";

import { useState } from "react";
import { CheckCircle2, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ElectronicSignatureProps {
  loading?: boolean;
  onConfirm: (
    signature: string
  ) => Promise<void>;
}

export default function ElectronicSignature({
  loading = false,
  onConfirm,
}: ElectronicSignatureProps) {
  const [signature, setSignature] =
    useState("");
  const [accepted, setAccepted] =
    useState(false);

  const canSubmit =
    signature.trim().length >= 3 &&
    accepted &&
    !loading;

  const handleConfirm = async () => {
    if (!canSubmit) {
      return;
    }

    const signatureData = JSON.stringify({
      value: signature.trim(),
      acceptedAt: new Date().toISOString(),
      method: "TYPED_NAME",
    });

    await onConfirm(signatureData);
  };

  return (
    <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-5">
      <div className="flex items-start gap-3">
        <PenLine className="mt-1 h-5 w-5 text-primary" />

        <div>
          <h3 className="font-semibold">
            Signature électronique
          </h3>

          <p className="text-sm text-muted-foreground">
            Saisissez votre nom complet pour signer
            et transmettre cette demande.
          </p>
        </div>
      </div>

      <Input
        value={signature}
        onChange={(event) =>
          setSignature(event.target.value)
        }
        placeholder="Votre nom complet"
        disabled={loading}
      />

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(event) =>
            setAccepted(event.target.checked)
          }
          className="mt-1"
          disabled={loading}
        />

        <span>
          Je certifie l’exactitude des informations
          fournies et accepte que cette saisie constitue
          ma signature électronique.
        </span>
      </label>

      <Button
        type="button"
        onClick={handleConfirm}
        disabled={!canSubmit}
        className="w-full"
      >
        <CheckCircle2 className="mr-2 h-4 w-4" />

        {loading
          ? "Transmission..."
          : "Signer et transmettre"}
      </Button>
    </div>
  );
}