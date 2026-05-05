const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

// Verify Supabase JWT and return user
async function getUser(event) {
  const auth = event.headers.authorization || event.headers.Authorization || '';
  if (!auth.startsWith('Bearer ')) throw new Error('No token');
  const token = auth.slice(7);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new Error('Invalid token');
  return data.user;
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

// Shape a DB row into a clean response object
function shapeRow(row) {
  if (!row) {
    const date = todayStr();
    return {
      date,
      morning:   { count: 0, done: false },
      afternoon: { count: 0, done: false },
      evening:   { count: 0, done: false },
    };
  }
  return {
    id: row.id,
    date: row.date,
    morning:   { count: row.morning_count,   done: row.morning_done },
    afternoon: { count: row.afternoon_count, done: row.afternoon_done },
    evening:   { count: row.evening_count,   done: row.evening_done },
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  let user;
  try {
    user = await getUser(event);
  } catch {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const path = event.path
    .replace('/.netlify/functions/activities', '')
    .replace('/api/activities', '');
  const body = event.body ? JSON.parse(event.body) : {};

  try {
    // ── GET TODAY ─────────────────────────────────────────
    if (event.httpMethod === 'GET' && path === '/today') {
      const date = todayStr();
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', date)
        .maybeSingle();

      if (error) throw error;
      return { statusCode: 200, headers, body: JSON.stringify(shapeRow(data)) };
    }

    // ── LOG ACTION ────────────────────────────────────────
    if (event.httpMethod === 'POST' && path === '/log') {
      const { slot, action } = body;
      // slot: 'morning' | 'afternoon' | 'evening'
      // action: 'increment' | 'decrement' | 'done' | 'undone'
      const date = todayStr();

      // Fetch existing or create default row
      let { data: existing, error: fetchErr } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', date)
        .maybeSingle();
      if (fetchErr) throw fetchErr;

      const countCol = `${slot}_count`;
      const doneCol  = `${slot}_done`;

      let newCount = existing ? existing[countCol] : 0;
      let newDone  = existing ? existing[doneCol]  : false;

      if (action === 'increment') newCount = newCount + 1;
      if (action === 'decrement') newCount = Math.max(0, newCount - 1);
      if (action === 'done')   newDone = true;
      if (action === 'undone') newDone = false;

      const upsertData = {
        user_id: user.id,
        date,
        morning_count:   existing?.morning_count   ?? 0,
        morning_done:    existing?.morning_done     ?? false,
        afternoon_count: existing?.afternoon_count ?? 0,
        afternoon_done:  existing?.afternoon_done  ?? false,
        evening_count:   existing?.evening_count   ?? 0,
        evening_done:    existing?.evening_done    ?? false,
        [countCol]: newCount,
        [doneCol]:  newDone,
        updated_at: new Date().toISOString(),
      };

      const { data: upserted, error: upsertErr } = await supabase
        .from('activities')
        .upsert(upsertData, { onConflict: 'user_id,date' })
        .select()
        .single();
      if (upsertErr) throw upsertErr;

      return { statusCode: 200, headers, body: JSON.stringify(shapeRow(upserted)) };
    }

    // ── HISTORY (last 7 days) ─────────────────────────────
    if (event.httpMethod === 'GET' && path === '/history') {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(7);
      if (error) throw error;

      return { statusCode: 200, headers, body: JSON.stringify((data || []).map(shapeRow)) };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };

  } catch (err) {
    console.error('Activities error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error: ' + err.message }) };
  }
};
