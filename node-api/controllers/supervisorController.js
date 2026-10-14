const bcrypt = require("bcrypt");
const pool = require("../config/db");

const ALLOWED_ROLES = [
  "MEMBER",
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
  "SUPERVISEUR",
  "ADMIN",
];

function serializeUser(row) {
  return {
    id: row.id,
    email: row.email,
    first_name: row.first_name,
    last_name: row.last_name,
    phone: row.phone,
    role: row.role,
    email_verified: Boolean(
      row.email_verified
    ),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

exports.getUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        id,
        email,
        first_name,
        last_name,
        phone,
        role,
        email_verified,
        created_at,
        updated_at
      FROM users
      ORDER BY created_at DESC
    `);

    return res.json({
      success: true,
      data: rows.map(serializeUser),
    });
  } catch (error) {
    console.error(
      "Supervisor get users error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Impossible de charger les utilisateurs.",
    });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const role = String(
      req.body.role || ""
    )
      .trim()
      .toUpperCase();

    if (
      !Number.isInteger(userId) ||
      userId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Utilisateur invalide.",
      });
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Rôle invalide.",
      });
    }

    const [result] = await pool.query(
      `
        UPDATE users
        SET
          role = ?,
          updated_at =
            CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [role, userId]
    );

    if (result.affectedRows !== 1) {
      return res.status(404).json({
        success: false,
        message:
          "Utilisateur introuvable.",
      });
    }

    const [rows] = await pool.query(
      `
        SELECT
          id,
          email,
          first_name,
          last_name,
          phone,
          role,
          email_verified,
          created_at,
          updated_at
        FROM users
        WHERE id = ?
        LIMIT 1
      `,
      [userId]
    );

    return res.json({
      success: true,
      message:
        `Rôle ${role} attribué avec succès.`,
      data: serializeUser(rows[0]),
    });
  } catch (error) {
    console.error(
      "Supervisor update role error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Impossible de modifier le rôle.",
    });
  }
};

exports.resetPassword = async (
  req,
  res
) => {
  try {
    const userId = Number(req.params.id);
    const newPassword = String(
      req.body.new_password || ""
    );

    if (
      !Number.isInteger(userId) ||
      userId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Utilisateur invalide.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Le nouveau mot de passe doit contenir au moins 6 caractères.",
      });
    }

    const passwordHash =
      await bcrypt.hash(newPassword, 10);

    const [result] = await pool.query(
      `
        UPDATE users
        SET
          password_hash = ?,
          updated_at =
            CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [passwordHash, userId]
    );

    if (result.affectedRows !== 1) {
      return res.status(404).json({
        success: false,
        message:
          "Utilisateur introuvable.",
      });
    }

    return res.json({
      success: true,
      message:
        "Mot de passe réinitialisé avec succès.",
    });
  } catch (error) {
    console.error(
      "Supervisor reset password error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Impossible de réinitialiser le mot de passe.",
    });
  }
};

exports.deleteUser = async (req, res) => {
  let connection;

  try {
    const userId = Number(req.params.id);
    const currentUserId = Number(
      req.user.id
    );

    if (
      !Number.isInteger(userId) ||
      userId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Utilisateur invalide.",
      });
    }

    if (userId === currentUserId) {
      return res.status(409).json({
        success: false,
        message:
          "Vous ne pouvez pas supprimer votre propre compte.",
      });
    }

    connection =
      await pool.getConnection();
    await connection.beginTransaction();

    const [users] =
      await connection.query(
        `
          SELECT id, email
          FROM users
          WHERE id = ?
          FOR UPDATE
        `,
        [userId]
      );

    if (users.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message:
          "Utilisateur introuvable.",
      });
    }

    const [references] =
      await connection.query(
        `
          SELECT
            (
              SELECT COUNT(*)
              FROM space_requests
              WHERE
                user_id = ?
                OR assigned_to_user_id = ?
                OR artistic_assigned_to = ?
                OR legal_assigned_to = ?
            ) AS requests_count,
            (
              SELECT COUNT(*)
              FROM space_request_histories
              WHERE performed_by = ?
            ) AS histories_count,
            (
              SELECT COUNT(*)
              FROM space_request_documents
              WHERE uploaded_by = ?
            ) AS documents_count
        `,
        [
          userId,
          userId,
          userId,
          userId,
          userId,
          userId,
        ]
      );

    const used =
      Number(
        references[0].requests_count
      ) +
      Number(
        references[0].histories_count
      ) +
      Number(
        references[0].documents_count
      );

    if (used > 0) {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message:
          "Ce compte est lié à des demandes ou à un historique et ne peut pas être supprimé.",
      });
    }

    await connection.query(
      `
        DELETE FROM verification_tokens
        WHERE user_id = ?
      `,
      [userId]
    );

    await connection.query(
      "DELETE FROM users WHERE id = ?",
      [userId]
    );

    await connection.commit();

    return res.json({
      success: true,
      message:
        "Utilisateur supprimé définitivement.",
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error(
      "Supervisor delete user error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Impossible de supprimer l’utilisateur.",
    });
  } finally {
    connection?.release();
  }
};