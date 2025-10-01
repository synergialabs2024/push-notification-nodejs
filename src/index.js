import express from 'express';
import { sendNotifications } from './fcm.js';

const app = express();
app.use(express.json());

app.post('/send', async (req, res) => {
  const { tokens, title, body } = req.body;

  if (!Array.isArray(tokens) || !title || !body) {
    return res.status(400).json({ error: 'Faltan parámetros válidos' });
  }

  try {
    const failedTokens = await sendNotifications(tokens, title, body);

    res.json({
      success: tokens.length - failedTokens.length,
      failed: failedTokens,
    });
  } catch (err) {
    console.error('Error general:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en puerto ${PORT}`);
});
