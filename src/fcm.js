import { GoogleAuth } from 'google-auth-library';
import fetch from 'node-fetch';

const SCOPES = ['https://www.googleapis.com/auth/firebase.messaging'];

const auth = new GoogleAuth({
  keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  scopes: SCOPES,
});

export async function sendNotifications(tokens, title, body) {
  const accessToken = await auth.getAccessToken();

  const failedTokens = [];

  for (const token of tokens) {
    const notificationPayload = {
      message: {
        token,
        notification: { title, body },
      },
    };

    try {
      const response = await fetch(
        `https://fcm.googleapis.com/v1/projects/${process.env.PROJECT_ID}/messages:send`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(notificationPayload),
        }
      );

      if (!response.ok) {
        failedTokens.push(token);
        const error = await response.text();
        console.error(`❌ Error en token ${token}:`, error);
      }
    } catch (err) {
      failedTokens.push(token);
      console.error(`⚠️ Excepción en token ${token}:`, err.message);
    }
  }

  return failedTokens;
}
