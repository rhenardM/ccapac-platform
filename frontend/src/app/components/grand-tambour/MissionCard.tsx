import Image from "next/image";

interface MissionCardProps {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
}

export default function MissionCard({
  title,
  description,
  imageSrc,
  imageAlt,
}: MissionCardProps) {
  return (
    <div className="text-center group">
      <div className="relative mb-4 sm:mb-5 md:mb-6 inline-block">
        <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 mx-auto relative flex items-center justify-center">
          {/* Simple accent circle behind logo if transparent, or just the logo */}
          <div className="absolute inset-0 bg-primary/5 rounded-full scale-0 group-hover:scale-110 transition-transform duration-500 ease-out" />
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={80}
            height={80}
            className="relative z-10 w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-500"
          />
        </div>
      </div>
      <h3 className="text-sm sm:text-base md:text-lg font-bold uppercase tracking-wide mb-2 sm:mb-2.5 md:mb-3 text-foreground group-hover:text-primary transition-colors px-2">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed px-2">
        {description}
      </p>
    </div>
  );
}
