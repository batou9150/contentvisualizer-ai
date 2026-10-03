import { describe, expect, it } from 'vitest';
import { createSealer } from './crypto.ts';

const sealer = createSealer('x'.repeat(32));

describe('seal/unseal', () => {
  it('round-trips a value', () => {
    const value = { user: { id: '1' }, refreshToken: 'r' };
    expect(sealer.unseal(sealer.seal(value))).toEqual(value);
  });

  it('rejects tampered tokens', () => {
    const token = sealer.seal({ a: 1 });
    const tampered = token.slice(0, -2) + (token.endsWith('A') ? 'BB' : 'AA');
    expect(sealer.unseal(tampered)).toBeNull();
  });

  it('rejects tokens sealed with another secret', () => {
    const other = createSealer('y'.repeat(32));
    expect(sealer.unseal(other.seal({ a: 1 }))).toBeNull();
  });
});

describe('sign/verify', () => {
  it('verifies for the same subject only', () => {
    const ref = sealer.sign('interaction-123', 'user-a');
    expect(sealer.verify(ref, 'user-a')).toBe('interaction-123');
    expect(sealer.verify(ref, 'user-b')).toBeNull();
  });

  it('rejects malformed refs', () => {
    expect(sealer.verify('garbage', 'user-a')).toBeNull();
  });
});
