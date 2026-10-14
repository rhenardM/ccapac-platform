const pool = require("../config/db");

const ARTISTIC_ROLES = new Set([
  "ADMIN",
  "DIRECTION_ARTISTIQUE",
  "DIRECTION_ARTISTIQUE_SUPERVISEUR",
  "DIRECTION_ARTISTIQUE_ASSISTANT",
]);

const ARTISTIC_SUPERVISOR_ROLES = new Set([
  "ADMIN",
  "DIRECTION_ARTISTIQUE",
  "DIRECTION_ARTISTIQUE_SUPERVISEUR",
]);

const PROJECT_STATUSES = new Set([
  "SUBMITTED",
  "ASSIGNED",
  "ASSISTANT_REVIEW",
  "SUPERVISOR_REVIEW",
  "CORRECTION_REQUESTED",
  "APPROVED",
  "REJECTED",
]);

function clean(value) {
  return String(value ?? "").trim();
}

function nullable(value) {
  const result = clean(value);
  return result || null;
}

function positiveInteger(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function normalizeRole(value) {
  return clean(value).toUpperCase();
}

function isArtisticUser(req) {
  return ARTISTIC_ROLES.has(normalizeRole(req.user?.role));
}

function isArtisticSupervisor(req) {
  return ARTISTIC_SUPERVISOR_ROLES.has(normalizeRole(req.user?.role));
}

function createReference() {
  const year = new Date().getFullYear();
  const random = String(Math.floor(Math.random() * 1_000_000_000)).padStart(9, "0");
  return `PRJ-${year}-${random}`;
}

function getDocumentPath(file) {
  if (!file) return null;

  return (
    file.secure_url ||
    file.url ||
    file.path ||
    file.location ||
    (file.filename
      ? `/uploads/space-requests/${file.filename}`
      : null)
  );
}

function parseSupportRequested(value) {
  if (Array.isArray(value)) {
    return value.map(clean).filter(Boolean);
  }

  if (!value) return [];

  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed)
      ? parsed.map(clean).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

function validateCreatePayload(body) {
  const required = [
    ["title", "Le titre du projet est obligatoire."],
    ["category", "Le domaine culturel est obligatoire."],
    ["summary", "La présentation générale du projet est obligatoire."],
    ["intentionNote", "La note d’intention est obligatoire."],
    ["objectives", "Les objectifs du projet sont obligatoires."],
    ["plannedActivities", "Les activités envisagées sont obligatoires."],
    ["targetAudience", "Le public cible est obligatoire."],
    ["startDate", "La date de début prévisionnelle est obligatoire."],
    ["endDate", "La date de fin prévisionnelle est obligatoire."],
    ["estimatedBudget", "Le budget prévisionnel est obligatoire."],
    ["technicalNeeds", "Les besoins techniques et logistiques sont obligatoires."],
    ["team", "La présentation du porteur de projet est obligatoire."],
    ["electronicSignature", "La signature électronique est obligatoire."],
  ];

  for (const [field, message] of required) {
    if (!clean(body[field])) return message;
  }

  if (clean(body.endDate) < clean(body.startDate)) {
    return "La date de fin doit être postérieure ou égale à la date de début.";
  }

  const budget = Number(body.estimatedBudget);
  if (!Number.isFinite(budget) || budget < 0) {
    return "Le budget prévisionnel est invalide.";
  }

  return null;
}

async function insertHistory(
  connection,
  proposalId,
  action,
  previousStatus,
  newStatus,
  comment,
  userId
) {
  await connection.query(
    `
      INSERT INTO project_proposal_histories (
        project_proposal_id,
        action,
        previous_status,
        new_status,
        comment,
        performed_by
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      proposalId,
      action,
      previousStatus || null,
      newStatus || null,
      nullable(comment),
      userId,
    ]
  );
}

async function getProposalById(connection, proposalId) {
  const [rows] = await connection.query(
    `
      SELECT
        proposal.*,
        CONCAT_WS(' ', owner.first_name, owner.last_name) AS ownerName,
        owner.email AS ownerEmail,
        CONCAT_WS(' ', assistant.first_name, assistant.last_name) AS assignedToName,
        assistant.email AS assignedToEmail
      FROM project_proposals AS proposal
      INNER JOIN users AS owner ON owner.id = proposal.user_id
      LEFT JOIN users AS assistant ON assistant.id = proposal.assigned_to_user_id
      WHERE proposal.id = ?
      LIMIT 1
    `,
    [proposalId]
  );

  return rows[0] || null;
}

function canReadProposal(req, proposal) {
  const userId = Number(req.user?.id);
  const role = normalizeRole(req.user?.role);

  if (Number(proposal.user_id) === userId) return true;
  if (ARTISTIC_SUPERVISOR_ROLES.has(role)) return true;

  return (
    role === "DIRECTION_ARTISTIQUE_ASSISTANT" &&
    Number(proposal.assigned_to_user_id) === userId
  );
}

exports.create = async (req, res) => {
  const userId = positiveInteger(req.user?.id);

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Utilisateur non authentifié.",
    });
  }

  const validationError = validateCreatePayload(req.body || {});
  if (validationError) {
    return res.status(400).json({
      success: false,
      message: validationError,
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    let reference = createReference();
    let referenceExists = true;

    while (referenceExists) {
      const [existing] = await connection.query(
        "SELECT id FROM project_proposals WHERE reference = ? LIMIT 1",
        [reference]
      );
      referenceExists = existing.length > 0;
      if (referenceExists) reference = createReference();
    }

    const supportRequested = parseSupportRequested(
      req.body.supportRequested
    );

    const [result] = await connection.query(
      `
        INSERT INTO project_proposals (
          reference,
          user_id,
          title,
          category,
          summary,
          intention_note,
          objectives,
          planned_activities,
          target_audience,
          expected_impact,
          preferred_location,
          start_date,
          end_date,
          estimated_participants,
          estimated_budget,
          technical_needs,
          partners,
          team,
          previous_work,
          additional_information,
          support_requested,
          electronic_signature
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        reference,
        userId,
        clean(req.body.title),
        clean(req.body.category),
        clean(req.body.summary),
        clean(req.body.intentionNote),
        clean(req.body.objectives),
        clean(req.body.plannedActivities),
        clean(req.body.targetAudience),
        nullable(req.body.expectedImpact),
        nullable(req.body.preferredLocation),
        clean(req.body.startDate),
        clean(req.body.endDate),
        positiveInteger(req.body.estimatedParticipants),
        Number(req.body.estimatedBudget),
        clean(req.body.technicalNeeds),
        nullable(req.body.partners),
        clean(req.body.team),
        nullable(req.body.previousWork),
        nullable(req.body.additionalInformation),
        JSON.stringify(supportRequested),
        clean(req.body.electronicSignature),
      ]
    );

    const proposalId = Number(result.insertId);
    const documentPath = getDocumentPath(req.file);

    if (req.file && documentPath) {
      await connection.query(
        `
          INSERT INTO project_proposal_documents (
            project_proposal_id,
            document_type,
            document_name,
            document_path,
            document_mime_type,
            document_size,
            uploaded_by
          )
          VALUES (?, 'INITIAL_PROPOSAL', ?, ?, ?, ?, ?)
        `,
        [
          proposalId,
          req.file.originalname || req.file.filename || "Document du projet",
          documentPath,
          req.file.mimetype || null,
          Number(req.file.size || 0) || null,
          userId,
        ]
      );
    }

    await insertHistory(
      connection,
      proposalId,
      "CREATE_AND_SUBMIT",
      null,
      "SUBMITTED",
      "Proposition transmise à la Direction artistique.",
      userId
    );

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "Votre proposition de projet a été envoyée.",
      data: {
        id: proposalId,
        reference,
        status: "SUBMITTED",
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error("Create project proposal error:", error);

    return res.status(500).json({
      success: false,
      message: "Impossible d’enregistrer la proposition de projet.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  } finally {
    connection.release();
  }
};

exports.getMyProposals = async (req, res) => {
  const userId = positiveInteger(req.user?.id);

  if (!userId) {
    return res.status(401).json({ success: false, message: "Non authentifié." });
  }

  try {
    const [rows] = await pool.query(
      `
        SELECT
          proposal.*,
          (
            SELECT COUNT(*)
            FROM project_proposal_documents AS document
            WHERE document.project_proposal_id = proposal.id
          ) AS documentCount
        FROM project_proposals AS proposal
        WHERE proposal.user_id = ?
        ORDER BY proposal.created_at DESC, proposal.id DESC
      `,
      [userId]
    );

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Get member project proposals error:", error);
    return res.status(500).json({
      success: false,
      message: "Impossible de charger vos propositions.",
    });
  }
};

exports.getArtisticProposals = async (req, res) => {
  if (!isArtisticUser(req)) {
    return res.status(403).json({
      success: false,
      message: "Accès réservé à la Direction artistique.",
    });
  }

  const userId = Number(req.user.id);
  const role = normalizeRole(req.user.role);
  const status = clean(req.query.status).toUpperCase();
  const search = clean(req.query.search);
  const values = [];
  const conditions = [];

  if (role === "DIRECTION_ARTISTIQUE_ASSISTANT") {
    conditions.push("proposal.assigned_to_user_id = ?");
    values.push(userId);
  }

  if (status && status !== "ALL" && PROJECT_STATUSES.has(status)) {
    conditions.push("proposal.status = ?");
    values.push(status);
  }

  if (search) {
    conditions.push(`(
      proposal.reference LIKE ? OR
      proposal.title LIKE ? OR
      proposal.category LIKE ? OR
      owner.email LIKE ? OR
      CONCAT_WS(' ', owner.first_name, owner.last_name) LIKE ?
    )`);
    const term = `%${search}%`;
    values.push(term, term, term, term, term);
  }

  const where = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  try {
    const [rows] = await pool.query(
      `
        SELECT
          proposal.*,
          CONCAT_WS(' ', owner.first_name, owner.last_name) AS ownerName,
          owner.email AS ownerEmail,
          CONCAT_WS(' ', assistant.first_name, assistant.last_name) AS assignedToName,
          (
            SELECT COUNT(*)
            FROM project_proposal_documents AS document
            WHERE document.project_proposal_id = proposal.id
          ) AS documentCount
        FROM project_proposals AS proposal
        INNER JOIN users AS owner ON owner.id = proposal.user_id
        LEFT JOIN users AS assistant ON assistant.id = proposal.assigned_to_user_id
        ${where}
        ORDER BY
          FIELD(
            proposal.status,
            'SUBMITTED',
            'SUPERVISOR_REVIEW',
            'ASSIGNED',
            'ASSISTANT_REVIEW',
            'CORRECTION_REQUESTED',
            'APPROVED',
            'REJECTED'
          ),
          proposal.created_at DESC
      `,
      values
    );

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Get artistic project proposals error:", error);
    return res.status(500).json({
      success: false,
      message: "Impossible de charger les propositions de projet.",
    });
  }
};

exports.getOne = async (req, res) => {
  const proposalId = positiveInteger(req.params.id);

  if (!proposalId) {
    return res.status(400).json({ success: false, message: "Identifiant invalide." });
  }

  try {
    const proposal = await getProposalById(pool, proposalId);

    if (!proposal) {
      return res.status(404).json({ success: false, message: "Proposition introuvable." });
    }

    if (!canReadProposal(req, proposal)) {
      return res.status(403).json({ success: false, message: "Accès refusé." });
    }

    const [documents] = await pool.query(
      `
        SELECT
          id,
          document_type AS documentType,
          document_name AS documentName,
          document_path AS documentPath,
          document_mime_type AS documentMimeType,
          document_size AS documentSize,
          created_at AS createdAt
        FROM project_proposal_documents
        WHERE project_proposal_id = ?
        ORDER BY created_at DESC, id DESC
      `,
      [proposalId]
    );

    const [histories] = await pool.query(
      `
        SELECT
          history.id,
          history.action,
          history.previous_status AS previousStatus,
          history.new_status AS newStatus,
          history.comment,
          history.performed_at AS performedAt,
          CONCAT_WS(' ', actor.first_name, actor.last_name) AS performedByName,
          actor.email AS performedByEmail
        FROM project_proposal_histories AS history
        LEFT JOIN users AS actor ON actor.id = history.performed_by
        WHERE history.project_proposal_id = ?
        ORDER BY history.performed_at DESC, history.id DESC
      `,
      [proposalId]
    );

    return res.json({
      success: true,
      data: {
        ...proposal,
        support_requested:
          typeof proposal.support_requested === "string"
            ? JSON.parse(proposal.support_requested || "[]")
            : proposal.support_requested || [],
        documents,
        histories,
      },
    });
  } catch (error) {
    console.error("Get project proposal error:", error);
    return res.status(500).json({
      success: false,
      message: "Impossible de charger la proposition.",
    });
  }
};

exports.assignAssistant = async (req, res) => {
  if (!isArtisticSupervisor(req)) {
    return res.status(403).json({
      success: false,
      message: "Action réservée au superviseur de la Direction artistique.",
    });
  }

  const proposalId = positiveInteger(req.params.id);
  const assistantId = positiveInteger(req.body.assistantId);
  const userId = Number(req.user.id);

  if (!proposalId || !assistantId) {
    return res.status(400).json({
      success: false,
      message: "Proposition ou assistant invalide.",
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const proposal = await getProposalById(connection, proposalId);
    if (!proposal) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Proposition introuvable." });
    }

    const [assistants] = await connection.query(
      `
        SELECT id
        FROM users
        WHERE id = ?
          AND role = 'DIRECTION_ARTISTIQUE_ASSISTANT'
        LIMIT 1
      `,
      [assistantId]
    );

    if (!assistants.length) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Assistant de la Direction artistique introuvable.",
      });
    }

    await connection.query(
      `
        UPDATE project_proposals
        SET
          assigned_to_user_id = ?,
          status = 'ASSIGNED',
          current_step = 'Analyse par un assistant de la Direction artistique'
        WHERE id = ?
      `,
      [assistantId, proposalId]
    );

    await insertHistory(
      connection,
      proposalId,
      "ASSIGN_ARTISTIC_ASSISTANT",
      proposal.status,
      "ASSIGNED",
      req.body.comment,
      userId
    );

    await connection.commit();

    return res.json({ success: true, message: "Proposition affectée à l’assistant." });
  } catch (error) {
    await connection.rollback();
    console.error("Assign project proposal error:", error);
    return res.status(500).json({ success: false, message: "Impossible d’affecter la proposition." });
  } finally {
    connection.release();
  }
};

exports.review = async (req, res) => {
  if (!isArtisticUser(req)) {
    return res.status(403).json({
      success: false,
      message: "Accès réservé à la Direction artistique.",
    });
  }

  const proposalId = positiveInteger(req.params.id);
  const userId = Number(req.user.id);
  const role = normalizeRole(req.user.role);
  const decision = clean(req.body.decision).toUpperCase();
  const comment = clean(req.body.comment);

  if (!proposalId) {
    return res.status(400).json({ success: false, message: "Identifiant invalide." });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const proposal = await getProposalById(connection, proposalId);
    if (!proposal) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Proposition introuvable." });
    }

    if (
      role === "DIRECTION_ARTISTIQUE_ASSISTANT" &&
      Number(proposal.assigned_to_user_id) !== userId
    ) {
      await connection.rollback();
      return res.status(403).json({ success: false, message: "Cette proposition ne vous est pas affectée." });
    }

    let nextStatus;
    let nextStep;
    let action;

    if (role === "DIRECTION_ARTISTIQUE_ASSISTANT") {
      if (!["RECOMMEND_APPROVAL", "RECOMMEND_REJECTION"].includes(decision)) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: "Décision d’assistant invalide.",
        });
      }

      nextStatus = "SUPERVISOR_REVIEW";
      nextStep = "Décision du superviseur de la Direction artistique";
      action = decision;
    } else {
      const decisions = {
        APPROVE: ["APPROVED", "Proposition approuvée", "APPROVE"],
        REJECT: ["REJECTED", "Proposition rejetée", "REJECT"],
        REQUEST_CORRECTION: [
          "CORRECTION_REQUESTED",
          "Corrections demandées au porteur du projet",
          "REQUEST_CORRECTION",
        ],
      };

      const transition = decisions[decision];
      if (!transition) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: "Décision invalide." });
      }

      [nextStatus, nextStep, action] = transition;
    }

    if (!comment) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Le commentaire de la décision est obligatoire.",
      });
    }

    await connection.query(
      `
        UPDATE project_proposals
        SET
          status = ?,
          current_step = ?,
          review_comment = ?,
          reviewed_by = ?,
          reviewed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [nextStatus, nextStep, comment, userId, proposalId]
    );

    await insertHistory(
      connection,
      proposalId,
      action,
      proposal.status,
      nextStatus,
      comment,
      userId
    );

    await connection.commit();

    return res.json({
      success: true,
      message:
        role === "DIRECTION_ARTISTIQUE_ASSISTANT"
          ? "Votre recommandation a été transmise au superviseur."
          : "La décision artistique a été enregistrée.",
      data: { status: nextStatus, currentStep: nextStep },
    });
  } catch (error) {
    await connection.rollback();
    console.error("Review project proposal error:", error);
    return res.status(500).json({ success: false, message: "Impossible d’enregistrer la décision." });
  } finally {
    connection.release();
  }
};
