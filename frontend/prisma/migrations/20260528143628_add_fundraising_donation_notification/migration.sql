-- CreateTable
CREATE TABLE "fundraising_donation_notification" (
    "_id" TEXT NOT NULL,
    "donationId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "donorName" TEXT NOT NULL,
    "donorEmail" TEXT NOT NULL,
    "donorPhone" TEXT,
    "notificationStatus" TEXT NOT NULL DEFAULT 'pending',
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fundraising_donation_notification_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fundraising_donation_notification_donationId_key" ON "fundraising_donation_notification"("donationId");

-- CreateIndex
CREATE INDEX "fundraising_donation_notification_notificationStatus_create_idx" ON "fundraising_donation_notification"("notificationStatus", "createdAt");
