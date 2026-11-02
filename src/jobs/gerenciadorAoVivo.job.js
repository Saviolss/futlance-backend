import { iniciarJobPartidasAoVivo } from "./partidasAoVivo.job.js";
import { obterPartidasDoDia } from "../utils/agendaDoDia.js";

let jobAtivo = false;

export async function gerenciarAoVivo() {
  try {
    const partidasHoje = await obterPartidasDoDia();

    if (partidasHoje.length > 0) {
      if (!jobAtivo) {
        await iniciarJobPartidasAoVivo();
        jobAtivo = true;
        console.log("🔥 Job de partidas ao vivo ATIVADO");
      }
    } else if (jobAtivo) {
      jobAtivo = false;
      console.log("🛑 Nenhuma partida hoje. Job ao vivo desativado.");
    }
  } catch (erro) {
    console.error("❌ Erro no gerenciador ao vivo:", erro.message);
  }
}