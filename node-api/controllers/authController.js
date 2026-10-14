const pool = require("../config/db");

const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");

const crypto = require("crypto");

const { validationResult } = require("express-validator");

const { sendEmail } = require("../utils/mailer");

const { OAuth2Client } = require("google-auth-library");



function normalizeEmail(value) {

  return String(value || "")

    .trim()

    .toLowerCase();

}

const INTERNAL_EMAIL_DOMAIN = "centreculturel.cd";

const INTERNAL_ROLES = new Set([
  "ADMIN",
  "SUPERVISEUR",
  "DG",
  "PROGRAMME_SUPERVISEUR",
  "PROGRAMME_ASSISTANT",
  "REGISSEUR_GENERAL",
  "DIRECTION_ARTISTIQUE_SUPERVISEUR",
  "DIRECTION_ARTISTIQUE_ASSISTANT",
  "COMMUNICATION",
  "JURIDIQUE_SUPERVISEUR",
  "JURIDIQUE_ASSISTANT",
  "FINANCE",
]);

function isInternalEmail(value) {
  const normalizedEmail = normalizeEmail(value);
  const separatorIndex = normalizedEmail.lastIndexOf("@");

  if (
    separatorIndex <= 0 ||
    separatorIndex === normalizedEmail.length - 1
  ) {
    return false;
  }

  return (
    normalizedEmail.slice(separatorIndex + 1) ===
    INTERNAL_EMAIL_DOMAIN
  );
}

function createToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET_MISSING");
  }

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || "7d",
    }
  );
}

function serializeUser(user) {
  return {
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    phone: user.phone,
    role: user.role,
    email_verified: user.email_verified,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

function getGoogleClientId() {
  return String(process.env.GOOGLE_CLIENT_ID || "").trim();
}

async function findGoogleUser(googleSub, email) {
  const [users] = await pool.query(
    `
      SELECT
        id,
        email,
        password_hash,
        first_name,
        last_name,
        phone,
        role,
        email_verified,
        google_sub,
        created_at,
        updated_at
      FROM users
      WHERE google_sub = ?
         OR LOWER(TRIM(email)) = ?
      ORDER BY (google_sub = ?) DESC
      LIMIT 1
    `,
    [googleSub, email, googleSub]
  );

  return users[0] || null;
}

// =============================================================================
// GOOGLE LOGIN PUBLIC - membres uniquement, sans Better Auth
// =============================================================================

const googleLogin = async (req, res) => {
  const credential = String(
    req.body?.credential || ""
  ).trim();

  if (!credential) {
    return res.status(400).json({
      success: false,
      message: "Jeton Google manquant.",
    });
  }

  const googleClientId = getGoogleClientId();

  if (!googleClientId) {
    console.error("GOOGLE_CLIENT_ID is missing");

    return res.status(500).json({
      success: false,
      message:
        "La connexion Google n'est pas configurée sur le serveur.",
    });
  }

  try {
    const googleClient = new OAuth2Client(
      googleClientId
    );
    let payload;

    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: googleClientId,
      });

      payload = ticket.getPayload();
    } catch (verificationError) {
      console.warn(
        "Google credential verification failed:",
        verificationError?.message || verificationError
      );

      return res.status(401).json({
        success: false,
        message:
          "Le jeton Google est invalide ou expiré. Veuillez réessayer.",
      });
    }

    const googleSub = String(payload?.sub || "").trim();
    const email = normalizeEmail(payload?.email);

    if (
      !googleSub ||
      !email ||
      payload?.email_verified !== true
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Le compte Google n'a pas pu être vérifié.",
      });
    }

    if (isInternalEmail(email)) {
      return res.status(403).json({
        success: false,
        message:
          "Les comptes @centreculturel.cd doivent utiliser le portail interne de l'équipe CCAPAC.",
        internalLoginUrl:
          "/auth/equipe-validation-7d2f9a4c81",
      });
    }

    let user = await findGoogleUser(
      googleSub,
      email
    );

    if (user) {
      const normalizedRole = String(user.role || "")
        .trim()
        .toUpperCase();

      if (normalizedRole !== "MEMBER") {
        return res.status(403).json({
          success: false,
          message:
            "Cette connexion est réservée aux membres. Utilisez le portail interne de l'équipe CCAPAC.",
          internalLoginUrl:
            "/auth/equipe-validation-7d2f9a4c81",
        });
      }

      if (
        user.google_sub &&
        user.google_sub !== googleSub
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Cette adresse email est déjà associée à un autre compte Google.",
        });
      }

      await pool.query(
        `
          UPDATE users
          SET
            google_sub = COALESCE(google_sub, ?),
            email_verified = 1,
            updated_at = NOW()
          WHERE id = ?
        `,
        [googleSub, user.id]
      );
    } else {
      const firstName = String(
        payload?.given_name ||
          payload?.name ||
          "Membre"
      )
        .trim()
        .slice(0, 100);

      const lastName = String(
        payload?.family_name || "Google"
      )
        .trim()
        .slice(0, 100);

      /*
       * Le schéma actuel exige password_hash. Le compte Google reçoit donc
       * une valeur aléatoire impossible à connaître. Il pourra toujours
       * définir un mot de passe plus tard via « Mot de passe oublié ».
       */
      const generatedPassword =
        crypto.randomBytes(48).toString("hex");

      const passwordHash = await bcrypt.hash(
        generatedPassword,
        10
      );

      try {
        const [result] = await pool.query(
          `
            INSERT INTO users (
              email,
              password_hash,
              first_name,
              last_name,
              phone,
              role,
              email_verified,
              google_sub
            )
            VALUES (?, ?, ?, ?, NULL, 'MEMBER', 1, ?)
          `,
          [
            email,
            passwordHash,
            firstName || "Membre",
            lastName || "Google",
            googleSub,
          ]
        );

        const [createdUsers] = await pool.query(
          `
            SELECT
              id,
              email,
              password_hash,
              first_name,
              last_name,
              phone,
              role,
              email_verified,
              google_sub,
              created_at,
              updated_at
            FROM users
            WHERE id = ?
            LIMIT 1
          `,
          [result.insertId]
        );

        user = createdUsers[0] || null;
      } catch (insertError) {
        if (insertError?.code !== "ER_DUP_ENTRY") {
          throw insertError;
        }

        user = await findGoogleUser(
          googleSub,
          email
        );
      }
    }

    user = await findGoogleUser(
      googleSub,
      email
    );

    if (!user) {
      throw new Error("GOOGLE_USER_NOT_FOUND_AFTER_UPSERT");
    }

    if (
      String(user.role || "")
        .trim()
        .toUpperCase() !== "MEMBER"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Cette connexion est réservée aux membres.",
      });
    }

    const token = createToken(user);

    return res.status(200).json({
      success: true,
      message: "Connexion Google réussie",
      token,
      user: serializeUser(user),
    });
  } catch (error) {
    console.error("Google login error:", error);

    if (
      error?.code === "ER_BAD_FIELD_ERROR" &&
      String(error?.message || "").includes("google_sub")
    ) {
      return res.status(500).json({
        success: false,
        message:
          "La migration Google n'a pas encore été appliquée à la base de données.",
      });
    }

    if (error?.message === "JWT_SECRET_MISSING") {
      return res.status(500).json({
        success: false,
        message:
          "Configuration JWT manquante sur le serveur.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Impossible de finaliser la connexion Google.",
    });
  }
};



// =============================================================================

// REGISTER – envoie un email de vérification

// =============================================================================

const register = async (req, res) => {

  try {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {

      return res.status(400).json({ success: false, errors: errors.array() });

    }



    const {

      email,

      password,

      first_name,

      last_name,

      phone,

    } = req.body;



    const normalizedEmail =

      normalizeEmail(email);



    // Vérifier si l'email existe déjà

    const [existing] = await pool.query(

      `

        SELECT id

        FROM users

        WHERE LOWER(TRIM(email)) = ?

        LIMIT 1

      `,

      [normalizedEmail]

    );



    if (existing.length > 0) {

      return res.status(409).json({ success: false, message: "Cet email est déjà utilisé" });

    }



    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(password, salt);



    // Insérer l'utilisateur (rôle par défaut : 'MEMBER')

    const [result] = await pool.query(

      `INSERT INTO users (email, password_hash, first_name, last_name, phone, role, email_verified)

       VALUES (?, ?, ?, ?, ?, 'MEMBER', 0)`,

      [

        normalizedEmail,

        hashedPassword,

        String(first_name).trim(),

        String(last_name).trim(),

        String(phone || "").trim() ||

          null,

      ]

    );



    // Générer un token de vérification

    const token = crypto.randomBytes(64).toString('hex');

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h



    await pool.query(

      `INSERT INTO verification_tokens (user_id, token, type, expires_at)

       VALUES (?, ?, 'email_verification', ?)`,

      [result.insertId, token, expiresAt]

    );



    // Envoyer l'email de vérification

    const verificationUrl = `${process.env.FRONTEND_URL}/auth/verify-email?token=${token}`;

    let emailSent = false;



try {

  await sendEmail({

    to: normalizedEmail,



    subject:

      "Vérifiez votre adresse email - CCAPAC",



    text: `

Bienvenue ${first_name} !



Veuillez vérifier votre adresse email en ouvrant ce lien :



${verificationUrl}



Ce lien est valable pendant 24 heures.

    `.trim(),



    html: `

      <div style="font-family: Arial, sans-serif; line-height: 1.6;">

        <h2>Bienvenue ${first_name} !</h2>



        <p>

          Merci de vous être inscrit sur la plateforme CCAPAC.

        </p>



        <p>

          Cliquez sur le bouton ci-dessous pour vérifier votre adresse email.

        </p>



        <p>

          <a

            href="${verificationUrl}"

            style="

              display: inline-block;

              padding: 12px 20px;

              color: #ffffff;

              background: #D1965B;

              text-decoration: none;

              border-radius: 8px;

            "

          >

            Vérifier mon adresse email

          </a>

        </p>



        <p>

          Ce lien est valable pendant 24 heures.

        </p>

      </div>

    `,

  });



  emailSent = true;

} catch (emailError) {

  console.error(

    "Compte créé, mais email non envoyé :",

    {

      message: emailError.message,

      code: emailError.code,

      command: emailError.command,

    }

  );

}



return res.status(201).json({

  success: true,

  emailSent,



  message: emailSent

    ? "Compte créé. Un email de vérification vous a été envoyé."

    : "Compte créé, mais l’email de vérification n’a pas pu être envoyé. Utilisez le bouton de renvoi.",

});

  } catch (error) {

    console.error("Register error:", error);

    res.status(500).json({ success: false, message: "Erreur lors de l'inscription" });

  }

};



// =============================================================================

// VERIFY EMAIL

// =============================================================================

const verifyEmail = async (req, res) => {

  const { token } = req.query;

  if (!token) {

    return res.status(400).json({ success: false, message: "Token manquant" });

  }



  try {

    const [rows] = await pool.query(

      `SELECT vt.user_id, vt.expires_at, u.email

       FROM verification_tokens vt

       JOIN users u ON vt.user_id = u.id

       WHERE vt.token = ? AND vt.type = 'email_verification'`,

      [token]

    );



    if (rows.length === 0) {

      return res.status(400).json({ success: false, message: "Token invalide ou expiré" });

    }



    const { user_id, expires_at } = rows[0];

    if (new Date() > new Date(expires_at)) {

      return res.status(400).json({ success: false, message: "Token expiré" });

    }



    await pool.query("UPDATE users SET email_verified = 1 WHERE id = ?", [user_id]);

    await pool.query("DELETE FROM verification_tokens WHERE user_id = ? AND type = 'email_verification'", [user_id]);



    res.json({ success: true, message: "Email vérifié avec succès. Vous pouvez maintenant vous connecter." });

  } catch (error) {

    console.error("Verify email error:", error);

    res.status(500).json({ success: false, message: "Erreur lors de la vérification" });

  }

};



// =============================================================================

// RESEND VERIFICATION EMAIL

// =============================================================================

const resendVerification = async (req, res) => {

  const { email } = req.body;

  if (!email) return res.status(400).json({ success: false, message: "Email requis" });



  try {

    const [users] = await pool.query("SELECT id, first_name, email_verified FROM users WHERE email = ?", [email]);

    if (users.length === 0) {

      return res.status(404).json({ success: false, message: "Aucun utilisateur avec cet email" });

    }



    const user = users[0];

    if (user.email_verified) {

      return res.status(400).json({ success: false, message: "Email déjà vérifié" });

    }



    // Supprimer les anciens tokens

    await pool.query("DELETE FROM verification_tokens WHERE user_id = ? AND type = 'email_verification'", [user.id]);



    const token = crypto.randomBytes(64).toString('hex');

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);



    await pool.query(

      `INSERT INTO verification_tokens (user_id, token, type, expires_at) VALUES (?, ?, 'email_verification', ?)`,

      [user.id, token, expiresAt]

    );



    const verificationUrl = `${process.env.FRONTEND_URL}/auth/verify-email?token=${token}`;

    await sendEmail({

      to: email,

      subject: 'Vérification de votre email - CCAPAC',

      html: `

        <p>Bonjour ${user.first_name},</p>

        <p>Cliquez sur le lien ci-dessous pour vérifier votre adresse email :</p>

        <a href="${verificationUrl}">Vérifier mon email</a>

        <p>Ce lien est valable 24h.</p>

      `

    });



    res.json({ success: true, message: "Un nouveau lien de vérification a été envoyé." });

  } catch (error) {

    console.error("Resend verification error:", error);

    res.status(500).json({ success: false, message: "Erreur lors de l'envoi" });

  }

};



// =============================================================================

// LOGIN – vérifie email_verified

// =============================================================================

const login = async (req, res) => {

  try {

    const errors = validationResult(req);



    if (!errors.isEmpty()) {

      return res.status(400).json({

        success: false,

        message: "Données de connexion invalides",

        errors: errors.array(),

      });

    }



    let { email, password } = req.body;



    if (!email || !password) {

      return res.status(400).json({

        success: false,

        message: "Email et mot de passe requis",

      });

    }



    email = email.trim().toLowerCase();



    const [users] = await pool.query(

      `

      SELECT

        id,

        email,

        password_hash,

        first_name,

        last_name,

        phone,

        role,

        email_verified,

        created_at,

        updated_at

      FROM users

      WHERE LOWER(TRIM(email)) = ?

      LIMIT 1

      `,

      [email]

    );



    if (users.length === 0) {

      return res.status(401).json({

        success: false,

        message: "Email ou mot de passe incorrect",

      });

    }



    const user = users[0];



    if (!user.password_hash) {

      return res.status(401).json({

        success: false,

        message:

          "Ce compte ne possède pas de mot de passe valide. Veuillez réinitialiser le mot de passe.",

      });

    }



    let validPassword = false;



    try {

      validPassword = await bcrypt.compare(password, user.password_hash);

    } catch (bcryptError) {

      console.error("Bcrypt compare error:", bcryptError);



      return res.status(401).json({

        success: false,

        message:

          "Le mot de passe enregistré pour ce compte est invalide. Veuillez le réinitialiser.",

      });

    }



    if (!validPassword) {

      return res.status(401).json({

        success: false,

        message: "Email ou mot de passe incorrect",

      });

    }

    if (
      String(user.role || "")
        .trim()
        .toUpperCase() !== "MEMBER"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Cette connexion est réservée aux membres. Utilisez le portail interne de l'équipe CCAPAC.",
        internalLoginUrl:
          "/auth/equipe-validation-7d2f9a4c81",
      });
    }



    if (!user.email_verified) {

      return res.status(403).json({

        success: false,

        message:

          "Veuillez vérifier votre adresse email avant de vous connecter.",

        needsVerification: true,

        email: user.email,

      });

    }



    if (!process.env.JWT_SECRET) {

      console.error("JWT_SECRET is missing");



      return res.status(500).json({

        success: false,

        message: "Configuration JWT manquante sur le serveur",

      });

    }



    const token = jwt.sign(

      {

        id: user.id,

        email: user.email,

        role: user.role,

      },

      process.env.JWT_SECRET,

      {

        expiresIn: process.env.JWT_EXPIRE || "7d",

      }

    );



    const userData = {

      id: user.id,

      email: user.email,

      first_name: user.first_name,

      last_name: user.last_name,

      phone: user.phone,

      role: user.role,

      email_verified: user.email_verified,

      created_at: user.created_at,

      updated_at: user.updated_at,

    };



    return res.status(200).json({

      success: true,

      message: "Connexion réussie",

      token,

      user: userData,

    });

  } catch (error) {

    console.error("Login error:", error);



    return res.status(500).json({

      success: false,

      message: "Erreur lors de la connexion",

    });

  }

};

// =============================================================================
// REGISTER INTERNE – domaine CCAPAC uniquement, compte en attente de rôle
// =============================================================================

const internalRegister = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Données d'inscription invalides",
        errors: errors.array(),
      });
    }

    const {
      email,
      password,
      first_name,
      last_name,
      phone,
    } = req.body;

    const normalizedEmail = normalizeEmail(email);

    if (!isInternalEmail(normalizedEmail)) {
      return res.status(403).json({
        success: false,
        message:
          "L'inscription interne est réservée aux adresses @centreculturel.cd.",
      });
    }

    const [existing] = await pool.query(
      `
        SELECT id
        FROM users
        WHERE LOWER(TRIM(email)) = ?
        LIMIT 1
      `,
      [normalizedEmail]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Cet email est déjà utilisé",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(
      password,
      salt
    );

    /*
     * MEMBER sert ici de rôle temporaire.
     * La connexion interne reste impossible jusqu'à ce qu'un administrateur
     * attribue un rôle présent dans INTERNAL_ROLES.
     */
    const [result] = await pool.query(
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
        VALUES (?, ?, ?, ?, ?, 'MEMBER', 0)
      `,
      [
        normalizedEmail,
        hashedPassword,
        String(first_name).trim(),
        String(last_name).trim(),
        String(phone || "").trim() || null,
      ]
    );

    const token = crypto.randomBytes(64).toString("hex");
    const expiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    );

    await pool.query(
      `
        INSERT INTO verification_tokens (
          user_id,
          token,
          type,
          expires_at
        )
        VALUES (?, ?, 'email_verification', ?)
      `,
      [result.insertId, token, expiresAt]
    );

    const verificationUrl =
      `${process.env.FRONTEND_URL}/auth/verify-email?token=${token}`;

    let emailSent = false;

    try {
      await sendEmail({
        to: normalizedEmail,
        subject:
          "Vérifiez votre compte interne - CCAPAC",
        text: `
Bonjour ${first_name},

Veuillez vérifier votre adresse professionnelle en ouvrant ce lien :
${verificationUrl}

Après la vérification, un administrateur devra attribuer votre rôle avant votre première connexion interne.
Ce lien est valable pendant 24 heures.
        `.trim(),
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Bienvenue ${first_name}</h2>
            <p>
              Veuillez vérifier votre adresse professionnelle CCAPAC.
            </p>
            <p>
              <a
                href="${verificationUrl}"
                style="display:inline-block;padding:12px 20px;color:#ffffff;background:#D1965B;text-decoration:none;border-radius:8px;"
              >
                Vérifier mon adresse email
              </a>
            </p>
            <p>
              Après la vérification, un administrateur devra attribuer votre rôle avant votre première connexion interne.
            </p>
            <p>Ce lien est valable pendant 24 heures.</p>
          </div>
        `,
      });

      emailSent = true;
    } catch (emailError) {
      console.error(
        "Compte interne créé, mais email non envoyé :",
        emailError
      );
    }

    return res.status(201).json({
      success: true,
      emailSent,
      pendingApproval: true,
      message: emailSent
        ? "Compte créé. Vérifiez votre email, puis attendez l'attribution de votre rôle par un administrateur."
        : "Compte créé. L'email de vérification n'a pas pu être envoyé. Utilisez le renvoi de vérification, puis attendez l'attribution de votre rôle.",
    });
  } catch (error) {
    console.error("Internal register error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Erreur lors de la création du compte interne",
    });
  }
};

// =============================================================================
// LOGIN INTERNE – domaine CCAPAC + rôle attribué par un administrateur
// =============================================================================

const internalLogin = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Données de connexion invalides",
        errors: errors.array(),
      });
    }

    const normalizedEmail = normalizeEmail(
      req.body.email
    );
    const password = String(req.body.password || "");

    if (!isInternalEmail(normalizedEmail)) {
      return res.status(403).json({
        success: false,
        message:
          "La connexion interne est réservée aux adresses @centreculturel.cd.",
      });
    }

    const [users] = await pool.query(
      `
        SELECT
          id,
          email,
          password_hash,
          first_name,
          last_name,
          phone,
          role,
          email_verified,
          created_at,
          updated_at
        FROM users
        WHERE LOWER(TRIM(email)) = ?
        LIMIT 1
      `,
      [normalizedEmail]
    );

    const user = users[0];

    if (
      !user ||
      !user.password_hash ||
      !(await bcrypt.compare(password, user.password_hash))
    ) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect",
      });
    }

    if (!user.email_verified) {
      return res.status(403).json({
        success: false,
        message:
          "Veuillez vérifier votre adresse email avant de vous connecter.",
        needsVerification: true,
        email: user.email,
      });
    }

    if (!INTERNAL_ROLES.has(user.role)) {
      return res.status(403).json({
        success: false,
        pendingApproval: true,
        message:
          "Votre compte est en attente. Un administrateur doit encore vous attribuer un rôle interne.",
      });
    }

    const token = createToken(user);

    return res.status(200).json({
      success: true,
      message: "Connexion interne réussie",
      token,
      user: serializeUser(user),
    });
  } catch (error) {
    console.error("Internal login error:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la connexion interne",
    });
  }
};



// =============================================================================

// GET PROFILE

// =============================================================================

const getProfile = async (req, res) => {

  try {

    const [users] = await pool.query(

      `SELECT id, email, first_name, last_name, phone, role, email_verified, created_at

       FROM users WHERE id = ?`,

      [req.user.id]

    );



    if (users.length === 0) {

      return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });

    }



    res.json({ success: true, user: users[0] });

  } catch (error) {

    console.error("Get profile error:", error);

    res.status(500).json({ success: false, message: "Erreur lors du chargement du profil" });

  }

};



// =============================================================================

// UPDATE PROFILE

// =============================================================================

const updateProfile = async (req, res) => {

  try {

    const { first_name, last_name, phone } = req.body;

    const userId = req.user.id;



    await pool.query(

      `UPDATE users SET first_name = ?, last_name = ?, phone = ? WHERE id = ?`,

      [first_name, last_name, phone, userId]

    );



    const [users] = await pool.query(

      `SELECT id, email, first_name, last_name, phone, role, email_verified, created_at

       FROM users WHERE id = ?`,

      [userId]

    );



    res.json({ success: true, message: "Profil mis à jour", user: users[0] });

  } catch (error) {

    console.error("Update profile error:", error);

    res.status(500).json({ success: false, message: "Erreur lors de la mise à jour" });

  }

};



// =============================================================================

// CHANGE PASSWORD

// =============================================================================

const changePassword = async (req, res) => {

  try {

    const { current_password, new_password } = req.body;

    const userId = req.user.id;



    const [users] = await pool.query("SELECT password_hash FROM users WHERE id = ?", [userId]);

    if (users.length === 0) {

      return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });

    }



    const valid = await bcrypt.compare(current_password, users[0].password_hash);

    if (!valid) {

      return res.status(401).json({ success: false, message: "Mot de passe actuel incorrect" });

    }



    const salt = await bcrypt.genSalt(10);

    const hashed = await bcrypt.hash(new_password, salt);



    await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [hashed, userId]);



    res.json({ success: true, message: "Mot de passe modifié avec succès" });

  } catch (error) {

    console.error("Change password error:", error);

    res.status(500).json({ success: false, message: "Erreur lors du changement de mot de passe" });

  }

};



// =============================================================================

// FORGOT PASSWORD – envoie un lien de réinitialisation

// =============================================================================

const forgotPassword = async (req, res) => {

  const { email } = req.body;

  if (!email) return res.status(400).json({ success: false, message: "Email requis" });



  try {

    const [users] = await pool.query("SELECT id, email, first_name FROM users WHERE email = ?", [email]);

    if (users.length === 0) {

      return res.status(404).json({ success: false, message: "Aucun utilisateur avec cet email" });

    }



    const user = users[0];

    const token = crypto.randomBytes(64).toString('hex');

    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1h



    await pool.query(

      `INSERT INTO verification_tokens (user_id, token, type, expires_at) VALUES (?, ?, 'password_reset', ?)`,

      [user.id, token, expiresAt]

    );



    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`;

    await sendEmail({

      to: email,

      subject: 'Réinitialisation de votre mot de passe - CCAPAC',

      html: `

        <p>Bonjour ${user.first_name},</p>

        <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>

        <p>Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :</p>

        <a href="${resetUrl}">Réinitialiser mon mot de passe</a>

        <p>Ce lien est valable 1 heure.</p>

      `

    });



    res.json({ success: true, message: "Un email de réinitialisation vous a été envoyé." });

  } catch (error) {

    console.error("Forgot password error:", error);

    res.status(500).json({ success: false, message: "Erreur lors de l'envoi" });

  }

};



// =============================================================================

// RESET PASSWORD

// =============================================================================

const resetPassword = async (req, res) => {

  const { token, new_password } = req.body;

  if (!token || !new_password) {

    return res.status(400).json({ success: false, message: "Token et nouveau mot de passe requis" });

  }



  try {

    const [rows] = await pool.query(

      `SELECT user_id, expires_at FROM verification_tokens WHERE token = ? AND type = 'password_reset'`,

      [token]

    );



    if (rows.length === 0) {

      return res.status(400).json({ success: false, message: "Token invalide ou expiré" });

    }



    if (new Date() > new Date(rows[0].expires_at)) {

      return res.status(400).json({ success: false, message: "Token expiré" });

    }



    const salt = await bcrypt.genSalt(10);

    const hashed = await bcrypt.hash(new_password, salt);



    await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [hashed, rows[0].user_id]);

    await pool.query("DELETE FROM verification_tokens WHERE user_id = ? AND type = 'password_reset'", [rows[0].user_id]);



    res.json({ success: true, message: "Mot de passe mis à jour avec succès." });

  } catch (error) {

    console.error("Reset password error:", error);

    res.status(500).json({ success: false, message: "Erreur lors de la réinitialisation" });

  }

};



// =============================================================================

// ADMIN – CREATE USER (avec rôle personnalisé)

// =============================================================================

const adminCreateUser = async (req, res) => {

  try {

    const { email, password, first_name, last_name, phone, role } = req.body;



    const validRoles = ['MEMBER','PROGRAMME_SUPERVISEUR','PROGRAMME_ASSISTANT','REGISSEUR_GENERAL','DIRECTION_ARTISTIQUE_SUPERVISEUR','DIRECTION_ARTISTIQUE_ASSISTANT','COMMUNICATION','JURIDIQUE_SUPERVISEUR','JURIDIQUE_ASSISTANT','FINANCE','DG','SUPERVISEUR','ADMIN'];

    if (!validRoles.includes(role)) {

      return res.status(400).json({ success: false, message: "Rôle invalide" });

    }



    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);

    if (existing.length > 0) {

      return res.status(409).json({ success: false, message: "Cet email est déjà utilisé" });

    }



    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(password, salt);



    const [result] = await pool.query(

      `INSERT INTO users (email, password_hash, first_name, last_name, phone, role, email_verified)

       VALUES (?, ?, ?, ?, ?, ?, 1)`,

      [email, hashedPassword, first_name, last_name, phone || null, role]

    );



    res.status(201).json({ success: true, message: "Utilisateur créé", id: result.insertId });

  } catch (error) {

    console.error("Admin create user error:", error);

    res.status(500).json({ success: false, message: "Erreur serveur" });

  }

};



module.exports = {

  register,

  internalRegister,

  verifyEmail,

  resendVerification,

  login,

  googleLogin,

  internalLogin,

  getProfile,

  updateProfile,

  changePassword,

  forgotPassword,

  resetPassword,

  adminCreateUser

};
