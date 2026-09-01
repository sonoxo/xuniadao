export class RegionRouter {
  constructor(regions = [{ id: 'local', enabled: true, capacity: 1 }]) { this.regions = regions; }

  select({ latencyByRegion = {}, preferredRegion = null } = {}) {
    const candidates = this.regions.filter(r => r.enabled !== false && (r.capacity ?? 0) > 0);
    if (!candidates.length) throw new Error('NO_REGION_CAPACITY');
    return [...candidates].sort((a,b) => {
      const ap = a.id === preferredRegion ? -25 : 0;
      const bp = b.id === preferredRegion ? -25 : 0;
      return ((latencyByRegion[a.id] ?? 999) + ap) - ((latencyByRegion[b.id] ?? 999) + bp);
    })[0];
  }
}
