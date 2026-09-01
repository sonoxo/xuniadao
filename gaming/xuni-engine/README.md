# XUNI Game Engine

XUNI is an Xbox-first game-engine foundation with a free browser test harness. The first vertical slice is **Neon Deck Arena**, an original first-person free-for-all test game.

## Engine slice
- HTML5 Canvas first-person raycasting renderer
- fixed collision world + ray queries
- deterministic gameplay simulation
- movement, aiming, shooting, damage, kills, deaths, respawn
- configurable weapon classes
- autonomous bots
- free-for-all scoreboard
- pause / resume / class selection
- navmesh and collision debug overlays
- Xbox-controller-first browser input mapping
- zero runtime dependencies
- Node unit tests + deterministic end-to-end gameplay/package integration test

## Xbox-first platform contract
The public repository contains only XUNI-owned adapters and mocks. Licensed Microsoft GDK binaries, private headers, NDA documentation, credentials, certificates and signing material are never committed here.

Target platform model:
- D3D12.x renderer target
- Gaming Runtime bootstrap
- XUser identity
- XSAPI C service context
- XStore entitlements/commerce boundary
- XTaskQueue async boundary
- MSIXVC packaging boundary
- suspend/resume lifecycle
- `MockXboxPlatform` for CI and free local development

## Quantum / resilient-systems simulation layer
The image-inspired systems are implemented strictly as deterministic game/simulation mechanics, not real-world targeting or weapons software:
- GPS-denied zones
- inertial navigation drift/recovery
- confidence-weighted sensor fusion
- magnetic anomaly sensor mock
- mass/tunnel anomaly sensor mock
- secure multi-hop communications mesh
- simulation-only `QuantumCloudMock`

These mechanics are suitable for gameplay, training-sim prototypes and fictional mission systems while remaining safe to run in CI and the browser harness.

## Run
```bash
npm run dev
```
Open `http://localhost:4173`.

## Verify
```bash
npm run verify
```

The E2E test validates the browser package and an automated gameplay route through movement, raycasting, firing, elimination, scoring and respawn. Additional tests verify the Xbox platform contract and resilient-systems simulation layer.

## Architecture
```text
Xbox / Browser Input
        |
        v
XUNI Simulation -----> Collision / Raycast -----> Combat / Bots
        |                                      
        +-----> Platform Adapter (Xbox Mock/GDK)
        +-----> Resilient Systems Simulation
        |          |- GPS-denied zones
        |          |- inertial drift
        |          |- sensor fusion
        |          |- comms mesh
        |          `- quantum-cloud mock
        `-----> Renderer / HUD / Debug Overlays
```

## Roadmap
D3D12 native renderer, WebGPU test renderer, GLTF loader, audio mixer, ECS scheduler, scene editor, navmesh generation, multiplayer transport, authoritative server, replay system, mod SDK, package format, visual scripting and XUNI project CLI.

## Reference policy
External references are used only as feature/UX or conceptual benchmarks. XUNI uses original code, maps, names, UI, logic and assets.