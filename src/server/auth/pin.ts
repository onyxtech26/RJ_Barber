import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

// PINs are short, so a slow hash (scrypt) matters: it makes guessing all 10,000 four-digit PINs
// from a stolen database file expensive. Combined with the login lockout, that keeps PINs safe enough
// for a counter terminal. Format: scrypt$<salt hex>$<hash hex>

const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;
const KEY_LENGTH = 32;

export const PIN_PATTERN = /^\d{4,6}$/;

export async function hashPin(pin: string): Promise<string> {
  if (!PIN_PATTERN.test(pin)) throw new Error('PIN must be 4–6 digits');
  const salt = randomBytes(16);
  const hash = await scryptAsync(pin, salt, KEY_LENGTH);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export async function verifyPin(pin: string, stored: string): Promise<boolean> {
  const [algorithm, saltHex, hashHex] = stored.split('$');
  if (algorithm !== 'scrypt' || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = await scryptAsync(pin, Buffer.from(saltHex, 'hex'), expected.length);
  // Constant-time compare so response timing doesn't leak how many bytes matched.
  return timingSafeEqual(actual, expected);
}
