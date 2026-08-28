import { ActionProofEntry, ActionProofLog } from './action-proof';
import { ActionSafetyGate, ActionSafetyOptions } from './action-safety';
import {
  ControlExecution,
  ControlPlaneAdapter,
  ControlRequest,
} from './control-plane-runtime';

export type ActionMode = 'NORMAL' | 'READ_ONLY' | 'STOPPED';

export class GuardedActionRunner {
  private mode: ActionMode = 'NORMAL';
  private readonly safety: ActionSafetyGate;
  private readonly proofs: ActionProofLog;

  constructor(
    safetyOptions: ActionSafetyOptions = {},
    proofs: ActionProofLog = new ActionProofLog(),
  ) {
    this.safety = new ActionSafetyGate(safetyOptions);
    this.proofs = proofs;
  }

  setMode(mode: ActionMode): void {
    this.mode = mode;
  }

  getMode(): ActionMode {
    return this.mode;
  }

  async execute<TResult>(
    request: ControlRequest,
    adapter: ControlPlaneAdapter<TResult>,
    now: () => Date = () => new Date(),
  ): Promise<ControlExecution<TResult>> {
    if (this.mode === 'STOPPED') {
      throw new Error('ALL_ACTIONS_STOPPED');
    }

    if (this.mode === 'READ_ONLY' && request.risk !== 'READ') {
      throw new Error('WRITE_ACTIONS_STOPPED');
    }

    const execution = await this.safety.execute(request, adapter, now);
    this.proofs.append(execution.receipt);
    return execution;
  }

  history(): ActionProofEntry[] {
    return this.proofs.list();
  }

  verifyHistory(): boolean {
    return this.proofs.verify();
  }

  activeCount(): number {
    return this.safety.activeCount();
  }
}
