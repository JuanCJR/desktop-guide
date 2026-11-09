import { generateKeyPairSync } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { DEFAULT_CONTENT } from '@shared/content/default-content';

import {
  createEditorKeyFile,
  createPackage,
  keyPairMatches,
  loadPrivateKey,
  openEditorKeyFile,
  openPackage,
  parsePublicKey,
  verifyCertificate,
} from './signing';
import { createEditorKey, createMasterKey } from './test-keys';

const master = createMasterKey();
const otherMaster = createMasterKey();
const editor = createEditorKey(master.privateKey, master.publicKey, '2026-11-01T00:00:00.000Z');
const NOW = new Date('2026-11-09T12:00:00.000Z');

function packageText() {
  return JSON.stringify(createPackage(DEFAULT_CONTENT, editor.key, editor.certificate, NOW));
}

describe('editor certificates', () => {
  it('are verified with the master public key', () => {
    expect(verifyCertificate(editor.certificate, master.publicKey)).not.toBeNull();
    expect(verifyCertificate(editor.certificate, otherMaster.publicKey)).toBeNull();
  });

  it('reject a certificate whose key or date was changed', () => {
    const other = generateKeyPairSync('ed25519').publicKey.export({ type: 'spki', format: 'pem' });
    expect(
      verifyCertificate({ ...editor.certificate, publicKey: other.toString() }, master.publicKey),
    ).toBeNull();
    expect(
      verifyCertificate(
        { ...editor.certificate, issuedAt: '2030-01-01T00:00:00.000Z' },
        master.publicKey,
      ),
    ).toBeNull();
  });
});

describe('editor key files', () => {
  it('open with the right passphrase', () => {
    const opened = openEditorKeyFile(editor.fileText, editor.passphrase, master.publicKey);
    expect(opened.ok).toBe(true);
  });

  it('refuse a wrong passphrase', () => {
    expect(openEditorKeyFile(editor.fileText, 'wrong', master.publicKey)).toEqual({
      ok: false,
      message: 'La llave o la contraseña no son correctas.',
    });
  });

  it('refuse keys certified by another master', () => {
    const { fileText } = createEditorKeyFile(otherMaster.privateKey, 'edicion-47', NOW);
    expect(openEditorKeyFile(fileText, 'edicion-47', master.publicKey).ok).toBe(false);
  });

  it('refuse a file whose private key was swapped', () => {
    const intruder = generateKeyPairSync('ed25519')
      .privateKey.export({
        type: 'pkcs8',
        format: 'pem',
        cipher: 'aes-256-cbc',
        passphrase: 'edicion-47',
      })
      .toString();
    const file = { ...(JSON.parse(editor.fileText) as object), privateKey: intruder };
    expect(openEditorKeyFile(JSON.stringify(file), 'edicion-47', master.publicKey).ok).toBe(false);
  });

  it.each(['', 'nope', '{}'])('refuse malformed input %j', (raw) => {
    expect(openEditorKeyFile(raw, 'edicion-47', master.publicKey).ok).toBe(false);
  });
});

describe('content packages', () => {
  it('round-trip content signed with a certified editor key', () => {
    expect(openPackage(packageText(), master.publicKey)).toEqual({
      ok: true,
      content: DEFAULT_CONTENT,
      publishedAt: NOW.toISOString(),
      certificate: editor.certificate,
    });
  });

  it('reject packages signed by an uncertified key', () => {
    const rogue = generateKeyPairSync('ed25519').privateKey;
    const pkg = createPackage(DEFAULT_CONTENT, rogue, editor.certificate, NOW);
    expect(openPackage(JSON.stringify(pkg), master.publicKey).ok).toBe(false);
  });

  it('reject packages from another school', () => {
    expect(openPackage(packageText(), otherMaster.publicKey).ok).toBe(false);
  });

  it('reject content edited after signing', () => {
    const pkg = JSON.parse(packageText()) as { payload: string };
    pkg.payload = pkg.payload.replace('Matemática I', 'Matemática X');
    expect(openPackage(JSON.stringify(pkg), master.publicKey)).toMatchObject({
      ok: false,
      message: expect.stringContaining('firma') as unknown,
    });
  });

  it('reject a date edited after signing', () => {
    const pkg = JSON.parse(packageText()) as { publishedAt: string };
    pkg.publishedAt = '2030-01-01T00:00:00.000Z';
    expect(openPackage(JSON.stringify(pkg), master.publicKey).ok).toBe(false);
  });

  it.each(['', 'not json', '{}', '{"format":"other"}'])('reject malformed input %j', (raw) => {
    expect(openPackage(raw, master.publicKey).ok).toBe(false);
  });

  it('reject signed payloads that do not match the content schema', () => {
    const pkg = createPackage(
      { ...DEFAULT_CONTENT, home: { ...DEFAULT_CONTENT.home, title: '' } },
      editor.key,
      editor.certificate,
      NOW,
    );
    expect(openPackage(JSON.stringify(pkg), master.publicKey).ok).toBe(false);
  });
});

describe('keys', () => {
  it('load an encrypted master key and check it matches', () => {
    const loaded = loadPrivateKey(master.pem, master.passphrase);
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(keyPairMatches(loaded.key, master.publicKey)).toBe(true);
      expect(keyPairMatches(loaded.key, otherMaster.publicKey)).toBe(false);
    }
    expect(loadPrivateKey(master.pem, 'wrong').ok).toBe(false);
  });

  it('parse only Ed25519 public keys', () => {
    const publicPem = master.publicKey.export({ type: 'spki', format: 'pem' }).toString();
    expect(parsePublicKey(publicPem)).not.toBeNull();
    expect(parsePublicKey(null)).toBeNull();
    expect(parsePublicKey('garbage')).toBeNull();
    const rsa = generateKeyPairSync('rsa', { modulusLength: 1024 });
    expect(
      parsePublicKey(rsa.publicKey.export({ type: 'spki', format: 'pem' }).toString()),
    ).toBeNull();
  });
});
