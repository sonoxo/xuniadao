# XUNI Game Engine

XUNI is a local-first game-engine project with **Xbox as the primary native platform target** and the browser build as the free, fast simulation/test harness. The first vertical slice is **Neon Deck Arena**, an original first-person free-for-all test game inspired by the interaction density of modern browser FPS reconstructions, without copying proprietary source code, maps, names, artwork, sounds, or assets.

## Engine slice
- HTML5 Canvas first-person raycasting renderer for rapid testing
- fixed collision world + ray queries
- deterministic gameplay simulation
- movement, aiming, shooting, damage, kills, deaths, respawn
- configurable weapon classes
- autonomous bots
- free-for-all scoreboard
- pause / resume / class selection
- navmesh and collision debug overlays
- pointer-lock mouse aiming
- Xbox-controller-first action mapping through the Web Gamepad API
- Xbox GDK platform contract + mock services for CI
- zero runtime dependencies for the browser harness
- Node unit tests + deterministic end-to-end gameplay/package integration test

## Xbox-first architecture

```text
XUNI Gameplay / ECS / Physics / World / UI
                  |
           XUNI Platform API
          /                 \
Browser Test Harness      Xbox Native Target
Gamepad + Canvas          D3D12.x
MockXboxPlatform          Gaming Runtime / XGameRuntime
                         XUser identity
                         XSAPI C services
                         XStore commerce/entitlements
                         XTaskQueue async work
                         MSIXVC packaging
```

Microsoft GDK binaries, private headers, credentials, sandbox data, certificates, and NDA material are intentionally **not** committed to this public repository. The native bridge is designed to compile against a licensed local GDK installation or authorized private runner.

See `platform/xbox/README.md` for the integration boundary and milestone order.

## Run browser harness
```bash
npm run dev
```
Open `http://localhost:4173`.

## Verify
```bash
npm run verify
```

The E2E test validates the complete browser package contract and runs an automated gameplay route through movement, raycasting, firing, elimination, scoring, and respawn. Platform tests separately validate the Xbox target descriptor, controller mapping, mock user lifecycle, achievement flow, entitlements, and suspend/resume behavior.

## Roadmap
D3D12 native renderer, GLTF loader, audio mixer, ECS scheduler, scene editor, navmesh generation, Xbox user/services integration, multiplayer transport, authoritative server, achievements, commerce/entitlements, suspend/resume certification flows, replay system, mod SDK, package format, visual scripting, and XUNI project CLI.

## Reference policy
The Vibe Slops project is used only as a benchmark for browser-game interaction/features. XUNI's demo is original and deliberately uses its own map, names, logic, UI, and assets.
