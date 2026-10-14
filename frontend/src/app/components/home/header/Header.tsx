"use client";

import { useState } from "react";
// import { FaTimes } from "react-icons/fa";
import MobileMenu from "../mobile-menu";
import { SocialBar, Logo, DesktopNavigation, HeaderActions } from "./index";
import { useScrollDetection } from "@/hooks/useScrollDetection";
import { useDropdown } from "@/hooks/useDropdown";
import { useActiveMenuItem } from "@/hooks/useActiveMenuItem";
import type { AuthServerUser as User } from "@/lib/auth-server";

interface MainHeaderProps {
  user: User | null;
}

export default function Header({ user }: MainHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // const [showAnnouncementBar, setShowAnnouncementBar] = useState(true);
  const isScrolled = useScrollDetection({ threshold: 10 });
  const { activeDropdown, openDropdown, closeDropdownDelayed } = useDropdown();
  const { isMenuItemActive, isSubmenuItemActive } = useActiveMenuItem();

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "shadow-lg" : ""
        }`}
      >
        {/* {showAnnouncementBar && (
          <div className="bg-accent text-black">
            <div className="mx-auto flex min-h-9 max-w-[1440px] items-center justify-center px-10 sm:px-12 lg:px-8 relative">
              <span className="text-xs sm:text-sm font-semibold text-center leading-snug">
                La FanZone est là !&nbsp;
                <a
                  href="https://fanzone.centreculturel.cd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 font-bold hover:opacity-75 transition-opacity"
                >
                  fanzone.centreculturel.cd
                </a>
                &nbsp;- Rejoignez-nous maintenant
              </span>
              <button
                onClick={() => setShowAnnouncementBar(false)}
                aria-label="Fermer l'annonce"
                className="absolute right-3 lg:right-8 p-1.5 rounded-full hover:bg-black/10 transition-colors cursor-pointer"
              >
                <FaTimes className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )} */}

        <SocialBar />

        <div
          className={`bg-primary text-white transition-all duration-300 ${
            isScrolled ? "h-16 sm:h-[4.5rem]" : "h-[4.5rem] sm:h-20"
          }`}
        >
          <div className="mx-auto grid h-full max-w-[1720px] grid-cols-[1fr_auto] items-center gap-3 px-4 sm:px-6 lg:px-10 xl:grid-cols-[180px_minmax(0,1fr)_300px] xl:gap-6 xl:px-12 2xl:grid-cols-[220px_minmax(0,1fr)_340px] 2xl:px-16">
            <Logo />

            <DesktopNavigation
              isMenuItemActive={isMenuItemActive}
              isSubmenuItemActive={isSubmenuItemActive}
              activeDropdown={activeDropdown}
              onDropdownEnter={openDropdown}
              onDropdownLeave={closeDropdownDelayed}
            />

            <HeaderActions
              user={user}
              onMobileMenuToggle={handleMobileMenuToggle}
            />
          </div>
        </div>
      </header>

      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={handleMobileMenuClose}
        user={user}
      />
    </>
  );
}
