import type { Member } from "./member";
import {
  directionGenerale,
  communicationAdmin,
  programmesEvenements,
  logistiqueSecurite,
  techniqueProduction,
  financesAccueil,
  centreAccueil,
  dramatheque,
  bes,
} from "./member";

export interface Department {
  id: string;
  name: string;
  members: Member[];
  gridCols: string;
}

export const departments: Department[] = [
  {
    id: "direction",
    name: "Direction Générale",
    members: [directionGenerale],
    gridCols: "max-w-xs mx-auto",
  },
  {
    id: "communication",
    name: "Communication & Administration",
    members: communicationAdmin,
    gridCols:
      "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4",
  },
  {
    id: "programmes",
    name: "Programmes & Événements",
    members: programmesEvenements,
    gridCols:
      "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-w-5xl mx-auto",
  },
  {
    id: "logistique",
    name: "Logistique & Sécurité",
    members: logistiqueSecurite,
    gridCols:
      "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-w-5xl mx-auto",
  },
  {
    id: "technique",
    name: "Technique & Production",
    members: techniqueProduction,
    gridCols:
      "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4",
  },
  {
    id: "finances",
    name: "Finances & Accueil",
    members: financesAccueil,
    gridCols:
      "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-w-5xl mx-auto",
  },
  {
    id: "centre",
    name: "Centre d'Accueil & Résidence Créative",
    members: centreAccueil,
    gridCols:
      "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-w-5xl mx-auto",
  },
  {
    id: "dramatheque",
    name: "Dramathèque",
    members: dramatheque,
    gridCols:
      "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 max-w-6xl mx-auto",
  },
  {
    id: "bes",
    name: "BES",
    members: [bes],
    gridCols: "max-w-xs mx-auto",
  },
];
