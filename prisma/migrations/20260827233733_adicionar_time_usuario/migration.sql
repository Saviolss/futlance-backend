-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "timeId" INTEGER;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_timeId_fkey" FOREIGN KEY ("timeId") REFERENCES "Time"("timeId") ON DELETE SET NULL ON UPDATE CASCADE;
