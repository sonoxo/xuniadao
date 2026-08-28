import { createHash } from 'crypto';

import { ControlReceipt } from './control-plane-runtime';

export interface ActionProofEntry {
  sequence: number;
  previousHash: string;
  receipt: ControlReceipt;
  entryHash: string;
}

const sha256 = (value: unknown): string =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');

const hashEntry = (
  sequence: number,
  previousHash: string,
  receipt: ControlReceipt,
): string => sha256({ sequence, previousHash, receipt });

export class ActionProofLog {
  private readonly entries: ActionProofEntry[] = [];

  append(receipt: ControlReceipt): ActionProofEntry {
    const previous = this.entries[this.entries.length - 1];
    const sequence = this.entries.length + 1;
    const previousHash = previous ? previous.entryHash : 'GENESIS';
    const entryHash = hashEntry(sequence, previousHash, receipt);
    const entry: ActionProofEntry = {
      sequence,
      previousHash,
      receipt: { ...receipt },
      entryHash,
    };

    this.entries.push(entry);
    return { ...entry, receipt: { ...entry.receipt } };
  }

  list(): ActionProofEntry[] {
    return this.entries.map((entry) => ({
      ...entry,
      receipt: { ...entry.receipt },
    }));
  }

  verify(): boolean {
    return ActionProofLog.verifyEntries(this.entries);
  }

  static verifyEntries(entries: ReadonlyArray<ActionProofEntry>): boolean {
    let previousHash = 'GENESIS';

    for (let index = 0; index < entries.length; index += 1) {
      const entry = entries[index];
      const expectedSequence = index + 1;

      if (entry.sequence !== expectedSequence) return false;
      if (entry.previousHash !== previousHash) return false;

      const expectedHash = hashEntry(
        entry.sequence,
        entry.previousHash,
        entry.receipt,
      );

      if (entry.entryHash !== expectedHash) return false;
      previousHash = entry.entryHash;
    }

    return true;
  }
}
