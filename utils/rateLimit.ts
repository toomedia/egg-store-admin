/**
 * Sehr einfaches Rate-Limit pro Admin-Sitzung, im Arbeitsspeicher.
 *
 * Bewusste Einschränkung: Der Zähler lebt in der jeweiligen Function-Instanz.
 * Bei mehreren parallelen Instanzen zählt jede für sich, das Limit ist also
 * eine Bremse gegen versehentliche Klickserien und Schleifen — keine harte
 * Garantie gegen einen entschlossenen Angreifer mit gültiger Admin-Sitzung.
 * Für eine echte Garantie bräuchte es einen geteilten Speicher (z. B. Supabase).
 */

type Bucket = { hits: number[] };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number };

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;

  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => t > cutoff);

  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    buckets.set(key, bucket);
    return { allowed: false, retryAfterSeconds };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);

  // Speicher nicht unbegrenzt wachsen lassen: leere Buckets gelegentlich räumen.
  if (buckets.size > 500) {
    for (const [k, v] of buckets) {
      if (v.hits.every((t) => t <= cutoff)) buckets.delete(k);
    }
  }

  return { allowed: true };
}
