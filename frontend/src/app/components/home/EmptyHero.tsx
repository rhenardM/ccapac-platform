"use client";

interface EmptyHeroProps {
  title?: string;
  message?: string;
}

export default function EmptyHero({
  title = "Aucun événement phare disponible",
  message = "Revenez bientôt pour découvrir nos prochains événements !",
}: EmptyHeroProps) {
  return (
    <section className="relative w-full h-screen min-h-[600px] sm:min-h-[700px] lg:min-h-screen overflow-hidden bg-gradient-to-br from-muted/20 via-muted/10 to-muted/5 flex items-center justify-center">
      <div className="text-center max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-white to-muted/10 rounded-2xl p-8 sm:p-12 shadow-lg border border-muted/20">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4 sm:mb-6 drop-shadow-sm">
            {title}
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg lg:text-xl leading-relaxed">
            {message}
          </p>
        </div>
      </div>
    </section>
  );
}
