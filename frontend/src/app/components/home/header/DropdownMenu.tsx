"use client";

import Link from "next/link";
import type { MenuItem, SubmenuItem } from "@/lib/header/types";

interface DropdownMenuProps {
  item: MenuItem;
  isOpen: boolean;
  onClose: () => void;
  isSubmenuItemActive: (subItem: SubmenuItem, item: MenuItem) => boolean;
}

export function DropdownMenu({
  item,
  isOpen,
  onClose,
  isSubmenuItemActive,
}: DropdownMenuProps) {
  if (!item.submenu || !isOpen) return null;

  return (
    <div className="absolute top-full left-0 pt-2 z-20" onMouseLeave={onClose}>
      <div className="h-2 w-full" />
      <div className="w-72 rounded-2xl bg-gradient-to-br from-white to-muted/10 shadow-2xl py-4 border border-muted/20 backdrop-blur-sm">
        {item.submenu.map((subItem) => {
          const isSubActive = isSubmenuItemActive(subItem, item);
          return (
            <Link
              key={subItem.name}
              href={subItem.href}
              className={`block px-6 py-3 transition-all duration-300 text-sm font-semibold border-l-4 rounded-r-xl mx-2 ${
                isSubActive
                  ? "bg-gradient-to-r from-primary/10 to-primary/20 text-foreground border-primary font-bold shadow-lg"
                  : "text-foreground hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/10 hover:text-foreground/90 border-transparent hover:border-primary/30 hover:shadow-md"
              }`}
            >
              {subItem.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
