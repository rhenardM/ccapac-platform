const fs = require("fs");
const pool = require("../config/db");

const STAFF_ROLES = [
  "ADMIN",
  "SUPERVISEUR",
  "DG",
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

const UPLOAD_PERMISSIONS = {
  REQUEST_LETTER: ["MEMBER"],
  ARTISTIC_OPINION: [
    "DIRECTION_ARTISTIQUE",
    "DIRECTION_ARTISTIQUE_SUPERVISEUR",
    "DIRECTION_ARTISTIQUE_ASSISTANT",
  ],
  LEGAL_DOCUMENT: [
    "JURIDIQUE",
    "JURIDIQUE_SUPERVISEUR",
    "JURIDIQUE_ASSISTANT",
  ],
  FINANCE_QUOTE: ["FINANCE"],
};

function removeFile(file) {
  if (!file?.path) return;

  /*
   * Une URL Cloudinary n'est pas un chemin local et ne
   * doit jamais être transmise à fs.unlink().
   */
  if (/^https?:\/\//i.test(file.path)) {
    return;
  }

  fs.unlink(file.path, (error) => {
    if (error && error.code !== "ENOENT") {
      console.error("Document cleanup error:", error);
    }
  });
}

async function getRequestAccess(connection, requestId) {
  const [rows] = await connection.query(
    `
      SELECT
        id,
        user_id,
        status,
        artistic_assigned_to,
        legal_assigned_to
      FROM space_requests
      WHERE id = ?
      LIMIT 1
    `,
    [requestId]
  );

  return rows[0] || null;
}

function canRead(request, user) {
  if (STAFF_ROLES.includes(user.role)) return true;

  return (
    user.role === "MEMBER" &&
    Number(request.user_id) === Number(user.id)
  );
}

function canUploadDocument(documentType, request, user) {
  if (user.role === "ADMIN") {
    return true;
  }

  if (documentType === "REQUEST_LETTER") {
    return (
      user.role === "MEMBER" &&
      Number(request.user_id) ===
        Number(user.id) &&
      request.status === "draft"
    );
  }

  const allowedRoles =
    UPLOAD_PERMISSIONS[documentType] || [];

  if (!allowedRoles.includes(user.role)) {
    return false;
  }

  if (
    user.role ===
      "DIRECTION_ARTISTIQUE_ASSISTANT" &&
    Number(request.artistic_assigned_to) !==
      Number(user.id)
  ) {
    return false;
  }

  if (
    user.role === "JURIDIQUE_ASSISTANT" &&
    Number(request.legal_assigned_to) !==
      Number(user.id)
  ) {
    return false;
  }

  return true;
}

function serializeDocument(row) {
  return {
    id: Number(row.id),
    requestId: Number(row.space_request_id),
    type: row.document_type,
    name: row.document_name,
    url: row.document_path,
    mimeType:
      row.document_mime_type ||
      "application/octet-stream",
    size: Number(row.document_size || 0),
    uploadedAt: row.uploaded_at,
    uploadedBy: row.uploaded_by
      ? {
          id: Number(row.uploaded_by),
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email,
          role: row.role,
        }
      : null,
  };
}

/* GET /api/space-requests/:id/documents */
exports.getDocuments = async (req, res) => {
  try {
    const requestId = Number(req.params.id);

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

    const request = await getRequestAccess(
      pool,
      requestId
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Demande introuvable.",
      });
    }

    if (!canRead(request, req.user)) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé.",
      });
    }

    const [rows] = await pool.query(
      `
        SELECT
          d.id,
          d.space_request_id,
          d.document_type,
          d.document_name,
          d.document_path,
          d.document_mime_type,
          d.document_size,
          d.uploaded_by,
          d.uploaded_at,
          u.first_name,
          u.last_name,
          u.email,
          u.role
        FROM space_request_documents d
        LEFT JOIN users u
          ON u.id = d.uploaded_by
        WHERE d.space_request_id = ?
        ORDER BY
          FIELD(
            d.document_type,
            'INITIAL_REQUEST',
            'REQUEST_LETTER',
            'ARTISTIC_OPINION',
            'LEGAL_DOCUMENT',
            'FINANCE_QUOTE',
            'PAYMENT_PROOF'
          ),
          d.uploaded_at ASC,
          d.id ASC
      `,
      [requestId]
    );

    return res.json({
      success: true,
      data: rows.map(serializeDocument),
    });
  } catch (error) {
    console.error(
      "Get request documents error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Impossible de charger les documents du dossier.",
      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,
    });
  }
};

/* POST /api/space-requests/:id/documents/... */
exports.uploadDocument = async (req, res) => {
  let connection;

  try {
    const requestId = Number(req.params.id);
    const documentType = String(
      req.params.type || ""
    )
      .trim()
      .toUpperCase();

    if (
      !Number.isInteger(requestId) ||
      requestId <= 0
    ) {
      removeFile(req.file);
      return res.status(400).json({
        success: false,
        message:
          "Identifiant de demande invalide.",
      });
    }

    if (!UPLOAD_PERMISSIONS[documentType]) {
      removeFile(req.file);
      return res.status(400).json({
        success: false,
        message: "Type de document invalide.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Le document est obligatoire.",
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const request = await getRequestAccess(
      connection,
      requestId
    );

    if (!request) {
      await connection.rollback();
      removeFile(req.file);
      return res.status(404).json({
        success: false,
        message: "Demande introuvable.",
      });
    }

    if (
      !canUploadDocument(
        documentType,
        request,
        req.user
      )
    ) {
      await connection.rollback();
      removeFile(req.file);
      return res.status(403).json({
        success: false,
        message:
          "Votre rôle ou l’affectation de cette demande ne permet pas d’ajouter ce document.",
      });
    }

    /*
     * Avec CloudinaryRawStorage, req.file.path contient
     * déjà l'URL HTTPS définitive du document.
     * Le fallback local est conservé uniquement pour un
     * éventuel stockage disque.
     */
    const documentUrl =
      req.file.path ||
      `/uploads/space-requests/${req.file.filename}`;

    const [existingRows] =
      await connection.query(
        `
          SELECT id, document_path
          FROM space_request_documents
          WHERE space_request_id = ?
            AND document_type = ?
          LIMIT 1
          FOR UPDATE
        `,
        [requestId, documentType]
      );

    let documentId;
    let oldDocumentPath = null;

    if (existingRows.length > 0) {
      documentId = existingRows[0].id;
      oldDocumentPath =
        existingRows[0].document_path;

      await connection.query(
        `
          UPDATE space_request_documents
          SET
            document_name = ?,
            document_path = ?,
            document_mime_type = ?,
            document_size = ?,
            uploaded_by = ?,
            uploaded_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        [
          req.file.originalname,
          documentUrl,
          req.file.mimetype,
          req.file.size,
          req.user.id,
          documentId,
        ]
      );
    } else {
      const [result] =
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
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
          [
            requestId,
            documentType,
            req.file.originalname,
            documentUrl,
            req.file.mimetype,
            req.file.size,
            req.user.id,
          ]
        );

      documentId = result.insertId;
    }

    const [documentRows] =
      await connection.query(
        `
          SELECT
            d.*,
            u.first_name,
            u.last_name,
            u.email,
            u.role
          FROM space_request_documents d
          LEFT JOIN users u
            ON u.id = d.uploaded_by
          WHERE d.id = ?
          LIMIT 1
        `,
        [documentId]
      );

    await connection.commit();

    if (
      oldDocumentPath &&
      oldDocumentPath !== documentUrl &&
      oldDocumentPath.startsWith(
        "/uploads/space-requests/"
      )
    ) {
      const oldFileName =
        oldDocumentPath.split("/").pop();

      removeFile({
        path: `${process.cwd()}/uploads/space-requests/${oldFileName}`,
      });
    }

    return res.status(201).json({
      success: true,
      message: existingRows.length
        ? "Document régénéré et remplacé dans le dossier."
        : "Document ajouté au dossier.",
      data: serializeDocument(
        documentRows[0]
      ),
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error(
          "Document rollback error:",
          rollbackError
        );
      }
    }

    removeFile(req.file);
    console.error(
      "Upload workflow document error:",
      error
    );

    if (
      error.code === "WARN_DATA_TRUNCATED" ||
      error.code === "ER_TRUNCATED_WRONG_VALUE_FOR_FIELD" ||
      error.code === "ER_DATA_TOO_LONG"
    ) {
      return res.status(500).json({
        success: false,
        message:
          "Le type REQUEST_LETTER n'est pas encore autorisé dans la colonne document_type de la base de données.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Impossible d'ajouter le document au dossier.",
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