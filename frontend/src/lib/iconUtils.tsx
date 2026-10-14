import { FaTheaterMasks } from "react-icons/fa";
import { IoIosCafe } from "react-icons/io";
import {
  FaBuildingUser,
  FaCamera,
  FaChalkboardUser,
  FaHouseUser,
  FaImage,
  FaMicrophone,
  FaPeopleGroup,
} from "react-icons/fa6";

type IconComponent = React.ComponentType<{ className?: string }>;

/**
 * Icônes des types d'espace (voir SpaceCategory::iconChoices() côté backend —
 * les clés doivent rester synchronisées). Ajouter un type qui réutilise une
 * de ces icônes ne nécessite aucune modification de code ; un glyphe inédit
 * nécessite un ajout ici.
 */
const spaceIconComponents: Record<string, IconComponent> = {
  theater: FaTheaterMasks,
  multipurpose: FaPeopleGroup,
  residence: FaHouseUser,
  cafe: IoIosCafe,
  media: FaCamera,
  studio: FaMicrophone,
  gallery: FaImage,
  conference: FaChalkboardUser,
  building: FaBuildingUser,
};

export function getSpaceIcon(iconName?: string | null): IconComponent {
  return (iconName && spaceIconComponents[iconName]) || FaBuildingUser;
}
