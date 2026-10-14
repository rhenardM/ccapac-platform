import type { Metadata } from "next";
import { LegalSection, LegalShell } from "../components/legal/LegalShell";

export const metadata: Metadata = {
  title: "Politique de confidentialité — CCAPAC",
  description:
    "Comment le Centre Culturel et Artistique pour les Pays d'Afrique Centrale (CCAPAC) collecte, utilise et protège vos données personnelles.",
};

export default function PolitiqueConfidentialitePage() {
  return (
    <LegalShell
      eyebrow="Protection des données"
      title="Politique de confidentialité"
      updated="juin 2026"
      intro="Nous attachons une grande importance à la protection de votre vie privée. Cette page explique quelles données nous collectons, pourquoi, et quels sont vos droits."
      image="/images/grand-tambour3.jpg"
    >
      <LegalSection index={1} title="Responsable du traitement">
        <p>
          Le responsable du traitement des données est le{" "}
          <strong>
            Centre Culturel et Artistique pour les Pays d&apos;Afrique Centrale
            (CCAPAC)
          </strong>
          , Boulevard Triomphal, Kinshasa (RDC). Pour toute question, écrivez à{" "}
          <a
            href="mailto:info@centreculturel.cd"
            className="font-semibold text-secondary hover:underline"
          >
            info@centreculturel.cd
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection index={2} title="Données que nous collectons">
        <p>Selon votre usage du site, nous pouvons collecter :</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Espace membre</strong> : nom, adresse e-mail, numéro de
            téléphone et identifiants de connexion (y compris via la connexion
            Google).
          </li>
          <li>
            <strong>Newsletter</strong> : votre adresse e-mail.
          </li>
          <li>
            <strong>Dons</strong> : nom ou organisation, e-mail, téléphone et
            montant du don.
          </li>
          <li>
            <strong>Inscriptions aux événements</strong> : informations
            nécessaires à votre participation.
          </li>
          <li>
            <strong>Données techniques</strong> : informations de navigation et
            cookies nécessaires au fonctionnement du site.
          </li>
        </ul>
      </LegalSection>

      <LegalSection index={3} title="Finalités du traitement">
        <p>Vos données sont utilisées pour :</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>gérer votre compte et l&apos;espace membre ;</li>
          <li>vous envoyer nos newsletters et communications, avec votre accord ;</li>
          <li>traiter vos dons et vous adresser une confirmation ;</li>
          <li>gérer vos inscriptions aux événements et activités ;</li>
          <li>assurer la sécurité et améliorer le fonctionnement du site.</li>
        </ul>
      </LegalSection>

      <LegalSection index={4} title="Base légale">
        <p>
          Les traitements reposent, selon les cas, sur votre consentement
          (newsletter), sur l&apos;exécution d&apos;un service que vous demandez
          (compte membre, don, inscription) et sur notre intérêt légitime à
          assurer le bon fonctionnement du site.
        </p>
      </LegalSection>

      <LegalSection index={5} title="Partage et prestataires">
        <p>
          Nous ne vendons pas vos données. Elles peuvent être traitées par des
          prestataires techniques agissant pour notre compte : hébergement et
          gestion de contenu, hébergement des médias et images, service
          d&apos;envoi d&apos;e-mails, et authentification (Google).
        </p>
        <p>
          Lorsque le paiement en ligne sera activé, il sera opéré par notre
          prestataire de paiement <strong>Makuta Cash</strong> (Wolf
          Technologies). Les informations de carte bancaire sont saisies sur la
          page sécurisée du prestataire :{" "}
          <strong>
            aucune donnée bancaire ne transite ni n&apos;est stockée par ce site
          </strong>
          .
        </p>
      </LegalSection>

      <LegalSection index={6} title="Durée de conservation">
        <p>
          Vos données sont conservées le temps nécessaire aux finalités
          ci-dessus, puis supprimées ou anonymisées. Les données de compte sont
          conservées tant que votre compte est actif ; vous pouvez en demander la
          suppression à tout moment.
        </p>
      </LegalSection>

      <LegalSection index={7} title="Vos droits">
        <p>
          Vous disposez d&apos;un droit d&apos;accès, de rectification, de
          suppression, d&apos;opposition et de retrait de votre consentement.
          Pour exercer ces droits, écrivez à{" "}
          <a
            href="mailto:info@centreculturel.cd"
            className="font-semibold text-secondary hover:underline"
          >
            info@centreculturel.cd
          </a>
          . Vous pouvez vous désabonner de la newsletter à tout moment via le
          lien présent dans chaque envoi.
        </p>
      </LegalSection>

      <LegalSection index={8} title="Cookies">
        <p>
          Le site utilise des cookies strictement nécessaires à son
          fonctionnement (session, authentification, fonctionnalités hors
          ligne/PWA). Vous pouvez configurer votre navigateur pour les refuser,
          ce qui peut limiter certaines fonctionnalités.
        </p>
      </LegalSection>

      <LegalSection index={9} title="Sécurité">
        <p>
          Nous mettons en œuvre des mesures techniques et organisationnelles
          raisonnables pour protéger vos données contre tout accès, altération ou
          divulgation non autorisés.
        </p>
      </LegalSection>

      <LegalSection index={10} title="Contact">
        <p>
          Pour toute question concernant cette politique ou le traitement de vos
          données, contactez-nous à{" "}
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
