import { z } from 'zod';

export const SendSchema = z.object({
  tokens: z.array(z.string().min(1)).min(1, 'tokens no puede estar vacío'),
  notification: z.object({
    title: z.string().min(1),
    body: z.string().min(1),
  }),
  data: z.record(z.string(), z.string()).optional(),
});
