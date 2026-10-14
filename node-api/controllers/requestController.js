const pool = require("../config/db");

// =============================================================================
// MEMBRE : CRUD sur ses propres demandes
// =============================================================================
exports.createRequest = async (req, res) => {
  try {
    const { title, description, desired_date } = req.body;
    const userId = req.user.id;

    const [result] = await pool.query(
      `INSERT INTO space_requests (user_id, title, description, desired_date, status, current_step)
       VALUES (?, ?, ?, ?, 'submitted', 'Soumis au Service Programmes')`,
      [userId, title, description, desired_date]
    );

    await pool.query(
      `INSERT INTO request_status_history (request_id, status, comment)
       VALUES (?, 'submitted', 'Demande soumise par le membre')`,
      [result.insertId]
    );

    res.status(201).json({ success: true, message: "Demande créée", id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

exports.getMyRequests = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM space_requests WHERE user_id = ? ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, requests: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

exports.getRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT * FROM space_requests WHERE id = ? AND user_id = ?`,
      [id, req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Demande non trouvée" });
    }

    const [history] = await pool.query(
      `SELECT * FROM request_status_history WHERE request_id = ? ORDER BY created_at ASC`,
      [id]
    );

    res.json({ success: true, request: rows[0], history });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

exports.updateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, desired_date } = req.body;
    const userId = req.user.id;

    const [existing] = await pool.query(
      `SELECT status FROM space_requests WHERE id = ? AND user_id = ?`,
      [id, userId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Demande non trouvée" });
    }
    if (!['draft', 'submitted'].includes(existing[0].status)) {
      return res.status(400).json({ success: false, message: "Cette demande ne peut plus être modifiée" });
    }

    await pool.query(
      `UPDATE space_requests SET title = ?, description = ?, desired_date = ? WHERE id = ?`,
      [title, description, desired_date, id]
    );

    res.json({ success: true, message: "Demande mise à jour" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

exports.deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [existing] = await pool.query(
      `SELECT status FROM space_requests WHERE id = ? AND user_id = ?`,
      [id, userId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Demande non trouvée" });
    }
    if (!['draft', 'submitted'].includes(existing[0].status)) {
      return res.status(400).json({ success: false, message: "Cette demande ne peut pas être supprimée" });
    }

    await pool.query(`DELETE FROM space_requests WHERE id = ?`, [id]);
    res.json({ success: true, message: "Demande supprimée" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// =============================================================================
// ADMIN / SERVICES : gestion du workflow
// =============================================================================
exports.getAllRequests = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, u.first_name, u.last_name, u.email as member_email
       FROM space_requests r
       JOIN users u ON r.user_id = u.id
       ORDER BY r.created_at DESC`
    );
    res.json({ success: true, requests: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment, assigned_department } = req.body;

    const validStatuses = [
      'submitted', 'program_review', 'general_review', 'artistic_review',
      'communication_review', 'awaiting_member_confirmation',
      'program_review_after_confirmation', 'legal_review',
      'program_review_after_legal', 'finance_cotation',
      'program_review_after_finance', 'completed'
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Statut invalide" });
    }

    const stepMap = {
      'submitted': 'Soumis au Service Programmes',
      'program_review': 'En cours au Service Programmes',
      'general_review': 'Régisseur général',
      'artistic_review': 'Direction artistique',
      'communication_review': 'Service Communication',
      'awaiting_member_confirmation': 'En attente de confirmation du sollicitant',
      'program_review_after_confirmation': 'Retour au Service Programmes',
      'legal_review': 'Service Juridique',
      'program_review_after_legal': 'Retour à la Direction des Programmes',
      'finance_cotation': 'Cotation – Finances',
      'program_review_after_finance': 'Retour à la Direction des Programmes',
      'completed': 'Demande finalisée'
    };
    const current_step = stepMap[status] || status;

    await pool.query(
      `UPDATE space_requests SET status = ?, current_step = ?, assigned_department = ? WHERE id = ?`,
      [status, current_step, assigned_department || null, id]
    );

    await pool.query(
      `INSERT INTO request_status_history (request_id, status, comment) VALUES (?, ?, ?)`,
      [id, status, comment || '']
    );

    res.json({ success: true, message: "Statut mis à jour" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};