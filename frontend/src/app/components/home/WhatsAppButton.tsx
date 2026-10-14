import { FaWhatsapp } from "react-icons/fa";

const WHATSAPP_URL = "https://whatsapp.com/channel/0029Vb6JXHzHVvTYT2Wufu1I";

export default function WhatsAppButton() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition-all duration-300 hover:scale-110 hover:bg-[#1ebe5d] focus:outline-none focus:ring-4 focus:ring-[#25D366]/35 sm:bottom-6 sm:right-6 sm:h-16 sm:w-16"
      aria-label="Démarrer une discussion WhatsApp avec le CCAPAC"
    >
      <FaWhatsapp className="h-8 w-8 sm:h-9 sm:w-9" aria-hidden="true" />
    </a>
  );
}
