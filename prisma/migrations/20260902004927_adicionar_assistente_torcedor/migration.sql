-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "whatsapp" TEXT;

-- CreateTable
CREATE TABLE "Assinatura" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "timeId" INTEGER,
    "whatsapp" TEXT NOT NULL,
    "idioma" TEXT NOT NULL,
    "formaPagamento" TEXT NOT NULL,
    "plano" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "inicioEm" TIMESTAMP(3),
    "fimEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assinatura_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Assinatura_usuarioId_idx" ON "Assinatura"("usuarioId");

-- CreateIndex
CREATE INDEX "Assinatura_timeId_idx" ON "Assinatura"("timeId");

-- CreateIndex
CREATE INDEX "Assinatura_status_idx" ON "Assinatura"("status");

-- AddForeignKey
ALTER TABLE "Assinatura" ADD CONSTRAINT "Assinatura_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assinatura" ADD CONSTRAINT "Assinatura_timeId_fkey" FOREIGN KEY ("timeId") REFERENCES "Time"("timeId") ON DELETE SET NULL ON UPDATE CASCADE;
