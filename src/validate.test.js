import test from 'node:test';
import assert from 'node:assert/strict';
import { SendSchema } from './validate.js';

const base = { tokens: ['tok1'], notification: { title: 'Hola', body: 'Cuerpo' } };

test('acepta notification.image como URL válida', () => {
  const parsed = SendSchema.parse({
    ...base,
    notification: { ...base.notification, image: 'https://cdn.example.com/a.png' },
  });
  assert.equal(parsed.notification.image, 'https://cdn.example.com/a.png');
});

test('permite omitir notification.image (retrocompatible)', () => {
  const parsed = SendSchema.parse(base);
  assert.equal(parsed.notification.image, undefined);
});

test('rechaza notification.image que no es URL', () => {
  assert.throws(() =>
    SendSchema.parse({
      ...base,
      notification: { ...base.notification, image: 'no-es-url' },
    }),
  );
});
