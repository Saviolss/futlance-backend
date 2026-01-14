import { WebSocketServer } from "ws"

let wss = null

export function iniciarWebSocket(serverHttp) {
  wss = new WebSocketServer({ server: serverHttp })

  wss.on("connection", (ws) => {
    console.log("🔌 Cliente conectado ao WebSocket")

    ws.on("close", () => {
      console.log("❌ Cliente desconectado")
    })
  })

  console.log("🚀 WebSocket ativo")
}

export function emitirEvento(evento) {
  if (!wss) return

  const payload = JSON.stringify(evento)

  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(payload)
    }
  })
}
