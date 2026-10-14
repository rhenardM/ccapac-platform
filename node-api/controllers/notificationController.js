const pool = require("../config/db");

async function syncStatusNotifications(userId) {
  await pool.query(
    `
      INSERT IGNORE INTO user_notifications (
        user_id,
        space_request_id,
        history_id,
        type,
        title,
        message,
        previous_status,
        new_status,
        is_read,
        created_at
      )
      SELECT
        request.user_id,
        history.space_request_id,
        history.id,
        'STATUS_CHANGED',
        CONCAT(
          'Mise à jour de la demande ',
          COALESCE(
            request.reference,
            CONCAT('#', request.id)
          )
        ),
        CONCAT(
          'Le statut de votre demande est passé de ',
          COALESCE(
            history.previous_status,
            'Non renseigné'
          ),
          ' à ',
          COALESCE(
            history.new_status,
            'Non renseigné'
          ),
          '.'
        ),
        history.previous_status,
        history.new_status,
        0,
        COALESCE(
          history.performed_at,
          CURRENT_TIMESTAMP
        )
      FROM space_request_histories AS history
      INNER JOIN space_requests AS request
        ON request.id = history.space_request_id
      WHERE request.user_id = ?
        AND history.new_status IS NOT NULL
        AND COALESCE(
          history.previous_status,
          ''
        ) <> COALESCE(
          history.new_status,
          ''
        )
    `,
    [userId]
  );
}

exports.getMyNotifications = async (req, res) => {
  try {
    const userId = Number(req.user?.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié.",
      });
    }

    await syncStatusNotifications(userId);

    const [notifications] = await pool.query(
      `
        SELECT
          notification.id,
          notification.space_request_id
            AS requestId,
          notification.history_id
            AS historyId,
          notification.type,
          notification.title,
          notification.message,
          notification.previous_status
            AS previousStatus,
          notification.new_status
            AS newStatus,
          notification.is_read
            AS isRead,
          notification.created_at
            AS createdAt,
          request.reference,
          request.title AS eventName
        FROM user_notifications AS notification
        INNER JOIN space_requests AS request
          ON request.id =
            notification.space_request_id
        WHERE notification.user_id = ?
        ORDER BY
          notification.created_at DESC,
          notification.id DESC
        LIMIT 100
      `,
      [userId]
    );

    const [countRows] = await pool.query(
      `
        SELECT COUNT(*) AS unreadCount
        FROM user_notifications
        WHERE user_id = ?
          AND is_read = 0
      `,
      [userId]
    );

    return res.status(200).json({
      success: true,
      unreadCount: Number(
        countRows[0]?.unreadCount || 0
      ),
      data: notifications.map(
        (notification) => ({
          ...notification,
          id: Number(notification.id),
          requestId: Number(
            notification.requestId
          ),
          historyId:
            notification.historyId == null
              ? null
              : Number(
                  notification.historyId
                ),
          isRead: Boolean(
            notification.isRead
          ),
        })
      ),
    });
  } catch (error) {
    console.error(
      "Get notifications error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Impossible de charger les notifications.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const userId = Number(req.user?.id);

    const notificationId = Number(
      req.params.notificationId
    );

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié.",
      });
    }

    if (
      !Number.isInteger(notificationId) ||
      notificationId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Identifiant de notification invalide.",
      });
    }

    const [result] = await pool.query(
      `
        UPDATE user_notifications
        SET is_read = 1
        WHERE id = ?
          AND user_id = ?
      `,
      [notificationId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Notification introuvable.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Notification marquée comme lue.",
    });
  } catch (error) {
    console.error(
      "Mark notification as read error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Impossible de mettre à jour la notification.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const userId = Number(req.user?.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié.",
      });
    }

    const [result] = await pool.query(
      `
        UPDATE user_notifications
        SET is_read = 1
        WHERE user_id = ?
          AND is_read = 0
      `,
      [userId]
    );

    return res.status(200).json({
      success: true,
      message:
        "Toutes les notifications ont été marquées comme lues.",
      unreadCount: 0,
      updatedCount: Number(
        result.affectedRows || 0
      ),
    });
  } catch (error) {
    console.error(
      "Mark all notifications as read error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Impossible de mettre à jour les notifications.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

/*
 * Notifications de la Direction artistique.
 * Elles restent séparées des notifications
 * personnelles des membres.
 */

const ARTISTIC_ROLES = new Set([
  "ADMIN",
  "DIRECTION_ARTISTIQUE",
  "DIRECTION_ARTISTIQUE_SUPERVISEUR",
  "DIRECTION_ARTISTIQUE_ASSISTANT",
]);

function artisticRole(req) {
  return String(req.user?.role || "")
    .trim()
    .toUpperCase();
}

function getArtisticUserId(req, res) {
  const userId = Number(req.user?.id);

  if (!Number.isInteger(userId) || userId <= 0) {
    res.status(401).json({
      success: false,
      message: "Utilisateur non authentifié.",
    });

    return null;
  }

  if (!ARTISTIC_ROLES.has(artisticRole(req))) {
    res.status(403).json({
      success: false,
      message:
        "Accès réservé à la Direction artistique.",
    });

    return null;
  }

  return userId;
}

function isArtisticAssistant(req) {
  return (
    artisticRole(req) ===
    "DIRECTION_ARTISTIQUE_ASSISTANT"
  );
}

async function syncReservationDocumentNotifications(
  req,
  userId
) {
  const assistantCondition =
    isArtisticAssistant(req)
      ? "AND request.artistic_assigned_to = ?"
      : "";

  const values = [userId, userId];

  if (isArtisticAssistant(req)) {
    values.push(userId);
  }

  await pool.query(
    `
      INSERT IGNORE INTO artistic_notifications (
        user_id,
        source_type,
        source_id,
        document_id,
        notification_key,
        type,
        title,
        message,
        action_url,
        is_read,
        created_at
      )
      SELECT
        ?,
        'RESERVATION',
        request.id,
        document.id,
        CONCAT(
          'RESERVATION:DOCUMENT:',
          document.id,
          ':USER:',
          ?
        ),
        'RESERVATION_DOCUMENT',
        'Document de réservation à examiner',
        CONCAT(
          document.document_name,
          ' — ',
          COALESCE(
            request.reference,
            CONCAT(
              'Demande #',
              request.id
            )
          ),
          ' — ',
          COALESCE(
            NULLIF(
              request.title,
              ''
            ),
            'Réservation d’espace'
          )
        ),
        CONCAT(
          '/espace-membre/direction-artistique/demandes/',
          request.id
        ),
        0,
        COALESCE(
          document.uploaded_at,
          request.updated_at,
          CURRENT_TIMESTAMP
        )
      FROM space_requests AS request
      INNER JOIN space_request_documents
        AS document
        ON document.space_request_id =
          request.id
      WHERE request.status IN (
        'artistic_review',
        'artistic_initial_review',
        'artistic_final_review'
      )
        AND request.assigned_department =
          'DIRECTION_ARTISTIQUE'
        ${assistantCondition}
    `,
    values
  );
}

async function syncProjectNotifications(
  req,
  userId
) {
  const assistantCondition =
    isArtisticAssistant(req)
      ? "AND proposal.assigned_to_user_id = ?"
      : "";

  const proposalValues = [userId, userId];

  if (isArtisticAssistant(req)) {
    proposalValues.push(userId);
  }

  await pool.query(
    `
      INSERT IGNORE INTO artistic_notifications (
        user_id,
        source_type,
        source_id,
        document_id,
        notification_key,
        type,
        title,
        message,
        action_url,
        is_read,
        created_at
      )
      SELECT
        ?,
        'PROJECT_PROPOSAL',
        proposal.id,
        NULL,
        CONCAT(
          'PROJECT_PROPOSAL:SUBMISSION:',
          proposal.id,
          ':USER:',
          ?
        ),
        'PROJECT_PROPOSAL_RECEIVED',
        'Nouvelle proposition de projet',
        CONCAT(
          proposal.reference,
          ' — ',
          proposal.title,
          ' — ',
          proposal.category
        ),
        CONCAT(
          '/espace-membre/direction-artistique/projets/',
          proposal.id
        ),
        0,
        proposal.created_at
      FROM project_proposals AS proposal
      WHERE proposal.status IN (
        'SUBMITTED',
        'ASSIGNED',
        'ASSISTANT_REVIEW',
        'SUPERVISOR_REVIEW'
      )
        ${assistantCondition}
    `,
    proposalValues
  );

  const documentValues = [userId, userId];

  if (isArtisticAssistant(req)) {
    documentValues.push(userId);
  }

  await pool.query(
    `
      INSERT IGNORE INTO artistic_notifications (
        user_id,
        source_type,
        source_id,
        document_id,
        notification_key,
        type,
        title,
        message,
        action_url,
        is_read,
        created_at
      )
      SELECT
        ?,
        'PROJECT_PROPOSAL',
        proposal.id,
        document.id,
        CONCAT(
          'PROJECT_PROPOSAL:DOCUMENT:',
          document.id,
          ':USER:',
          ?
        ),
        'PROJECT_DOCUMENT',
        'Document de projet à examiner',
        CONCAT(
          document.document_name,
          ' — ',
          proposal.reference,
          ' — ',
          proposal.title
        ),
        CONCAT(
          '/espace-membre/direction-artistique/projets/',
          proposal.id
        ),
        0,
        document.created_at
      FROM project_proposals AS proposal
      INNER JOIN project_proposal_documents
        AS document
        ON document.project_proposal_id =
          proposal.id
      WHERE proposal.status IN (
        'SUBMITTED',
        'ASSIGNED',
        'ASSISTANT_REVIEW',
        'SUPERVISOR_REVIEW'
      )
        ${assistantCondition}
    `,
    documentValues
  );
}

async function syncArtisticNotifications(
  req,
  userId
) {
  await Promise.all([
    syncReservationDocumentNotifications(
      req,
      userId
    ),
    syncProjectNotifications(
      req,
      userId
    ),
  ]);
}

async function getArtisticUnreadCount(userId) {
  const [rows] = await pool.query(
    `
      SELECT
        COUNT(*) AS total,
        SUM(
          source_type = 'RESERVATION'
        ) AS reservations,
        SUM(
          source_type = 'PROJECT_PROPOSAL'
        ) AS projects
      FROM artistic_notifications
      WHERE user_id = ?
        AND is_read = 0
    `,
    [userId]
  );

  return {
    total: Number(
      rows[0]?.total || 0
    ),
    reservations: Number(
      rows[0]?.reservations || 0
    ),
    projects: Number(
      rows[0]?.projects || 0
    ),
  };
}

exports.getArtisticNotifications = async (
  req,
  res
) => {
  const userId = getArtisticUserId(req, res);

  if (!userId) {
    return;
  }

  const source = String(
    req.query.source || "ALL"
  )
    .trim()
    .toUpperCase();

  const values = [userId];
  let sourceCondition = "";

  if (
    [
      "RESERVATION",
      "PROJECT_PROPOSAL",
    ].includes(source)
  ) {
    sourceCondition =
      "AND source_type = ?";

    values.push(source);
  }

  try {
    await syncArtisticNotifications(
      req,
      userId
    );

    const [rows] = await pool.query(
      `
        SELECT
          id,
          source_type AS sourceType,
          source_id AS sourceId,
          document_id AS documentId,
          type,
          title,
          message,
          action_url AS actionUrl,
          is_read AS isRead,
          created_at AS createdAt
        FROM artistic_notifications
        WHERE user_id = ?
          ${sourceCondition}
        ORDER BY
          created_at DESC,
          id DESC
        LIMIT 150
      `,
      values
    );

    return res.status(200).json({
      success: true,
      unreadCount:
        await getArtisticUnreadCount(
          userId
        ),
      data: rows.map((row) => ({
        ...row,
        id: Number(row.id),
        sourceId: Number(
          row.sourceId
        ),
        documentId:
          row.documentId == null
            ? null
            : Number(
                row.documentId
              ),
        isRead: Boolean(
          row.isRead
        ),
      })),
    });
  } catch (error) {
    console.error(
      "Get artistic notifications error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Impossible de charger les notifications artistiques.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

exports.markArtisticAsRead = async (
  req,
  res
) => {
  const userId = getArtisticUserId(req, res);

  if (!userId) {
    return;
  }

  const notificationId = Number(
    req.params.notificationId
  );

  if (
    !Number.isInteger(notificationId) ||
    notificationId <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Notification invalide.",
    });
  }

  try {
    const [result] = await pool.query(
      `
        UPDATE artistic_notifications
        SET is_read = 1
        WHERE id = ?
          AND user_id = ?
      `,
      [notificationId, userId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message:
          "Notification introuvable.",
      });
    }

    return res.status(200).json({
      success: true,
      unreadCount:
        await getArtisticUnreadCount(
          userId
        ),
    });
  } catch (error) {
    console.error(
      "Mark artistic notification error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Impossible de mettre à jour la notification.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

exports.markAllArtisticAsRead = async (
  req,
  res
) => {
  const userId = getArtisticUserId(req, res);

  if (!userId) {
    return;
  }

  const source = String(
    req.body?.source || "ALL"
  )
    .trim()
    .toUpperCase();

  const values = [userId];
  let sourceCondition = "";

  if (
    [
      "RESERVATION",
      "PROJECT_PROPOSAL",
    ].includes(source)
  ) {
    sourceCondition =
      "AND source_type = ?";

    values.push(source);
  }

  try {
    await pool.query(
      `
        UPDATE artistic_notifications
        SET is_read = 1
        WHERE user_id = ?
          AND is_read = 0
          ${sourceCondition}
      `,
      values
    );

    return res.status(200).json({
      success: true,
      unreadCount:
        await getArtisticUnreadCount(
          userId
        ),
    });
  } catch (error) {
    console.error(
      "Mark all artistic notifications error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Impossible de mettre à jour les notifications.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};