import "server-only";

/** Sessions expire this long after their last use. */
export const SESSION_TTL_MS = 30 * 60 * 1000;
/** Hard cap so a flood of "start" calls cannot grow memory without bound. */
export const MAX_SESSIONS = 500;

export interface Expiring {
  expiresAt: number;
}

/**
 * Short-lived, in-memory storage for demo sessions. Nothing is persisted: a
 * server restart, a new serverless instance or a TTL expiry all end a session.
 * Holds no learner identity. Shared by guided practice and the assessment,
 * each with its own instance so one cannot evict the other.
 */
export class TtlStore<T extends Expiring> {
  private readonly entries = new Map<string, T>();

  protected add(id: string, build: (expiresAt: number) => T, now: number): T {
    this.prune(now);
    // Map keeps insertion order, so the first key is the oldest session.
    while (this.entries.size >= MAX_SESSIONS) {
      const oldest = this.entries.keys().next().value;
      if (oldest === undefined) break;
      this.entries.delete(oldest);
    }
    const value = build(now + SESSION_TTL_MS);
    this.entries.set(id, value);
    return value;
  }

  get(id: string, now: number): T | null {
    const entry = this.entries.get(id);
    if (entry === undefined) return null;
    if (entry.expiresAt <= now) {
      this.entries.delete(id);
      return null;
    }
    entry.expiresAt = now + SESSION_TTL_MS;
    return entry;
  }

  get size(): number {
    return this.entries.size;
  }

  private prune(now: number) {
    for (const [id, e] of this.entries) {
      if (e.expiresAt <= now) this.entries.delete(id);
    }
  }
}

/** One store per server process; survives dev hot reloads. */
export function singleton<S>(key: string, make: () => S): S {
  const symbol = Symbol.for(key);
  const g = globalThis as unknown as Record<symbol, S | undefined>;
  g[symbol] ??= make();
  return g[symbol];
}
