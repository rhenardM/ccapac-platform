const fs = require("fs");
const path = require("path");
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const pool = require("../config/db");

const WORD_TEMPLATE_PATH = path.join(
  __dirname,
  "../templates/Fiche-demande-CCAPAC-template.docx"
);

function wordText(value, limit = 4000) {
  return String(value ?? "").replace(/\u0000/g, "").trim().slice(0, limit);
}

function wordBox(condition) {
  return condition ? "â˜’" : "â˜";
}

function wordDate(value) {
  const raw = wordText(value, 20);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const [year, month, day] = raw.split("-");
  return `${day}/${month}/${year}`;
}

function wordNormalize(value) {
  return wordText(value, 200)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function buildWordData(body = {}) {
  const values = body.values || {};
  const objectives = Array.isArray(body.selectedObjectives)
    ? body.selectedObjectives : [];
  const disciplines = Array.isArray(body.selectedDisciplines)
    ? body.selectedDisciplines : [];
  const roles = Array.isArray(body.selectedOperationalRoles)
    ? body.selectedOperationalRoles : [];
  const selectedSpace = wordText(body.selectedSpace || body.spaceName);
  const reservationSlots = Array.isArray(body.slots) ? body.slots : [];
  const normalizedSpace = wordNormalize(selectedSpace);
  const has = (list, value) => list.includes(value);
  const signature = wordText(
    body.electronicSignature || values.fullName,
    200
  );
  const data = {};

  for (const [key, value] of Object.entries(values)) {
    data[key] = wordText(value);
  }

  const boxes = {
    authorizedRepresentativeBox: body.authorizedRepresentative,
    objectiveCultural: has(objectives, "Culturel / artistique"),
    objectiveEducational: has(objectives, "Ã‰ducatif / pÃ©dagogique"),
    objectiveInstitutional: has(objectives, "Institutionnel"),
    objectiveCitizen: has(objectives, "Citoyen / mÃ©moriel"),
    objectiveProfessional: has(objectives, "Professionnel / corporatif"),
    objectiveOther: Boolean(wordText(values.otherObjective)),
    roleCoordinator: has(roles, "Coordinateur gÃ©nÃ©ral"),
    roleTechnical: has(roles, "Responsable technique"),
    roleSecurity: has(roles, "Responsable sÃ©curitÃ© / flux"),
    roleOther: Boolean(wordText(values.operationalOtherRole)),
    technicalYes: values.technicalEquipment === "yes",
    technicalNo: values.technicalEquipment === "no",
    technicalAttached: values.technicalSheet === "attached",
    technicalLater: values.technicalSheet === "later",
    insuranceYes: values.insuranceSubscribed === "yes",
    insuranceNo: values.insuranceSubscribed === "no",
    previousYes: values.previousAuthorization === "yes",
    previousNo: values.previousAuthorization === "no",
    catererYes: values.catererUsed === "yes",
    catererNo: values.catererUsed === "no",
    foodYes: values.foodSales === "yes",
    foodNo: values.foodSales === "no",
    productYes: values.productSales === "yes",
    productNo: values.productSales === "no",
    spaceGrandHall: normalizedSpace.includes("grande salle"),
    spaceSmallHall: normalizedSpace.includes("petite salle"),
    spaceMainEsplanade: normalizedSpace.includes("esplanade principale"),
    spaceSecondaryEsplanade: normalizedSpace.includes("esplanade secondaire"),
    spaceGrandLobby: normalizedSpace.includes("grand hall"),
    spaceAtrium: normalizedSpace.includes("atrium"),
    spaceCafeteria: normalizedSpace.includes("caf"),
    spaceDance: normalizedSpace.includes("danse"),
    spaceMusic: normalizedSpace.includes("musique"),
    spaceMeeting: normalizedSpace.includes("reunion"),
  };

  for (const [key, checked] of Object.entries(boxes)) {
    data[key] = wordBox(checked);
  }

  data.spaceOtherBox = wordBox(
    Boolean(selectedSpace) &&
      !Object.entries(boxes).some(
        ([key, checked]) => key.startsWith("space") && checked
      )
  );
  data.selectedSpace = selectedSpace;
  data.reservationSlots = reservationSlots
    .map((slot) => {
      const date = wordDate(slot?.date);
      const spaceId = Number(slot?.spaceId ?? slot?.space);
      return date && Number.isInteger(spaceId)
        ? `${date} â€” espace ${spaceId}`
        : "";
    })
    .filter(Boolean)
    .join("\n");
  data.setupStart = wordDate(values.setupStart);
  data.setupEnd = wordDate(values.setupEnd);
  data.activityStart = wordDate(values.activityStart || values.desiredDate);
  data.activityEnd = wordDate(values.activityEnd || values.desiredDate);
  data.teardownStart = wordDate(values.teardownStart);
  data.teardownEnd = wordDate(values.teardownEnd);
  data.insuranceStart = wordDate(values.insuranceStart);
  data.insuranceEnd = wordDate(values.insuranceEnd);
  data.city = "Kinshasa";
  data.signedDate = new Date().toLocaleDateString("fr-FR");
  data.signatureName = signature;
  data.electronicSignature = signature;

  const disciplineNames = [
    "LittÃ©rature et arts de lâ€™oralitÃ©", "Musique", "Danse",
    "ThÃ©Ã¢tre et arts dramatiques", "CinÃ©ma et audiovisuel",
    "Arts plastiques et visuels", "Photographie",
    "Architecture et urbanisme", "Mode et design vestimentaire",
    "MÃ©tiers dâ€™art et artisanat", "Patrimoine culturel matÃ©riel",
    "Patrimoine culturel immatÃ©riel",
    "Arts culinaires et gastronomie congolaise",
    "Arts numÃ©riques et nouvelles technologies",
  ];
  disciplineNames.forEach((name, index) => {
    data[`discipline${index + 1}`] = wordBox(
      disciplines.some((item) => wordText(item).startsWith(name))
    );
  });
  return data;
}

const WORD_ANSWER_COLOR = "1F4E79";

/**
 * Ajoute une couleur Ã  un run Word sans modifier ses autres styles.
 * Docxtemplater conserve ensuite ce style lorsqu'il remplace la balise
 * par la rÃ©ponse saisie par le membre.
 */
function colorWordRun(runXml, color = WORD_ANSWER_COLOR) {
  const colorTag = `<w:color w:val="${color}"/>`;
  let styledRun = runXml.replace(/<w:color\b[^>]*\/>/g, "");

  if (/<w:rPr\b[^>]*\/>/.test(styledRun)) {
    return styledRun.replace(
      /<w:rPr\b([^>]*)\/>/,
      `<w:rPr$1>${colorTag}</w:rPr>`
    );
  }

  if (/<w:rPr\b[^>]*>/.test(styledRun)) {
    return styledRun.replace(
      /<w:rPr\b[^>]*>/,
      (openingTag) => `${openingTag}${colorTag}`
    );
  }

  return styledRun.replace(
    /<w:r\b[^>]*>/,
    (openingTag) =>
      `${openingTag}<w:rPr>${colorTag}</w:rPr>`
  );
}

function getWordRunText(runXml) {
  const textParts = [];
  const textPattern =
    /<w:(?:t|instrText)\b[^>]*>([\s\S]*?)<\/w:(?:t|instrText)>/g;

  for (const match of runXml.matchAll(textPattern)) {
    textParts.push(match[1]);
  }

  return textParts.join("");
}

function buildWordTextRun(
  sourceRunXml,
  text,
  useAnswerColor,
  color = WORD_ANSWER_COLOR
) {
  const openingTag =
    sourceRunXml.match(/<w:r\b[^>]*>/)?.[0] ||
    "<w:r>";

  const properties =
    sourceRunXml.match(
      /<w:rPr\b[^>]*>[\s\S]*?<\/w:rPr>|<w:rPr\b[^>]*\/>/
    )?.[0] || "";

  let runXml =
    `${openingTag}${properties}` +
    `<w:t xml:space="preserve">${text}</w:t>` +
    "</w:r>";

  if (useAnswerColor) {
    runXml = colorWordRun(runXml, color);
  }

  return runXml;
}

/**
 * Colore les runs qui portent une balise Docxtemplater, mÃªme lorsque
 * Word a sÃ©parÃ© une balise comme {fullName} sur plusieurs runs XML.
 */
function colorTemplateTagsInParagraph(
  paragraphXml,
  color = WORD_ANSWER_COLOR
) {
  const runs = [];
  const runPattern = /<w:r\b[\s\S]*?<\/w:r>/g;

  for (const match of paragraphXml.matchAll(runPattern)) {
    runs.push({
      start: match.index,
      end: match.index + match[0].length,
      xml: match[0],
      text: getWordRunText(match[0]),
      textStart: 0,
      textEnd: 0,
    });
  }

  if (runs.length === 0) return paragraphXml;

  let combinedText = "";

  for (const run of runs) {
    run.textStart = combinedText.length;
    combinedText += run.text;
    run.textEnd = combinedText.length;
  }

  const tagRanges = [];

  for (const match of combinedText.matchAll(/\{[^{}]+\}/g)) {
    tagRanges.push({
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  if (tagRanges.length === 0) return paragraphXml;

  let result = paragraphXml;

  // Chaque run est dÃ©coupÃ© au bord exact de la balise. Ainsi, dans
  // "TÃ©lÃ©phone : {phone}", le libellÃ© reste noir et seule la valeur
  // qui remplacera {phone} hÃ©rite de la couleur bleue.
  for (let index = runs.length - 1; index >= 0; index -= 1) {
    const run = runs[index];
    const overlappingTags = tagRanges.filter(
      (tag) =>
        run.textStart < tag.end &&
        run.textEnd > tag.start
    );

    if (overlappingTags.length === 0 || !run.text) {
      continue;
    }

    const boundaries = new Set([0, run.text.length]);

    for (const tag of overlappingTags) {
      boundaries.add(
        Math.max(0, tag.start - run.textStart)
      );
      boundaries.add(
        Math.min(run.text.length, tag.end - run.textStart)
      );
    }

    const sortedBoundaries = [...boundaries].sort(
      (left, right) => left - right
    );

    const splitRuns = [];

    for (
      let partIndex = 0;
      partIndex < sortedBoundaries.length - 1;
      partIndex += 1
    ) {
      const localStart = sortedBoundaries[partIndex];
      const localEnd = sortedBoundaries[partIndex + 1];

      if (localStart === localEnd) continue;

      const segment = run.text.slice(localStart, localEnd);
      const absoluteStart = run.textStart + localStart;
      const absoluteEnd = run.textStart + localEnd;
      const isTemplateAnswer = tagRanges.some(
        (tag) =>
          absoluteStart < tag.end &&
          absoluteEnd > tag.start
      );

      splitRuns.push(
        buildWordTextRun(
          run.xml,
          segment,
          isTemplateAnswer,
          color
        )
      );
    }

    const replacement = splitRuns.join("");
    result =
      result.slice(0, run.start) +
      replacement +
      result.slice(run.end);
  }

  return result;
}

function colorTemplateAnswers(
  zip,
  color = WORD_ANSWER_COLOR
) {
  const wordXmlFiles = Object.keys(zip.files).filter(
    (filename) =>
      /^word\/(document|header\d+|footer\d+|footnotes|endnotes)\.xml$/.test(
        filename
      )
  );

  for (const filename of wordXmlFiles) {
    const xmlFile = zip.file(filename);
    if (!xmlFile) continue;

    const xml = xmlFile.asText();
    const coloredXml = xml.replace(
      /<w:p\b[\s\S]*?<\/w:p>/g,
      (paragraphXml) =>
        colorTemplateTagsInParagraph(paragraphXml, color)
    );

    zip.file(filename, coloredXml);
  }
}

exports.generateWord = async (req, res) => {
  try {
    if (String(req.user?.role || "").trim().toUpperCase() !== "MEMBER") {
      return res.status(403).json({
        success: false,
        message: "Seul un membre peut gÃ©nÃ©rer ce formulaire.",
      });
    }

    if (!fs.existsSync(WORD_TEMPLATE_PATH)) {
      return res.status(500).json({
        success: false,
        message: "Le modÃ¨le Word officiel est introuvable.",
      });
    }

    const zip = new PizZip(fs.readFileSync(WORD_TEMPLATE_PATH, "binary"));
    colorTemplateAnswers(zip);

    const document = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => "",
    });
    document.render(buildWordData(req.body));

    const buffer = document.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const filename = `Fiche-demande-CCAPAC-${Date.now()}.docx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );
    res.setHeader("Content-Length", String(buffer.length));
    return res.status(200).send(buffer);
  } catch (error) {
    console.error("Word generation error:", error);
    return res.status(500).json({
      success: false,
      message: "Impossible de gÃ©nÃ©rer le formulaire Word officiel.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

const STAFF_ROLES = [
  "ADMIN",
  "PROGRAMME_SUPERVISEUR",
  "PROGRAMME_ASSISTANT",
  "REGISSEUR_GENERAL",
  "DIRECTION_ARTISTIQUE_SUPERVISEUR",
  "DIRECTION_ARTISTIQUE_ASSISTANT",
  "COMMUNICATION",
  "JURIDIQUE_SUPERVISEUR",
  "JURIDIQUE_ASSISTANT",
  "FINANCE",
  "DG",
  "SUPERVISEUR",
];

function getWorkflowRole(role) {
  if (
    role === "PROGRAMME_SUPERVISEUR" ||
    role === "PROGRAMME_ASSISTANT"
  ) {
    return "PROGRAMME";
  }

  if (
    role ===
      "DIRECTION_ARTISTIQUE_SUPERVISEUR" ||
    role ===
      "DIRECTION_ARTISTIQUE_ASSISTANT"
  ) {
    return "DIRECTION_ARTISTIQUE";
  }

  if (
    role === "JURIDIQUE_SUPERVISEUR" ||
    role === "JURIDIQUE_ASSISTANT"
  ) {
    return "JURIDIQUE";
  }

  return role;
}

const WORKFLOW_TRANSITIONS = {
  program_review: {
    role: "PROGRAMME",
    nextStatus: "general_review",
    nextDepartment:
      "REGISSEUR_GENERAL",
    nextStep:
      "Examen par le RÃ©gisseur gÃ©nÃ©ral",
  },

  general_review: {
    role: "REGISSEUR_GENERAL",
    nextStatus: "artistic_review",
    nextDepartment:
      "DIRECTION_ARTISTIQUE",
    nextStep:
      "Examen par la Direction artistique",
  },

  artistic_review: {
    role: "DIRECTION_ARTISTIQUE",
    requiredDocument:
      "ARTISTIC_OPINION",
    nextStatus:
      "communication_review",
    nextDepartment:
      "COMMUNICATION",
    nextStep:
      "VÃ©rification par le Service Communication",
  },

  communication_review: {
    role: "COMMUNICATION",
    requiredDocument:
      "ARTISTIC_OPINION",
    nextStatus:
      "awaiting_member_confirmation",
    nextDepartment: "MEMBER",
    nextStep:
      "En attente de confirmation du demandeur",
  },

  communication_review_after_confirmation: {
    role: "COMMUNICATION",
    requiredDocuments: [
      "INITIAL_REQUEST",
      "ARTISTIC_OPINION",
    ],
    nextStatus:
      "program_review_after_confirmation",
    nextDepartment: "PROGRAMME",
    nextStep:
      "Confirmation du demandeur vÃ©rifiÃ©e par la Communication",
  },

  program_review_after_confirmation: {
    role: "PROGRAMME",
    requiredDocuments: [
      "INITIAL_REQUEST",
      "ARTISTIC_OPINION",
    ],
    nextStatus: "legal_review",
    nextDepartment: "JURIDIQUE",
    nextStep:
      "Examen par le Service juridique",
  },

  legal_review: {
    role: "JURIDIQUE",
    requiredDocument:
      "LEGAL_DOCUMENT",
    nextStatus:
      "program_review_after_legal",
    nextDepartment: "PROGRAMME",
    nextStep:
      "Retour aux Programmes aprÃ¨s examen juridique",
  },

  program_review_after_legal: {
    role: "PROGRAMME",
    requiredDocuments: [
      "INITIAL_REQUEST",
      "ARTISTIC_OPINION",
      "LEGAL_DOCUMENT",
    ],
    nextStatus:
      "finance_cotation",
    nextDepartment: "FINANCE",
    nextStep:
      "Cotation par le Service des Finances",
  },

  finance_cotation: {
    role: "FINANCE",
    requiredDocument:
      "FINANCE_QUOTE",
    nextStatus:
      "program_review_after_finance",
    nextDepartment: "PROGRAMME",
    nextStep:
      "Retour aux Programmes aprÃ¨s cotation",
  },

  program_review_after_finance: {
    role: "PROGRAMME",
    requiredDocuments: [
      "INITIAL_REQUEST",
      "ARTISTIC_OPINION",
      "LEGAL_DOCUMENT",
      "FINANCE_QUOTE",
    ],
    nextStatus:
      "awaiting_payment_proof",
    nextDepartment: "MEMBER",
    nextStep:
      "En attente de la preuve de paiement du demandeur",
  },

  program_payment_review: {
    role: "PROGRAMME",
    requiredDocuments: [
      "INITIAL_REQUEST",
      "ARTISTIC_OPINION",
      "LEGAL_DOCUMENT",
      "FINANCE_QUOTE",
      "PAYMENT_PROOF",
    ],
    nextStatus: "completed",
    nextDepartment: "MEMBER",
    nextStep:
      "Paiement vÃ©rifiÃ© et date dÃ©finitivement confirmÃ©e",
  },
};

async function hasDocument(
  connection,
  requestId,
  documentType
) {
  const [rows] =
    await connection.query(
      `
        SELECT id
        FROM space_request_documents
        WHERE
          space_request_id = ?
          AND document_type = ?
        LIMIT 1
      `,
      [
        requestId,
        documentType,
      ]
    );

  return rows.length > 0;
}

async function getMissingDocuments(
  connection,
  requestId,
  documentTypes
) {
  const missing = [];

  for (
    const documentType of
    documentTypes
  ) {
    const exists =
      await hasDocument(
        connection,
        requestId,
        documentType
      );

    if (!exists) {
      missing.push(documentType);
    }
  }

  return missing;
}

const SELECT_REQUEST = `
  SELECT
    sr.id,
    sr.reference,
    sr.user_id,
    sr.space_id,
    sr.title,
    sr.description,
    sr.desired_date,
    sr.document_name,
    sr.document_path,
    sr.document_type,
    sr.document_size,
    sr.status,
    sr.current_step,
    sr.assigned_department,
    sr.assigned_to_user_id,
    sr.programme_review_state,
    sr.assistant_comment,
    sr.assistant_signature,
    sr.assistant_reviewed_at,
    sr.artistic_assigned_to,
    sr.artistic_review_state,
    sr.artistic_assistant_comment,
    sr.artistic_assistant_signature,
    sr.artistic_assistant_reviewed_at,
    sr.legal_assigned_to,
    sr.legal_review_state,
    sr.legal_assistant_comment,
    sr.legal_assistant_signature,
    sr.legal_assistant_reviewed_at,
    sr.communication_validation_state,
    sr.communication_comment,
    sr.communication_signature,
    sr.communication_validated_by,
    sr.communication_validated_at,
    sr.regisseur_validation_state,
    sr.regisseur_comment,
    sr.regisseur_signature,
    sr.regisseur_validated_by,
    sr.regisseur_validated_at,
    sr.electronic_signature,
    sr.rejection_comment,
    sr.payment_amount,
    sr.dg_review_state,
    sr.dg_suggested_amount,
    sr.dg_comment,
    sr.dg_signature,
    sr.dg_reviewed_by,
    sr.dg_reviewed_at,
    sr.finance_revision_count,
    sr.submitted_at,
    sr.created_at,
    sr.updated_at,

    u.email AS user_email,
    u.first_name,
    u.last_name,
    u.phone AS user_phone

    ,au.email AS assigned_user_email
    ,au.first_name AS assigned_user_first_name
    ,au.last_name AS assigned_user_last_name

    ,aau.email AS artistic_assigned_user_email
    ,aau.first_name AS artistic_assigned_user_first_name
    ,aau.last_name AS artistic_assigned_user_last_name

    ,lau.email AS legal_assigned_user_email
    ,lau.first_name AS legal_assigned_user_first_name
    ,lau.last_name AS legal_assigned_user_last_name

  FROM space_requests sr

  JOIN users u
    ON u.id = sr.user_id

  LEFT JOIN users au
    ON au.id = sr.assigned_to_user_id

  LEFT JOIN users aau
    ON aau.id = sr.artistic_assigned_to

  LEFT JOIN users lau
    ON lau.id = sr.legal_assigned_to
`;

function createReference() {
  const year = new Date().getFullYear();

  const datePart = Date.now()
    .toString()
    .slice(-7);

  const randomPart = Math.floor(
    100 + Math.random() * 900
  );

  return `ESP-${year}-${datePart}${randomPart}`;
}

function removeUploadedFile(file) {
  if (!file?.path) {
    return;
  }

  fs.unlink(file.path, (error) => {
    if (error && error.code !== "ENOENT") {
      console.error(
        "Unable to remove uploaded file:",
        error
      );
    }
  });
}

const APPLICANT_FIELD_LABELS = new Set([
  "demandeur",
  "email",
  "tÃ©lÃ©phone",
  "telephone",
  "date souhaitÃ©e",
  "date souhaitee",
  "document",
]);

function normalizeFieldLabel(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

/*
 * Supprime les lignes d'identitÃ© que certains anciens frontends
 * plaÃ§aient dÃ©jÃ  dans description avant l'envoi au backend.
 */
function getFreeDescription(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => {
      const separatorIndex = line.indexOf(":");

      if (separatorIndex < 0) {
        return true;
      }

      const label = normalizeFieldLabel(
        line.slice(0, separatorIndex)
      );

      return !APPLICANT_FIELD_LABELS.has(label);
    })
    .join("\n");
}

/*
 * Nettoie Ã©galement les demandes dÃ©jÃ  enregistrÃ©es : une seule
 * occurrence est conservÃ©e pour chaque champ du demandeur.
 */
function cleanStoredDescription(value) {
  const seenLabels = new Set();

  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => {
      const separatorIndex = line.indexOf(":");

      if (separatorIndex < 0) {
        return true;
      }

      const label = normalizeFieldLabel(
        line.slice(0, separatorIndex)
      );

      if (!APPLICANT_FIELD_LABELS.has(label)) {
        return true;
      }

      if (seenLabels.has(label)) {
        return false;
      }

      seenLabels.add(label);
      return true;
    })
    .join("\n");
}

function serializeRequest(row) {
  return {
    id: row.id,
    reference:
      row.reference || `Demande #${row.id}`,

    eventName: row.title,
    title: row.title,
    spaceId:
      row.space_id !== null &&
      row.space_id !== undefined
        ? Number(row.space_id)
        : null,
    description:
      cleanStoredDescription(
        row.description
      ),

    date: row.desired_date,
    desiredDate: row.desired_date,

    status: row.status,

    currentDepartment:
      row.assigned_department,

    assignedDepartment:
      row.assigned_department,

    assignedToUserId:
      row.assigned_to_user_id,

    assignedTo: row.assigned_to_user_id
      ? {
          id: row.assigned_to_user_id,
          firstName:
            row.assigned_user_first_name,
          lastName:
            row.assigned_user_last_name,
          email:
            row.assigned_user_email,
          username:
            `${row.assigned_user_first_name || ""} ${
              row.assigned_user_last_name || ""
            }`.trim() || row.assigned_user_email,
        }
      : null,

    programmeReviewState:
      row.programme_review_state,
    assistantComment:
      row.assistant_comment,
    assistantSignature:
      row.assistant_signature,
    assistantReviewedAt:
      row.assistant_reviewed_at,

    artisticAssignedToUserId:
      row.artistic_assigned_to,

    artisticAssignedTo:
      row.artistic_assigned_to
        ? {
            id:
              row.artistic_assigned_to,
            firstName:
              row.artistic_assigned_user_first_name,
            lastName:
              row.artistic_assigned_user_last_name,
            email:
              row.artistic_assigned_user_email,
            username:
              `${row.artistic_assigned_user_first_name || ""} ${
                row.artistic_assigned_user_last_name || ""
              }`.trim() ||
              row.artistic_assigned_user_email,
          }
        : null,

    artisticReviewState:
      row.artistic_review_state,
    artisticAssistantComment:
      row.artistic_assistant_comment,
    artisticAssistantSignature:
      row.artistic_assistant_signature,
    artisticAssistantReviewedAt:
      row.artistic_assistant_reviewed_at,

    legalAssignedToUserId:
      row.legal_assigned_to,

    legalAssignedTo:
      row.legal_assigned_to
        ? {
            id: row.legal_assigned_to,
            firstName:
              row.legal_assigned_user_first_name,
            lastName:
              row.legal_assigned_user_last_name,
            email:
              row.legal_assigned_user_email,
            username:
              `${row.legal_assigned_user_first_name || ""} ${
                row.legal_assigned_user_last_name || ""
              }`.trim() ||
              row.legal_assigned_user_email,
          }
        : null,

    legalReviewState:
      row.legal_review_state,
    legalAssistantComment:
      row.legal_assistant_comment,
    legalAssistantSignature:
      row.legal_assistant_signature,
    legalAssistantReviewedAt:
      row.legal_assistant_reviewed_at,

    communicationValidationState:
      row.communication_validation_state,
    communicationComment:
      row.communication_comment,
    communicationSignature:
      row.communication_signature,
    communicationValidatedBy:
      row.communication_validated_by,
    communicationValidatedAt:
      row.communication_validated_at,

    regisseurValidationState:
      row.regisseur_validation_state,
    regisseurComment:
      row.regisseur_comment,
    regisseurSignature:
      row.regisseur_signature,
    regisseurValidatedBy:
      row.regisseur_validated_by,
    regisseurValidatedAt:
      row.regisseur_validated_at,

    currentStep: row.current_step,

    electronicSignature:
      row.electronic_signature,

    rejectionComment:
      row.rejection_comment,

    paymentAmount:
      row.payment_amount !== null
        ? Number(row.payment_amount)
        : null,

    dgReviewState: row.dg_review_state,
    dgSuggestedAmount:
      row.dg_suggested_amount !== null
        ? Number(row.dg_suggested_amount)
        : null,
    dgComment: row.dg_comment,
    dgSignature: row.dg_signature,
    dgReviewedBy: row.dg_reviewed_by,
    dgReviewedAt: row.dg_reviewed_at,
    financeRevisionCount:
      Number(row.finance_revision_count || 0),

    submittedAt: row.submitted_at,

    document: row.document_path
      ? {
          name:
            row.document_name ||
            "Document de la demande",

          url: row.document_path,

          type:
            row.document_type ||
            "application/octet-stream",

          size: row.document_size || 0,
        }
      : null,

    createdAt: row.created_at,
    updatedAt: row.updated_at,

    user: {
      id: row.user_id,

      username:
        `${row.first_name || ""} ${
          row.last_name || ""
        }`.trim() || row.user_email,

      firstName: row.first_name,
      lastName: row.last_name,
      email: row.user_email,
      phone: row.user_phone,
    },
  };
}

async function findRequestById(
  requestId,
  connection = pool
) {
  const [rows] = await connection.query(
    `
      ${SELECT_REQUEST}
      WHERE sr.id = ?
      LIMIT 1
    `,
    [requestId]
  );

  if (rows.length === 0) {
    return null;
  }

  const request = serializeRequest(rows[0]);
  const [slotRows] = await connection.query(
    `SELECT id, space_id, DATE_FORMAT(desired_date, '%Y-%m-%d') AS desired_date
     FROM space_request_slots
     WHERE space_request_id = ?
     ORDER BY desired_date ASC, id ASC`,
    [requestId]
  );

  request.slots = slotRows.map((slot) => ({
    id: Number(slot.id),
    spaceId: Number(slot.space_id),
    date: slot.desired_date,
  }));

  return request;
}

async function attachSlotsToRequests(
  rows,
  connection = pool
) {
  const requests = rows.map(serializeRequest);

  if (requests.length === 0) {
    return requests;
  }

  const requestIds = requests.map((request) => request.id);
  const placeholders = requestIds.map(() => "?").join(", ");

  const [slotRows] = await connection.query(
    `SELECT
       id,
       space_request_id,
       space_id,
       DATE_FORMAT(desired_date, '%Y-%m-%d') AS desired_date
     FROM space_request_slots
     WHERE space_request_id IN (${placeholders})
     ORDER BY desired_date ASC, id ASC`,
    requestIds
  );

  const slotsByRequest = new Map();

  for (const slot of slotRows) {
    const requestId = Number(slot.space_request_id);
    const currentSlots = slotsByRequest.get(requestId) || [];

    currentSlots.push({
      id: Number(slot.id),
      spaceId: Number(slot.space_id),
      date: slot.desired_date,
    });

    slotsByRequest.set(requestId, currentSlots);
  }

  return requests.map((request) => ({
    ...request,
    slots:
      slotsByRequest.get(request.id) ||
      (request.desiredDate || request.date
        ? [
            {
              date: request.desiredDate || request.date,
              spaceId: request.spaceId,
            },
          ]
        : []),
  }));
}

function parseReservationSlots(rawSlots, legacyDate, legacySpace) {
  let parsed = rawSlots;

  if (typeof parsed === "string" && parsed.trim()) {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      throw new Error("La liste des dates et espaces est invalide.");
    }
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    parsed = [{ date: legacyDate, spaceId: legacySpace }];
  }

  if (parsed.length > 30) {
    throw new Error("Une demande ne peut pas contenir plus de 30 crÃ©neaux.");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const unique = new Map();

  for (const item of parsed) {
    const date = String(item?.date || "").slice(0, 10);
    const spaceId = Number(item?.spaceId ?? item?.space);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error("Une date de rÃ©servation est invalide.");
    }

    const localDate = new Date(`${date}T00:00:00`);
    if (Number.isNaN(localDate.getTime()) || localDate < today) {
      throw new Error("Les dates de rÃ©servation doivent Ãªtre valides et futures.");
    }

    if (!Number.isInteger(spaceId) || spaceId < 1 || spaceId > 12) {
      throw new Error("Un espace sÃ©lectionnÃ© est invalide.");
    }

    unique.set(`${date}:${spaceId}`, { date, spaceId });
  }

  return [...unique.values()].sort((a, b) =>
    a.date.localeCompare(b.date) || a.spaceId - b.spaceId
  );
}

function canAccessRequest(request, user) {
  if (user.role === "ADMIN") {
    return true;
  }

  if (user.role === "MEMBER") {
    return request.user.id === user.id;
  }

  if (user.role === "PROGRAMME_ASSISTANT") {
    return (
      request.assignedDepartment === "PROGRAMME" &&
      Number(request.assignedToUserId) ===
        Number(user.id)
    );
  }

  if (
    [
      "PROGRAMME",
      "PROGRAMME_SUPERVISEUR",
    ].includes(user.role)
  ) {
    return true;
  }

  return STAFF_ROLES.includes(user.role);
}

/**
 * POST /api/space-requests
 *
 * Le membre crÃ©e un brouillon avec le document.
 */
exports.create = async (req, res) => {
  let connection;

  try {
    connection =
      await pool.getConnection();

    const userId = Number(
      req.user.id
    );

    const {
      fullName,
      email,
      phone,
      eventName,
      space,
      date,
      slots,
      description,
    } = req.body;

    /*
     * Validation de lâ€™utilisateur.
     */
    if (
      !Number.isInteger(userId) ||
      userId <= 0
    ) {
      removeUploadedFile(req.file);

      return res.status(401).json({
        success: false,
        message:
          "Utilisateur non authentifiÃ©.",
      });
    }

    /*
     * Validation du document initial.
     */
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message:
          "Le formulaire rempli est obligatoire.",
      });
    }

    /*
     * Validation du nom de lâ€™Ã©vÃ©nement.
     */
    if (!eventName?.trim()) {
      removeUploadedFile(req.file);

      return res.status(400).json({
        success: false,
        message:
          "Lâ€™intitulÃ© de lâ€™activitÃ© est obligatoire.",
      });
    }

    let reservationSlots;

    try {
      reservationSlots = parseReservationSlots(slots, date, space);
    } catch (slotError) {
      removeUploadedFile(req.file);
      return res.status(400).json({
        success: false,
        message: slotError.message,
      });
    }

    const primarySlot = reservationSlots[0];
    const spaceId = primarySlot.spaceId;

    if (
      !Number.isInteger(spaceId) ||
      spaceId < 1 ||
      spaceId > 12
    ) {
      removeUploadedFile(req.file);

      return res.status(400).json({
        success: false,
        message:
          "Veuillez sÃ©lectionner un espace valide.",
      });
    }

    /*
     * Validation de la date souhaitÃ©e.
     */
    if (!primarySlot.date) {
      removeUploadedFile(req.file);

      return res.status(400).json({
        success: false,
        message:
          "La date souhaitÃ©e dâ€™occupation est obligatoire.",
      });
    }

    const desiredDate = new Date(
      `${primarySlot.date}T00:00:00`
    );

    if (
      Number.isNaN(
        desiredDate.getTime()
      )
    ) {
      removeUploadedFile(req.file);

      return res.status(400).json({
        success: false,
        message:
          "La date souhaitÃ©e est invalide.",
      });
    }

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    if (desiredDate < today) {
      removeUploadedFile(req.file);

      return res.status(400).json({
        success: false,
        message:
          "La date souhaitÃ©e ne peut pas Ãªtre antÃ©rieure Ã  aujourdâ€™hui.",
      });
    }

    for (const slot of reservationSlots) {
      const [conflicts] = await connection.query(
        `SELECT sr.reference
         FROM space_request_slots existing_slot
         INNER JOIN space_requests sr
           ON sr.id = existing_slot.space_request_id
         WHERE existing_slot.space_id = ?
           AND existing_slot.desired_date = ?
           AND LOWER(sr.status) NOT IN ('rejected', 'cancelled', 'canceled')
         LIMIT 1`,
        [slot.spaceId, slot.date]
      );

      if (conflicts.length > 0) {
        removeUploadedFile(req.file);
        return res.status(409).json({
          success: false,
          message: `Lâ€™espace ${slot.spaceId} est dÃ©jÃ  rÃ©servÃ© le ${slot.date}.`,
        });
      }
    }

    /*
     * CrÃ©ation de la rÃ©fÃ©rence unique.
     */
    const reference =
      createReference();

    /*
     * URL publique du document.
     */
    const documentUrl =
      `/uploads/space-requests/${req.file.filename}`;

    /*
     * Informations enregistrÃ©es dans
     * la description de la demande.
     */
    const applicantInformation = [
      fullName?.trim()
        ? `Demandeur : ${fullName.trim()}`
        : null,

      email?.trim()
        ? `Email : ${email
            .trim()
            .toLowerCase()}`
        : null,

      phone?.trim()
        ? `TÃ©lÃ©phone : ${phone.trim()}`
        : null,

      `CrÃ©neaux souhaitÃ©s : ${reservationSlots
        .map((slot) => `${slot.date} / espace ${slot.spaceId}`)
        .join(", ")}`,

      getFreeDescription(
        description
      ) || null,
    ]
      .filter(Boolean)
      .join("\n");

    await connection.beginTransaction();

    /*
     * CrÃ©ation de la demande.
     *
     * Les anciennes colonnes document_* sont
     * conservÃ©es pour la compatibilitÃ© avec
     * le frontend existant.
     */
    const [result] =
      await connection.query(
        `
          INSERT INTO space_requests (
            reference,
            user_id,
            space_id,
            title,
            description,
            desired_date,
            document_name,
            document_path,
            document_type,
            document_size,
            status,
            current_step,
            assigned_department
          )
          VALUES (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            'draft',
            'Brouillon crÃ©Ã© par le membre',
            'MEMBER'
          )
        `,
        [
          reference,
          userId,
          spaceId,
          eventName.trim(),
          applicantInformation || null,
          primarySlot.date,
          req.file.originalname,
          documentUrl,
          req.file.mimetype,
          req.file.size,
        ]
      );

    const requestId =
      result.insertId;

    for (const slot of reservationSlots) {
      await connection.query(
        `INSERT INTO space_request_slots
          (space_request_id, space_id, desired_date)
         VALUES (?, ?, ?)`,
        [requestId, slot.spaceId, slot.date]
      );
    }

    /*
     * Enregistrement du premier document
     * dans la nouvelle table de documents.
     */
    await connection.query(
      `
        INSERT INTO space_request_documents (
          space_request_id,
          document_type,
          document_name,
          document_path,
          document_mime_type,
          document_size,
          uploaded_by
        )
        VALUES (
          ?,
          'INITIAL_REQUEST',
          ?,
          ?,
          ?,
          ?,
          ?
        )
      `,
      [
        requestId,
        req.file.originalname,
        documentUrl,
        req.file.mimetype,
        req.file.size,
        userId,
      ]
    );

    /*
     * CrÃ©ation de lâ€™historique initial.
     */
    await connection.query(
      `
        INSERT INTO space_request_histories (
          space_request_id,
          action,
          previous_status,
          new_status,
          from_department,
          to_department,
          comment,
          electronic_signature,
          performed_by
        )
        VALUES (
          ?,
          'CREATE',
          NULL,
          'draft',
          'MEMBER',
          'MEMBER',
          ?,
          NULL,
          ?
        )
      `,
      [
        requestId,
        "Brouillon crÃ©Ã© par le membre avec le formulaire initial.",
        userId,
      ]
    );

    await connection.commit();

    /*
     * Chargement de la demande crÃ©Ã©e.
     */
    const createdRequest =
      await findRequestById(
        requestId
      );

    return res.status(201).json({
      success: true,

      message:
        "Demande et document initial crÃ©Ã©s avec succÃ¨s.",

      data: createdRequest,
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (
        rollbackError
      ) {
        console.error(
          "Create request rollback error:",
          rollbackError
        );
      }
    }

    /*
     * Si la transaction Ã©choue, le fichier
     * physique est Ã©galement supprimÃ©.
     */
    removeUploadedFile(req.file);

    console.error(
      "Create space request error:",
      error
    );

    if (
      error.code ===
      "ER_DUP_ENTRY"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Le document initial de cette demande existe dÃ©jÃ .",
      });
    }

    if (
      error.code ===
      "ER_NO_SUCH_TABLE"
    ) {
      return res.status(500).json({
        success: false,
        message:
          "La table space_request_documents nâ€™existe pas. ExÃ©cutez dâ€™abord la migration SQL.",
      });
    }

    return res.status(500).json({
      success: false,

      message:
        "Erreur lors de la crÃ©ation de la demande.",

      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,
    });
  } finally {
    connection?.release();
  }
};

/**
 * GET /api/space-requests/my
 *
 * Retourne uniquement les demandes du membre connectÃ©.
 */
exports.getMyRequests = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
        ${SELECT_REQUEST}
        WHERE sr.user_id = ?
        ORDER BY sr.created_at DESC
      `,
      [req.user.id]
    );

    const requests = await attachSlotsToRequests(rows);

    return res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error(
      "Get member requests error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Impossible de charger vos demandes",
    });
  }
};

/**
 * GET /api/space-requests/department
 *
 * PROGRAMME voit toutes les demandes assignÃ©es
 * au dÃ©partement PROGRAMME.
 */
exports.getDepartmentRequests = async (
  req,
  res
) => {
  try {
    const allowedRoles = [
      "ADMIN",
      "PROGRAMME",
      "PROGRAMME_SUPERVISEUR",
      "PROGRAMME_ASSISTANT",
      "REGISSEUR_GENERAL",
      "DIRECTION_ARTISTIQUE",
      "DIRECTION_ARTISTIQUE_SUPERVISEUR",
      "DIRECTION_ARTISTIQUE_ASSISTANT",
      "COMMUNICATION",
      "JURIDIQUE",
      "JURIDIQUE_SUPERVISEUR",
      "JURIDIQUE_ASSISTANT",
      "FINANCE",
    ];

    const role = req.user.role;
    const departmentRole =
      getWorkflowRole(role);

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        message: "AccÃ¨s refusÃ©",
      });
    }

    let query = SELECT_REQUEST;
    const parameters = [];

    if (role === "PROGRAMME_ASSISTANT") {
      query += `
        WHERE
          sr.assigned_department = 'PROGRAMME'
          AND sr.assigned_to_user_id = ?
      `;

      parameters.push(req.user.id);
    } else if (
      role ===
      "DIRECTION_ARTISTIQUE_ASSISTANT"
    ) {
      query += `
        WHERE
          sr.assigned_department =
            'DIRECTION_ARTISTIQUE'
          AND sr.artistic_assigned_to = ?
      `;

      parameters.push(req.user.id);
    } else if (
      role === "JURIDIQUE_ASSISTANT"
    ) {
      query += `
        WHERE
          sr.assigned_department =
            'JURIDIQUE'
          AND sr.legal_assigned_to = ?
      `;

      parameters.push(req.user.id);
    } else if (role === "COMMUNICATION") {
      query += `
        WHERE
          sr.assigned_department = 'COMMUNICATION'
          OR (
            sr.communication_validation_state = 'pending'
            AND sr.regisseur_validation_state IS NOT NULL
            AND sr.status NOT IN (
              'program_review_after_regisseur_rejection',
              'correction_requested',
              'stopped_by_member',
              'expired'
            )
          )
      `;
    } else if (role === "REGISSEUR_GENERAL") {
      query += `
        WHERE
          sr.assigned_department = 'REGISSEUR_GENERAL'
          OR (
            sr.regisseur_validation_state = 'pending'
            AND sr.communication_validation_state IS NOT NULL
            AND sr.status NOT IN (
              'program_review_after_regisseur_rejection',
              'correction_requested',
              'stopped_by_member',
              'expired'
            )
          )
      `;
    } else if (role !== "ADMIN") {
      query += `
        WHERE sr.assigned_department = ?
      `;

      parameters.push(departmentRole);
    }

    query += `
      ORDER BY
        sr.submitted_at ASC,
        sr.created_at ASC
    `;

    const [rows] = await pool.query(
      query,
      parameters
    );

    return res.json({
      success: true,
      data: rows.map(serializeRequest),
    });
  } catch (error) {
    console.error(
      "Get department requests error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Impossible de charger les demandes du dÃ©partement",
    });
  }
};

exports.getDepartmentHistory = async (
  req,
  res
) => {
  try {
    const role = req.user.role;

    if (
      ![
        "ADMIN",
        "PROGRAMME",
        "PROGRAMME_SUPERVISEUR",
        "PROGRAMME_ASSISTANT",
        "REGISSEUR_GENERAL",
        "DIRECTION_ARTISTIQUE",
        "DIRECTION_ARTISTIQUE_SUPERVISEUR",
        "DIRECTION_ARTISTIQUE_ASSISTANT",
        "COMMUNICATION",
        "JURIDIQUE",
        "JURIDIQUE_SUPERVISEUR",
        "JURIDIQUE_ASSISTANT",
        "FINANCE",
      ].includes(role)
    ) {
      return res.status(403).json({
        success: false,
        message: "AccÃ¨s refusÃ©",
      });
    }

    let query = `
      ${SELECT_REQUEST}

      WHERE
        sr.status = 'completed'
        OR EXISTS (
          SELECT 1
          FROM space_request_histories h
          WHERE
            h.space_request_id = sr.id
            AND (
              h.from_department = ?
              OR h.to_department = ?
            )
        )
    `;

    const department =
      role === "ADMIN"
        ? "PROGRAMME"
        : getWorkflowRole(role);

    if (role === "PROGRAMME_ASSISTANT") {
      query = `
        ${SELECT_REQUEST}

        WHERE
          sr.status = 'completed'
          OR EXISTS (
            SELECT 1
            FROM space_request_histories h
            WHERE
              h.space_request_id = sr.id
              AND h.performed_by = ?
              AND h.action IN (
                'ASSISTANT_VALIDATE',
                'ASSISTANT_REJECT_RECOMMENDATION',
                'VALIDATE',
                'REJECT'
              )
          )

        ORDER BY sr.updated_at DESC
      `;

      const [assistantRows] =
        await pool.query(query, [req.user.id]);

      return res.json({
        success: true,
        data: assistantRows.map(serializeRequest),
      });
    }

    if (
      role ===
      "DIRECTION_ARTISTIQUE_ASSISTANT"
    ) {
      query = `
        ${SELECT_REQUEST}

        WHERE
          sr.status = 'completed'
          OR EXISTS (
            SELECT 1
            FROM space_request_histories h
            WHERE
              h.space_request_id = sr.id
              AND h.performed_by = ?
              AND h.action IN (
                'ARTISTIC_ASSISTANT_VALIDATE',
                'ARTISTIC_ASSISTANT_REJECT_RECOMMENDATION'
              )
          )

        ORDER BY sr.updated_at DESC
      `;

      const [assistantRows] =
        await pool.query(query, [
          req.user.id,
        ]);

      return res.json({
        success: true,
        data:
          assistantRows.map(
            serializeRequest
          ),
      });
    }

    query += `
      ORDER BY sr.updated_at DESC
    `;

    const [rows] = await pool.query(
      query,
      [department, department]
    );

    return res.json({
      success: true,
      data: rows.map(serializeRequest),
    });
  } catch (error) {
    console.error(
      "Department history error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Impossible de charger l'historique",
    });
  }
};

/**
 * GET /api/space-requests/:id
 */
exports.getOne = async (req, res) => {
  try {
    const request = await findRequestById(
      req.params.id
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Demande introuvable",
      });
    }

    if (!canAccessRequest(request, req.user)) {
      return res.status(403).json({
        success: false,
        message: "AccÃ¨s refusÃ©",
      });
    }

    return res.json({
      success: true,
      data: request,
    });
  } catch (error) {
    console.error(
      "Get space request error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Impossible de charger la demande",
    });
  }
};

/**
 * POST /api/space-requests/:id/submit
 *
 * Le membre signe la demande.
 * La demande devient visible par tous les
 * utilisateurs ayant le rÃ´le PROGRAMME.
 */
exports.submit = async (req, res) => {
  const connection =
    await pool.getConnection();

  try {
    const electronicSignature =
      req.body.electronicSignature;

    if (
      !electronicSignature ||
      !String(electronicSignature).trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "La signature Ã©lectronique est obligatoire",
      });
    }

    await connection.beginTransaction();

    const [rows] = await connection.query(
      `
        SELECT
          id,
          user_id,
          status,
          assigned_department
        FROM space_requests
        WHERE id = ?
        FOR UPDATE
      `,
      [req.params.id]
    );

    const request = rows[0];

    if (!request) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Demande introuvable",
      });
    }

    if (
      Number(request.user_id) !==
      Number(req.user.id)
    ) {
      await connection.rollback();

      return res.status(403).json({
        success: false,
        message:
          "Vous ne pouvez pas transmettre cette demande",
      });
    }

    if (request.status !== "draft") {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message:
          "Cette demande a dÃ©jÃ  Ã©tÃ© transmise",
      });
    }

    const [updateResult] =
      await connection.query(
        `
          UPDATE space_requests
          SET
            electronic_signature = ?,
            status = 'program_review',
            current_step =
              'Examen par le Service des Programmes',
            assigned_department = 'PROGRAMME',
            submitted_at = NOW()
          WHERE id = ?
            AND user_id = ?
            AND status = 'draft'
        `,
        [
          String(electronicSignature),
          request.id,
          req.user.id,
        ]
      );

    if (updateResult.affectedRows !== 1) {
      throw new Error(
        "La demande n'a pas pu Ãªtre transmise"
      );
    }

    await connection.query(
      `
        INSERT INTO space_request_histories (
          space_request_id,
          action,
          previous_status,
          new_status,
          from_department,
          to_department,
          comment,
          electronic_signature,
          performed_by
        )
        VALUES (
          ?,
          'SUBMIT',
          'draft',
          'program_review',
          'MEMBER',
          'PROGRAMME',
          ?,
          ?,
          ?
        )
      `,
      [
        request.id,

        "Demande signÃ©e et transmise au Service des Programmes",

        String(electronicSignature),

        req.user.id,
      ]
    );

    await connection.commit();

    const updatedRequest =
      await findRequestById(request.id);

    return res.json({
      success: true,

      message:
        "Demande transmise au Service des Programmes",

      data: updatedRequest,
    });
  } catch (error) {
    await connection.rollback();

    console.error(
      "Submit space request error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Impossible de transmettre la demande au Programme",
    });
  } finally {
    connection.release();
  }
};

/**
 * GET /api/space-requests/:id/histories
 */
exports.getHistory = async (req, res) => {
  try {
    const request = await findRequestById(
      req.params.id
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Demande introuvable",
      });
    }

    if (!canAccessRequest(request, req.user)) {
      return res.status(403).json({
        success: false,
        message: "AccÃ¨s refusÃ©",
      });
    }

    const [rows] = await pool.query(
      `
        SELECT
          h.id,
          h.action,

          h.previous_status
            AS previousStatus,

          h.new_status
            AS newStatus,

          h.from_department
            AS fromDepartment,

          h.to_department
            AS toDepartment,

          h.comment,

          h.electronic_signature
            AS electronicSignature,

          h.performed_at
            AS performedAt,

          CONCAT(
            COALESCE(u.first_name, ''),
            ' ',
            COALESCE(u.last_name, '')
          ) AS username,

          u.email AS userEmail

        FROM space_request_histories h

        JOIN users u
          ON u.id = h.performed_by

        WHERE h.space_request_id = ?

        ORDER BY h.performed_at DESC
      `,
      [req.params.id]
    );

    return res.json({
      success: true,

      data: rows.map((row) => ({
        id: row.id,
        action: row.action,

        previousStatus:
          row.previousStatus,

        newStatus: row.newStatus,

        fromDepartment:
          row.fromDepartment,

        toDepartment:
          row.toDepartment,

        comment: row.comment,

        electronicSignature:
          row.electronicSignature,

        performedAt: row.performedAt,

        performedBy: {
          username:
            row.username.trim() ||
            row.userEmail,

          email: row.userEmail,
        },
      })),
    });
  } catch (error) {
    console.error(
      "Get request history error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Impossible de charger l'historique",
    });
  }
};

/*
 * POST /api/space-requests/:id/confirm
 *
 * Le membre confirme le formulaire initial et l'avis artistique.
 * Le dossier retourne d'abord Ã  COMMUNICATION pour vÃ©rification,
 * puis COMMUNICATION le transmet au PROGRAMME.
 */
exports.confirmMember = async (req, res) => {
  let connection;

  try {
    const requestId = Number(req.params.id);
    const userId = Number(req.user.id);
    const electronicSignature = String(
      req.body.electronicSignature || ""
    ).trim();
    const comment = String(
      req.body.comment || ""
    ).trim();

    if (!Number.isInteger(requestId) || requestId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Identifiant de demande invalide.",
      });
    }

    if (electronicSignature.length < 3) {
      return res.status(400).json({
        success: false,
        message: "La signature Ã©lectronique est obligatoire.",
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `
        SELECT id, user_id, status, assigned_department
        FROM space_requests
        WHERE id = ?
        FOR UPDATE
      `,
      [requestId]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Demande introuvable.",
      });
    }

    const request = rows[0];

    if (Number(request.user_id) !== userId) {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message: "Vous ne pouvez pas confirmer cette demande.",
      });
    }

    if (request.status !== "awaiting_member_confirmation") {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: "Cette demande n'attend pas votre confirmation.",
      });
    }

    const missingDocuments = await getMissingDocuments(
      connection,
      requestId,
      ["INITIAL_REQUEST", "ARTISTIC_OPINION"]
    );

    if (missingDocuments.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: "Les documents Ã  confirmer sont incomplets.",
        missingDocuments,
      });
    }

    const [updateResult] = await connection.query(
      `
        UPDATE space_requests
        SET
          status = 'communication_review_after_confirmation',
          current_step = 'Confirmation du demandeur Ã  vÃ©rifier par la Communication',
          assigned_department = 'COMMUNICATION',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
          AND user_id = ?
          AND status = 'awaiting_member_confirmation'
      `,
      [requestId, userId]
    );

    if (updateResult.affectedRows !== 1) {
      throw new Error("La confirmation n'a pas pu Ãªtre enregistrÃ©e.");
    }

    await connection.query(
      `
        INSERT INTO space_request_histories (
          space_request_id,
          action,
          previous_status,
          new_status,
          from_department,
          to_department,
          comment,
          electronic_signature,
          performed_by
        )
        VALUES (
          ?,
          'MEMBER_CONFIRMATION',
          'awaiting_member_confirmation',
          'communication_review_after_confirmation',
          'MEMBER',
          'COMMUNICATION',
          ?,
          ?,
          ?
        )
      `,
      [
        requestId,
        comment || "Documents lus et confirmÃ©s par le demandeur.",
        electronicSignature,
        userId,
      ]
    );

    await connection.commit();

    const updatedRequest = await findRequestById(requestId);

    return res.json({
      success: true,
      message: "Documents confirmÃ©s et retournÃ©s au Service Communication.",
      data: updatedRequest,
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Member confirmation rollback error:", rollbackError);
      }
    }

    console.error("Member confirmation error:", error);

    return res.status(500).json({
      success: false,
      message: "Impossible de confirmer les documents.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  } finally {
    connection?.release();
  }
};

/**
 * POST /api/space-requests/:id/payment-proof
 *
 * Le membre dÃ©pose la preuve de paiement aprÃ¨s rÃ©ception de la cotation.
 * Le dossier est ensuite retournÃ© au Programme pour vÃ©rification finale.
 */
exports.uploadPaymentProof = async (req, res) => {
  let connection;

  try {
    const requestId = Number(req.params.id);
    const userId = Number(req.user.id);

    if (!Number.isInteger(requestId) || requestId <= 0) {
      removeUploadedFile(req.file);
      return res.status(400).json({
        success: false,
        message: "Identifiant de demande invalide.",
      });
    }

    if (req.user.role !== "MEMBER") {
      removeUploadedFile(req.file);
      return res.status(403).json({
        success: false,
        message: "Seul le demandeur peut dÃ©poser la preuve de paiement.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "La preuve de paiement est obligatoire.",
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `
        SELECT id, user_id, status, assigned_department
        FROM space_requests
        WHERE id = ?
        FOR UPDATE
      `,
      [requestId]
    );

    if (rows.length === 0) {
      await connection.rollback();
      removeUploadedFile(req.file);
      return res.status(404).json({
        success: false,
        message: "Demande introuvable.",
      });
    }

    const request = rows[0];

    if (Number(request.user_id) !== userId) {
      await connection.rollback();
      removeUploadedFile(req.file);
      return res.status(403).json({
        success: false,
        message: "Cette demande ne vous appartient pas.",
      });
    }

    if (request.status !== "awaiting_payment_proof") {
      await connection.rollback();
      removeUploadedFile(req.file);
      return res.status(409).json({
        success: false,
        message: "Cette demande nâ€™attend pas de preuve de paiement.",
      });
    }

    const quoteExists = await hasDocument(
      connection,
      requestId,
      "FINANCE_QUOTE"
    );

    if (!quoteExists) {
      await connection.rollback();
      removeUploadedFile(req.file);
      return res.status(409).json({
        success: false,
        message: "La cotation financiÃ¨re est absente.",
      });
    }

    const proofExists = await hasDocument(
      connection,
      requestId,
      "PAYMENT_PROOF"
    );

    if (proofExists) {
      await connection.rollback();
      removeUploadedFile(req.file);
      return res.status(409).json({
        success: false,
        message: "Une preuve de paiement a dÃ©jÃ  Ã©tÃ© dÃ©posÃ©e.",
      });
    }

    const documentUrl =
      `/uploads/space-requests/${req.file.filename}`;

    await connection.query(
      `
        INSERT INTO space_request_documents (
          space_request_id,
          document_type,
          document_name,
          document_path,
          document_mime_type,
          document_size,
          uploaded_by
        )
        VALUES (?, 'PAYMENT_PROOF', ?, ?, ?, ?, ?)
      `,
      [
        requestId,
        req.file.originalname,
        documentUrl,
        req.file.mimetype,
        req.file.size,
        userId,
      ]
    );

    const [updateResult] = await connection.query(
      `
        UPDATE space_requests
        SET
          status = 'program_payment_review',
          current_step = 'VÃ©rification du paiement par le Service des Programmes',
          assigned_department = 'PROGRAMME',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
          AND user_id = ?
          AND status = 'awaiting_payment_proof'
      `,
      [requestId, userId]
    );

    if (updateResult.affectedRows !== 1) {
      throw new Error("La preuve de paiement nâ€™a pas pu Ãªtre transmise.");
    }

    await connection.query(
      `
        INSERT INTO space_request_histories (
          space_request_id,
          action,
          previous_status,
          new_status,
          from_department,
          to_department,
          comment,
          electronic_signature,
          performed_by
        )
        VALUES (
          ?,
          'PAYMENT_PROOF_UPLOAD',
          'awaiting_payment_proof',
          'program_payment_review',
          'MEMBER',
          'PROGRAMME',
          'Preuve de paiement dÃ©posÃ©e par le demandeur.',
          NULL,
          ?
        )
      `,
      [requestId, userId]
    );

    await connection.commit();

    const updatedRequest = await findRequestById(requestId);

    return res.status(201).json({
      success: true,
      message: "Preuve de paiement transmise au Service des Programmes.",
      data: updatedRequest,
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Payment proof rollback error:", rollbackError);
      }
    }

    removeUploadedFile(req.file);
    console.error("Upload payment proof error:", error);

    return res.status(500).json({
      success: false,
      message: "Impossible dâ€™enregistrer la preuve de paiement.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  } finally {
    connection?.release();
  }
};

/**
 * GET /api/space-requests/supervisor
 * Vue globale en lecture pour SUPERVISEUR et ADMIN.
 */
exports.getSupervisorRequests = async (req, res) => {
  try {
    if (!["SUPERVISEUR", "ADMIN"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "AccÃ¨s rÃ©servÃ© au superviseur.",
      });
    }

    const [rows] = await pool.query(`
      ${SELECT_REQUEST}
      ORDER BY sr.updated_at DESC, sr.created_at DESC
    `);

    return res.json({
      success: true,
      data: rows.map(serializeRequest),
    });
  } catch (error) {
    console.error("Supervisor requests error:", error);
    return res.status(500).json({
      success: false,
      message: "Impossible de charger la vue globale des demandes.",
    });
  }
};

/**
 * GET /api/space-requests/calendar
 *
 * Calendrier des dates dÃ©finitivement confirmÃ©es par le Programme.
 * Une demande n'occupe une date que lorsque tout le processus est terminÃ©.
 */
exports.getBookedCalendarEvents = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
        SELECT
          sr.id,
          sr.reference,
          sr.title,
          slots.space_id,
          DATE_FORMAT(slots.desired_date, '%Y-%m-%d') AS desired_date
        FROM space_requests sr
        INNER JOIN space_request_slots slots
          ON slots.space_request_id = sr.id
        WHERE sr.status = 'completed'

        UNION ALL

        SELECT
          sr.id,
          sr.reference,
          sr.title,
          sr.space_id,
          DATE_FORMAT(sr.desired_date, '%Y-%m-%d') AS desired_date
        FROM space_requests sr
        WHERE
          sr.status = 'completed'
          AND sr.desired_date IS NOT NULL
          AND NOT EXISTS (
            SELECT 1
            FROM space_request_slots slots
            WHERE slots.space_request_id = sr.id
          )

        ORDER BY desired_date ASC, id ASC
      `
    );

    return res.json({
      success: true,
      data: rows.map((row) => {
        return {
          id: Number(row.id),
          reference:
            row.reference ||
            `Demande #${row.id}`,
          title:
            row.title ||
            "Ã‰vÃ©nement confirmÃ©",
          spaceId:
            row.space_id !== null &&
            row.space_id !== undefined
              ? Number(row.space_id)
              : null,
          date: row.desired_date,
        };
      }),
    });
  } catch (error) {
    console.error("Get booked calendar events error:", error);

    if (error.code === "ER_BAD_FIELD_ERROR") {
      return res.status(500).json({
        success: false,
        message:
          "La colonne space_id manque dans la table space_requests.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Impossible de charger le calendrier des Ã©vÃ©nements.",
      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,
    });
  }
};

/**
 * GET /api/space-requests/programme/assistants
 * Liste des assistants disponibles pour l'affectation.
 */
exports.getProgrammeAssistants = async (req, res) => {
  try {
    if (
      ![
        "ADMIN",
        "PROGRAMME",
        "PROGRAMME_SUPERVISEUR",
      ].includes(req.user.role)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "AccÃ¨s rÃ©servÃ© au superviseur du Programme.",
      });
    }

    const [rows] = await pool.query(`
      SELECT
        u.id,
        u.first_name AS firstName,
        u.last_name AS lastName,
        u.email,
        u.phone,
        u.role,
        COUNT(
          CASE
            WHEN sr.assigned_department = 'PROGRAMME'
            THEN sr.id
          END
        ) AS activeRequests
      FROM users u
      LEFT JOIN space_requests sr
        ON sr.assigned_to_user_id = u.id
      WHERE u.role = 'PROGRAMME_ASSISTANT'
      GROUP BY
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.role
      ORDER BY u.first_name, u.last_name, u.email
    `);

    return res.json({
      success: true,
      data: rows.map((row) => ({
        ...row,
        activeRequests: Number(row.activeRequests || 0),
      })),
    });
  } catch (error) {
    console.error("Get programme assistants error:", error);
    return res.status(500).json({
      success: false,
      message:
        "Impossible de charger les assistants du Programme.",
    });
  }
};

/**
 * GET /api/space-requests/artistic/assistants
 * Liste des assistants de la Direction artistique.
 */
exports.getArtisticAssistants = async (
  req,
  res
) => {
  try {
    if (
      ![
        "ADMIN",
        "DIRECTION_ARTISTIQUE",
        "DIRECTION_ARTISTIQUE_SUPERVISEUR",
      ].includes(req.user.role)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "AccÃ¨s rÃ©servÃ© au superviseur de la Direction artistique.",
      });
    }

    const [rows] = await pool.query(`
      SELECT
        u.id,
        u.first_name AS firstName,
        u.last_name AS lastName,
        u.email,
        u.phone,
        u.role,
        COUNT(
          CASE
            WHEN sr.assigned_department =
              'DIRECTION_ARTISTIQUE'
            THEN sr.id
          END
        ) AS activeRequests
      FROM users u
      LEFT JOIN space_requests sr
        ON sr.artistic_assigned_to = u.id
      WHERE
        u.role =
          'DIRECTION_ARTISTIQUE_ASSISTANT'
      GROUP BY
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.role
      ORDER BY
        u.first_name,
        u.last_name,
        u.email
    `);

    return res.json({
      success: true,
      data: rows.map((row) => ({
        ...row,
        activeRequests: Number(
          row.activeRequests || 0
        ),
      })),
    });
  } catch (error) {
    console.error(
      "Get artistic assistants error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Impossible de charger les assistants de la Direction artistique.",
    });
  }
};

/**
 * GET /api/space-requests/legal/assistants
 * Liste des assistants du Service juridique.
 */
exports.getLegalAssistants = async (
  req,
  res
) => {
  try {
    if (
      ![
        "ADMIN",
        "JURIDIQUE",
        "JURIDIQUE_SUPERVISEUR",
      ].includes(req.user.role)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "AccÃ¨s rÃ©servÃ© au superviseur du Service juridique.",
      });
    }

    const [rows] = await pool.query(`
      SELECT
        u.id,
        u.first_name AS firstName,
        u.last_name AS lastName,
        u.email,
        u.phone,
        u.role,
        COUNT(
          CASE
            WHEN sr.assigned_department =
              'JURIDIQUE'
            THEN sr.id
          END
        ) AS activeRequests
      FROM users u
      LEFT JOIN space_requests sr
        ON sr.legal_assigned_to = u.id
      WHERE
        u.role = 'JURIDIQUE_ASSISTANT'
      GROUP BY
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.role
      ORDER BY
        u.first_name,
        u.last_name,
        u.email
    `);

    return res.json({
      success: true,
      data: rows.map((row) => ({
        ...row,
        activeRequests: Number(
          row.activeRequests || 0
        ),
      })),
    });
  } catch (error) {
    console.error(
      "Get legal assistants error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Impossible de charger les assistants du Service juridique.",
    });
  }
};

/**
 * POST /api/space-requests/:id/assign-programme-assistant
 * Affectation d'une demande par le superviseur du Programme.
 */
exports.assignProgrammeAssistant = async (req, res) => {
  let connection;

  try {
    if (
      ![
        "ADMIN",
        "PROGRAMME",
        "PROGRAMME_SUPERVISEUR",
      ].includes(req.user.role)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "AccÃ¨s rÃ©servÃ© au superviseur du Programme.",
      });
    }

    const requestId = Number(req.params.id);
    const assistantId = Number(req.body.assistantId);
    const comment =
      typeof req.body.comment === "string"
        ? req.body.comment.trim()
        : "";

    if (
      !Number.isInteger(requestId) ||
      requestId <= 0 ||
      !Number.isInteger(assistantId) ||
      assistantId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "La demande et l'assistant sont obligatoires.",
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [requestRows] = await connection.query(
      `SELECT id, status, assigned_department
       FROM space_requests
       WHERE id = ?
       FOR UPDATE`,
      [requestId]
    );

    if (requestRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Demande introuvable.",
      });
    }

    const request = requestRows[0];

    if (request.assigned_department !== "PROGRAMME") {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message:
          "Cette demande n'est pas actuellement au Programme.",
      });
    }

    const [assistantRows] = await connection.query(
      `SELECT id, first_name, last_name, email
       FROM users
       WHERE id = ? AND role = 'PROGRAMME_ASSISTANT'
       LIMIT 1`,
      [assistantId]
    );

    if (assistantRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message:
          "Assistant Programme introuvable.",
      });
    }

    const assistant = assistantRows[0];
    const assistantName =
      `${assistant.first_name || ""} ${
        assistant.last_name || ""
      }`.trim() || assistant.email;

    await connection.query(
      `UPDATE space_requests
       SET
         assigned_to_user_id = ?,
         programme_review_state = 'assigned',
         assistant_comment = NULL,
         assistant_signature = NULL,
         assistant_reviewed_at = NULL,
         current_step = ?,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        assistantId,
        `Dossier affectÃ© Ã  ${assistantName}`,
        requestId,
      ]
    );

    await connection.query(
      `INSERT INTO space_request_histories (
         space_request_id,
         action,
         previous_status,
         new_status,
         from_department,
         to_department,
         comment,
         electronic_signature,
         performed_by
       ) VALUES (?, 'ASSIGN', ?, ?, 'PROGRAMME',
         'PROGRAMME', ?, NULL, ?)`,
      [
        requestId,
        request.status,
        request.status,
        comment || `Dossier affectÃ© Ã  ${assistantName}`,
        req.user.id,
      ]
    );

    await connection.commit();

    const updatedRequest =
      await findRequestById(requestId);

    return res.json({
      success: true,
      message: `Demande affectÃ©e Ã  ${assistantName}.`,
      data: updatedRequest,
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error(
          "Programme assignment rollback error:",
          rollbackError
        );
      }
    }

    console.error("Assign programme assistant error:", error);
    return res.status(500).json({
      success: false,
      message:
        "Impossible d'affecter cette demande.",
    });
  } finally {
    connection?.release();
  }
};

/**
 * POST /api/space-requests/:id/unassign-programme-assistant
 * Retire l'affectation Programme avant que l'assistant ne rende son avis.
 */
exports.unassignProgrammeAssistant = async (req, res) => {
  let connection;

  try {
    if (
      ![
        "ADMIN",
        "PROGRAMME",
        "PROGRAMME_SUPERVISEUR",
      ].includes(req.user.role)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "AccÃ¨s rÃ©servÃ© au superviseur du Programme.",
      });
    }

    const requestId = Number(req.params.id);
    const comment =
      typeof req.body.comment === "string"
        ? req.body.comment.trim()
        : "";

    if (!Number.isInteger(requestId) || requestId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Identifiant de demande invalide.",
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [requestRows] = await connection.query(
      `SELECT sr.id, sr.status, sr.assigned_department,
              sr.assigned_to_user_id, sr.programme_review_state,
              u.first_name, u.last_name, u.email
       FROM space_requests sr
       LEFT JOIN users u ON u.id = sr.assigned_to_user_id
       WHERE sr.id = ?
       FOR UPDATE`,
      [requestId]
    );

    if (requestRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Demande introuvable.",
      });
    }

    const request = requestRows[0];

    if (request.assigned_department !== "PROGRAMME") {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message:
          "Cette demande n'est pas actuellement au Programme.",
      });
    }

    if (!request.assigned_to_user_id) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: "Cette demande n'est affectÃ©e Ã  aucun assistant.",
      });
    }

    if (
      ["assistant_validated", "assistant_rejected"].includes(
        request.programme_review_state
      )
    ) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message:
          "L'affectation ne peut plus Ãªtre retirÃ©e aprÃ¨s l'avis de l'assistant.",
      });
    }

    const previousAssistantName =
      `${request.first_name || ""} ${
        request.last_name || ""
      }`.trim() ||
      request.email ||
      `utilisateur #${request.assigned_to_user_id}`;

    await connection.query(
      `UPDATE space_requests
       SET
         assigned_to_user_id = NULL,
         programme_review_state = 'unassigned',
         assistant_comment = NULL,
         assistant_signature = NULL,
         assistant_reviewed_at = NULL,
         current_step = 'En attente dâ€™affectation Ã  un assistant Programme',
         updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [requestId]
    );

    const historyComment =
      comment ||
      `Affectation retirÃ©e Ã  ${previousAssistantName}`;

    await connection.query(
      `INSERT INTO space_request_histories (
         space_request_id,
         action,
         previous_status,
         new_status,
         from_department,
         to_department,
         comment,
         electronic_signature,
         performed_by
       ) VALUES (?, 'UNASSIGN', ?, ?, 'PROGRAMME',
         'PROGRAMME', ?, NULL, ?)`,
      [
        requestId,
        request.status,
        request.status,
        historyComment,
        req.user.id,
      ]
    );

    await connection.commit();

    const updatedRequest = await findRequestById(requestId);

    return res.json({
      success: true,
      message: `Affectation de ${previousAssistantName} retirÃ©e.`,
      data: updatedRequest,
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error(
          "Programme unassignment rollback error:",
          rollbackError
        );
      }
    }

    console.error("Unassign programme assistant error:", error);
    return res.status(500).json({
      success: false,
      message:
        "Impossible de retirer l'affectation de cette demande.",
    });
  } finally {
    connection?.release();
  }
};

/**
 * POST /api/space-requests/:id/assign-artistic-assistant
 * Le superviseur artistique affecte une demande.
 */
exports.assignArtisticAssistant = async (
  req,
  res
) => {
  let connection;

  try {
    if (
      ![
        "ADMIN",
        "DIRECTION_ARTISTIQUE",
        "DIRECTION_ARTISTIQUE_SUPERVISEUR",
      ].includes(req.user.role)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "AccÃ¨s rÃ©servÃ© au superviseur de la Direction artistique.",
      });
    }

    const requestId = Number(
      req.params.id
    );
    const assistantId = Number(
      req.body.assistantId
    );
    const comment =
      typeof req.body.comment ===
      "string"
        ? req.body.comment.trim()
        : "";

    if (
      !Number.isInteger(requestId) ||
      requestId <= 0 ||
      !Number.isInteger(assistantId) ||
      assistantId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "La demande et l'assistant artistique sont obligatoires.",
      });
    }

    connection =
      await pool.getConnection();
    await connection.beginTransaction();

    const [requestRows] =
      await connection.query(
        `
          SELECT
            id,
            status,
            assigned_department
          FROM space_requests
          WHERE id = ?
          FOR UPDATE
        `,
        [requestId]
      );

    if (requestRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Demande introuvable.",
      });
    }

    const request = requestRows[0];

    if (
      !["artistic_initial_review", "artistic_final_review"].includes(request.status) ||
      request.assigned_department !==
        "DIRECTION_ARTISTIQUE"
    ) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message:
          "Cette demande n'est pas actuellement en examen artistique.",
      });
    }

    const [assistantRows] =
      await connection.query(
        `
          SELECT
            id,
            first_name,
            last_name,
            email
          FROM users
          WHERE
            id = ?
            AND role =
              'DIRECTION_ARTISTIQUE_ASSISTANT'
          LIMIT 1
        `,
        [assistantId]
      );

    if (assistantRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message:
          "Assistant de la Direction artistique introuvable.",
      });
    }

    const assistant = assistantRows[0];
    const assistantName =
      `${assistant.first_name || ""} ${
        assistant.last_name || ""
      }`.trim() || assistant.email;

    await connection.query(
      `
        UPDATE space_requests
        SET
          artistic_assigned_to = ?,
          artistic_review_state =
            'assigned',
          artistic_assistant_comment =
            NULL,
          artistic_assistant_signature =
            NULL,
          artistic_assistant_reviewed_at =
            NULL,
          current_step = ?,
          updated_at =
            CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [
        assistantId,
        `Dossier artistique affectÃ© Ã  ${assistantName}`,
        requestId,
      ]
    );

    await connection.query(
      `
        INSERT INTO space_request_histories (
          space_request_id,
          action,
          previous_status,
          new_status,
          from_department,
          to_department,
          comment,
          electronic_signature,
          performed_by
        )
        VALUES (
          ?,
          'ARTISTIC_ASSIGN',
          ?,
          ?,
          'DIRECTION_ARTISTIQUE',
          'DIRECTION_ARTISTIQUE',
          ?,
          NULL,
          ?
        )
      `,
      [
        requestId,
        request.status,
        request.status,
        comment ||
          `Dossier artistique affectÃ© Ã  ${assistantName}`,
        req.user.id,
      ]
    );

    await connection.commit();

    return res.json({
      success: true,
      message:
        `Demande affectÃ©e Ã  ${assistantName}.`,
      data: await findRequestById(
        requestId
      ),
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error(
          "Artistic assignment rollback error:",
          rollbackError
        );
      }
    }

    console.error(
      "Assign artistic assistant error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Impossible d'affecter cette demande Ã  l'assistant artistique.",
    });
  } finally {
    connection?.release();
  }
};

/**
 * POST /api/space-requests/:id/assign-legal-assistant
 * Le superviseur juridique affecte une demande.
 */
exports.assignLegalAssistant = async (
  req,
  res
) => {
  let connection;

  try {
    if (
      ![
        "ADMIN",
        "JURIDIQUE",
        "JURIDIQUE_SUPERVISEUR",
      ].includes(req.user.role)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "AccÃ¨s rÃ©servÃ© au superviseur du Service juridique.",
      });
    }

    const requestId = Number(
      req.params.id
    );
    const assistantId = Number(
      req.body.assistantId
    );
    const comment =
      typeof req.body.comment === "string"
        ? req.body.comment.trim()
        : "";

    if (
      !Number.isInteger(requestId) ||
      requestId <= 0 ||
      !Number.isInteger(assistantId) ||
      assistantId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "La demande et l'assistant juridique sont obligatoires.",
      });
    }

    connection =
      await pool.getConnection();
    await connection.beginTransaction();

    const [requestRows] =
      await connection.query(
        `
          SELECT
            id,
            status,
            assigned_department
          FROM space_requests
          WHERE id = ?
          FOR UPDATE
        `,
        [requestId]
      );

    if (requestRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Demande introuvable.",
      });
    }

    const request = requestRows[0];

    if (
      request.status !== "legal_review" ||
      request.assigned_department !==
        "JURIDIQUE"
    ) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message:
          "Cette demande n'est pas actuellement en examen juridique.",
      });
    }

    const [assistantRows] =
      await connection.query(
        `
          SELECT
            id,
            first_name,
            last_name,
            email
          FROM users
          WHERE
            id = ?
            AND role =
              'JURIDIQUE_ASSISTANT'
          LIMIT 1
        `,
        [assistantId]
      );

    if (assistantRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message:
          "Assistant juridique introuvable.",
      });
    }

    const assistant = assistantRows[0];
    const assistantName =
      `${assistant.first_name || ""} ${
        assistant.last_name || ""
      }`.trim() || assistant.email;

    await connection.query(
      `
        UPDATE space_requests
        SET
          legal_assigned_to = ?,
          legal_review_state =
            'assigned',
          legal_assistant_comment = NULL,
          legal_assistant_signature = NULL,
          legal_assistant_reviewed_at = NULL,
          current_step = ?,
          updated_at =
            CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [
        assistantId,
        `Dossier juridique affectÃ© Ã  ${assistantName}`,
        requestId,
      ]
    );

    await connection.query(
      `
        INSERT INTO space_request_histories (
          space_request_id,
          action,
          previous_status,
          new_status,
          from_department,
          to_department,
          comment,
          electronic_signature,
          performed_by
        )
        VALUES (
          ?,
          'LEGAL_ASSIGN',
          ?,
          ?,
          'JURIDIQUE',
          'JURIDIQUE',
          ?,
          NULL,
          ?
        )
      `,
      [
        requestId,
        request.status,
        request.status,
        comment ||
          `Dossier juridique affectÃ© Ã  ${assistantName}`,
        req.user.id,
      ]
    );

    await connection.commit();

    return res.json({
      success: true,
      message:
        `Demande affectÃ©e Ã  ${assistantName}.`,
      data: await findRequestById(
        requestId
      ),
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error(
          "Legal assignment rollback error:",
          rollbackError
        );
      }
    }

    console.error(
      "Assign legal assistant error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Impossible d'affecter cette demande Ã  l'assistant juridique.",
    });
  } finally {
    connection?.release();
  }
};

/**
 * POST /api/space-requests/:id/assistant-review
 *
 * L'assistant rend un avis signÃ©. Cette action ne fait pas avancer
 * le workflow : le dossier revient au superviseur Programme.
 */
exports.assistantReview = async (req, res) => {
  let connection;

  try {
    if (req.user.role !== "PROGRAMME_ASSISTANT") {
      return res.status(403).json({
        success: false,
        message: "Action rÃ©servÃ©e Ã  un assistant Programme.",
      });
    }

    const requestId = Number(req.params.id);
    const userId = Number(req.user.id);
    const decision = String(req.body.decision || "").toUpperCase();
    const comment = String(req.body.comment || "").trim();
    const electronicSignature = String(
      req.body.electronicSignature || ""
    ).trim();

    if (!Number.isInteger(requestId) || requestId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Identifiant de demande invalide.",
      });
    }

    if (!["VALIDATED", "REJECTED"].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: "La dÃ©cision de l'assistant est invalide.",
      });
    }

    if (comment.length < 5) {
      return res.status(400).json({
        success: false,
        message: "Le commentaire doit contenir au moins 5 caractÃ¨res.",
      });
    }

    if (electronicSignature.length < 3) {
      return res.status(400).json({
        success: false,
        message: "La signature Ã©lectronique est obligatoire.",
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `SELECT id, status, assigned_department, assigned_to_user_id,
              programme_review_state
       FROM space_requests
       WHERE id = ?
       FOR UPDATE`,
      [requestId]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Demande introuvable.",
      });
    }

    const request = rows[0];

    if (
      request.assigned_department !== "PROGRAMME" ||
      Number(request.assigned_to_user_id) !== userId
    ) {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message: "Cette demande n'est pas assignÃ©e Ã  votre compte.",
      });
    }

    if (![
        "program_review",
        "program_review_after_artistic",
        "program_review_after_confirmation",
        "program_review_after_parallel",
        "program_review_after_regisseur_rejection",
        "program_review_after_legal",
        "program_review_after_finance",
        "program_payment_review",
      ].includes(request.status)) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: "Cette demande n'est pas Ã  une Ã©tape Programme.",
      });
    }

    const reviewState =
      decision === "VALIDATED"
        ? "assistant_validated"
        : "assistant_rejected";

    const currentStep =
      decision === "VALIDATED"
        ? "Traitement terminÃ© par l'assistant â€” validation du superviseur requise"
        : "Rejet recommandÃ© par l'assistant â€” dÃ©cision du superviseur requise";

    await connection.query(
      `UPDATE space_requests
       SET programme_review_state = ?,
           assistant_comment = ?,
           assistant_signature = ?,
           assistant_reviewed_at = NOW(),
           assigned_to_user_id = NULL,
           current_step = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [reviewState, comment, electronicSignature, currentStep, requestId]
    );

    await connection.query(
      `INSERT INTO space_request_histories (
         space_request_id, action, previous_status, new_status,
         from_department, to_department, comment,
         electronic_signature, performed_by
       ) VALUES (?, ?, ?, ?, 'PROGRAMME', 'PROGRAMME', ?, ?, ?)`,
      [
        requestId,
        decision === "VALIDATED"
          ? "ASSISTANT_VALIDATE"
          : "ASSISTANT_REJECT_RECOMMENDATION",
        request.status,
        request.status,
        comment,
        electronicSignature,
        userId,
      ]
    );

    await connection.commit();

    return res.json({
      success: true,
      message:
        decision === "VALIDATED"
          ? "Avis validÃ© et transmis au superviseur Programme."
          : "Rejet recommandÃ© et transmis au superviseur Programme.",
      data: await findRequestById(requestId),
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Assistant review rollback error:", rollbackError);
      }
    }

    console.error("Assistant review error:", error);
    return res.status(500).json({
      success: false,
      message: "Impossible d'enregistrer l'avis de l'assistant.",
    });
  } finally {
    connection?.release();
  }
};

/**
 * POST /api/space-requests/:id/artistic-assistant-review
 *
 * L'assistant artistique remet un avis signÃ©.
 * Le workflow reste Ã  l'Ã©tape artistic_review :
 * le superviseur artistique prend ensuite la
 * dÃ©cision finale ou traite directement le dossier.
 */
exports.artisticAssistantReview = async (
  req,
  res
) => {
  let connection;

  try {
    if (
      req.user.role !==
      "DIRECTION_ARTISTIQUE_ASSISTANT"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Action rÃ©servÃ©e Ã  un assistant de la Direction artistique.",
      });
    }

    const requestId = Number(
      req.params.id
    );
    const userId = Number(req.user.id);
    const decision = String(
      req.body.decision || ""
    ).toUpperCase();
    const comment = String(
      req.body.comment || ""
    ).trim();
    const electronicSignature = String(
      req.body.electronicSignature || ""
    ).trim();

    if (
      !Number.isInteger(requestId) ||
      requestId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Identifiant de demande invalide.",
      });
    }

    if (
      ![
        "VALIDATED",
        "REJECTED",
      ].includes(decision)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "La dÃ©cision de l'assistant artistique est invalide.",
      });
    }

    if (comment.length < 5) {
      return res.status(400).json({
        success: false,
        message:
          "Le commentaire doit contenir au moins 5 caractÃ¨res.",
      });
    }

    if (
      electronicSignature.length < 3
    ) {
      return res.status(400).json({
        success: false,
        message:
          "La signature Ã©lectronique est obligatoire.",
      });
    }

    connection =
      await pool.getConnection();
    await connection.beginTransaction();

    const [rows] =
      await connection.query(
        `
          SELECT
            id,
            status,
            assigned_department,
            artistic_assigned_to,
            artistic_review_state
          FROM space_requests
          WHERE id = ?
          FOR UPDATE
        `,
        [requestId]
      );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Demande introuvable.",
      });
    }

    const request = rows[0];

    if (
      !["artistic_initial_review", "artistic_final_review"].includes(request.status) ||
      request.assigned_department !==
        "DIRECTION_ARTISTIQUE" ||
      Number(
        request.artistic_assigned_to
      ) !== userId
    ) {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message:
          "Cette demande artistique n'est pas assignÃ©e Ã  votre compte.",
      });
    }

    if (decision === "VALIDATED") {
      const opinionExists =
        await hasDocument(
          connection,
          requestId,
          "ARTISTIC_OPINION"
        );

      if (!opinionExists) {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          message:
            "Ajoutez l'avis artistique avant de transmettre le dossier au superviseur.",
          missingDocuments: [
            "ARTISTIC_OPINION",
          ],
        });
      }
    }

    const reviewState =
      decision === "VALIDATED"
        ? "assistant_validated"
        : "assistant_rejected";

    const currentStep =
      decision === "VALIDATED"
        ? "Avis prÃ©parÃ© par l'assistant artistique â€” validation du superviseur requise"
        : "Rejet recommandÃ© par l'assistant artistique â€” dÃ©cision du superviseur requise";

    await connection.query(
      `
        UPDATE space_requests
        SET
          artistic_review_state = ?,
          artistic_assistant_comment = ?,
          artistic_assistant_signature = ?,
          artistic_assistant_reviewed_at =
            NOW(),
          artistic_assigned_to = NULL,
          current_step = ?,
          updated_at =
            CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [
        reviewState,
        comment,
        electronicSignature,
        currentStep,
        requestId,
      ]
    );

    await connection.query(
      `
        INSERT INTO space_request_histories (
          space_request_id,
          action,
          previous_status,
          new_status,
          from_department,
          to_department,
          comment,
          electronic_signature,
          performed_by
        )
        VALUES (
          ?,
          ?,
          ?,
          ?,
          'DIRECTION_ARTISTIQUE',
          'DIRECTION_ARTISTIQUE',
          ?,
          ?,
          ?
        )
      `,
      [
        requestId,
        decision === "VALIDATED"
          ? "ARTISTIC_ASSISTANT_VALIDATE"
          : "ARTISTIC_ASSISTANT_REJECT_RECOMMENDATION",
        request.status,
        request.status,
        comment,
        electronicSignature,
        userId,
      ]
    );

    await connection.commit();

    return res.json({
      success: true,
      message:
        decision === "VALIDATED"
          ? "Avis artistique transmis au superviseur de la Direction artistique."
          : "Rejet recommandÃ© au superviseur de la Direction artistique.",
      data: await findRequestById(
        requestId
      ),
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error(
          "Artistic assistant review rollback error:",
          rollbackError
        );
      }
    }

    console.error(
      "Artistic assistant review error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Impossible d'enregistrer l'avis de l'assistant artistique.",
    });
  } finally {
    connection?.release();
  }
};

/**
 * POST /api/space-requests/:id/legal-assistant-review
 * L'assistant juridique retourne son avis signÃ© au superviseur.
 */
exports.legalAssistantReview = async (
  req,
  res
) => {
  let connection;

  try {
    if (
      req.user.role !==
      "JURIDIQUE_ASSISTANT"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Action rÃ©servÃ©e Ã  un assistant juridique.",
      });
    }

    const requestId = Number(
      req.params.id
    );
    const userId = Number(req.user.id);
    const decision = String(
      req.body.decision || ""
    ).toUpperCase();
    const comment = String(
      req.body.comment || ""
    ).trim();
    const electronicSignature = String(
      req.body.electronicSignature || ""
    ).trim();

    if (
      !Number.isInteger(requestId) ||
      requestId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Identifiant de demande invalide.",
      });
    }

    if (
      ![
        "VALIDATED",
        "REJECTED",
      ].includes(decision)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "La dÃ©cision de l'assistant juridique est invalide.",
      });
    }

    if (comment.length < 5) {
      return res.status(400).json({
        success: false,
        message:
          "Le commentaire doit contenir au moins 5 caractÃ¨res.",
      });
    }

    if (
      electronicSignature.length < 3
    ) {
      return res.status(400).json({
        success: false,
        message:
          "La signature Ã©lectronique est obligatoire.",
      });
    }

    connection =
      await pool.getConnection();
    await connection.beginTransaction();

    const [rows] =
      await connection.query(
        `
          SELECT
            id,
            status,
            assigned_department,
            legal_assigned_to,
            legal_review_state
          FROM space_requests
          WHERE id = ?
          FOR UPDATE
        `,
        [requestId]
      );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Demande introuvable.",
      });
    }

    const request = rows[0];

    if (
      request.status !== "legal_review" ||
      request.assigned_department !==
        "JURIDIQUE" ||
      Number(request.legal_assigned_to) !==
        userId
    ) {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message:
          "Cette demande juridique n'est pas assignÃ©e Ã  votre compte.",
      });
    }

    if (decision === "VALIDATED") {
      const legalDocumentExists =
        await hasDocument(
          connection,
          requestId,
          "LEGAL_DOCUMENT"
        );

      if (!legalDocumentExists) {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          message:
            "Ajoutez le document juridique avant de transmettre le dossier au superviseur.",
          missingDocuments: [
            "LEGAL_DOCUMENT",
          ],
        });
      }
    }

    const reviewState =
      decision === "VALIDATED"
        ? "assistant_validated"
        : "assistant_rejected";

    const currentStep =
      decision === "VALIDATED"
        ? "Avis prÃ©parÃ© par l'assistant juridique â€” validation du superviseur requise"
        : "Rejet recommandÃ© par l'assistant juridique â€” dÃ©cision du superviseur requise";

    await connection.query(
      `
        UPDATE space_requests
        SET
          legal_review_state = ?,
          legal_assistant_comment = ?,
          legal_assistant_signature = ?,
          legal_assistant_reviewed_at =
            NOW(),
          legal_assigned_to = NULL,
          current_step = ?,
          updated_at =
            CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [
        reviewState,
        comment,
        electronicSignature,
        currentStep,
        requestId,
      ]
    );

    await connection.query(
      `
        INSERT INTO space_request_histories (
          space_request_id,
          action,
          previous_status,
          new_status,
          from_department,
          to_department,
          comment,
          electronic_signature,
          performed_by
        )
        VALUES (
          ?,
          ?,
          ?,
          ?,
          'JURIDIQUE',
          'JURIDIQUE',
          ?,
          ?,
          ?
        )
      `,
      [
        requestId,
        decision === "VALIDATED"
          ? "LEGAL_ASSISTANT_VALIDATE"
          : "LEGAL_ASSISTANT_REJECT_RECOMMENDATION",
        request.status,
        request.status,
        comment,
        electronicSignature,
        userId,
      ]
    );

    await connection.commit();

    return res.json({
      success: true,
      message:
        decision === "VALIDATED"
          ? "Avis juridique transmis au superviseur du Service juridique."
          : "Rejet recommandÃ© au superviseur du Service juridique.",
      data: await findRequestById(
        requestId
      ),
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error(
          "Legal assistant review rollback error:",
          rollbackError
        );
      }
    }

    console.error(
      "Legal assistant review error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Impossible d'enregistrer l'avis de l'assistant juridique.",
    });
  } finally {
    connection?.release();
  }
};

exports.validate = async (req, res) => {
  let connection;

  try {
    const requestId = Number(
      req.params.id
    );

    const userId = Number(req.user.id);
    const role = req.user.role;
    const workflowRole =
      getWorkflowRole(role);

    const comment =
      typeof req.body.comment === "string"
        ? req.body.comment.trim()
        : "";

    const electronicSignature =
      typeof req.body
        .electronicSignature === "string"
        ? req.body.electronicSignature.trim()
        : "";

    const paymentAmount =
      req.body.paymentAmount ===
        undefined ||
      req.body.paymentAmount === null ||
      req.body.paymentAmount === ""
        ? null
        : Number(
            req.body.paymentAmount
          );

    if (
      !Number.isInteger(requestId) ||
      requestId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Identifiant de demande invalide.",
      });
    }

    if (
      electronicSignature.length < 3
    ) {
      return res.status(400).json({
        success: false,
        message:
          "La signature Ã©lectronique est obligatoire.",
      });
    }

    connection =
      await pool.getConnection();

    await connection.beginTransaction();

    const [rows] =
      await connection.query(
        `
          SELECT
            id,
            user_id,
            desired_date,
            space_id,
            status,
            assigned_department,
            assigned_to_user_id,
            programme_review_state,
            artistic_assigned_to,
            artistic_review_state,
            legal_assigned_to,
            legal_review_state
          FROM space_requests
          WHERE id = ?
          FOR UPDATE
        `,
        [requestId]
      );

    if (rows.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message:
          "Demande introuvable.",
      });
    }

    const request = rows[0];

    const transition =
      WORKFLOW_TRANSITIONS[
        request.status
      ];

    if (!transition) {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message:
          "Cette demande ne peut pas Ãªtre validÃ©e Ã  cette Ã©tape.",
      });
    }

    if (
      role !== "ADMIN" &&
      request.assigned_department !==
        workflowRole
    ) {
      await connection.rollback();

      return res.status(403).json({
        success: false,
        message:
          "Cette demande nâ€™est pas assignÃ©e Ã  votre service.",
      });
    }

    if (
      role !== "ADMIN" &&
      transition.role !== workflowRole
    ) {
      await connection.rollback();

      return res.status(403).json({
        success: false,
        message:
          "Votre rÃ´le ne permet pas de valider cette Ã©tape.",
      });
    }

    if (role === "PROGRAMME_ASSISTANT") {
      await connection.rollback();

      return res.status(403).json({
        success: false,
        message:
          "L'assistant doit transmettre son avis au superviseur Programme.",
      });
    }

    if (
      role ===
      "DIRECTION_ARTISTIQUE_ASSISTANT"
    ) {
      await connection.rollback();

      return res.status(403).json({
        success: false,
        message:
          "L'assistant artistique doit transmettre son avis au superviseur de la Direction artistique.",
      });
    }

    if (role === "JURIDIQUE_ASSISTANT") {
      await connection.rollback();

      return res.status(403).json({
        success: false,
        message:
          "L'assistant juridique doit transmettre son avis au superviseur du Service juridique.",
      });
    }

    if (
      transition.role === "PROGRAMME" &&
      !["ADMIN", "PROGRAMME", "PROGRAMME_SUPERVISEUR"].includes(role)
    ) {
      await connection.rollback();

      return res.status(403).json({
        success: false,
        message:
          "Seul le superviseur Programme peut prendre la dÃ©cision finale.",
      });
    }

    if (
      transition.role ===
        "DIRECTION_ARTISTIQUE" &&
      ![
        "ADMIN",
        "DIRECTION_ARTISTIQUE",
        "DIRECTION_ARTISTIQUE_SUPERVISEUR",
      ].includes(role)
    ) {
      await connection.rollback();

      return res.status(403).json({
        success: false,
        message:
          "Seul le superviseur de la Direction artistique peut prendre la dÃ©cision finale.",
      });
    }

    if (
      transition.role === "JURIDIQUE" &&
      ![
        "ADMIN",
        "JURIDIQUE",
        "JURIDIQUE_SUPERVISEUR",
      ].includes(role)
    ) {
      await connection.rollback();

      return res.status(403).json({
        success: false,
        message:
          "Seul le superviseur juridique peut prendre la dÃ©cision finale.",
      });
    }

    const requiredDocuments =
      transition.requiredDocuments ||
      (transition.requiredDocument
        ? [transition.requiredDocument]
        : []);

    if (requiredDocuments.length > 0) {
      const missingDocuments =
        await getMissingDocuments(
          connection,
          requestId,
          requiredDocuments
        );

      if (missingDocuments.length > 0) {
        await connection.rollback();

        return res.status(409).json({
          success: false,
          message:
            "Le dossier ne contient pas tous les documents requis.",
          missingDocuments,
        });
      }
    }

    if (
      request.status ===
      "finance_cotation"
    ) {
      if (
        paymentAmount === null ||
        !Number.isFinite(
          paymentAmount
        ) ||
        paymentAmount < 0
      ) {
        await connection.rollback();

        return res.status(400).json({
          success: false,
          message:
            "Le montant de la cotation est obligatoire.",
        });
      }
    }

    /*
     * La derniÃ¨re validation du Programme confirme dÃ©finitivement
     * la date. On empÃªche donc deux Ã©vÃ©nements terminÃ©s d'occuper
     * le mÃªme espace pendant la mÃªme journÃ©e.
     */
    if (
      transition.nextStatus === "completed" &&
      request.desired_date
    ) {
      const [dateConflicts] =
        await connection.query(
          `
            SELECT id, reference, title
            FROM space_requests
            WHERE
              status = 'completed'
              AND DATE(desired_date) = DATE(?)
              AND space_id = ?
              AND id <> ?
            LIMIT 1
          `,
          [
            request.desired_date,
            request.space_id,
            requestId,
          ]
        );

      if (dateConflicts.length > 0) {
        await connection.rollback();

        return res.status(409).json({
          success: false,
          message:
            "Cet espace est dÃ©jÃ  occupÃ© Ã  cette date. Choisissez un autre espace ou une autre date.",
          conflict: {
            id: dateConflicts[0].id,
            reference:
              dateConflicts[0].reference,
            title: dateConflicts[0].title,
          },
        });
      }
    }

    await connection.query(
      `
        UPDATE space_requests
        SET
          status = ?,
          current_step = ?,
          assigned_department = ?,
          assigned_to_user_id = NULL,
          programme_review_state = NULL,
          assistant_comment = NULL,
          assistant_signature = NULL,
          assistant_reviewed_at = NULL,
          artistic_assigned_to = NULL,
          artistic_review_state = NULL,
          artistic_assistant_comment = NULL,
          artistic_assistant_signature = NULL,
          artistic_assistant_reviewed_at = NULL,
          legal_assigned_to = NULL,
          legal_review_state = NULL,
          legal_assistant_comment = NULL,
          legal_assistant_signature = NULL,
          legal_assistant_reviewed_at = NULL,
          payment_amount =
            CASE
              WHEN ? IS NULL
              THEN payment_amount
              ELSE ?
            END,
          updated_at =
            CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [
        transition.nextStatus,
        transition.nextStep,
        transition.nextDepartment,
        paymentAmount,
        paymentAmount,
        requestId,
      ]
    );

    await connection.query(
      `
        INSERT INTO space_request_histories (
          space_request_id,
          action,
          previous_status,
          new_status,
          from_department,
          to_department,
          comment,
          electronic_signature,
          performed_by
        )
        VALUES (
          ?,
          'VALIDATE',
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?
        )
      `,
      [
        requestId,
        request.status,
        transition.nextStatus,
        request.assigned_department,
        transition.nextDepartment,
        comment || null,
        electronicSignature,
        userId,
      ]
    );

    await connection.commit();

    const updatedRequest =
      await findRequestById(requestId);

    return res.json({
      success: true,
      message:
        "Demande signÃ©e, validÃ©e et transmise.",
      data: updatedRequest,
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error(
      "Validate request error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Impossible de valider la demande.",
      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,
    });
  } finally {
    connection?.release();
  }
};

/*
 * POST /api/space-requests/:id/reject
 */
exports.reject = async (req, res) => {
  let connection;

  try {
    const requestId = Number(
      req.params.id
    );

    const userId = Number(req.user.id);
    const role = req.user.role;
    const workflowRole =
      getWorkflowRole(role);

    const comment =
      typeof req.body.comment === "string"
        ? req.body.comment.trim()
        : "";

    const electronicSignature =
      typeof req.body
        .electronicSignature === "string"
        ? req.body.electronicSignature.trim()
        : "";

    if (
      !Number.isInteger(requestId) ||
      requestId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Identifiant de demande invalide.",
      });
    }

    if (comment.length < 5) {
      return res.status(400).json({
        success: false,
        message:
          "Le motif du rejet doit contenir au moins 5 caractÃ¨res.",
      });
    }

    if (
      electronicSignature.length < 3
    ) {
      return res.status(400).json({
        success: false,
        message:
          "La signature Ã©lectronique est obligatoire.",
      });
    }

    connection =
      await pool.getConnection();

    await connection.beginTransaction();

    const [rows] =
      await connection.query(
        `
          SELECT
            id,
            status,
            assigned_department,
            assigned_to_user_id,
            programme_review_state
          FROM space_requests
          WHERE id = ?
          FOR UPDATE
        `,
        [requestId]
      );

    if (rows.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message:
          "Demande introuvable.",
      });
    }

    const request = rows[0];

    const allowedRoles = [
      "ADMIN",
      "PROGRAMME",
      "PROGRAMME_SUPERVISEUR",
      "PROGRAMME_ASSISTANT",
      "REGISSEUR_GENERAL",
      "DIRECTION_ARTISTIQUE",
      "DIRECTION_ARTISTIQUE_SUPERVISEUR",
      "DIRECTION_ARTISTIQUE_ASSISTANT",
      "COMMUNICATION",
      "JURIDIQUE",
      "JURIDIQUE_SUPERVISEUR",
      "JURIDIQUE_ASSISTANT",
      "FINANCE",
    ];

    if (!allowedRoles.includes(role)) {
      await connection.rollback();

      return res.status(403).json({
        success: false,
        message: "AccÃ¨s refusÃ©.",
      });
    }

    if (
      role !== "ADMIN" &&
      request.assigned_department !==
        workflowRole
    ) {
      await connection.rollback();

      return res.status(403).json({
        success: false,
        message:
          "Cette demande nâ€™est pas assignÃ©e Ã  votre service.",
      });
    }

    if (role === "PROGRAMME_ASSISTANT") {
      await connection.rollback();

      return res.status(403).json({
        success: false,
        message:
          "L'assistant doit transmettre une recommandation au superviseur Programme.",
      });
    }

    if (
      role ===
      "DIRECTION_ARTISTIQUE_ASSISTANT"
    ) {
      await connection.rollback();

      return res.status(403).json({
        success: false,
        message:
          "L'assistant artistique doit transmettre une recommandation au superviseur de la Direction artistique.",
      });
    }

    if (role === "JURIDIQUE_ASSISTANT") {
      await connection.rollback();

      return res.status(403).json({
        success: false,
        message:
          "L'assistant juridique doit transmettre une recommandation au superviseur du Service juridique.",
      });
    }

    if (
      workflowRole === "PROGRAMME" &&
      !["ADMIN", "PROGRAMME", "PROGRAMME_SUPERVISEUR"].includes(role)
    ) {
      await connection.rollback();

      return res.status(403).json({
        success: false,
        message:
          "Seul le superviseur Programme peut rejeter dÃ©finitivement la demande.",
      });
    }

    if (
      workflowRole ===
        "DIRECTION_ARTISTIQUE" &&
      ![
        "ADMIN",
        "DIRECTION_ARTISTIQUE",
        "DIRECTION_ARTISTIQUE_SUPERVISEUR",
      ].includes(role)
    ) {
      await connection.rollback();

      return res.status(403).json({
        success: false,
        message:
          "Seul le superviseur de la Direction artistique peut rejeter dÃ©finitivement la demande.",
      });
    }

    if (
      workflowRole === "JURIDIQUE" &&
      ![
        "ADMIN",
        "JURIDIQUE",
        "JURIDIQUE_SUPERVISEUR",
      ].includes(role)
    ) {
      await connection.rollback();

      return res.status(403).json({
        success: false,
        message:
          "Seul le superviseur juridique peut rejeter dÃ©finitivement la demande.",
      });
    }

    if (
      [
        "completed",
        "rejected",
        "draft",
      ].includes(request.status)
    ) {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message:
          "Cette demande ne peut pas Ãªtre rejetÃ©e Ã  cette Ã©tape.",
      });
    }

    await connection.query(
      `
        UPDATE space_requests
        SET
          status = 'rejected',
          current_step =
            'Demande rejetÃ©e',
          assigned_department =
            'MEMBER',
          assigned_to_user_id = NULL,
          programme_review_state = NULL,
          artistic_assigned_to = NULL,
          artistic_review_state = NULL,
          artistic_assistant_comment = NULL,
          artistic_assistant_signature = NULL,
          artistic_assistant_reviewed_at = NULL,
          legal_assigned_to = NULL,
          legal_review_state = NULL,
          legal_assistant_comment = NULL,
          legal_assistant_signature = NULL,
          legal_assistant_reviewed_at = NULL,
          rejection_comment = ?,
          updated_at =
            CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [comment, requestId]
    );

    await connection.query(
      `
        INSERT INTO space_request_histories (
          space_request_id,
          action,
          previous_status,
          new_status,
          from_department,
          to_department,
          comment,
          electronic_signature,
          performed_by
        )
        VALUES (
          ?,
          'REJECT',
          ?,
          'rejected',
          ?,
          'MEMBER',
          ?,
          ?,
          ?
        )
      `,
      [
        requestId,
        request.status,
        request.assigned_department,
        comment,
        electronicSignature,
        userId,
      ]
    );

    await connection.commit();

    const updatedRequest =
      await findRequestById(requestId);

    return res.json({
      success: true,
      message:
        "Demande signÃ©e et rejetÃ©e.",
      data: updatedRequest,
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error(
      "Reject request error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Impossible de rejeter la demande.",
      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,
    });
  } finally {
    connection?.release();
  }
};

// =============================================================================
// WORKFLOW V2 INTÃ‰GRÃ‰ â€” aucune dÃ©pendance vers un autre contrÃ´leur
// =============================================================================


const CORRECTION_DELAY_DAYS = 5;

const PROGRAMME_DECISION_ROLES = [
  "PROGRAMME_SUPERVISEUR",
  "ADMIN",
];

const ARTISTIC_DECISION_ROLES = [
  "DIRECTION_ARTISTIQUE_SUPERVISEUR",
  "ADMIN",
];

const LEGAL_DECISION_ROLES = [
  "JURIDIQUE_SUPERVISEUR",
  "ADMIN",
];

const TRANSITIONS = {
  program_review: {
    roles: PROGRAMME_DECISION_ROLES,
    department: "PROGRAMME",
    nextStatus: "artistic_initial_review",
    nextDepartment: "DIRECTION_ARTISTIQUE",
    nextStep: "PrÃ©paration de lâ€™avis par la Direction artistique",
    action: "PROGRAMME_INITIAL_VALIDATION",
  },

  artistic_initial_review: {
    roles: ARTISTIC_DECISION_ROLES,
    department: "DIRECTION_ARTISTIQUE",
    requiredDocuments: ["ARTISTIC_OPINION"],
    nextStatus: "program_review_after_artistic",
    nextDepartment: "PROGRAMME",
    nextStep: "VÃ©rification de lâ€™avis artistique par le Programme",
    action: "ARTISTIC_INITIAL_VALIDATION",
  },

  program_review_after_artistic: {
    roles: PROGRAMME_DECISION_ROLES,
    department: "PROGRAMME",
    requiredDocuments: [
      "INITIAL_REQUEST",
      "ARTISTIC_OPINION",
    ],
    nextStatus: "awaiting_member_confirmation",
    nextDepartment: "MEMBER",
    nextStep: "En attente de la dÃ©cision signÃ©e du membre",
    action: "PROGRAMME_SEND_ARTISTIC_OPINION",
  },

  program_review_after_confirmation: {
    roles: PROGRAMME_DECISION_ROLES,
    department: "PROGRAMME",
    requiredDocuments: [
      "INITIAL_REQUEST",
      "ARTISTIC_OPINION",
    ],
    nextStatus: "artistic_final_review",
    nextDepartment: "DIRECTION_ARTISTIQUE",
    nextStep: "Validation artistique finale",
    action: "PROGRAMME_SEND_FINAL_ARTISTIC_REVIEW",
  },

  artistic_final_review: {
    roles: ARTISTIC_DECISION_ROLES,
    department: "DIRECTION_ARTISTIQUE",
    requiredDocuments: [
      "INITIAL_REQUEST",
      "ARTISTIC_OPINION",
    ],
    nextStatus: "parallel_communication_regisseur_review",
    nextDepartment: "COMMUNICATION_REGISSEUR",
    nextStep:
      "Validation parallÃ¨le par la Communication et le RÃ©gisseur gÃ©nÃ©ral",
    action: "ARTISTIC_FINAL_VALIDATION",
    initializeParallelReview: true,
  },

  program_review_after_parallel: {
    roles: PROGRAMME_DECISION_ROLES,
    department: "PROGRAMME",
    requiredDocuments: [
      "INITIAL_REQUEST",
      "ARTISTIC_OPINION",
    ],
    nextStatus: "legal_review",
    nextDepartment: "JURIDIQUE",
    nextStep: "Examen par le Service juridique",
    action: "PROGRAMME_SEND_LEGAL_REVIEW",
  },

  program_review_after_regisseur_rejection: {
    roles: PROGRAMME_DECISION_ROLES,
    department: "PROGRAMME",
    nextStatus: "correction_requested",
    nextDepartment: "MEMBER",
    nextStep:
      "Correction demandÃ©e au membre aprÃ¨s le refus du RÃ©gisseur gÃ©nÃ©ral",
    action: "PROGRAMME_FORWARD_REGISSEUR_REJECTION",
    startsCorrectionDelay: true,
  },

  legal_review: {
    roles: LEGAL_DECISION_ROLES,
    department: "JURIDIQUE",
    requiredDocuments: ["LEGAL_DOCUMENT"],
    nextStatus: "finance_cotation",
    nextDepartment: "FINANCE",
    nextStep: "PrÃ©paration de la cotation par le Service Finance",
    action: "LEGAL_VALIDATION",
  },

  finance_cotation: {
    roles: ["FINANCE", "ADMIN"],
    department: "FINANCE",
    requiredDocuments: [
      "LEGAL_DOCUMENT",
      "FINANCE_QUOTE",
    ],
    requiresPaymentAmount: true,
    nextStatus: "dg_cotation_review",
    nextDepartment: "DG",
    nextStep: "Approbation du montant de la cotation par la Direction gÃ©nÃ©rale",
    action: "FINANCE_SEND_QUOTE_TO_DG",
  },

  finance_cotation_revision: {
    roles: ["FINANCE", "ADMIN"],
    department: "FINANCE",
    requiredDocuments: ["LEGAL_DOCUMENT", "FINANCE_QUOTE"],
    requiresPaymentAmount: true,
    nextStatus: "dg_cotation_review",
    nextDepartment: "DG",
    nextStep: "Nouvelle approbation du montant par la Direction gÃ©nÃ©rale",
    action: "FINANCE_RESUBMIT_QUOTE_TO_DG",
  },

  program_review_after_finance: {
    roles: PROGRAMME_DECISION_ROLES,
    department: "PROGRAMME",
    requiredDocuments: [
      "INITIAL_REQUEST",
      "ARTISTIC_OPINION",
      "LEGAL_DOCUMENT",
      "FINANCE_QUOTE",
    ],
    nextStatus: "awaiting_payment_proof",
    nextDepartment: "MEMBER",
    nextStep: "En attente du paiement et de sa preuve",
    action: "PROGRAMME_SEND_QUOTE",
  },

  program_payment_review: {
    roles: PROGRAMME_DECISION_ROLES,
    department: "PROGRAMME",
    requiredDocuments: [
      "INITIAL_REQUEST",
      "ARTISTIC_OPINION",
      "LEGAL_DOCUMENT",
      "FINANCE_QUOTE",
      "PAYMENT_PROOF",
    ],
    nextStatus: "completed",
    nextDepartment: "MEMBER",
    nextStep: "Paiement vÃ©rifiÃ© et date dÃ©finitivement confirmÃ©e",
    action: "PROGRAMME_PAYMENT_AND_DATE_CONFIRMATION",
    confirmsPaymentAndDate: true,
  },
};

/*
 * Cette vÃ©rification est exÃ©cutÃ©e avant les routes du module.
 * Elle transforme automatiquement en "expired" les corrections
 * dont le dÃ©lai de cinq jours est dÃ©passÃ©.
 */
exports.expireOverdueCorrections = async (
  req,
  res,
  next
) => {
  try {
    await pool.query(
      `
        UPDATE space_requests
        SET
          status = 'expired',
          current_step =
            'DÃ©lai de correction expirÃ© â€” nouvelle demande requise',
          assigned_department = 'MEMBER',
          updated_at = CURRENT_TIMESTAMP
        WHERE status = 'correction_requested'
          AND correction_deadline IS NOT NULL
          AND correction_deadline < NOW()
      `
    );

    return next();
  } catch (error) {
    console.error(
      "Correction expiration check error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Impossible de vÃ©rifier les dÃ©lais de correction.",
    });
  }
};

function workflowRemoveUploadedFile(file) {
  if (!file?.path) return;

  fs.unlink(file.path, (error) => {
    if (error && error.code !== "ENOENT") {
      console.error("Payment proof cleanup error:", error);
    }
  });
}

function cleanString(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function validateRequestId(value) {
  const requestId = Number(value);

  return Number.isInteger(requestId) &&
    requestId > 0
    ? requestId
    : null;
}

function requireSignature(req, res) {
  const signature = cleanString(
    req.body.electronicSignature
  );

  if (signature.length < 3) {
    res.status(400).json({
      success: false,
      message:
        "La signature Ã©lectronique est obligatoire.",
    });

    return null;
  }

  return signature;
}

async function getLockedRequest(
  connection,
  requestId
) {
  const [rows] = await connection.query(
    `
      SELECT *
      FROM space_requests
      WHERE id = ?
      FOR UPDATE
    `,
    [requestId]
  );

  return rows[0] || null;
}

async function workflowHasDocument(
  connection,
  requestId,
  documentType
) {
  const [rows] = await connection.query(
    `
      SELECT id
      FROM space_request_documents
      WHERE space_request_id = ?
        AND document_type = ?
      LIMIT 1
    `,
    [requestId, documentType]
  );

  return rows.length > 0;
}

async function workflowGetMissingDocuments(
  connection,
  requestId,
  documentTypes = []
) {
  const missing = [];

  for (const documentType of documentTypes) {
    if (
      !(await workflowHasDocument(
        connection,
        requestId,
        documentType
      ))
    ) {
      missing.push(documentType);
    }
  }

  return missing;
}

async function addHistory(
  connection,
  {
    requestId,
    action,
    previousStatus,
    newStatus,
    fromDepartment,
    toDepartment,
    comment,
    signature,
    userId,
  }
) {
  await connection.query(
    `
      INSERT INTO space_request_histories (
        space_request_id,
        action,
        previous_status,
        new_status,
        from_department,
        to_department,
        comment,
        electronic_signature,
        performed_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      requestId,
      action,
      previousStatus || null,
      newStatus,
      fromDepartment || null,
      toDepartment,
      comment || null,
      signature || null,
      userId,
    ]
  );
}

async function getResponseRequest(requestId) {
  const [rows] = await pool.query(
    `
      SELECT
        sr.*,
        u.email AS user_email,
        u.first_name,
        u.last_name,
        u.phone AS user_phone
      FROM space_requests sr
      JOIN users u ON u.id = sr.user_id
      WHERE sr.id = ?
      LIMIT 1
    `,
    [requestId]
  );

  if (rows.length === 0) return null;

  const row = rows[0];

  return {
    id: row.id,
    reference: row.reference,
    eventName: row.title,
    title: row.title,
    description: row.description,
    spaceId: row.space_id,
    date: row.desired_date,
    desiredDate: row.desired_date,
    status: row.status,
    currentStep: row.current_step,
    assignedDepartment:
      row.assigned_department,
    currentDepartment:
      row.assigned_department,
    paymentAmount:
      row.payment_amount === null
        ? null
        : Number(row.payment_amount),
    dgReviewState: row.dg_review_state,
    dgSuggestedAmount:
      row.dg_suggested_amount === null
        ? null
        : Number(row.dg_suggested_amount),
    dgComment: row.dg_comment,
    dgSignature: row.dg_signature,
    dgReviewedBy: row.dg_reviewed_by,
    dgReviewedAt: row.dg_reviewed_at,
    financeRevisionCount:
      Number(row.finance_revision_count || 0),
    correctionDeadline:
      row.correction_deadline,
    paymentConfirmedAt:
      row.payment_confirmed_at,
    dateConfirmedAt:
      row.date_confirmed_at,
    user: {
      id: row.user_id,
      firstName: row.first_name,
      lastName: row.last_name,
      username:
        `${row.first_name || ""} ${
          row.last_name || ""
        }`.trim() || row.user_email,
      email: row.user_email,
      phone: row.user_phone,
    },
  };
}

async function ensureNoDateConflict(
  connection,
  request
) {
  if (!request.desired_date) return null;

  const [rows] = await connection.query(
    `
      SELECT id, reference, title
      FROM space_requests
      WHERE status = 'completed'
        AND DATE(desired_date) =
          DATE(?)
        AND space_id = ?
        AND id <> ?
      LIMIT 1
    `,
    [
      request.desired_date,
      request.space_id,
      request.id,
    ]
  );

  return rows[0] || null;
}

/** Vue globale DG : toutes les demandes depuis leur crÃ©ation. */
exports.getDGRequests = async (req, res) => {
  try {
    if (!["DG", "ADMIN"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "AccÃ¨s rÃ©servÃ© Ã  la Direction gÃ©nÃ©rale." });
    }
    const [rows] = await pool.query(`${SELECT_REQUEST} ORDER BY sr.created_at DESC`);
    return res.json({ success: true, data: rows.map(serializeRequest) });
  } catch (error) {
    console.error("DG requests error:", error);
    return res.status(500).json({ success: false, message: "Impossible de charger les demandes de la Direction gÃ©nÃ©rale." });
  }
};

/** DÃ©cision DG obligatoire sur le montant proposÃ© par Finance. */
exports.reviewDGCotation = async (req, res) => {
  let connection;
  try {
    const requestId = validateRequestId(req.params.id);
    const decision = cleanString(req.body.decision).toLowerCase();
    const comment = cleanString(req.body.comment);
    const signature = cleanString(req.body.electronicSignature || req.body.signature);
    const suggestedAmount = req.body.suggestedAmount === undefined || req.body.suggestedAmount === ""
      ? null : Number(req.body.suggestedAmount);

    if (!requestId) return res.status(400).json({ success: false, message: "Identifiant invalide." });
    if (!["DG", "ADMIN"].includes(req.user.role)) return res.status(403).json({ success: false, message: "AccÃ¨s rÃ©servÃ© Ã  la Direction gÃ©nÃ©rale." });
    if (!["approve", "revision"].includes(decision)) return res.status(400).json({ success: false, message: "DÃ©cision invalide." });
    if (signature.length < 3) return res.status(400).json({ success: false, message: "La signature Ã©lectronique est obligatoire." });
    if (decision === "revision" && (comment.length < 5 || !Number.isFinite(suggestedAmount) || suggestedAmount <= 0)) {
      return res.status(400).json({ success: false, message: "Pour une rÃ©vision, indiquez un commentaire et un montant suggÃ©rÃ© positif." });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();
    const request = await getLockedRequest(connection, requestId);
    if (!request) { await connection.rollback(); return res.status(404).json({ success: false, message: "Demande introuvable." }); }
    if (request.status !== "dg_cotation_review" || request.assigned_department !== "DG") {
      await connection.rollback();
      return res.status(409).json({ success: false, message: "Cette cotation nâ€™est pas en attente de dÃ©cision DG." });
    }
    if (request.payment_amount === null || Number(request.payment_amount) <= 0) {
      await connection.rollback();
      return res.status(409).json({ success: false, message: "La cotation Finance ne contient aucun montant valide." });
    }

    const approved = decision === "approve";
    const nextStatus = approved ? "program_review_after_finance" : "finance_cotation_revision";
    const nextDepartment = approved ? "PROGRAMME" : "FINANCE";
    const nextStep = approved ? "Cotation approuvÃ©e par la DG â€” transmission au Programme" : "RÃ©vision de la cotation demandÃ©e par la DG";
    await connection.query(`UPDATE space_requests SET status=?, current_step=?, assigned_department=?, dg_review_state=?, dg_suggested_amount=?, dg_comment=?, dg_signature=?, dg_reviewed_by=?, dg_reviewed_at=NOW(), updated_at=NOW() WHERE id=?`, [
      nextStatus, nextStep, nextDepartment, approved ? "approved" : "revision_requested",
      approved ? null : suggestedAmount, comment || (approved ? "Cotation approuvÃ©e." : null), signature, req.user.id, requestId,
    ]);
    await addHistory(connection, {
      requestId,
      action: approved ? "DG_APPROVE_QUOTATION" : "DG_REQUEST_QUOTATION_REVISION",
      previousStatus: request.status,
      newStatus: nextStatus,
      fromDepartment: "DG",
      toDepartment: nextDepartment,
      comment: approved ? (comment || `Montant approuvÃ© : ${Number(request.payment_amount).toFixed(2)}`) : `${comment} Montant suggÃ©rÃ© : ${suggestedAmount.toFixed(2)}`,
      signature,
      userId: req.user.id,
    });
    await connection.commit();
    return res.json({ success: true, message: approved ? "Cotation approuvÃ©e et transmise au Programme." : "RÃ©vision demandÃ©e au service Finance.", data: await getResponseRequest(requestId) });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("DG quotation review error:", error);
    return res.status(500).json({ success: false, message: "Impossible dâ€™enregistrer la dÃ©cision de la DG." });
  } finally {
    connection?.release();
  }
};

exports.submit = async (req, res) => {
  let connection;

  try {
    const requestId = validateRequestId(
      req.params.id
    );
    const signature = requireSignature(
      req,
      res
    );

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message:
          "Identifiant de demande invalide.",
      });
    }

    if (!signature) return;

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const request = await getLockedRequest(
      connection,
      requestId
    );

    if (!request) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Demande introuvable.",
      });
    }

    if (
      Number(request.user_id) !==
      Number(req.user.id)
    ) {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message:
          "Cette demande ne vous appartient pas.",
      });
    }

    if (request.status !== "draft") {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message:
          "Cette demande a dÃ©jÃ  Ã©tÃ© transmise.",
      });
    }

    /*
     * La demande ne peut quitter le brouillon que si
     * le formulaire gÃ©nÃ©rÃ© en PDF et la lettre Word
     * du membre sont tous les deux enregistrÃ©s.
     */
    const missingInitialDocuments =
      await workflowGetMissingDocuments(
        connection,
        requestId,
        [
          "INITIAL_REQUEST",
          "REQUEST_LETTER",
        ]
      );

    if (missingInitialDocuments.length > 0) {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message:
          "Le formulaire PDF et la lettre de demande Word sont obligatoires avant lâ€™envoi.",
        missingDocuments:
          missingInitialDocuments,
      });
    }

    await connection.query(
      `
        UPDATE space_requests
        SET
          electronic_signature = ?,
          status = 'program_review',
          current_step =
            'Examen initial par le Programme',
          assigned_department =
            'PROGRAMME',
          submitted_at = NOW(),
          updated_at = NOW()
        WHERE id = ?
      `,
      [signature, requestId]
    );

    await addHistory(connection, {
      requestId,
      action: "MEMBER_SUBMIT",
      previousStatus: "draft",
      newStatus: "program_review",
      fromDepartment: "MEMBER",
      toDepartment: "PROGRAMME",
      comment:
        "Demande signÃ©e et transmise au Programme.",
      signature,
      userId: req.user.id,
    });

    await connection.commit();

    return res.json({
      success: true,
      message:
        "Demande signÃ©e et transmise au Programme.",
      data: await getResponseRequest(
        requestId
      ),
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error(
      "Workflow submit error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Impossible de transmettre la demande.",
    });
  } finally {
    connection?.release();
  }
};

exports.memberDecision = async (
  req,
  res
) => {
  let connection;

  try {
    const requestId = validateRequestId(
      req.params.id
    );
    const signature = requireSignature(
      req,
      res
    );
    const decision = cleanString(
      req.body.decision
    ).toUpperCase();
    const comment = cleanString(
      req.body.comment
    );

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message:
          "Identifiant de demande invalide.",
      });
    }

    if (!signature) return;

    if (
      !["ACCEPTED", "REFUSED"].includes(
        decision
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "La dÃ©cision doit Ãªtre ACCEPTED ou REFUSED.",
      });
    }

    if (
      decision === "REFUSED" &&
      comment.length < 5
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Le motif du refus est obligatoire.",
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const request = await getLockedRequest(
      connection,
      requestId
    );

    if (!request) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Demande introuvable.",
      });
    }

    if (
      req.user.role !== "MEMBER" ||
      Number(request.user_id) !==
        Number(req.user.id)
    ) {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message: "AccÃ¨s refusÃ©.",
      });
    }

    if (
      request.status !==
      "awaiting_member_confirmation"
    ) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message:
          "Cette demande nâ€™attend pas la dÃ©cision du membre.",
      });
    }

    const accepted =
      decision === "ACCEPTED";

    const nextStatus = accepted
      ? "program_review_after_confirmation"
      : "stopped_by_member";

    const nextDepartment = accepted
      ? "PROGRAMME"
      : "MEMBER";

    const nextStep = accepted
      ? "Confirmation du membre Ã  vÃ©rifier par le Programme"
      : "Processus arrÃªtÃ© aprÃ¨s le refus signÃ© du membre";

    await connection.query(
      `
        UPDATE space_requests
        SET
          status = ?,
          current_step = ?,
          assigned_department = ?,
          member_decision_comment = ?,
          updated_at = NOW()
        WHERE id = ?
      `,
      [
        nextStatus,
        nextStep,
        nextDepartment,
        comment || null,
        requestId,
      ]
    );

    await addHistory(connection, {
      requestId,
      action: accepted
        ? "MEMBER_ACCEPT_ARTISTIC_TERMS"
        : "MEMBER_REFUSE_ARTISTIC_TERMS",
      previousStatus: request.status,
      newStatus: nextStatus,
      fromDepartment: "MEMBER",
      toDepartment: nextDepartment,
      comment:
        comment ||
        "Avis artistique et conditions acceptÃ©s.",
      signature,
      userId: req.user.id,
    });

    await connection.commit();

    return res.json({
      success: true,
      message: accepted
        ? "Avis acceptÃ© et retournÃ© au Programme."
        : "Demande arrÃªtÃ©e aprÃ¨s votre refus.",
      data: await getResponseRequest(
        requestId
      ),
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error(
      "Member decision error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Impossible dâ€™enregistrer la dÃ©cision du membre.",
    });
  } finally {
    connection?.release();
  }
};

exports.confirmMember = (req, res) => {
  req.body.decision = "ACCEPTED";
  return exports.memberDecision(req, res);
};

exports.validate = async (req, res) => {
  let connection;

  try {
    const requestId = validateRequestId(
      req.params.id
    );
    const signature = requireSignature(
      req,
      res
    );
    const comment = cleanString(
      req.body.comment
    );
    const paymentAmount =
      req.body.paymentAmount === undefined ||
      req.body.paymentAmount === null ||
      req.body.paymentAmount === ""
        ? null
        : Number(req.body.paymentAmount);

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message:
          "Identifiant de demande invalide.",
      });
    }

    if (!signature) return;

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const request = await getLockedRequest(
      connection,
      requestId
    );

    if (!request) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Demande introuvable.",
      });
    }

    const isCommunicationReviewer =
      req.user.role === "COMMUNICATION";

    const isRegisseurReviewer =
      req.user.role ===
      "REGISSEUR_GENERAL";

    const reviewerState =
      isRegisseurReviewer
        ? request.regisseur_validation_state
        : isCommunicationReviewer
          ? request.communication_validation_state
          : null;

    const parallelReviewStarted =
      request.communication_validation_state !==
        null &&
      request.regisseur_validation_state !==
        null;

    const parallelReviewClosedStatuses = [
      "program_review_after_regisseur_rejection",
      "correction_requested",
      "stopped_by_member",
      "expired",
    ];

    const canRecordParallelValidation =
      (isCommunicationReviewer ||
        isRegisseurReviewer) &&
      parallelReviewStarted &&
      reviewerState === "pending" &&
      !parallelReviewClosedStatuses.includes(
        request.status
      );

    if (
      request.status ===
        "parallel_communication_regisseur_review" ||
      canRecordParallelValidation
    ) {
      const result =
        await validateParallelReview(
          connection,
          request,
          req.user,
          comment,
          signature
        );

      if (!result.ok) {
        await connection.rollback();
        return res
          .status(result.status)
          .json({
            success: false,
            message: result.message,
          });
      }

      await connection.commit();

      return res.json({
        success: true,
        message: result.message,
        data: await getResponseRequest(
          requestId
        ),
      });
    }

    const transition =
      TRANSITIONS[request.status];

    if (!transition) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message:
          "Cette demande ne peut pas Ãªtre validÃ©e Ã  cette Ã©tape.",
      });
    }

    if (
      !transition.roles.includes(
        req.user.role
      )
    ) {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message:
          "Votre rÃ´le ne permet pas de valider cette Ã©tape.",
      });
    }

    if (
      req.user.role !== "ADMIN" &&
      request.assigned_department !==
        transition.department
    ) {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message:
          "Cette demande nâ€™est pas assignÃ©e Ã  votre service.",
      });
    }

    const missingDocuments =
      await workflowGetMissingDocuments(
        connection,
        requestId,
        transition.requiredDocuments
      );

    if (missingDocuments.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message:
          "Le dossier ne contient pas tous les documents requis.",
        missingDocuments,
      });
    }

    if (
      transition.requiresPaymentAmount &&
      (
        paymentAmount === null ||
        !Number.isFinite(paymentAmount) ||
        paymentAmount <= 0
      )
    ) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message:
          "Le montant positif de la cotation est obligatoire.",
      });
    }

    if (
      transition.confirmsPaymentAndDate
    ) {
      if (
        request.payment_amount === null ||
        Number(request.payment_amount) <= 0
      ) {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          message:
            "Le montant de la cotation est absent.",
        });
      }

      const conflict =
        await ensureNoDateConflict(
          connection,
          request
        );

      if (conflict) {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          message:
            "Cet espace est dÃ©jÃ  confirmÃ© pour cette date.",
          conflict,
        });
      }
    }

    const correctionDeadlineSql =
      transition.startsCorrectionDelay
        ? `DATE_ADD(
            NOW(),
            INTERVAL ${CORRECTION_DELAY_DAYS} DAY
          )`
        : "NULL";

    if (["finance_cotation", "finance_cotation_revision"].includes(request.status)) {
      await connection.query(
        `UPDATE space_requests
         SET dg_review_state='pending', dg_suggested_amount=NULL,
             dg_comment=NULL, dg_signature=NULL, dg_reviewed_by=NULL,
             dg_reviewed_at=NULL,
             finance_revision_count = finance_revision_count + ?
         WHERE id=?`,
        [request.status === "finance_cotation_revision" ? 1 : 0, requestId]
      );
    }

    await connection.query(
      `
        UPDATE space_requests
        SET
          status = ?,
          current_step = ?,
          assigned_department = ?,
          correction_deadline =
            ${correctionDeadlineSql},
          communication_validation_state =
            CASE WHEN ? THEN 'pending'
              ELSE communication_validation_state
            END,
          regisseur_validation_state =
            CASE WHEN ? THEN 'pending'
              ELSE regisseur_validation_state
            END,
          payment_amount =
            CASE
              WHEN ? IS NULL
              THEN payment_amount
              ELSE ?
            END,
          payment_confirmed_at =
            CASE WHEN ? THEN NOW()
              ELSE payment_confirmed_at
            END,
          date_confirmed_at =
            CASE WHEN ? THEN NOW()
              ELSE date_confirmed_at
            END,
          updated_at = NOW()
        WHERE id = ?
      `,
      [
        transition.nextStatus,
        transition.nextStep,
        transition.nextDepartment,
        transition.initializeParallelReview
          ? 1
          : 0,
        transition.initializeParallelReview
          ? 1
          : 0,
        paymentAmount,
        paymentAmount,
        transition.confirmsPaymentAndDate
          ? 1
          : 0,
        transition.confirmsPaymentAndDate
          ? 1
          : 0,
        requestId,
      ]
    );

    if (
      transition.confirmsPaymentAndDate
    ) {
      await connection.query(
        `
          INSERT INTO finance_payment_ledger (
            space_request_id,
            amount,
            currency,
            status,
            confirmed_by,
            confirmed_at
          )
          VALUES (?, ?, 'USD', 'PAID', ?, NOW())
          ON DUPLICATE KEY UPDATE
            amount = VALUES(amount),
            status = 'PAID',
            confirmed_by =
              VALUES(confirmed_by),
            confirmed_at = NOW(),
            updated_at = NOW()
        `,
        [
          requestId,
          Number(request.payment_amount),
          req.user.id,
        ]
      );
    }

    await addHistory(connection, {
      requestId,
      action: transition.action,
      previousStatus: request.status,
      newStatus: transition.nextStatus,
      fromDepartment:
        request.assigned_department,
      toDepartment:
        transition.nextDepartment,
      comment:
        comment ||
        "Ã‰tape validÃ©e et signÃ©e.",
      signature,
      userId: req.user.id,
    });

    await connection.commit();

    return res.json({
      success: true,
      message:
        "Validation signÃ©e et enregistrÃ©e.",
      data: await getResponseRequest(
        requestId
      ),
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error(
      "Workflow validation error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Impossible de valider cette Ã©tape.",
      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,
    });
  } finally {
    connection?.release();
  }
};

async function validateParallelReview(
  connection,
  request,
  user,
  comment,
  signature
) {
  const isCommunication =
    user.role === "COMMUNICATION";
  const isRegisseur =
    user.role === "REGISSEUR_GENERAL";

  if (
    !isCommunication &&
    !isRegisseur &&
    user.role !== "ADMIN"
  ) {
    return {
      ok: false,
      status: 403,
      message:
        "Cette Ã©tape est rÃ©servÃ©e Ã  la Communication et au RÃ©gisseur gÃ©nÃ©ral.",
    };
  }

  const department =
    isRegisseur
      ? "REGISSEUR_GENERAL"
      : "COMMUNICATION";

  const stateColumn =
    isRegisseur
      ? "regisseur_validation_state"
      : "communication_validation_state";

  const commentColumn =
    isRegisseur
      ? "regisseur_comment"
      : "communication_comment";

  const signatureColumn =
    isRegisseur
      ? "regisseur_signature"
      : "communication_signature";

  const userColumn =
    isRegisseur
      ? "regisseur_validated_by"
      : "communication_validated_by";

  const dateColumn =
    isRegisseur
      ? "regisseur_validated_at"
      : "communication_validated_at";

  if (
    request[stateColumn] === "validated"
  ) {
    return {
      ok: false,
      status: 409,
      message:
        "Votre service a dÃ©jÃ  validÃ© cette demande.",
    };
  }

  await connection.query(
    `
      UPDATE space_requests
      SET
        ${stateColumn} = 'validated',
        ${commentColumn} = ?,
        ${signatureColumn} = ?,
        ${userColumn} = ?,
        ${dateColumn} = NOW(),
        updated_at = NOW()
      WHERE id = ?
    `,
    [
      comment || null,
      signature,
      user.id,
      request.id,
    ]
  );

  /*
   * Le premier des deux services qui valide
   * renvoie immÃ©diatement le dossier au Programme.
   *
   * Si le dossier a dÃ©jÃ  quittÃ© l'Ã©tape parallÃ¨le,
   * la validation du deuxiÃ¨me service est seulement
   * enregistrÃ©e avec sa signature et son historique.
   */
  const isFirstParallelValidation =
    request.status ===
    "parallel_communication_regisseur_review";

  if (isFirstParallelValidation) {
    await connection.query(
      `
        UPDATE space_requests
        SET
          status =
            'program_review_after_parallel',
          assigned_department =
            'PROGRAMME',
          current_step =
            'PremiÃ¨re validation parallÃ¨le reÃ§ue â€” retour au Programme',
          updated_at = NOW()
        WHERE id = ?
      `,
      [request.id]
    );
  }

  await addHistory(connection, {
    requestId: request.id,
    action: isRegisseur
      ? "REGISSEUR_VALIDATION"
      : "COMMUNICATION_VALIDATION",
    previousStatus: request.status,
    newStatus: isFirstParallelValidation
      ? "program_review_after_parallel"
      : request.status,
    fromDepartment: department,
    toDepartment: isFirstParallelValidation
      ? "PROGRAMME"
      : request.assigned_department ||
        "PROGRAMME",
    comment:
      comment ||
      "Validation signÃ©e du service.",
    signature,
    userId: user.id,
  });

  return {
    ok: true,
    message: isFirstParallelValidation
      ? "Votre validation signÃ©e est enregistrÃ©e. Le dossier retourne immÃ©diatement au Programme sans attendre lâ€™autre service."
      : "Votre validation signÃ©e est enregistrÃ©e. Le workflow avait dÃ©jÃ  continuÃ© aprÃ¨s la premiÃ¨re validation.",
  };
}

exports.reject = async (req, res) => {
  let connection;

  try {
    const requestId = validateRequestId(
      req.params.id
    );
    const signature = requireSignature(
      req,
      res
    );
    const comment = cleanString(
      req.body.comment
    );

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message:
          "Identifiant de demande invalide.",
      });
    }

    if (!signature) return;

    if (comment.length < 5) {
      return res.status(400).json({
        success: false,
        message:
          "Le motif du refus doit contenir au moins 5 caractÃ¨res.",
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const request = await getLockedRequest(
      connection,
      requestId
    );

    if (!request) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Demande introuvable.",
      });
    }

    /*
     * L'assistant Programme ne renvoie jamais directement le dossier
     * au membre. Son rejet constitue un avis interne signÃ© : le dossier
     * reste au Programme et revient au superviseur pour dÃ©cision.
     *
     * Le dÃ©lai de correction de cinq jours ne commence donc pas ici.
     */
    const authenticatedRole = String(
      req.user.role || ""
    )
      .trim()
      .toUpperCase();

    if (
      authenticatedRole ===
      "PROGRAMME_ASSISTANT"
    ) {
      const programmeStatuses = [
        "program_review",
        "program_review_after_artistic",
        "program_review_after_confirmation",
        "program_review_after_parallel",
        "program_review_after_regisseur_rejection",
        "program_review_after_finance",
        "program_payment_review",
      ];

      const isProgrammeRequest =
        request.assigned_department ===
        "PROGRAMME";

      /*
       * Une ancienne affectation peut contenir un identifiant nul ou
       * incorrect alors que programme_review_state vaut "assigned".
       * Le rÃ´le authentifiÃ© reste la barriÃ¨re d'accÃ¨s principale.
       */
      const isAssignedProgrammeReview =
        request.programme_review_state ===
          "assigned" ||
        Number(
          request.assigned_to_user_id
        ) === Number(req.user.id);

      if (
        !isProgrammeRequest ||
        !programmeStatuses.includes(
          request.status
        )
      ) {
        await connection.rollback();
        return res.status(403).json({
          success: false,
          message:
            "Cette demande n'est plus affectÃ©e au Programme ou son Ã©tape actuelle n'autorise pas l'avis de l'assistant.",
          details:
            process.env.NODE_ENV ===
            "development"
              ? {
                  role:
                    authenticatedRole,
                  status:
                    request.status,
                  assignedDepartment:
                    request.assigned_department,
                  assignedToUserId:
                    request.assigned_to_user_id,
                  currentUserId:
                    req.user.id,
                  programmeReviewState:
                    request.programme_review_state,
                  isAssignedProgrammeReview,
                }
              : undefined,
        });
      }

      if (
        request.programme_review_state ===
        "assistant_rejected"
      ) {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          message:
            "Vous avez dÃ©jÃ  transmis un avis de rejet pour cette demande.",
        });
      }

      await connection.query(
        `
          UPDATE space_requests
          SET
            programme_review_state =
              'assistant_rejected',
            assistant_comment = ?,
            assistant_signature = ?,
            assistant_reviewed_at = NOW(),
            assigned_to_user_id = NULL,
            assigned_department =
              'PROGRAMME',
            current_step = ?,
            updated_at = NOW()
          WHERE id = ?
        `,
        [
          comment,
          signature,
          "Avis de rejet de l'assistant â€” dÃ©cision du superviseur Programme requise",
          requestId,
        ]
      );

      await addHistory(connection, {
        requestId,
        action:
          "PROGRAMME_ASSISTANT_REJECTION_RECOMMENDATION",
        previousStatus: request.status,
        newStatus: request.status,
        fromDepartment: "PROGRAMME",
        toDepartment: "PROGRAMME",
        comment,
        signature,
        userId: req.user.id,
      });

      await connection.commit();

      return res.json({
        success: true,
        message:
          "Votre avis de rejet signÃ© a Ã©tÃ© transmis au superviseur Programme.",
        data: await getResponseRequest(
          requestId
        ),
      });
    }

    let nextStatus;
    let nextDepartment;
    let nextStep;
    let action;
    let deadlineSql = "NULL";

    if (req.user.role === "MEMBER") {
      if (
        Number(request.user_id) !==
          Number(req.user.id) ||
        request.status !==
          "awaiting_member_confirmation"
      ) {
        await connection.rollback();
        return res.status(403).json({
          success: false,
          message:
            "Le membre ne peut refuser quâ€™au moment de confirmer lâ€™avis artistique.",
        });
      }

      nextStatus = "stopped_by_member";
      nextDepartment = "MEMBER";
      nextStep =
        "Processus arrÃªtÃ© aprÃ¨s le refus signÃ© du membre";
      action = "MEMBER_REFUSAL";
    } else if (
      PROGRAMME_DECISION_ROLES.includes(
        req.user.role
      )
    ) {
      if (
        request.assigned_department !==
          "PROGRAMME"
      ) {
        await connection.rollback();
        return res.status(403).json({
          success: false,
          message:
            "Cette demande nâ€™est pas assignÃ©e au Programme.",
        });
      }

      nextStatus = "correction_requested";
      nextDepartment = "MEMBER";
      nextStep =
        "Correction demandÃ©e par le Programme â€” dÃ©lai de 5 jours";
      action = "PROGRAMME_CORRECTION_REQUEST";
      deadlineSql = `DATE_ADD(
        NOW(),
        INTERVAL ${CORRECTION_DELAY_DAYS} DAY
      )`;
    } else if (
      req.user.role ===
      "REGISSEUR_GENERAL"
    ) {
      const regisseurCanStillDecide =
        request.regisseur_validation_state ===
          "pending" &&
        request.communication_validation_state !==
          null &&
        ![
          "program_review_after_regisseur_rejection",
          "correction_requested",
          "stopped_by_member",
          "expired",
          "completed",
        ].includes(request.status);

      if (
        !regisseurCanStillDecide
      ) {
        await connection.rollback();
        return res.status(403).json({
          success: false,
          message:
            "Le RÃ©gisseur a dÃ©jÃ  rendu sa dÃ©cision ou cette demande ne peut plus Ãªtre refusÃ©e Ã  cette Ã©tape.",
        });
      }

      nextStatus =
        "program_review_after_regisseur_rejection";
      nextDepartment = "PROGRAMME";
      nextStep =
        "Refus motivÃ© du RÃ©gisseur â€” transmission au membre par le Programme";
      action = "REGISSEUR_REFUSAL";
    } else {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message:
          "Seuls le membre, l'assistant Programme, le superviseur Programme et le RÃ©gisseur gÃ©nÃ©ral peuvent refuser une demande.",
      });
    }

    await connection.query(
      `
        UPDATE space_requests
        SET
          status = ?,
          assigned_department = ?,
          assigned_to_user_id = NULL,
          current_step = ?,
          rejection_comment = ?,
          correction_deadline =
            ${deadlineSql},
          regisseur_validation_state =
            CASE
              WHEN ? = 'REGISSEUR_REFUSAL'
              THEN 'refused'
              ELSE regisseur_validation_state
            END,
          regisseur_comment =
            CASE
              WHEN ? = 'REGISSEUR_REFUSAL'
              THEN ?
              ELSE regisseur_comment
            END,
          regisseur_signature =
            CASE
              WHEN ? = 'REGISSEUR_REFUSAL'
              THEN ?
              ELSE regisseur_signature
            END,
          regisseur_validated_by =
            CASE
              WHEN ? = 'REGISSEUR_REFUSAL'
              THEN ?
              ELSE regisseur_validated_by
            END,
          regisseur_validated_at =
            CASE
              WHEN ? = 'REGISSEUR_REFUSAL'
              THEN NOW()
              ELSE regisseur_validated_at
            END,
          updated_at = NOW()
        WHERE id = ?
      `,
      [
        nextStatus,
        nextDepartment,
        nextStep,
        comment,
        action,
        action,
        comment,
        action,
        signature,
        action,
        req.user.id,
        action,
        requestId,
      ]
    );

    await addHistory(connection, {
      requestId,
      action,
      previousStatus: request.status,
      newStatus: nextStatus,
      fromDepartment:
        req.user.role === "MEMBER"
          ? "MEMBER"
          : req.user.role ===
              "REGISSEUR_GENERAL"
            ? "REGISSEUR_GENERAL"
            : "PROGRAMME",
      toDepartment: nextDepartment,
      comment,
      signature,
      userId: req.user.id,
    });

    await connection.commit();

    return res.json({
      success: true,
      message:
        "Refus signÃ© et enregistrÃ©.",
      data: await getResponseRequest(
        requestId
      ),
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error(
      "Workflow rejection error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Impossible dâ€™enregistrer le refus.",
    });
  } finally {
    connection?.release();
  }
};

exports.resubmitCorrection = async (
  req,
  res
) => {
  let connection;

  try {
    const requestId = validateRequestId(
      req.params.id
    );
    const signature = requireSignature(
      req,
      res
    );
    const comment = cleanString(
      req.body.comment
    );
    const hasEventName =
      Object.prototype.hasOwnProperty.call(
        req.body,
        "eventName"
      );
    const hasDescription =
      Object.prototype.hasOwnProperty.call(
        req.body,
        "description"
      );
    const hasSlots =
      Object.prototype.hasOwnProperty.call(
        req.body,
        "slots"
      );

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message:
          "Identifiant de demande invalide.",
      });
    }

    if (!signature) return;

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const request = await getLockedRequest(
      connection,
      requestId
    );

    if (!request) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Demande introuvable.",
      });
    }

    if (
      req.user.role !== "MEMBER" ||
      Number(request.user_id) !==
        Number(req.user.id)
    ) {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message: "AccÃ¨s refusÃ©.",
      });
    }

    if (
      request.status !==
      "correction_requested"
    ) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message:
          "Cette demande nâ€™attend pas de correction.",
      });
    }

    const deadlineExpired =
      !request.correction_deadline ||
      new Date(
        request.correction_deadline
      ).getTime() < Date.now();

    if (deadlineExpired) {
      await connection.query(
        `
          UPDATE space_requests
          SET
            status = 'expired',
            assigned_department = 'MEMBER',
            current_step =
              'DÃ©lai de correction expirÃ© â€” nouvelle demande obligatoire',
            updated_at = NOW()
          WHERE id = ?
        `,
        [requestId]
      );

      await addHistory(connection, {
        requestId,
        action: "CORRECTION_DEADLINE_EXPIRED",
        previousStatus:
          request.status,
        newStatus: "expired",
        fromDepartment: "MEMBER",
        toDepartment: "MEMBER",
        comment:
          "Le dÃ©lai de cinq jours est dÃ©passÃ©.",
        signature: null,
        userId: req.user.id,
      });

      await connection.commit();

      return res.status(409).json({
        success: false,
        message:
          "Le dÃ©lai de cinq jours est dÃ©passÃ©. Vous devez crÃ©er une nouvelle demande.",
      });
    }

    const correctedEventName = hasEventName
      ? cleanString(req.body.eventName)
      : request.title;

    const correctedDescription = hasDescription
      ? cleanString(req.body.description)
      : request.description;

    if (!correctedEventName) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          "Lâ€™intitulÃ© de lâ€™activitÃ© est obligatoire.",
      });
    }

    let correctedSlots = null;

    if (hasSlots) {
      try {
        correctedSlots = parseReservationSlots(
          req.body.slots,
          null,
          null
        );
      } catch (slotError) {
        await connection.rollback();

        return res.status(400).json({
          success: false,
          message: slotError.message,
        });
      }

      for (const slot of correctedSlots) {
        const [conflicts] =
          await connection.query(
            `
              SELECT
                conflicting_request.id,
                conflicting_request.reference
              FROM space_request_slots
                AS existing_slot
              INNER JOIN space_requests
                AS conflicting_request
                ON conflicting_request.id =
                  existing_slot.space_request_id
              WHERE existing_slot.space_id = ?
                AND existing_slot.desired_date = ?
                AND existing_slot.space_request_id <> ?
                AND LOWER(
                  conflicting_request.status
                ) NOT IN (
                  'rejected',
                  'cancelled',
                  'canceled',
                  'expired',
                  'stopped_by_member'
                )
              LIMIT 1
            `,
            [
              slot.spaceId,
              slot.date,
              requestId,
            ]
          );

        if (conflicts.length > 0) {
          await connection.rollback();

          return res.status(409).json({
            success: false,
            message:
              `Lâ€™espace ${slot.spaceId} est dÃ©jÃ  rÃ©servÃ© le ${slot.date}.`,
            conflict: {
              requestId:
                conflicts[0].id,
              reference:
                conflicts[0].reference,
              spaceId: slot.spaceId,
              date: slot.date,
            },
          });
        }
      }
    }

    const primaryCorrectedSlot =
      correctedSlots?.[0] || null;

    const changedFields = [];

    if (
      hasEventName &&
      correctedEventName !== request.title
    ) {
      changedFields.push("intitulÃ©");
    }

    if (
      hasDescription &&
      correctedDescription !== request.description
    ) {
      changedFields.push("description");
    }

    if (hasSlots) {
      changedFields.push("dates et espaces");
    }

    /*
     * Reprendre l'Ã©tape exacte qui prÃ©cÃ©dait la demande de
     * correction, au lieu de renvoyer systÃ©matiquement le
     * dossier au dÃ©but du circuit Programme.
     */
    const [correctionHistoryRows] =
      await connection.query(
        `
          SELECT
            previous_status,
            from_department
          FROM space_request_histories
          WHERE space_request_id = ?
            AND new_status = 'correction_requested'
          ORDER BY performed_at DESC, id DESC
          LIMIT 1
        `,
        [requestId]
      );

    const correctionHistory =
      correctionHistoryRows[0] || null;

    const resumableStatuses = new Set([
      "program_review",
      "program_review_after_artistic",
      "program_review_after_confirmation",
      "program_review_after_parallel",
      "program_review_after_regisseur_rejection",
      "program_review_after_legal",
      "program_review_after_finance",
      "program_payment_review",
      "general_review",
      "artistic_review",
      "parallel_communication_regisseur_review",
      "communication_review_after_confirmation",
      "legal_review",
      "finance_cotation",
      "finance_cotation_revision",
      "awaiting_member_confirmation",
      "awaiting_payment_proof",
    ]);

    const previousStatus = String(
      correctionHistory?.previous_status || ""
    )
      .trim()
      .toLowerCase();

    const resumeStatus =
      resumableStatuses.has(previousStatus)
        ? previousStatus
        : "program_review";

    const previousDepartment = String(
      correctionHistory?.from_department || ""
    )
      .trim()
      .toUpperCase();

    const resumeDepartment =
      previousDepartment &&
      previousDepartment !== "MEMBER"
        ? previousDepartment
        : "PROGRAMME";

    const resumeStepLabels = {
      program_review:
        "Correction reÃ§ue â€” reprise de lâ€™examen par le Programme",
      program_review_after_artistic:
        "Correction reÃ§ue â€” reprise du contrÃ´le Programme aprÃ¨s avis artistique",
      program_review_after_confirmation:
        "Correction reÃ§ue â€” reprise du contrÃ´le Programme aprÃ¨s confirmation du membre",
      program_review_after_parallel:
        "Correction reÃ§ue â€” reprise du contrÃ´le Programme aprÃ¨s validations parallÃ¨les",
      program_review_after_regisseur_rejection:
        "Correction reÃ§ue â€” reprise aprÃ¨s le refus du RÃ©gisseur",
      program_review_after_legal:
        "Correction reÃ§ue â€” reprise du contrÃ´le Programme aprÃ¨s le Juridique",
      program_review_after_finance:
        "Correction reÃ§ue â€” reprise du contrÃ´le Programme aprÃ¨s les Finances",
      program_payment_review:
        "Correction reÃ§ue â€” reprise de la vÃ©rification du paiement",
      general_review:
        "Correction reÃ§ue â€” reprise de lâ€™examen gÃ©nÃ©ral",
      artistic_review:
        "Correction reÃ§ue â€” reprise de lâ€™examen artistique",
      parallel_communication_regisseur_review:
        "Correction reÃ§ue â€” reprise des validations Communication et RÃ©gisseur",
      communication_review_after_confirmation:
        "Correction reÃ§ue â€” reprise du contrÃ´le Communication",
      legal_review:
        "Correction reÃ§ue â€” reprise de lâ€™examen juridique",
      finance_cotation:
        "Correction reÃ§ue â€” reprise de la cotation financiÃ¨re",
      finance_cotation_revision:
        "Correction reÃ§ue â€” reprise de la rÃ©vision financiÃ¨re",
      awaiting_member_confirmation:
        "Correction reÃ§ue â€” reprise Ã  la confirmation du membre",
      awaiting_payment_proof:
        "Correction reÃ§ue â€” reprise Ã  lâ€™envoi de la preuve de paiement",
    };

    const resumeStep =
      resumeStepLabels[resumeStatus] ||
      "Demande corrigÃ©e â€” reprise du traitement Ã  lâ€™Ã©tape prÃ©cÃ©dente";

    await connection.query(
      `
        UPDATE space_requests
        SET
          title = ?,
          description = ?,
          space_id = CASE
            WHEN ? IS NULL
            THEN space_id
            ELSE ?
          END,
          desired_date = CASE
            WHEN ? IS NULL
            THEN desired_date
            ELSE ?
          END,
          status = ?,
          assigned_department = ?,
          assigned_to_user_id = NULL,
          current_step = ?,
          correction_deadline = NULL,
          programme_review_state =
            'unassigned',
          assistant_comment = NULL,
          assistant_signature = NULL,
          assistant_reviewed_at = NULL,
          electronic_signature = ?,
          updated_at = NOW()
        WHERE id = ?
      `,
      [
        correctedEventName,
        correctedDescription || null,
        primaryCorrectedSlot?.spaceId ||
          null,
        primaryCorrectedSlot?.spaceId ||
          null,
        primaryCorrectedSlot?.date ||
          null,
        primaryCorrectedSlot?.date ||
          null,
        resumeStatus,
        resumeDepartment,
        resumeStep,
        signature,
        requestId,
      ]
    );

    if (correctedSlots) {
      await connection.query(
        `
          DELETE FROM space_request_slots
          WHERE space_request_id = ?
        `,
        [requestId]
      );

      for (const slot of correctedSlots) {
        await connection.query(
          `
            INSERT INTO space_request_slots (
              space_request_id,
              space_id,
              desired_date
            )
            VALUES (?, ?, ?)
          `,
          [
            requestId,
            slot.spaceId,
            slot.date,
          ]
        );
      }
    }

    const historyComment = [
      changedFields.length > 0
        ? `Ã‰lÃ©ments corrigÃ©s : ${changedFields.join(
            ", "
          )}.`
        : "Le membre confirme avoir effectuÃ© les corrections demandÃ©es.",
      comment || null,
      request.rejection_comment
        ? `Motif traitÃ© : ${request.rejection_comment}`
        : null,
    ]
      .filter(Boolean)
      .join("\n");

    await addHistory(connection, {
      requestId,
      action: "MEMBER_CORRECTION_RESUBMIT",
      previousStatus: request.status,
      newStatus: resumeStatus,
      fromDepartment: "MEMBER",
      toDepartment: resumeDepartment,
      comment: historyComment,
      signature,
      userId: req.user.id,
    });

    await connection.commit();

    return res.json({
      success: true,
      message:
        `La demande corrigÃ©e reprend le traitement Ã  lâ€™Ã©tape ${resumeStatus}.`,
      data: await getResponseRequest(
        requestId
      ),
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error(
      "Correction resubmission error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Impossible de renvoyer la demande corrigÃ©e.",
    });
  } finally {
    connection?.release();
  }
};

exports.uploadPaymentProof = async (
  req,
  res
) => {
  let connection;

  try {
    const requestId = validateRequestId(
      req.params.id
    );
    const signature = requireSignature(
      req,
      res
    );

    if (!requestId) {
      workflowRemoveUploadedFile(req.file);
      return res.status(400).json({
        success: false,
        message:
          "Identifiant de demande invalide.",
      });
    }

    if (!signature) {
      workflowRemoveUploadedFile(req.file);
      return;
    }

    if (
      req.user.role !== "MEMBER"
    ) {
      workflowRemoveUploadedFile(req.file);
      return res.status(403).json({
        success: false,
        message:
          "Seul le membre peut dÃ©poser sa preuve de paiement.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message:
          "La preuve de paiement est obligatoire.",
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const request = await getLockedRequest(
      connection,
      requestId
    );

    if (!request) {
      await connection.rollback();
      workflowRemoveUploadedFile(req.file);
      return res.status(404).json({
        success: false,
        message: "Demande introuvable.",
      });
    }

    if (
      Number(request.user_id) !==
        Number(req.user.id) ||
      request.status !==
        "awaiting_payment_proof"
    ) {
      await connection.rollback();
      workflowRemoveUploadedFile(req.file);
      return res.status(409).json({
        success: false,
        message:
          "Cette demande nâ€™attend pas votre preuve de paiement.",
      });
    }

    if (
      await workflowHasDocument(
        connection,
        requestId,
        "PAYMENT_PROOF"
      )
    ) {
      await connection.rollback();
      workflowRemoveUploadedFile(req.file);
      return res.status(409).json({
        success: false,
        message:
          "Une preuve de paiement existe dÃ©jÃ .",
      });
    }

    const documentUrl =
      `/uploads/space-requests/${req.file.filename}`;

    await connection.query(
      `
        INSERT INTO space_request_documents (
          space_request_id,
          document_type,
          document_name,
          document_path,
          document_mime_type,
          document_size,
          uploaded_by
        )
        VALUES (
          ?,
          'PAYMENT_PROOF',
          ?,
          ?,
          ?,
          ?,
          ?
        )
      `,
      [
        requestId,
        req.file.originalname,
        documentUrl,
        req.file.mimetype,
        req.file.size,
        req.user.id,
      ]
    );

    await connection.query(
      `
        UPDATE space_requests
        SET
          status =
            'program_payment_review',
          assigned_department =
            'PROGRAMME',
          current_step =
            'Paiement Ã  vÃ©rifier et date Ã  confirmer par le Programme',
          updated_at = NOW()
        WHERE id = ?
      `,
      [requestId]
    );

    await addHistory(connection, {
      requestId,
      action:
        "MEMBER_PAYMENT_PROOF_UPLOAD",
      previousStatus: request.status,
      newStatus:
        "program_payment_review",
      fromDepartment: "MEMBER",
      toDepartment: "PROGRAMME",
      comment:
        "Preuve de paiement dÃ©posÃ©e et signÃ©e par le membre.",
      signature,
      userId: req.user.id,
    });

    await connection.commit();

    return res.status(201).json({
      success: true,
      message:
        "Preuve signÃ©e transmise au Programme.",
      data: await getResponseRequest(
        requestId
      ),
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    workflowRemoveUploadedFile(req.file);

    console.error(
      "Payment proof workflow error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Impossible dâ€™enregistrer la preuve de paiement.",
    });
  } finally {
    connection?.release();
  }
};

exports.getFinanceBalance = async (
  req,
  res
) => {
  try {
    if (
      ![
        "FINANCE",
        "SUPERVISEUR",
        "ADMIN",
      ].includes(req.user.role)
    ) {
      return res.status(403).json({
        success: false,
        message: "AccÃ¨s refusÃ©.",
      });
    }

    const [rows] = await pool.query(
      `
        SELECT
          COUNT(*) AS paidRequests,
          COALESCE(SUM(amount), 0)
            AS totalBalance
        FROM finance_payment_ledger
        WHERE status = 'PAID'
      `
    );

    return res.json({
      success: true,
      data: {
        paidRequests: Number(
          rows[0].paidRequests || 0
        ),
        totalBalance: Number(
          rows[0].totalBalance || 0
        ),
        currency: "USD",
      },
    });
  } catch (error) {
    console.error(
      "Finance balance error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Impossible de charger le solde Finance.",
    });
  }
};

/**
 * DELETE /api/space-requests/:id
 *
 * Suppression dÃ©finitive rÃ©servÃ©e au
 * SUPERVISEUR et Ã  l'ADMIN.
 */
exports.deleteBySupervisor = async (
  req,
  res
) => {
  let connection;

  try {
    if (
      ![
        "SUPERVISEUR",
        "ADMIN",
      ].includes(req.user.role)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Seul le superviseur ou lâ€™administrateur peut supprimer une demande.",
      });
    }

    const requestId = Number(
      req.params.id
    );

    if (
      !Number.isInteger(requestId) ||
      requestId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Identifiant de demande invalide.",
      });
    }

    connection =
      await pool.getConnection();

    await connection.beginTransaction();

    const [requestRows] =
      await connection.query(
        `
          SELECT
            id,
            reference,
            title
          FROM space_requests
          WHERE id = ?
          FOR UPDATE
        `,
        [requestId]
      );

    if (requestRows.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message:
          "Demande introuvable.",
      });
    }

    const request = requestRows[0];

    /*
     * Le registre financier doit Ãªtre
     * supprimÃ© avant la demande.
     */
    await connection.query(
      `
        DELETE FROM finance_payment_ledger
        WHERE space_request_id = ?
      `,
      [requestId]
    );

    /*
     * Suppression des documents associÃ©s.
     */
    await connection.query(
      `
        DELETE FROM space_request_documents
        WHERE space_request_id = ?
      `,
      [requestId]
    );

    /*
     * Suppression de lâ€™historique.
     */
    await connection.query(
      `
        DELETE FROM space_request_histories
        WHERE space_request_id = ?
      `,
      [requestId]
    );

    /*
     * Suppression dÃ©finitive de la demande.
     */
    const [deleteResult] =
      await connection.query(
        `
          DELETE FROM space_requests
          WHERE id = ?
        `,
        [requestId]
      );

    if (
      deleteResult.affectedRows !== 1
    ) {
      throw new Error(
        "La demande nâ€™a pas Ã©tÃ© supprimÃ©e."
      );
    }

    await connection.commit();

    return res.json({
      success: true,
      message:
        `La demande ${request.reference || `#${request.id}`} a Ã©tÃ© supprimÃ©e dÃ©finitivement.`,
      data: {
        id: request.id,
        reference: request.reference,
        title: request.title,
      },
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error(
          "Supervisor deletion rollback error:",
          rollbackError
        );
      }
    }

    console.error(
      "Supervisor delete request error:",
      error
    );

    if (
      error.code ===
      "ER_NO_SUCH_TABLE"
    ) {
      return res.status(500).json({
        success: false,
        message:
          "Une table nÃ©cessaire Ã  la suppression est absente.",
      });
    }

    if (
      error.code ===
      "ER_ROW_IS_REFERENCED_2"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Cette demande est encore liÃ©e Ã  dâ€™autres donnÃ©es et ne peut pas Ãªtre supprimÃ©e.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Impossible de supprimer dÃ©finitivement la demande.",
      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,
    });
  } finally {
    connection?.release();
  }
};