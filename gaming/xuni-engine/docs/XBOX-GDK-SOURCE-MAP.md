# XUNI Xbox GDK Source Map

Xbox is the primary native platform for XUNI. Microsoft Learn is the authoritative documentation source. GPT-Doug-LLM maintains a public-source resolver in `sonoxo/gpt-doug-llm` and must never bypass Microsoft authorization controls.

## Required development stack

- Windows SDK 22000 or later
- Visual Studio 2022 or 2026 on x64 development hardware for GDK VSIX integration
- Microsoft Game Development Kit (GDK)
- Gaming Runtime
- DirectX 12.x for Xbox graphics
- GameInput
- XTaskQueue / XAsync
- XUser identity
- Xbox services / XSAPI C
- Connected Storage
- XStore / Microsoft Store integration
- Xbox multiplayer services / PlayFab where selected
- XVC console packaging and MicrosoftGame.config
- PIX for Xbox, Xbox Manager, Dev Home, Xbox Device Portal and xb* tools on licensed development hardware

## Authoritative entry points

- SDK and tools: https://learn.microsoft.com/en-us/gaming/gdk/docs/gdk-dev/get-started/overviews/sdk-and-tools?view=gdk-2604
- GDK introduction: https://learn.microsoft.com/en-us/xbox/gdk/docs/gdk-dev/intro/introduction?view=gdk-2604
- GameInput: https://learn.microsoft.com/en-us/gaming/gdk/docs/features/common/input/overviews/input-overview?view=gdk-2604
- XTaskQueue: https://learn.microsoft.com/en-us/gaming/gdk/docs/features/common/async/async-libraries/async-library-xtaskqueue?view=gdk-2604
- Connected Storage: https://learn.microsoft.com/en-us/gaming/gdk/docs/services/storage/connected-storage/live-connected-storage-nav?view=gdk-2604
- Xbox services overview: https://learn.microsoft.com/en-us/gaming/gdk/docs/services/fundamentals/live-xbl-overview?view=gdk-2604
- XSAPI C: https://learn.microsoft.com/en-us/gaming/gdk/docs/services/fundamentals/xbox-services-api/live-xsapi-flat-c?view=gdk-2604
- Console packaging: https://learn.microsoft.com/en-us/gaming/gdk/docs/features/common/packaging/overviews/packaging-getting-started-for-console?view=gdk-2604
- Packaging/testing: https://learn.microsoft.com/en-us/gaming/gdk/docs/features/common/packaging/title-packaging-streaming-install-testing?view=gdk-2604

## Restricted documentation rule

If Microsoft Learn reports that a topic requires authorization, XUNI records the dependency as `LICENSED_GDK_ACCESS_REQUIRED`. Restricted SDK headers, binaries, samples, credentials, certificates, sandbox configuration and NDA text stay on the authorized Microsoft development environment and are not copied into the public repository.

## GPT-Doug resolver

The companion GPT-Doug branch contains `xbox_gdk_docs_resolver.py` plus `knowledge/xbox_gdk_sources.json`. XUNI uses that catalog to resolve missing documentation topics to official Microsoft Learn sources and to distinguish public material from licensed-access material.
