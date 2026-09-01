# XUNI Xbox Platform Target

Xbox is XUNI's primary native platform. The browser build remains the zero-cost simulation/test harness; native console integration is isolated behind this platform boundary.

## Public GDK integration map

XUNI subsystem -> Microsoft GDK surface:

- engine/runtime bootstrap -> Gaming Runtime / `XGameRuntimeInitialize`
- async work -> `XTaskQueue`
- player identity/sign-in -> `XUser`
- Xbox network services -> XSAPI C API / Xbox Live context
- achievements -> Xbox services achievements
- store, DLC, licenses, trials -> `XStore` / package licensing
- console rendering -> Direct3D 12.x
- packaging -> MSIXVC/GDK packaging tools
- controller-first input -> GameInput/GDK input surface in native builds; Web Gamepad API mirrors the same XUNI action map in the browser harness
- lifecycle -> suspend/resume callbacks mapped into XUNI platform events

## Repository boundary

Do **not** commit Microsoft GDK redistributables, private headers, NDA documentation, credentials, sandbox secrets, certificates, console keys, package-signing material, or Partner Center exports to this public repository.

The public repo contains only XUNI-owned interfaces, mock implementations, tests, and integration glue that references documented GDK API names. A licensed local GDK installation supplies Microsoft binaries/headers during an Xbox build.

## Native milestone order

1. D3D12 device/swap-chain boot on Xbox GDK sample shell.
2. XUNI fixed timestep + input adapter.
3. XUser sign-in and active-user lifecycle.
4. XSAPI initialization/context and one test achievement.
5. suspend/resume and controller disconnect handling.
6. package/launch test on development hardware.
7. entitlement/XStore test SKU.
8. certification requirement test matrix.

## CI model

Public GitHub Actions validates the platform contract with `MockXboxPlatform`. Hardware/GDK validation must run on an authorized Windows/Xbox development machine or private runner with the licensed GDK installed.
