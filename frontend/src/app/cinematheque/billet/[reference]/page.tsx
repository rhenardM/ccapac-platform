import type { Metadata } from "next";
import MainLayout from "@/app/components/layouts/MainLayout";
import TicketConfirmationClient from "./TicketConfirmationClient";

export const metadata: Metadata = {
  title: "Votre billet — Cinémathèque CCAPAC",
  description: "Consultez et téléchargez votre billet numérique de séance.",
  robots: { index: false, follow: false },
};

interface TicketConfirmationPageProps {
  params: Promise<{ reference: string }>;
}

export default async function TicketConfirmationPage({
  params,
}: TicketConfirmationPageProps) {
  const { reference } = await params;

  return (
    <MainLayout>
      <main className="min-h-[calc(100vh-96px)] bg-[#f4efe4] px-4 py-10 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <TicketConfirmationClient reference={reference} />
      </main>
    </MainLayout>
  );
}
