"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, X } from "lucide-react";
import { MemberButton } from "./header/MemberButton";
import { SOCIAL_LINKS } from "@/lib/header/constants";
import { menuItems } from "@/lib/header";
import type { AuthServerUser as User } from "@/lib/auth-server";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export default function MobileMenu({ isOpen, onClose, user }: MobileMenuProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  const handleLinkClick = () => {
    setOpenDropdown(null);
    onClose();
  };

  return (
    <>
      <button
        type="button"
        aria-label="Fermer le menu"
        className={`fixed inset-0 z-40 bg-black/65 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      <aside
        aria-hidden={!isOpen}
        className={`fixed inset-y-0 right-0 z-50 flex w-[88vw] max-w-[360px] flex-col border-l border-black/5 bg-[#f7f3eb] shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex min-h-20 items-center justify-between bg-primary px-5 text-white">
          <Link
            href="/"
            onClick={handleLinkClick}
            className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Image
              src="/logo-grand-tambour.png"
              alt="Grand Tambour"
              width={120}
              height={70}
              className="h-14 w-auto"
            />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:bg-white/10"
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const isDropdownOpen = openDropdown === item.title;

              if (item.submenu) {
                return (
                  <div key={item.title}>
                    <button
                      type="button"
                      aria-expanded={isDropdownOpen}
                      className={`flex min-h-12 w-full items-center justify-between rounded-xl px-4 text-left text-sm font-bold uppercase transition-colors ${
                        isDropdownOpen
                          ? "bg-primary text-white"
                          : "text-primary hover:bg-primary/10"
                      }`}
                      onClick={() =>
                        setOpenDropdown(isDropdownOpen ? null : item.title)
                      }
                    >
                      <span>{item.title}</span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          isDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    <div
                      className={`grid transition-all duration-300 ${
                        isDropdownOpen
                          ? "grid-rows-[1fr] opacity-100"
                          : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="ml-4 mt-1.5 space-y-1 border-l-2 border-accent pl-3">
                          {item.submenu.map((subItem) => (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              onClick={handleLinkClick}
                              className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-primary/75 transition-colors hover:bg-white hover:text-primary"
                            >
                              {subItem.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleLinkClick}
                  className="flex min-h-12 items-center rounded-xl px-4 text-sm font-bold uppercase text-primary transition-colors hover:bg-primary/10"
                >
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-primary/10 bg-white px-4 pb-5 pt-4">
          <MemberButton user={user} fullWidth />
          <div className="mt-4 flex items-center justify-center gap-2">
            {SOCIAL_LINKS.map(({ href, icon: Icon, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/8 text-primary transition-colors hover:bg-primary hover:text-white"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
