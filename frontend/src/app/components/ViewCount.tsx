import { Eye } from "lucide-react";
import { formatViewCount } from "@/lib/utils";

interface ViewCountProps {
  count: number;
  className?: string;
  iconSize?: number;
}

/** Affiche « 👁 1 245 vues » — preuve sociale sur les cartes et la page de détail. */
export default function ViewCount({ count, className = "", iconSize = 13 }: ViewCountProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <Eye size={iconSize} />
      {formatViewCount(count)} {count > 1 ? "vues" : "vue"}
    </span>
  );
}
