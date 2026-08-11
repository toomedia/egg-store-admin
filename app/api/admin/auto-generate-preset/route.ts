import { requireAdmin } from '../../../../utils/requireAdmin';
import { callUpstream, UPSTREAM_PATHS, logSafe } from '../../../../utils/adminUpstream';
import { checkRateLimit } from '../../../../utils/rateLimit';

/**
 * POST /api/admin/auto-generate-preset
 *
 * Teuerster der drei Aufrufe: erzeugt ein komplettes Preset mit Bildern und
 * kostet pro Aufruf echtes OpenAI-Guthaben. Deshalb sitzt die Bildanzahl
 * serverseitig fest — der Client kann sie nicht mehr bestimmen.
 */

/** Bildanzahl pro Preset. Harte Obergrenze, unabhängig vom Request-Body. */
const IMAGE_COUNT_MAX = 12;
const IMAGE_COUNT_DEFAULT = 12;

/** Höchstens 5 Generierungen pro Stunde und Admin. */
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;

const MAX_TEXT_LENGTH = 500;

function cleanText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, MAX_TEXT_LENGTH);
}

/**
 * Deckelt die Bildanzahl serverseitig. Alles, was nicht eine ganze Zahl
 * zwischen 1 und IMAGE_COUNT_MAX ist, fällt auf den Standardwert zurück.
 */
function resolveCount(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    return IMAGE_COUNT_DEFAULT;
  }
  return Math.min(value, IMAGE_COUNT_MAX);
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const limit = checkRateLimit(`auto-generate:${auth.user.id}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!limit.allowed) {
    return Response.json(
      {
        success: false,
        error: `Limit erreicht: höchstens ${RATE_LIMIT} Generierungen pro Stunde. Bitte in ${limit.retryAfterSeconds} Sekunden erneut versuchen.`,
      },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ success: false, error: 'Ungültiger Request-Body.' }, { status: 400 });
  }

  const concept = cleanText(payload.concept);
  const name = cleanText(payload.name);
  const count = resolveCount(payload.count);

  try {
    const { status, body } = await callUpstream(UPSTREAM_PATHS.autoGenerate, {
      concept,
      name,
      count,
    });
    return Response.json(body, { status });
  } catch (err) {
    logSafe('auto-generate-preset fehlgeschlagen', err);
    return Response.json({ success: false, error: 'Generierung fehlgeschlagen.' }, { status: 500 });
  }
}
