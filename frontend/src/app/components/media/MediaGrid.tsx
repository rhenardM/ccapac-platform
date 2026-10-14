import Image from "next/image";
import { Media } from "@/types/media";
import { formatDate } from "@/lib/mediaUtils";

interface MediaGridProps {
  items: Media[];
  loading: boolean;
  onItemClick: (index: number) => void;
}

export default function MediaGrid({
  items,
  loading,
  onItemClick,
}: MediaGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="aspect-[3/2] bg-muted/20 animate-pulse rounded-lg sm:rounded-xl"
          />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-12 sm:py-16 md:py-20 text-center border border-dashed border-border rounded-lg sm:rounded-xl">
        <p className="text-muted-foreground text-sm sm:text-base">
          Aucun média trouvé
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-x-8 lg:gap-y-12">
      {items.map((item, index) => (
        <button
          key={item.id}
          onClick={() => onItemClick(index)}
          className="group block w-full text-left"
        >
          {/* Image Container */}
          <div className="relative aspect-[3/2] overflow-hidden rounded-lg sm:rounded-xl bg-muted mb-3 sm:mb-4 cursor-pointer">
            <Image
              src={item.image || "/placeholder.svg"}
              alt={item.title || "Photo — Grand Tambour"}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

            {/* Category Badge - visible on hover or always visible? Let's keep it subtle */}
            <div className="absolute top-2 sm:top-3 left-2 sm:left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-black/60 backdrop-blur-sm text-white text-[9px] sm:text-[10px] uppercase font-bold tracking-wider rounded">
                {item.category}
              </span>
            </div>
          </div>

          {/* Metadata — masquée quand aucune donnée éditoriale n'est disponible */}
          {(formatDate(item.eventDate) || item.title || item.eventType || item.location) && (
            <div className="space-y-1 sm:space-y-1.5">
              {(formatDate(item.eventDate) || item.eventType) && (
                <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground">
                  <span className="truncate flex-1 min-w-0">{formatDate(item.eventDate)}</span>
                  {item.eventType && (
                    <span className="ml-2 truncate flex-shrink-0">{item.eventType}</span>
                  )}
                </div>
              )}
              {item.title && (
                <h3 className="font-bold text-sm sm:text-base md:text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
                  {item.title}
                </h3>
              )}
              {item.location && (
                <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1">
                  {item.location}
                </p>
              )}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
