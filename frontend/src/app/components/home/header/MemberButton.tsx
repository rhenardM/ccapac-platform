import Link from "next/link";
import { LogIn, UserRound } from "lucide-react";
import type { AuthServerUser as User } from "@/lib/auth-server";

interface MemberButtonProps {
  user: User | null;
  fullWidth?: boolean;
}

export function MemberButton({ user, fullWidth = false }: MemberButtonProps) {
  const Icon = user ? UserRound : LogIn;

  return (
    <Link
      href={user ? "/espace-membre" : "/auth/login"}
      className={`flex items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-black shadow-sm transition-colors hover:bg-accent/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 whitespace-nowrap ${
        fullWidth ? "h-11 w-full" : "h-10"
      }`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span>{user ? "Espace Membre" : "Se connecter"}</span>
    </Link>
  );
}
