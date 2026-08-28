import { createHash } from 'crypto';

export type ControlRisk = 'READ' | 'WRITE' | 'CONSEQUENTIAL';
export type ControlPlaneDecision = 'ALLOW' | 'BLOCK';

export interface ControlRequest {
  requestId: string;
  actorId: string;
  adapterName: string;
  action: string;
  resource: string;
  risk: ControlRisk;
  evidence?: string[];
  approvedBy?: string;
}

export interface ControlPlaneAdapter<TResult = unknown> {
  name: string;
  allowedActions: ReadonlyArray<string>;
  execute: (request: ControlRequest) => Promise<TResult>;
}

export interface ControlEvaluation {
  decision: ControlPlaneDecision;
  reasons: string[];
}

export interface ControlReceipt {
  requestId: string;
  actorId: string;
  adapterName: string;
  action: string;
  resource: string;
  approvedBy?: string;
  executedAt: string;
  resultDigest: string;
  evidenceDigest: string;
}

export interface ControlExecution<TResult = unknown> {
  result: TResult;
  receipt: ControlReceipt;
}

const digest = (value: unknown): string =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');

const hasText = (value: string | undefined): boolean => Boolean(value && value.trim());

export const evaluateControlRequest = (
  request: ControlRequest,
  adapter: ControlPlaneAdapter<unknown>,
): ControlEvaluation => {
  const reasons: string[] = [];

  if (!hasText(request.requestId)) reasons.push('REQUEST_ID_REQUIRED');
  if (!hasText(request.actorId)) reasons.push('ACTOR_ID_REQUIRED');
  if (!hasText(request.resource)) reasons.push('RESOURCE_REQUIRED');
  if (request.adapterName !== adapter.name) reasons.push('ADAPTER_MISMATCH');
  if (!adapter.allowedActions.includes(request.action)) reasons.push('ACTION_NOT_ALLOWED');

  if (request.risk !== 'READ' && (!request.evidence || request.evidence.length === 0)) {
    reasons.push('EVIDENCE_REQUIRED');
  }

  if (request.risk === 'CONSEQUENTIAL' && !hasText(request.approvedBy)) {
    reasons.push('HUMAN_APPROVAL_REQUIRED');
  }

  return {
    decision: reasons.length === 0 ? 'ALLOW' : 'BLOCK',
    reasons,
  };
};

export const executeControlRequest = async <TResult>(
  request: ControlRequest,
  adapter: ControlPlaneAdapter<TResult>,
  now: () => Date = () => new Date(),
): Promise<ControlExecution<TResult>> => {
  const evaluation = evaluateControlRequest(
    request,
    adapter as ControlPlaneAdapter<unknown>,
  );

  if (evaluation.decision === 'BLOCK') {
    throw new Error(`CONTROL_PLANE_BLOCKED:${evaluation.reasons.join(',')}`);
  }

  const result = await adapter.execute(request);
  const executedAt = now().toISOString();
  const evidence = request.evidence || [];

  return {
    result,
    receipt: {
      requestId: request.requestId,
      actorId: request.actorId,
      adapterName: request.adapterName,
      action: request.action,
      resource: request.resource,
      approvedBy: request.approvedBy,
      executedAt,
      resultDigest: digest(result),
      evidenceDigest: digest(evidence),
    },
  };
};
