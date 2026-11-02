-- CreateTable
CREATE TABLE "FilaNotificacao" (
    "id" TEXT NOT NULL,
    "assinaturaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "referenciaId" TEXT NOT NULL,
    "dados" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "maxTentativas" INTEGER NOT NULL DEFAULT 5,
    "tentarNovamenteEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processandoEm" TIMESTAMP(3),
    "enviadaEm" TIMESTAMP(3),
    "ultimoErro" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FilaNotificacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FilaNotificacao_status_tentarNovamenteEm_idx" ON "FilaNotificacao"("status", "tentarNovamenteEm");

-- CreateIndex
CREATE INDEX "FilaNotificacao_processandoEm_idx" ON "FilaNotificacao"("processandoEm");

-- CreateIndex
CREATE INDEX "FilaNotificacao_criadoEm_idx" ON "FilaNotificacao"("criadoEm");

-- CreateIndex
CREATE UNIQUE INDEX "FilaNotificacao_assinaturaId_tipo_referenciaId_key" ON "FilaNotificacao"("assinaturaId", "tipo", "referenciaId");

-- AddForeignKey
ALTER TABLE "FilaNotificacao" ADD CONSTRAINT "FilaNotificacao_assinaturaId_fkey" FOREIGN KEY ("assinaturaId") REFERENCES "Assinatura"("id") ON DELETE CASCADE ON UPDATE CASCADE;
