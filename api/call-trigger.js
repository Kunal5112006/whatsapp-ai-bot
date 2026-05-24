import axios from "axios";

export default async function handler(req, res) {
  try {
    const number =
      req.query?.number ||
      req.body?.number ||
      req.body?.phone ||
      "";

    if (!number) {
      return res.status(400).send("No number received");
    }

    const cleanNumber = String(number)
      .replace(/\D/g, "")
      .replace(/^0+/, "");

    console.log("RAW NUMBER:", number);
    console.log("FINAL NUMBER:", cleanNumber);

    const message =
      "Hi 👋 Thanks for calling. Sorry I missed your call. How can I help you?";

    const response = await axios.post(
      `https://graph.facebook.com/v22.0/${process.env.PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: cleanNumber,
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

    console.log("WHATSAPP RESPONSE:", JSON.stringify(response.data));

    return res.status(200).send("Success: message sent to " + cleanNumber);
  } catch (err) {
    console.log(
      "CALL TRIGGER ERROR:",
      JSON.stringify(err.response?.data || err.message)
    );

    return res.status(500).send("Error sending WhatsApp message");
  }
}