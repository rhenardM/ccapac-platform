"use client";

import {
  Download,
  FileCheck2,
  FileSignature,
  FileText,
  Loader2,
  Scale,
  Sparkles,
  WalletCards,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import type {
  SpaceRequestDocument,
  SpaceRequestDocumentType,
} from "@/services/spaceRequestService";

type CompatibleDocument =
  SpaceRequestDocument & {
    document_type?: SpaceRequestDocumentType;
    documentType?: SpaceRequestDocumentType;
    document_name?: string;
    documentName?: string;
    document_path?: string;
    documentPath?: string;
    document_size?: number;
    documentSize?: number;
    uploaded_at?: string;
    uploadedAt?: string;
  };

type RequestDocumentsProps = {
  documents?:
    | CompatibleDocument[]
    | null;

  loading?: boolean;
  title?: string;
  emptyMessage?: string;
};

type DocumentConfiguration = {
  label: string;
  description: string;
  icon: typeof FileText;
  iconColor: string;
  iconBackground: string;
  badgeColor: string;
};

const API_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api"
).replace(/\/api\/?$/, "");

const documentConfiguration: Record<
  SpaceRequestDocumentType,
  DocumentConfiguration
> = {
  INITIAL_REQUEST: {
    label: "Formulaire officiel",
    description:
      "Formulaire rempli et transmis par le demandeur",
    icon: FileText,
    iconColor: "text-blue-700",
    iconBackground: "bg-blue-50",
    badgeColor:
      "bg-blue-50 text-blue-700",
  },

  REQUEST_LETTER: {
    label: "Lettre de demande",
    description:
      "Lettre de demande d’espace transmise par le demandeur",
    icon: FileSignature,
    iconColor: "text-sky-700",
    iconBackground: "bg-sky-50",
    badgeColor:
      "bg-sky-50 text-sky-700",
  },

  ARTISTIC_OPINION: {
    label: "Avis artistique",
    description:
      "Avis de la Direction artistique",
    icon: Sparkles,
    iconColor: "text-purple-700",
    iconBackground: "bg-purple-50",
    badgeColor:
      "bg-purple-50 text-purple-700",
  },

  LEGAL_DOCUMENT: {
    label: "Document juridique",
    description:
      "Document du Service juridique",
    icon: Scale,
    iconColor: "text-emerald-700",
    iconBackground: "bg-emerald-50",
    badgeColor:
      "bg-emerald-50 text-emerald-700",
  },

  FINANCE_QUOTE: {
    label: "Cotation financière",
    description:
      "Cotation du Service des Finances",
    icon: WalletCards,
    iconColor: "text-amber-700",
    iconBackground: "bg-amber-50",
    badgeColor:
      "bg-amber-50 text-amber-700",
  },

  PAYMENT_PROOF: {
    label: "Preuve de paiement",
    description:
      "Document de paiement transmis par le demandeur",
    icon: FileCheck2,
    iconColor: "text-green-700",
    iconBackground: "bg-green-50",
    badgeColor:
      "bg-green-50 text-green-700",
  },
};

const fallbackConfiguration: DocumentConfiguration =
  {
    label: "Document",
    description:
      "Document associé à la demande",
    icon: FileText,
    iconColor: "text-[#D1965B]",
    iconBackground:
      "bg-[#D1965B]/10",
    badgeColor:
      "bg-[#D1965B]/10 text-[#D1965B]",
  };

function getDocumentUrl(
  value?: string | null
) {
  if (!value) {
    return null;
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    return value;
  }

  return `${API_ORIGIN}${
    value.startsWith("/")
      ? value
      : `/${value}`
  }`;
}

function formatFileSize(
  size?: number | null
) {
  if (
    typeof size !== "number" ||
    !Number.isFinite(size) ||
    size <= 0
  ) {
    return "Taille inconnue";
  }

  if (size < 1024) {
    return `${size} octets`;
  }

  if (size < 1024 * 1024) {
    return `${(
      size / 1024
    ).toFixed(1)} Ko`;
  }

  return `${(
    size /
    1024 /
    1024
  ).toFixed(2)} Mo`;
}

function formatDate(
  value?: string | null
) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString(
    "fr-FR",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function getDocumentType(
  document: CompatibleDocument
): SpaceRequestDocumentType | null {
  const possibleType =
    document.type ||
    document.documentType ||
    document.document_type;

  if (
    possibleType &&
    possibleType in
      documentConfiguration
  ) {
    return possibleType;
  }

  return null;
}

function getDocumentName(
  document: CompatibleDocument
) {
  return (
    document.name ||
    document.documentName ||
    document.document_name ||
    "Document sans nom"
  );
}

function getDocumentPath(
  document: CompatibleDocument
) {
  return (
    document.url ||
    document.documentPath ||
    document.document_path ||
    null
  );
}

function getDocumentSize(
  document: CompatibleDocument
) {
  const size =
    document.size ??
    document.documentSize ??
    document.document_size;

  return typeof size === "number"
    ? size
    : 0;
}

function getUploadedDate(
  document: CompatibleDocument
) {
  return (
    document.uploadedAt ||
    document.uploaded_at ||
    null
  );
}

function getUploaderName(
  document: CompatibleDocument
) {
  const fullName = [
    document.uploadedBy?.firstName,
    document.uploadedBy?.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    fullName ||
    document.uploadedBy?.email ||
    null
  );
}

export default function RequestDocuments({
  documents,
  loading = false,
  title = "Documents du dossier",
  emptyMessage =
    "Aucun document disponible.",
}: RequestDocumentsProps) {
  /*
   * Cette protection empêche l’erreur :
   * Cannot read properties of undefined
   * (reading 'length').
   */
  const safeDocuments:
    CompatibleDocument[] =
    Array.isArray(documents)
      ? documents.filter(Boolean)
      : [];

  if (loading) {
    return (
      <Card className="border-[#D1965B]/15 bg-white shadow-sm">
        <CardContent className="flex min-h-48 items-center justify-center p-6">
          <div className="text-center">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#D1965B]" />

            <p className="mt-3 text-sm text-[#5C4033]/60">
              Chargement des documents...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const documentCount =
    safeDocuments.length;

  return (
    <Card className="overflow-hidden border-[#D1965B]/15 bg-white shadow-sm">
      <CardContent className="p-0">
        <div className="flex items-center justify-between border-b border-[#D1965B]/10 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-bold text-[#5C4033]">
              {title}
            </h2>

            <p className="mt-1 text-sm text-[#5C4033]/55">
              {documentCount === 0
                ? "Aucun fichier"
                : `${documentCount} document${
                    documentCount > 1
                      ? "s"
                      : ""
                  } disponible${
                    documentCount > 1
                      ? "s"
                      : ""
                  }`}
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D1965B]/10">
            <FileCheck2 className="h-5 w-5 text-[#D1965B]" />
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {documentCount === 0 ? (
            <div className="rounded-xl border border-dashed border-[#D1965B]/25 bg-[#F8F5EF] px-5 py-10 text-center">
              <FileText className="mx-auto h-9 w-9 text-[#D1965B]/45" />

              <p className="mt-3 text-sm text-[#5C4033]/60">
                {emptyMessage}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {safeDocuments.map(
                (
                  document,
                  index
                ) => {
                  const type =
                    getDocumentType(
                      document
                    );

                  const configuration =
                    type
                      ? documentConfiguration[
                          type
                        ]
                      : fallbackConfiguration;

                  const Icon =
                    configuration.icon;

                  const name =
                    getDocumentName(
                      document
                    );

                  const path =
                    getDocumentPath(
                      document
                    );

                  const url =
                    getDocumentUrl(path);

                  const size =
                    getDocumentSize(
                      document
                    );

                  const uploadedDate =
                    formatDate(
                      getUploadedDate(
                        document
                      )
                    );

                  const uploaderName =
                    getUploaderName(
                      document
                    );

                  const documentKey =
                    document.id ||
                    `${type || "DOCUMENT"}-${name}-${index}`;

                  return (
                    <article
                      key={documentKey}
                      className="group flex min-w-0 flex-col rounded-2xl border border-[#D1965B]/15 bg-white p-4 transition duration-200 hover:-translate-y-0.5 hover:border-[#D1965B]/35 hover:shadow-md"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${configuration.iconBackground}`}
                        >
                          <Icon
                            className={`h-5 w-5 ${configuration.iconColor}`}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${configuration.badgeColor}`}
                          >
                            {
                              configuration.label
                            }
                          </span>

                          <h3
                            className="mt-2 line-clamp-2 min-h-10 break-words text-sm font-semibold leading-5 text-[#5C4033]"
                            title={name}
                          >
                            {name}
                          </h3>
                        </div>
                      </div>

                      <p className="mt-3 line-clamp-2 min-h-10 text-xs leading-5 text-[#5C4033]/55">
                        {
                          configuration.description
                        }
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#5C4033]/45">
                        <span>
                          {formatFileSize(
                            size
                          )}
                        </span>

                        {uploadedDate && (
                          <>
                            <span aria-hidden="true">
                              •
                            </span>

                            <span>
                              {uploadedDate}
                            </span>
                          </>
                        )}
                      </div>

                      {uploaderName && (
                        <p className="mt-2 truncate text-xs text-[#5C4033]/50">
                          Ajouté par{" "}
                          <span className="font-medium text-[#5C4033]/70">
                            {uploaderName}
                          </span>
                        </p>
                      )}

                      <div className="mt-auto pt-4">
                        {url ? (
                          <Button
                            asChild
                            variant="outline"
                            className="w-full border-[#D1965B]/25 text-[#5C4033] hover:border-[#D1965B]/50 hover:bg-[#F8F5EF]"
                          >
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={name}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Télécharger
                            </a>
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            disabled
                            className="w-full border-[#D1965B]/15 text-[#5C4033]/40"
                          >
                            Fichier indisponible
                          </Button>
                        )}
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}