import MainLayout from "../components/layouts/MainLayout";
import DonationVerifier from "./DonationVerifier";

export default function DonationThankYouPage() {
  return (
    <MainLayout>

      <main className="min-h-[calc(100vh-96px)] bg-[#f4efe4] px-4 py-10 text-primary sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <DonationVerifier />
      </main>
      
    </MainLayout>
  );
}
