# XUNI Game Engine + Streaming Core

XUNI is an Xbox-first game-engine foundation with a free local-first cloud streaming stack. The browser harness and **Neon Deck Arena** remain the fast iteration target while the platform contracts are designed to map onto licensed Xbox/GDK and future GPU streaming hosts.

## Engine slice
- HTML5 Canvas first-person raycasting renderer
- fixed collision world + ray queries
- deterministic gameplay simulation
- movement, aiming, shooting, damage, kills, deaths, respawn
- configurable weapon classes and autonomous bots
- free-for-all scoreboard, pause / resume / class selection
- Xbox-controller-first browser input mapping
- zero runtime dependencies

## XUNI Streaming Core
The first xCloud-class vertical slice now implements the complete local session loop:

```text
PLAY
 -> entitlement gate
 -> session broker
 -> regional placement
 -> host allocation
 -> remote game runtime
 -> live stream events
 -> controller/input return channel
 -> QoS telemetry
 -> cloud save
 -> suspend
 -> host release
 -> resume on another host
 -> terminate
```

Implemented services:
- session lifecycle: `QUEUED -> ALLOCATING -> BOOTING -> READY -> STREAMING -> SUSPENDING -> SUSPENDED -> TERMINATED`
- finite host-pool allocation and release
- regional latency/capacity router
- deterministic isolated remote-game host
- ordered input channel with stale-packet rejection
- local SSE state-stream reference transport
- browser streaming client with keyboard/Xbox-style gamepad input
- adaptive QoS profiles for latency, packet loss and bandwidth
- session startup/input/frame telemetry
- cloud save snapshots with SHA-256 integrity tags
- disconnect/suspend/resume state handoff
- transport capability registry for local stream, WebRTC and licensed Xbox streaming runtime
- local-only HTTP control plane on `127.0.0.1`

The current free transport streams deterministic game state for architecture and CI validation. WebRTC video/audio and licensed Xbox game-streaming transports remain separate adapters so real encoders/runtimes can replace the reference transport without changing session, save, entitlement or lifecycle semantics.

## Xbox-first platform contract
The public repository contains only XUNI-owned adapters and mocks. Licensed Microsoft GDK binaries, private headers, NDA documentation, credentials, certificates and signing material are never committed here.

Target platform model:
- D3D12.x renderer target
- Gaming Runtime bootstrap
- XUser identity
- XSAPI C service context
- XStore entitlements/commerce boundary
- XTaskQueue async boundary
- Xbox console package/deployment boundary
- suspend/resume lifecycle
- `MockXboxPlatform` for CI and free local development

## Quantum / resilient-systems simulation layer
The image-inspired systems are deterministic game/simulation mechanics only:
- GPS-denied zones
- inertial navigation drift/recovery
- confidence-weighted sensor fusion
- magnetic anomaly sensor mock
- mass/tunnel anomaly sensor mock
- secure multi-hop communications mesh
- simulation-only `QuantumCloudMock`

## Run the local cloud
```bash
npm run stream
```
The control plane binds to `http://127.0.0.1:8787`.

In another terminal:
```bash
npm run dev
```
Open `http://localhost:4173/streaming-client.html` and press **PLAY**.

## Verify
```bash
npm run verify
```

Verification covers the engine, Xbox platform contract, simulation systems, streaming broker, host capacity, QoS, region routing, transport boundaries and a full remote-session E2E route through play -> input -> save -> suspend -> resume -> terminate.

## Scale roadmap
Next production layers are hardware video/audio capture + encoding, WebRTC/QUIC media transport, distributed host agents, container/VM isolation, durable database/object storage, autoscaling, region health/capacity forecasting, multiplayer co-placement, title image distribution, signed build ingestion, anti-cheat integrity signals, observability, device clients and the Zyra operator/developer control plane.

## Reference policy
External references are used only as feature/UX or architectural benchmarks. XUNI uses original code, maps, names, UI, logic and assets.
