"use client";

import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * Rappel d'inscription à la newsletter en pied de page d'agenda. Poste sur le
 * même endpoint que la bande du footer (`/api/newsletter/subscribe`).
 */
export default function EventsNewsletterBand() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (response.ok) {
        toast.success("Merci ! Votre inscription à la newsletter est confirmée.");
        setEmail("");
      } else {
        const data = await response.json().catch(() => ({}));
        toast.error(data?.error ?? "Inscription impossible pour le moment.");
      }
    } catch {
      toast.error("Erreur réseau. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="bg-white px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-background p-6 shadow-sm sm:p-8 lg:p-10">
          {/* Halo décoratif, repris du motif chaleureux de la charte */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-20 -right-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
          />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
            <div className="flex items-start gap-4 sm:gap-5">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-white text-primary shadow-sm">
                <Mail className="h-6 w-6" />
              </span>
              <div className="space-y-1.5">
                <h2 className="text-xl font-semibold leading-tight text-foreground sm:text-2xl">
                  Ne manquez aucun événement !
                </h2>
                <p className="max-w-md text-xs font-light leading-relaxed text-muted-foreground sm:text-sm">
                  Abonnez-vous à notre newsletter et recevez chaque semaine la
                  sélection des meilleurs événements.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:shrink-0"
            >
              <Input
                type="email"
                value={email}
                onChange={(inputEvent) => setEmail(inputEvent.target.value)}
                placeholder="Votre adresse e-mail"
                aria-label="Votre adresse e-mail"
                required
                disabled={loading}
                className="h-11 w-full border-muted/60 bg-white text-foreground placeholder:text-muted-foreground sm:w-72"
              />
              <Button
                type="submit"
                disabled={loading}
                className="h-11 shrink-0 px-6 text-sm font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Envoi…
                  </>
                ) : (
                  "S’abonner"
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
