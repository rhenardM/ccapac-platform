import { useCallback } from "react";
import { usePathname } from "next/navigation";
import type { MenuItem, SubmenuItem } from "@/lib/header/types";

export function useActiveMenuItem() {
  const pathname = usePathname();

  const isMenuItemActive = useCallback(
    (item: MenuItem): boolean => {
      if (pathname === "/") return false;
      if (
        item.href === "/agenda" &&
        (pathname.startsWith("/evenement") || pathname === "/agenda")
      ) {
        return true;
      }
      return pathname.startsWith(item.href);
    },
    [pathname]
  );

  const isSubmenuItemActive = useCallback(
    (subItem: SubmenuItem): boolean => {
      return pathname === subItem.href;
    },
    [pathname]
  );

  return {
    isMenuItemActive,
    isSubmenuItemActive,
  };
}
