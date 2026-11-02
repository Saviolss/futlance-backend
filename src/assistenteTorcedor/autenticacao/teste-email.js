import dotenv from "dotenv"

dotenv.config()

import { enviarCodigoPorEmail } from "./email.service"

try {

  await enviarCodigoPorEmail({

    para: "futlanceweb@gmail.com",

    nome: "Savio",

    codigo: "123456",

    tipo: "CONFIRMAR_EMAIL"

  })

  console.log(
    "✅ TESTE DE E-MAIL CONCLUÍDO"
  )

} catch (erro) {

  console.error(
    "❌ TESTE DE E-MAIL FALHOU:",
    erro
  )

}