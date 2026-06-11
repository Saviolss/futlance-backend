-- CreateTable
CREATE TABLE "Time" (
    "id" SERIAL NOT NULL,
    "timeId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "nomePopular" TEXT NOT NULL,
    "sigla" TEXT,
    "escudo" TEXT,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Time_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partida" (
    "id" SERIAL NOT NULL,
    "partidaId" INTEGER NOT NULL,
    "campeonato" TEXT,
    "status" TEXT,
    "data" TEXT,
    "hora" TEXT,
    "mandante" TEXT,
    "visitante" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Elenco" (
    "id" SERIAL NOT NULL,
    "timeId" INTEGER NOT NULL,
    "numeroCamisa" INTEGER,
    "nome" TEXT NOT NULL,
    "nomeCompleto" TEXT,
    "posicao" TEXT,
    "clube" TEXT,
    "alturaCm" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Elenco_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Time_timeId_key" ON "Time"("timeId");

-- CreateIndex
CREATE UNIQUE INDEX "Time_slug_key" ON "Time"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Partida_partidaId_key" ON "Partida"("partidaId");
