import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

import type { HealthDataClass } from '../lib/glass-onion-health';
import type { ProtectedObjectMetadata } from './types';

export interface ProtectedWriteRequest {
  readonly objectId: string;
  readonly clientId: string;
  readonly dataClass: HealthDataClass;
  readonly contentType: string;
  readonly createdAt: string;
  readonly version: string;
  readonly keyId: string;
  readonly plaintext: string | Buffer;
  readonly provenance: readonly string[];
}

export interface ProtectedObjectStore {
  write(request: ProtectedWriteRequest): ProtectedObjectMetadata;
  read(objectId: string): Buffer;
  metadata(objectId: string): ProtectedObjectMetadata;
  exists(objectId: string): boolean;
}

export interface EnvelopeKeyProvider {
  getKey(keyId: string): Buffer;
}

export class StaticEnvelopeKeyProvider implements EnvelopeKeyProvider {
  constructor(private readonly keys: Readonly<Record<string, Buffer>>) {}

  getKey(keyId: string): Buffer {
    const key = this.keys[keyId];
    if (!key) throw new Error('HEALTH_STORAGE_KEY_NOT_FOUND');
    if (key.length !== 32) throw new Error('HEALTH_STORAGE_AES256_KEY_REQUIRED');
    return key;
  }
}

interface EncryptedObject {
  readonly metadata: ProtectedObjectMetadata;
  readonly iv: string;
  readonly authenticationTag: string;
  readonly ciphertext: string;
}

const sha256 = (value: Buffer): string => createHash('sha256').update(value).digest('hex');

export class MemoryProtectedObjectStore implements ProtectedObjectStore {
  private readonly objects = new Map<string, EncryptedObject>();

  constructor(private readonly keyProvider: EnvelopeKeyProvider) {}

  write(request: ProtectedWriteRequest): ProtectedObjectMetadata {
    if (!request.objectId.trim() || !request.clientId.trim() || !request.keyId.trim()) throw new Error('HEALTH_STORAGE_IDENTITY_REQUIRED');
    if (!request.contentType.trim() || !request.version.trim() || request.provenance.length === 0) throw new Error('HEALTH_STORAGE_METADATA_REQUIRED');
    if (this.objects.has(request.objectId)) throw new Error('HEALTH_STORAGE_IMMUTABLE_OBJECT_EXISTS');
    const plaintext = typeof request.plaintext === 'string' ? Buffer.from(request.plaintext, 'utf8') : Buffer.from(request.plaintext);
    const key = this.keyProvider.getKey(request.keyId);
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const authenticationTag = cipher.getAuthTag();
    const metadata: ProtectedObjectMetadata = {
      objectId: request.objectId,
      clientId: request.clientId,
      dataClass: request.dataClass,
      contentType: request.contentType,
      createdAt: request.createdAt,
      version: request.version,
      keyId: request.keyId,
      plaintextSha256: sha256(plaintext),
      provenance: request.provenance,
    };
    this.objects.set(request.objectId, {
      metadata,
      iv: iv.toString('base64'),
      authenticationTag: authenticationTag.toString('base64'),
      ciphertext: ciphertext.toString('base64'),
    });
    return metadata;
  }

  read(objectId: string): Buffer {
    const object = this.objects.get(objectId);
    if (!object) throw new Error('HEALTH_STORAGE_OBJECT_NOT_FOUND');
    const key = this.keyProvider.getKey(object.metadata.keyId);
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(object.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(object.authenticationTag, 'base64'));
    const plaintext = Buffer.concat([decipher.update(Buffer.from(object.ciphertext, 'base64')), decipher.final()]);
    if (sha256(plaintext) !== object.metadata.plaintextSha256) throw new Error('HEALTH_STORAGE_INTEGRITY_FAILURE');
    return plaintext;
  }

  metadata(objectId: string): ProtectedObjectMetadata {
    const object = this.objects.get(objectId);
    if (!object) throw new Error('HEALTH_STORAGE_OBJECT_NOT_FOUND');
    return object.metadata;
  }

  exists(objectId: string): boolean {
    return this.objects.has(objectId);
  }
}

export const HEALTH_STORAGE_RUNTIME = {
  version: '0.2.0',
  protectedStoreInterface: true,
  referenceCipher: 'AES-256-GCM',
  plaintextIntegrityHash: 'SHA-256',
  immutableObjectIds: true,
  productionKeyProviderRequired: true,
  productionPersistentStoreRequired: true,
} as const;
