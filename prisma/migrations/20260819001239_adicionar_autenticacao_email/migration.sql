-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "senhaHash" TEXT,
ALTER COLUMN "googleId" DROP NOT NULL;
