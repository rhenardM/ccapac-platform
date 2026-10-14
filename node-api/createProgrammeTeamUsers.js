require("dotenv").config();

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const pool = require("./config/db");

// La liste des comptes n'est plus versionnée. Usage :
//   node createProgrammeTeamUsers.js ./programme-team.json
// Fichier JSON : [{ "email", "firstName", "lastName", "phone", "role", "password"? }]
// Sans "password", un mot de passe aléatoire est généré et affiché une seule fois.
const usersFile = process.argv[2];
if (!usersFile) {
  console.error("Usage : node createProgrammeTeamUsers.js <fichier.json>");
  process.exit(1);
}
const users = JSON.parse(
  fs.readFileSync(path.resolve(usersFile), "utf8")
).map((user) => ({
  ...user,
  password:
    user.password || crypto.randomBytes(12).toString("base64url"),
}));

async function createProgrammeTeam() {
  let connection;

  try {
    connection = await pool.getConnection();

    for (const user of users) {
      const email = user.email.trim().toLowerCase();

      const [existing] = await connection.query(
        "SELECT id FROM users WHERE LOWER(TRIM(email)) = ? LIMIT 1",
        [email]
      );

      if (existing.length > 0) {
        console.log(`Compte déjà présent : ${email}`);
        continue;
      }

      const passwordHash = await bcrypt.hash(
        user.password,
        10
      );

      await connection.query(
        `INSERT INTO users (
           email, password_hash, first_name, last_name,
           phone, role, email_verified
         ) VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [
          email,
          passwordHash,
          user.firstName,
          user.lastName,
          user.phone,
          user.role,
        ]
      );

      console.log(
        `Créé : ${email} | ${user.role} | ${user.password}`
      );
    }
  } catch (error) {
    console.error(
      "Erreur de création de l'équipe Programme :",
      error
    );
    process.exitCode = 1;
  } finally {
    connection?.release();
    await pool.end();
  }
}

void createProgrammeTeam();