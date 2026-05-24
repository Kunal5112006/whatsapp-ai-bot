export default async function handler(req, res) {
  try {
    console.log("API HIT");

    const number =
      req.query?.number ||
      req.body?.number ||
      req.body?.phone ||
      "";

    console.log("NUMBER:", number);

    return res.status(200).json({
      success: true,
      number: number
    });

  } catch (err) {
    console.log("ERROR:", err.message);

    return res.status(500).json({
      error: err.message
    });
  }
}