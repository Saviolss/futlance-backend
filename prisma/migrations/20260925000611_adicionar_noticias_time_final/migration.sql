/*
  Warnings:

  - You are about to drop the `NoticiaTimeTraducao` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "NoticiaTimeTraducao" DROP CONSTRAINT "NoticiaTimeTraducao_noticiaTimeId_fkey";

-- DropTable
DROP TABLE "NoticiaTimeTraducao";
