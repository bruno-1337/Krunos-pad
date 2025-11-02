import { z } from 'zod';

export const passwordSchema = z.object({
  password: z.string().min(4).max(128)
});

export const padPathSchema = z.string().min(1).max(1000);

export type PasswordInput = z.infer<typeof passwordSchema>;

