import crypto from "node:crypto";
import nodemailer from "nodemailer";

import type SMTPTransport from "nodemailer/lib/smtp-transport";

import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";
export const dynamic =
  "force-dynamic";

type EmailPayload = {
  to?: string;
  subject?: string;
  text?: string;
  html?: string;
};

function secretsMatch(
  receivedSecret: string,
  expectedSecret: string
): boolean {
  const receivedBuffer =
    Buffer.from(receivedSecret);

  const expectedBuffer =
    Buffer.from(expectedSecret);

  if (
    receivedBuffer.length !==
    expectedBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    receivedBuffer,
    expectedBuffer
  );
}

export async function POST(
  request: NextRequest
) {
  try {
    const expectedSecret =
      process.env.EMAIL_RELAY_SECRET;

    const receivedSecret =
      request.headers.get(
        "x-email-relay-secret"
      ) || "";

    if (
      !expectedSecret ||
      !receivedSecret ||
      !secretsMatch(
        receivedSecret,
        expectedSecret
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Accès refusé.",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      (await request.json()) as EmailPayload;

    const to = String(
      body.to || ""
    ).trim();

    const subject = String(
      body.subject || ""
    ).trim();

    const text = String(
      body.text || ""
    );

    const html = String(
      body.html || ""
    );

    if (!to || !subject) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Le destinataire et le sujet sont obligatoires.",
        },
        {
          status: 400,
        }
      );
    }

    const smtpHost =
      process.env.SMTP_HOST ||
      "smtp.gmail.com";

    const smtpPort = Number(
      process.env.SMTP_PORT ||
      465
    );

    const smtpSecure =
      String(
        process.env.SMTP_SECURE ||
        "true"
      ).toLowerCase() === "true";

    const smtpUser =
      process.env.SMTP_USER;

    const smtpPassword =
      process.env.SMTP_PASSWORD;

    if (
      !smtpUser ||
      !smtpPassword
    ) {
      throw new Error(
        "Configuration Gmail SMTP manquante sur Vercel."
      );
    }

    /*
     * Le type SMTPTransport.Options
     * permet à TypeScript de reconnaître
     * host, port, secure et auth.
     */
    const transportOptions:
      SMTPTransport.Options = {
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,

        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },

        connectionTimeout: 15000,
        greetingTimeout: 10000,
        socketTimeout: 20000,

        tls: {
          minVersion: "TLSv1.2",
          servername: smtpHost,
        },
      };

    const transporter =
      nodemailer.createTransport(
        transportOptions
      );

    const information =
      await transporter.sendMail({
        from: {
          name:
            process.env
              .MAIL_FROM_NAME ||
            "CCAPAC",

          address:
            process.env
              .MAIL_FROM_ADDRESS ||
            smtpUser,
        },

        to,
        subject,

        text:
          text ||
          "Veuillez consulter cet email au format HTML.",

        html:
          html ||
          `<p>${
            text ||
            "Veuillez consulter cet email."
          }</p>`,
      });

    console.log(
      "Email envoyé depuis Vercel :",
      information.messageId
    );

    return NextResponse.json({
      success: true,
      message:
        "Email envoyé avec succès.",
      messageId:
        information.messageId,
    });
  } catch (error: unknown) {
    console.error(
      "Vercel email relay error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Impossible d’envoyer l’email.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      {
        status: 500,
      }
    );
  }
}