const express = require('express');
const app = express();
app.use(express.json());

// Puxando as chaves do cofre do Render
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'muvi_token_secreto_123';
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

app.get('/webhook', (req, res) => {
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK VERIFICADO COM SUCESSO!');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

app.post('/webhook', async (req, res) => {
  const body = req.body;

  // 🚨 NOSSA CÂMERA DE SEGURANÇA 🚨
  console.log("=== BATERAM NA PORTA! VEJA O QUE O FACEBOOK MANDOU: ===");
  console.log(JSON.stringify(body, null, 2)); 

  if (body.object) {
    if (body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages && body.entry[0].changes[0].value.messages[0]) {
      
      const numeroCliente = body.entry[0].changes[0].value.messages[0].from;
      const textoRecebido = body.entry[0].changes[0].value.messages[0].text.body;
      
      console.log(`Mensagem recebida de ${numeroCliente}: ${textoRecebido}`);

      const mensagemResposta = {
        messaging_product: 'whatsapp',
        to: numeroCliente,
        text: { body: "Olá! 🤖 Eu sou o MUVI. Meu cérebro acabou de ser ativado na nuvem com sucesso!" }
      };

      try {
        await fetch(`https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(mensagemResposta)
        });
        console.log("Resposta enviada com sucesso!");
      } catch (erro) {
        console.error("Erro ao enviar resposta:", erro);
      }
    }
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor MUVI online na porta ${PORT}`));