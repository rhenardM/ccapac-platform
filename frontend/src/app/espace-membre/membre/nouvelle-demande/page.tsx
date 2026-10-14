"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import {
  ArrowLeft,
  CheckCircle2,
  FileUp,
  Eye,
  FileText,
  Loader2,
  Send,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SpaceSelect from "@/components/space-requests/SpaceSelect";
import { getCcapacSpace } from "@/constants/spaces";
import api from "@/lib/api";
import {
  spaceRequestService,
  type BookedCalendarEvent,
  type ReservationSlot,
} from "@/services/spaceRequestService";

type CompatibleCalendarEvent = BookedCalendarEvent & {
  space_id?: number | string | null;
  space?: number | string | { id?: number | string | null } | null;
};

function getBookedSpaceId(
  event: BookedCalendarEvent
): number | null {
  const compatibleEvent = event as CompatibleCalendarEvent;
  const rawSpace =
    compatibleEvent.spaceId ??
    compatibleEvent.space_id ??
    compatibleEvent.space;
  const rawId =
    typeof rawSpace === "object" && rawSpace !== null
      ? rawSpace.id
      : rawSpace;
  const normalizedId = Number(rawId);

  return Number.isInteger(normalizedId) && normalizedId > 0
    ? normalizedId
    : null;
}

type FormValues = {
  fullName: string;
  address: string;
  phone: string;
  email: string;
  applicantRole: string;
  organizationName: string;
  legalStatus: string;
  organizationAddress: string;
  organizationPhone: string;
  organizationEmail: string;
  statutoryDirector: string;
  registrationNumber: string;
  eventName: string;
  eventDescription: string;
  otherObjective: string;
  desiredDate: string;
  setupStart: string;
  setupEnd: string;
  activityStart: string;
  activityEnd: string;
  teardownStart: string;
  teardownEnd: string;
  totalDays: string;
  participants: string;
  audienceProfile: string;
  operationalName: string;
  operationalPhone: string;
  operationalEmail: string;
  operationalOtherRole: string;
  technicalEquipment: "" | "yes" | "no";
  technicalNeeds: string;
  technicalSheet: "" | "attached" | "later";
  technicalStaff: string;
  securityAgents: string;
  publicStaff: string;
  emergencyPlan: string;
  insuranceSubscribed: "" | "yes" | "no";
  insuranceType: string;
  insuranceCompany: string;
  insurancePolicyNumber: string;
  insuranceStart: string;
  insuranceEnd: string;
  previousAuthorization: "" | "yes" | "no";
  previousAuthorizationDetails: string;
  catererUsed: "" | "yes" | "no";
  catererName: string;
  foodSales: "" | "yes" | "no";
  productSales: "" | "yes" | "no";
  otherServices: string;
};

type ApiErrorResponse = {
  message?: string;
  error?: string;
};

const objectives = [
  "Culturel / artistique",
  "Éducatif / pédagogique",
  "Institutionnel",
  "Citoyen / mémoriel",
  "Professionnel / corporatif",
];

const disciplines = [
  "Littérature et arts de l’oralité",
  "Musique",
  "Danse",
  "Théâtre et arts dramatiques",
  "Cinéma et audiovisuel",
  "Arts plastiques et visuels",
  "Photographie",
  "Architecture et urbanisme",
  "Mode et design vestimentaire",
  "Métiers d’art et artisanat",
  "Patrimoine culturel matériel",
  "Patrimoine culturel immatériel",
  "Arts culinaires et gastronomie congolaise",
  "Arts numériques et nouvelles technologies",
];

const operationalRoles = [
  "Coordinateur général",
  "Responsable technique",
  "Responsable sécurité / flux",
];

const initialValues: FormValues = {
  fullName: "",
  address: "",
  phone: "",
  email: "",
  applicantRole: "",
  organizationName: "",
  legalStatus: "",
  organizationAddress: "",
  organizationPhone: "",
  organizationEmail: "",
  statutoryDirector: "",
  registrationNumber: "",
  eventName: "",
  eventDescription: "",
  otherObjective: "",
  desiredDate: "",
  setupStart: "",
  setupEnd: "",
  activityStart: "",
  activityEnd: "",
  teardownStart: "",
  teardownEnd: "",
  totalDays: "",
  participants: "",
  audienceProfile: "",
  operationalName: "",
  operationalPhone: "",
  operationalEmail: "",
  operationalOtherRole: "",
  technicalEquipment: "",
  technicalNeeds: "",
  technicalSheet: "",
  technicalStaff: "",
  securityAgents: "",
  publicStaff: "",
  emergencyPlan: "",
  insuranceSubscribed: "",
  insuranceType: "",
  insuranceCompany: "",
  insurancePolicyNumber: "",
  insuranceStart: "",
  insuranceEnd: "",
  previousAuthorization: "",
  previousAuthorizationDetails: "",
  catererUsed: "",
  catererName: "",
  foodSales: "",
  productSales: "",
  otherServices: "",
};

function localDateValue() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value: string) {
  if (!value) return "Non renseigné";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function errorMessage(error: unknown) {
  if (isAxiosError<ApiErrorResponse>(error)) {
    return (
      error.response?.data?.message ||
      error.response?.data?.error ||
      (error.code === "ERR_NETWORK"
        ? "Impossible de contacter le serveur."
        : "Impossible d’envoyer la demande.")
    );
  }

  return error instanceof Error
    ? error.message
    : "Impossible d’envoyer la demande.";
}

function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#D1965B]/15 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-5 flex items-center gap-3 border-b border-[#D1965B]/15 pb-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#D1965B] text-sm font-bold text-white">
          {number}
        </span>
        <h2 className="text-lg font-bold text-[#5C4033]">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
  min,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  min?: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-[#5C4033]">
        {label}{required ? " *" : ""}
      </Label>
      <Input
        type={type}
        value={value}
        required={required}
        min={min}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="border-[#D1965B]/30 focus-visible:ring-[#D1965B]"
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  required = false,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  rows?: number;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-[#5C4033]">
        {label}{required ? " *" : ""}
      </Label>
      <textarea
        value={value}
        required={required}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-y rounded-md border border-[#D1965B]/30 bg-white px-3 py-2 text-sm text-[#5C4033] outline-none focus:border-[#D1965B] focus:ring-2 focus:ring-[#D1965B]/20"
      />
    </div>
  );
}

function YesNo({
  label,
  value,
  onChange,
}: {
  label: string;
  value: "" | "yes" | "no";
  onChange: (value: "yes" | "no") => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-[#5C4033]">
        {label}
      </legend>
      <div className="flex gap-5">
        {[
          ["yes", "Oui"],
          ["no", "Non"],
        ].map(([option, text]) => (
          <label
            key={option}
            className="flex cursor-pointer items-center gap-2 text-sm text-[#5C4033]/80"
          >
            <input
              type="radio"
              checked={value === option}
              onChange={() => onChange(option as "yes" | "no")}
              className="accent-[#D1965B]"
            />
            {text}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function NewRequestPage() {
  const router = useRouter();
  const minimumDate = useMemo(localDateValue, []);

  const [values, setValues] = useState<FormValues>(initialValues);
  const [space, setSpace] = useState(0);
  const [reservationSlots, setReservationSlots] = useState<
    ReservationSlot[]
  >([]);
  const [bookedEvents, setBookedEvents] = useState<
    BookedCalendarEvent[]
  >([]);
  const [loadingAvailability, setLoadingAvailability] =
    useState(true);
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([]);
  const [selectedOperationalRoles, setSelectedOperationalRoles] = useState<string[]>([]);
  const [authorizedRepresentative, setAuthorizedRepresentative] = useState(false);
  const [acceptedDeclarations, setAcceptedDeclarations] = useState(false);
  const [signature, setSignature] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [requestLetter, setRequestLetter] =
    useState<File | null>(null);

  /*
   * Le layout membre possède déjà son propre conteneur
   * de défilement. On masque donc le scroll externe du
   * navigateur pendant l'affichage de cette page afin
   * de ne conserver qu'une seule barre de défilement.
   */
  useEffect(() => {
    const pageDocument = globalThis.document;

    if (!pageDocument) {
      return;
    }

    const htmlElement =
      pageDocument.documentElement;
    const bodyElement = pageDocument.body;

    const previousHtmlOverflow =
      htmlElement.style.overflow;
    const previousBodyOverflow =
      bodyElement.style.overflow;

    htmlElement.style.overflow = "hidden";
    bodyElement.style.overflow = "hidden";

    return () => {
      htmlElement.style.overflow =
        previousHtmlOverflow;
      bodyElement.style.overflow =
        previousBodyOverflow;
    };
  }, []);

  /*
   * Synchronisation avec le calendrier des événements.
   *
   * Exemple d’URL reçue :
   * /espace-membre/membre/nouvelle-demande?date=2026-08-14&space=2
   */
  useEffect(() => {
    const query = new URLSearchParams(
      window.location.search
    );

    const storedSlots = sessionStorage.getItem(
      "ccapac-reservation-slots"
    );

    if (storedSlots) {
      try {
        const parsed = JSON.parse(storedSlots) as ReservationSlot[];
        const validSlots = Array.isArray(parsed)
          ? parsed
              .filter(
                (slot) =>
                  /^\d{4}-\d{2}-\d{2}$/.test(slot?.date) &&
                  slot.date >= minimumDate &&
                  Number.isInteger(Number(slot?.spaceId)) &&
                  Boolean(getCcapacSpace(Number(slot.spaceId)))
              )
              .map((slot) => ({
                date: slot.date,
                spaceId: Number(slot.spaceId),
              }))
              .filter(
                (slot, index, slots) =>
                  slots.findIndex(
                    (candidate) =>
                      candidate.date === slot.date &&
                      candidate.spaceId === slot.spaceId
                  ) === index
              )
              .slice(0, 30)
          : [];

        if (validSlots.length > 0) {
          setReservationSlots(validSlots);
          setValues((current) => ({
            ...current,
            desiredDate: validSlots[0].date,
            totalDays: String(
              new Set(validSlots.map((slot) => slot.date)).size
            ),
          }));
          setSpace(validSlots[0].spaceId);
          return;
        }
      } catch (error) {
        console.error("Invalid stored reservation slots:", error);
        sessionStorage.removeItem("ccapac-reservation-slots");
      }
    }

    const requestedDate = String(
      query.get("date") || ""
    ).trim();

    const requestedSpaceId = Number(
      query.get("space")
    );

    const validDate =
      /^\d{4}-\d{2}-\d{2}$/.test(
        requestedDate
      ) && requestedDate >= minimumDate;

    const validSpace =
      Number.isInteger(
        requestedSpaceId
      ) &&
      requestedSpaceId > 0 &&
      Boolean(
        getCcapacSpace(
          requestedSpaceId
        )
      );

    if (validDate) {
      setValues((current) => ({
        ...current,
        desiredDate: requestedDate,
      }));
    }

    if (validDate && validSpace) {
      setSpace(requestedSpaceId);
    }
  }, [minimumDate]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    let active = true;

    const loadAvailability = async () => {
      try {
        setLoadingAvailability(true);
        const data =
          await spaceRequestService.getBookedCalendarEvents();

        if (active) {
          setBookedEvents(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Availability loading error:", error);

        if (active) {
          setBookedEvents([]);
          toast.error(
            "Impossible de vérifier les espaces déjà réservés."
          );
        }
      } finally {
        if (active) {
          setLoadingAvailability(false);
        }
      }
    };

    void loadAvailability();

    return () => {
      active = false;
    };
  }, []);

  const unavailableSpaceIds = useMemo(() => {
    if (!values.desiredDate) {
      return [];
    }

    return Array.from(
      new Set(
        bookedEvents
          .filter(
            (event) =>
              event.date?.slice(0, 10) === values.desiredDate
          )
          .map(getBookedSpaceId)
          .filter((spaceId): spaceId is number => spaceId !== null)
      )
    );
  }, [bookedEvents, values.desiredDate]);

  const effectiveSlots = useMemo<ReservationSlot[]>(
    () =>
      reservationSlots.length > 0
        ? reservationSlots
        : values.desiredDate && space
          ? [{ date: values.desiredDate, spaceId: space }]
          : [],
    [reservationSlots, space, values.desiredDate]
  );

  const conflictingSlot = useMemo(
    () =>
      effectiveSlots.find((slot) =>
        bookedEvents.some(
          (event) =>
            event.date?.slice(0, 10) === slot.date &&
            getBookedSpaceId(event) === slot.spaceId
        )
      ),
    [bookedEvents, effectiveSlots]
  );

  useEffect(() => {
    if (space && unavailableSpaceIds.includes(space)) {
      setSpace(0);
      toast.warning(
        "L’espace sélectionné est déjà réservé pour cette date. Choisissez un autre espace."
      );
    }
  }, [space, unavailableSpaceIds]);

  const setField = <K extends keyof FormValues>(
    field: K,
    value: FormValues[K]
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const toggle = (
    value: string,
    selected: string[],
    setter: (values: string[]) => void
  ) => {
    setter(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value]
    );
  };

  const validateForm = () => {
    if (!values.fullName.trim()) return "Le nom complet est obligatoire.";
    if (!values.email.trim()) return "L’adresse email est obligatoire.";
    if (!values.phone.trim()) return "Le téléphone est obligatoire.";
    if (!values.eventName.trim()) return "L’intitulé de l’activité est obligatoire.";
    if (!values.eventDescription.trim()) return "La description de l’activité est obligatoire.";
    if (effectiveSlots.length === 0) {
      return "Sélectionnez au moins une date et un espace.";
    }
    if (conflictingSlot) {
      const occupiedSpace = getCcapacSpace(conflictingSlot.spaceId);
      return `${occupiedSpace?.name || "Cet espace"} est déjà réservé le ${formatDate(conflictingSlot.date)}.`;
    }
    if (!values.participants.trim()) return "Le nombre de participants est obligatoire.";
    if (!authorizedRepresentative) return "Vous devez certifier être habilité à introduire la demande.";
    if (!acceptedDeclarations) return "Vous devez accepter les déclarations et engagements.";
    if (!requestLetter) {
      return "La lettre de demande en format Word est obligatoire.";
    }
    return null;
  };

  const handleRequestLetter = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setRequestLetter(null);
      return;
    }

    const lowerName = file.name.toLowerCase();
    const isWordDocument =
      lowerName.endsWith(".doc") ||
      lowerName.endsWith(".docx");

    if (!isWordDocument) {
      event.target.value = "";
      setRequestLetter(null);
      toast.error(
        "La lettre de demande doit être un fichier Word DOC ou DOCX."
      );
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      event.target.value = "";
      setRequestLetter(null);
      toast.error(
        "La lettre de demande ne doit pas dépasser 10 Mo."
      );
      return;
    }

    setRequestLetter(file);
  };

  const generateCleanPdf = async (
    electronicSignature = ""
  ) => {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({
      unit: "mm",
      format: "a4",
      orientation: "portrait",
      compress: true,
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 16;
    const contentWidth = pageWidth - margin * 2;
    let pageNumber = 1;
    let y = 42;

    const drawHeader = () => {
      pdf.setFillColor(92, 64, 51);
      pdf.rect(0, 0, pageWidth, 31, "F");
      pdf.setFillColor(209, 150, 91);
      pdf.rect(0, 31, pageWidth, 2, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.text(
        "CCAPAC - GRAND TAMBOUR",
        pageWidth / 2,
        13,
        { align: "center" }
      );
      pdf.setFontSize(9.5);
      pdf.text(
        "FORMULAIRE DE DEMANDE D'UTILISATION DES SALLES ET ESPACES",
        pageWidth / 2,
        23,
        { align: "center" }
      );
      pdf.setTextColor(92, 64, 51);
    };

    const drawFooter = () => {
      pdf.setDrawColor(220, 210, 202);
      pdf.line(margin, 286, pageWidth - margin, 286);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.setTextColor(125, 110, 102);
      pdf.text(
        `CCAPAC - Grand Tambour | Page ${pageNumber}`,
        pageWidth / 2,
        291,
        { align: "center" }
      );
    };

    const newPage = () => {
      drawFooter();
      pdf.addPage("a4", "portrait");
      pageNumber += 1;
      drawHeader();
      y = 42;
    };

    const ensureSpace = (height: number) => {
      if (y + height > 282) {
        newPage();
      }
    };

    const wrappedLines = (
      text: string,
      width = contentWidth,
      size = 9
    ): string[] => {
      pdf.setFontSize(size);
      return pdf.splitTextToSize(
        String(text || "Non renseigné"),
        width
      );
    };

    const section = (title: string) => {
      ensureSpace(15);
      if (y > 44) y += 3;
      pdf.setFillColor(209, 150, 91);
      pdf.roundedRect(
        margin,
        y,
        contentWidth,
        10,
        2,
        2,
        "F"
      );
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(255, 255, 255);
      pdf.text(title, margin + 4, y + 6.4);
      pdf.setTextColor(92, 64, 51);
      y += 14;
    };

    const field = (
      label: string,
      value: string,
      options?: { compact?: boolean }
    ) => {
      const answer = String(value || "Non renseigné").trim();
      const answerLines = wrappedLines(
        answer || "Non renseigné",
        contentWidth - 8,
        8.5
      );
      const boxHeight = Math.max(
        options?.compact ? 7 : 9,
        answerLines.length * 4.2 + 4
      );
      const totalHeight = 5 + boxHeight + 3;
      ensureSpace(totalHeight);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8.5);
      pdf.setTextColor(70, 52, 43);
      pdf.text(label, margin, y + 3.2);
      y += 5;

      pdf.setFillColor(249, 246, 242);
      pdf.setDrawColor(224, 214, 206);
      pdf.roundedRect(
        margin,
        y,
        contentWidth,
        boxHeight,
        1.5,
        1.5,
        "FD"
      );
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      pdf.setTextColor(45, 45, 45);
      pdf.text(answerLines, margin + 4, y + 5);
      y += boxHeight + 3;
    };

    const optionsField = (
      label: string,
      options: string[],
      selected: string[]
    ) => {
      const optionLines = options.map(
        (option) =>
          `${selected.includes(option) ? "[X]" : "[ ]"} ${option}`
      );
      field(label, optionLines.join("\n"));
    };

    const yesNo = (
      label: string,
      value: "" | "yes" | "no"
    ) => {
      field(
        label,
        value === "yes"
          ? "[X] Oui     [ ] Non"
          : value === "no"
            ? "[ ] Oui     [X] Non"
            : "[ ] Oui     [ ] Non"
      );
    };

    const paragraph = (
      text: string,
      options?: {
        bold?: boolean;
        italic?: boolean;
        background?: boolean;
      }
    ) => {
      const lines = wrappedLines(text, contentWidth - 8, 8.5);
      const height = lines.length * 4.2 + 7;
      ensureSpace(height);

      if (options?.background) {
        pdf.setFillColor(255, 248, 235);
        pdf.setDrawColor(235, 204, 158);
        pdf.roundedRect(
          margin,
          y,
          contentWidth,
          height,
          2,
          2,
          "FD"
        );
      }

      pdf.setFont(
        "helvetica",
        options?.bold
          ? "bold"
          : options?.italic
            ? "italic"
            : "normal"
      );
      pdf.setFontSize(8.5);
      pdf.setTextColor(80, 63, 53);
      pdf.text(lines, margin + 4, y + 5);
      y += height + 3;
    };

    drawHeader();

    paragraph(
      "IMPORTANT : Le présent formulaire constitue un document pré-contractuel et un engagement sur l'honneur. Toute autorisation d'utilisation est subordonnée à sa validation par le CCAPAC - Grand Tambour et à la signature d'un accord ou contrat d'occupation temporaire annexé.",
      { bold: true, background: true }
    );

    section("I. IDENTIFICATION DU SOLLICITANT");
    field("Noms, post-nom et prénom", values.fullName);
    field("Adresse complète", values.address);
    field("Téléphone", values.phone, { compact: true });
    field("E-mail", values.email, { compact: true });
    field("Fonction / qualité", values.applicantRole);
    field(
      "Habilitation du signataire",
      authorizedRepresentative
        ? "[X] Le signataire certifie être habilité à engager juridiquement la personne physique ou morale."
        : "[ ] Non certifié"
    );

    section(
      "II. IDENTITÉ ET STATUT JURIDIQUE DE L'ORGANISATION"
    );
    field("Dénomination sociale", values.organizationName);
    field("Statut juridique", values.legalStatus);
    field("Adresse du siège", values.organizationAddress);
    field("Téléphone", values.organizationPhone);
    field("E-mail", values.organizationEmail);
    field(
      "Nom et adresse du dirigeant statutaire",
      values.statutoryDirector
    );
    field(
      "Numéro d'enregistrement / RCCM",
      values.registrationNumber
    );

    section("III. OBJET DE LA DEMANDE");
    field("Intitulé de l'activité / événement", values.eventName);
    field(
      "Description synthétique de l'activité",
      values.eventDescription
    );
    optionsField(
      "Objectifs principaux",
      objectives,
      selectedObjectives
    );
    field("Autre objectif / précision", values.otherObjective);

    section("IV. CALENDRIER PRÉVISIONNEL D'OCCUPATION");
    field(
      "Montage",
      `Du ${formatDate(values.setupStart)} au ${formatDate(values.setupEnd)}`
    );
    field(
      "Activités",
      `Du ${formatDate(values.activityStart || values.desiredDate)} au ${formatDate(values.activityEnd || values.desiredDate)}`
    );
    field(
      "Démontage / remise en état",
      `Du ${formatDate(values.teardownStart)} au ${formatDate(values.teardownEnd)}`
    );
    field(
      "Nombre total de jours d'occupation",
      values.totalDays
    );
    paragraph(
      "Tout changement de dates doit faire l'objet d'une demande écrite et d'une autorisation préalable du CCAPAC - Grand Tambour.",
      { italic: true }
    );

    section("V. SALLES / ESPACES SOLLICITÉS ET PUBLIC ATTENDU");
    field(
      "Espace sollicité",
      getCcapacSpace(space)?.name || String(space)
    );
    field(
      "Nombre estimé de participants / public",
      values.participants
    );
    field("Profil du public", values.audienceProfile);

    section("VI. RESPONSABLE OPÉRATIONNEL DE L'ACTIVITÉ");
    field("Noms, post-nom et prénom", values.operationalName);
    field("Téléphone", values.operationalPhone);
    field("E-mail", values.operationalEmail);
    optionsField(
      "Fonction dans le projet",
      operationalRoles,
      selectedOperationalRoles
    );
    field("Autre fonction", values.operationalOtherRole);

    section("VII. FICHE TECHNIQUE - BESOINS MATÉRIELS");
    yesNo(
      "Utilisation d'équipements techniques",
      values.technicalEquipment
    );
    field("Besoins techniques", values.technicalNeeds);
    field(
      "Fiche technique détaillée",
      values.technicalSheet === "attached"
        ? "[X] Jointe     [ ] À fournir avant validation"
        : values.technicalSheet === "later"
          ? "[ ] Jointe     [X] À fournir avant validation"
          : "Non renseigné"
    );
    field("Intervenants techniques", values.technicalStaff);

    section("VIII. SÉCURITÉ, ORGANISATION ET FLUX");
    field(
      "Nombre d'agents de sécurité prévus",
      values.securityAgents
    );
    field(
      "Nombre de salariés / bénévoles encadrant le public",
      values.publicStaff
    );
    field(
      "Dispositif de gestion des flux et d'urgence",
      values.emergencyPlan
    );

    section("IX. ASSURANCES (OBLIGATOIRE)");
    yesNo(
      "Police d'assurance responsabilité civile souscrite",
      values.insuranceSubscribed
    );
    field("Type d'assurance", values.insuranceType);
    field("Compagnie d'assurance", values.insuranceCompany);
    field("Numéro de police", values.insurancePolicyNumber);
    field(
      "Période de validité",
      `Du ${formatDate(values.insuranceStart)} au ${formatDate(values.insuranceEnd)}`
    );
    paragraph(
      "La production d'une attestation d'assurance valide est une condition essentielle à l'autorisation.",
      { bold: true, background: true }
    );

    section("X. ANTÉCÉDENTS AVEC LE CCAPAC - GRAND TAMBOUR");
    yesNo(
      "Autorisation antérieure d'utilisation des espaces",
      values.previousAuthorization
    );
    field(
      "Date, type d'événement et espaces précédemment utilisés",
      values.previousAuthorizationDetails
    );

    section("XI. PROPRIÉTÉ INTELLECTUELLE ET DROIT À L'IMAGE");
    paragraph(
      "Les œuvres, prestations et contenus artistiques demeurent la propriété de leurs auteurs. Toute captation audiovisuelle, retransmission, diffusion en direct ou différé et toute utilisation de l'image des espaces, bâtiments, logos ou marques du CCAPAC - Grand Tambour à des fins commerciales, promotionnelles ou médiatiques est soumise à une autorisation écrite préalable du Centre. Toute violation peut entraîner le retrait immédiat de l'autorisation, sans préjudice des poursuites et demandes de réparation."
    );

    section("XII. COMMUNICATION ET VISIBILITÉ");
    paragraph(
      "Le logo du CCAPAC - Grand Tambour et les mentions du Centre Culturel et Artistique pour les Pays de l'Afrique Centrale, 6-8 Boulevard Triomphal, Kasa-Vubu, Kinshasa, doivent figurer sur les supports relatifs à l'activité autorisée. Tout support comportant le nom, le logo ou l'image du Centre doit être soumis à validation préalable."
    );

    section("XIII. DISCIPLINES CULTURELLES CONCERNÉES");
    optionsField(
      "Disciplines sélectionnées",
      disciplines,
      selectedDisciplines
    );

    section("XIV. PRESTATIONS ANNEXES - TRAITEURS, VENTES, SERVICES");
    yesNo(
      "Utilisation d'un traiteur / prestataire",
      values.catererUsed
    );
    field("Nom du traiteur", values.catererName);
    yesNo(
      "Vente de boissons ou nourriture",
      values.foodSales
    );
    yesNo(
      "Vente de produits ou marchandises",
      values.productSales
    );
    field("Autres services", values.otherServices);

    section("XV. DROITS DU CCAPAC - GRAND TAMBOUR");
    paragraph(
      "Le CCAPAC - Grand Tambour conserve la priorité d'utilisation de ses espaces pour ses programmes et obligations de service public. Il peut refuser, suspendre ou annuler une demande en cas de non-conformité, de risque pour la sécurité ou d'atteinte à l'image de l'institution. Il n'accorde aucune remise sur les frais d'utilisation, sauf décision explicite de l'autorité compétente."
    );

    section("XVI. RESPONSABILITÉ - DÉCLARATIONS ET ENGAGEMENTS");
    paragraph(
      "Le sollicitant déclare sur l'honneur que toutes les informations fournies sont exactes et sincères; qu'il assume l'entière responsabilité civile de tout dommage causé aux personnes, aux biens ou aux installations; qu'il se conformera au règlement intérieur, aux normes de sécurité, aux consignes des services du Centre et au contrat d'occupation temporaire; et qu'il informera sans délai le Centre de tout changement significatif. Toute omission, fausse déclaration ou modification non autorisée pourra entraîner la nullité de l'accord et la mise en cause de sa responsabilité."
    );

    section("XVII. DROIT APPLICABLE ET COMPÉTENCE");
    paragraph(
      "Le présent formulaire et l'accord subséquent sont régis par le droit congolais. Tout litige relève des juridictions compétentes de la République Démocratique du Congo."
    );

    section("XVIII. SIGNATURE");
    field("Mention", "Lu et approuvé");
    field("Fait à", "Kinshasa");
    field(
      "Date",
      new Date().toLocaleDateString("fr-FR")
    );
    field(
      "Nom du sollicitant",
      electronicSignature || values.fullName
    );
    field(
      "Signature électronique",
      electronicSignature || "À confirmer avant l'envoi"
    );

    paragraph(
      acceptedDeclarations
        ? "[X] Le sollicitant certifie l'exactitude des informations et accepte l'ensemble des déclarations, responsabilités et engagements."
        : "[ ] Déclarations non encore acceptées.",
      { bold: true, background: true }
    );

    drawFooter();
    return pdf.output("blob");
  };

  const generateLegacyPdf = async (
    electronicSignature = ""
  ) => {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({
      unit: "mm",
      format: "a4",
      orientation: "portrait",
      compress: true,
    });

    const templateBase =
      "/documents/ccapac-form-template";

    const loadTemplatePage = async (
      pageNumber: number
    ): Promise<string> => {
      const response = await fetch(
        `${templateBase}/page-${pageNumber}.png`
      );

      if (!response.ok) {
        throw new Error(
          `Page ${pageNumber} du modèle PDF introuvable.`
        );
      }

      const blob = await response.blob();

      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () =>
          resolve(String(reader.result));
        reader.onerror = () =>
          reject(
            new Error(
              "Impossible de lire le modèle officiel."
            )
          );
        reader.readAsDataURL(blob);
      });
    };

    const templatePages = await Promise.all(
      Array.from({ length: 6 }, (_, index) =>
        loadTemplatePage(index + 1)
      )
    );

    templatePages.forEach((pageImage, index) => {
      if (index > 0) {
        pdf.addPage("a4", "portrait");
      }

      pdf.setPage(index + 1);
      pdf.addImage(
        pageImage,
        "PNG",
        0,
        0,
        210,
        297,
        `official-page-${index + 1}`,
        "FAST"
      );
    });

    type TextOptions = {
      size?: number;
      minSize?: number;
      bold?: boolean;
      maxLines?: number;
      align?: "left" | "center" | "right";
    };

    const writeValue = (
      page: number,
      x: number,
      y: number,
      width: number,
      height: number,
      value: string,
      options: TextOptions = {}
    ) => {
      const cleanValue = String(value || "").trim();

      if (!cleanValue) return;

      pdf.setPage(page);
      pdf.setFont(
        "helvetica",
        options.bold ? "bold" : "normal"
      );
      pdf.setTextColor(25, 25, 25);

      const horizontalPadding = 1.5;
      const verticalPadding = 1;
      const maximumLines = Math.max(
        1,
        options.maxLines || 4
      );
      const minimumSize = options.minSize || 5.5;
      let fontSize = options.size || 8.5;
      let lines: string[] = [];

      /*
       * La taille diminue jusqu'à ce que la réponse
       * entre entièrement dans la zone qui lui est réservée.
       * Aucun rectangle blanc n'est dessiné : les questions et
       * les bordures du formulaire officiel restent donc intactes.
       */
      while (fontSize >= minimumSize) {
        pdf.setFontSize(fontSize);
        const candidateLines = pdf.splitTextToSize(
          cleanValue,
          width - horizontalPadding * 2
        ) as string[];
        const lineHeight = fontSize * 0.3528 * 1.12;
        const fitsHeight =
          candidateLines.length * lineHeight <=
          height - verticalPadding * 2;

        if (
          candidateLines.length <= maximumLines &&
          fitsHeight
        ) {
          lines = candidateLines;
          break;
        }

        fontSize -= 0.25;
      }

      pdf.setFontSize(Math.max(fontSize, minimumSize));

      if (lines.length === 0) {
        lines = (
          pdf.splitTextToSize(
            cleanValue,
            width - horizontalPadding * 2
          ) as string[]
        ).slice(0, maximumLines);

        const completeLineCount = (
          pdf.splitTextToSize(
            cleanValue,
            width - horizontalPadding * 2
          ) as string[]
        ).length;

        if (
          completeLineCount > maximumLines &&
          lines.length > 0
        ) {
          const lastIndex = lines.length - 1;
          lines[lastIndex] = `${lines[lastIndex]
            .replace(/\s+$/, "")
            .replace(/[.,;:!?-]*$/, "")}…`;
        }
      }

      const lineHeight =
        Math.max(fontSize, minimumSize) * 0.3528 * 1.12;
      const textHeight = lines.length * lineHeight;
      const textY =
        y +
        Math.max(
          verticalPadding + lineHeight * 0.8,
          (height - textHeight) / 2 + lineHeight * 0.8
        );

      pdf.text(
        lines,
        options.align === "center"
          ? x + width / 2
          : options.align === "right"
            ? x + width - horizontalPadding
            : x + horizontalPadding,
        textY,
        {
          align: options.align || "left",
          baseline: "alphabetic",
          lineHeightFactor: 1.12,
        }
      );
    };

    const mark = (
      page: number,
      x: number,
      y: number,
      checked: boolean
    ) => {
      if (!checked) return;
      pdf.setPage(page);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(20, 20, 20);
      pdf.text("X", x, y);
    };

    const formatShortDate = (value: string) => {
      if (!value) return "";
      const [year, month, day] = value.split("-");
      return day && month && year
        ? `${day}/${month}/${year}`
        : value;
    };

    /* Page 1 — identification et organisation. */
    writeValue(1, 29, 106, 153, 5, values.fullName);
    writeValue(1, 29, 118, 153, 10, values.address, {
      maxLines: 2,
    });
    writeValue(1, 29, 135, 153, 5, values.phone);
    writeValue(1, 29, 146, 153, 5, values.email);
    writeValue(1, 29, 158, 153, 5, values.applicantRole);
    mark(1, 30.3, 166.2, authorizedRepresentative);

    writeValue(1, 29, 193, 153, 5, values.organizationName);
    writeValue(1, 29, 204, 153, 5, values.legalStatus);
    writeValue(1, 29, 216, 153, 10, values.organizationAddress, {
      maxLines: 2,
    });
    writeValue(1, 29, 233, 153, 5, values.organizationPhone);
    writeValue(1, 29, 244, 153, 5, values.organizationEmail);
    writeValue(1, 29, 256, 153, 10, values.statutoryDirector, {
      maxLines: 2,
    });
    writeValue(1, 29, 274, 153, 5, values.registrationNumber);

    /* Page 2 — projet, calendrier, espace et public. */
    writeValue(2, 29, 11, 153, 6, values.eventName, {
      bold: true,
    });
    writeValue(2, 29, 22, 153, 20, values.eventDescription, {
      size: 8,
      maxLines: 4,
    });

    mark(2, 30.2, 53.2, selectedObjectives.includes("Culturel / artistique"));
    mark(2, 82.5, 53.2, selectedObjectives.includes("Éducatif / pédagogique"));
    mark(2, 139.5, 53.2, selectedObjectives.includes("Institutionnel"));
    mark(2, 30.2, 59.2, selectedObjectives.includes("Citoyen / mémoriel"));
    mark(2, 101.2, 59.2, selectedObjectives.includes("Professionnel / corporatif"));
    writeValue(2, 43, 62, 139, 6, values.otherObjective);

    writeValue(
      2,
      29,
      79,
      153,
      5,
      `Du : ${formatShortDate(values.setupStart)}   Au : ${formatShortDate(values.setupEnd)}`
    );
    writeValue(
      2,
      29,
      91,
      153,
      5,
      `Du : ${formatShortDate(values.activityStart || values.desiredDate)}   Au : ${formatShortDate(values.activityEnd || values.desiredDate)}`
    );
    writeValue(
      2,
      29,
      103,
      153,
      5,
      `Du : ${formatShortDate(values.teardownStart)}   Au : ${formatShortDate(values.teardownEnd)}`
    );
    writeValue(2, 125, 112, 25, 5, values.totalDays, {
      align: "center",
    });

    const selectedSpace =
      getCcapacSpace(space)?.name || "";
    const normalizedSpace = selectedSpace
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    mark(2, 30.2, 137.8, normalizedSpace.includes("grand"));
    mark(2, 86.2, 137.8, normalizedSpace.includes("petit"));
    mark(2, 30.2, 149.4, normalizedSpace.includes("hall"));
    mark(2, 81.6, 149.4, normalizedSpace.includes("atrium"));
    mark(2, 30.2, 155.4, normalizedSpace.includes("caf"));
    mark(2, 81.6, 155.4, normalizedSpace.includes("danse"));
    mark(2, 30.2, 161.2, normalizedSpace.includes("musique"));

    const knownSpace = [
      "grand",
      "petit",
      "hall",
      "atrium",
      "caf",
      "danse",
      "musique",
    ].some((name) => normalizedSpace.includes(name));

    if (!knownSpace) {
      mark(2, 30.2, 167.1, Boolean(selectedSpace));
      writeValue(2, 56, 163, 126, 6, selectedSpace);
    }

    writeValue(2, 78, 174, 104, 6, values.participants);
    writeValue(2, 29, 187, 153, 11, values.audienceProfile, {
      maxLines: 2,
    });
    writeValue(2, 82, 207, 100, 6, values.operationalName);

    /* Page 3 — responsable, technique et sécurité. */
    writeValue(3, 29, 66, 153, 6, values.operationalPhone);
    writeValue(3, 29, 78, 153, 6, values.operationalEmail);
    mark(3, 29.3, 94.8, selectedOperationalRoles.includes("Coordinateur général"));
    mark(3, 81.3, 94.8, selectedOperationalRoles.includes("Responsable technique"));
    mark(3, 29.3, 100.8, selectedOperationalRoles.includes("Responsable sécurité / flux"));
    writeValue(3, 108, 96.5, 58, 6, values.operationalOtherRole);

    mark(3, 30.1, 174.5, values.technicalEquipment === "yes");
    mark(3, 48.2, 174.5, values.technicalEquipment === "no");
    writeValue(3, 29, 181, 153, 12, values.technicalNeeds, {
      maxLines: 2,
    });
    mark(3, 30.1, 204.2, values.technicalSheet === "attached");
    mark(3, 53.1, 204.2, values.technicalSheet === "later");
    writeValue(3, 29, 214, 153, 12, values.technicalStaff, {
      maxLines: 2,
    });
    writeValue(3, 29, 246, 153, 6, values.securityAgents);
    writeValue(3, 29, 258, 153, 6, values.publicStaff);
    writeValue(3, 29, 270, 153, 15, values.emergencyPlan, {
      size: 8,
      maxLines: 3,
    });

    /* Page 4 — assurances et antécédents. */
    mark(4, 30.1, 23.8, values.insuranceSubscribed === "yes");
    mark(4, 48.2, 23.8, values.insuranceSubscribed === "no");
    writeValue(4, 29, 30, 153, 6, values.insuranceType);
    writeValue(4, 29, 42, 153, 6, values.insuranceCompany);
    writeValue(4, 29, 54, 153, 6, values.insurancePolicyNumber);
    writeValue(
      4,
      29,
      66,
      153,
      6,
      `Date d’effet : ${formatShortDate(values.insuranceStart)}    Date d’échéance : ${formatShortDate(values.insuranceEnd)}`
    );
    mark(4, 30.1, 105.6, values.previousAuthorization === "yes");
    mark(4, 48.2, 105.6, values.previousAuthorization === "no");
    writeValue(4, 29, 117, 153, 13, values.previousAuthorizationDetails, {
      maxLines: 2,
    });

    /* Page 5 — disciplines et prestations annexes. */
    const disciplineCoordinates: Record<
      string,
      [number, number]
    > = {};

    disciplines.forEach((discipline, index) => {
      disciplineCoordinates[discipline] = [
        30.2,
        107.2 + index * 5.85,
      ];
    });

    selectedDisciplines.forEach((discipline) => {
      const coordinate =
        disciplineCoordinates[discipline];
      if (coordinate) {
        mark(5, coordinate[0], coordinate[1], true);
      }
    });

    mark(5, 29.3, 224.8, values.catererUsed === "yes");
    mark(5, 47.2, 224.8, values.catererUsed === "no");
    writeValue(5, 29, 230, 153, 6, values.catererName);
    mark(5, 112.5, 259.8, values.foodSales === "yes");
    mark(5, 130.3, 259.8, values.foodSales === "no");
    mark(5, 119.1, 266.0, values.productSales === "yes");
    mark(5, 136.9, 266.0, values.productSales === "no");
    writeValue(5, 56, 269, 126, 6, values.otherServices);

    /* Page 6 — signature. */
    const signatureName =
      electronicSignature || values.fullName;
    const currentDate = new Date().toLocaleDateString(
      "fr-FR"
    );

    writeValue(6, 110, 244, 45, 7, "Kinshasa", {
      align: "center",
    });
    writeValue(6, 164, 244, 22, 7, currentDate, {
      align: "center",
    });
    writeValue(6, 43, 274, 110, 7, signatureName, {
      bold: true,
    });
    writeValue(6, 43, 287, 110, 7, signatureName, {
      size: 11,
    });

    return pdf.output("blob");
  };

  const generateOfficialWord = async (
    electronicSignature = ""
  ) => {
    const selectedSpaceNames = Array.from(
      new Set(
        effectiveSlots
          .map((slot) => getCcapacSpace(slot.spaceId)?.name)
          .filter((name): name is string => Boolean(name))
      )
    ).join(", ");

    return spaceRequestService.generateWord({
      values,
      space: effectiveSlots[0]?.spaceId || space,
      selectedSpace:
        selectedSpaceNames || getCcapacSpace(space)?.name || "",
      selectedObjectives,
      selectedDisciplines,
      selectedOperationalRoles,
      authorizedRepresentative,
      acceptedDeclarations,
      electronicSignature,
      slots: effectiveSlots,
    });
  };

  /*
   * L'ancien générateur utilisant les images avec pointillés
   * reste disponible uniquement comme secours, mais il n'est plus
   * utilisé pour l'aperçu ni pour le document envoyé.
   */
  void generateLegacyPdf;
  void generateCleanPdf;

  const handlePreview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setGenerating(true);
      const blob = await generateOfficialWord();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
      setSignature(values.fullName.trim());
      setConfirmed(false);
      setPreviewOpen(true);
    } catch (error) {
      console.error("Word generation error:", error);
      toast.error("Impossible de générer le document Word.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSignAndSend = async () => {
    const cleanSignature = signature.trim();
    if (cleanSignature.length < 3) {
      toast.error("Saisissez votre nom complet comme signature.");
      return;
    }
    if (!confirmed) {
      toast.error("Confirmez l’exactitude des informations.");
      return;
    }
    if (!requestLetter) {
      toast.error(
        "Ajoutez la lettre de demande en format Word avant l’envoi."
      );
      return;
    }

    try {
      setSending(true);
      const signedBlob = await generateOfficialWord(
        cleanSignature
      );
      const wordFile = new File(
        [signedBlob],
        `Fiche-demande-CCAPAC-${Date.now()}.docx`,
        {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        }
      );

      const request = await spaceRequestService.create(
        {
          fullName: values.fullName.trim(),
          email: values.email.trim().toLowerCase(),
          phone: values.phone.trim(),
          eventName: values.eventName.trim(),
          space: effectiveSlots[0].spaceId,
          date: effectiveSlots[0].date,
          slots: effectiveSlots,
          participants: Number(values.participants) || 1,
          description: [
            `Demandeur : ${values.fullName.trim()}`,
            `Email : ${values.email.trim().toLowerCase()}`,
            `Téléphone : ${values.phone.trim()}`,
            "Créneaux demandés :",
            ...effectiveSlots.map((slot) =>
              `- ${formatDate(slot.date)} · ${getCcapacSpace(slot.spaceId)?.name || `Espace ${slot.spaceId}`}`
            ),
          ].join("\n"),
        },
        wordFile
      );

      const letterFormData = new FormData();
      letterFormData.append(
        "document",
        requestLetter,
        requestLetter.name
      );

      await api.post(
        `/space-requests/${request.id}/documents/request-letter`,
        letterFormData
      );

      await spaceRequestService.submit(request.id, cleanSignature);

      sessionStorage.removeItem("ccapac-reservation-slots");

      toast.success(
        "Le formulaire Word officiel et la lettre Word ont été transmis au Service des Programmes."
      );
      router.replace(`/espace-membre/membre/demandes/${request.id}`);
    } catch (error) {
      console.error("Request submission error:", error);
      toast.error(errorMessage(error));
    } finally {
      setSending(false);
    }
  };

  const checkboxList = (
    options: string[],
    selected: string[],
    setter: (values: string[]) => void
  ) => (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((option) => (
        <label
          key={option}
          className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#D1965B]/15 bg-[#FBF9F5] p-3 text-sm text-[#5C4033]"
        >
          <input
            type="checkbox"
            checked={selected.includes(option)}
            onChange={() => toggle(option, selected, setter)}
            className="mt-0.5 accent-[#D1965B]"
          />
          {option}
        </label>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 pb-10 text-[#5C4033]">
      <Link
        href="/espace-membre/membre"
        className="inline-flex items-center gap-2 text-sm font-medium text-[#D1965B] hover:text-[#B97D47]"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à l’accueil
      </Link>

      <header className="rounded-3xl bg-[#D1965B] p-6 text-white shadow-sm sm:p-9">
        <p className="text-sm font-semibold uppercase tracking-wider text-white/75">
          Demande d’occupation
        </p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
          Formulaire en ligne
        </h1>
        <p className="mt-3 max-w-3xl text-white/90">
          Remplissez les renseignements ci-dessous. Le document Word officiel sera rempli automatiquement avant l’envoi.
        </p>
      </header>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
        <strong>Important :</strong> ce formulaire constitue un document précontractuel et un engagement sur l’honneur. Le traitement dure généralement entre 3 jours et 1 semaine. Si la date demandée est occupée, une autre date disponible pourra être proposée.
      </div>

      <form onSubmit={handlePreview} className="space-y-6">
        <Section number="I" title="Identification du sollicitant">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Noms, post-nom et prénom" value={values.fullName} onChange={(value) => setField("fullName", value)} required />
            <Field label="Fonction / qualité" value={values.applicantRole} onChange={(value) => setField("applicantRole", value)} />
            <Field label="Adresse complète" value={values.address} onChange={(value) => setField("address", value)} />
            <Field label="Téléphone" value={values.phone} onChange={(value) => setField("phone", value)} required />
            <Field label="Email" type="email" value={values.email} onChange={(value) => setField("email", value)} required />
          </div>
          <label className="mt-5 flex items-start gap-3 rounded-xl bg-[#F3EEE5]/70 p-4 text-sm">
            <input type="checkbox" checked={authorizedRepresentative} onChange={(event) => setAuthorizedRepresentative(event.target.checked)} className="mt-1 accent-[#D1965B]" />
            Je certifie être habilité à engager juridiquement la personne physique ou morale concernée.
          </label>
        </Section>

        <Section number="II" title="Organisation (le cas échéant)">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Dénomination sociale" value={values.organizationName} onChange={(value) => setField("organizationName", value)} />
            <Field label="Statut juridique" value={values.legalStatus} onChange={(value) => setField("legalStatus", value)} placeholder="ASBL, entreprise, établissement public..." />
            <Field label="Adresse du siège" value={values.organizationAddress} onChange={(value) => setField("organizationAddress", value)} />
            <Field label="Téléphone" value={values.organizationPhone} onChange={(value) => setField("organizationPhone", value)} />
            <Field label="Email" type="email" value={values.organizationEmail} onChange={(value) => setField("organizationEmail", value)} />
            <Field label="Dirigeant statutaire" value={values.statutoryDirector} onChange={(value) => setField("statutoryDirector", value)} />
            <Field label="Numéro d’enregistrement / RCCM" value={values.registrationNumber} onChange={(value) => setField("registrationNumber", value)} />
          </div>
        </Section>

        <Section number="III" title="Objet de la demande">
          <div className="space-y-5">
            <Field label="Intitulé de l’activité / événement" value={values.eventName} onChange={(value) => setField("eventName", value)} required />
            <TextAreaField label="Description synthétique, programme et finalité" value={values.eventDescription} onChange={(value) => setField("eventDescription", value)} required />
            <div>
              <Label className="mb-3 block text-[#5C4033]">Objectifs principaux</Label>
              {checkboxList(objectives, selectedObjectives, setSelectedObjectives)}
            </div>
            <Field label="Autre objectif" value={values.otherObjective} onChange={(value) => setField("otherObjective", value)} />
          </div>
        </Section>

        <Section number="IV" title="Calendrier prévisionnel d’occupation">
          {reservationSlots.length > 0 && (
            <div className="mb-5 rounded-2xl border border-[#D1965B]/25 bg-[#F3EEE5]/70 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-bold text-[#5C4033]">
                    {reservationSlots.length} créneau
                    {reservationSlots.length > 1 ? "x" : ""} retenu
                    {reservationSlots.length > 1 ? "s" : ""}
                  </p>
                  <p className="mt-1 text-xs text-[#5C4033]/60">
                    Toutes ces dates seront enregistrées dans une seule demande.
                  </p>
                </div>
                <Button asChild type="button" variant="outline" size="sm">
                  <Link href="/espace-membre/membre/evenements">
                    Modifier la sélection
                  </Link>
                </Button>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {reservationSlots.map((slot) => (
                  <div
                    key={`${slot.date}-${slot.spaceId}`}
                    className="rounded-xl bg-white px-3 py-2 text-sm text-[#5C4033]"
                  >
                    <span className="font-semibold">
                      {formatDate(slot.date)}
                    </span>
                    <span className="text-[#5C4033]/55">
                      {" · "}
                      {getCcapacSpace(slot.spaceId)?.name || `Espace ${slot.spaceId}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="grid gap-5 md:grid-cols-2">
            {reservationSlots.length === 0 && (
              <Field label="Date souhaitée principale" type="date" min={minimumDate} value={values.desiredDate} onChange={(value) => setField("desiredDate", value)} required />
            )}
            <Field label="Nombre total de jours" type="number" value={values.totalDays} onChange={(value) => setField("totalDays", value)} />
            <Field label="Montage – début" type="date" value={values.setupStart} onChange={(value) => setField("setupStart", value)} />
            <Field label="Montage – fin" type="date" value={values.setupEnd} onChange={(value) => setField("setupEnd", value)} />
            <Field label="Activité – début" type="date" value={values.activityStart} onChange={(value) => setField("activityStart", value)} />
            <Field label="Activité – fin" type="date" value={values.activityEnd} onChange={(value) => setField("activityEnd", value)} />
            <Field label="Démontage – début" type="date" value={values.teardownStart} onChange={(value) => setField("teardownStart", value)} />
            <Field label="Démontage – fin" type="date" value={values.teardownEnd} onChange={(value) => setField("teardownEnd", value)} />
          </div>
        </Section>

        <Section number="V" title="Salle / espace sollicité et public attendu">
          <div className="grid gap-5 md:grid-cols-2">
            {reservationSlots.length === 0 && <div>
              <SpaceSelect
                value={space}
                onChange={setSpace}
                disabled={!values.desiredDate || loadingAvailability}
                unavailableSpaceIds={unavailableSpaceIds}
              />

              {!values.desiredDate && (
                <p className="mt-2 text-xs text-[#5C4033]/60">
                  Sélectionnez d’abord la date souhaitée pour afficher les espaces disponibles.
                </p>
              )}

              {loadingAvailability && (
                <p className="mt-2 text-xs font-medium text-[#D1965B]">
                  Vérification des disponibilités…
                </p>
              )}
            </div>}
            <Field label="Nombre estimé de participants" type="number" value={values.participants} onChange={(value) => setField("participants", value)} required />
            <div className="md:col-span-2">
              <TextAreaField label="Profil du public" value={values.audienceProfile} onChange={(value) => setField("audienceProfile", value)} rows={3} />
            </div>
          </div>
        </Section>

        <Section number="VI" title="Responsable opérationnel">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Nom complet" value={values.operationalName} onChange={(value) => setField("operationalName", value)} />
            <Field label="Téléphone pendant l’événement" value={values.operationalPhone} onChange={(value) => setField("operationalPhone", value)} />
            <Field label="Email" type="email" value={values.operationalEmail} onChange={(value) => setField("operationalEmail", value)} />
            <Field label="Autre fonction" value={values.operationalOtherRole} onChange={(value) => setField("operationalOtherRole", value)} />
          </div>
          <div className="mt-5">{checkboxList(operationalRoles, selectedOperationalRoles, setSelectedOperationalRoles)}</div>
        </Section>

        <Section number="VII" title="Fiche technique – besoins matériels">
          <div className="space-y-5">
            <YesNo label="Utilisation d’équipements techniques ?" value={values.technicalEquipment} onChange={(value) => setField("technicalEquipment", value)} />
            <TextAreaField label="Besoins en son, lumière, projection, scène ou autres" value={values.technicalNeeds} onChange={(value) => setField("technicalNeeds", value)} />
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Fiche technique détaillée</legend>
              <div className="flex flex-wrap gap-5 text-sm">
                <label className="flex gap-2"><input type="radio" checked={values.technicalSheet === "attached"} onChange={() => setField("technicalSheet", "attached")} className="accent-[#D1965B]" /> Jointe</label>
                <label className="flex gap-2"><input type="radio" checked={values.technicalSheet === "later"} onChange={() => setField("technicalSheet", "later")} className="accent-[#D1965B]" /> À fournir avant validation</label>
              </div>
            </fieldset>
            <TextAreaField label="Intervenants techniques internes / externes" value={values.technicalStaff} onChange={(value) => setField("technicalStaff", value)} rows={3} />
          </div>
        </Section>

        <Section number="VIII" title="Sécurité, organisation et flux">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Nombre d’agents de sécurité" type="number" value={values.securityAgents} onChange={(value) => setField("securityAgents", value)} />
            <Field label="Salariés / bénévoles encadrant le public" type="number" value={values.publicStaff} onChange={(value) => setField("publicStaff", value)} />
            <div className="md:col-span-2"><TextAreaField label="Dispositif de gestion des flux et d’urgence" value={values.emergencyPlan} onChange={(value) => setField("emergencyPlan", value)} /></div>
          </div>
        </Section>

        <Section number="IX" title="Assurances">
          <div className="space-y-5">
            <YesNo label="Une assurance responsabilité civile a-t-elle été souscrite ?" value={values.insuranceSubscribed} onChange={(value) => setField("insuranceSubscribed", value)} />
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Type d’assurance" value={values.insuranceType} onChange={(value) => setField("insuranceType", value)} />
              <Field label="Compagnie d’assurance" value={values.insuranceCompany} onChange={(value) => setField("insuranceCompany", value)} />
              <Field label="Numéro de police" value={values.insurancePolicyNumber} onChange={(value) => setField("insurancePolicyNumber", value)} />
              <Field label="Date d’effet" type="date" value={values.insuranceStart} onChange={(value) => setField("insuranceStart", value)} />
              <Field label="Date d’échéance" type="date" value={values.insuranceEnd} onChange={(value) => setField("insuranceEnd", value)} />
            </div>
          </div>
        </Section>

        <Section number="X" title="Antécédents avec le CCAPAC–Grand Tambour">
          <div className="space-y-5">
            <YesNo label="Avez-vous déjà bénéficié d’une autorisation ?" value={values.previousAuthorization} onChange={(value) => setField("previousAuthorization", value)} />
            <TextAreaField label="Date, événement et espaces utilisés" value={values.previousAuthorizationDetails} onChange={(value) => setField("previousAuthorizationDetails", value)} rows={3} />
          </div>
        </Section>

        <Section number="XI–XIII" title="Propriété intellectuelle, communication et disciplines">
          <p className="mb-5 text-sm leading-6 text-[#5C4033]/70">
            Toute captation, diffusion ou utilisation de l’image, du logo ou des espaces du CCAPAC–Grand Tambour est soumise à autorisation préalable. Sélectionnez les disciplines concernées.
          </p>
          {checkboxList(disciplines, selectedDisciplines, setSelectedDisciplines)}
        </Section>

        <Section number="XIV" title="Prestations annexes, ventes et services">
          <div className="space-y-5">
            <YesNo label="Utilisation d’un traiteur ?" value={values.catererUsed} onChange={(value) => setField("catererUsed", value)} />
            <Field label="Nom du traiteur" value={values.catererName} onChange={(value) => setField("catererName", value)} />
            <YesNo label="Vente de boissons ou nourriture ?" value={values.foodSales} onChange={(value) => setField("foodSales", value)} />
            <YesNo label="Vente de produits ou marchandises ?" value={values.productSales} onChange={(value) => setField("productSales", value)} />
            <Field label="Autres services" value={values.otherServices} onChange={(value) => setField("otherServices", value)} />
          </div>
        </Section>

        <Section number="XV–XVII" title="Droits, responsabilités et engagements">
          <div className="space-y-4 text-sm leading-6 text-[#5C4033]/75">
            <p>Le CCAPAC–Grand Tambour conserve la priorité d’utilisation de ses espaces et peut refuser, suspendre ou annuler une demande en cas de non-conformité ou de risque.</p>
            <p>Le sollicitant assume la responsabilité civile des dommages causés, s’engage à respecter le règlement intérieur, les normes de sécurité et à signaler tout changement important.</p>
            <p>Le formulaire et l’accord subséquent sont régis par le droit congolais.</p>
          </div>
          <label className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <input type="checkbox" checked={acceptedDeclarations} onChange={(event) => setAcceptedDeclarations(event.target.checked)} className="mt-1 accent-emerald-600" />
            Je certifie l’exactitude des informations et j’accepte l’ensemble des déclarations, responsabilités et engagements.
          </label>
        </Section>

        <Section number="XVIII" title="Documents obligatoires à transmettre">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-white p-2.5 text-emerald-700 shadow-sm">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-emerald-900">
                    Formulaire de réservation
                  </p>
                  <p className="mt-1 text-sm leading-6 text-emerald-800/75">
                    Le modèle Word officiel sera automatiquement rempli avec les informations de cette page.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-800">
                <CheckCircle2 className="h-4 w-4" />
                Génération automatique en Word
              </div>
            </div>

            <div
              className={`rounded-2xl border p-5 transition ${
                requestLetter
                  ? "border-blue-200 bg-blue-50"
                  : "border-amber-300 bg-amber-50"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-white p-2.5 text-blue-700 shadow-sm">
                  <FileUp className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-[#5C4033]">
                    Lettre de demande Word *
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[#5C4033]/65">
                    Ajoutez votre lettre adressée à la Direction du CCAPAC – Grand Tambour. Formats acceptés : DOC ou DOCX, maximum 10 Mo.
                  </p>
                </div>
              </div>

              {requestLetter ? (
                <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-white p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#5C4033]">
                      {requestLetter.name}
                    </p>
                    <p className="mt-0.5 text-xs text-[#5C4033]/55">
                      {(requestLetter.size / 1024 / 1024).toFixed(2)} Mo
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setRequestLetter(null)}
                    className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                    aria-label="Retirer la lettre de demande"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-amber-400 bg-white px-4 py-4 text-sm font-semibold text-[#9A5D2F] transition hover:bg-amber-50">
                  <FileUp className="h-5 w-5" />
                  Choisir la lettre Word
                  <input
                    type="file"
                    accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleRequestLetter}
                    className="sr-only"
                  />
                </label>
              )}
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-[#D1965B]/20 bg-[#FBF9F5] p-4 text-sm leading-6 text-[#5C4033]/75">
            <strong className="text-[#5C4033]">Envoi groupé :</strong>{" "}
            la demande ne sera transmise au Service des Programmes qu’après la création du formulaire Word officiel et l’ajout de la lettre Word.
          </div>
        </Section>

        <div className="sticky bottom-4 z-20 rounded-2xl border border-[#D1965B]/20 bg-white/95 p-4 shadow-xl backdrop-blur sm:flex sm:items-center sm:justify-between">
          <div className="mb-3 flex items-center gap-3 sm:mb-0">
            <FileText className="h-6 w-6 text-[#D1965B]" />
            <div>
              <p className="font-semibold">Votre formulaire officiel sera généré en Word</p>
              <p className="text-xs text-[#5C4033]/60">Vous pourrez le vérifier avant l’envoi.</p>
            </div>
          </div>
          <Button type="submit" disabled={generating || !requestLetter} className="w-full bg-[#D1965B] text-white hover:bg-[#B97D47] sm:w-auto">
            {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
            {generating
              ? "Génération..."
              : requestLetter
                ? "Générer le document Word"
                : "Ajoutez d’abord la lettre Word"}
          </Button>
        </div>
      </form>

      {previewOpen && previewUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-3 sm:p-6">
          <div className="flex max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-[#D1965B]/15 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold">Formulaire Word officiel généré</h2>
                <p className="text-xs text-[#5C4033]/60">Téléchargez-le et vérifiez les informations avant de signer.</p>
              </div>
              <button type="button" onClick={() => setPreviewOpen(false)} className="rounded-lg p-2 hover:bg-[#F3EEE5]" aria-label="Fermer"><X className="h-5 w-5" /></button>
            </header>

            <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="flex min-h-[52vh] items-center justify-center bg-[#F3EEE5]/60 p-6 lg:min-h-[75vh]">
                <div className="max-w-md rounded-2xl border border-[#D1965B]/20 bg-white p-8 text-center shadow-sm">
                  <FileText className="mx-auto h-14 w-14 text-[#D1965B]" />
                  <h3 className="mt-4 text-lg font-bold text-[#5C4033]">
                    Document Word prêt
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#5C4033]/65">
                    Word ne peut pas être affiché fidèlement dans le navigateur. Téléchargez le document pour le vérifier.
                  </p>
                  <a
                    href={previewUrl}
                    download="Fiche-demande-CCAPAC-remplie.docx"
                    className="mt-5 inline-flex rounded-xl bg-[#D1965B] px-5 py-3 text-sm font-semibold text-white hover:bg-[#B97D47]"
                  >
                    Télécharger le Word rempli
                  </a>
                </div>
              </div>

              <aside className="overflow-y-auto border-t border-[#D1965B]/15 p-5 lg:border-l lg:border-t-0">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                  En signant, vous certifiez sur l’honneur que les informations du Word sont exactes. La demande sera envoyée avec le formulaire officiel et la lettre Word « {requestLetter?.name} ».
                </div>

                <div className="mt-5 space-y-2">
                  <Label>Signature électronique *</Label>
                  <Input value={signature} onChange={(event) => setSignature(event.target.value)} placeholder="Votre nom complet" className="border-[#D1965B]/30" />
                  <div className="rounded-xl border border-dashed border-[#D1965B]/30 bg-[#FBF9F5] p-4 font-serif text-xl italic">{signature || "Votre signature apparaîtra ici"}</div>
                </div>

                <label className="mt-5 flex items-start gap-3 rounded-xl border border-[#D1965B]/15 p-4 text-sm">
                  <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1 accent-[#D1965B]" />
                  J’ai vérifié le document Word et j’accepte que mon nom constitue ma signature électronique.
                </label>

                <Button type="button" onClick={handleSignAndSend} disabled={sending} className="mt-5 w-full bg-[#D1965B] text-white hover:bg-[#B97D47]">
                  {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  {sending ? "Envoi des deux documents..." : "Signer et envoyer les deux documents"}
                </Button>

                <Button type="button" variant="outline" onClick={() => setPreviewOpen(false)} disabled={sending} className="mt-3 w-full border-[#D1965B]/30">
                  Modifier les informations
                </Button>
              </aside>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
