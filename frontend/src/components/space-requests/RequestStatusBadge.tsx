interface RequestStatusBadgeProps {
  status: string;
}

type StatusConfig = {
  label: string;
  className: string;
};

const blue =
  "border-blue-200 bg-blue-100 text-blue-700";
const purple =
  "border-purple-200 bg-purple-100 text-purple-700";
const fuchsia =
  "border-fuchsia-200 bg-fuchsia-100 text-fuchsia-700";
const cyan =
  "border-cyan-200 bg-cyan-100 text-cyan-700";
const amber =
  "border-amber-200 bg-amber-100 text-amber-700";
const indigo =
  "border-indigo-200 bg-indigo-100 text-indigo-700";
const emerald =
  "border-emerald-200 bg-emerald-100 text-emerald-700";
const orange =
  "border-orange-200 bg-orange-100 text-orange-700";
const green =
  "border-green-200 bg-green-100 text-green-700";
const red =
  "border-red-200 bg-red-100 text-red-700";
const gray =
  "border-gray-200 bg-gray-100 text-gray-700";

const statusConfig: Record<string, StatusConfig> = {
  draft: { label: "Brouillon", className: gray },
  submitted: { label: "Demande soumise", className: blue },
  program_review: {
    label: "Examen initial par le Programme",
    className: blue,
  },
  artistic_initial_review: {
    label: "Préparation de l’avis artistique",
    className: fuchsia,
  },
  program_review_after_artistic: {
    label: "Avis artistique retourné au Programme",
    className: blue,
  },
  awaiting_member_confirmation: {
    label: "Décision du membre requise",
    className: amber,
  },
  program_review_after_confirmation: {
    label: "Confirmation retournée au Programme",
    className: blue,
  },
  artistic_final_review: {
    label: "Validation artistique finale",
    className: fuchsia,
  },
  parallel_communication_regisseur_review: {
    label: "Validation Communication et Régisseur",
    className: cyan,
  },
  program_review_after_parallel: {
    label: "Validations retournées au Programme",
    className: blue,
  },
  program_review_after_regisseur_rejection: {
    label: "Refus du Régisseur à traiter",
    className: red,
  },
  legal_review: {
    label: "Examen du Service juridique",
    className: indigo,
  },
  finance_cotation: {
    label: "Préparation de la cotation",
    className: emerald,
  },
  program_review_after_finance: {
    label: "Cotation retournée au Programme",
    className: orange,
  },
  awaiting_payment_proof: {
    label: "En attente de la preuve de paiement",
    className: amber,
  },
  program_payment_review: {
    label: "Vérification du paiement par le Programme",
    className: blue,
  },
  correction_requested: {
    label: "Correction requise sous 5 jours",
    className: orange,
  },
  expired: {
    label: "Délai de correction expiré",
    className: red,
  },
  stopped_by_member: {
    label: "Processus arrêté par le membre",
    className: red,
  },
  completed: {
    label: "Traitement terminé — date confirmée",
    className: green,
  },

  /* Compatibilité avec les anciennes demandes. */
  general_review: {
    label: "En attente du Régisseur général",
    className: purple,
  },
  artistic_review: {
    label: "En attente de la Direction artistique",
    className: fuchsia,
  },
  communication_review: {
    label: "En attente de Communication",
    className: cyan,
  },
  program_review_after_legal: {
    label: "Retour du Juridique au Programme",
    className: blue,
  },
  rejected: {
    label: "Demande refusée",
    className: red,
  },
};

function formatUnknownStatus(status: string): string {
  if (!status) return "Statut inconnu";

  const formatted = status.replaceAll("_", " ").trim();
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export default function RequestStatusBadge({
  status,
}: RequestStatusBadgeProps) {
  const normalizedStatus = String(status || "")
    .trim()
    .toLowerCase();

  const config = statusConfig[normalizedStatus] ?? {
    label: formatUnknownStatus(normalizedStatus),
    className: gray,
  };

  return (
    <span
      className={`inline-flex max-w-full rounded-full border px-3 py-1 text-center text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}