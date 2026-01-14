import { test, expect } from '@playwright/test';
import { encryptBytes, decryptBytes, encryptString, decryptString } from '../app/frontend/src/lib/e2ee/crypto';

test('encryptBytes produces different ciphertext and decrypts with passphrase', async () => {
  const data = new TextEncoder().encode('reference-audio').buffer;
  const encrypted = await encryptBytes(data, 'passphrase');
  expect(encrypted.cipher.byteLength).toBeGreaterThan(0);
  expect(new Uint8Array(encrypted.cipher)).not.toEqual(new Uint8Array(data));

  const decrypted = await decryptBytes(encrypted, 'passphrase');
  expect(new TextDecoder().decode(decrypted)).toBe('reference-audio');
});

test('encryptString round-trips and is passphrase-sensitive', async () => {
  const payload = await encryptString('private-note', 'passphrase');
  const decrypted = await decryptString(payload, 'passphrase');
  expect(decrypted).toBe('private-note');

  await expect(async () => decryptString(payload, 'wrong')).rejects.toThrow();
});

