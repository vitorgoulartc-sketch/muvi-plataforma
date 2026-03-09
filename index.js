const express = require('express');
const { DateTime } = require('luxon');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.json());

// Cofre de chaves
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'muvi_token_secreto_123';
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Inicializando o cérebro do Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// 🧠 A IDENTIDADE DA SUA PERSONA 1 (SDR)
const systemInstruction = `Você é a SDR virtual de uma agência de viagens.
Sua missão principal é AQUECER o lead e coletar dados básicos (Nome, Período da viagem e Destino).
Você é simpática, acolhedora e natural. Use frases curtas e evite blocos de texto.
REGRAS INVIOLÁVEIS:
1. NUNCA informe preços, valores ou orçamentos.
2. NUNCA garanta disponibilidade de pacotes ou voos.
3. Se o lead perguntar preço, diga que o agente humano montará a melhor opção personalizada.
Sempre finalize a mensagem de forma engajadora.`;

async function gerarRespostaGemini(mensagemCliente) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: systemInstruction
    });
    const result = await model.generateContent(mensagemCliente);
    return result.response.text();
  } catch (error) {
    console.error("Erro no Gemini:", error);
    return "Poxa, tive um pequeno branco aqui! 🤖 Nosso time já vai assumir seu atendimento.";
  }
}

app.get('/webhook', (req, res) => {
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
  if (mode && token && mode === 'subscribe' && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post('/webhook', async (req, res) => {
  const body = req.body;

  if (body.object && body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages && body.entry[0].changes[0].value.messages[0]) {
      
    const numeroCliente = body.entry[0].changes[0].value.messages[0].from;
    const textoRecebido = body.entry[0].changes[0].value.messages[0].text.body;

    // Relógio e Fuso (Brasília)
    const agora = DateTime.now().setZone('America/Sao_Paulo');
    const hora = agora.hour;
    const diaSemana = agora.weekday; 

    let modoAtendimento = "";

    // Lógica das Janelas (Verde, Amarela, Vermelha)
    if (diaSemana <= 5 && hora >= 9 && hora < 18) {
      modoAtendimento = "VERDE"; 
    } else if ((diaSemana <= 5 && (hora >= 18 && hora < 22)) || (diaSemana > 5 && hora >= 10 && hora < 18)) {
      modoAtendimento = "AMARELO"; 
    } else {
      modoAtendimento = "VERMELHO"; 
    }

    console.log(`Recebido de ${numeroCliente} no Modo ${modoAtendimento}`);

    if (modoAtendimento === "VERDE") {
      console.log("Horário Comercial: O Robô fica em silêncio. Atendimento humano.");
    } else {
      // Modos Amarelo e Vermelho: A IA SDR assume!
      const respostaIA = await gerarRespostaGemini(textoRecebido);
      await enviarMensagem(numeroCliente, respostaIA);
    }
  }
  res.sendStatus(200);
});

async function enviarMensagem(to, texto) {
  try {
    await fetch(`https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: to, text: { body: texto } })
    });
  } catch (e) {
    console.error("Erro ao enviar para WhatsApp:", e);
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 MUVI (SDR Ativada) na porta ${PORT}`));