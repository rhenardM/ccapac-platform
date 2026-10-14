"use client";

import type { ReactNode } from "react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  BadgeDollarSign,
  Bell,
  Calendar,
  ChevronDown,
  ClipboardList,
  FileClock,
  FilePlus2,
  Files,
  Gavel,
  HandCoins,
  Home,
  LayoutDashboard,
  Loader2,
  LogOut,
  Megaphone,
  Menu,
  MessageSquare,
  Palette,
  User,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import type {
  User as AppUser,
} from "@/services/auth";
import { notificationService } from "@/services/notificationService";

type MenuItem = {
  href?: string;
  label: string;
  icon: typeof Home;
  section?: string;
  children?: {
    href: string;
    label: string;
    icon: typeof Home;
  }[];
};

interface DashboardLayoutClientProps {
  children: ReactNode;
  user: AppUser;
}

const roleLabels: Record<
  string,
  string
> = {
  MEMBER: "Membre",
  ADMIN: "Administrateur",
  SUPERVISEUR: "Superviseur",
  PROGRAMME:
    "Service des Programmes",
  PROGRAMME_SUPERVISEUR:
    "Superviseur Programme",
  PROGRAMME_ASSISTANT:
    "Assistant Programme",
  REGISSEUR_GENERAL:
    "Régisseur général",
  DIRECTION_ARTISTIQUE:
    "Direction artistique",
  DIRECTION_ARTISTIQUE_SUPERVISEUR:
    "Superviseur Direction artistique",
  DIRECTION_ARTISTIQUE_ASSISTANT:
    "Assistant Direction artistique",
  COMMUNICATION: "Communication",
  JURIDIQUE: "Service juridique",
  JURIDIQUE_SUPERVISEUR:
    "Superviseur juridique",
  JURIDIQUE_ASSISTANT:
    "Assistant juridique",
  FINANCE: "Service des Finances",
  DG: "Directeur général",
};

const memberMenu: MenuItem[] = [
  {
    section: "RÉSERVATIONS",
    href: "/espace-membre/membre",
    label:
      "Calendrier et réservation",
    icon: Calendar,
  },
  {
    href: "/espace-membre/membre/demandes",
    label: "Mes demandes",
    icon: Files,
  },
  {
    href: "/espace-membre/membre/historique",
    label: "Historique",
    icon: FileClock,
  },
  {
    section: "PROJETS",
    href: "/espace-membre/membre/proposer-projet",
    label: "Proposer un projet",
    icon: FilePlus2,
  },
  {
    section: "PARTENAIRES",
    href: "/espace-membre/membre/",
    label: "Devenir partenaire",
    icon: FilePlus2,
  },
  {
    section: "COMPTE",
    href: "/espace-membre/profile",
    label: "Mon profil",
    icon: User,
  },
  {
    href: "/espace-membre/membre/notifications",
    label: "Notifications",
    icon: Bell,
  },
];

const programmeSupervisorMenu: MenuItem[] =
  [
    {
      href: "/espace-membre/programme",
      label: "Tableau de bord",
      icon: LayoutDashboard,
    },
    {
      href: "/espace-membre/programme/evenements",
      label: "Événements",
      icon: Calendar,
    },
    {
      href: "/espace-membre/programme/historique",
      label: "Historique",
      icon: FileClock,
    },
    {
      section: "COMPTE",
      href: "/espace-membre/profile",
      label: "Mon profil",
      icon: User,
    },
  ];

const programmeAssistantMenu: MenuItem[] =
  [
    {
      href: "/espace-membre/programme",
      label: "Tableau de bord",
      icon: LayoutDashboard,
    },
    {
      href: "/espace-membre/programme/demandes",
      label: "Mes demandes",
      icon: ClipboardList,
    },
    {
      href: "/espace-membre/programme/evenements",
      label: "Événements",
      icon: Calendar,
    },
    {
      href: "/espace-membre/programme/historique",
      label: "Historique",
      icon: FileClock,
    },
    {
      section: "COMPTE",
      href: "/espace-membre/profile",
      label: "Mon profil",
      icon: User,
    },
  ];

const artisticSupervisorMenu: MenuItem[] =
  [
    {
      href: "/espace-membre/direction-artistique",
      label: "Tableau de bord",
      icon: Palette,
    },
    {
      section: "RÉSERVATIONS",
      href: "/espace-membre/direction-artistique/demandes",
      label:
        "Dossiers de réservation",
      icon: ClipboardList,
    },
    {
      href: "/espace-membre/direction-artistique/historique",
      label:
        "Historique réservations",
      icon: FileClock,
    },
    {
      section:
        "PROPOSITIONS DE PROJET",
      href: "/espace-membre/direction-artistique/projets",
      label: "Projets à étudier",
      icon: FilePlus2,
    },
    {
      section: "COMPTE",
      href: "/espace-membre/direction-artistique/notifications",
      label: "Notifications",
      icon: Bell,
    },
    {
      href: "/espace-membre/profile",
      label: "Mon profil",
      icon: User,
    },
  ];

const artisticAssistantMenu: MenuItem[] =
  [
    {
      href: "/espace-membre/direction-artistique",
      label: "Tableau de bord",
      icon: Palette,
    },
    {
      section: "RÉSERVATIONS",
      href: "/espace-membre/direction-artistique/demandes",
      label:
        "Mes réservations à traiter",
      icon: ClipboardList,
    },
    {
      href: "/espace-membre/direction-artistique/historique",
      label:
        "Historique réservations",
      icon: FileClock,
    },
    {
      section:
        "PROPOSITIONS DE PROJET",
      href: "/espace-membre/direction-artistique/projets",
      label:
        "Mes projets à étudier",
      icon: FilePlus2,
    },
    {
      section: "COMPTE",
      href: "/espace-membre/direction-artistique/notifications",
      label: "Notifications",
      icon: Bell,
    },
    {
      href: "/espace-membre/profile",
      label: "Mon profil",
      icon: User,
    },
  ];

const legalSupervisorMenu: MenuItem[] =
  [
    {
      href: "/espace-membre/juridique",
      label: "Tableau de bord",
      icon: Gavel,
    },
    {
      href: "/espace-membre/juridique/demandes",
      label: "Demandes à affecter",
      icon: ClipboardList,
    },
    {
      href: "/espace-membre/juridique/historique",
      label: "Historique",
      icon: FileClock,
    },
    {
      href: "/espace-membre/profile",
      label: "Mon profil",
      icon: User,
    },
  ];

const legalAssistantMenu: MenuItem[] =
  [
    {
      href: "/espace-membre/juridique",
      label: "Tableau de bord",
      icon: Gavel,
    },
    {
      href: "/espace-membre/juridique/demandes",
      label: "Mes demandes",
      icon: ClipboardList,
    },
    {
      href: "/espace-membre/juridique/historique",
      label: "Historique",
      icon: FileClock,
    },
    {
      href: "/espace-membre/profile",
      label: "Mon profil",
      icon: User,
    },
  ];

const adminMenu: MenuItem[] = [
  {
    href: "/espace-membre/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/espace-membre/admin/members",
    label: "Membres",
    icon: Users,
  },
  {
    href: "/espace-membre/admin/events",
    label: "Événements",
    icon: Calendar,
  },
  {
    href: "/espace-membre/admin/suggestions",
    label: "Suggestions",
    icon: MessageSquare,
  },
  {
    href: "/espace-membre/admin/fundraising",
    label: "Dons",
    icon: HandCoins,
  },
];

const supervisorMenu: MenuItem[] = [
  {
    href: "/espace-membre/superviseur",
    label: "Vue globale",
    icon: LayoutDashboard,
  },
  {
    href: "/espace-membre/superviseur/utilisateurs",
    label: "Utilisateurs",
    icon: Users,
  },
];

const dgMenu: MenuItem[] = [
  {
    href: "/espace-membre/dg",
    label: "Tableau de bord DG",
    icon: LayoutDashboard,
  },
  {
    href: "/espace-membre/dg/suivi",
    label: "Toutes les demandes",
    icon: ClipboardList,
  },
  {
    href: "/espace-membre/profile",
    label: "Mon profil",
    icon: User,
  },
];

function departmentMenu(
  basePath: string,
  dashboardIcon: typeof Home
): MenuItem[] {
  return [
    {
      href: basePath,
      label: "Tableau de bord",
      icon: dashboardIcon,
    },
    {
      href: `${basePath}/demandes`,
      label: "Demandes à traiter",
      icon: ClipboardList,
    },
    {
      href: `${basePath}/historique`,
      label: "Historique",
      icon: FileClock,
    },
    {
      href: "/espace-membre/profile",
      label: "Mon profil",
      icon: User,
    },
  ];
}

function getMenuItems(
  role: string
): MenuItem[] {
  switch (role) {
    case "ADMIN":
      return adminMenu;

    case "SUPERVISEUR":
      return supervisorMenu;

    case "DG":
      return dgMenu;

    case "PROGRAMME_ASSISTANT":
      return programmeAssistantMenu;

    case "PROGRAMME":
    case "PROGRAMME_SUPERVISEUR":
      return programmeSupervisorMenu;

    case "REGISSEUR_GENERAL":
      return departmentMenu(
        "/espace-membre/regisseur",
        Wrench
      );

    case "DIRECTION_ARTISTIQUE_ASSISTANT":
      return artisticAssistantMenu;

    case "DIRECTION_ARTISTIQUE":
    case "DIRECTION_ARTISTIQUE_SUPERVISEUR":
      return artisticSupervisorMenu;

    case "COMMUNICATION":
      return departmentMenu(
        "/espace-membre/communication",
        Megaphone
      );

    case "JURIDIQUE_ASSISTANT":
      return legalAssistantMenu;

    case "JURIDIQUE":
    case "JURIDIQUE_SUPERVISEUR":
      return legalSupervisorMenu;

    case "FINANCE":
      return departmentMenu(
        "/espace-membre/finance",
        BadgeDollarSign
      );

    case "MEMBER":
    default:
      return memberMenu;
  }
}

function isActivePath(
  pathname: string,
  href: string,
  items: MenuItem[]
) {
  if (pathname === href) {
    return true;
  }

  const navigableItems =
    items.flatMap((item) =>
      item.children?.length
        ? item.children
        : item.href
          ? [
              {
                href: item.href,
              },
            ]
          : []
    );

  const moreSpecificItemIsActive =
    navigableItems.some(
      (item) =>
        item.href !== href &&
        item.href.startsWith(
          `${href}/`
        ) &&
        (pathname === item.href ||
          pathname.startsWith(
            `${item.href}/`
          ))
    );

  return (
    !moreSpecificItemIsActive &&
    pathname.startsWith(`${href}/`)
  );
}

export default function DashboardLayoutClient({
  children,
  user,
}: DashboardLayoutClientProps) {
  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false);

  const [
    isLoggingOut,
    setIsLoggingOut,
  ] = useState(false);

  const [
    expandedMenu,
    setExpandedMenu,
  ] = useState<string | null>(null);

  const [
    unreadNotifications,
    setUnreadNotifications,
  ] = useState(0);

  const pathname = usePathname();
  const { logout } = useAuth();

  /*
   * Supprime uniquement le grand scroll
   * global noir de HTML/BODY.
   *
   * Le scroll du contenu principal est
   * conservé dans la balise <main>.
   */
  useEffect(() => {
    const html =
      document.documentElement;

    const body = document.body;

    const previousHtmlOverflow =
      html.style.getPropertyValue(
        "overflow"
      );

    const previousHtmlPriority =
      html.style.getPropertyPriority(
        "overflow"
      );

    const previousBodyOverflow =
      body.style.getPropertyValue(
        "overflow"
      );

    const previousBodyPriority =
      body.style.getPropertyPriority(
        "overflow"
      );

    html.style.setProperty(
      "overflow",
      "hidden",
      "important"
    );

    body.style.setProperty(
      "overflow",
      "hidden",
      "important"
    );

    return () => {
      if (previousHtmlOverflow) {
        html.style.setProperty(
          "overflow",
          previousHtmlOverflow,
          previousHtmlPriority
        );
      } else {
        html.style.removeProperty(
          "overflow"
        );
      }

      if (previousBodyOverflow) {
        body.style.setProperty(
          "overflow",
          previousBodyOverflow,
          previousBodyPriority
        );
      } else {
        body.style.removeProperty(
          "overflow"
        );
      }
    };
  }, []);

  const loadUnreadNotifications =
    useCallback(async () => {
      const role = String(
        user.role || ""
      )
        .trim()
        .toUpperCase();

      try {
        if (role === "MEMBER") {
          const result =
            await notificationService.getMyNotifications();

          setUnreadNotifications(
            result.unreadCount
          );

          return;
        }

        const artisticRoles = [
          "ADMIN",
          "DIRECTION_ARTISTIQUE",
          "DIRECTION_ARTISTIQUE_SUPERVISEUR",
          "DIRECTION_ARTISTIQUE_ASSISTANT",
        ];

        if (
          artisticRoles.includes(role)
        ) {
          const result =
            await notificationService.getArtisticNotifications();

          setUnreadNotifications(
            result.unreadCount.total
          );

          return;
        }

        setUnreadNotifications(0);
      } catch (error) {
        console.error(
          "Erreur chargement notifications :",
          error
        );
      }
    }, [user.role]);

  useEffect(() => {
    void loadUnreadNotifications();

    const intervalId =
      window.setInterval(() => {
        void loadUnreadNotifications();
      }, 30000);

    const handleNotificationsUpdated =
      () => {
        void loadUnreadNotifications();
      };

    window.addEventListener(
      "notifications-updated",
      handleNotificationsUpdated
    );

    return () => {
      window.clearInterval(intervalId);

      window.removeEventListener(
        "notifications-updated",
        handleNotificationsUpdated
      );
    };
  }, [loadUnreadNotifications]);

  const menuItems = getMenuItems(
    user.role
  );

  const fullName =
    `${user.first_name || ""} ${
      user.last_name || ""
    }`.trim() || user.email;

  const initials =
    [
      user.first_name?.charAt(0),
      user.last_name?.charAt(0),
    ]
      .filter(Boolean)
      .join("")
      .toUpperCase() || "U";

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    try {
      setIsLoggingOut(true);

      const normalizedRole = String(
        user.role || ""
      )
        .trim()
        .toUpperCase();

      const destination =
        normalizedRole === "MEMBER"
          ? "/auth/login"
          : "/auth/equipe-validation-7d2f9a4c81";

      await logout();

      toast.success(
        "Déconnexion réussie"
      );

      window.location.replace(
        destination
      );
    } catch (error) {
      console.error(
        "Erreur lors de la déconnexion :",
        error
      );

      toast.error(
        "Une erreur inattendue s'est produite"
      );

      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex h-dvh w-full min-h-0 overflow-hidden bg-muted/30">
      {/* En-tête mobile */}
      <header className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between border-b bg-primary px-4 lg:hidden">
        <Link
          href="/"
          className="font-bold uppercase"
        >
          <Image
            src="/logo.png"
            alt="CCAPAC"
            width={120}
            height={60}
            className="h-10 w-auto object-contain"
          />
        </Link>

        <button
          type="button"
          onClick={() =>
            setMobileMenuOpen(
              (current) => !current
            )
          }
          className="rounded-lg p-2 transition-colors hover:bg-muted"
          aria-label="Afficher le menu"
        >
          {mobileMenuOpen ? (
            <X size={24} />
          ) : (
            <Menu size={24} />
          )}
        </button>
      </header>

      {/* Fond du menu mobile */}
      {mobileMenuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeMobileMenu}
          aria-label="Fermer le menu"
        />
      )}

      {/* Menu latéral */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r bg-primary transition-transform duration-300 lg:static lg:translate-x-0",
          mobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full"
        )}
      >
        {/* Logo ordinateur */}
        <div className="hidden h-20 items-center border-b px-6 lg:flex">
          <Link
            href="/"
            className="block"
          >
            <Image
              src="/logo.png"
              alt="CCAPAC"
              width={160}
              height={80}
              className="h-12 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Titre mobile */}
        <div className="flex h-16 items-center border-b px-6 lg:hidden">
          <span className="text-lg font-semibold">
            Menu
          </span>
        </div>

        {/* Rôle utilisateur */}
        <div className="border-b px-6 py-3">
          <p className="text-xs font-bold uppercase tracking-wider text-foreground/70">
            {roleLabels[user.role] ||
              user.role}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {menuItems.map((item) => {
            const Icon = item.icon;

            if (
              item.children &&
              item.children.length > 0
            ) {
              const groupActive =
                item.children.some(
                  (child) =>
                    pathname ===
                      child.href ||
                    pathname.startsWith(
                      `${child.href}/`
                    )
                );

              const groupOpen =
                expandedMenu ===
                  item.label ||
                (expandedMenu === null &&
                  groupActive);

              return (
                <div
                  key={item.label}
                  className={
                    item.section
                      ? "mt-6 first:mt-0"
                      : ""
                  }
                >
                  {item.section && (
                    <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.18em] text-foreground/50">
                      {item.section}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setExpandedMenu(
                        groupOpen
                          ? ""
                          : item.label
                      )
                    }
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-bold transition-all duration-200",
                      groupActive
                        ? "bg-muted text-foreground"
                        : "text-foreground hover:bg-muted hover:text-foreground"
                    )}
                    aria-expanded={
                      groupOpen
                    }
                  >
                    <Icon size={18} />

                    <span className="flex-1">
                      {item.label}
                    </span>

                    <ChevronDown
                      size={17}
                      className={cn(
                        "transition-transform duration-200",
                        groupOpen &&
                          "rotate-180"
                      )}
                    />
                  </button>

                  {groupOpen && (
                    <div className="ml-5 mt-1 space-y-1 border-l border-foreground/20 pl-3">
                      {item.children.map(
                        (child) => {
                          const ChildIcon =
                            child.icon;

                          const childActive =
                            pathname ===
                              child.href ||
                            pathname.startsWith(
                              `${child.href}/`
                            );

                          return (
                            <Link
                              key={
                                child.href
                              }
                              href={
                                child.href
                              }
                              onClick={
                                closeMobileMenu
                              }
                              className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                                childActive
                                  ? "bg-muted text-foreground"
                                  : "text-foreground/80 hover:bg-muted hover:text-foreground"
                              )}
                            >
                              <ChildIcon
                                size={16}
                              />

                              <span>
                                {
                                  child.label
                                }
                              </span>
                            </Link>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              );
            }

            if (!item.href) {
              return null;
            }

            const active =
              isActivePath(
                pathname,
                item.href,
                menuItems
              );

            return (
              <div
                key={item.href}
                className={
                  item.section
                    ? "mt-6 first:mt-0"
                    : "mt-1"
                }
              >
                {item.section && (
                  <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.18em] text-foreground/50">
                    {item.section}
                  </p>
                )}

                <Link
                  href={item.href}
                  onClick={
                    closeMobileMenu
                  }
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition-all duration-200",
                    active
                      ? "bg-muted text-foreground"
                      : "text-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon size={18} />

                  <span>
                    {item.label}
                  </span>

                  {item.href.endsWith(
                    "/notifications"
                  ) &&
                    unreadNotifications >
                      0 && (
                      <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-black text-white">
                        {unreadNotifications >
                        99
                          ? "99+"
                          : unreadNotifications}
                      </span>
                    )}
                </Link>
              </div>
            );
          })}
        </nav>

        {/* Profil et déconnexion */}
        <div className="border-t bg-muted/10 p-4">
          <div className="mb-4 flex items-center gap-3 px-2">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 font-bold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {fullName}
              </p>

              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>

              <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-wide text-foreground/60">
                {roleLabels[
                  user.role
                ] || user.role}
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleLogout}
            variant="ghost"
            disabled={isLoggingOut}
            className="w-full justify-start gap-2 font-bold text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            {isLoggingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut size={18} />
            )}

            <span>
              {isLoggingOut
                ? "Déconnexion..."
                : "Déconnexion"}
            </span>
          </Button>
        </div>
      </aside>

      {/*
       * Ce conteneur conserve son propre
       * scroll. Le scroll global noir de
       * HTML/BODY est bloqué plus haut.
       */}
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden pt-16 lg:pt-0">
        <div className="w-full p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}