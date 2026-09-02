export class RemoteGameHost {
  constructor({ sessionId, initialState = null, onFrame = () => {}, fps = 20 } = {}) {
    this.sessionId = sessionId;
    this.state = initialState ?? { x: 2.5, y: 2.5, angle: 0, score: 0, frame: 0 };
    this.onFrame = onFrame;
    this.fps = fps;
    this.timer = null;
    this.lastInputSeq = -1;
  }

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), Math.round(1000 / this.fps));
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  applyInput(input = {}) {
    const seq = Number(input.seq ?? 0);
    if (seq <= this.lastInputSeq) return false;
    this.lastInputSeq = seq;
    const moveX = Math.max(-1, Math.min(1, Number(input.moveX ?? 0)));
    const moveY = Math.max(-1, Math.min(1, Number(input.moveY ?? 0)));
    const lookX = Math.max(-1, Math.min(1, Number(input.lookX ?? 0)));
    this.state.angle += lookX * 0.09;
    const c = Math.cos(this.state.angle), s = Math.sin(this.state.angle);
    this.state.x += (c * moveY - s * moveX) * 0.12;
    this.state.y += (s * moveY + c * moveX) * 0.12;
    if (input.fire) this.state.score += 1;
    return true;
  }

  tick() {
    this.state.frame += 1;
    this.onFrame({
      type: 'frame',
      sessionId: this.sessionId,
      generatedAt: Date.now(),
      state: structuredClone(this.state)
    });
  }

  snapshot() { return structuredClone(this.state); }
}
