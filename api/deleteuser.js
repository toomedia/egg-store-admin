const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = Number(process.env.PORT || process.env.DELETE_USER_API_PORT || 8001);

const env = {
  SUPABASE_URL: 'https://puqhpgsbyvthttfhbmru.supabase.co',
  SUPABASE_ANON_KEY:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1cWhwZ3NieXZ0aHR0ZmhibXJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4NjQ4MjAsImV4cCI6MjA3MDQ0MDgyMH0.6vatjsBk3ZkvoYRvAwbm8Ogb3ZacJm9bL6dqTX_cckY',
  SUPABASE_SERVICE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1cWhwZ3NieXZ0aHR0ZmhibXJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDg2NDgyMCwiZXhwIjoyMDcwNDQwODIwfQ.lqxFplwp3XQZQK0z6TOTrtnrzALwMcQz-cxdO9QUadY',
};

const decodeJwtPayload = (token) => {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');

    return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
  } catch {
    return null;
  }
};

const serviceKeyPayload = decodeJwtPayload(env.SUPABASE_SERVICE_KEY);

console.log('[deleteuser] config loaded', {
  url: env.SUPABASE_URL,
  serviceRole: serviceKeyPayload?.role || 'unknown',
  serviceRef: serviceKeyPayload?.ref || 'unknown',
  anonKeyPresent: Boolean(env.SUPABASE_ANON_KEY),
});

const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

app.use(
  cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'https://egg-store-admin.vercel.app'],
    credentials: true,
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);
app.use(express.json());

app.post('/api/deleteuser', async (req, res) => {
  const { userId, email } = req.body || {};

  console.log('[deleteuser] request received', { userId, email });

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'userId is required',
    });
  }

  try {
    let authDeleted = false;
    let authMessage = 'Auth user deleted';

    const { error: directAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (!directAuthError) {
      authDeleted = true;
    } else {
      console.error('[deleteuser] direct delete returned error', {
        userId,
        email,
        message: directAuthError.message,
        status: directAuthError.status,
        code: directAuthError.code,
      });

      if ((directAuthError.message || '').toLowerCase().includes('invalid api key')) {
        return res.status(500).json({
          success: false,
          message:
            'Supabase service role key is invalid for Auth admin operations. Replace SUPABASE_SERVICE_KEY in api/deleteuser.js with the real service_role key from this Supabase project.',
        });
      }

      const directMessage = (directAuthError.message || '').toLowerCase();
      const authUserMissing =
        directMessage.includes('not found') || directMessage.includes('user not found');

      if (authUserMissing) {
        authDeleted = true;
        authMessage = 'Auth user was already missing';
      } else if (email) {
        const { data: usersData, error: listUsersError } =
          await supabaseAdmin.auth.admin.listUsers({
            page: 1,
            perPage: 1000,
          });

        if (listUsersError) {
          console.error('[deleteuser] auth lookup failed', {
            userId,
            email,
            message: listUsersError.message,
          });
          return res.status(500).json({
            success: false,
            message: `Failed to look up auth user by email: ${listUsersError.message}`,
          });
        }

        const matchedAuthUser = usersData.users.find(
          (authUser) => (authUser.email || '').toLowerCase() === email.toLowerCase()
        );

        if (matchedAuthUser) {
          const { error: fallbackDeleteError } = await supabaseAdmin.auth.admin.deleteUser(
            matchedAuthUser.id
          );

          if (fallbackDeleteError) {
            console.error('[deleteuser] fallback auth delete failed', {
              userId,
              email,
              matchedAuthUserId: matchedAuthUser.id,
              message: fallbackDeleteError.message,
            });
            return res.status(500).json({
              success: false,
              message: `Failed to delete auth user: ${fallbackDeleteError.message}`,
            });
          }

          authDeleted = true;
          authMessage = 'Auth user deleted by email match';
        } else {
          authDeleted = true;
          authMessage = 'No matching auth user found; table row cleanup only was needed';
        }
      } else {
        console.error('[deleteuser] direct auth delete failed', {
          userId,
          email,
          message: directAuthError.message,
        });
        return res.status(500).json({
          success: false,
          message: `Failed to delete auth user: ${directAuthError.message}`,
        });
      }
    }

    const { error: tableError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);

    if (tableError) {
      console.error('[deleteuser] users table delete failed', {
        userId,
        email,
        message: tableError.message,
      });
      return res.status(500).json({
        success: false,
        message: `Auth user deleted, but failed to delete users row: ${tableError.message}`,
        authDeleted: true,
      });
    }

    return res.json({
      success: true,
      message: `User deleted successfully. ${authMessage}.`,
      authDeleted,
    });
  } catch (error) {
    console.error('[deleteuser] unexpected error', {
      userId,
      email,
      message: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Delete user API is running',
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`Delete user API running on http://localhost:${PORT}`);
});
