require("dotenv").config();

const crypto = require("crypto");
const bcrypt = require("bcrypt");
const pool = require("./config/db");

// Les identifiants ne sont plus codés en dur : ils viennent de l'environnement.
// Usage : SEED_EMAIL=... SEED_FIRST_NAME=... SEED_LAST_NAME=... SEED_PHONE=... SEED_ROLE=DG node createUser.js
// Sans SEED_PASSWORD, un mot de passe aléatoire est généré et affiché une seule fois.
function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`❌ Variable ${name} manquante.`);
    process.exit(1);
  }
  return value;
}

const createUser = async () => {
  let connection;

  try {
    connection = await pool.getConnection();

    const email = requireEnv("SEED_EMAIL");
    const password =
      process.env.SEED_PASSWORD ||
      crypto.randomBytes(12).toString("base64url");
    const firstName = requireEnv("SEED_FIRST_NAME");
    const lastName = requireEnv("SEED_LAST_NAME");
    const phone = process.env.SEED_PHONE || null;
    const role = requireEnv("SEED_ROLE");

    const normalizedEmail = email.trim().toLowerCase();

    const [existingUsers] = await connection.query(
      "SELECT id FROM users WHERE LOWER(TRIM(email)) = ?",
      [normalizedEmail]
    );

    if (existingUsers.length > 0) {
      console.log("❌ Cet utilisateur existe déjà.");
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await connection.query(
      `
      INSERT INTO users (
        email,
        password_hash,
        first_name,
        last_name,
        phone,
        role,
        email_verified
      )
      VALUES (?, ?, ?, ?, ?, ?, 1)
      `,
      [
        normalizedEmail,
        passwordHash,
        firstName,
        lastName,
        phone,
        role,
      ]
    );

    console.log("✅ Utilisateur créé avec succès");
    console.log("ID :", result.insertId);
    console.log("Email :", normalizedEmail);
    console.log("Mot de passe :", password);
    console.log("Rôle :", role);
  } catch (error) {
    console.error("❌ Erreur lors de la création :", error);
  } finally {
    if (connection) {
      connection.release();
    }

    await pool.end();
  }
};

createUser();