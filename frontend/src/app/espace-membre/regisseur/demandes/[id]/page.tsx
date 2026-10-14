"use client";

import WorkflowRequestDetail from "@/components/space-requests/WorkflowRequestDetail";

export default function RegisseurRequestDetailPage() {
  return (
    <WorkflowRequestDetail
      role="REGISSEUR_GENERAL"
      title="Examen du Régisseur général"
      subtitle="Examinez les informations de la demande. Vous pouvez signer la validation ou refuser avec un motif signé ; 
      tout refus retourne d’abord au Programme."
      backHref="/espace-membre/regisseur/demandes"
    />
  );
}