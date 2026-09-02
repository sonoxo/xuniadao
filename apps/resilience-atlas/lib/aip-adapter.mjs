export class PalantirAdapter {
  constructor({ baseUrl = process.env.PALANTIR_BASE_URL, token = process.env.PALANTIR_TOKEN } = {}) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  get configured() {
    return Boolean(this.baseUrl && this.token);
  }

  async publishOntologyObject(envelope) {
    if (!this.configured) {
      return {
        mode: 'adapter-stub',
        published: false,
        reason: 'PALANTIR_BASE_URL and PALANTIR_TOKEN are not configured',
        envelope
      };
    }
    // Tenant-specific Ontology/OSDK routes differ. This adapter intentionally
    // requires an explicitly configured endpoint instead of guessing one.
    const endpoint = process.env.PALANTIR_ONTOLOGY_ENDPOINT;
    if (!endpoint) {
      return { mode: 'configured-no-endpoint', published: false, envelope };
    }
    const res = await fetch(new URL(endpoint, this.baseUrl), {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${this.token}` },
      body: JSON.stringify(envelope)
    });
    const body = await res.text();
    if (!res.ok) throw new Error(`Palantir adapter error ${res.status}: ${body.slice(0, 300)}`);
    return { mode: 'live', published: true, status: res.status, body: body ? JSON.parse(body) : null };
  }
}
