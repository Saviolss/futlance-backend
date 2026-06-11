/*
  Warnings:

  - A unique constraint covering the columns `[partidaId,timeId]` on the table `Partida` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `timeId` to the `Partida` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Partida_partidaId_key";

-- AlterTable
ALTER TABLE "Partida" ADD COLUMN     "timeId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Partida_partidaId_timeId_key" ON "Partida"("partidaId", "timeId");
