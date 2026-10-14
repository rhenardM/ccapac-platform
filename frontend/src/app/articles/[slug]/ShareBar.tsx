"use client";

import { useEffect, useState } from "react";
import {
  FaFacebookF,
  FaXTwitter,
  FaLinkedinIn,
  FaWhatsapp,
} from "react-icons/fa6";
import { Link2, Check, Share2 } from "lucide-react";

/**
 * Barre de partage social professionnelle pour la page article :
 * Facebook, X, LinkedIn, WhatsApp, copie du lien + partage natif (mobile).
 */
export default function ShareBar({ title }: { title: string }) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setUrl(window.location.href);
    setCanNativeShare(
      typeof navigator !== "undefined" && typeof navigator.share === "function"
    );
  }, []);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const links = [
    {
      label: "Partager sur Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: FaFacebookF,
    },
    {
      label: "Partager sur X",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      icon: FaXTwitter,
    },
    {
      label: "Partager sur LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: FaLinkedinIn,
    },
    {
      label: "Partager sur WhatsApp",
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      icon: FaWhatsapp,
    },
  ];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title, url });
    } catch {
      /* annulé */
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <span className="mr-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        Partager
      </span>

      {links.map(({ label, href, icon: Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          title={label}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-foreground shadow-sm ring-1 ring-muted/20 transition hover:-translate-y-0.5 hover:bg-primary hover:text-white hover:ring-primary"
        >
          <Icon className="h-4 w-4" />
        </a>
      ))}

      <button
        type="button"
        onClick={copyLink}
        aria-label="Copier le lien"
        title="Copier le lien"
        className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-xs font-semibold text-foreground shadow-sm ring-1 ring-muted/20 transition hover:-translate-y-0.5 hover:bg-primary hover:text-white hover:ring-primary"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" />
            Lien copié
          </>
        ) : (
          <>
            <Link2 className="h-4 w-4" />
            Copier le lien
          </>
        )}
      </button>

      {canNativeShare && (
        <button
          type="button"
          onClick={nativeShare}
          aria-label="Partager"
          title="Partager"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-foreground shadow-sm ring-1 ring-muted/20 transition hover:-translate-y-0.5 hover:bg-primary hover:text-white hover:ring-primary sm:hidden"
        >
          <Share2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
