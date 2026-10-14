import type { Metadata } from "next";
import MainLayout from "../../components/layouts/MainLayout";
import DonationThankYou from "../../components/don/DonationThankYou";

export const metadata: Metadata = {
  title: "Merci pour votre don — CCAPAC",
  description:
    "Confirmation de votre don au profit de la Biblio-Librairie du Grand Tambour.",
  robots: { index: false, follow: false },
};

export default function DonThankYouPage() {
  return (
    <MainLayout>
      <main className="min-h-[calc(100vh-96px)] bg-[#f4efe4] px-4 py-10 text-primary sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <DonationThankYou />
      </main>
    </MainLayout>
  );
}
