import nodemailer from "nodemailer";

// =============================================================================
// CONFIGURATION
// =============================================================================

const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = process.env.SMTP_SECURE
  ? process.env.SMTP_SECURE === "true"
  : SMTP_PORT === 465;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === "production",
  },
  // Timeouts pour éviter les blocages
  // connectionTimeout: 10000, // 10 secondes
  // greetingTimeout: 10000,
  // socketTimeout: 10000,
});

const EMAIL_FROM =
  process.env.SMTP_FROM || `"CCAPAC" <${process.env.SMTP_USER}>`;
const BASE_URL = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

// =============================================================================
// EMAIL TEMPLATES
// =============================================================================

/**
 * Génère le layout de base pour tous les emails CCAPAC
 */
function baseEmailLayout(content: string): string {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9f9f9; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .header { text-align: center; margin-bottom: 40px; }
        .header img { height: 40px; width: auto; }
        .card { background-color: #ffffff; padding: 40px; border: 1px solid #e5e5e5; border-radius: 8px; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #999; }
        h1, h2 { color: #1a1a1a; margin-top: 0; }
        p { line-height: 1.6; margin-bottom: 20px; color: #4a4a4a; }
        .button { display: inline-block; background-color: #ffc107; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: 500; font-size: 14px; }
        .alt-link { margin-top: 30px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
        .alt-link a { color: #804423; text-decoration: none; word-break: break-all; }
      </style>
    </head>
    <body>
      <div class="container">
        
        <div class="header">
          <img src="${BASE_URL}/images/logo-primary.png" alt="CCAPAC" />
        </div>

        <div class="card">
          ${content}
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} CCAPAC. Tous droits réservés.<br>
          Kinshasa, République Démocratique du Congo</p>
        </div>

      </div>
    </body>
    </html>
  `;
}

/**
 * Génère un bouton CTA stylisé
 */
function ctaButton(url: string, text: string): string {
  return `
    <div style="margin: 30px 0;">
      <a href="${url}" class="button">
        ${text}
      </a>
    </div>
  `;
}

/**
 * Génère un bloc de lien alternatif
 */
function alternativeLink(url: string): string {
  return `
    <div class="alt-link">
      <p style="margin: 0;">Si le bouton ne fonctionne pas, copiez ce lien :</p>
      <a href="${url}">${url}</a>
    </div>
  `;
}

function escapeHtml(value: string | number | null | undefined): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDonationAmount(amount: number, currency: string): string {
  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 2,
  }).format(amount)} ${currency}`;
}

// =============================================================================
// EMAIL TEMPLATE GENERATORS
// =============================================================================

export const emailTemplates = {
  /**
   * Email de réinitialisation de mot de passe
   */
  passwordReset: (userName: string, resetUrl: string): string => {
    const content = `
      <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 24px;">Réinitialisation de mot de passe</h2>

      <p>Bonjour ${userName || "cher membre"},</p>

      <p>
        Nous avons reçu une demande de réinitialisation de votre mot de passe pour votre compte CCAPAC.
        Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité.
      </p>

      <p>Pour définir un nouveau mot de passe, veuillez cliquer sur le bouton ci-dessous :</p>

      ${ctaButton(resetUrl, "Réinitialiser mon mot de passe")}

      <p style="font-size: 13px; color: #666; margin-top: 20px;">
        Ce lien est valide pour une durée limitée de 1 heure.
      </p>

      ${alternativeLink(resetUrl)}
    `;
    return baseEmailLayout(content);
  },

  /**
   * Email de vérification d'adresse email
   */
  emailVerification: (userName: string, verificationUrl: string): string => {
    const content = `
      <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 24px;">Bienvenue au CCAPAC</h2>

      <p>Bonjour ${userName},</p>

      <p>
        Merci de vous être inscrit au Centre Culturel Pour les Pays d'Afrique Centrale (CCAPAC).
        Pour finaliser votre inscription et accéder à votre espace membre, veuillez vérifier votre adresse email.
      </p>

      <p>
        Cliquez sur le bouton ci-dessous pour vérifier votre adresse email :
      </p>

      ${ctaButton(verificationUrl, "Vérifier mon email")}

      <p style="font-size: 13px; color: #666; margin-top: 20px;">
        Ce lien de vérification est valable pendant 24 heures.
      </p>

      ${alternativeLink(verificationUrl)}
    `;
    return baseEmailLayout(content);
  },

  /**
   * Email de contact (formulaire de contact)
   */
  contactForm: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
  }): string => {
    const content = `
      <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 24px;">Nouveau message de contact</h2>

      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 4px; border: 1px solid #eee;">
        <p style="margin: 0 0 10px 0;"><strong>De :</strong> ${data.firstName} ${data.lastName}</p>
        <p style="margin: 0 0 10px 0;"><strong>Email :</strong> <a href="mailto:${data.email}" style="color: #804423; text-decoration: none;">${data.email}</a></p>
        <p style="margin: 0 0 10px 0;"><strong>Téléphone :</strong> ${data.phone}</p>
        <p style="margin: 0;"><strong>Sujet :</strong> ${data.subject}</p>
      </div>

      <div style="margin-top: 24px;">
        <p style="font-weight: 600; margin-bottom: 12px;">Message :</p>
        <p style="white-space: pre-wrap; background-color: #fff; padding: 15px; border-left: 3px solid #804423;">${data.message}</p>
      </div>
    `;
    return baseEmailLayout(content);
  },

  /**
   * Email de notification pour une suggestion membre
   */
  memberSuggestion: (data: {
    memberName: string;
    memberEmail: string;
    category: string;
    message: string;
    submittedAt: Date;
  }): string => {
    const submittedAt = data.submittedAt.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const content = `
      <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 24px;">Nouvelle suggestion membre</h2>

      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 4px; border: 1px solid #eee;">
        <p style="margin: 0 0 10px 0;"><strong>Membre :</strong> ${data.memberName}</p>
        <p style="margin: 0 0 10px 0;"><strong>Email :</strong> <a href="mailto:${data.memberEmail}" style="color: #804423; text-decoration: none;">${data.memberEmail}</a></p>
        <p style="margin: 0 0 10px 0;"><strong>Catégorie :</strong> ${data.category}</p>
        <p style="margin: 0;"><strong>Date :</strong> ${submittedAt}</p>
      </div>

      <div style="margin-top: 24px;">
        <p style="font-weight: 600; margin-bottom: 12px;">Message :</p>
        <p style="white-space: pre-wrap; background-color: #fff; padding: 15px; border-left: 3px solid #804423;">${data.message}</p>
      </div>

      ${ctaButton(`${BASE_URL}/espace-membre/admin/suggestions`, "Ouvrir les suggestions")}
    `;
    return baseEmailLayout(content);
  },

  fundraisingDonationSucceeded: (data: {
    donationId: string;
    donorName: string;
    donorEmail: string;
    donorPhone?: string | null;
    amount: number;
    currency: string;
    paymentMethod: string;
    succeededAt?: string | null;
  }): string => {
    const succeededAt = data.succeededAt
      ? new Date(data.succeededAt).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : new Date().toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

    const content = `
      <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 24px;">Nouveau don confirme</h2>

      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 4px; border: 1px solid #eee;">
        <p style="margin: 0 0 10px 0;"><strong>Montant :</strong> ${escapeHtml(formatDonationAmount(data.amount, data.currency))}</p>
        <p style="margin: 0 0 10px 0;"><strong>Moyen de paiement :</strong> ${escapeHtml(data.paymentMethod)}</p>
        <p style="margin: 0 0 10px 0;"><strong>Donateur :</strong> ${escapeHtml(data.donorName)}</p>
        <p style="margin: 0 0 10px 0;"><strong>Email :</strong> <a href="mailto:${escapeHtml(data.donorEmail)}" style="color: #804423; text-decoration: none;">${escapeHtml(data.donorEmail)}</a></p>
        ${data.donorPhone ? `<p style="margin: 0 0 10px 0;"><strong>Telephone :</strong> ${escapeHtml(data.donorPhone)}</p>` : ""}
        <p style="margin: 0 0 10px 0;"><strong>Date :</strong> ${escapeHtml(succeededAt)}</p>
        <p style="margin: 0;"><strong>Reference :</strong> ${escapeHtml(data.donationId)}</p>
      </div>
    `;

    return baseEmailLayout(content);
  },

  fundraisingDonorThankYou: (data: {
    donationId: string;
    donorName: string;
    amount: number;
    currency: string;
    signupUrl?: string;
  }): string => {
    const signupInvitation = data.signupUrl
      ? `
        <p>
          Vous pouvez également rejoindre le centre culturel pour suivre nos
          activités et accéder à votre espace membre.
        </p>
        ${ctaButton(data.signupUrl, "Créer mon compte")}
      `
      : "";

    const content = `
      <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 24px;">Merci pour votre soutien</h2>

      <p>Bonjour ${escapeHtml(data.donorName || "cher donateur")},</p>

      <p>
        Nous vous remercions pour votre contribution de
        <strong>${escapeHtml(formatDonationAmount(data.amount, data.currency))}</strong>.
        Votre soutien participe directement à nos actions culturelles.
      </p>

      <p style="font-size: 13px; color: #666;">
        Référence du don : ${escapeHtml(data.donationId)}
      </p>

      ${signupInvitation}
    `;

    return baseEmailLayout(content);
  },

  donationHonor: (data: {
    beneficiaryName: string;
    donorName: string;
    amount: number;
    currency: string;
    donorType: "relative" | "organization";
    message?: string;
  }): string => {
    const greeting =
      data.donorType === "organization"
        ? `Chère équipe de ${escapeHtml(data.beneficiaryName)},`
        : `Bonjour ${escapeHtml(data.beneficiaryName)},`;

    const personalMessage = data.message
      ? `
        <div style="background-color: #f9f9f9; padding: 16px 20px; border-left: 3px solid #cd935b; border-radius: 4px; margin: 20px 0;">
          <p style="margin: 0; font-style: italic; color: #555;">“${escapeHtml(data.message)}”</p>
        </div>
      `
      : "";

    const content = `
      <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 24px;">Un don réalisé en votre honneur</h2>

      <p>${greeting}</p>

      <p>
        <strong>${escapeHtml(data.donorName)}</strong> vient de réaliser un don de
        <strong>${escapeHtml(formatDonationAmount(data.amount, data.currency))}</strong>
        en votre honneur, au profit de la Biblio-Librairie du Grand Tambour
        (Centre Culturel et Artistique pour les Pays d'Afrique Centrale).
      </p>

      ${personalMessage}

      <p>
        Grâce à ce geste, un espace de lecture, de transmission et de rencontre
        au service de la jeunesse d'Afrique centrale continue de grandir.
      </p>

      <p>Avec toute notre gratitude,<br />L'équipe du Grand Tambour — CCAPAC</p>
    `;

    return baseEmailLayout(content);
  },
};

// =============================================================================
// MAIN SEND EMAIL FUNCTION
// =============================================================================

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Fonction centralisée pour l'envoi d'emails
 */
export async function sendEmail({
  to,
  subject,
  html,
  from = EMAIL_FROM,
}: SendEmailOptions): Promise<boolean> {
  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
    console.log(`[Email] Envoyé avec succès à: ${to}`);
    return true;
  } catch (error) {
    console.error("[Email] Erreur lors de l'envoi:", error);
    throw new Error("Échec de l'envoi de l'email");
  }
}

// =============================================================================
// HELPER FUNCTIONS FOR COMMON USE CASES
// =============================================================================

/**
 * Envoie un email de réinitialisation de mot de passe
 */
export async function sendPasswordResetEmail(
  userEmail: string,
  userName: string,
  resetUrl: string
): Promise<boolean> {
  return sendEmail({
    to: userEmail,
    subject: "Réinitialisation de votre mot de passe - CCAPAC",
    html: emailTemplates.passwordReset(userName, resetUrl),
  });
}

/**
 * Envoie un email de vérification d'adresse email
 */
export async function sendEmailVerification(
  userEmail: string,
  userName: string,
  verificationUrl: string
): Promise<boolean> {
  return sendEmail({
    to: userEmail,
    subject: "Vérifiez votre adresse email - CCAPAC",
    html: emailTemplates.emailVerification(userName, verificationUrl),
  });
}

/**
 * Envoie un email depuis le formulaire de contact
 */
export async function sendContactFormEmail(
  adminEmail: string,
  contactData: Parameters<typeof emailTemplates.contactForm>[0]
): Promise<boolean> {
  return sendEmail({
    to: adminEmail,
    subject: `Nouveau message de contact - ${contactData.subject}`,
    html: emailTemplates.contactForm(contactData),
  });
}

/**
 * Envoie un email pour une nouvelle suggestion membre
 */
export async function sendMemberSuggestionEmail(
  adminEmail: string,
  suggestionData: Parameters<typeof emailTemplates.memberSuggestion>[0]
): Promise<boolean> {
  return sendEmail({
    to: adminEmail,
    subject: `Nouvelle suggestion membre - ${suggestionData.category}`,
    html: emailTemplates.memberSuggestion(suggestionData),
  });
}

export async function sendFundraisingDonationSucceededEmail(
  adminEmail: string,
  donationData: Parameters<
    typeof emailTemplates.fundraisingDonationSucceeded
  >[0]
): Promise<boolean> {
  return sendEmail({
    to: adminEmail,
    subject: `Nouveau don confirme - ${formatDonationAmount(
      donationData.amount,
      donationData.currency
    )}`,
    html: emailTemplates.fundraisingDonationSucceeded(donationData),
  });
}

export async function sendFundraisingDonorThankYouEmail(
  donorEmail: string,
  donationData: Parameters<typeof emailTemplates.fundraisingDonorThankYou>[0]
): Promise<boolean> {
  return sendEmail({
    to: donorEmail,
    subject: "Merci pour votre soutien - CCAPAC",
    html: emailTemplates.fundraisingDonorThankYou(donationData),
  });
}

/**
 * Prévient un bénéficiaire (proche ou organisation) qu'un don a été réalisé
 * en son honneur, une fois le paiement confirmé.
 */
export async function sendDonationHonorEmail(
  beneficiaryEmail: string,
  donationData: Parameters<typeof emailTemplates.donationHonor>[0]
): Promise<boolean> {
  return sendEmail({
    to: beneficiaryEmail,
    subject: "Un don a été réalisé en votre honneur - CCAPAC",
    html: emailTemplates.donationHonor(donationData),
  });
}
