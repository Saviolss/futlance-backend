-- CreateTable
CREATE TABLE "NoticiaTime" (
    "id" SERIAL NOT NULL,
    "timeId" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "imagem" TEXT,
    "fonte" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "data" TIMESTAMP(3),
    "categoria" TEXT[],
    "autor" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NoticiaTime_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NoticiaTime_url_key" ON "NoticiaTime"("url");

-- CreateIndex
CREATE INDEX "NoticiaTime_timeId_idx" ON "NoticiaTime"("timeId");

-- CreateIndex
CREATE INDEX "NoticiaTime_data_idx" ON "NoticiaTime"("data");

-- CreateIndex
CREATE INDEX "NoticiaTime_timeId_data_idx" ON "NoticiaTime"("timeId", "data");

-- AddForeignKey
ALTER TABLE "NoticiaTime" ADD CONSTRAINT "NoticiaTime_timeId_fkey" FOREIGN KEY ("timeId") REFERENCES "Time"("timeId") ON DELETE CASCADE ON UPDATE CASCADE;
