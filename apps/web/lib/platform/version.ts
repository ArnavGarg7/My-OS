/**
 * Semantic-ish version comparison (Sprint 1.7) for the update system. Compares
 * dot-separated numeric versions; missing/blank segments are treated as 0.
 */
export function parseVersion(version: string): number[] {
  return version
    .trim()
    .split(".")
    .map((part) => {
      const n = Number.parseInt(part, 10);
      return Number.isNaN(n) ? 0 : n;
    });
}

/** Returns -1 if a < b, 0 if equal, 1 if a > b. */
export function compareVersions(a: string, b: string): -1 | 0 | 1 {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  const length = Math.max(pa.length, pb.length);
  for (let i = 0; i < length; i++) {
    const va = pa[i] ?? 0;
    const vb = pb[i] ?? 0;
    if (va > vb) return 1;
    if (va < vb) return -1;
  }
  return 0;
}

/** Is `candidate` strictly newer than `current`? */
export function isNewerVersion(candidate: string, current: string): boolean {
  return compareVersions(candidate, current) > 0;
}
