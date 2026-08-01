/*
  Warnings:

  - The `tempo` column on the `PartidaAoVivo` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "PartidaAoVivo" DROP COLUMN "tempo",
ADD COLUMN     "tempo" INTEGER;
