const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY  // service key for server-side auth
);

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const path = event.path
    .replace('/.netlify/functions/auth', '')
    .replace('/api/auth', '');
  const body = JSON.parse(event.body || '{}');

  try {
    // ── REGISTER ──────────────────────────────────────────
    if (path === '/register' && event.httpMethod === 'POST') {
      const { name, email, password } = body;

      if (!name || !email || !password) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'All fields required' }) };
      }
      if (password.length < 6) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Password must be at least 6 characters' }) };
      }

      // Create user with admin API (skips email confirmation)
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name },
      });

      if (error) {
        const msg = error.message.toLowerCase().includes('already registered')
          ? 'Email already registered'
          : error.message;
        return { statusCode: 409, headers, body: JSON.stringify({ error: msg }) };
      }

      // Sign in immediately to get session tokens
      const { data: session, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: signInError.message }) };
      }

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          token: session.session.access_token,
          user: {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || name,
          },
        }),
      };
    }

    // ── LOGIN ──────────────────────────────────────────────
    if (path === '/login' && event.httpMethod === 'POST') {
      const { email, password } = body;

      if (!email || !password) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email and password required' }) };
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid email or password' }) };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          token: data.session.access_token,
          user: {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || data.user.email.split('@')[0],
          },
        }),
      };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };

  } catch (err) {
    console.error('Auth error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error: ' + err.message }) };
  }
};
