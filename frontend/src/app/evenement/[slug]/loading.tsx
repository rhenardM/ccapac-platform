import Header from "@/app/components/home/header";
import Footer from "@/app/components/home/footer";

export default function EventDetailLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/5 to-background">
      <Header />
      <div className="flex items-center justify-center min-h-[60vh] mt-28">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">
            Chargement de l&apos;événement...
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
