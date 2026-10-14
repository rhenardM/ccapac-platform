"use client";

import { useState } from "react";
import { FaPlay, FaTimes } from "react-icons/fa";
import Image from "next/image";

export default function VideoFocus() {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [hasVideoError, setHasVideoError] = useState(false);

  // Configuration vidéo - À personnaliser selon vos besoins
  const videoConfig = {
    // Option 1: Vidéo YouTube (remplacez par votre ID de vidéo)
    youtubeId: "6snOnJ-AlwY", // Exemple - remplacez par votre vraie vidéo

    // Option 2: Vidéo locale
    localVideo: null as string | null,

    // Image de fallback
    posterImage: "/images/grand-tambour.jpg",

    // Titre et description
    title: "Grand Tambour",
    subtitle: "Découvrez notre patrimoine culturel",
  };

  const handlePlayVideo = () => {
    setIsVideoPlaying(true);
  };

  const handleCloseVideo = () => {
    setIsVideoPlaying(false);
  };

  const handleVideoError = () => {
    setHasVideoError(true);
  };

  return (
    <section className="relative h-[60vh] min-h-[500px] lg:h-[80vh] w-full overflow-hidden bg-black">
      {/* Background avec image ou vidéo locale */}
      <div className="absolute inset-0">
        {videoConfig.localVideo && !hasVideoError ? (
          // Essayer d'abord la vidéo locale
          <video
            className="w-full h-full object-cover opacity-80"
            autoPlay
            muted
            loop
            poster={videoConfig.posterImage}
            onError={handleVideoError}
          >
            <source src={videoConfig.localVideo} type="video/mp4" />
            {/* Fallback: votre navigateur ne supporte pas la vidéo */}
          </video>
        ) : (
          // Fallback: image de fond si la vidéo ne fonctionne pas
          <div className="relative w-full h-full">
            <Image
              src={videoConfig.posterImage}
              alt="Grand Tambour"
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          </div>
        )}
        {/* Overlay sombre pour la lisibilité du texte - Simple et efficace */}
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* Contenu principal */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight drop-shadow-md">
              {videoConfig.title}
            </h1>
            <p className="text-xl sm:text-2xl text-white/90 font-medium tracking-wide">
              {videoConfig.subtitle}
            </p>
          </div>

          {/* Bouton play - Design sobre et accessible */}
          <button
            onClick={handlePlayVideo}
            className="group relative inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full transition-transform duration-300 hover:scale-110 shadow-xl focus:outline-none focus:ring-4 focus:ring-white/30"
            aria-label="Lire la vidéo de présentation"
          >
            {/* Pulsation subtile */}
            <span className="absolute inset-0 rounded-full bg-white opacity-20 animate-ping group-hover:animate-none"></span>

            <FaPlay className="w-8 h-8 sm:w-10 sm:h-10 text-black ml-1.5" />
          </button>

          <p className="text-sm font-medium text-white/80 uppercase tracking-widest">
            Regarder la vidéo
          </p>
        </div>
      </div>

      {/* Modal YouTube Video */}
      {isVideoPlaying && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-6xl aspect-video bg-black rounded-lg shadow-2xl overflow-hidden">
            {/* Bouton fermer - Clair et accessible */}
            <button
              onClick={handleCloseVideo}
              className="absolute top-4 right-4 z-10 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Fermer la vidéo"
            >
              <FaTimes className="w-6 h-6" />
            </button>

            {/* YouTube iframe */}
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${videoConfig.youtubeId}?autoplay=1&mute=0&controls=1&rel=0`}
              title="Vidéo de présentation Grand Tambour"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>

          {/* Clic pour fermer (Overlay) */}
          <div
            className="absolute inset-0 -z-10"
            onClick={handleCloseVideo}
            aria-label="Fermer la vidéo"
          ></div>
        </div>
      )}
    </section>
  );
}
