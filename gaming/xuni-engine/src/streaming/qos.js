const avg = values => values.length ? values.reduce((a,b)=>a+b,0)/values.length : 0;

export function selectStreamProfile({ rttMs = 25, packetLoss = 0, bandwidthMbps = 20 } = {}) {
  if (packetLoss > 0.08 || rttMs > 180 || bandwidthMbps < 4) {
    return { width: 1280, height: 720, fps: 30, bitrateKbps: 2800, codec: 'h264', tier: 'survival' };
  }
  if (packetLoss > 0.03 || rttMs > 90 || bandwidthMbps < 10) {
    return { width: 1280, height: 720, fps: 60, bitrateKbps: 5000, codec: 'h264', tier: 'balanced' };
  }
  return { width: 1920, height: 1080, fps: 60, bitrateKbps: 10000, codec: 'h264', tier: 'quality' };
}

export function summarizeTelemetry(session) {
  const input = session.telemetry?.inputSamples ?? [];
  const frames = session.telemetry?.frameSamples ?? [];
  return {
    startupMs: session.telemetry?.startupMs ?? null,
    avgInputLatencyMs: Math.round(avg(input) * 100) / 100,
    avgEncodeMs: Math.round(avg(frames.map(x => x.encodeMs ?? 0)) * 100) / 100,
    avgRttMs: Math.round(avg(frames.map(x => x.rttMs ?? 0)) * 100) / 100,
    avgPacketLoss: Math.round(avg(frames.map(x => x.packetLoss ?? 0)) * 10000) / 10000,
    samples: frames.length
  };
}
