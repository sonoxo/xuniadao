import {
  ControlExecution,
  ControlPlaneAdapter,
  ControlRequest,
  executeControlRequest,
} from './control-plane-runtime';

export interface ActionSafetyOptions {
  maxConcurrent?: number;
  timeoutMs?: number;
}

export class ActionSafetyGate {
  private readonly inFlight = new Set<string>();
  private readonly completed = new Set<string>();
  private readonly maxConcurrent: number;
  private readonly timeoutMs: number;

  constructor(options: ActionSafetyOptions = {}) {
    this.maxConcurrent = options.maxConcurrent || 8;
    this.timeoutMs = options.timeoutMs || 15000;

    if (this.maxConcurrent < 1) throw new Error('MAX_CONCURRENT_MUST_BE_POSITIVE');
    if (this.timeoutMs < 1) throw new Error('TIMEOUT_MUST_BE_POSITIVE');
  }

  async execute<TResult>(
    request: ControlRequest,
    adapter: ControlPlaneAdapter<TResult>,
    now: () => Date = () => new Date(),
  ): Promise<ControlExecution<TResult>> {
    if (this.completed.has(request.requestId)) {
      throw new Error('DUPLICATE_REQUEST_ALREADY_COMPLETED');
    }

    if (this.inFlight.has(request.requestId)) {
      throw new Error('DUPLICATE_REQUEST_IN_FLIGHT');
    }

    if (this.inFlight.size >= this.maxConcurrent) {
      throw new Error('ACTION_CAPACITY_REACHED');
    }

    this.inFlight.add(request.requestId);

    let timer: ReturnType<typeof setTimeout> | undefined;

    try {
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error('ACTION_TIMEOUT')),
          this.timeoutMs,
        );
      });

      const execution = await Promise.race([
        executeControlRequest(request, adapter, now),
        timeout,
      ]);

      this.completed.add(request.requestId);
      return execution;
    } finally {
      if (timer) clearTimeout(timer);
      this.inFlight.delete(request.requestId);
    }
  }

  hasCompleted(requestId: string): boolean {
    return this.completed.has(requestId);
  }

  activeCount(): number {
    return this.inFlight.size;
  }
}
