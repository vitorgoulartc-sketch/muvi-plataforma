const express = require("express");
const app = express();
app.use(express.json());

const VERIFY_TOKEN = "muvi_token_secreto_123";

// Rota de Verificação (GET)
app.get("/webhook", (req, res) => {
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Rota de Recebimento (POST)
app.post("/webhook", (req, res) => {
  console.log("📩 MENSAGEM RECEBIDA DO WHATSAPP!");
  console.log(JSON.stringify(req.body, null, 2)); 
  res.sendStatus(200);
});

app.listen(3000, () => {
  console.log("🚀 Servidor MUVI online na porta 3000!");
});