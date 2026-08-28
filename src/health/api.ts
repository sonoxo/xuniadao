import type { ClinicalDocument, HealthAccessDecision } from '../lib/glass-onion-health';
import type { GovernedHealthRequest, GlassOnionHealthRuntime } from './runtime';

export type HealthApiMethod = 'GET' | 'POST' | 'PATCH';

export interface HealthApiRoute {
  readonly method: HealthApiMethod;
  readonly path: string;
  readonly purpose: string;
  readonly protected: boolean;
  readonly humanReviewPossible: boolean;
}

export const HEALTH_API_ROUTES: readonly HealthApiRoute[] = [
  { method: 'GET', path: '/health/clients/:clientId/documents', purpose: 'List client chart metadata', protected: true, humanReviewPossible: true },
  { method: 'POST', path: '/health/clients/:clientId/documents', purpose: 'Create clinical draft', protected: true, humanReviewPossible: false },
  { method: 'POST', path: '/health/documents/:documentId/sign', purpose: 'Finalize a clinical document', protected: true, humanReviewPossible: true },
  { method: 'POST', path: '/health/documents/:documentId/amend', purpose: 'Create append-only amendment', protected: true, humanReviewPossible: true },
  { method: 'POST', path: '/health/documents/:documentId/access-decision', purpose: 'Evaluate governed access', protected: true, humanReviewPossible: true },
  { method: 'POST', path: '/health/authorizations', purpose: 'Create consent or authorization', protected: true, humanReviewPossible: true },
  { method: 'POST', path: '/health/disclosures', purpose: 'Request external disclosure', protected: true, humanReviewPossible: true },
  { method: 'GET', path: '/health/audit', purpose: 'Read governed audit evidence', protected: true, humanReviewPossible: true },
  { method: 'GET', path: '/health/evidence', purpose: 'Build compliance evidence snapshot', protected: true, humanReviewPossible: false },
  { method: 'POST', path: '/health/incidents', purpose: 'Create security/privacy incident', protected: true, humanReviewPossible: true },
] as const;

export interface HealthApiAccessResponse {
  readonly requestId: string;
  readonly documentId: string;
  readonly decision: HealthAccessDecision;
}

export const decideHealthApiAccess = (
  runtime: GlassOnionHealthRuntime,
  request: GovernedHealthRequest,
): HealthApiAccessResponse => ({
  requestId: request.requestId,
  documentId: request.documentId,
  decision: runtime.authorize(request),
});

export interface ClientChartSummary {
  readonly clientId: string;
  readonly documents: readonly Pick<ClinicalDocument, 'id' | 'type' | 'dataClass' | 'title' | 'authorId' | 'createdAt' | 'version' | 'status'>[];
}

export const buildClientChartSummary = (
  runtime: GlassOnionHealthRuntime,
  clientId: string,
): ClientChartSummary => ({
  clientId,
  documents: runtime.efile.listClientDocuments(clientId).map((document) => ({
    id: document.id,
    type: document.type,
    dataClass: document.dataClass,
    title: document.title,
    authorId: document.authorId,
    createdAt: document.createdAt,
    version: document.version,
    status: document.status,
  })),
});

export const HEALTH_API_RUNTIME = {
  version: '0.2.0',
  style: 'TRANSPORT_AGNOSTIC_CONTRACTS',
  routes: HEALTH_API_ROUTES,
  deploymentAdaptersRequired: ['HTTP_SERVER', 'DATABASE', 'PERSISTENT_PROTECTED_STORE', 'PRODUCTION_IDP', 'KMS'] as const,
} as const;
