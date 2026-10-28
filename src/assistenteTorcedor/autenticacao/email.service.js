import { BrevoClient } from "@getbrevo/brevo"

const TENTATIVAS_ENVIO_EMAIL = 3
const INTERVALO_RETRY_EMAIL_MS = 1000

const CODIGOS_CONEXAO_RETENTAVEIS = new Set([
  "UND_ERR_CONNECT_TIMEOUT",
  "EAI_AGAIN",
  "ECONNREFUSED",
  "EHOSTUNREACH",
  "ENETUNREACH"
])


// ============================================================
// CONFIGURAÇÃO
// ============================================================

function obterCodigoErro(erro) {

  let erroAtual = erro
  const errosVisitados = new Set()

  while (
    erroAtual &&
    typeof erroAtual === "object" &&
    !errosVisitados.has(erroAtual)
  ) {

    errosVisitados.add(erroAtual)

    if (erroAtual.code) {

      return erroAtual.code

    }

    erroAtual = erroAtual.cause

  }

  return undefined

}


function aguardar(ms) {

  return new Promise(resolve => setTimeout(resolve, ms))

}


function validarConfiguracao() {

  if (!process.env.BREVO_API_KEY) {

    throw new Error(
      "BREVO_API_KEY não configurada."
    )

  }


  if (!process.env.BREVO_EMAIL_FROM) {

    throw new Error(
      "BREVO_EMAIL_FROM não configurado."
    )

  }

}


// ============================================================
// CLIENTE BREVO
// ============================================================

const apiInstance =
  new BrevoClient({
    apiKey:
      process.env.BREVO_API_KEY
  })


// ============================================================
// ENVIAR E-MAIL
// ============================================================

export async function enviarEmail({

  para,

  nome,

  assunto,

  html,

  texto

}) {

  validarConfiguracao()


  if (
    typeof para !== "string" ||
    !para.trim()
  ) {

    throw new Error(
      "E-mail do destinatário não informado."
    )

  }


  const email = {

    sender: {

      name:
        process.env.BREVO_NAME_FROM ||
        "Futlance",

      email:
        process.env.BREVO_EMAIL_FROM

    },


    to: [

      {

        email:
          para.trim().toLowerCase(),

        name:
          nome ||
          ""

      }

    ],


    subject:
      assunto,


    htmlContent:
      html

  }

  if (texto) {

    email.textContent =
      texto

  }

  try {

    let resposta

    for (
      let tentativa = 1;
      tentativa <= TENTATIVAS_ENVIO_EMAIL;
      tentativa += 1
    ) {

      try {

        resposta =
          await apiInstance.transactionalEmails.sendTransacEmail(
            email
          )

        break

      } catch (erro) {

        const codigoErro = obterCodigoErro(erro)
        const podeTentarNovamente =
          CODIGOS_CONEXAO_RETENTAVEIS.has(codigoErro)

        if (
          !podeTentarNovamente ||
          tentativa === TENTATIVAS_ENVIO_EMAIL
        ) {

          throw erro

        }

        const intervalo =
          INTERVALO_RETRY_EMAIL_MS * 2 ** (tentativa - 1)

        console.warn(
          `⚠️ Falha de conexão com Brevo (${codigoErro}); nova tentativa ${tentativa + 1}/${TENTATIVAS_ENVIO_EMAIL} em ${intervalo}ms.`
        )

        await aguardar(intervalo)

      }

    }


    console.log(
      "📧 E-mail enviado pelo Brevo:",
      para
    )


    return resposta

  } catch (erro) {

    console.error(
      "❌ Erro ao enviar e-mail pelo Brevo:",
      erro?.response?.body ||
      erro?.body ||
      erro
    )


    const erroEmail =
      new Error(
        "Não foi possível enviar o e-mail."
      )

    erroEmail.codigo =
      "ERRO_ENVIO_EMAIL"

    throw erroEmail

  }

}


// ============================================================
// ENVIAR CÓDIGO DE VERIFICAÇÃO
// ============================================================

export async function enviarCodigoPorEmail({

  para,

  nome,

  codigo,

  tipo

}) {

  let assunto = ""

  let titulo = ""

  let mensagem = ""


  // ==========================================================
  // CONFIRMAR E-MAIL
  // ==========================================================

  if (
    tipo === "CONFIRMAR_EMAIL"
  ) {

    assunto =
      "Código de confirmação - Futlance"

    titulo =
      "Confirme seu e-mail"

    mensagem =
      "Use o código abaixo para confirmar que você é o proprietário deste e-mail."

  }


  // ==========================================================
  // REDEFINIR SENHA
  // ==========================================================

  else if (
    tipo === "REDEFINIR_SENHA"
  ) {

    assunto =
      "Código para redefinir sua senha - Futlance"

    titulo =
      "Redefinição de senha"

    mensagem =
      "Use o código abaixo para continuar com a redefinição da sua senha."

  }


  // ==========================================================
  // TIPO INVÁLIDO
  // ==========================================================

  else {

    const erro =
      new Error(
        "Tipo de e-mail inválido."
      )

    erro.codigo =
      "TIPO_EMAIL_INVALIDO"

    throw erro

  }


  // ==========================================================
  // HTML
  // ==========================================================

  const html = `

<!DOCTYPE html>

<html lang="pt-BR">

<head>

  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>${assunto}</title>

</head>

<body
  style="
    margin:0;
    padding:0;
    background:#0f172a;
    font-family:Arial,Helvetica,sans-serif;
  "
>

  <div
    style="
      max-width:600px;
      margin:40px auto;
      padding:30px;
      background:#020617;
      border:1px solid #1e293b;
      border-radius:16px;
      color:#ffffff;
    "
  >

    <div
      style="
        text-align:center;
        margin-bottom:30px;
      "
    >

      <h1
        style="
          margin:0;
          color:#f97316;
          font-size:28px;
        "
      >
        Futlance
      </h1>

    </div>


    <h2
      style="
        margin-bottom:10px;
        font-size:22px;
      "
    >
      ${titulo}
    </h2>


    <p
      style="
        color:#cbd5e1;
        font-size:16px;
        line-height:1.6;
      "
    >
      Olá${nome ? `, ${nome}` : ""}.
    </p>


    <p
      style="
        color:#cbd5e1;
        font-size:16px;
        line-height:1.6;
      "
    >
      ${mensagem}
    </p>


    <div
      style="
        margin:30px 0;
        padding:20px;
        text-align:center;
        background:#0f172a;
        border:1px solid #334155;
        border-radius:12px;
      "
    >

      <span
        style="
          display:block;
          color:#94a3b8;
          font-size:13px;
          margin-bottom:8px;
        "
      >
        Seu código
      </span>


      <strong
        style="
          display:block;
          color:#f97316;
          font-size:36px;
          letter-spacing:8px;
        "
      >
        ${codigo}
      </strong>

    </div>


    <p
      style="
        color:#94a3b8;
        font-size:14px;
        line-height:1.6;
      "
    >
      Este código é temporário e expira em 10 minutos.
    </p>


    <p
      style="
        color:#94a3b8;
        font-size:14px;
        line-height:1.6;
      "
    >
      Se você não solicitou esta ação, ignore este e-mail.
    </p>


    <hr
      style="
        border:0;
        border-top:1px solid #1e293b;
        margin:30px 0;
      "
    >


    <p
      style="
        color:#64748b;
        font-size:12px;
        text-align:center;
      "
    >
      Futlance - Futebol em um só lugar
    </p>

  </div>

</body>

</html>

`


  // ==========================================================
  // TEXTO
  // ==========================================================

  const texto = `

Futlance

${titulo}

Olá${nome ? `, ${nome}` : ""}.

${mensagem}

Seu código: ${codigo}

Este código expira em 10 minutos.

Se você não solicitou esta ação, ignore este e-mail.

Futlance - Futebol em um só lugar

`


  // ==========================================================
  // ENVIAR
  // ==========================================================

  return enviarEmail({

    para,

    nome,

    assunto,

    html,

    texto

  })

}