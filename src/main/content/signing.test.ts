import { generateKeyPairSync } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { DEFAULT_CONTENT } from '@shared/content/default-content';

import {
  createPackage,
  keyPairMatches,
  loadPrivateKey,
  openPackage,
  parsePublicKey,
} from './signing';

const school = generateKeyPairSync('ed25519');
const stranger = generateKeyPairSync('ed25519');
const NOW = new Date('2026-11-09T12:00:00.000Z');

function packageText(privateKey = school.privateKey) {
  return JSON.stringify(createPackage(DEFAULT_CONTENT, privateKey, NOW));
}

describe('content package signing', () => {
  it('round-trips content signed by the school', () => {
    const result = openPackage(packageText(), school.publicKey);
    expect(result).toEqual({
      ok: true,
      content: DEFAULT_CONTENT,
      publishedAt: NOW.toISOString(),
    });
  });

  it('rejects content signed with another key', () => {
    const result = openPackage(packageText(stranger.privateKey), school.publicKey);
    expect(result.ok).toBe(false);
  });

  it('rejects a package whose content was edited after signing', () => {
    const pkg = JSON.parse(packageText()) as { payload: string };
    pkg.payload = pkg.payload.replace('Matemática I', 'Matemática X');
    expect(openPackage(JSON.stringify(pkg), school.publicKey)).toMatchObject({
      ok: false,
      message: expect.stringContaining('firma') as unknown,
    });
  });

  it('rejects a package whose date was edited after signing', () => {
    const pkg = JSON.parse(packageText()) as { publishedAt: string };
    pkg.publishedAt = '2030-01-01T00:00:00.000Z';
    expect(openPackage(JSON.stringify(pkg), school.publicKey).ok).toBe(false);
  });

  it.each(['', 'not json', '{}', '{"format":"other"}'])('rejects malformed input %j', (raw) => {
    expect(openPackage(raw, school.publicKey).ok).toBe(false);
  });

  it('rejects signed payloads that do not match the content schema', () => {
    const pkg = createPackage(
      { ...DEFAULT_CONTENT, home: { ...DEFAULT_CONTENT.home, title: '' } },
      school.privateKey,
      NOW,
    );
    expect(openPackage(JSON.stringify(pkg), school.publicKey).ok).toBe(false);
  });
});

describe('keys', () => {
  const pem = school.privateKey
    .export({
      type: 'pkcs8',
      format: 'pem',
      cipher: 'aes-256-cbc',
      passphrase: 'correct horse',
    })
    .toString();

  it('loads an encrypted private key with the right passphrase', () => {
    const result = loadPrivateKey(pem, 'correct horse');
    expect(result.ok).toBe(true);
    if (result.ok) expect(keyPairMatches(result.key, school.publicKey)).toBe(true);
  });

  it('refuses a wrong passphrase', () => {
    expect(loadPrivateKey(pem, 'wrong').ok).toBe(false);
  });

  it('detects a key that belongs to another installation', () => {
    expect(keyPairMatches(stranger.privateKey, school.publicKey)).toBe(false);
  });

  it('parses only Ed25519 public keys', () => {
    const publicPem = school.publicKey.export({ type: 'spki', format: 'pem' }).toString();
    expect(parsePublicKey(publicPem)).not.toBeNull();
    expect(parsePublicKey(null)).toBeNull();
    expect(parsePublicKey('garbage')).toBeNull();
    const rsa = generateKeyPairSync('rsa', { modulusLength: 1024 });
    expect(
      parsePublicKey(rsa.publicKey.export({ type: 'spki', format: 'pem' }).toString()),
    ).toBeNull();
  });
});
