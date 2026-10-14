"use client";

import { Button } from "@/app/components/ui/button";
import { FaMapMarkedAlt } from "react-icons/fa";

export function GoogleMapsButton() {
  return (
    <Button
      variant="outline"
      className="w-full justify-between group hover:text-black cursor-pointer  hover:border-primary/50 transition-all duration-300 h-10 sm:h-11 text-xs sm:text-sm"
      onClick={() => {
        window.open(
          "https://www.google.com/maps/place/Centre+Culturel+et+Artistique+pour+les+Pays+d'Afrique+Centrale/@-4.3338616,15.2992167,16.6z/data=!4m20!1m13!4m12!1m4!2m2!1d15.2797184!2d-4.3155456!4e1!1m6!1m2!1s0x1a6a314420665d11:0xaf07bf1a55c3afe1!2sBoulevard+Triomphal,+Kinshasa!2m2!1d15.304595!2d-4.3345427!3m5!1s0x1a6a3167c6c74b9b:0x1b1f7e8e99b778c7!8m2!3d-4.3355832!4d15.3042813!16s%2Fg%2F11sbrczsq_?entry=ttu&g_ep=EgoyMDI1MDkyOS4wIKXMDSoASAFQAw%3D%3D",
          "_blank"
        );
      }}
    >
      <span className="flex items-center gap-1.5 sm:gap-2">
        <FaMapMarkedAlt className="text-primary h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
        <span className="font-medium truncate">Voir l&apos;itinéraire</span>
      </span>
      <span className="text-[10px] sm:text-xs text-muted-foreground group-hover:text-black transition-colors flex-shrink-0 hidden sm:inline">
        Ouvrir Maps &rarr;
      </span>
    </Button>
  );
}
