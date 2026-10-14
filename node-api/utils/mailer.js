async function sendEmail({
  to,
  subject,
  text,
  html,
}) {
  const relayUrl =
    process.env.EMAIL_RELAY_URL;

  const relaySecret =
    process.env.EMAIL_RELAY_SECRET;

  if (
    !relayUrl ||
    !relaySecret
  ) {
    throw new Error(
      "Configuration du relais email manquante."
    );
  }

  if (!to || !subject) {
    throw new Error(
      "Le destinataire et le sujet sont obligatoires."
    );
  }

  const response = await fetch(
    relayUrl,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",

        "x-email-relay-secret":
          relaySecret,
      },

      body: JSON.stringify({
        to,
        subject,
        text,
        html,
      }),

      signal:
        AbortSignal.timeout(
          30000
        ),
    }
  );

  const result =
    await response
      .json()
      .catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.message ||
      `Le relais email a retourné ${response.status}.`
    );
  }

  console.log(
    "Email envoyé via le relais Vercel :",
    result.messageId
  );

  return {
    messageId:
      result.messageId,
    provider:
      "vercel-nodemailer-relay",
  };
}

async function verifyMailer() {
  try {
    if (
      !process.env.EMAIL_RELAY_URL ||
      !process.env.EMAIL_RELAY_SECRET
    ) {
      throw new Error(
        "EMAIL_RELAY_URL ou EMAIL_RELAY_SECRET est absent."
      );
    }

    console.log(
      "Service email configuré via Vercel et Nodemailer"
    );

    return true;
  } catch (error) {
    console.error(
      "Configuration du relais email invalide :",
      error.message
    );

    return false;
  }
}

module.exports = {
  sendEmail,
  verifyMailer,
};