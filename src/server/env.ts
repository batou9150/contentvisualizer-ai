import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.string().default('development'),
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'GOOGLE_CLIENT_SECRET is required'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  ALLOWED_USERS: z.string().default(''),
  TEXT_MODEL: z.string().default('gemini-3.8-flash'),
  IMAGE_MODEL: z.string().default('gemini-3.1-flash-image'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment:\n' + z.prettifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';

const allowList = env.ALLOWED_USERS.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

/** Empty allowlist means any Google account may sign in. Entries are emails or `@domain`. */
export function isUserAllowed(email: string): boolean {
  if (allowList.length === 0) return true;
  const e = email.toLowerCase();
  return allowList.some((rule) => (rule.startsWith('@') ? e.endsWith(rule) : e === rule));
}
