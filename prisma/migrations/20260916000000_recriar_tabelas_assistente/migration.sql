
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "googleId" TEXT,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerificado" BOOLEAN NOT NULL DEFAULT false,
    "senhaHash" TEXT,
    "aceitouPolitica" BOOLEAN NOT NULL DEFAULT false,
    "aceitouPoliticaEm" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "timeId" INTEGER,
    "whatsapp" TEXT,
    "idioma" TEXT NOT NULL DEFAULT 'pt',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Usuario_googleId_key" ON "Usuario"("googleId");
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

CREATE TABLE "CodigoVerificacao" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "codigoHash" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "expiracao" TIMESTAMP(3) NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CodigoVerificacao_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CodigoVerificacao_usuarioId_idx" ON "CodigoVerificacao"("usuarioId");
CREATE INDEX "CodigoVerificacao_tipo_idx" ON "CodigoVerificacao"("tipo");
CREATE INDEX "CodigoVerificacao_expiracao_idx" ON "CodigoVerificacao"("expiracao");

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

CREATE INDEX "Assinatura_usuarioId_idx" ON "Assinatura"("usuarioId");
CREATE INDEX "Assinatura_timeId_idx" ON "Assinatura"("timeId");
CREATE INDEX "Assinatura_status_idx" ON "Assinatura"("status");

ALTER TABLE "Usuario"
ADD CONSTRAINT "Usuario_timeId_fkey"
FOREIGN KEY ("timeId") REFERENCES "Time"("timeId")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CodigoVerificacao"
ADD CONSTRAINT "CodigoVerificacao_usuarioId_fkey"
FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Assinatura"
ADD CONSTRAINT "Assinatura_usuarioId_fkey"
FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Assinatura"
ADD CONSTRAINT "Assinatura_timeId_fkey"
FOREIGN KEY ("timeId") REFERENCES "Time"("timeId")
ON DELETE SET NULL ON UPDATE CASCADE;
