import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Small authenticated-encryption helpers (AES-256-GCM) used for the session cookie,
 * plus HMAC signing for opaque references handed to the browser.
 */
export function createSealer(secret: string) {
  const encKey = createHash('sha256').update(`enc:${secret}`).digest();
  const macKey = createHash('sha256').update(`mac:${secret}`).digest();

  return {
    seal(value: unknown): string {
      const iv = randomBytes(12);
      const cipher = createCipheriv('aes-256-gcm', encKey, iv);
      const data = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
      return Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64url');
    },

    unseal<T>(token: string): T | null {
      try {
        const buf = Buffer.from(token, 'base64url');
        const decipher = createDecipheriv('aes-256-gcm', encKey, buf.subarray(0, 12));
        decipher.setAuthTag(buf.subarray(12, 28));
        const data = Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]);
        return JSON.parse(data.toString('utf8')) as T;
      } catch {
        return null;
      }
    },

    /** Binds a value to a subject (e.g. an interaction id to a user id) so it can't be replayed by someone else. */
    sign(value: string, subject: string): string {
      const mac = createHmac('sha256', macKey).update(`${subject}\n${value}`).digest('base64url');
      return `${Buffer.from(value).toString('base64url')}.${mac}`;
    },

    verify(signed: string, subject: string): string | null {
      const [encoded, mac] = signed.split('.');
      if (!encoded || !mac) return null;
      const value = Buffer.from(encoded, 'base64url').toString('utf8');
      const expected = createHmac('sha256', macKey).update(`${subject}\n${value}`).digest();
      const given = Buffer.from(mac, 'base64url');
      return given.length === expected.length && timingSafeEqual(given, expected) ? value : null;
    },
  };
}

export type Sealer = ReturnType<typeof createSealer>;
