import axios from "axios";

export default async function handler(req, res) {
  try {
    const number =
      req.query?.number ||
      req.body?.number ||
      req.body?.phone ||
      "";

    if (!number) {
      return res.status(400).json({ error: "No number received" });
    }

    const cleanNumber = String(number).replace(/\D/g, "");

    const response = await axios.post(
      `https://graph.facebook.com/v22.0/${process.env.PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: cleanNumber,
        type: "text",
        text: {
          body: "Hi 👋 Thanks for calling. Sorry I missed your call. How can I help you?",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.status(200).json({
      success: true,
      sent_to: cleanNumber,
      meta: response.data,
    });
  } catch (err) {
    return res.status(500).json({
      error: err.response?.data || err.message,
    });
  }
}