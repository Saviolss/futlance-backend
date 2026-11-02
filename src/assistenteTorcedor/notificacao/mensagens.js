export const MENSAGENS_ASSISTENTE = {
  pt: {
    jogo5Minutos: ({ campeonato, mandante, visitante, horario, estadio }) =>
      `⚽ *Futlance — Seu time vai jogar!*\n\n⏰ Faltam *5 minutos* para o jogo!\n\n🏆 ${campeonato}\n🏠 ${mandante} x ${visitante}\n🕐 ${horario}${estadio ? `\n📍 ${estadio}` : ""}\n\nBoa sorte! 🟠⚽`,
    resultadoJogo: ({ campeonato, mandante, visitante, placarMandante, placarVisitante, resultado }) =>
      `🏁 *Fim de jogo!*\n\n⚽ ${mandante} *${placarMandante}* x *${placarVisitante}* ${visitante}\n\n🏆 ${campeonato}\n\n${resultado}`,
    noticiaTime: ({ time, titulo, resumo, url }) =>
      `📰 *Notícia do ${time}*\n\n${titulo}${resumo ? `\n\n${resumo}` : ""}${url ? `\n\n🔗 Leia mais no *Futlance*:\n${url}` : ""}`
  },
  en: {
    jogo5Minutos: ({ campeonato, mandante, visitante, horario, estadio }) =>
      `⚽ *Futlance — Your team is about to play!*\n\n⏰ The match starts in *5 minutes!*\n\n🏆 ${campeonato}\n🏠 ${mandante} vs ${visitante}\n🕐 ${horario}${estadio ? `\n📍 ${estadio}` : ""}\n\nGood luck! 🟠⚽`,
    resultadoJogo: ({ campeonato, mandante, visitante, placarMandante, placarVisitante, resultado }) =>
      `🏁 *Full time!*\n\n⚽ ${mandante} *${placarMandante}* - *${placarVisitante}* ${visitante}\n\n🏆 ${campeonato}\n\n${resultado}`,
    noticiaTime: ({ time, titulo, resumo, url }) =>
      `📰 *${time} News*\n\n${titulo}${resumo ? `\n\n${resumo}` : ""}${url ? `\n\n🔗 Read more on *Futlance*:\n${url}` : ""}`
  },
  es: {
    jogo5Minutos: ({ campeonato, mandante, visitante, horario, estadio }) =>
      `⚽ *Futlance — ¡Tu equipo está a punto de jugar!*\n\n⏰ ¡El partido comienza en *5 minutos*!\n\n🏆 ${campeonato}\n🏠 ${mandante} vs ${visitante}\n🕐 ${horario}${estadio ? `\n📍 ${estadio}` : ""}\n\n¡Buena suerte! 🟠⚽`,
    resultadoJogo: ({ campeonato, mandante, visitante, placarMandante, placarVisitante, resultado }) =>
      `🏁 *¡Final del partido!*\n\n⚽ ${mandante} *${placarMandante}* - *${placarVisitante}* ${visitante}\n\n🏆 ${campeonato}\n\n${resultado}`,
    noticiaTime: ({ time, titulo, resumo, url }) =>
      `📰 *Noticias de ${time}*\n\n${titulo}${resumo ? `\n\n${resumo}` : ""}${url ? `\n\n🔗 Lee más en *Futlance*:\n${url}` : ""}`
  },
  fr: {
    jogo5Minutos: ({ campeonato, mandante, visitante, horario, estadio }) =>
      `⚽ *Futlance — Votre équipe va jouer !*\n\n⏰ Le match commence dans *5 minutes !*\n\n🏆 ${campeonato}\n🏠 ${mandante} vs ${visitante}\n🕐 ${horario}${estadio ? `\n📍 ${estadio}` : ""}\n\nBonne chance ! 🟠⚽`,
    resultadoJogo: ({ campeonato, mandante, visitante, placarMandante, placarVisitante, resultado }) =>
      `🏁 *Fin du match !*\n\n⚽ ${mandante} *${placarMandante}* - *${placarVisitante}* ${visitante}\n\n🏆 ${campeonato}\n\n${resultado}`,
    noticiaTime: ({ time, titulo, resumo, url }) =>
      `📰 *Actualités de ${time}*\n\n${titulo}${resumo ? `\n\n${resumo}` : ""}${url ? `\n\n🔗 Lire la suite sur *Futlance* :\n${url}` : ""}`
  },
  de: {
    jogo5Minutos: ({ campeonato, mandante, visitante, horario, estadio }) =>
      `⚽ *Futlance — Dein Team spielt gleich!*\n\n⏰ Das Spiel beginnt in *5 Minuten!*\n\n🏆 ${campeonato}\n🏠 ${mandante} vs ${visitante}\n🕐 ${horario}${estadio ? `\n📍 ${estadio}` : ""}\n\nViel Glück! 🟠⚽`,
    resultadoJogo: ({ campeonato, mandante, visitante, placarMandante, placarVisitante, resultado }) =>
      `🏁 *Abpfiff!*\n\n⚽ ${mandante} *${placarMandante}* - *${placarVisitante}* ${visitante}\n\n🏆 ${campeonato}\n\n${resultado}`,
    noticiaTime: ({ time, titulo, resumo, url }) =>
      `📰 *Neuigkeiten von ${time}*\n\n${titulo}${resumo ? `\n\n${resumo}` : ""}${url ? `\n\n🔗 Mehr auf *Futlance*:\n${url}` : ""}`
  },
  it: {
    jogo5Minutos: ({ campeonato, mandante, visitante, horario, estadio }) =>
      `⚽ *Futlance — La tua squadra sta per giocare!*\n\n⏰ La partita inizia tra *5 minuti!*\n\n🏆 ${campeonato}\n🏠 ${mandante} vs ${visitante}\n🕐 ${horario}${estadio ? `\n📍 ${estadio}` : ""}\n\nBuona fortuna! 🟠⚽`,
    resultadoJogo: ({ campeonato, mandante, visitante, placarMandante, placarVisitante, resultado }) =>
      `🏁 *Fine della partita!*\n\n⚽ ${mandante} *${placarMandante}* - *${placarVisitante}* ${visitante}\n\n🏆 ${campeonato}\n\n${resultado}`,
    noticiaTime: ({ time, titulo, resumo, url }) =>
      `📰 *Notizie su ${time}*\n\n${titulo}${resumo ? `\n\n${resumo}` : ""}${url ? `\n\n🔗 Leggi di più su *Futlance*:\n${url}` : ""}`
  }
}