-- AlterTable
ALTER TABLE "NoticiaTime" ADD COLUMN     "idioma" TEXT;

-- CreateTable
CREATE TABLE "NoticiaTimeTraducao" (
    "id" SERIAL NOT NULL,
    "noticiaTimeId" INTEGER NOT NULL,
    "idioma" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NoticiaTimeTraducao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NoticiaTimeTraducao_idioma_idx" ON "NoticiaTimeTraducao"("idioma");

-- CreateIndex
CREATE UNIQUE INDEX "NoticiaTimeTraducao_noticiaTimeId_idioma_key" ON "NoticiaTimeTraducao"("noticiaTimeId", "idioma");

-- AddForeignKey
ALTER TABLE "NoticiaTimeTraducao" ADD CONSTRAINT "NoticiaTimeTraducao_noticiaTimeId_fkey" FOREIGN KEY ("noticiaTimeId") REFERENCES "NoticiaTime"("id") ON DELETE CASCADE ON UPDATE CASCADE;
