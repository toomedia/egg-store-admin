import { requireAdmin } from '../../../../utils/requireAdmin';
import { callUpstream, UPSTREAM_PATHS, logSafe } from '../../../../utils/adminUpstream';
import { checkRateLimit } from '../../../../utils/rateLimit';

/**
 * POST /api/admin/regenerate-preset
 *
 * Erzeugt eine neue Version eines bestehenden Presets. Kostet OpenAI-Guthaben,
 * daher ebenfalls mengenbegrenzt.
 */

/** Höchstens 10 Regenerierungen pro Stunde und Admin. */
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 60 * 1000;

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const limit = checkRateLimit(`regenerate:${auth.user.id}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!limit.allowed) {
    return Response.json(
      {
        success: false,
        error: `Limit erreicht: höchstens ${RATE_LIMIT} Regenerierungen pro Stunde. Bitte in ${limit.retryAfterSeconds} Sekunden erneut versuchen.`,
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

  const presetId = typeof payload.preset_id === 'string' ? payload.preset_id.trim() : '';
  if (!presetId) {
    return Response.json({ success: false, error: 'preset_id fehlt.' }, { status: 400 });
  }

  try {
    const { status, body } = await callUpstream(UPSTREAM_PATHS.regenerate, {
      preset_id: presetId,
    });
    return Response.json(body, { status });
  } catch (err) {
    logSafe('regenerate-preset fehlgeschlagen', err);
    return Response.json({ success: false, error: 'Regenerierung fehlgeschlagen.' }, { status: 500 });
  }
}
