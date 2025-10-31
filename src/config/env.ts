import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().min(0).max(65535).default(3333),
  SERVER_URL: z.string().url().optional(),
  VAPI_API_KEY: z.string().optional(),
  VAPI_ASSISTANT_ID: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;

const env = envSchema.parse(process.env) as Env;

export { env };
