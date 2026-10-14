export interface CcapacSpace {
  id: number;
  name: string;
  description: string;
  capacityLabel: string;
}

export const CCAPAC_SPACES: readonly CcapacSpace[] = [
  { id: 1, name: "Grand théâtre", description: "Espace scénique modulable pour spectacles et grandes cérémonies.", capacityLabel: "2 000 pers." },
  { id: 2, name: "Petit théâtre", description: "Espace intimiste pour pièces de théâtre, projections et rencontres.", capacityLabel: "800 pers." },
  { id: 3, name: "Salle de danse", description: "Espace avec miroirs et barres destiné aux répétitions et ateliers.", capacityLabel: "50–60 pers." },
  { id: 4, name: "Hall", description: "Espace d’accueil polyvalent pour expositions et réceptions.", capacityLabel: "1 000 pers." },
  { id: 5, name: "Atrium", description: "Espace de travail collaboratif et de rencontres professionnelles.", capacityLabel: "200 pers." },
  { id: 6, name: "Cafétéria", description: "Espace de restauration et de détente pour les participants.", capacityLabel: "60 pers." },
  { id: 7, name: "Salle de musique 1", description: "Studio d’enregistrement et de répétition musicale équipé.", capacityLabel: "50 pers." },
  { id: 8, name: "Salle de musique 2", description: "Studio d’enregistrement et de répétition musicale équipé.", capacityLabel: "50 pers." },
  { id: 9, name: "Parking", description: "Parking sécurisé pour les visiteurs, artistes et organisateurs.", capacityLabel: "3 000 véhicules" },
  { id: 10, name: "Esplanade principale", description: "Grand espace extérieur destiné aux manifestations et rassemblements.", capacityLabel: "3 000 pers." },
  { id: 11, name: "Esplanade secondaire / côté INA", description: "Espace extérieur secondaire situé du côté de l’INA.", capacityLabel: "2 000 pers." },
  { id: 12, name: "Esplanade secondaire / côté parking", description: "Espace extérieur secondaire situé du côté du parking.", capacityLabel: "3 000 pers." },
];

export function getCcapacSpace(
  id?: number | null
) {
  return CCAPAC_SPACES.find(
    (space) => space.id === id
  );
}