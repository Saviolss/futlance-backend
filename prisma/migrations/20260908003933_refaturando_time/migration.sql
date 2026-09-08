/*
  Warnings:

  - You are about to drop the column `alturaMedia` on the `Time` table. All the data in the column will be lost.
  - You are about to drop the column `camisa10` on the `Time` table. All the data in the column will be lost.
  - You are about to drop the column `idadeMedia` on the `Time` table. All the data in the column will be lost.
  - You are about to drop the column `jogadoresNoPais` on the `Time` table. All the data in the column will be lost.
  - You are about to drop the column `tecnicoNome` on the `Time` table. All the data in the column will be lost.
  - You are about to drop the column `tecnicoPais` on the `Time` table. All the data in the column will be lost.
  - You are about to drop the `Assinatura` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CodigoVerificacao` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Usuario` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Assinatura" DROP CONSTRAINT "Assinatura_timeId_fkey";

-- DropForeignKey
ALTER TABLE "Assinatura" DROP CONSTRAINT "Assinatura_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "CodigoVerificacao" DROP CONSTRAINT "CodigoVerificacao_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "Usuario" DROP CONSTRAINT "Usuario_timeId_fkey";

-- AlterTable
ALTER TABLE "Time" DROP COLUMN "alturaMedia",
DROP COLUMN "camisa10",
DROP COLUMN "idadeMedia",
DROP COLUMN "jogadoresNoPais",
DROP COLUMN "tecnicoNome",
DROP COLUMN "tecnicoPais";

-- DropTable
DROP TABLE "Assinatura";

-- DropTable
DROP TABLE "CodigoVerificacao";

-- DropTable
DROP TABLE "Usuario";
