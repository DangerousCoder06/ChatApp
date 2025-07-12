import express from "express"
import jwt from "jsonwebtoken"
const router = express.Router();

const STREAM_API_KEY = process.env.STREAM_API_KEY;
const STREAM_SECRET = process.env.STREAM_SECRET;

router.post('/get-token', (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  const token = jwt.sign({ user_id: userId }, STREAM_SECRET, {
    algorithm: 'HS256',
    expiresIn: '2d'
  });

  res.json({ token, apiKey: STREAM_API_KEY });
});

export default router
