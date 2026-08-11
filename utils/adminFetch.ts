import { supabase } from './supabaseClient';

/**
 * Ruft eine der Admin-Routen dieses Projekts unter /api/admin/ auf.
 *
 * Mitgeschickt wird ausschließlich das Supabase-Session-Token des angemeldeten
 * Admins. Der Admin-Schlüssel für all-about-eggs kommt im Client nicht mehr vor;
 * die Server-Route setzt ihn aus einer nicht-öffentlichen Env-Variable.
 */

export type AdminFetchResult = {
  ok: boolean;
  status: number;
  data: any;
  error: string | null;
};

export async function adminFetch(
  path: string,
  body: Record<string, unknown>,
): Promise<AdminFetchResult> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  if (!accessToken) {
    return {
      ok: false,
      status: 401,
      data: null,
      error: 'Nicht angemeldet. Bitte neu einloggen.',
    };
  }

  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    // data muss vorhanden sein: die aufrufenden Stellen lesen Felder daraus.
    const ok = res.ok && data != null && data.success !== false;
    return {
      ok,
      status: res.status,
      data,
      error: ok ? null : data?.error || `Anfrage fehlgeschlagen (${res.status}).`,
    };
  } catch (e: any) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: e?.message || 'Anfrage fehlgeschlagen.',
    };
  }
}
