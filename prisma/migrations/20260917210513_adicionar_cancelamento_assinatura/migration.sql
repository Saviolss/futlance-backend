/*
  Warnings:

  - A unique constraint covering the columns `[stripeSubscriptionId]` on the table `Assinatura` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Assinatura" ADD COLUMN     "canceladaEm" TIMESTAMP(3),
ADD COLUMN     "stripeSubscriptionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Assinatura_stripeSubscriptionId_key" ON "Assinatura"("stripeSubscriptionId");
