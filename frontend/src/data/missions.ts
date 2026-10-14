export interface Mission {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
}

export const missions: Mission[] = [
  {
    title: "Créer",
    description:
      "Nous visons la création artistique dans tous nos projets culturels",
    imageSrc: "/creer.png",
    imageAlt: "logo créer",
  },
  {
    title: "Grandir",
    description:
      "Nous encourageons l'innovation artistique et culturelle et le développement des talents",
    imageSrc: "/grandir.png",
    imageAlt: "logo grandir",
  },
  {
    title: "Eduquer",
    description:
      "Nous éduquons les jeunes à la culture africaine et congolaise",
    imageSrc: "/eduquer.png",
    imageAlt: "logo eduquer",
  },
  {
    title: "Célébrer",
    description: "Nous célébrons la culture africaine et congolaise",
    imageSrc: "/celebrer.png",
    imageAlt: "logo celebrer",
  },
];

