import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  // Image Docker minimale : seul le serveur Node autonome + ses dépendances.
  output: "standalone",
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  async redirects() {
    return [
      // La rubrique Cinéma & Audiovisuel est remplacée par le module Cinémathèque.
      {
        source: "/programmes/cinema-audiovisuel",
        destination: "/cinematheque",
        permanent: true,
      },
      // Les programmes externes sont désormais présentés sur /evenements-externes.
      {
        source: "/programmes/externes",
        destination: "/evenements-externes",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "127.0.0.1" },
      // Backend contenu (Fundraising-integration) : prod + local sur :8000
      { protocol: "https", hostname: "api-fundraising.centreculturel.cd" },
      { protocol: "http", hostname: "127.0.0.1", port: "8000" },
      { protocol: "http", hostname: "localhost", port: "8000" },
      // Images de test (placeholders) pour la Cinémathèque en attendant de vrais visuels.
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
    ],
    qualities: [90, 100],
  },
};

export default withPWA(nextConfig);
