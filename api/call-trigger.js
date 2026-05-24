export default function handler(req, res) {
  try {
    const number =
      req.query?.number ||
      req.body?.number ||
      req.body?.phone ||
      "";

    if (!number) {
      return res.status(400).send("No number received");
    }

    console.log("CALL TRIGGER NUMBER:", number);

    return res.status(200).send("Call trigger received: " + number);
  } catch (err) {
    console.error("CALL TRIGGER ERROR:", err);
    return res.status(500).send("Server error: " + err.message);
  }
}