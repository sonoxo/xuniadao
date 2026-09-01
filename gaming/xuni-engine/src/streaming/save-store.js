import { createHash } from 'node:crypto';

export class SaveStore {
  constructor() { this.records = new Map(); }

  key(playerId, titleId) { return `${playerId}:${titleId}`; }

  put(playerId, titleId, state) {
    const json = JSON.stringify(state ?? {});
    const record = {
      playerId,
      titleId,
      state: JSON.parse(json),
      etag: createHash('sha256').update(json).digest('hex'),
      updatedAt: Date.now()
    };
    this.records.set(this.key(playerId, titleId), record);
    return structuredClone(record);
  }

  get(playerId, titleId) {
    const record = this.records.get(this.key(playerId, titleId));
    return record ? structuredClone(record) : null;
  }
}
