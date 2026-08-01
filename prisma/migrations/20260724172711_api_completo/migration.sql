-- CreateTable
CREATE TABLE "Agenda" (
    "id" SERIAL NOT NULL,
    "partida_id" INTEGER NOT NULL,
    "campeonato_id" INTEGER NOT NULL,
    "campeonato" TEXT NOT NULL,
    "mandante_nome" TEXT NOT NULL,
    "mandante_escudo" TEXT,
    "visitante_nome" TEXT NOT NULL,
    "visitante_escudo" TEXT,
    "data" TEXT NOT NULL,
    "hora" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "data_iso" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartidaAoVivo" (
    "id" SERIAL NOT NULL,
    "partida_id" INTEGER NOT NULL,
    "campeonato_id" INTEGER,
    "campeonato_nome" TEXT,
    "status" TEXT NOT NULL,
    "tempo" TEXT,
    "placar_mandante" INTEGER,
    "placar_visitante" INTEGER,
    "penalti_mandante" INTEGER,
    "penalti_visitante" INTEGER,
    "penalti_cobrancas" JSONB,
    "mandante_nome" TEXT,
    "mandante_escudo" TEXT,
    "visitante_nome" TEXT,
    "visitante_escudo" TEXT,
    "estadio_nome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartidaAoVivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artilheiro" (
    "id" SERIAL NOT NULL,
    "jogador_id" INTEGER NOT NULL,
    "campeonato_id" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "clube_nome" TEXT NOT NULL,
    "clube_escudo" TEXT,
    "gols" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Artilheiro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tabela" (
    "id" SERIAL NOT NULL,
    "campeonato_id" INTEGER NOT NULL,
    "time_id" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "escudo" TEXT,
    "posicao" INTEGER NOT NULL,
    "pontos" INTEGER NOT NULL,
    "jogos" INTEGER NOT NULL,
    "vitorias" INTEGER NOT NULL,
    "empates" INTEGER NOT NULL,
    "derrotas" INTEGER NOT NULL,
    "gols_pro" INTEGER NOT NULL,
    "gols_contra" INTEGER NOT NULL,
    "saldo_gols" INTEGER NOT NULL,
    "aproveitamento" DOUBLE PRECISION,
    "grupo" TEXT,
    "fase" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tabela_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartidaFinalizada" (
    "id" SERIAL NOT NULL,
    "partida_id" INTEGER NOT NULL,
    "campeonato_id" INTEGER NOT NULL,
    "campeonato_nome" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "mandante_nome" TEXT NOT NULL,
    "mandante_escudo" TEXT,
    "visitante_nome" TEXT NOT NULL,
    "visitante_escudo" TEXT,
    "placar_mandante" INTEGER,
    "placar_visitante" INTEGER,
    "data" TEXT,
    "hora" TEXT,
    "data_iso" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartidaFinalizada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Noticia" (
    "id" SERIAL NOT NULL,
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

    CONSTRAINT "Noticia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Agenda_partida_id_key" ON "Agenda"("partida_id");

-- CreateIndex
CREATE INDEX "Agenda_campeonato_id_idx" ON "Agenda"("campeonato_id");

-- CreateIndex
CREATE INDEX "Agenda_data_iso_idx" ON "Agenda"("data_iso");

-- CreateIndex
CREATE UNIQUE INDEX "PartidaAoVivo_partida_id_key" ON "PartidaAoVivo"("partida_id");

-- CreateIndex
CREATE INDEX "PartidaAoVivo_campeonato_id_idx" ON "PartidaAoVivo"("campeonato_id");

-- CreateIndex
CREATE INDEX "PartidaAoVivo_status_idx" ON "PartidaAoVivo"("status");

-- CreateIndex
CREATE INDEX "Artilheiro_campeonato_id_idx" ON "Artilheiro"("campeonato_id");

-- CreateIndex
CREATE INDEX "Artilheiro_gols_idx" ON "Artilheiro"("gols");

-- CreateIndex
CREATE UNIQUE INDEX "Artilheiro_campeonato_id_jogador_id_key" ON "Artilheiro"("campeonato_id", "jogador_id");

-- CreateIndex
CREATE INDEX "Tabela_campeonato_id_idx" ON "Tabela"("campeonato_id");

-- CreateIndex
CREATE INDEX "Tabela_grupo_idx" ON "Tabela"("grupo");

-- CreateIndex
CREATE INDEX "Tabela_fase_idx" ON "Tabela"("fase");

-- CreateIndex
CREATE UNIQUE INDEX "Tabela_campeonato_id_time_id_key" ON "Tabela"("campeonato_id", "time_id");

-- CreateIndex
CREATE UNIQUE INDEX "PartidaFinalizada_partida_id_key" ON "PartidaFinalizada"("partida_id");

-- CreateIndex
CREATE INDEX "PartidaFinalizada_campeonato_id_idx" ON "PartidaFinalizada"("campeonato_id");

-- CreateIndex
CREATE INDEX "PartidaFinalizada_data_iso_idx" ON "PartidaFinalizada"("data_iso");

-- CreateIndex
CREATE UNIQUE INDEX "Noticia_url_key" ON "Noticia"("url");

-- CreateIndex
CREATE INDEX "Noticia_data_idx" ON "Noticia"("data");
