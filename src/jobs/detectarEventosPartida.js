function statusEhFinalizado(status) {

  const valor =
    String(status || "")
      .trim()
      .toLowerCase()

  return [
    "finalizado",
    "encerrado",
    "concluido",
    "finished",
    "complete"
  ].includes(valor)

}


/* ======================================================
   DETECTAR EVENTOS DA PARTIDA
====================================================== */

export function detectarEventosPartida(
  atualApi,
  anterior
) {

  const atual =
    normalizar(atualApi)


  /* ====================================================
     PRIMEIRA EXECUÇÃO
     Não existe histórico para comparar
  ==================================================== */

  if (!anterior) {

    return {

      gol: false,

      golMandante: false,

      golVisitante: false,

      fimDeJogo: false

    }

  }


  /* ====================================================
     NORMALIZA STATUS ANTERIOR
  ==================================================== */

  const statusAnterior =
    String(anterior.status || "")
      .trim()
      .toLowerCase()


  /* ====================================================
     DETECTA GOL
  ==================================================== */

  const placarAnteriorMandante =
    Number(
      anterior?.placar?.mandante ??
      anterior?.placar_mandante ??
      0
    )

  const placarAnteriorVisitante =
    Number(
      anterior?.placar?.visitante ??
      anterior?.placar_visitante ??
      0
    )


  const golMandante =
    atual.placar.mandante >
    placarAnteriorMandante


  const golVisitante =
    atual.placar.visitante >
    placarAnteriorVisitante


  const gol =
    golMandante ||
    golVisitante


  /* ====================================================
     DETECTA FIM DE JOGO
  ==================================================== */

  const fimDeJogo =

    (
      statusAnterior === "andamento" ||
      statusAnterior === "intervalo" ||
      statusAnterior === "disputa_penalti"
    )

    &&

    statusEhFinalizado(
      atual.status
    )


  /* ====================================================
     RETORNO
  ==================================================== */

  return {

    gol,

    golMandante,

    golVisitante,

    fimDeJogo

  }

}


/* ======================================================
   NORMALIZAÇÃO INTERNA
====================================================== */

function normalizar(p) {

  return {

    status:
      String(p?.status || "")
        .trim()
        .toLowerCase(),

    placar: {

      mandante:
        Number(
          p?.placar_mandante ??
          p?.placar?.mandante ??
          0
        ),

      visitante:
        Number(
          p?.placar_visitante ??
          p?.placar?.visitante ??
          0
        )

    }

  }

}
