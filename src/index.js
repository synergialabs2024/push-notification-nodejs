import 'dotenv/config';
import express from 'express';
import pino from 'pino';
import { SendSchema } from './validate.js';
import { sendInChunks } from './fcmClient.js';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const app = express();

app.use(express.json({ limit: '1mb' }));

// Salud
app.get('/health', (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

/**
 * POST /send
 * body: { tokens: string[], notification: { title, body }, data?: { [k]: string } }
 * headers: Content-Type: application/json
 */
app.post('/send', async (req, res) => {
  try {
    const parsed = SendSchema.parse(req.body);

    const projectId =
      process.env.GOOGLE_PROJECT_ID ||
      process.env.GCLOUD_PROJECT ||
      process.env.FIREBASE_CONFIG?.projectId;

    if (!projectId) {
      return res
        .status(500)
        .json({ error: 'Falta GOOGLE_PROJECT_ID en variables de entorno' });
    }

    const chunkSize = Number(process.env.CHUNK_SIZE || 100);
    const concurrency = Number(process.env.CONCURRENCY || 10);

    const result = await sendInChunks({
      projectId,
      tokens: parsed.tokens,
      payload: { notification: parsed.notification, data: parsed.data },
      chunkSize,
      concurrency,
    });

    // 207 Multi-Status sería semántico, pero mandamos 200 con detalle
    return res.status(200).json({
      message: 'Procesado',
      projectId,
      chunkSize,
      concurrency,
      ...result,
    });
  } catch (err) {
    logger.error({ err }, 'Error en /send');
    if (err?.issues) {
      return res
        .status(400)
        .json({ error: 'Payload inválido', details: err.issues });
    }
    return res
      .status(500)
      .json({ error: 'Error interno', details: String(err?.message || err) });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  logger.info(`Push API escuchando en :${port}`);
});
