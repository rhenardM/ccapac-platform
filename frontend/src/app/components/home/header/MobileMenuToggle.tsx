import { BiMenu } from "react-icons/bi";

interface MobileMenuToggleProps {
  onToggle: () => void;
}

export function MobileMenuToggle({ onToggle }: MobileMenuToggleProps) {
  return (
    <button
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 text-white transition-colors hover:bg-white/10 active:bg-white/15 xl:hidden"
      onClick={onToggle}
      aria-label="Ouvrir le menu"
    >
      <BiMenu className="w-5 h-5 sm:w-6 sm:h-6" />
    </button>
  );
}
