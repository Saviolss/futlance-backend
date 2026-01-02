import dotenv from "dotenv"
import app from "./app.js"

dotenv.config()

const PORTA = process.env.PORT || 3333

app.listen(PORTA, () => {
  console.log(`🚀 Servidor rodando na porta ${PORTA}`)
})
