-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "emailVerificado" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "CodigoVerificacao" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "codigoHash" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "expiracao" TIMESTAMP(3) NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodigoVerificacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CodigoVerificacao_usuarioId_idx" ON "CodigoVerificacao"("usuarioId");

-- CreateIndex
CREATE INDEX "CodigoVerificacao_tipo_idx" ON "CodigoVerificacao"("tipo");

-- CreateIndex
CREATE INDEX "CodigoVerificacao_expiracao_idx" ON "CodigoVerificacao"("expiracao");

-- AddForeignKey
ALTER TABLE "CodigoVerificacao" ADD CONSTRAINT "CodigoVerificacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
