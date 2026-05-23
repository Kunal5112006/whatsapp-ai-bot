import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import OpenAI from "openai";
import mongoose from "mongoose";

dotenv.config();

const app = express();
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Error:", err.message));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/", (req, res) => {
  res.send("WhatsApp Post-Call Bot Running");
});

// Meta webhook verify
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

// WhatsApp incoming message auto-reply
app.post("/webhook", async (req, res) => {
  try {
    const message =
      req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message) return res.sendStatus(200);

    const from = message.from;
    const text = message.text?.body || "Hello";

    const ai = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful WhatsApp business assistant. Reply shortly and professionally.",
        },
        {
          role: "user",
          content: text,
        },
      ],
    });

    const reply = ai.choices[0].message.content;

    await sendWhatsAppMessage(from, reply);

    return res.sendStatus(200);
  } catch (err) {
    console.log("WhatsApp Webhook Error:", err.response?.data || err.message);
    return res.sendStatus(500);
  }
});

// Call ended webhook from MacroDroid
app.post("/call-webhook", async (req, res) => {
  try {
    const { number, status } = req.body;

    if (!number) {
      return res.status(400).send("Number missing");
    }

    const cleanNumber = number.replace("+", "").replace(/\s/g, "");

    const message =
      "Hi 👋 Thanks for calling. Sorry if I missed your call. Please reply here and I’ll help you shortly.";

    await sendWhatsAppMessage(cleanNumber, message);

    console.log("Post-call message sent to:", cleanNumber, status);

    return res.status(200).send("Message sent");
  } catch (err) {
    console.log("Call Webhook Error:", err.response?.data || err.message);
    return res.status(500).send("Error");
  }
});

async function sendWhatsAppMessage(to, message) {
  await axios.post(
    `https://graph.facebook.com/v22.0/${process.env.PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: {
        body: message,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );
}

export default app;