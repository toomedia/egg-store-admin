import { requireAdmin } from '../../../../utils/requireAdmin';
import { callUpstream, UPSTREAM_PATHS, logSafe } from '../../../../utils/adminUpstream';
import { checkRateLimit } from '../../../../utils/rateLimit';

/**
 * POST /api/admin/backfill-preset-prompts
 *
 * Lässt GPT-4o Vision die Bilder eines Presets beschreiben und speichert die
 * Prompts nach. Günstiger als eine Generierung, kostet aber ebenfalls.
 */

/** Höchstens 20 Backfills pro Stunde und Admin. */
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60 * 60 * 1000;

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const limit = checkRateLimit(`backfill:${auth.user.id}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!limit.allowed) {
    return Response.json(
      {
        success: false,
        error: `Limit erreicht: höchstens ${RATE_LIMIT} Backfills pro Stunde. Bitte in ${limit.retryAfterSeconds} Sekunden erneut versuchen.`,
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

  const presetId = typeof payload.presetId === 'string' ? payload.presetId.trim() : '';
  if (!presetId) {
    return Response.json({ success: false, error: 'presetId fehlt.' }, { status: 400 });
  }

  try {
    const { status, body } = await callUpstream(UPSTREAM_PATHS.backfill, { presetId });
    return Response.json(body, { status });
  } catch (err) {
    logSafe('backfill-preset-prompts fehlgeschlagen', err);
    return Response.json({ success: false, error: 'Backfill fehlgeschlagen.' }, { status: 500 });
  }
}
