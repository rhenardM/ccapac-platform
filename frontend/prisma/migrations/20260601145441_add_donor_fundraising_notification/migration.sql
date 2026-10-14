-- AlterTable
ALTER TABLE "fundraising_donation_notification" ADD COLUMN     "donorIsMember" BOOLEAN,
ADD COLUMN     "donorNotificationStatus" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "donorNotifiedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "fundraising_donation_notification_donorNotificationStatus_c_idx" ON "fundraising_donation_notification"("donorNotificationStatus", "createdAt");
