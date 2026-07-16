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

    // // ============ SOLO PARA PRUEBAS — COMENTAR / ELIMINAR EN PROD ============
    // // Limita el envío a una allowlist fija de tokens de prueba: aunque el
    // // request traiga muchos tokens (los que arma la OFI desde el ERP), solo se
    // // enviará a los que estén en esta lista. Dejar comentado el bloque en prod.
    // const TEST_ALLOWED_TOKENS = [
    //   'REEMPLAZA_CON_TU_DEVICE_TOKEN_DE_PRUEBA',
    //   // 'otro_device_token_de_prueba',
    // ];
    // parsed.tokens = parsed.tokens.filter((t) => TEST_ALLOWED_TOKENS.includes(t));
    // // Alternativa: forzar SIEMPRE a estos tokens ignorando el request:
    // // parsed.tokens = TEST_ALLOWED_TOKENS;
    // logger.warn(
    //   { count: parsed.tokens.length },
    //   '[TEST] envío limitado a allowlist de prueba — COMENTAR EN PROD',
    // );
    // // ========================================================================

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
