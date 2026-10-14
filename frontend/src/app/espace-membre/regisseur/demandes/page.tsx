"use client";

import Link from "next/link";
import { ClipboardCheck } from "lucide-react";

export default function RegisseurDemandesPage() {
  return (
    <main className="space-y-6 p-6">
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <ClipboardCheck className="mt-1 h-8 w-8 text-primary" />

          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Demandes du Régisseur général
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Consultez les demandes transmises au Régisseur général depuis le
              tableau de bord.
            </p>
          </div>
        </div>
      </section>

      <Link
        href="/espace-membre"
        className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
      >
        Retour au tableau de bord
      </Link>
    </main>
  );
}
