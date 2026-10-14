import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock } from "react-icons/fa";
import { SOCIAL_LINKS } from "@/lib/header/constants";
import Image from "next/image";
import Link from "next/link";
import NewsletterSignup from "./NewsletterSignup";

export default function Footer() {
  const navigation = [
    { label: "Accueil", href: "/" },
    { label: "Action culturelle", href: "/programmes" },
    { label: "Agenda", href: "/agenda" },
    { label: "Actualités", href: "/actualites" },
    { label: "Médiathèque", href: "/media" },
    { label: "Infos pratiques", href: "/infos" },
  ];

  const programmes = [
    {
      label: "Arts",
      href: "/programmes/musique-arts-vivants",
    },
    {
      label: "Dramathèque ",
      href: "/programmes/theatre-arts-scene",
    },
    { label: "Cinémathèque", href: "/cinematheque" },
    { label: "Biblio Librairie", href: "/programmes/litterature-pensee" },
    {
      label: "Patrimoine & Traditions",
      href: "/programmes/patrimoine-traditions",
    },
    { label: "Événements externes", href: "/evenements-externes" },
  ];

  return (
    <footer className="bg-primary border-t border-white/5">
      <NewsletterSignup />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-8">
          {/* Brand Column */}
          <div className="space-y-4 sm:space-y-6">
            <Link href="/" className="inline-block">
              <div className="relative h-10 sm:h-12 w-auto items-center flex">
                <Image
                  src="/logo-grand-tambour.png"
                  alt="CCAPAC Logo"
                  width={180}
                  height={60}
                  className="h-24 sm:h-24 md:h-24 lg:h-24 xl:h-24 w-auto object-contain brightness-0 invert opacity-90"
                />
              </div>
            </Link>
            <p className="text-xs sm:text-sm leading-relaxed text-white">
              Le Centre Culturel et Artistique pour les Pays d&apos;Afrique
              Centrale.
            </p>
            <div className="flex gap-3 sm:gap-4">
              {SOCIAL_LINKS.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white hover:text-white transition-all duration-300"
                  aria-label={social.label}
                >
                  <social.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Link>
              ))}
            </div>
          </div>

          {/* Navigation Column */}
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider mb-4 sm:mb-6">
              Navigation
            </h4>
            <ul className="space-y-2.5 sm:space-y-3">
              {navigation.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-xs sm:text-sm hover:text-white cursor-pointer text-white/80 transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Programmes Column */}
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider mb-4 sm:mb-6">
              Programmes
            </h4>
            <ul className="space-y-2.5 sm:space-y-3">
              {programmes.map((program) => (
                <li key={program.label}>
                  <Link
                    href={program.href}
                    className="text-xs sm:text-sm hover:text-white cursor-pointer text-white/80 transition-colors duration-200"
                  >
                    {program.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider mb-4 sm:mb-6">
              Contact
            </h4>
            <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm">
              <div className="flex gap-2.5 sm:gap-3">
                <FaMapMarkerAlt className="w-4 h-4 sm:w-5 sm:h-5 text-white flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed text-white/90">
                  Boulevard Triomphal
                  <br />
                  Kinshasa, RDC
                </span>
              </div>
              <div className="flex gap-2.5 sm:gap-3 items-center">
                <FaPhone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white flex-shrink-0" />
                <span className="text-white/90">+243 890 809 746</span>
              </div>
              <div className="flex gap-2.5 sm:gap-3 items-center">
                <FaEnvelope className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white flex-shrink-0" />
                <span className="break-all text-white/90">
                  info@centreculturel.cd
                </span>
              </div>
              <div className="flex gap-2.5 sm:gap-3 items-start">
                <FaClock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-white/90">Lun-Ven: 8h-16h</p>
                  <p className="text-white/90">Sam: 9h-16h</p>
                  <p className="text-white/90">Dim: 14h-18h</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/5 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white">
            <p>© {new Date().getFullYear()} CCAPAC. Tous droits réservés.</p>

            <div className="flex items-center gap-6">
              <Link
                href="#"
                className="hover:text-white transition-colors"
              >
                Politique de confidentialité
              </Link>
              <Link
                href="#"
                className="hover:text-white transition-colors"
              >
                Mentions légales
              </Link>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-white">Développé par</span>
              <a
                href=""
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-white hover:text-white transition-colors"
              >
                CCAPAC Dev Team
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
