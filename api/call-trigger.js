export default async function handler(req, res) {
  const number = req.query.number || req.body?.number || req.body?.phone;

  if (!number) {
    return res.status(400).json({
      success: false,
      message: "No number received"
    });
  }

  console.log("CALL TRIGGER NUMBER:", number);

  return res.status(200).json({
    success: true,
    message: "Call trigger received",
    number
  });
}