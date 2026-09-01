export type SecurityMode = 'ASSESS' | 'PENTEST' | 'SIMULATE';
export type SecurityRisk = 'PASSIVE' | 'DISCOVERY' | 'SAFE_ACTIVE' | 'LAB_ACTIVE';
export type SecurityTargetType = 'url' | 'host' | 'cidr';

export interface SecurityTarget {
  type: SecurityTargetType;
  value: string;
}

export interface SecurityEngagement {
  schemaVersion: 'xunia.security.engagement/v1';
  engagementId: string;
  owner: string;
  mode: SecurityMode;
  startsAt: string;
  endsAt: string;
  targets: SecurityTarget[];
  exclusions?: SecurityTarget[];
  allowedChecks: string[];
  maxRequestsPerSecond: number;
  maxConcurrency: number;
  destructiveAllowed: false;
  authorizationReference: string;
}

export interface SecurityActionRequest {
  target: SecurityTarget;
  check: string;
  risk: SecurityRisk;
  requestedConcurrency?: number;
  requestedRequestsPerSecond?: number;
}

export interface SecurityAuthorizationDecision {
  allowed: boolean;
  code:
    | 'AUTHORIZED'
    | 'INVALID_WINDOW'
    | 'OUTSIDE_AUTHORIZED_WINDOW'
    | 'TARGET_OUT_OF_SCOPE'
    | 'TARGET_EXCLUDED'
    | 'CHECK_NOT_ALLOWED'
    | 'RISK_NOT_ALLOWED_FOR_MODE'
    | 'RATE_LIMIT_EXCEEDED'
    | 'CONCURRENCY_LIMIT_EXCEEDED'
    | 'DESTRUCTIVE_ACTION_DENIED';
  engagementId: string;
}

function canonicalTarget(target: SecurityTarget): string {
  const raw = target.value.trim().toLowerCase();
  if (target.type === 'url') {
    try {
      const url = new URL(raw);
      const path = url.pathname === '/' ? '' : url.pathname.replace(/\/$/, '');
      return `${url.protocol}//${url.host}${path}`;
    } catch (_) {
      return raw.replace(/\/$/, '');
    }
  }
  return raw;
}

function targetMatches(allowed: SecurityTarget, requested: SecurityTarget): boolean {
  const a = canonicalTarget(allowed);
  const r = canonicalTarget(requested);
  if (allowed.type !== requested.type) return false;
  if (a === r) return true;

  if (allowed.type === 'url') {
    return r.startsWith(`${a}/`);
  }

  if (allowed.type === 'host' && a.startsWith('*.')) {
    const suffix = a.slice(1);
    return r.endsWith(suffix) && r !== suffix.slice(1);
  }

  return false;
}

function riskAllowed(mode: SecurityMode, risk: SecurityRisk): boolean {
  if (mode === 'ASSESS') return risk === 'PASSIVE' || risk === 'DISCOVERY';
  if (mode === 'PENTEST') return risk !== 'LAB_ACTIVE';
  return true;
}

export function validateSecurityEngagement(engagement: SecurityEngagement): void {
  if (engagement.schemaVersion !== 'xunia.security.engagement/v1') {
    throw new Error('UNSUPPORTED_SECURITY_ENGAGEMENT_SCHEMA');
  }
  if (!engagement.engagementId.trim()) throw new Error('ENGAGEMENT_ID_REQUIRED');
  if (!engagement.owner.trim()) throw new Error('ENGAGEMENT_OWNER_REQUIRED');
  if (!engagement.authorizationReference.trim()) throw new Error('AUTHORIZATION_REFERENCE_REQUIRED');
  if (!engagement.targets.length) throw new Error('AUTHORIZED_TARGET_REQUIRED');
  if (!engagement.allowedChecks.length) throw new Error('ALLOWED_CHECK_REQUIRED');
  if (engagement.maxRequestsPerSecond < 1) throw new Error('INVALID_RATE_LIMIT');
  if (engagement.maxConcurrency < 1) throw new Error('INVALID_CONCURRENCY_LIMIT');
  if (engagement.destructiveAllowed !== false) throw new Error('DESTRUCTIVE_ACTIONS_MUST_BE_DISABLED');
  const start = Date.parse(engagement.startsAt);
  const end = Date.parse(engagement.endsAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) {
    throw new Error('INVALID_AUTHORIZATION_WINDOW');
  }
}

export function authorizeSecurityAction(
  engagement: SecurityEngagement,
  request: SecurityActionRequest,
  now: Date = new Date(),
): SecurityAuthorizationDecision {
  const deny = (code: SecurityAuthorizationDecision['code']): SecurityAuthorizationDecision => ({
    allowed: false,
    code,
    engagementId: engagement.engagementId,
  });

  try {
    validateSecurityEngagement(engagement);
  } catch (_) {
    return deny('INVALID_WINDOW');
  }

  const timestamp = now.getTime();
  if (timestamp < Date.parse(engagement.startsAt) || timestamp > Date.parse(engagement.endsAt)) {
    return deny('OUTSIDE_AUTHORIZED_WINDOW');
  }

  if ((engagement.exclusions || []).some((target) => targetMatches(target, request.target))) {
    return deny('TARGET_EXCLUDED');
  }

  if (!engagement.targets.some((target) => targetMatches(target, request.target))) {
    return deny('TARGET_OUT_OF_SCOPE');
  }

  if (!engagement.allowedChecks.includes(request.check)) return deny('CHECK_NOT_ALLOWED');
  if (!riskAllowed(engagement.mode, request.risk)) return deny('RISK_NOT_ALLOWED_FOR_MODE');
  if ((request.requestedRequestsPerSecond || 1) > engagement.maxRequestsPerSecond) {
    return deny('RATE_LIMIT_EXCEEDED');
  }
  if ((request.requestedConcurrency || 1) > engagement.maxConcurrency) {
    return deny('CONCURRENCY_LIMIT_EXCEEDED');
  }

  return { allowed: true, code: 'AUTHORIZED', engagementId: engagement.engagementId };
}
