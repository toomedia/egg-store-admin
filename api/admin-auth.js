const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY env vars are required for admin-auth middleware');
}

const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

const serviceClient = SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } })
  : null;

const verifyAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Missing Authorization header. Include Authorization: Bearer <session token>.',
      });
    }

    const { data: authData, error: authError } = await authClient.auth.getUser(token);
    if (authError || !authData?.user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session',
      });
    }

    const reader = serviceClient || authClient;
    const { data: userRow, error: userError } = await reader
      .from('users')
      .select('isAdmin')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (userError || !userRow?.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    req.user = { id: authData.user.id, email: authData.user.email };
    return next();
  } catch (error) {
    console.error('[admin-auth] verifyAdmin failed:', error?.message || error);
    return res.status(500).json({
      success: false,
      message: 'Authentication check failed',
    });
  }
};

module.exports = { verifyAdmin };
