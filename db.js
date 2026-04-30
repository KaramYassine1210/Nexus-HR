/* ═══════════════════════════════════════════════════════════════════
   SUPABASE CONFIGURATION — Fill in your project credentials here
   ═══════════════════════════════════════════════════════════════════
   HOW TO GET THESE VALUES:
     1. Go to https://supabase.com → open your project
     2. Click "Settings" (left sidebar) → "API"
     3. Copy "Project URL"      → paste as SUPABASE_URL below
     4. Copy "anon public" key  → paste as SUPABASE_KEY below
   ═══════════════════════════════════════════════════════════════════ */
const SUPABASE_URL = 'https://ocbknzbzngugfnihuerk.supabase.co';       // e.g. https://abcxyz.supabase.co
const SUPABASE_KEY = 'sb_publishable_jE-lHiBN366rNvuVulmM6Q_PLaczUNh';  // long string starting with eyJ...

/* ─────────────────────────────────────────────────────────────────── */

const _dbReady = SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_KEY !== 'YOUR_SUPABASE_ANON_KEY';
const _client  = _dbReady && window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

if (_dbReady && !window.supabase) {
  console.warn('[NexusRH] Supabase CDN not loaded — check your network.');
}
console.log(_client
  ? '[NexusRH] Supabase connected — using live database.'
  : '[NexusRH] Supabase not configured — running on built-in demo data.'
);

/* ── DB Module ───────────────────────────────────────────────────── */
const DB = {

  isReady() { return !!_client; },

  async hashPassword(plaintext) {
    const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(plaintext));
    return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  },

  _mapUser(row) {
    return {
      id:       row.id,
      email:    row.email,
      password: row.password,
      role:     row.role,
      name:     row.name,
      dept:     row.dept,
      avatar:   row.avatar,
      color:    row.color,
      joinDate: row.join_date,
      manager:  row.manager
    };
  },

  _mapRequest(row, allComments) {
    const comments = (allComments || [])
      .filter(c => c.request_id === row.id)
      .map(c => ({ author: c.author, role: c.role, text: c.text, date: c.date }));
    return {
      id:           row.id,
      type:         row.type,
      title:        row.title,
      employee:     row.employee_id,
      employeeName: row.employee_name,
      dept:         row.dept,
      date:         row.date,
      status:       row.status,
      details:      row.details || {},
      comments,
      color:        row.color
    };
  },

  async loadUsers() {
    if (!_client) return null;
    const { data, error } = await _client.from('users').select('*').order('id');
    if (error) { console.error('[NexusRH] loadUsers:', error.message); return null; }
    return data.map(r => DB._mapUser(r));
  },

  async loadRequests() {
    if (!_client) return null;
    const [reqRes, cmtRes] = await Promise.all([
      _client.from('requests').select('*').order('date', { ascending: false }).order('created_at', { ascending: false }),
      _client.from('request_comments').select('*').order('created_at', { ascending: true })
    ]);
    if (reqRes.error) { console.error('[NexusRH] loadRequests:', reqRes.error.message); return null; }
    return (reqRes.data || []).map(r => DB._mapRequest(r, cmtRes.data || []));
  },

  async insertRequest(req) {
    if (!_client) return;
    const { error } = await _client.from('requests').insert({
      id:            req.id,
      type:          req.type,
      title:         req.title,
      employee_id:   req.employee,
      employee_name: req.employeeName,
      dept:          req.dept,
      date:          req.date,
      status:        req.status,
      details:       req.details,
      color:         req.color
    });
    if (error) console.error('[NexusRH] insertRequest:', error.message);
  },

  async updateRequestStatus(id, status) {
    if (!_client) return;
    const { error } = await _client.from('requests').update({ status }).eq('id', id);
    if (error) console.error('[NexusRH] updateRequestStatus:', error.message);
  },

  async insertComment(requestId, comment) {
    if (!_client) return;
    const { error } = await _client.from('request_comments').insert({
      request_id: requestId,
      author:     comment.author,
      role:       comment.role,
      text:       comment.text,
      date:       comment.date
    });
    if (error) console.error('[NexusRH] insertComment:', error.message);
  },

  subscribeRealtime(onUpdate) {
    if (!_client) return;
    const reload = async () => {
      const requests = await DB.loadRequests();
      if (requests && typeof State !== 'undefined') {
        State.requests = requests;
        if (onUpdate) onUpdate();
      }
    };
    _client.channel('nexus-rh-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' },         reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'request_comments' }, reload)
      .subscribe();
  }
};
