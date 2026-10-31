import rateLimit from "express-rate-limit"


// ============================================================
// RATE LIMIT - LOGIN
// ============================================================

export const limiteLogin = rateLimit({

  windowMs:
    15 * 60 * 1000, // 15 minutos

  max: 5,

  standardHeaders: true,

  legacyHeaders: false,

  message: {

    sucesso: false,

    mensagem:
      "Muitas tentativas de login. Tente novamente mais tarde."

  },

  handler: (req, res) => {

    return res.status(429).json({

      sucesso: false,

      mensagem:
        "Muitas tentativas de login. Tente novamente mais tarde."

    })

  }

})


// ============================================================
// RATE LIMIT - CADASTRO
// ============================================================

export const limiteCadastro = rateLimit({

  windowMs:
    60 * 60 * 1000, // 1 hora

  max: 5,

  standardHeaders: true,

  legacyHeaders: false,

  message: {

    sucesso: false,

    mensagem:
      "Muitas tentativas de cadastro. Tente novamente mais tarde."

  },

  handler: (req, res) => {

    return res.status(429).json({

      sucesso: false,

      mensagem:
        "Muitas tentativas de cadastro. Tente novamente mais tarde."

    })

  }

})