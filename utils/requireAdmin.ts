import { createClient } from '@supabase/supabase-js';

/**
 * Serverseitige Admin-Prüfung für Route Handler unter app/api/admin/.
 *
 * Gleiches Verfahren wie die bestehende Express-Middleware in api/admin-auth.js:
 * Bearer-Token aus dem Authorization-Header, Signaturprüfung über Supabase,
 * danach das isAdmin-Flag aus der users-Tabelle.
 *
 * Unterschied: Die users-Abfrage läuft mit einem Client, der auf das Token des
 * Aufrufers gescoped ist. Damit greift RLS als dieser Benutzer und die Prüfung
 * funktioniert auch dort, wo SUPABASE_SERVICE_ROLE_KEY nicht gesetzt ist —
 * lokal ist das der Normalfall.
 */

export type AdminUser = { id: string; email: string | null };

export type AdminCheck =
  | { ok: true; user: AdminUser }
  | { ok: false; response: Response };

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function deny(status: number, message: string): { ok: false; response: Response } {
  return {
    ok: false,
    response: Response.json({ success: false, error: message }, { status }),
  };
}

export async function requireAdmin(req: Request): Promise<AdminCheck> {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  if (!token) {
    return deny(401, 'Nicht angemeldet.');
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('[admin] Supabase-URL oder Anon-Key fehlen serverseitig.');
    return deny(500, 'Serverseitig nicht konfiguriert.');
  }

  const scoped = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: authData, error: authError } = await scoped.auth.getUser(token);
  if (authError || !authData?.user) {
    return deny(401, 'Sitzung ungültig oder abgelaufen.');
  }

  const { data: userRow, error: userError } = await scoped
    .from('users')
    .select('isAdmin')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (userError || !userRow?.isAdmin) {
    return deny(403, 'Kein Admin-Zugriff.');
  }

  return {
    ok: true,
    user: { id: authData.user.id, email: authData.user.email ?? null },
  };
}
