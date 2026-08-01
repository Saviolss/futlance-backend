import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function obterPartidasDoDia() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);

  return prisma.agenda.findMany({
    where: {
      data_iso: {
        gte: hoje,
        lt: amanha
      }
    }
  });
}