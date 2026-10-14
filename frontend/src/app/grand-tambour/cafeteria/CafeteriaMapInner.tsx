"use client";

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Coordonnées réelles du CCAPAC — Boulevard Triomphal, Kinshasa.
const POSITION: [number, number] = [-4.3355832, 15.3042813];

// Marqueur personnalisé (pin SVG aux couleurs de la marque) — évite le bug
// classique des icônes Leaflet par défaut qui se cassent avec les bundlers.
const brandIcon = L.divIcon({
  className: "",
  html: `
    <div style="position:relative;transform:translate(-50%,-100%);">
      <svg width="40" height="52" viewBox="0 0 40 52" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 0C9 0 0 9 0 20c0 14 20 32 20 32s20-18 20-32C40 9 31 0 20 0Z" fill="#804423"/>
        <circle cx="20" cy="20" r="8" fill="#ffcc02"/>
      </svg>
    </div>`,
  iconSize: [40, 52],
  iconAnchor: [0, 0],
});

export default function CafeteriaMapInner() {
  return (
    <MapContainer
      center={POSITION}
      zoom={16}
      scrollWheelZoom={false}
      className="h-full w-full"
      style={{ background: "#e7dcc8" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={POSITION} icon={brandIcon}>
        <Popup>
          <strong>Centre Culturel et Artistique</strong>
          <br />
          Grand Tambour — La Cafétéria
          <br />
          Boulevard Triomphal, Kinshasa
        </Popup>
      </Marker>
    </MapContainer>
  );
}
