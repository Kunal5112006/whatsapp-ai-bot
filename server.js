import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import OpenAI from "openai";
import mongoose from "mongoose";

dotenv.config();

const app = express();

app.use(express.json());

/* ---------------- MONGODB ---------------- */

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((err) => {
    console.log("MongoDB Error:", err.message);
  });

/* ---------------- OPENAI ---------------- */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ---------------- HOME ROUTE ---------------- */

app.get("/", (req, res) => {
  res.send("Server Running");
});

/* ---------------- WEBHOOK VERIFY ---------------- */

app.get("/webhook", (req, res) => {
  const verify_token = process.env.VERIFY_TOKEN;

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("Mode:", mode);
  console.log("Token:", token);
  console.log("Challenge:", challenge);

  if (mode === "subscribe" && token === verify_token) {
    console.log("Webhook Verified Successfully");

    res.status(200).send(challenge);
  } else {
    console.log("Webhook Verification Failed");

    res.sendStatus(403);
  }
});

/* ---------------- RECEIVE WHATSAPP MESSAGE ---------------- */

app.post("/webhook", async (req, res) => {
  try {
    console.log(JSON.stringify(req.body, null, 2));

    const message =
      req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (message) {
      const from = message.from;

      const text = message.text?.body || "Hello";

      console.log("Message From:", from);
      console.log("Message Text:", text);

      /* ---------- OPENAI RESPONSE ---------- */

      const ai = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a smart helpful business assistant replying on WhatsApp.",
          },
          {
            role: "user",
            content: text,
          },
        ],
      });

      const reply = ai.choices[0].message.content;

      console.log("AI Reply:", reply);

      /* ---------- SEND WHATSAPP MESSAGE ---------- */

      await axios.post(
        `https://graph.facebook.com/v22.0/${process.env.PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: "whatsapp",
          to: from,
          type: "text",
          text: {
            body: reply,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Reply Sent Successfully");
    }

    res.sendStatus(200);
  } catch (err) {
    console.log("ERROR:");
    console.log(err.response?.data || err.message);

    res.sendStatus(500);
  }
});

/* ---------------- SERVER ---------------- */

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});