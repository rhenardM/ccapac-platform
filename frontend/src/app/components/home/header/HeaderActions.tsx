import Link from "next/link";
import { MemberButton } from "./MemberButton";
import { MobileMenuToggle } from "./MobileMenuToggle";
import { Heart } from "lucide-react";
import type { AuthServerUser as User } from "@/lib/auth-server";

interface HeaderActionsProps {
  user: User | null;
  onMobileMenuToggle: () => void;
}

export function HeaderActions({
  user,
  onMobileMenuToggle,
}: HeaderActionsProps) {
  return (
    <div className="flex items-center justify-end gap-2 sm:gap-2.5 xl:w-full xl:pl-5 2xl:pl-6">
      <Link
        href="/faire-un-don"
        aria-label="Faire un don"
        className="group flex h-10 items-center gap-1.5 rounded-xl border border-white/30 bg-white/5 px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:border-accent hover:bg-accent hover:text-black sm:px-3.5 sm:text-sm"
     > 
        <Heart
          className="h-[18px] w-[18px] animate-heartbeat fill-red-500 text-red-500 transition-colors group-hover:fill-black group-hover:text-black"
          aria-hidden="true"
        />
        Faire un don
      </Link>
      <div className="hidden xl:block">
        <MemberButton user={user} />
      </div>
      <MobileMenuToggle onToggle={onMobileMenuToggle} />
    </div>
  );
}
