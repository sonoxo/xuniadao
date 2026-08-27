# XUNIA Authenticated Browser

Command: **`/glass browse`**

The authenticated-browser layer lets ZYRA reuse a **local managed Chrome profile** so XUNIA/VA3LM can read websites in the same signed-in context as the user without exporting passwords or raw cookies.

```text
LOCAL CHROME PROFILE
  → LOCAL PROFILE IMPORT
  → MANAGED CHROME SESSION
  → HTTP/HTTPS NAVIGATION
  → AUTHENTICATED PAGE READ
  → PROVENANCE CAPTURE
  → VA3LM REASON
  → ZYRA ACTION GATE
```

Runtime implementation: [`sonoxo/zyra`](https://github.com/sonoxo/zyra) `server/managed-browser.ts`.

## Boundary

The managed browser stays on the user's machine. Chrome and the operating system continue to own credential/session decryption. XUNIA does not expose password extraction, raw-cookie export, credential export, `file:` browsing, `javascript:` URLs, arbitrary remote shell, automatic purchases, or automatic external messages.

If a copied Chrome session cannot be decrypted or has expired, the user signs in once inside the managed browser window and ZYRA reuses that managed session afterward.

Consequential actions remain human-reviewed. The initial runtime supports authenticated navigation/read access; it does not silently submit forms, buy items, send messages, or change account settings.

Machine contract: [`ecosystem/authenticated-browser.json`](../ecosystem/authenticated-browser.json)
