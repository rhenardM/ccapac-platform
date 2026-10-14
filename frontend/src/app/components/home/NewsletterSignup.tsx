"use client";

import { useState } from "react";
import { Mail, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * Bande d'inscription à la newsletter (affichée en haut du footer).
 * Envoie l'inscription au backend via /api/newsletter/subscribe.
 */
export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: name.trim() || undefined }),
      });

      if (res.ok) {
        toast.success("Merci ! Votre inscription à la newsletter est confirmée.");
        setEmail("");
        setName("");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error ?? "Inscription impossible pour le moment.");
      }
    } catch {
      toast.error("Erreur réseau. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="bg-secondary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Texte */}
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/90">
              <Mail className="h-3.5 w-3.5" />
              Newsletter
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold leading-tight">
              Restez informé du Grand Tambour
            </h3>
            <p className="text-sm sm:text-base leading-relaxed text-white/80 max-w-md">
              Actualités, événements et éditions de la newsletter — directement
              dans votre boîte mail. Pas de spam, désinscription à tout moment.
            </p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="w-full">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Votre nom (optionnel)"
                aria-label="Votre nom"
                className="h-11 bg-white text-foreground border-transparent placeholder:text-muted-foreground sm:flex-1"
                disabled={loading}
              />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Votre adresse e-mail"
                aria-label="Votre adresse e-mail"
                required
                className="h-11 bg-white text-foreground border-transparent placeholder:text-muted-foreground sm:flex-1"
                disabled={loading}
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="mt-3 h-11 w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Inscription…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  S&apos;inscrire
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
