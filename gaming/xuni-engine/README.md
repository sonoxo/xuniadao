# XUNI Game Engine

XUNI is a local-first, zero-dependency browser game-engine prototype. The first vertical slice is **Neon Deck Arena**, an original first-person free-for-all test game inspired by the interaction density of modern browser FPS reconstructions, without copying proprietary source code, maps, names, artwork, sounds, or assets.

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
- pointer-lock mouse aiming
- zero runtime dependencies
- Node unit tests + deterministic end-to-end gameplay/package integration test

## Run
```bash
npm run dev
```
Open `http://localhost:4173`.

## Verify
```bash
npm run verify
```

The E2E test validates the complete browser package contract and runs an automated gameplay route through movement, raycasting, firing, elimination, scoring, and respawn.

## Architecture
```text
Input -> XUNI Simulation -> Collision/Raycast -> Combat/Bots -> Game State
                         \-> Canvas Renderer -> HUD / Score / Debug Overlays
```

## Roadmap
WebGL/WebGPU renderer, GLTF loader, audio mixer, ECS scheduler, scene editor, navmesh generation, multiplayer transport, authoritative server, replay system, mod SDK, package format, visual scripting, and XUNI project CLI.

## Reference policy
The Vibe Slops project is used only as a benchmark for browser-game interaction/features. XUNI's demo is original and deliberately uses its own map, names, logic, UI, and assets.
