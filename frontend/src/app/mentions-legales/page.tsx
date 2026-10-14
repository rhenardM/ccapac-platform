import type { Metadata } from "next";
import { LegalSection, LegalShell } from "../components/legal/LegalShell";

export const metadata: Metadata = {
  title: "Mentions légales — CCAPAC",
  description:
    "Mentions légales du site du Centre Culturel et Artistique pour les Pays d'Afrique Centrale (CCAPAC) — Grand Tambour.",
};

export default function MentionsLegalesPage() {
  return (
    <LegalShell
      eyebrow="Informations légales"
      title="Mentions légales"
      updated="juin 2026"
      intro="Informations relatives à l'éditeur, à l'hébergement et aux conditions d'utilisation du présent site."
    >
      <LegalSection index={1} title="Éditeur du site">
        <p>
          Le présent site est édité par le{" "}
          <strong>
            Centre Culturel et Artistique pour les Pays d&apos;Afrique Centrale
            (CCAPAC) — Grand Tambour
          </strong>
          .
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Adresse : Boulevard Triomphal, Kinshasa, République Démocratique du Congo.</li>
          <li>
            Courriel :{" "}
            <a
              href="mailto:info@centreculturel.cd"
              className="font-semibold text-secondary hover:underline"
            >
              info@centreculturel.cd
            </a>
          </li>
          <li>Téléphone : +243 890 809 745</li>
          {/* <li>Forme juridique et numéro d&apos;identification : [à compléter].</li> */}
        </ul>
      </LegalSection>

      <LegalSection index={2} title="Directeur de la publication">
        <p>
          Le directeur de la publication est le représentant légal du CCAPAC :
          [Nom et qualité à compléter].
        </p>
      </LegalSection>

      <LegalSection index={3} title="Hébergement">
        <p>
          Le site est hébergé par [hébergeur à compléter — nom et adresse]. Les
          contenus éditoriaux (programmes, agenda, médias, actualités) sont gérés
          via une plateforme de gestion de contenu et servis depuis cet
          hébergeur.
        </p>
      </LegalSection>

      <LegalSection index={4} title="Propriété intellectuelle">
        <p>
          L&apos;ensemble des éléments du site (textes, photographies,
          illustrations, logos, identité visuelle, vidéos et documents) est la
          propriété du CCAPAC ou de ses partenaires, et est protégé par le droit
          d&apos;auteur et le droit des marques.
        </p>
        <p>
          Toute reproduction, représentation, modification ou diffusion, totale
          ou partielle, sans autorisation écrite préalable, est interdite et
          constitue une contrefaçon.
        </p>
      </LegalSection>

      <LegalSection index={5} title="Liens hypertextes">
        <p>
          Le site peut contenir des liens vers des sites tiers. Le CCAPAC
          n&apos;exerce aucun contrôle sur ces sites et décline toute
          responsabilité quant à leur contenu ou à l&apos;usage qui peut en être
          fait.
        </p>
      </LegalSection>

      <LegalSection index={6} title="Responsabilité">
        <p>
          Le CCAPAC s&apos;efforce d&apos;assurer l&apos;exactitude et la mise à
          jour des informations publiées. Il ne saurait toutefois être tenu
          responsable des erreurs, omissions ou indisponibilités temporaires du
          service.
        </p>
      </LegalSection>

      <LegalSection index={7} title="Données personnelles et cookies">
        <p>
          Le traitement de vos données personnelles est décrit dans notre{" "}
          <a
            href="/politique-de-confidentialite"
            className="font-semibold text-secondary hover:underline"
          >
            Politique de confidentialité
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection index={8} title="Contact">
        <p>
          Pour toute question relative au site ou aux présentes mentions, vous
          pouvez nous écrire à{" "}
          <a
            href="mailto:info@centreculturel.cd"
            className="font-semibold text-secondary hover:underline"
          >
            info@centreculturel.cd
          </a>
          .
        </p>
      </LegalSection>
    </LegalShell>
  );
}
