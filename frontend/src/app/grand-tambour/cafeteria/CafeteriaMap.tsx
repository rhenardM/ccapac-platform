"use client";

import dynamic from "next/dynamic";

// Leaflet touche à `window`/`document` : on charge la carte uniquement côté
// client (ssr:false), avec un état de chargement discret.
const Map = dynamic(() => import("./CafeteriaMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#e7dcc8]">
      <span className="text-xs font-semibold uppercase tracking-widest text-[#6b5b4f]">
        Chargement de la carte…
      </span>
    </div>
  ),
});

export default function CafeteriaMap() {
  return <Map />;
}
