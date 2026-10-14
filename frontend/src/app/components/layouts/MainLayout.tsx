import type React from "react";
import Header from "../home/header";
import Footer from "../home/footer";
import WhatsAppButton from "../home/WhatsAppButton";

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout wrapper Server Component qui combine Header et Footer
 * Utilisé par toutes les pages publiques qui ont besoin de ces deux composants
 */
export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      {children}
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
