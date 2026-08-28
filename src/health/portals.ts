export type HealthPortal = 'CLINICIAN' | 'ADMIN' | 'CLIENT';

export interface HealthPortalCapability {
  readonly id: string;
  readonly portal: HealthPortal;
  readonly route: string;
  readonly description: string;
  readonly protected: boolean;
  readonly reviewGatePossible: boolean;
}

export const HEALTH_PORTAL_CAPABILITIES: readonly HealthPortalCapability[] = [
  { id: 'clinician.chart', portal: 'CLINICIAN', route: '/clinician/clients/:clientId/chart', description: 'Assigned client chart and document metadata', protected: true, reviewGatePossible: true },
  { id: 'clinician.note', portal: 'CLINICIAN', route: '/clinician/clients/:clientId/notes/new', description: 'Create and sign clinical documentation', protected: true, reviewGatePossible: true },
  { id: 'clinician.treatment-plan', portal: 'CLINICIAN', route: '/clinician/clients/:clientId/treatment-plan', description: 'Treatment-plan lifecycle', protected: true, reviewGatePossible: true },
  { id: 'admin.roi', portal: 'ADMIN', route: '/admin/disclosures', description: 'Release-of-information approval queue', protected: true, reviewGatePossible: true },
  { id: 'admin.audit', portal: 'ADMIN', route: '/admin/audit', description: 'Audit and access-review console', protected: true, reviewGatePossible: true },
  { id: 'admin.compliance', portal: 'ADMIN', route: '/admin/compliance', description: 'Control, evidence, risk, and attestation console', protected: true, reviewGatePossible: false },
  { id: 'admin.incidents', portal: 'ADMIN', route: '/admin/incidents', description: 'Security and privacy incident lifecycle', protected: true, reviewGatePossible: true },
  { id: 'client.records', portal: 'CLIENT', route: '/client/records', description: 'Controlled client records-access workflow', protected: true, reviewGatePossible: true },
  { id: 'client.consents', portal: 'CLIENT', route: '/client/consents', description: 'Consent and authorization management', protected: true, reviewGatePossible: true },
  { id: 'client.signatures', portal: 'CLIENT', route: '/client/documents/:documentId/sign', description: 'Authenticated document signature', protected: true, reviewGatePossible: false },
] as const;

export const HEALTH_PORTAL_RUNTIME = {
  version: '0.2.0',
  portals: ['CLINICIAN', 'ADMIN', 'CLIENT'] as const,
  capabilityCount: HEALTH_PORTAL_CAPABILITIES.length,
  frontendImplementationStatus: 'CONTRACT_READY',
  runtimeApiRequired: true,
} as const;
