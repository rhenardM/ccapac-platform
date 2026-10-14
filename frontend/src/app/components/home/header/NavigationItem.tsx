import Link from "next/link";
import { FaChevronDown } from "react-icons/fa";
import { DropdownMenu } from "./DropdownMenu";
import type { MenuItem, SubmenuItem } from "@/lib/header/types";

interface NavigationItemProps {
  item: MenuItem;
  isActive: boolean;
  isDropdownOpen: boolean;
  onDropdownEnter: () => void;
  onDropdownLeave: () => void;
  isSubmenuItemActive: (subItem: SubmenuItem, item: MenuItem) => boolean;
}

export function NavigationItem({
  item,
  isActive,
  isDropdownOpen,
  onDropdownEnter,
  onDropdownLeave,
  isSubmenuItemActive,
}: NavigationItemProps) {
  if (item.submenu) {
    return (
      <div
        className="relative group"
        onMouseEnter={onDropdownEnter}
        onMouseLeave={onDropdownLeave}
      >
        <div className="flex items-center cursor-pointer">
          <span
            className={`flex h-10 items-center whitespace-nowrap rounded-full px-3 text-sm font-semibold uppercase tracking-[0.025em] transition-colors 2xl:px-4 ${
              isActive
                ? "bg-white/15 text-white"
                : "text-white/85 hover:bg-white/10 hover:text-white"
            }`}
          >
            {item.title}
            <FaChevronDown
              className={`ml-2 w-3 h-3 transition-all duration-300 group-hover:rotate-180 ${
                isActive ? "text-foreground" : "text-white"
              }`}
            />
          </span>
        </div>

        <DropdownMenu
          item={item}
          isOpen={isDropdownOpen}
          onClose={onDropdownLeave}
          isSubmenuItemActive={isSubmenuItemActive}
        />
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={`flex h-10 items-center whitespace-nowrap rounded-full px-3 text-sm font-semibold uppercase tracking-[0.025em] transition-colors 2xl:px-4 ${
        isActive
          ? "bg-white/15 text-white"
          : "text-white/85 hover:bg-white/10 hover:text-white"
      }`}
    >
      {item.title}
    </Link>
  );
}
