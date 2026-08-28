import {
  validateClinicalDocument,
  validateHealthSignature,
} from '../lib/glass-onion-health';
import type {
  ClinicalDocument,
  ClinicalDocumentType,
  HealthDataClass,
  HealthSignature,
} from '../lib/glass-onion-health';
import type { ProtectedObjectStore } from './storage';

export interface ManagedClinicalDocument extends ClinicalDocument {
  readonly amendsDocumentId?: string;
  readonly archivedAt?: string;
}

export interface CreateClinicalDraftInput {
  readonly id: string;
  readonly clientId: string;
  readonly encounterId?: string;
  readonly type: ClinicalDocumentType;
  readonly dataClass: HealthDataClass;
  readonly title: string;
  readonly authorId: string;
  readonly createdAt: string;
  readonly version: string;
  readonly retentionPolicyId: string;
  readonly content: string | Buffer;
  readonly contentType: string;
  readonly keyId: string;
  readonly provenance: readonly string[];
  readonly amendsDocumentId?: string;
}

export interface SignedDocumentResult {
  readonly document: ManagedClinicalDocument;
  readonly signature: HealthSignature;
}

const payloadObjectId = (documentId: string, version: string): string => `health-document:${documentId}:v:${version}`;

export class HealthEFileService {
  private readonly documents = new Map<string, ManagedClinicalDocument>();
  private readonly signatures = new Map<string, HealthSignature>();

  constructor(private readonly store: ProtectedObjectStore) {}

  createDraft(input: CreateClinicalDraftInput): ManagedClinicalDocument {
    if (this.documents.has(input.id)) throw new Error('HEALTH_DOCUMENT_ID_EXISTS');
    const objectId = payloadObjectId(input.id, input.version);
    const metadata = this.store.write({
      objectId,
      clientId: input.clientId,
      dataClass: input.dataClass,
      contentType: input.contentType,
      createdAt: input.createdAt,
      version: input.version,
      keyId: input.keyId,
      plaintext: input.content,
      provenance: input.provenance,
    });
    const document: ManagedClinicalDocument = {
      id: input.id,
      clientId: input.clientId,
      encounterId: input.encounterId,
      type: input.type,
      dataClass: input.dataClass,
      title: input.title,
      authorId: input.authorId,
      createdAt: input.createdAt,
      version: input.version,
      status: 'DRAFT',
      protectedPayloadRef: `protected://${metadata.objectId}`,
      retentionPolicyId: input.retentionPolicyId,
      provenance: input.provenance,
      amendsDocumentId: input.amendsDocumentId,
    };
    validateClinicalDocument(document);
    if (input.amendsDocumentId) {
      const original = this.documents.get(input.amendsDocumentId);
      if (!original || original.status === 'DRAFT') throw new Error('HEALTH_AMENDMENT_ORIGINAL_MUST_BE_FINALIZED');
      if (original.clientId !== document.clientId) throw new Error('HEALTH_AMENDMENT_CLIENT_MISMATCH');
    }
    this.documents.set(document.id, document);
    return document;
  }

  signDocument(documentId: string, signatureInput: Omit<HealthSignature, 'documentHash' | 'documentVersion'>): SignedDocumentResult {
    const current = this.requireDocument(documentId);
    if (current.status !== 'DRAFT') throw new Error('HEALTH_ONLY_DRAFT_CAN_BE_SIGNED');
    if (!current.protectedPayloadRef) throw new Error('HEALTH_DOCUMENT_PAYLOAD_REQUIRED');
    const objectId = current.protectedPayloadRef.replace('protected://', '');
    const metadata = this.store.metadata(objectId);
    const signature: HealthSignature = {
      ...signatureInput,
      documentId: current.id,
      documentVersion: current.version,
      documentHash: metadata.plaintextSha256,
    };
    validateHealthSignature(signature);
    if (signature.signerId !== current.authorId && signature.signerRole !== 'SUPERVISOR') throw new Error('HEALTH_DOCUMENT_SIGNER_NOT_AUTHORIZED');
    const signed: ManagedClinicalDocument = {
      ...current,
      status: current.amendsDocumentId ? 'AMENDED' : 'SIGNED',
      contentHash: metadata.plaintextSha256,
    };
    validateClinicalDocument(signed);
    this.documents.set(signed.id, signed);
    this.signatures.set(signature.id, signature);
    return { document: signed, signature };
  }

  createAmendment(input: CreateClinicalDraftInput): ManagedClinicalDocument {
    if (!input.amendsDocumentId) throw new Error('HEALTH_AMENDMENT_ORIGINAL_REQUIRED');
    return this.createDraft(input);
  }

  archiveDocument(documentId: string, archivedAt: string): ManagedClinicalDocument {
    const current = this.requireDocument(documentId);
    if (current.status === 'DRAFT') throw new Error('HEALTH_DRAFT_CANNOT_BE_ARCHIVED');
    if (!archivedAt.trim()) throw new Error('HEALTH_ARCHIVE_TIME_REQUIRED');
    const archived: ManagedClinicalDocument = { ...current, status: 'ARCHIVED', archivedAt };
    this.documents.set(documentId, archived);
    return archived;
  }

  getDocument(documentId: string): ManagedClinicalDocument {
    return this.requireDocument(documentId);
  }

  readContent(documentId: string): Buffer {
    const document = this.requireDocument(documentId);
    if (!document.protectedPayloadRef) throw new Error('HEALTH_DOCUMENT_PAYLOAD_REQUIRED');
    return this.store.read(document.protectedPayloadRef.replace('protected://', ''));
  }

  listClientDocuments(clientId: string): readonly ManagedClinicalDocument[] {
    return Array.from(this.documents.values()).filter((document) => document.clientId === clientId);
  }

  listSignatures(documentId: string): readonly HealthSignature[] {
    return Array.from(this.signatures.values()).filter((signature) => signature.documentId === documentId);
  }

  private requireDocument(documentId: string): ManagedClinicalDocument {
    const document = this.documents.get(documentId);
    if (!document) throw new Error('HEALTH_DOCUMENT_NOT_FOUND');
    return document;
  }
}

export const HEALTH_EFILE_RUNTIME = {
  version: '0.2.0',
  protectedPayloadsOnly: true,
  draftSignLifecycle: true,
  signedHashBinding: true,
  appendOnlyAmendments: true,
  archiveSupported: true,
  directDeleteSupported: false,
} as const;
