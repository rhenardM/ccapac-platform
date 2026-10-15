import {
  FaFacebook,
  FaInstagram,
  FaYoutube,
  FaTiktok,
  FaLinkedinIn,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import type { MenuItem, SocialLink } from "./types";

export const menuItems: MenuItem[] = [
  {
    title: "Grand Tambour",
    href: "/grand-tambour",
    submenu: [
      { name: "Présentation", href: "/grand-tambour/presentation" },
      { name: "Espaces", href: "/grand-tambour/espaces" },
      { name: "Mukishi Wa Pwo", href: "/grand-tambour/cafeteria" },
      // Temporairement masque pendant la restructuration de l'organigramme.
      // {
      //   name: "Équipe & Gouvernance",
      //   href: "/grand-tambour/equipe-gouvernance",
      // },
    ],
  },
  {
    title: "Action Culturelle",
    href: "/programmes",
  },
  {
    title: "Agenda",
    href: "/agenda",
  },
  {
    title: "Actualités",
    href: "/actualites",
  },
  {
    title: "Galeries",
    href: "/media",
  },
  {
    title: "Infos pratiques",
    href: "/infos",
  },
];

export const SOCIAL_LINKS: SocialLink[] = [
  {
    href: "https://web.facebook.com/grandtambour",
    icon: FaFacebook,
    label: "Facebook",
  },
  {
    href: "https://www.linkedin.com/company/grandtambour/",
    icon: FaLinkedinIn,
    label: "LinkedIn",
  },
  {
    href: "https://x.com/grandtambour",
    icon: FaXTwitter,
    label: "Twitter",
  },
  {
    href: "https://www.instagram.com/grandtambour",
    icon: FaInstagram,
    label: "Instagram",
  },
  {
    href: "https://www.youtube.com/@CCAPAC-GrandTambour",
    icon: FaYoutube,
    label: "YouTube",
  },
  {
    href: "https://www.tiktok.com/@grandtambour",
    icon: FaTiktok,
    label: "Tiktok",
  },
];
