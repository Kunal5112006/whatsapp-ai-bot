export default async function handler(req, res) {
  console.log("CALL WEBHOOK HIT:", req.method, req.body);

  return res.status(200).json({
    success: true,
    message: "Call trigger received",
    body: req.body
  });
}