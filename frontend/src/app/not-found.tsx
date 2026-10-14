import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* 404 Number */}
        <div className="space-y-4">
          <h1 className="text-8xl font-bold text-primary tracking-tight">
            404
          </h1>
          <div className="w-24 h-1 bg-secondary mx-auto rounded-full"></div>
        </div>

        {/* Error Message */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">
            Page non trouvée
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Désolé, la page que vous recherchez n&apos;existe pas ou a été
            déplacée. Veuillez vérifier l&apos;URL ou retourner à
            l&apos;accueil.
          </p>
        </div>

        {/* Navigation Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-accent cursor-pointer text-black  py-4 px-2 font-bold hover:bg-accent/90 transition-colors items-center gap-2 text-lg">
            <Link href="/">Retour à l&apos;accueil</Link>
          </button>
          {/* <button>
            <Link href="/contact">Nous contacter</Link>
          </button> */}
        </div>
      </div>
    </div>
  );
}
