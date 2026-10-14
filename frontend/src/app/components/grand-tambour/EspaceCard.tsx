import Link from "next/link";
import { FaArrowRight } from "react-icons/fa6";
import type { Space } from "@/types/space";
import { getSpaceIcon } from "@/lib/iconUtils";
import { formatCapacity } from "@/lib/spaceUtils";

interface EspaceCardProps {
  espace: Space;
}

export default function EspaceCard({ espace }: EspaceCardProps) {
  const IconComponent = getSpaceIcon(espace.categoryIcon);

  return (
    <Link
      href={`/grand-tambour/espaces/${espace.slug}`}
      className="group flex h-full flex-col bg-gradient-to-br from-white to-muted/10 p-6 sm:p-8 rounded-2xl shadow-xl border border-muted/20 hover:shadow-2xl transition-all duration-300"
    >
      <div className="text-center">
        <div className="relative mb-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
            <IconComponent className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
          </div>
        </div>

        {espace.category && (
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-primary">
            {espace.category}
          </span>
        )}
        <h3 className="mt-1 text-lg sm:text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
          {espace.name}
        </h3>
        {espace.shortDescription && (
          <p className="text-sm sm:text-base text-muted-foreground line-clamp-3">
            {espace.shortDescription}
          </p>
        )}
        {espace.capacity && (
          <p className="mt-3 text-xs sm:text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {formatCapacity(espace.capacity)}
          </p>
        )}
      </div>

      <span className="mt-auto flex items-center justify-center gap-2 pt-6 text-xs sm:text-sm font-bold uppercase tracking-wide text-foreground transition-colors group-hover:text-primary">
        Voir plus
        <FaArrowRight className="transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
