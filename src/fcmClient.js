import { GoogleAuth } from 'google-auth-library';

const SCOPES = ['https://www.googleapis.com/auth/firebase.messaging'];

/**
 * Obtiene un access token OAuth2 para FCM HTTP v1 usando la cuenta de servicio.
 * Requiere GOOGLE_APPLICATION_CREDENTIALS (ruta al .json) o credenciales inyectadas por el entorno.
 */
export async function getAccessToken() {
  const auth = new GoogleAuth({ scopes: SCOPES });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  if (!token || !token.token) {
    throw new Error('No se pudo obtener el access token para FCM');
  }
  return token.token;
}

/**
 * Envía una notificación a UN token con FCM HTTP v1.
 * @param {string} projectId - ID del proyecto GCP (igual al de la cuenta de servicio)
 * @param {string} accessToken - OAuth2 Bearer
 * @param {object} payload - { notification: {title, body}, data? }
 * @param {string} token - device token
 * @returns {object} { ok: boolean, status: number, response?: any, error?: any }
 */
export async function sendToOneToken(projectId, accessToken, payload, token) {
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

  // URL de imagen (si viene). Se manda por 3 vías para maximizar el render:
  // 1) notification.image (estándar, background nativo)
  // 2) android.notification.image (big picture explícito en Android)
  // 3) data.image (para que la app la lea en FOREGROUND y arme la notificación
  //    local con BigPictureStyle; los valores de `data` deben ser strings).
  const image = payload.notification?.image;
  const data = {
    ...(payload.data || {}),
    ...(image ? { image } : {}),
  };

  const body = {
    message: {
      token,
      notification: payload.notification,
      ...(Object.keys(data).length ? { data } : {}),

      android: {
        notification: {
          channelId: 'default_channel_id',
          sound: 'default',
          ...(image ? { image } : {}),
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            ...(image ? { 'mutable-content': 1 } : {}),
          },
        },
        ...(image ? { fcm_options: { image } } : {}),
      },
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const content = isJson
    ? await res.json().catch(() => ({}))
    : await res.text();

  if (res.ok) {
    return { ok: true, status: res.status, response: content };
  }
  return { ok: false, status: res.status, error: content };
}

/**
 * Envía notificaciones por chunks y concurrencia limitada.
 * - chunkSize: tamaño del lote (p.ej. 100)
 * - concurrency: nº de requests simultáneas por chunk (p.ej. 10)
 * Retorna resumen con tokens fallidos para reintentos.
 */
export async function sendInChunks({
  projectId,
  tokens,
  payload,
  chunkSize = 100,
  concurrency = 10,
}) {
  const accessToken = await getAccessToken();

  const failures = [];
  let sent = 0;

  for (let i = 0; i < tokens.length; i += chunkSize) {
    const slice = tokens.slice(i, i + chunkSize);

    // cola simple de concurrencia
    let idx = 0;
    async function worker() {
      while (idx < slice.length) {
        const current = idx++;
        const token = slice[current];
        try {
          const res = await sendToOneToken(
            projectId,
            accessToken,
            payload,
            token
          );
          if (res.ok) sent += 1;
          else failures.push({ token, status: res.status, error: res.error });
        } catch (err) {
          failures.push({
            token,
            status: 0,
            error: String(err?.message || err),
          });
        }
      }
    }

    const workers = Array.from(
      { length: Math.min(concurrency, slice.length) },
      () => worker()
    );
    await Promise.all(workers);
  }

  return {
    total: tokens.length,
    sent,
    failed: failures.length,
    failures,
  };
}
