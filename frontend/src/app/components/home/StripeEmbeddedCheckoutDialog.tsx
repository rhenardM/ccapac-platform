"use client";

import { useMemo } from "react";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type StripeEmbeddedCheckout = {
  donationId: string;
  publishableKey: string;
  clientSecret: string;
};

export function StripeEmbeddedCheckoutDialog({
  checkout,
  open,
  onOpenChange,
}: {
  checkout: StripeEmbeddedCheckout | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const stripePromise = useMemo(
    () => (checkout ? loadStripe(checkout.publishableKey) : null),
    [checkout]
  );

  if (!checkout || !stripePromise) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] max-w-[720px] overflow-y-auto p-0">
        <div className="border-b border-[#eadcc7] bg-primary px-6 py-5 text-white">
          <DialogHeader className="text-left">
            <DialogTitle className="text-xl font-bold uppercase">
              Paiement par carte bancaire
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-white/72">
              Finalisez votre contribution en toute sécurité.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="bg-white p-4 sm:p-6">
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{ clientSecret: checkout.clientSecret }}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </DialogContent>
    </Dialog>
  );
}
