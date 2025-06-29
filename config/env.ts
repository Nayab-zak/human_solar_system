import dotenv from 'dotenv';
import { z } from 'zod';

// Load .env into process.env
dotenv.config();

// Schema for all env vars
const envSchema = z.object({
  TRAIT_DIMENSIONS: z
    .string()
    .transform((v) => parseInt(v, 10))
    .refine((n) => n >= 3 && n <= 10, {
      message: 'TRAIT_DIMENSIONS must be between 3 and 10',
    }),
  ATTRACT_FORCE: z
    .string()
    .optional()
    .default('0.1')
    .transform((v) => parseFloat(v)),
  REPEL_FORCE: z
    .string()
    .optional()
    .default('1.0')
    .transform((v) => parseFloat(v)),
  DAMPING: z
    .string()
    .optional()
    .default('0.05')
    .transform((v) => parseFloat(v)),
  CENTRAL_NODE_COLOR: z.string(),
  ORBIT_NODE_COLOR: z.string(),
  FPS: z
    .string()
    .optional()
    .default('60')
    .transform((v) => parseInt(v, 10)),
  MAX_NODES: z
    .string()
    .optional()
    .default('20')
    .transform((v) => parseInt(v, 10)),
});

export type Env = z.infer<typeof envSchema>;
export const env = envSchema.parse(process.env);
