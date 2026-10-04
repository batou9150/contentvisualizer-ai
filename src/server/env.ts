import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.string().default('development'),
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  GOOGLE_CLIENT_ID: z.string().default(''),
  GOOGLE_CLIENT_SECRET: z.string().default(''),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  ALLOWED_USERS: z.string().default(''),
  TEXT_MODEL: z.string().default('gemini-3.8-flash'),
  IMAGE_MODEL: z.string().default('gemini-3.1-flash-image'),
  /** Local development only: sign in with any name, visuals saved to LOCAL_DATA_DIR instead of Google Drive. */
  DEV_LOGIN: z.stringbool().default(false),
  LOCAL_DATA_DIR: z.string().default('.local-data'),
}).superRefine((e, ctx) => {
  if (e.NODE_ENV === 'production' && e.DEV_LOGIN) ctx.addIssue({ code: 'custom', path: ['DEV_LOGIN'], message: 'DEV_LOGIN must not be enabled in production' });
  if (!e.DEV_LOGIN && !(e.GOOGLE_CLIENT_ID && e.GOOGLE_CLIENT_SECRET)) {
    ctx.addIssue({ code: 'custom', path: ['GOOGLE_CLIENT_ID'], message: 'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required unless DEV_LOGIN=true' });
  }
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment:\n' + z.prettifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
export const googleLogin = !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

const allowList = env.ALLOWED_USERS.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

/** Empty allowlist means any Google account may sign in. Entries are emails or `@domain`. */
export function isUserAllowed(email: string): boolean {
  if (allowList.length === 0) return true;
  const e = email.toLowerCase();
  return allowList.some((rule) => (rule.startsWith('@') ? e.endsWith(rule) : e === rule));
}
