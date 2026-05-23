import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import OpenAI from "openai";
import mongoose from "mongoose";

dotenv.config();

const app = express();

app.use(express.json());

/* ---------------- DATABASE ---------------- */

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err.message));

/* ---------------- OPENAI ---------------- */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ---------------- HOME ---------------- */

app.get("/", (req, res) => {
  res.send("WhatsApp AI Bot Running");
});

/* ---------------- META WEBHOOK VERIFY ---------------- */

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (
    mode === "subscribe" &&
    token === process.env.VERIFY_TOKEN
  ) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

/* ---------------- WHATSAPP MESSAGE WEBHOOK ---------------- */

app.post("/webhook", async (req, res) => {
  try {
    const message =
      req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message) {
      return res.sendStatus(200);
    }

    const from = message.from;

    const text = message.text?.body || "Hello";

    const ai = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful business assistant.",
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
    console.log(err.response?.data || err.message);

    return res.sendStatus(500);
  }
});

/* ---------------- CALL END AUTO MESSAGE ---------------- */

app.get("/call-trigger", async (req, res) => {
  try {
    const number = req.query.number;

    if (!number) {
      return res.send("No Number");
    }

    const cleanNumber = number
      .replace("+", "")
      .replace(/\s/g, "");

    const message =
      "Hi 👋 Thanks for calling. Sorry I missed your call. How can I help you?";

    await sendWhatsAppMessage(cleanNumber, message);

    console.log("Auto message sent:", cleanNumber);

    return res.send("Success");
  } catch (err) {
    console.log(err.response?.data || err.message);

    return res.send("Error");
  }
});

/* ---------------- SEND WHATSAPP FUNCTION ---------------- */

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