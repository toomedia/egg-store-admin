/**
 * Serverseitiger Zugang zu den Admin-Endpunkten von all-about-eggs.
 *
 * Der Admin-Schlüssel wird ausschließlich hier gelesen, aus einer Variable ohne
 * NEXT_PUBLIC_-Präfix. Damit kann Next.js ihn nicht in das Client-Bundle
 * schreiben. Dieses Modul darf niemals aus einer "use client"-Datei importiert
 * werden.
 *
 * Die Zielpfade sind fest verdrahtet. Es gibt bewusst keinen Weg, Pfad oder
 * Zieladresse von außen zu bestimmen — sonst wäre der Proxy ein offenes Relay
 * mit Admin-Schlüssel und das Problem nur verschoben.
 */

/** Die drei erlaubten Upstream-Pfade. Nicht erweiterbar zur Laufzeit. */
export const UPSTREAM_PATHS = {
  autoGenerate: '/api/auto-generate-preset',
  regenerate: '/api/regenerate-preset',
  backfill: '/api/backfill-preset-prompts',
} as const;

export type UpstreamPath = (typeof UPSTREAM_PATHS)[keyof typeof UPSTREAM_PATHS];

function getAdminSecret(): string | null {
  const raw = process.env.ADMIN_SECRET_KEY;
  return raw?.trim() ? raw.trim() : null;
}

/**
 * Origin von all-about-eggs. Fällt auf die alte öffentliche Variable zurück,
 * damit zwischen Deployment und Env-Pflege nichts ausfällt. Der Wert selbst
 * bleibt unverändert — die Umstellung des Ziels ist ein eigener Vorgang.
 */
function getUpstreamOrigin(): string | null {
  const raw =
    process.env.AUTO_GENERATE_API_URL || process.env.NEXT_PUBLIC_AUTO_GENERATE_API_URL;
  if (!raw?.trim()) return null;
  try {
    return new URL(raw.trim()).origin;
  } catch {
    return null;
  }
}

/**
 * Entfernt den Admin-Schlüssel aus einem Text, bevor er in ein Log geht.
 * Letzte Absicherung für den Fall, dass ein Fehlertext ihn durchreicht.
 */
function redact(text: string): string {
  const secret = getAdminSecret();
  if (!secret) return text;
  return text.split(secret).join('[REDACTED]');
}

/** Loggt eine Meldung, garantiert ohne den Schlüssel. */
export function logSafe(context: string, err: unknown): void {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[admin] ${context}: ${redact(message)}`);
}

export type UpstreamResult = {
  status: number;
  body: unknown;
};

/**
 * Ruft einen der drei festen Admin-Endpunkte auf und gibt Status und Body
 * unverändert zurück. Der Schlüssel verlässt diese Funktion nicht.
 */
export async function callUpstream(
  path: UpstreamPath,
  payload: Record<string, unknown>,
): Promise<UpstreamResult> {
  const origin = getUpstreamOrigin();
  const secret = getAdminSecret();

  if (!origin || !secret) {
    console.error(
      `[admin] Serverseitig nicht konfiguriert (origin: ${origin ? 'ok' : 'fehlt'}, ADMIN_SECRET_KEY: ${secret ? 'ok' : 'fehlt'}).`,
    );
    return {
      status: 500,
      body: { success: false, error: 'Serverseitig nicht konfiguriert.' },
    };
  }

  let res: Response;
  try {
    res = await fetch(`${origin}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': secret,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
  } catch (err) {
    logSafe(`Upstream ${path} nicht erreichbar`, err);
    return {
      status: 502,
      body: { success: false, error: 'Die Generierungs-API ist nicht erreichbar.' },
    };
  }

  const text = await res.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    // Kein JSON zurück — Rohtext nicht durchreichen, er könnte alles enthalten.
    logSafe(`Upstream ${path} lieferte kein JSON (Status ${res.status})`, text.slice(0, 200));
    body = { success: false, error: `Unerwartete Antwort der Generierungs-API (${res.status}).` };
  }

  // Statuscodes ohne Body lassen sich nicht als JSON zurückgeben. Kommt bei den
  // drei Endpunkten nicht vor, würde aber sonst einen irreführenden 500 erzeugen.
  const NO_BODY_STATUS = [204, 205, 304];
  const status = NO_BODY_STATUS.includes(res.status) ? 200 : res.status;

  return { status, body };
}
