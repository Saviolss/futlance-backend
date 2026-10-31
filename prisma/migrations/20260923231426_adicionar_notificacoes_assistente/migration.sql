-- CreateTable
CREATE TABLE "NotificacaoEnviada" (
    "id" TEXT NOT NULL,
    "assinaturaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "referenciaId" TEXT,
    "enviadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificacaoEnviada_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotificacaoEnviada_assinaturaId_idx" ON "NotificacaoEnviada"("assinaturaId");

-- CreateIndex
CREATE INDEX "NotificacaoEnviada_tipo_idx" ON "NotificacaoEnviada"("tipo");

-- CreateIndex
CREATE INDEX "NotificacaoEnviada_referenciaId_idx" ON "NotificacaoEnviada"("referenciaId");

-- CreateIndex
CREATE INDEX "NotificacaoEnviada_enviadaEm_idx" ON "NotificacaoEnviada"("enviadaEm");

-- CreateIndex
CREATE UNIQUE INDEX "NotificacaoEnviada_assinaturaId_tipo_referenciaId_key" ON "NotificacaoEnviada"("assinaturaId", "tipo", "referenciaId");

-- AddForeignKey
ALTER TABLE "NotificacaoEnviada" ADD CONSTRAINT "NotificacaoEnviada_assinaturaId_fkey" FOREIGN KEY ("assinaturaId") REFERENCES "Assinatura"("id") ON DELETE CASCADE ON UPDATE CASCADE;
