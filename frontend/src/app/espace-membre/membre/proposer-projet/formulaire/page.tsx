"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  FileText,
  Lightbulb,
  Loader2,
  Paperclip,
  Send,
  Sparkles,
  Target,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

const PROJECT_CATEGORIES = [
  "Musique",
  "Danse",
  "Théâtre",
  "Spectacle vivant",
  "Arts visuels",
  "Cinéma et audiovisuel",
  "Littérature",
  "Création numérique",
  "Patrimoine",
  "Projet interdisciplinaire",
  "Autre",
];

const SUPPORT_OPTIONS = [
  "Infrastructures",
  "Expertise culturelle et artistique",
  "Communication et marketing",
  "Support technique",
  "Régie professionnelle",
];

const inputClass =
  "mt-2 h-12 w-full rounded-xl border border-[#ded4cc] bg-white px-4 text-sm text-[#3f2c22] outline-none transition placeholder:text-[#a99b92] focus:border-[#d1965b] focus:ring-4 focus:ring-[#d1965b]/10";

const textareaClass =
  "mt-2 min-h-32 w-full resize-y rounded-xl border border-[#ded4cc] bg-white px-4 py-3 text-sm leading-6 text-[#3f2c22] outline-none transition placeholder:text-[#a99b92] focus:border-[#d1965b] focus:ring-4 focus:ring-[#d1965b]/10";

const initialForm = {
  title: "",
  category: "",
  summary: "",
  intentionNote: "",
  objectives: "",
  plannedActivities: "",
  targetAudience: "",
  expectedImpact: "",
  preferredLocation: "",
  startDate: "",
  endDate: "",
  estimatedParticipants: "",
  estimatedBudget: "",
  technicalNeeds: "",
  partners: "",
  team: "",
  previousWork: "",
  additionalInformation: "",
  electronicSignature: "",
};

type ProjectForm = typeof initialForm;

function getErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      }
    ).response;

    if (response?.data?.message) {
      return response.data.message;
    }
  }

  return error instanceof Error
    ? error.message
    : "Impossible d’envoyer la proposition.";
}

export default function ProposerProjetPage() {
  const { user } = useAuth();

  const [form, setForm] =
    useState<ProjectForm>(initialForm);

  const [
    supportRequested,
    setSupportRequested,
  ] = useState<string[]>([]);

  const [
    projectDocument,
    setProjectDocument,
  ] = useState<File | null>(null);

  const [
    declarationAccepted,
    setDeclarationAccepted,
  ] = useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [submitted, setSubmitted] =
    useState(false);

  const memberName = useMemo(
    () =>
      `${user?.first_name || ""} ${
        user?.last_name || ""
      }`.trim() || "Membre",
    [user]
  );

  function updateField<
    K extends keyof ProjectForm,
  >(
    field: K,
    value: ProjectForm[K]
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function toggleSupport(option: string) {
    setSupportRequested((previous) =>
      previous.includes(option)
        ? previous.filter(
            (item) => item !== option
          )
        : [...previous, option]
    );
  }

  function handleDocument(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0] || null;

    if (!file) {
      setProjectDocument(null);
      return;
    }

    const allowedExtensions = [
      ".pdf",
      ".doc",
      ".docx",
    ];

    const fileName =
      file.name.toLowerCase();

    if (
      !allowedExtensions.some(
        (extension) =>
          fileName.endsWith(extension)
      )
    ) {
      toast.error(
        "Seuls les fichiers PDF, DOC et DOCX sont autorisés."
      );

      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error(
        "Le document ne doit pas dépasser 10 Mo."
      );

      event.target.value = "";
      return;
    }

    setProjectDocument(file);
  }

  function validateForm() {
    if (form.title.trim().length < 3) {
      return "Le titre du projet est obligatoire.";
    }

    if (!form.category) {
      return "Sélectionnez un domaine culturel.";
    }

    if (
      form.summary.trim().length < 30
    ) {
      return "La présentation du projet doit contenir au moins 30 caractères.";
    }

    if (
      form.intentionNote.trim().length <
      20
    ) {
      return "La note d’intention doit contenir au moins 20 caractères.";
    }

    if (
      form.objectives.trim().length < 20
    ) {
      return "Précisez les objectifs du projet.";
    }

    if (
      form.plannedActivities.trim()
        .length < 20
    ) {
      return "Présentez les activités envisagées.";
    }

    if (!form.targetAudience.trim()) {
      return "Précisez le public cible.";
    }

    if (
      !form.startDate ||
      !form.endDate
    ) {
      return "Précisez le calendrier prévisionnel du projet.";
    }

    if (
      form.endDate < form.startDate
    ) {
      return "La date de fin doit être postérieure ou égale à la date de début.";
    }

    if (
      !form.estimatedBudget.trim()
    ) {
      return "Précisez le budget prévisionnel du projet.";
    }

    if (
      form.technicalNeeds.trim()
        .length < 10
    ) {
      return "Précisez les besoins techniques et logistiques du projet.";
    }

    if (
      form.team.trim().length < 20
    ) {
      return "Présentez le porteur du projet ou la structure responsable.";
    }

    if (
      supportRequested.length === 0
    ) {
      return "Sélectionnez au moins un accompagnement souhaité.";
    }

    if (
      form.electronicSignature.trim()
        .length < 3
    ) {
      return "La signature électronique est obligatoire.";
    }

    if (!declarationAccepted) {
      return "Vous devez accepter la déclaration sur l’honneur.";
    }

    return null;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const validationError =
      validateForm();

    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setSubmitting(true);

      const payload = new FormData();

      Object.entries(form).forEach(
        ([key, value]) => {
          payload.append(
            key,
            value.trim()
          );
        }
      );

      payload.append(
        "supportRequested",
        JSON.stringify(
          supportRequested
        )
      );

      if (projectDocument) {
        payload.append(
          "document",
          projectDocument,
          projectDocument.name
        );
      }

      await api.post(
        "/project-proposals",
        payload
      );

      setSubmitted(true);

      toast.success(
        "Votre proposition de projet a été envoyée."
      );
    } catch (error) {
      toast.error(
        getErrorMessage(error)
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
  return (
    <div className="mx-auto max-w-3xl py-8">
      <div className="rounded-[28px] border border-emerald-200 bg-white p-7 text-center shadow-sm sm:p-12">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        </div>

        <h1 className="mt-6 text-2xl font-bold text-[#3f2c22] sm:text-3xl">
          Proposition envoyée
        </h1>

        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#75665d]">
          Merci {memberName}. Votre proposition a bien été
          transmise à la Direction artistique du CCAPAC Grand
          Tambour. Elle sera examinée en fonction de sa qualité,
          de sa pertinence, de son impact et de sa faisabilité.
          Vous pouvez suivre son évolution depuis votre espace
          membre.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
          <Button
            asChild
            className="bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <Link href="/espace-membre/membre/propositions">
              <FileText className="mr-2 h-4 w-4" />
              Suivre ma proposition
            </Link>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setForm(initialForm);
              setSupportRequested([]);
              setProjectDocument(null);
              setDeclarationAccepted(false);
              setSubmitted(false);
            }}
            className="border-[#d1965b] text-[#a96835] hover:bg-[#fbf3ec]"
          >
            Proposer un autre projet
          </Button>

          <Button asChild variant="ghost">
            <Link href="/espace-membre/membre/proposer-projet">
              Retour à l&apos;appel à projets
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <Link
        href="/espace-membre/membre/proposer-projet"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#7d624f] transition hover:text-[#d1965b]"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à la présentation
      </Link>

      <header className="relative overflow-hidden rounded-[30px] bg-[#3f2c22] p-6 text-white shadow-lg sm:p-9">
        <div className="absolute -right-14 -top-16 h-52 w-52 rounded-full bg-[#d1965b]/25 blur-3xl" />

        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#f0c79f]">
            <Sparkles className="h-4 w-4" />
            Appel à projets
          </div>

          <h1 className="mt-5 text-3xl font-black sm:text-4xl">
            Soumettre un projet culturel ou
            artistique
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
            Constituez le dossier décrit dans
            l’appel à projets du CCAPAC Grand
            Tambour. Les informations
            recueillies permettront d’évaluer
            la qualité, l’originalité, la
            pertinence, l’impact et la
            faisabilité de votre initiative.
          </p>
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        <section className="rounded-[26px] border border-[#e7ded7] bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-start gap-3 border-b border-[#eee7e2] pb-5">
            <div className="rounded-xl bg-[#f6e9df] p-2.5 text-[#a76535]">
              <Lightbulb className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#3f2c22]">
                Présentation générale du projet
              </h2>

              <p className="mt-1 text-sm text-[#86766c]">
                Présentez clairement votre
                initiative artistique ou
                culturelle.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label className="text-sm font-semibold text-[#4d3b32]">
              Titre du projet{" "}
              <span className="text-red-500">
                *
              </span>

              <input
                value={form.title}
                onChange={(event) =>
                  updateField(
                    "title",
                    event.target.value
                  )
                }
                placeholder="Ex. Festival des jeunes talents"
                className={inputClass}
              />
            </label>

            <label className="text-sm font-semibold text-[#4d3b32]">
              Domaine culturel{" "}
              <span className="text-red-500">
                *
              </span>

              <select
                value={form.category}
                onChange={(event) =>
                  updateField(
                    "category",
                    event.target.value
                  )
                }
                className={inputClass}
              >
                <option value="">
                  Sélectionner un domaine
                </option>

                {PROJECT_CATEGORIES.map(
                  (category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  )
                )}
              </select>
            </label>

            <label className="text-sm font-semibold text-[#4d3b32] md:col-span-2">
              Présentation générale du projet{" "}
              <span className="text-red-500">
                *
              </span>

              <textarea
                value={form.summary}
                onChange={(event) =>
                  updateField(
                    "summary",
                    event.target.value
                  )
                }
                placeholder="Décrivez le concept, le contexte et les principales composantes du projet..."
                className={textareaClass}
              />
            </label>

            <label className="text-sm font-semibold text-[#4d3b32] md:col-span-2">
              Note d’intention{" "}
              <span className="text-red-500">
                *
              </span>

              <textarea
                value={
                  form.intentionNote
                }
                onChange={(event) =>
                  updateField(
                    "intentionNote",
                    event.target.value
                  )
                }
                placeholder="Expliquez l’origine du projet, votre démarche artistique ou culturelle et les raisons qui motivent cette proposition..."
                className={textareaClass}
              />
            </label>
          </div>
        </section>

        <section className="rounded-[26px] border border-[#e7ded7] bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-start gap-3 border-b border-[#eee7e2] pb-5">
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
              <Target className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#3f2c22]">
                Objectifs, activités et public
              </h2>

              <p className="mt-1 text-sm text-[#86766c]">
                Présentez les objectifs du
                projet, les activités prévues
                et les publics concernés.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label className="text-sm font-semibold text-[#4d3b32] md:col-span-2">
              Objectifs du projet{" "}
              <span className="text-red-500">
                *
              </span>

              <textarea
                value={form.objectives}
                onChange={(event) =>
                  updateField(
                    "objectives",
                    event.target.value
                  )
                }
                placeholder="Présentez les objectifs généraux et spécifiques du projet..."
                className={textareaClass}
              />
            </label>

            <label className="text-sm font-semibold text-[#4d3b32] md:col-span-2">
              Activités envisagées{" "}
              <span className="text-red-500">
                *
              </span>

              <textarea
                value={
                  form.plannedActivities
                }
                onChange={(event) =>
                  updateField(
                    "plannedActivities",
                    event.target.value
                  )
                }
                placeholder="Décrivez les créations, répétitions, ateliers, rencontres, expositions, spectacles ou autres activités prévues..."
                className={textareaClass}
              />
            </label>

            <label className="text-sm font-semibold text-[#4d3b32]">
              Public cible{" "}
              <span className="text-red-500">
                *
              </span>

              <input
                value={
                  form.targetAudience
                }
                onChange={(event) =>
                  updateField(
                    "targetAudience",
                    event.target.value
                  )
                }
                placeholder="Jeunes, artistes, familles, écoles..."
                className={inputClass}
              />
            </label>

            <label className="text-sm font-semibold text-[#4d3b32]">
              Nombre estimé de bénéficiaires

              <input
                type="number"
                min="1"
                value={
                  form.estimatedParticipants
                }
                onChange={(event) =>
                  updateField(
                    "estimatedParticipants",
                    event.target.value
                  )
                }
                placeholder="Ex. 250"
                className={inputClass}
              />
            </label>

            <label className="text-sm font-semibold text-[#4d3b32] md:col-span-2">
              Impact attendu auprès des publics

              <textarea
                value={
                  form.expectedImpact
                }
                onChange={(event) =>
                  updateField(
                    "expectedImpact",
                    event.target.value
                  )
                }
                placeholder="Décrivez l’impact culturel, artistique ou social attendu auprès des publics..."
                className={textareaClass}
              />
            </label>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-[26px] border border-[#e7ded7] bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
                <CalendarDays className="h-5 w-5" />
              </div>

              <h2 className="text-lg font-bold text-[#3f2c22]">
                Calendrier prévisionnel
              </h2>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-semibold text-[#4d3b32]">
                Date de début prévisionnelle{" "}
                <span className="text-red-500">
                  *
                </span>

                <input
                  type="date"
                  value={form.startDate}
                  onChange={(event) =>
                    updateField(
                      "startDate",
                      event.target.value
                    )
                  }
                  className={inputClass}
                />
              </label>

              <label className="text-sm font-semibold text-[#4d3b32]">
                Date de fin prévisionnelle{" "}
                <span className="text-red-500">
                  *
                </span>

                <input
                  type="date"
                  min={
                    form.startDate ||
                    undefined
                  }
                  value={form.endDate}
                  onChange={(event) =>
                    updateField(
                      "endDate",
                      event.target.value
                    )
                  }
                  className={inputClass}
                />
              </label>

              <label className="text-sm font-semibold text-[#4d3b32] sm:col-span-2">
                Lieu envisagé

                <input
                  value={
                    form.preferredLocation
                  }
                  onChange={(event) =>
                    updateField(
                      "preferredLocation",
                      event.target.value
                    )
                  }
                  placeholder="Espace du Centre ou autre lieu envisagé"
                  className={inputClass}
                />
              </label>
            </div>
          </section>

          <section className="rounded-[26px] border border-[#e7ded7] bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-50 p-2.5 text-amber-700">
                <WalletCards className="h-5 w-5" />
              </div>

              <h2 className="text-lg font-bold text-[#3f2c22]">
                Budget et partenaires
              </h2>
            </div>

            <div className="mt-6 space-y-5">
              <label className="block text-sm font-semibold text-[#4d3b32]">
                Budget prévisionnel (USD){" "}
                <span className="text-red-500">
                  *
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.estimatedBudget
                  }
                  onChange={(event) =>
                    updateField(
                      "estimatedBudget",
                      event.target.value
                    )
                  }
                  placeholder="Ex. 5000"
                  className={inputClass}
                />
              </label>

              <label className="block text-sm font-semibold text-[#4d3b32]">
                Partenaires ou collaborations
                envisagés

                <textarea
                  value={form.partners}
                  onChange={(event) =>
                    updateField(
                      "partners",
                      event.target.value
                    )
                  }
                  placeholder="Organisations, structures culturelles, sponsors ou institutions..."
                  className={`${textareaClass} min-h-24`}
                />
              </label>

              <label className="block text-sm font-semibold text-[#4d3b32]">
                Besoins techniques et logistiques{" "}
                <span className="text-red-500">
                  *
                </span>

                <textarea
                  value={
                    form.technicalNeeds
                  }
                  onChange={(event) =>
                    updateField(
                      "technicalNeeds",
                      event.target.value
                    )
                  }
                  placeholder="Son, lumière, projection, scène, mobilier, transport, sécurité ou autres besoins..."
                  className={`${textareaClass} min-h-24`}
                />
              </label>
            </div>
          </section>
        </div>

        <section className="rounded-[26px] border border-[#e7ded7] bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-start gap-3 border-b border-[#eee7e2] pb-5">
            <div className="rounded-xl bg-violet-50 p-2.5 text-violet-700">
              <Users className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#3f2c22]">
                Porteur de projet et
                accompagnement
              </h2>

              <p className="mt-1 text-sm text-[#86766c]">
                Présentez le porteur ou la
                structure et précisez
                l’accompagnement attendu du
                Centre.
              </p>
            </div>
          </div>

          <label className="mt-6 block text-sm font-semibold text-[#4d3b32]">
            Présentation du porteur de projet
            ou de la structure{" "}
            <span className="text-red-500">
              *
            </span>

            <textarea
              value={form.team}
              onChange={(event) =>
                updateField(
                  "team",
                  event.target.value
                )
              }
              placeholder="Présentez l’artiste, le collectif, l’association, la compagnie, la structure ou l’opérateur responsable du projet..."
              className={`${textareaClass} min-h-24`}
            />
          </label>

          <label className="mt-6 block text-sm font-semibold text-[#4d3b32]">
            Références ou réalisations
            antérieures, le cas échéant

            <textarea
              value={
                form.previousWork
              }
              onChange={(event) =>
                updateField(
                  "previousWork",
                  event.target.value
                )
              }
              placeholder="Indiquez vos réalisations antérieures, vos références ou vos expériences pertinentes..."
              className={`${textareaClass} min-h-24`}
            />
          </label>

          <fieldset className="mt-6">
            <legend className="text-sm font-semibold text-[#4d3b32]">
              Accompagnement souhaité{" "}
              <span className="text-red-500">
                *
              </span>
            </legend>

            <p className="mt-1 text-xs leading-5 text-[#86766c]">
              Sélectionnez les moyens dont
              votre projet pourrait avoir
              besoin selon sa nature.
            </p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {SUPPORT_OPTIONS.map(
                (option) => {
                  const checked =
                    supportRequested.includes(
                      option
                    );

                  return (
                    <label
                      key={option}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-sm transition ${
                        checked
                          ? "border-[#d1965b] bg-[#fbf3ec] text-[#6f4528]"
                          : "border-[#e5ddd7] bg-white text-[#65564d] hover:border-[#d6c4b6]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          toggleSupport(
                            option
                          )
                        }
                        className="h-4 w-4 accent-[#d1965b]"
                      />

                      {option}
                    </label>
                  );
                }
              )}
            </div>
          </fieldset>
        </section>

        <section className="rounded-[26px] border border-[#e7ded7] bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#f6e9df] p-2.5 text-[#a76535]">
              <Paperclip className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#3f2c22]">
                Documents complémentaires
              </h2>

              <p className="mt-1 text-sm text-[#86766c]">
                Vous pouvez joindre un dossier
                complémentaire en PDF, DOC ou
                DOCX, dans la limite de 10 Mo.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-dashed border-[#d8c9bd] bg-[#fcfaf8] p-5">
            {projectDocument ? (
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="rounded-xl bg-white p-2.5 text-[#a76535] shadow-sm">
                    <FileText className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#3f2c22]">
                      {
                        projectDocument.name
                      }
                    </p>

                    <p className="text-xs text-[#8a7a70]">
                      {(
                        projectDocument.size /
                        1024 /
                        1024
                      ).toFixed(2)}{" "}
                      Mo
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setProjectDocument(null)
                  }
                  className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                  aria-label="Retirer le document"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center py-4 text-center">
                <Paperclip className="h-7 w-7 text-[#d1965b]" />

                <span className="mt-3 text-sm font-semibold text-[#5c4033]">
                  Cliquez pour joindre un
                  document
                </span>

                <span className="mt-1 text-xs text-[#8a7a70]">
                  Références, réalisations
                  antérieures ou tout document
                  utile à l’évaluation
                </span>

                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={
                    handleDocument
                  }
                  className="sr-only"
                />
              </label>
            )}
          </div>

          <label className="mt-6 block text-sm font-semibold text-[#4d3b32]">
            Informations supplémentaires

            <textarea
              value={
                form.additionalInformation
              }
              onChange={(event) =>
                updateField(
                  "additionalInformation",
                  event.target.value
                )
              }
              placeholder="Ajoutez toute information utile à l’évaluation de votre projet..."
              className={`${textareaClass} min-h-24`}
            />
          </label>
        </section>

        <section className="rounded-[26px] border border-[#ead8ca] bg-[#fffaf6] p-5 sm:p-7">
          <h2 className="text-lg font-bold text-[#3f2c22]">
            Déclaration et signature
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#76665c]">
            La soumission de cette proposition
            ne constitue ni une réservation
            d’espace, ni un engagement
            financier ou contractuel du
            CCAPAC Grand Tambour. Le projet
            sera soumis à un examen et, s’il
            est retenu, les modalités
            d’accompagnement et de réalisation
            seront définies avec les équipes
            du Centre.
          </p>

          <label className="mt-5 block max-w-xl text-sm font-semibold text-[#4d3b32]">
            Signature électronique{" "}
            <span className="text-red-500">
              *
            </span>

            <input
              value={
                form.electronicSignature
              }
              onChange={(event) =>
                updateField(
                  "electronicSignature",
                  event.target.value
                )
              }
              placeholder={memberName}
              className={inputClass}
            />
          </label>

          <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm leading-6 text-[#65564d]">
            <input
              type="checkbox"
              checked={
                declarationAccepted
              }
              onChange={(event) =>
                setDeclarationAccepted(
                  event.target.checked
                )
              }
              className="mt-1 h-4 w-4 shrink-0 accent-[#d1965b]"
            />

            <span>
              Je certifie sur l’honneur que
              les informations communiquées
              sont exactes et que je suis
              autorisé à présenter ce projet.
            </span>
          </label>
        </section>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            asChild
            type="button"
            variant="outline"
            className="h-12 border-[#d8cbc1] px-6 text-[#5c4033]"
          >
            <Link href="/espace-membre/membre/proposer-projet">
              Annuler
            </Link>
          </Button>

          <Button
            type="submit"
            disabled={submitting}
            className="h-12 bg-[#d1965b] px-7 font-semibold text-white hover:bg-[#b97d47] disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}

            {submitting
              ? "Envoi en cours..."
              : "Envoyer la proposition"}
          </Button>
        </div>
      </form>
    </div>
  );
}