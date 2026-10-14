import { after, NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import {
  type AksessifyDonation,
  aksessifyErrorResponse,
  getAppBaseUrl,
  verifyFundraisingDonation,
} from "@/lib/aksessify";
import {
  sendFundraisingDonationSucceededEmail,
  sendFundraisingDonorThankYouEmail,
} from "@/services/mailServices";

export const runtime = "nodejs";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

function paymentMethodLabel(method: AksessifyDonation["payment_method"]) {
  const labels: Record<AksessifyDonation["payment_method"], string> = {
    stripe: "Carte bancaire",
    paypal: "PayPal",
    pawapay: "Mobile Money",
  };

  return labels[method];
}

function parseEmailList(value: string | undefined) {
  if (!value) return [];

  return value
    .split(/[;,]/)
    .map((email) => email.trim().toLowerCase())
    .filter((email) => /\S+@\S+\.\S+/.test(email));
}

async function getFundraisingAdminRecipients() {
  const admins = await prisma.user.findMany({
    where: {
      role: "ADMIN",
      emailVerified: true,
    },
    select: {
      email: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const adminEmails = admins.map((admin) => admin.email.trim().toLowerCase());

  if (adminEmails.length > 0) {
    return Array.from(new Set(adminEmails));
  }

  return Array.from(
    new Set([
      ...parseEmailList(process.env.FUNDRAISING_ADMIN_EMAILS),
      ...parseEmailList(process.env.FUNDRAISING_ADMIN_EMAIL),
      ...parseEmailList(process.env.ADMIN_EMAIL),
    ])
  );
}

async function ensureNotificationRecord(donation: AksessifyDonation) {
  return prisma.fundraisingDonationNotification.upsert({
    where: { donationId: donation.id },
    create: {
      donationId: donation.id,
      status: donation.status,
      amount: donation.amount,
      currency: donation.currency,
      paymentMethod: donation.payment_method,
      donorName: donation.donor.name,
      donorEmail: donation.donor.email.toLowerCase(),
      donorPhone: donation.donor.phone || null,
    },
    update: {
      status: donation.status,
      amount: donation.amount,
      currency: donation.currency,
      paymentMethod: donation.payment_method,
      donorName: donation.donor.name,
      donorEmail: donation.donor.email.toLowerCase(),
      donorPhone: donation.donor.phone || null,
    },
  });
}

async function lockNotification(
  donationId: string,
  field: "notificationStatus" | "donorNotificationStatus"
) {
  const locked = await prisma.fundraisingDonationNotification.updateMany({
    where: {
      donationId,
      [field]: { in: ["pending", "failed", "skipped"] },
    },
    data: {
      [field]: "sending",
    },
  });

  return locked.count === 1;
}

async function notifyAdminOnce(donation: AksessifyDonation) {
  const recipients = await getFundraisingAdminRecipients();

  if (recipients.length === 0) {
    await prisma.fundraisingDonationNotification.updateMany({
      where: {
        donationId: donation.id,
        notificationStatus: "pending",
      },
      data: {
        notificationStatus: "skipped",
      },
    });
    return;
  }

  if (!(await lockNotification(donation.id, "notificationStatus"))) return;

  try {
    const results = await Promise.allSettled(
      recipients.map((recipient) =>
        sendFundraisingDonationSucceededEmail(recipient, {
          donationId: donation.id,
          donorName: donation.donor.name,
          donorEmail: donation.donor.email,
          donorPhone: donation.donor.phone,
          amount: donation.amount,
          currency: donation.currency,
          paymentMethod: paymentMethodLabel(donation.payment_method),
          succeededAt: donation.succeeded_at,
        })
      )
    );

    const succeededCount = results.filter(
      (result) => result.status === "fulfilled"
    ).length;

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(
          `[Fundraising] Echec notification admin ${recipients[index]}:`,
          result.reason
        );
      }
    });

    if (succeededCount === 0) {
      throw new Error("Aucun administrateur n'a pu etre notifie.");
    }

    await prisma.fundraisingDonationNotification.update({
      where: { donationId: donation.id },
      data: {
        notificationStatus: "sent",
        notifiedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("[Fundraising] Echec notification admin:", error);

    await prisma.fundraisingDonationNotification.update({
      where: { donationId: donation.id },
      data: {
        notificationStatus: "failed",
      },
    });
  }
}

async function notifyDonorOnce(donation: AksessifyDonation) {
  const donorEmail = donation.donor.email.trim().toLowerCase();
  const donor = await prisma.user.findFirst({
    where: {
      email: {
        equals: donorEmail,
        mode: "insensitive",
      },
    },
    select: { id: true },
  });
  const donorIsMember = Boolean(donor);

  await prisma.fundraisingDonationNotification.update({
    where: { donationId: donation.id },
    data: { donorIsMember },
  });

  if (!(await lockNotification(donation.id, "donorNotificationStatus"))) {
    return;
  }

  const signupUrl = donorIsMember
    ? undefined
    : `${getAppBaseUrl()}/auth/signup?email=${encodeURIComponent(donorEmail)}`;

  try {
    await sendFundraisingDonorThankYouEmail(donorEmail, {
      donationId: donation.id,
      donorName: donation.donor.name,
      amount: donation.amount,
      currency: donation.currency,
      signupUrl,
    });

    await prisma.fundraisingDonationNotification.update({
      where: { donationId: donation.id },
      data: {
        donorNotificationStatus: "sent",
        donorNotifiedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("[Fundraising] Echec notification donateur:", error);

    await prisma.fundraisingDonationNotification.update({
      where: { donationId: donation.id },
      data: {
        donorNotificationStatus: "failed",
      },
    });
  }
}

async function processSucceededDonationNotifications(
  donation: AksessifyDonation
) {
  try {
    await ensureNotificationRecord(donation);
    const results = await Promise.allSettled([
      notifyAdminOnce(donation),
      notifyDonorOnce(donation),
    ]);

    for (const result of results) {
      if (result.status === "rejected") {
        console.error("[Fundraising] Echec notification:", result.reason);
      }
    }
  } catch (error) {
    console.error("[Fundraising] Echec traitement notifications:", error);
  }
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const result = paramsSchema.safeParse(resolvedParams);

  if (!result.success) {
    return NextResponse.json(
      {
        error: {
          code: "invalid_donation_id",
          message: "Ce don ne peut pas etre retrouvé.",
        },
      },
      { status: 400 }
    );
  }

  try {
    const donation = await verifyFundraisingDonation(result.data.id);

    if (donation.status === "succeeded") {
      after(() => processSucceededDonationNotifications(donation));
    }

    return NextResponse.json({
      id: donation.id,
      status: donation.status,
      amount: donation.amount,
      currency: donation.currency,
      payment_method: donation.payment_method,
      provider_instructions: donation.provider_instructions || null,
      pawapay: donation.pawapay || null,
      succeeded_at: donation.succeeded_at || null,
    });
  } catch (error) {
    const response = aksessifyErrorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
