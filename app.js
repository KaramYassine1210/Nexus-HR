/* ===================================================
   HRFlow — Application RH Multi-rôles
   Frontend SPA — Webhook-driven
   =================================================== */

// ───────────────────────────────────────────────────
// STATE
// ───────────────────────────────────────────────────
const State = {
  currentUser: null,
  currentPage: null,
  requests: [],
  employees: [],
  webhookLogs: [],
  charts: {},

  // Demo data
  DEMO_USERS: [
    { id: 'U001', email: 'alice@hrflow.io',   password: 'demo', role: 'employee', name: 'Alice Martin',    dept: 'Engineering',   avatar: 'AM', color: '#6366f1', joinDate: '2022-03-15', manager: 'Bob Dupont' },
    { id: 'U002', email: 'bob@hrflow.io',     password: 'demo', role: 'manager',  name: 'Bob Dupont',      dept: 'Engineering',   avatar: 'BD', color: '#10b981', joinDate: '2020-01-10', manager: 'Claire Blanc' },
    { id: 'U003', email: 'claire@hrflow.io',  password: 'demo', role: 'hr',       name: 'Claire Blanc',    dept: 'Human Resources', avatar: 'CB', color: '#f59e0b', joinDate: '2019-06-01', manager: '—' },
    { id: 'U004', email: 'david@hrflow.io',   password: 'demo', role: 'employee', name: 'David Chen',      dept: 'Design',        avatar: 'DC', color: '#3b82f6', joinDate: '2023-01-20', manager: 'Bob Dupont' },
    { id: 'U005', email: 'emma@hrflow.io',    password: 'demo', role: 'employee', name: 'Emma Wilson',     dept: 'Marketing',     avatar: 'EW', color: '#8b5cf6', joinDate: '2021-09-05', manager: 'Bob Dupont' },
    { id: 'U006', email: 'frank@hrflow.io',   password: 'demo', role: 'manager',  name: 'Frank Leroy',     dept: 'Marketing',     avatar: 'FL', color: '#06b6d4', joinDate: '2020-07-12', manager: 'Claire Blanc' },
  ],

  WEBHOOKS: {
    leave_request:      'https://fusion-ai-api.medifus.dev/webhooks/webhook-bmduvk665ioqww9qgvo4mknq/conge',
    absence_justif:     'https://fusion-ai-api.medifus.dev/webhooks/webhook-abs-webhook-01/absence',
    document_request:   'https://fusion-ai-api.medifus.dev/webhooks/webhook-j1udcxmmpsvlog248ke8ut9z/documents',
    personal_change:    'https://fusion-ai-api.medifus.dev/webhooks/webhook-lueej7jjmyecvf7ek69zf90c/personal_change',
    approve_request:    'https://webhook.site/hr-approve',
    reject_request:     'https://webhook.site/hr-reject',
    add_comment:        'https://webhook.site/hr-comment',
    login:              'https://fusion-ai-api.medifus.dev/webhooks/webhook-aysqian1jbeqa6hquwwj2pub/login',
  }
};

// Seed requests
State.requests = [
  { id: 'R001', type: 'leave',    title: 'Congé annuel',          employee: 'U001', employeeName: 'Alice Martin',  dept: 'Engineering', date: '2026-04-20', status: 'pending',  details: { from: '2026-05-01', to: '2026-05-10', days: 10, reason: 'Vacances familiales' }, comments: [], color: '#6366f1' },
  { id: 'R002', type: 'absence',  title: 'Justificatif d\'absence', employee: 'U004', employeeName: 'David Chen',   dept: 'Design',      date: '2026-04-18', status: 'approved', details: { absenceDate: '2026-04-17', reason: 'Rendez-vous médical', justif: 'Ordonnance médicale' }, comments: [{ author: 'Claire Blanc', role: 'RH', text: 'Justificatif reçu, absence validée.', date: '2026-04-18' }], color: '#3b82f6' },
  { id: 'R003', type: 'personal', title: 'Changement d\'adresse',  employee: 'U005', employeeName: 'Emma Wilson',  dept: 'Marketing',   date: '2026-04-15', status: 'approved', details: { field: 'Adresse', oldVal: '12 rue des lilas, Paris', newVal: '45 avenue Victor Hugo, Lyon' }, comments: [], color: '#8b5cf6' },
  { id: 'R004', type: 'document', title: 'Attestation employeur',  employee: 'U001', employeeName: 'Alice Martin', dept: 'Engineering', date: '2026-04-14', status: 'pending',  details: { docType: 'Attestation employeur', reason: 'Dossier bancaire', urgency: 'Normal' }, comments: [], color: '#6366f1' },
  { id: 'R005', type: 'leave',    title: 'Congé maladie',          employee: 'U004', employeeName: 'David Chen',   dept: 'Design',      date: '2026-04-12', status: 'rejected', details: { from: '2026-04-13', to: '2026-04-15', days: 3, reason: 'Grippe' }, comments: [{ author: 'Bob Dupont', role: 'Manager', text: 'Arrêt maladie non fourni.', date: '2026-04-12' }], color: '#3b82f6' },
  { id: 'R006', type: 'document', title: 'Bulletin de salaire',     employee: 'U005', employeeName: 'Emma Wilson',  dept: 'Marketing',   date: '2026-04-10', status: 'approved', details: { docType: 'Bulletin de salaire', reason: 'Demande de crédit', urgency: 'Urgent' }, comments: [], color: '#8b5cf6' },
  { id: 'R007', type: 'leave',    title: 'RTT',                    employee: 'U004', employeeName: 'David Chen',   dept: 'Design',      date: '2026-04-08', status: 'pending',  details: { from: '2026-04-25', to: '2026-04-25', days: 1, reason: 'RTT récupération' }, comments: [], color: '#3b82f6' },
  { id: 'R008', type: 'personal', title: 'Mise à jour numéro tél',  employee: 'U001', employeeName: 'Alice Martin', dept: 'Engineering', date: '2026-04-06', status: 'pending',  details: { field: 'Téléphone', oldVal: '06 12 34 56 78', newVal: '07 89 01 23 45' }, comments: [], color: '#6366f1' },
];

// ───────────────────────────────────────────────────
// WEBHOOK ENGINE
// ───────────────────────────────────────────────────
const Webhook = {
  async send(url, data) {
    const entry = {
      id: Date.now(),
      time: new Date().toLocaleTimeString('fr-FR'),
      url,
      data,
      status: 'sending'
    };

    State.webhookLogs.unshift(entry);
    updateWebhookLog();

    try {
      const proxyUrl = `/proxy?target=${encodeURIComponent(url)}`;
      await fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-HRFlow-Source': 'hrflow-frontend', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      });
      entry.status = 'sent';
    } catch (e) {
      console.error('Webhook proxy error:', e);
      entry.status = 'error';
    }

    updateWebhookLog();
    return entry;
  },

  async sendLoginEvent(user) {
    return Webhook.send(State.WEBHOOKS.login, {
      event: 'user_login',
      timestamp: new Date().toISOString(),
      user: { id: user.id, name: user.name, email: user.email, role: user.role, dept: user.dept }
    });
  },

  async sendRequest(type, formData) {
    const webhookUrl = State.WEBHOOKS[type] || State.WEBHOOKS.leave_request;
    return Webhook.send(webhookUrl, {
      event: `request_submitted`,
      request_type: type,
      timestamp: new Date().toISOString(),
      submitted_by: { id: State.currentUser.id, name: State.currentUser.name, email: State.currentUser.email, dept: State.currentUser.dept },
      data: formData
    });
  },

  async sendAction(action, requestId, extra = {}) {
    const webhookUrl = State.WEBHOOKS[action + '_request'] || State.WEBHOOKS.approve_request;
    const req = State.requests.find(r => r.id === requestId);
    return Webhook.send(webhookUrl, {
      event: `request_${action}`,
      timestamp: new Date().toISOString(),
      action_by: { id: State.currentUser.id, name: State.currentUser.name, role: State.currentUser.role },
      request: req ? { id: req.id, type: req.type, title: req.title, employee: req.employeeName } : { id: requestId },
      ...extra
    });
  },

  async sendComment(requestId, comment) {
    return Webhook.send(State.WEBHOOKS.add_comment, {
      event: 'comment_added',
      timestamp: new Date().toISOString(),
      commented_by: { id: State.currentUser.id, name: State.currentUser.name, role: State.currentUser.role },
      request_id: requestId,
      comment
    });
  }
};

// ───────────────────────────────────────────────────
// TOAST NOTIFICATIONS
// ───────────────────────────────────────────────────
function showToast(message, type = 'info', duration = 3500) {
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type]}</span>
    <span class="toast-msg">${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-fade');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ───────────────────────────────────────────────────
// MODAL
// ───────────────────────────────────────────────────
function openModal(content, extraClass = '') {
  closeModal();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'active-modal';
  overlay.innerHTML = `<div class="modal ${extraClass}">${content}</div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.body.appendChild(overlay);
}

function closeModal() {
  const m = document.getElementById('active-modal');
  if (m) m.remove();
}

// ───────────────────────────────────────────────────
// WEBHOOK LOG UI
// ───────────────────────────────────────────────────
function updateWebhookLog() {
  const log = document.getElementById('webhook-log');
  if (!log) return;

  if (State.webhookLogs.length === 0) {
    log.innerHTML = '<span style="color:#475569">Aucune requête envoyée...</span>';
    return;
  }

  log.innerHTML = State.webhookLogs.slice(0, 8).map(e => `
    <div class="webhook-log-entry">
      <span class="log-time">[${e.time}]</span>
      <span class="log-method"> POST</span>
      <span class="log-url"> ${e.url.replace('https://webhook.site/', 'wh/')}</span>
      <span class="log-status"> → ${e.status === 'sent' ? '✓ 200' : e.status === 'error' ? '✗ ERR' : '⏳ ...'}</span>
      <div class="log-data">${JSON.stringify(e.data, null, 2).substring(0, 200)}${JSON.stringify(e.data).length > 200 ? '...' : ''}</div>
    </div>
  `).join('');
}

// ───────────────────────────────────────────────────
// AUTH
// ───────────────────────────────────────────────────
function renderLogin() {
  document.getElementById('app').innerHTML = `
    <div class="login-page">
      <div class="login-left">
        <div class="login-brand">
          <div class="login-brand-icon">👥</div>
          <div>
            <div class="login-brand-name">HRFlow</div>
            <div class="login-brand-tag">Gestion RH</div>
          </div>
        </div>

        <div class="login-hero">
          <div class="login-headline">
            Gérez vos<br/>ressources humaines<br/><span>intelligemment</span>
          </div>
          <div class="login-desc">
            Plateforme RH multi-rôles avec gestion des demandes, congés, documents et bien plus.
          </div>
        </div>

        <div class="login-features">
          <div class="login-feature">
            <div class="login-feature-icon">🔐</div>
            Accès sécurisé multi-rôles
          </div>
          <div class="login-feature">
            <div class="login-feature-icon">📊</div>
            Tableaux de bord en temps réel
          </div>
          <div class="login-feature">
            <div class="login-feature-icon">🔗</div>
            Intégration webhooks JSON
          </div>
          <div class="login-feature">
            <div class="login-feature-icon">📝</div>
            Gestion des demandes et congés
          </div>
        </div>
      </div>

      <div class="login-right">
        <div class="login-form-container">
          <div class="login-form-title">Bienvenue 👋</div>
          <div class="login-form-sub">Connectez-vous à votre espace RH</div>

          <div style="margin-bottom:1.25rem">
            <div style="font-size:0.82rem;font-weight:600;color:var(--text-primary);margin-bottom:0.6rem">Sélectionnez votre rôle</div>
            <div class="role-selector">
              <div class="role-option selected" data-role="employee" onclick="selectRole(this, 'employee')">
                <div class="role-option-icon">👤</div>
                <div class="role-option-name">Employé</div>
                <div class="role-option-desc">Mes demandes</div>
              </div>
              <div class="role-option" data-role="manager" onclick="selectRole(this, 'manager')">
                <div class="role-option-icon">👨‍💼</div>
                <div class="role-option-name">Manager</div>
                <div class="role-option-desc">Mon équipe</div>
              </div>
              <div class="role-option" data-role="hr" onclick="selectRole(this, 'hr')">
                <div class="role-option-icon">🏢</div>
                <div class="role-option-name">RH</div>
                <div class="role-option-desc">Tout l'org</div>
              </div>
            </div>
          </div>

          <div class="login-input-group">
            <label class="login-input-label">Email professionnel</label>
            <div class="login-input-wrap">
              <span class="login-input-icon">📧</span>
              <input type="email" id="login-email" class="login-input" placeholder="vous@hrflow.io" />
            </div>
          </div>

          <div class="login-input-group">
            <label class="login-input-label">Mot de passe</label>
            <div class="login-input-wrap">
              <span class="login-input-icon">🔒</span>
              <input type="password" id="login-password" class="login-input" placeholder="••••••••" />
            </div>
          </div>

          <button class="btn btn-primary btn-full btn-lg" onclick="doLogin()" style="margin-top:0.5rem">
            Se connecter →
          </button>

          <div class="login-divider">Accès rapide démo</div>

          <div class="demo-accounts">
            <div class="demo-account" onclick="quickLogin('alice@hrflow.io', 'employee')">
              <div class="demo-account-dot dot-employee"></div>
              <div>
                <div style="font-weight:600;color:var(--text-primary)">Alice Martin</div>
                <div style="color:var(--text-muted);font-size:0.72rem">Employée · Engineering</div>
              </div>
              <div style="margin-left:auto;font-size:0.72rem;color:var(--text-muted)">→</div>
            </div>
            <div class="demo-account" onclick="quickLogin('bob@hrflow.io', 'manager')">
              <div class="demo-account-dot dot-manager"></div>
              <div>
                <div style="font-weight:600;color:var(--text-primary)">Bob Dupont</div>
                <div style="color:var(--text-muted);font-size:0.72rem">Manager · Engineering</div>
              </div>
              <div style="margin-left:auto;font-size:0.72rem;color:var(--text-muted)">→</div>
            </div>
            <div class="demo-account" onclick="quickLogin('claire@hrflow.io', 'hr')">
              <div class="demo-account-dot dot-hr"></div>
              <div>
                <div style="font-weight:600;color:var(--text-primary)">Claire Blanc</div>
                <div style="color:var(--text-muted);font-size:0.72rem">RH · Human Resources</div>
              </div>
              <div style="margin-left:auto;font-size:0.72rem;color:var(--text-muted)">→</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  State._selectedRole = 'employee';
}

function selectRole(el, role) {
  document.querySelectorAll('.role-option').forEach(r => r.classList.remove('selected'));
  el.classList.add('selected');
  State._selectedRole = role;
}

function quickLogin(email, role) {
  document.getElementById('login-email').value = email;
  document.getElementById('login-password').value = 'demo';
  document.querySelectorAll('.role-option').forEach(r => {
    r.classList.toggle('selected', r.dataset.role === role);
  });
  State._selectedRole = role;
  doLogin();
}

function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();
  const role = State._selectedRole;

  const user = State.DEMO_USERS.find(u => u.email === email && u.password === password && u.role === role);

  if (!user) {
    showToast('Email, mot de passe ou rôle incorrect.', 'error');
    return;
  }

  State.currentUser = user;
  sessionStorage.setItem('hrflow_user', JSON.stringify(user));
  Webhook.sendLoginEvent(user);
  showToast(`Bienvenue, ${user.name} !`, 'success');

  setTimeout(() => renderApp(), 300);
}

function doLogout() {
  State.currentUser = null;
  State.charts = {};
  sessionStorage.removeItem('hrflow_user');
  renderLogin();
  showToast('Déconnexion réussie.', 'info');
}

// ───────────────────────────────────────────────────
// APP SHELL
// ───────────────────────────────────────────────────
function renderApp() {
  const user = State.currentUser;
  const navItems = getNavItems(user.role);

  document.getElementById('app').innerHTML = `
    <div class="app-layout">
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-logo">
          <div class="logo-icon">👥</div>
          <div>
            <div class="logo-text">HRFlow</div>
            <div class="logo-sub">Gestion RH</div>
          </div>
        </div>

        <div class="sidebar-user">
          <div class="user-avatar avatar-${user.role}">${user.avatar}</div>
          <div class="user-info">
            <div class="user-name">${user.name}</div>
            <span class="user-role-badge badge-${user.role}">${roleLabel(user.role)}</span>
          </div>
        </div>

        <nav class="sidebar-nav" id="sidebar-nav">
          ${navItems.map(item => `
            ${item.section ? `<div class="nav-section-label">${item.section}</div>` : ''}
            ${!item.section ? `
              <div class="nav-item${item.id === navItems[0].id ? '' : ''}" data-page="${item.id}" onclick="navigateTo('${item.id}')">
                <span class="nav-icon">${item.icon}</span>
                <span>${item.label}</span>
                ${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ''}
              </div>
            ` : ''}
          `).join('')}
        </nav>

        <div class="sidebar-footer">
          <button class="btn-logout" onclick="doLogout()">
            <span>🚪</span>
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      <div class="main-content">
        <header class="topbar">
          <div class="topbar-left">
            <div>
              <div class="page-title" id="page-title">Dashboard</div>
              <div class="page-subtitle" id="page-subtitle">${user.dept} · ${user.name}</div>
            </div>
          </div>
          <div class="topbar-right">
            <div class="topbar-date">📅 ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
            <button class="topbar-btn" onclick="openNotifications()" title="Notifications">
              🔔
              <span class="notif-dot"></span>
            </button>
            <button class="topbar-btn" onclick="openProfileModal()" title="Profil">
              ${user.avatar}
            </button>
          </div>
        </header>

        <div class="content-area" id="content-area">
          <div id="page-content"></div>
        </div>
      </div>
    </div>
  `;

  // Navigate to first non-section nav item
  const firstPage = navItems.find(n => !n.section);
  if (firstPage) navigateTo(firstPage.id);
}

function getNavItems(role) {
  if (role === 'employee') {
    return [
      { section: 'Principal' },
      { id: 'emp-dashboard',  icon: '🏠', label: 'Tableau de bord' },
      { id: 'emp-forms',      icon: '📝', label: 'Mes demandes',   badge: pendingCount('U001') || '' },
      { id: 'emp-status',     icon: '📋', label: 'Suivi demandes' },
      { section: 'Profil' },
      { id: 'emp-profile',    icon: '👤', label: 'Mon profil' },
    ];
  } else if (role === 'manager') {
    return [
      { section: 'Principal' },
      { id: 'mgr-dashboard',  icon: '🏠', label: 'Tableau de bord' },
      { id: 'mgr-requests',   icon: '📬', label: 'Demandes équipe', badge: pendingCountAll() || '' },
      { id: 'mgr-team',       icon: '👥', label: 'Mon équipe' },
      { section: 'Analytique' },
      { id: 'mgr-stats',      icon: '📊', label: 'Statistiques' },
      { section: 'Système' },
      { id: 'mgr-webhooks',   icon: '🔗', label: 'Logs Webhook' },
    ];
  } else {
    return [
      { section: 'Principal' },
      { id: 'hr-dashboard',   icon: '🏠', label: 'Tableau de bord' },
      { id: 'hr-requests',    icon: '📬', label: 'Toutes demandes', badge: pendingCountAll() || '' },
      { id: 'hr-employees',   icon: '👥', label: 'Employés' },
      { section: 'Analytique' },
      { id: 'hr-stats',       icon: '📊', label: 'Statistiques RH' },
      { section: 'Système' },
      { id: 'hr-webhooks',    icon: '🔗', label: 'Logs Webhook' },
    ];
  }
}

function pendingCount(userId) {
  return State.requests.filter(r => r.employee === userId && r.status === 'pending').length;
}

function pendingCountAll() {
  return State.requests.filter(r => r.status === 'pending').length;
}

function roleLabel(role) {
  return { employee: 'Employé', manager: 'Manager', hr: 'RH Admin' }[role] || role;
}


function maskRIB(rib) {
  if (!rib || rib.length < 4) return rib;
  const lastFour = rib.slice(-4);
  const masked = '*'.repeat(rib.length - 4) + lastFour;
  // Format avec espaces tous les 4 caractères
  return masked.replace(/(.{4})/g, '$1 ').trim();
}


function navigateTo(pageId) {
  State.currentPage = pageId;

  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.page === pageId);
  });

  const titles = {
    'emp-dashboard':  ['Tableau de bord', 'Bienvenue sur votre espace employé'],
    'emp-forms':      ['Nouvelle demande', 'Remplissez et soumettez vos formulaires'],
    'emp-status':     ['Suivi des demandes', 'Consultez l\'état de vos demandes'],
    'emp-profile':    ['Mon profil', 'Informations personnelles et RH'],
    'mgr-dashboard':  ['Tableau de bord', 'Vue d\'ensemble de votre équipe'],
    'mgr-requests':   ['Demandes équipe', 'Gérez les demandes de vos collaborateurs'],
    'mgr-team':       ['Mon équipe', 'Gestion des membres de l\'équipe'],
    'mgr-stats':      ['Statistiques', 'Analyses et indicateurs de performance'],
    'mgr-webhooks':   ['Logs Webhook', 'Historique des événements envoyés'],
    'hr-dashboard':   ['Tableau de bord RH', 'Vue globale de l\'organisation'],
    'hr-requests':    ['Toutes les demandes', 'Gestion centralisée des demandes RH'],
    'hr-employees':   ['Gestion des employés', 'Annuaire et données des collaborateurs'],
    'hr-stats':       ['Statistiques RH', 'KPIs et analyses organisationnelles'],
    'hr-webhooks':    ['Logs Webhook', 'Historique des événements envoyés'],
  };

  const [title, subtitle] = titles[pageId] || ['Page', ''];
  document.getElementById('page-title').textContent = title;
  document.getElementById('page-subtitle').textContent = subtitle;

  const content = document.getElementById('page-content');

  // Destroy existing charts
  Object.values(State.charts).forEach(c => { try { c.destroy(); } catch(e){} });
  State.charts = {};

  const renderers = {
    'emp-dashboard':  renderEmpDashboard,
    'emp-forms':      renderEmpForms,
    'emp-status':     renderEmpStatus,
    'emp-profile':    renderEmpProfile,
    'mgr-dashboard':  renderMgrDashboard,
    'mgr-requests':   renderMgrRequests,
    'mgr-team':       renderMgrTeam,
    'mgr-stats':      renderStats,
    'hr-dashboard':   renderHRDashboard,
    'hr-requests':    renderHRRequests,
    'hr-employees':   renderHREmployees,
    'hr-stats':       renderStats,
    'mgr-webhooks':   renderWebhookLogs,
    'hr-webhooks':    renderWebhookLogs,
  };

  if (renderers[pageId]) renderers[pageId](content);
}

// ───────────────────────────────────────────────────
// EMPLOYEE DASHBOARD
// ───────────────────────────────────────────────────
function renderEmpDashboard(container) {
  const user = State.currentUser;
  const myReqs = State.requests.filter(r => r.employee === user.id);
  const pending  = myReqs.filter(r => r.status === 'pending').length;
  const approved = myReqs.filter(r => r.status === 'approved').length;
  const rejected = myReqs.filter(r => r.status === 'rejected').length;

  container.innerHTML = `
    <div class="section-header">
      <div>
        <div class="section-title">Bonjour, ${user.name.split(' ')[0]} 👋</div>
        <div class="section-sub">Voici un résumé de votre activité RH</div>
      </div>
      <button class="btn btn-primary" onclick="navigateTo('emp-forms')">
        + Nouvelle demande
      </button>
    </div>

    <div class="stats-grid">
      <div class="stat-card indigo">
        <div class="stat-header">
          <div class="stat-icon indigo">📝</div>
          <span class="stat-trend trend-flat">Total</span>
        </div>
        <div class="stat-value">${myReqs.length}</div>
        <div class="stat-label">Demandes au total</div>
      </div>
      <div class="stat-card amber">
        <div class="stat-header">
          <div class="stat-icon amber">⏳</div>
          <span class="stat-trend trend-flat">En cours</span>
        </div>
        <div class="stat-value">${pending}</div>
        <div class="stat-label">En attente</div>
      </div>
      <div class="stat-card green">
        <div class="stat-header">
          <div class="stat-icon green">✅</div>
          <span class="stat-trend trend-up">+${approved}</span>
        </div>
        <div class="stat-value">${approved}</div>
        <div class="stat-label">Approuvées</div>
      </div>
      <div class="stat-card red">
        <div class="stat-header">
          <div class="stat-icon red">❌</div>
          <span class="stat-trend trend-down">${rejected}</span>
        </div>
        <div class="stat-value">${rejected}</div>
        <div class="stat-label">Refusées</div>
      </div>
    </div>

    <div class="content-grid-3">
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Mes dernières demandes</div>
            <div class="card-subtitle">Activité récente</div>
          </div>
          <span class="card-action" onclick="navigateTo('emp-status')">Voir tout →</span>
        </div>
        <div class="request-list">
          ${myReqs.length === 0 ? '<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-title">Aucune demande</div></div>' :
          myReqs.slice(0, 5).map(r => `
            <div class="request-item" onclick="showRequestDetail('${r.id}')">
              <div class="request-avatar" style="background:${r.color}">${r.employeeName.split(' ').map(w => w[0]).join('')}</div>
              <div class="request-info">
                <div class="request-name">${r.title}</div>
                <div class="request-meta">${typeLabel(r.type)} · ${formatDate(r.date)}</div>
              </div>
              <div class="request-right">
                <div class="request-time">${r.date}</div>
                <span class="badge badge-${r.status}">${statusLabel(r.status)}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Profil</div>
          </div>
        </div>
        <div class="profile-card">
          <div class="profile-avatar" style="background:${user.color}">${user.avatar}</div>
          <div>
            <div class="profile-name">${user.name}</div>
            <div class="profile-role">${user.dept}</div>
            <div class="profile-dept">Manager : ${user.manager}</div>
            <div class="profile-stats">
              <div>
                <div class="profile-stat-val">${approved}</div>
                <div class="profile-stat-lbl">Approuvées</div>
              </div>
              <div>
                <div class="profile-stat-val">${pending}</div>
                <div class="profile-stat-lbl">En attente</div>
              </div>
            </div>
          </div>
        </div>

        <div style="padding:0 1.5rem 1.5rem">
          <div style="font-size:0.75rem;font-weight:600;color:var(--text-muted);margin-bottom:0.5rem">Taux d'approbation</div>
          <div class="progress-bar-wrap">
            <div class="progress-bar-fill" style="width:${myReqs.length ? Math.round(approved/myReqs.length*100) : 0}%;background:var(--accent)"></div>
          </div>
          <div style="text-align:right;font-size:0.72rem;color:var(--text-muted);margin-top:4px">
            ${myReqs.length ? Math.round(approved/myReqs.length*100) : 0}%
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title">Actions rapides</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;padding:1.5rem">
        ${[
          { icon: '🏖️', label: 'Demande de congé',    tab: 'leave',    color: '#6366f1' },
          { icon: '🏥', label: 'Justif. d\'absence',   tab: 'absence',  color: '#3b82f6' },
          { icon: '📄', label: 'Document admin.',      tab: 'document', color: '#10b981' },
          { icon: '✏️', label: 'Infos personnelles',   tab: 'personal', color: '#f59e0b' },
        ].map(a => `
          <div onclick="navigateTo('emp-forms');setTimeout(()=>setFormTab('${a.tab}'),100)"
               style="display:flex;align-items:center;gap:0.75rem;padding:1rem;border:1.5px solid var(--border);border-radius:var(--radius);cursor:pointer;transition:all 0.2s"
               onmouseover="this.style.borderColor='${a.color}';this.style.background='#f8f9ff'"
               onmouseout="this.style.borderColor='var(--border)';this.style.background=''">
            <div style="font-size:1.5rem">${a.icon}</div>
            <div style="font-size:0.82rem;font-weight:600;color:var(--text-primary)">${a.label}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ───────────────────────────────────────────────────
// EMPLOYEE FORMS
// ───────────────────────────────────────────────────
function renderEmpForms(container) {
  container.innerHTML = `
    <div class="section-header">
      <div>
        <div class="section-title">Nouvelle demande</div>
        <div class="section-sub">Remplissez le formulaire correspondant à votre besoin</div>
      </div>
    </div>

    <div class="forms-tabs" id="forms-tabs">
      <div class="form-tab active" data-tab="leave"    onclick="setFormTab('leave')">🏖️ Congé</div>
      <div class="form-tab"        data-tab="absence"  onclick="setFormTab('absence')">🏥 Absence</div>
      <div class="form-tab"        data-tab="personal" onclick="setFormTab('personal')">✏️ Infos perso.</div>
      <div class="form-tab"        data-tab="document" onclick="setFormTab('document')">📄 Document</div>
    </div>

    <div id="form-content"></div>
  `;

  setFormTab('leave');
}

function setFormTab(tab) {
  document.querySelectorAll('.form-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });

  const c = document.getElementById('form-content');
  if (!c) return;

  const forms = {
    leave:    renderLeaveForm,
    absence:  renderAbsenceForm,
    personal: renderPersonalForm,
    document: renderDocumentForm,
  };

  if (forms[tab]) forms[tab](c);
}

function renderLeaveForm(container) {
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">🏖️ Demande de congé</div>
          <div class="card-subtitle">Remplissez les informations relatives à votre demande de congé</div>
        </div>
        <span class="badge badge-info">Webhook: hr-leave-request</span>
      </div>
      <div class="card-body">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Type de congé *</label>
            <select class="form-select" id="leave-type">
              <option value="conge_annuel">Congé annuel</option>
              <option value="rtt">RTT</option>
              <option value="maladie">Congé maladie</option>
              <option value="maternite">Congé maternité/paternité</option>
              <option value="evenement">Congé événement familial</option>
              <option value="sans_solde">Congé sans solde</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Urgence *</label>
            <select class="form-select" id="leave-urgency">
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Date de début *</label>
            <input type="date" class="form-input" id="leave-from" />
          </div>
          <div class="form-group">
            <label class="form-label">Date de fin *</label>
            <input type="date" class="form-input" id="leave-to" />
          </div>
          <div class="form-group col-2">
            <label class="form-label">Motif / Description *</label>
            <textarea class="form-textarea" id="leave-reason" placeholder="Décrivez le motif de votre demande de congé..."></textarea>
          </div>
          <div class="form-group col-2">
            <label class="form-label">Couverture pendant l'absence</label>
            <input type="text" class="form-input" id="leave-cover" placeholder="Collègue qui assurera la continuité..." />
            <span class="form-hint">Optionnel — facilitera l'approbation</span>
          </div>
        </div>
        <div class="form-actions">
          <button class="btn btn-outline" onclick="resetForm()">Annuler</button>
          <button class="btn btn-primary" onclick="submitLeaveForm()">
            📤 Envoyer la demande
          </button>
        </div>
      </div>
    </div>
  `;

  // Set default dates
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 86400000);
  document.getElementById('leave-from').value = today.toISOString().split('T')[0];
  document.getElementById('leave-to').value   = nextWeek.toISOString().split('T')[0];
}

function renderAbsenceForm(container) {
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">🏥 Justificatif d'absence</div>
          <div class="card-subtitle">Justifiez une absence passée ou à venir</div>
        </div>
        <span class="badge badge-info">Webhook: hr-absence</span>
      </div>
      <div class="card-body">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Date de l'absence *</label>
            <input type="date" class="form-input" id="abs-date" />
          </div>
          <div class="form-group">
            <label class="form-label">Durée</label>
            <select class="form-select" id="abs-duration">
              <option value="demi_journee">Demi-journée</option>
              <option value="journee">Journée complète</option>
              <option value="plusieurs">Plusieurs jours</option>
            </select>
          </div>
          <div class="form-group col-2">
            <label class="form-label">Motif de l'absence *</label>
            <select class="form-select" id="abs-reason">
              <option value="medical">Rendez-vous médical</option>
              <option value="urgence_familiale">Urgence familiale</option>
              <option value="maladie">Maladie</option>
              <option value="accident">Accident</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div class="form-group col-2">
            <label class="form-label">Description complémentaire</label>
            <textarea class="form-textarea" id="abs-detail" placeholder="Précisions sur l'absence..."></textarea>
          </div>
          <div class="form-group col-2">
            <label class="form-label">Justificatif disponible *</label>
            <select class="form-select" id="abs-justif">
              <option value="ordonnance">Ordonnance médicale</option>
              <option value="certificat">Certificat médical</option>
              <option value="attestation">Attestation officielle</option>
              <option value="aucun">Aucun justificatif</option>
            </select>
          </div>
        </div>
        <div class="form-actions">
          <button class="btn btn-outline" onclick="resetForm()">Annuler</button>
          <button class="btn btn-primary" onclick="submitAbsenceForm()">
            📤 Envoyer le justificatif
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('abs-date').value = new Date().toISOString().split('T')[0];
}

function renderPersonalForm(container) {
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">✏️ Changement d'informations personnelles</div>
          <div class="card-subtitle">Demandez une mise à jour de vos données RH</div>
        </div>

        <span class="badge badge-info">Webhook: personal_change</span>

      </div>
      <div class="card-body">
        <div class="form-grid">
          <div class="form-group col-2">
            <label class="form-label">Champ à modifier *</label>
            <select class="form-select" id="pers-field">
              <option value="Adresse">Adresse</option>
              <option value="Téléphone">Téléphone</option>
              <option value="Situation">Situation</option>
              <option value="RIB">RIB</option>
            </select>
          </div>
          <div class="form-group col-2">
            <label class="form-label">Ancienne valeur</label>
<<<<<<< HEAD
            <input type="text" class="form-input" id="pers-old" placeholder="Valeur actuelle à modifier..." />
=======
            <input type="text" class="form-input" id="pers-old" placeholder="Valeur actuelle..." />
>>>>>>> 0c4bb3d0af0008c08ee59b28e113e1e8018c8c68
          </div>
          <div class="form-group col-2">
            <label class="form-label">Nouvelle valeur *</label>
            <input type="text" class="form-input" id="pers-new" placeholder="Nouvelle valeur..." />
          </div>
          <div class="form-group col-2">

            <label class="form-label">Motif</label>
            <textarea class="form-textarea" id="pers-reason" placeholder="Décrivez le motif de votre demande..."></textarea>

          </div>
        </div>
        <div class="form-actions">
          <button class="btn btn-outline" onclick="resetForm()">Annuler</button>
          <button class="btn btn-primary" onclick="submitPersonalForm()">
            📤 Envoyer la demande
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderDocumentForm(container) {
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">📄 Demande de document administratif</div>
          <div class="card-subtitle">Demandez un document officiel auprès du service RH</div>
        </div>
        <span class="badge badge-info">Webhook: hr-document</span>
      </div>
      <div class="card-body">
        <div class="form-grid">
          <div class="form-group col-2">
            <label class="form-label">Type de document *</label>
            <select class="form-select" id="doc-type">
              <option value="attestation_emploi">Attestation d'emploi</option>
              <option value="attestation_salaire">Attestation de salaire</option>
              <option value="bulletin_salaire">Bulletin de salaire (copie)</option>
              <option value="contrat_travail">Contrat de travail (copie)</option>
              <option value="certificat_travail">Certificat de travail</option>
              <option value="retraite">Relevé pour la retraite</option>
              <option value="autre">Autre document</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Urgence *</label>
            <select class="form-select" id="doc-urgency">
              <option value="normal">Normal (5 jours ouvrés)</option>
              <option value="urgent">Urgent (48h)</option>
              <option value="tres_urgent">Très urgent (24h)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Nombre d'exemplaires</label>
            <input type="number" class="form-input" id="doc-copies" value="1" min="1" max="10" />
          </div>
          <div class="form-group col-2">
            <label class="form-label">Motif de la demande *</label>
            <select class="form-select" id="doc-reason">
              <option value="banque">Dossier bancaire / crédit</option>
              <option value="logement">Dossier de logement</option>
              <option value="visa">Demande de visa</option>
              <option value="personnel">Usage personnel</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div class="form-group col-2">
            <label class="form-label">Informations complémentaires</label>
            <textarea class="form-textarea" id="doc-detail" placeholder="Précisions sur le document requis, destinataire, format souhaité..."></textarea>
          </div>
          <div class="form-group col-2">
            <label class="form-label">Fichier justificatif (optionnel)</label>
            <input type="file" class="form-input" id="doc-file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif" />
            <span class="form-hint">PDF, DOC, DOCX, JPG, PNG, GIF (Max 5MB)</span>
          </div>
        </div>
        <div class="form-actions">
          <button class="btn btn-outline" onclick="resetForm()">Annuler</button>
          <button class="btn btn-primary" onclick="submitDocumentForm()">
            📤 Demander le document
          </button>
        </div>
      </div>
    </div>
  `;
}

function resetForm() {
  showToast('Formulaire réinitialisé.', 'info');
  setFormTab(document.querySelector('.form-tab.active')?.dataset.tab || 'leave');
}

// ── Form submissions ──
function submitLeaveForm() {
  const from    = document.getElementById('leave-from')?.value;
  const to      = document.getElementById('leave-to')?.value;
  const type    = document.getElementById('leave-type')?.value;
  const reason  = document.getElementById('leave-reason')?.value;
  const urgency = document.getElementById('leave-urgency')?.value;
  const cover   = document.getElementById('leave-cover')?.value;

  if (!from || !to || !reason) { showToast('Veuillez remplir tous les champs obligatoires.', 'error'); return; }
  if (new Date(to) < new Date(from)) { showToast('La date de fin doit être après la date de début.', 'error'); return; }

  const days = Math.ceil((new Date(to) - new Date(from)) / 86400000) + 1;
  const data = { type, from, to, days, reason, urgency, cover };

  const newReq = {
    id: 'R' + Date.now(),
    type: 'leave',
    title: document.getElementById('leave-type').options[document.getElementById('leave-type').selectedIndex].text,
    employee: State.currentUser.id,
    employeeName: State.currentUser.name,
    dept: State.currentUser.dept,
    date: new Date().toISOString().split('T')[0],
    status: 'pending',
    details: data,
    comments: [],
    color: State.currentUser.color
  };
  State.requests.unshift(newReq);

  Webhook.sendRequest('leave_request', data)
    .then(() => showToast('Demande de congé envoyée avec succès ! 🎉', 'success'));

  setFormTab('leave');
  setTimeout(() => navigateTo('emp-status'), 1200);
}

function submitAbsenceForm() {
  const date    = document.getElementById('abs-date')?.value;
  const reason  = document.getElementById('abs-reason')?.value;
  const detail  = document.getElementById('abs-detail')?.value;
  const justif  = document.getElementById('abs-justif')?.value;
  const dur     = document.getElementById('abs-duration')?.value;

  if (!date) { showToast('Veuillez indiquer la date de l\'absence.', 'error'); return; }

  const data = { date, duration: dur, reason, detail, justification: justif };

  const newReq = {
    id: 'R' + Date.now(),
    type: 'absence',
    title: 'Justificatif d\'absence',
    employee: State.currentUser.id,
    employeeName: State.currentUser.name,
    dept: State.currentUser.dept,
    date: new Date().toISOString().split('T')[0],
    status: 'pending',
    details: data,
    comments: [],
    color: State.currentUser.color
  };
  State.requests.unshift(newReq);

  Webhook.sendRequest('absence_justif', data)
    .then(() => showToast('Justificatif soumis avec succès !', 'success'));

  setTimeout(() => navigateTo('emp-status'), 1200);
}

function submitPersonalForm() {
  const field  = document.getElementById('pers-field')?.value;
  const oldVal = document.getElementById('pers-old')?.value;
  const newVal = document.getElementById('pers-new')?.value;
  const reason = document.getElementById('pers-reason')?.value;

  if (!newVal) { showToast('Veuillez indiquer la nouvelle valeur.', 'error'); return; }

  const data = { field, oldValue: oldVal, newValue: newVal, reason };

  const newReq = {
    id: 'R' + Date.now(),
    type: 'personal',
    title: 'Changement: ' + document.getElementById('pers-field').options[document.getElementById('pers-field').selectedIndex].text,
    employee: State.currentUser.id,
    employeeName: State.currentUser.name,
    dept: State.currentUser.dept,
    date: new Date().toISOString().split('T')[0],
    status: 'pending',
    details: data,
    comments: [],
    color: State.currentUser.color
  };
  State.requests.unshift(newReq);

  Webhook.sendRequest('personal_change', data)
    .then(() => showToast('Demande de modification soumise !', 'success'));

  setTimeout(() => navigateTo('emp-status'), 1200);
}

function submitDocumentForm() {
  const docType = document.getElementById('doc-type')?.value;
  const urgency = document.getElementById('doc-urgency')?.value;
  const copies  = document.getElementById('doc-copies')?.value;
  const reason  = document.getElementById('doc-reason')?.value;
  const detail  = document.getElementById('doc-detail')?.value;
  const fileInput = document.getElementById('doc-file');

  const data = { documentType: docType, urgency, copies: parseInt(copies), reason, detail };

  // Handle file upload
  if (fileInput?.files?.length > 0) {
    const file = fileInput.files[0];
    
    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Le fichier dépasse 5MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      data.file = {
        name: file.name,
        type: file.type,
        size: file.size,
        data: reader.result.split(',')[1] // base64 data only
      };

      submitDocumentWithFile(data);
    };
    reader.readAsDataURL(file);
  } else {
    submitDocumentWithFile(data);
  }
}

function submitDocumentWithFile(data) {

  const newReq = {
    id: 'R' + Date.now(),
    type: 'document',
    title: document.getElementById('doc-type')
      .options[document.getElementById('doc-type').selectedIndex].text,
    employee: State.currentUser.id,
    employeeName: State.currentUser.name,
    dept: State.currentUser.dept,
    date: new Date().toISOString().split('T')[0],
    status: 'pending',
    details: data,
    comments: [],
    color: State.currentUser.color
  };
  State.requests.unshift(newReq);

  Webhook.sendRequest('document_request', data)
    .then(() => showToast('Demande de document envoyée !', 'success'));

  setTimeout(() => navigateTo('emp-status'), 1200);
}

// ───────────────────────────────────────────────────
// EMPLOYEE STATUS
// ───────────────────────────────────────────────────
function renderEmpStatus(container) {
  const user = State.currentUser;
  const myReqs = State.requests.filter(r => r.employee === user.id);

  container.innerHTML = `
    <div class="section-header">
      <div>
        <div class="section-title">Suivi de mes demandes</div>
        <div class="section-sub">${myReqs.length} demande(s) au total</div>
      </div>
      <button class="btn btn-primary" onclick="navigateTo('emp-forms')">+ Nouvelle demande</button>
    </div>

    <div class="card">
      ${myReqs.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <div class="empty-title">Aucune demande</div>
          <div class="empty-desc">Vous n'avez pas encore soumis de demande.</div>
          <button class="btn btn-primary" style="margin-top:1rem" onclick="navigateTo('emp-forms')">Créer une demande</button>
        </div>
      ` : `
        <div class="my-requests-list" style="padding:1rem">
          ${myReqs.map(r => `
            <div class="my-request-card" onclick="showRequestDetail('${r.id}')">
              <div class="my-request-header">
                <div>
                  <div style="display:flex;align-items:center;gap:0.5rem">
                    <span>${typeIcon(r.type)}</span>
                    <span class="my-request-type">${r.title}</span>
                  </div>
                  <div class="my-request-detail">${typeLabel(r.type)} · Soumis le ${formatDate(r.date)}</div>
                </div>
                <span class="badge badge-${r.status}">${statusIcon(r.status)} ${statusLabel(r.status)}</span>
              </div>
              ${r.comments.length > 0 ? `
                <div style="margin-top:0.65rem;padding:0.65rem;background:var(--bg);border-radius:var(--radius-sm);font-size:0.8rem;color:var(--text-secondary)">
                  💬 <strong>${r.comments[r.comments.length-1].author}</strong>: ${r.comments[r.comments.length-1].text}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;
}

// ───────────────────────────────────────────────────
// EMPLOYEE PROFILE
// ───────────────────────────────────────────────────
function renderEmpProfile(container) {
  const user = State.currentUser;

  container.innerHTML = `
    <div class="section-header">
      <div class="section-title">Mon profil</div>
    </div>

    <div class="content-grid">
      <div class="card">
        <div class="card-body">
          <div style="text-align:center;padding:1rem 0 1.5rem">
            <div style="width:80px;height:80px;border-radius:50%;background:${user.color};display:flex;align-items:center;justify-content:center;font-size:2rem;font-weight:800;color:white;margin:0 auto 1rem">
              ${user.avatar}
            </div>
            <div style="font-size:1.2rem;font-weight:800">${user.name}</div>
            <div style="color:var(--text-muted);font-size:0.85rem;margin-top:4px">${user.email}</div>
            <span class="badge badge-info" style="margin-top:0.5rem">${roleLabel(user.role)}</span>
          </div>

          <div style="display:grid;gap:0.75rem">
            ${[
              ['🏢', 'Département', user.dept],
              ['👨‍💼', 'Manager', user.manager],
              ['📅', 'Date d\'entrée', formatDate(user.joinDate)],
              ['🆔', 'Identifiant', user.id],
            ].map(([icon, label, val]) => `
              <div style="display:flex;justify-content:space-between;padding:0.65rem;background:var(--bg);border-radius:var(--radius-sm)">
                <span style="font-size:0.8rem;color:var(--text-secondary)">${icon} ${label}</span>
                <span style="font-size:0.8rem;font-weight:600">${val}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
<<<<<<< HEAD
=======
          <div class="card-title">📋 Informations personnelles</div>
        </div>
        <div class="card-body">
          <div style="display:grid;gap:0.75rem">
            ${[
              ['☎️', 'Téléphone', user.telephone],
              ['📍', 'Adresse', user.adresse],
              ['💑', 'Situation', user.situation],
              ['💳', 'RIB', maskRIB(user.rib)],
            ].map(([icon, label, val]) => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem;background:var(--bg);border-radius:var(--radius-sm);border:1px solid var(--border-light)">
                <div style="display:flex;flex-direction:column;gap:0.25rem;flex:1">
                  <span style="font-size:0.75rem;color:var(--text-secondary);font-weight:500">${icon} ${label}</span>
                  <span style="font-size:0.9rem;font-weight:600;color:var(--text-primary)">${val}</span>
                </div>
              </div>
            `).join('')}
          </div>
          <div style="margin-top:1rem;padding:0.75rem;background:var(--info-light);border-radius:var(--radius-sm);border-left:4px solid var(--info)">
            <span style="font-size:0.8rem;color:var(--info)">💡 Les informations affichées ici peuvent être modifiées via la section "Changement d'informations personnelles" du formulaire de demande.</span>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
>>>>>>> 0c4bb3d0af0008c08ee59b28e113e1e8018c8c68
          <div class="card-title">Statistiques personnelles</div>
        </div>
        <div class="chart-container" style="height:220px">
          <canvas id="emp-chart"></canvas>
        </div>
      </div>
    </div>
  `;

  setTimeout(() => {
    const myReqs = State.requests.filter(r => r.employee === user.id);
    const ctx = document.getElementById('emp-chart');
    if (!ctx) return;
    State.charts['emp-profile'] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['En attente', 'Approuvées', 'Refusées'],
        datasets: [{
          data: [
            myReqs.filter(r => r.status === 'pending').length,
            myReqs.filter(r => r.status === 'approved').length,
            myReqs.filter(r => r.status === 'rejected').length,
          ],
          backgroundColor: ['#fef3c7', '#d1fae5', '#fee2e2'],
          borderColor: ['#f59e0b', '#10b981', '#ef4444'],
          borderWidth: 2,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        cutout: '65%'
      }
    });
  }, 50);
}

// ───────────────────────────────────────────────────
// MANAGER DASHBOARD
// ───────────────────────────────────────────────────
function renderMgrDashboard(container) {
  const total    = State.requests.length;
  const pending  = State.requests.filter(r => r.status === 'pending').length;
  const approved = State.requests.filter(r => r.status === 'approved').length;
  const rejected = State.requests.filter(r => r.status === 'rejected').length;

  container.innerHTML = `
    <div class="section-header">
      <div>
        <div class="section-title">Vue d'ensemble équipe</div>
        <div class="section-sub">Gestion de l'équipe Engineering et Marketing</div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card blue">
        <div class="stat-header"><div class="stat-icon blue">👥</div><span class="stat-trend trend-flat">Actifs</span></div>
        <div class="stat-value">4</div>
        <div class="stat-label">Membres dans l'équipe</div>
      </div>
      <div class="stat-card amber">
        <div class="stat-header"><div class="stat-icon amber">⏳</div><span class="stat-trend trend-flat">À traiter</span></div>
        <div class="stat-value">${pending}</div>
        <div class="stat-label">Demandes en attente</div>
      </div>
      <div class="stat-card green">
        <div class="stat-header"><div class="stat-icon green">✅</div><span class="stat-trend trend-up">+${approved}</span></div>
        <div class="stat-value">${approved}</div>
        <div class="stat-label">Demandes approuvées</div>
      </div>
      <div class="stat-card red">
        <div class="stat-header"><div class="stat-icon red">❌</div><span class="stat-trend trend-down">${rejected}</span></div>
        <div class="stat-value">${rejected}</div>
        <div class="stat-label">Demandes refusées</div>
      </div>
    </div>

    <div class="content-grid">
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Demandes récentes</div>
            <div class="card-subtitle">À approuver ou refuser</div>
          </div>
          <span class="card-action" onclick="navigateTo('mgr-requests')">Tout voir →</span>
        </div>
        <div class="request-list">
          ${State.requests.filter(r => r.status === 'pending').slice(0, 5).map(r => `
            <div class="request-item">
              <div class="request-avatar" style="background:${r.color}">${r.employeeName.split(' ').map(w=>w[0]).join('')}</div>
              <div class="request-info">
                <div class="request-name">${r.employeeName}</div>
                <div class="request-meta">${r.title} · ${r.dept}</div>
              </div>
              <div class="request-right">
                <div class="action-btns">
                  <button class="btn-icon approve" onclick="actionRequest('approve','${r.id}')" title="Approuver">✓</button>
                  <button class="btn-icon reject"  onclick="actionRequest('reject','${r.id}')"  title="Refuser">✗</button>
                  <button class="btn-icon view"    onclick="showRequestDetail('${r.id}')"       title="Voir détails">👁</button>
                </div>
              </div>
            </div>
          `).join('') || '<div class="empty-state" style="padding:2rem"><div class="empty-icon">🎉</div><div class="empty-title">Aucune demande en attente</div></div>'}
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">Répartition des demandes</div>
        </div>
        <div class="chart-container" style="height:240px">
          <canvas id="mgr-pie"></canvas>
        </div>
      </div>
    </div>
  `;

  setTimeout(() => {
    const ctx = document.getElementById('mgr-pie');
    if (!ctx) return;
    const byType = {};
    State.requests.forEach(r => { byType[r.type] = (byType[r.type] || 0) + 1; });

    State.charts['mgr-pie'] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(byType).map(typeLabel),
        datasets: [{
          data: Object.values(byType),
          backgroundColor: ['#e0e7ff','#d1fae5','#fef3c7','#dbeafe'],
          borderColor:     ['#6366f1','#10b981','#f59e0b','#3b82f6'],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } },
        cutout: '60%'
      }
    });
  }, 50);
}

// ───────────────────────────────────────────────────
// REQUESTS TABLE (Manager & HR)
// ───────────────────────────────────────────────────
function renderMgrRequests(container) { renderRequestsTable(container, 'manager'); }
function renderHRRequests(container)  { renderRequestsTable(container, 'hr'); }

function renderRequestsTable(container, role) {
  container.innerHTML = `
    <div class="section-header">
      <div>
        <div class="section-title">Gestion des demandes</div>
        <div class="section-sub">${State.requests.length} demande(s) au total</div>
      </div>
      <div style="display:flex;gap:0.5rem">
        <span class="badge badge-pending">${State.requests.filter(r=>r.status==='pending').length} en attente</span>
        <span class="badge badge-approved">${State.requests.filter(r=>r.status==='approved').length} approuvées</span>
        <span class="badge badge-rejected">${State.requests.filter(r=>r.status==='rejected').length} refusées</span>
      </div>
    </div>

    <div class="card">
      <div class="filter-bar">
        <div class="search-input-wrap">
          <span class="search-icon">🔍</span>
          <input type="text" class="search-input" id="req-search" placeholder="Rechercher un employé, une demande..." oninput="filterRequests()" />
        </div>
        <select class="filter-select" id="req-status-filter" onchange="filterRequests()">
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="approved">Approuvées</option>
          <option value="rejected">Refusées</option>
        </select>
        <select class="filter-select" id="req-type-filter" onchange="filterRequests()">
          <option value="">Tous les types</option>
          <option value="leave">Congé</option>
          <option value="absence">Absence</option>
          <option value="personal">Info perso.</option>
          <option value="document">Document</option>
        </select>
        <select class="filter-select" id="req-dept-filter" onchange="filterRequests()">
          <option value="">Tous les depts</option>
          <option value="Engineering">Engineering</option>
          <option value="Design">Design</option>
          <option value="Marketing">Marketing</option>
        </select>
      </div>

      <div class="table-wrapper">
        <table id="requests-table">
          <thead>
            <tr>
              <th>Employé</th>
              <th>Type</th>
              <th>Demande</th>
              <th>Département</th>
              <th>Date</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="requests-tbody">
            ${renderRequestsRows(State.requests)}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderRequestsRows(requests) {
  if (requests.length === 0) {
    return `<tr><td colspan="7" style="text-align:center;padding:3rem;color:var(--text-muted)">Aucune demande trouvée</td></tr>`;
  }

  return requests.map(r => `
    <tr>
      <td>
        <div class="table-avatar">
          <div class="table-avatar-circle" style="background:${r.color}">${r.employeeName.split(' ').map(w=>w[0]).join('')}</div>
          <div>
            <div class="table-name">${r.employeeName}</div>
            <div class="table-sub">${r.dept}</div>
          </div>
        </div>
      </td>
      <td><span style="font-size:1rem">${typeIcon(r.type)}</span> ${typeLabel(r.type)}</td>
      <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.title}</td>
      <td>${r.dept}</td>
      <td style="color:var(--text-secondary)">${formatDate(r.date)}</td>
      <td><span class="badge badge-${r.status}">${statusIcon(r.status)} ${statusLabel(r.status)}</span></td>
      <td>
        <div class="action-btns">
          ${r.status === 'pending' ? `
            <button class="btn-icon approve" onclick="actionRequest('approve','${r.id}')" title="Approuver">✓</button>
            <button class="btn-icon reject"  onclick="actionRequest('reject','${r.id}')"  title="Refuser">✗</button>
          ` : ''}
          <button class="btn-icon comment" onclick="openCommentModal('${r.id}')" title="Commenter">💬</button>
          <button class="btn-icon view"    onclick="showRequestDetail('${r.id}')"  title="Détails">👁</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterRequests() {
  const search = (document.getElementById('req-search')?.value || '').toLowerCase();
  const status = document.getElementById('req-status-filter')?.value || '';
  const type   = document.getElementById('req-type-filter')?.value || '';
  const dept   = document.getElementById('req-dept-filter')?.value || '';

  const filtered = State.requests.filter(r => {
    const matchSearch = !search || r.employeeName.toLowerCase().includes(search) || r.title.toLowerCase().includes(search);
    const matchStatus = !status || r.status === status;
    const matchType   = !type   || r.type === type;
    const matchDept   = !dept   || r.dept === dept;
    return matchSearch && matchStatus && matchType && matchDept;
  });

  const tbody = document.getElementById('requests-tbody');
  if (tbody) tbody.innerHTML = renderRequestsRows(filtered);
}

// ───────────────────────────────────────────────────
// REQUEST ACTIONS
// ───────────────────────────────────────────────────
function actionRequest(action, requestId) {
  const req = State.requests.find(r => r.id === requestId);
  if (!req) return;

  if (action === 'reject') {
    openModal(`
      <div class="modal-header">
        <div>
          <div class="modal-title">Refuser la demande</div>
          <div class="modal-subtitle">${req.title} · ${req.employeeName}</div>
        </div>
        <button class="modal-close" onclick="closeModal()">✕</button>
      </div>
      <div class="form-group" style="margin-bottom:1.25rem">
        <label class="form-label">Motif du refus *</label>
        <textarea class="form-textarea" id="reject-reason" placeholder="Expliquez le motif du refus à l'employé..." style="min-height:120px"></textarea>
      </div>
      <div class="form-actions" style="border:none;margin:0;padding:0">
        <button class="btn btn-outline" onclick="closeModal()">Annuler</button>
        <button class="btn btn-danger" onclick="confirmReject('${requestId}')">Confirmer le refus</button>
      </div>
    `);
    return;
  }

  req.status = 'approved';
  Webhook.sendAction('approve', requestId)
    .then(() => showToast(`Demande de ${req.employeeName} approuvée ✅`, 'success'));

  refreshRequestsView();
  updateNavBadges();
}

function confirmReject(requestId) {
  const reason = document.getElementById('reject-reason')?.value;
  if (!reason) { showToast('Veuillez indiquer un motif de refus.', 'error'); return; }

  const req = State.requests.find(r => r.id === requestId);
  if (!req) return;

  req.status = 'rejected';
  req.comments.push({
    author: State.currentUser.name,
    role: roleLabel(State.currentUser.role),
    text: reason,
    date: new Date().toISOString().split('T')[0]
  });

  Webhook.sendAction('reject', requestId, { reason })
    .then(() => showToast(`Demande de ${req.employeeName} refusée.`, 'warning'));

  closeModal();
  refreshRequestsView();
  updateNavBadges();
}

function openCommentModal(requestId) {
  const req = State.requests.find(r => r.id === requestId);
  if (!req) return;

  openModal(`
    <div class="modal-header">
      <div>
        <div class="modal-title">Ajouter un commentaire</div>
        <div class="modal-subtitle">${req.title} · ${req.employeeName}</div>
      </div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    ${req.comments.length > 0 ? `
      <div class="comment-box">
        <div class="comment-header">Commentaires existants (${req.comments.length})</div>
        <div class="comment-list">
          ${req.comments.map(c => `
            <div class="comment-item">
              <span class="comment-author">${c.author}</span>
              <span class="comment-date"> · ${c.role} · ${formatDate(c.date)}</span>
              <div class="comment-text">${c.text}</div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}
    <div class="form-group" style="margin:1.25rem 0">
      <label class="form-label">Nouveau commentaire</label>
      <textarea class="form-textarea" id="new-comment" placeholder="Écrivez votre commentaire..." style="min-height:100px"></textarea>
    </div>
    <div class="form-actions" style="border:none;margin:0;padding:0">
      <button class="btn btn-outline" onclick="closeModal()">Annuler</button>
      <button class="btn btn-primary" onclick="submitComment('${requestId}')">Envoyer le commentaire</button>
    </div>
  `);
}

function submitComment(requestId) {
  const text = document.getElementById('new-comment')?.value.trim();
  if (!text) { showToast('Veuillez écrire un commentaire.', 'error'); return; }

  const req = State.requests.find(r => r.id === requestId);
  if (!req) return;

  req.comments.push({
    author: State.currentUser.name,
    role: roleLabel(State.currentUser.role),
    text,
    date: new Date().toISOString().split('T')[0]
  });

  Webhook.sendComment(requestId, text)
    .then(() => showToast('Commentaire envoyé !', 'success'));

  closeModal();
  refreshRequestsView();
}

function showRequestDetail(requestId) {
  const req = State.requests.find(r => r.id === requestId);
  if (!req) return;

  const detailRows = Object.entries(req.details).map(([k, v]) => `
    <div class="detail-item">
      <div class="detail-label">${k.replace(/_/g, ' ')}</div>
      <div class="detail-value">${v || '—'}</div>
    </div>
  `).join('');

  const canAction = State.currentUser.role !== 'employee' && req.status === 'pending';

  openModal(`
    <div class="modal-header">
      <div>
        <div class="modal-title">${typeIcon(req.type)} ${req.title}</div>
        <div class="modal-subtitle">${req.employeeName} · ${req.dept} · ${formatDate(req.date)}</div>
      </div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>

    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem">
      <span class="badge badge-${req.status}" style="font-size:0.82rem;padding:5px 12px">${statusIcon(req.status)} ${statusLabel(req.status)}</span>
      <span style="font-size:0.75rem;color:var(--text-muted)">ID: ${req.id}</span>
    </div>

    <div class="detail-grid">
      ${detailRows}
    </div>

    ${req.comments.length > 0 ? `
      <div class="comment-box">
        <div class="comment-header">Commentaires (${req.comments.length})</div>
        <div class="comment-list">
          ${req.comments.map(c => `
            <div class="comment-item">
              <span class="comment-author">${c.author}</span>
              <span class="comment-date"> · ${c.role} · ${formatDate(c.date)}</span>
              <div class="comment-text">${c.text}</div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    ${canAction ? `
      <div style="display:flex;gap:0.75rem;margin-top:1.25rem">
        <button class="btn btn-success" style="flex:1" onclick="closeModal();actionRequest('approve','${req.id}')">✓ Approuver</button>
        <button class="btn btn-danger"  style="flex:1" onclick="closeModal();actionRequest('reject','${req.id}')">✗ Refuser</button>
        <button class="btn btn-outline" onclick="closeModal();openCommentModal('${req.id}')">💬 Commenter</button>
      </div>
    ` : ''}
  `, 'modal-lg');
}

function refreshRequestsView() {
  const page = State.currentPage;
  if (page === 'mgr-requests' || page === 'hr-requests') {
    const container = document.getElementById('page-content');
    if (container) renderRequestsTable(container, State.currentUser.role);
  }
}

function updateNavBadges() {
  const pending = pendingCountAll();
  document.querySelectorAll('.nav-badge').forEach(b => {
    b.textContent = pending || '';
    b.style.display = pending ? 'inline-block' : 'none';
  });
}

// ───────────────────────────────────────────────────
// MANAGER TEAM
// ───────────────────────────────────────────────────
function renderMgrTeam(container) {
  const team = State.DEMO_USERS.filter(u => u.role === 'employee');

  container.innerHTML = `
    <div class="section-header">
      <div class="section-title">Mon équipe</div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1.25rem">
      ${team.map(u => {
        const myReqs = State.requests.filter(r => r.employee === u.id);
        const pending = myReqs.filter(r => r.status === 'pending').length;
        return `
          <div class="card" style="transition:all 0.2s" onmouseover="this.style.boxShadow='var(--shadow-md)'" onmouseout="this.style.boxShadow=''">
            <div class="card-body">
              <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.25rem">
                <div style="width:52px;height:52px;border-radius:50%;background:${u.color};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1.1rem;color:white">${u.avatar}</div>
                <div>
                  <div style="font-weight:700;font-size:0.95rem">${u.name}</div>
                  <div style="font-size:0.78rem;color:var(--text-muted)">${u.dept}</div>
                  <span class="badge badge-info" style="margin-top:3px">${roleLabel(u.role)}</span>
                </div>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.5rem;text-align:center;padding:0.75rem;background:var(--bg);border-radius:var(--radius-sm)">
                <div><div style="font-size:1.1rem;font-weight:700">${myReqs.length}</div><div style="font-size:0.7rem;color:var(--text-muted)">Total</div></div>
                <div><div style="font-size:1.1rem;font-weight:700;color:var(--warning)">${pending}</div><div style="font-size:0.7rem;color:var(--text-muted)">En attente</div></div>
                <div><div style="font-size:1.1rem;font-weight:700;color:var(--accent)">${myReqs.filter(r=>r.status==='approved').length}</div><div style="font-size:0.7rem;color:var(--text-muted)">Approuvées</div></div>
              </div>
              <div style="margin-top:1rem">
                <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:0.35rem">Taux d'approbation</div>
                <div class="progress-bar-wrap">
                  <div class="progress-bar-fill" style="width:${myReqs.length ? Math.round(myReqs.filter(r=>r.status==='approved').length/myReqs.length*100) : 0}%;background:${u.color}"></div>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ───────────────────────────────────────────────────
// HR DASHBOARD
// ───────────────────────────────────────────────────
function renderHRDashboard(container) {
  const total    = State.DEMO_USERS.filter(u => u.role === 'employee').length;
  const pending  = State.requests.filter(r => r.status === 'pending').length;
  const approved = State.requests.filter(r => r.status === 'approved').length;
  const rejected = State.requests.filter(r => r.status === 'rejected').length;
  const totalReq = State.requests.length;

  container.innerHTML = `
    <div class="section-header">
      <div>
        <div class="section-title">Tableau de bord RH</div>
        <div class="section-sub">Vue globale de l'organisation — Avril 2026</div>
      </div>
      <button class="btn btn-primary" onclick="navigateTo('hr-requests')">
        📬 Gérer les demandes
      </button>
    </div>

    <div class="stats-grid">
      <div class="stat-card blue">
        <div class="stat-header"><div class="stat-icon blue">👥</div><span class="stat-trend trend-up">+2 ce mois</span></div>
        <div class="stat-value">${State.DEMO_USERS.length}</div>
        <div class="stat-label">Employés actifs</div>
      </div>
      <div class="stat-card amber">
        <div class="stat-header"><div class="stat-icon amber">⏳</div><span class="stat-trend trend-flat">${Math.round(pending/totalReq*100)}%</span></div>
        <div class="stat-value">${pending}</div>
        <div class="stat-label">Demandes en attente</div>
      </div>
      <div class="stat-card green">
        <div class="stat-header"><div class="stat-icon green">✅</div><span class="stat-trend trend-up">${Math.round(approved/totalReq*100)}%</span></div>
        <div class="stat-value">${approved}</div>
        <div class="stat-label">Demandes approuvées</div>
      </div>
      <div class="stat-card red">
        <div class="stat-header"><div class="stat-icon red">❌</div><span class="stat-trend trend-down">${Math.round(rejected/totalReq*100)}%</span></div>
        <div class="stat-value">${rejected}</div>
        <div class="stat-label">Demandes refusées</div>
      </div>
      <div class="stat-card indigo">
        <div class="stat-header"><div class="stat-icon indigo">📝</div><span class="stat-trend trend-up">+3 ce mois</span></div>
        <div class="stat-value">${totalReq}</div>
        <div class="stat-label">Total demandes</div>
      </div>
    </div>

    <div class="content-grid">
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Demandes par statut — Évolution mensuelle</div>
          </div>
        </div>
        <div class="chart-container" style="height:240px">
          <canvas id="hr-bar-chart"></canvas>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Répartition par type</div>
          </div>
        </div>
        <div class="chart-container" style="height:240px">
          <canvas id="hr-doughnut"></canvas>
        </div>
      </div>
    </div>

    <div class="content-grid">
      <div class="card">
        <div class="card-header">
          <div class="card-title">Demandes urgentes</div>
          <span class="badge badge-pending">${pending} en attente</span>
        </div>
        <div class="request-list">
          ${State.requests.filter(r => r.status === 'pending').slice(0, 4).map(r => `
            <div class="request-item" onclick="showRequestDetail('${r.id}')">
              <div class="request-avatar" style="background:${r.color}">${r.employeeName.split(' ').map(w=>w[0]).join('')}</div>
              <div class="request-info">
                <div class="request-name">${r.employeeName}</div>
                <div class="request-meta">${r.title} · ${r.dept}</div>
              </div>
              <div class="request-right">
                <div class="action-btns">
                  <button class="btn-icon approve" onclick="event.stopPropagation();actionRequest('approve','${r.id}')" title="Approuver">✓</button>
                  <button class="btn-icon reject"  onclick="event.stopPropagation();actionRequest('reject','${r.id}')"  title="Refuser">✗</button>
                </div>
              </div>
            </div>
          `).join('') || '<div class="empty-state" style="padding:2rem"><div class="empty-icon">🎉</div><div class="empty-title">Aucune demande urgente</div></div>'}
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">Activité récente</div>
        </div>
        <div class="activity-list">
          ${State.requests.slice(0, 5).map(r => `
            <div class="activity-item">
              <div class="activity-dot" style="background:${r.status==='pending'?'#f59e0b':r.status==='approved'?'#10b981':'#ef4444'}"></div>
              <div class="activity-content">
                <div class="activity-text"><strong>${r.employeeName}</strong> a soumis <em>${r.title}</em></div>
                <div class="activity-time">${formatDate(r.date)} · <span class="badge badge-${r.status}" style="font-size:0.65rem;padding:1px 6px">${statusLabel(r.status)}</span></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  setTimeout(() => {
    // Bar chart
    const ctx1 = document.getElementById('hr-bar-chart');
    if (ctx1) {
      State.charts['hr-bar'] = new Chart(ctx1, {
        type: 'bar',
        data: {
          labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
          datasets: [
            { label: 'En attente', data: [3, 5, 4, pending, 0, 0], backgroundColor: '#fef3c7', borderColor: '#f59e0b', borderWidth: 2, borderRadius: 6 },
            { label: 'Approuvées', data: [8, 10, 12, approved, 0, 0], backgroundColor: '#d1fae5', borderColor: '#10b981', borderWidth: 2, borderRadius: 6 },
            { label: 'Refusées',   data: [2, 1, 3, rejected, 0, 0],  backgroundColor: '#fee2e2', borderColor: '#ef4444', borderWidth: 2, borderRadius: 6 },
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } } },
          scales: { x: { grid: { display: false } }, y: { grid: { color: '#f1f5f9' }, beginAtZero: true } }
        }
      });
    }

    // Doughnut chart
    const ctx2 = document.getElementById('hr-doughnut');
    if (ctx2) {
      const byType = {};
      State.requests.forEach(r => { byType[r.type] = (byType[r.type] || 0) + 1; });
      State.charts['hr-doughnut'] = new Chart(ctx2, {
        type: 'doughnut',
        data: {
          labels: Object.keys(byType).map(typeLabel),
          datasets: [{
            data: Object.values(byType),
            backgroundColor: ['#e0e7ff','#d1fae5','#fef3c7','#dbeafe'],
            borderColor: ['#6366f1','#10b981','#f59e0b','#3b82f6'],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } } },
          cutout: '60%'
        }
      });
    }
  }, 50);
}

// ───────────────────────────────────────────────────
// HR EMPLOYEES
// ───────────────────────────────────────────────────
function renderHREmployees(container) {
  container.innerHTML = `
    <div class="section-header">
      <div class="section-title">Gestion des employés</div>
    </div>

    <div class="card">
      <div class="filter-bar">
        <div class="search-input-wrap">
          <span class="search-icon">🔍</span>
          <input type="text" class="search-input" placeholder="Rechercher un employé..." />
        </div>
        <select class="filter-select">
          <option>Tous les rôles</option>
          <option>Employé</option>
          <option>Manager</option>
          <option>RH</option>
        </select>
        <select class="filter-select">
          <option>Tous les depts</option>
          <option>Engineering</option>
          <option>Design</option>
          <option>Marketing</option>
          <option>Human Resources</option>
        </select>
      </div>

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Employé</th>
              <th>Rôle</th>
              <th>Département</th>
              <th>Manager</th>
              <th>Date d'entrée</th>
              <th>Demandes</th>
              <th>Taux approbation</th>
            </tr>
          </thead>
          <tbody>
            ${State.DEMO_USERS.map(u => {
              const reqs = State.requests.filter(r => r.employee === u.id);
              const approved = reqs.filter(r => r.status === 'approved').length;
              const rate = reqs.length ? Math.round(approved / reqs.length * 100) : '—';
              return `
                <tr>
                  <td>
                    <div class="table-avatar">
                      <div class="table-avatar-circle" style="background:${u.color}">${u.avatar}</div>
                      <div>
                        <div class="table-name">${u.name}</div>
                        <div class="table-sub">${u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span class="badge badge-info">${roleLabel(u.role)}</span></td>
                  <td>${u.dept}</td>
                  <td style="color:var(--text-secondary)">${u.manager}</td>
                  <td style="color:var(--text-secondary)">${formatDate(u.joinDate)}</td>
                  <td>${reqs.length > 0 ? `<span style="font-weight:600">${reqs.length}</span> <span style="color:var(--text-muted);font-size:0.8rem">(${reqs.filter(r=>r.status==='pending').length} en attente)</span>` : '—'}</td>
                  <td>
                    ${reqs.length ? `
                      <div style="display:flex;align-items:center;gap:0.5rem">
                        <div style="flex:1;max-width:80px">
                          <div class="progress-bar-wrap">
                            <div class="progress-bar-fill" style="width:${rate}%;background:${u.color}"></div>
                          </div>
                        </div>
                        <span style="font-size:0.78rem;font-weight:600">${rate}%</span>
                      </div>
                    ` : '—'}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ───────────────────────────────────────────────────
// STATISTICS
// ───────────────────────────────────────────────────
function renderStats(container) {
  const total    = State.requests.length;
  const pending  = State.requests.filter(r => r.status === 'pending').length;
  const approved = State.requests.filter(r => r.status === 'approved').length;
  const rejected = State.requests.filter(r => r.status === 'rejected').length;

  container.innerHTML = `
    <div class="section-header">
      <div class="section-title">Statistiques & Analytique</div>
    </div>

    <div class="stats-grid">
      <div class="stat-card indigo">
        <div class="stat-header"><div class="stat-icon indigo">📊</div><span class="stat-trend trend-up">+12%</span></div>
        <div class="stat-value">${total}</div>
        <div class="stat-label">Demandes totales</div>
      </div>
      <div class="stat-card green">
        <div class="stat-header"><div class="stat-icon green">📈</div><span class="stat-trend trend-up">${total ? Math.round(approved/total*100) : 0}%</span></div>
        <div class="stat-value">${total ? Math.round(approved/total*100) : 0}%</div>
        <div class="stat-label">Taux d'approbation</div>
      </div>
      <div class="stat-card amber">
        <div class="stat-header"><div class="stat-icon amber">⏱️</div><span class="stat-trend trend-flat">~2.3j</span></div>
        <div class="stat-value">2.3j</div>
        <div class="stat-label">Délai moyen traitement</div>
      </div>
      <div class="stat-card blue">
        <div class="stat-header"><div class="stat-icon blue">📅</div><span class="stat-trend trend-up">+3</span></div>
        <div class="stat-value">8</div>
        <div class="stat-label">Demandes ce mois</div>
      </div>
    </div>

    <div class="content-grid">
      <div class="card">
        <div class="card-header"><div class="card-title">Évolution sur 6 mois</div></div>
        <div class="chart-container" style="height:260px">
          <canvas id="stat-line"></canvas>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><div class="card-title">Statuts globaux</div></div>
        <div class="chart-container" style="height:260px">
          <canvas id="stat-pie"></canvas>
        </div>
      </div>
    </div>

    <div class="content-grid">
      <div class="card">
        <div class="card-header"><div class="card-title">Demandes par département</div></div>
        <div class="chart-container" style="height:240px">
          <canvas id="stat-dept"></canvas>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><div class="card-title">Types de demandes</div></div>
        <div class="chart-container" style="height:240px">
          <canvas id="stat-types"></canvas>
        </div>
      </div>
    </div>
  `;

  setTimeout(() => {
    const byType = {};
    const byDept = {};
    State.requests.forEach(r => {
      byType[r.type] = (byType[r.type] || 0) + 1;
      byDept[r.dept] = (byDept[r.dept] || 0) + 1;
    });

    // Line chart
    const ctxL = document.getElementById('stat-line');
    if (ctxL) {
      State.charts['stat-line'] = new Chart(ctxL, {
        type: 'line',
        data: {
          labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
          datasets: [
            { label: 'Approuvées', data: [8,10,12,approved,0,0], borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.08)', tension: 0.4, fill: true, pointRadius: 4 },
            { label: 'Refusées',   data: [2, 1, 3, rejected,0,0], borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.05)', tension: 0.4, fill: true, pointRadius: 4 },
            { label: 'En attente', data: [3, 5, 4, pending, 0,0], borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.06)', tension: 0.4, fill: true, pointRadius: 4 },
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } } },
          scales: { x: { grid: { display: false } }, y: { grid: { color: '#f1f5f9' }, beginAtZero: true } }
        }
      });
    }

    // Status pie
    const ctxP = document.getElementById('stat-pie');
    if (ctxP) {
      State.charts['stat-pie'] = new Chart(ctxP, {
        type: 'pie',
        data: {
          labels: ['En attente', 'Approuvées', 'Refusées'],
          datasets: [{
            data: [pending, approved, rejected],
            backgroundColor: ['#fef3c7', '#d1fae5', '#fee2e2'],
            borderColor: ['#f59e0b','#10b981','#ef4444'],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } }
        }
      });
    }

    // Dept bar
    const ctxD = document.getElementById('stat-dept');
    if (ctxD) {
      State.charts['stat-dept'] = new Chart(ctxD, {
        type: 'bar',
        data: {
          labels: Object.keys(byDept),
          datasets: [{
            label: 'Demandes',
            data: Object.values(byDept),
            backgroundColor: ['#e0e7ff','#d1fae5','#fef3c7','#dbeafe'],
            borderColor: ['#6366f1','#10b981','#f59e0b','#3b82f6'],
            borderWidth: 2, borderRadius: 8
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { x: { grid: { display: false } }, y: { grid: { color: '#f1f5f9' }, beginAtZero: true } }
        }
      });
    }

    // Type bar
    const ctxT = document.getElementById('stat-types');
    if (ctxT) {
      State.charts['stat-types'] = new Chart(ctxT, {
        type: 'horizontalBar',
        type: 'bar',
        data: {
          labels: Object.keys(byType).map(typeLabel),
          datasets: [{
            label: 'Nombre',
            data: Object.values(byType),
            backgroundColor: '#e0e7ff',
            borderColor: '#6366f1',
            borderWidth: 2, borderRadius: 8
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { x: { grid: { color: '#f1f5f9' }, beginAtZero: true }, y: { grid: { display: false } } }
        }
      });
    }
  }, 50);
}

// ───────────────────────────────────────────────────
// WEBHOOK LOGS
// ───────────────────────────────────────────────────
function renderWebhookLogs(container) {
  container.innerHTML = `
    <div class="section-header">
      <div>
        <div class="section-title">Logs Webhook</div>
        <div class="section-sub">Historique des événements JSON envoyés vers les webhooks</div>
      </div>
      <button class="btn btn-outline" onclick="clearWebhookLogs()">🗑 Vider les logs</button>
    </div>

    <div class="stats-grid" style="grid-template-columns:repeat(4,1fr)">
      ${Object.entries(State.WEBHOOKS).map(([key, url]) => `
        <div class="stat-card blue" style="cursor:default">
          <div style="font-size:0.72rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.35rem">
            ${key.replace(/_/g, ' ')}
          </div>
          <div style="font-size:0.78rem;color:var(--primary);word-break:break-all">
            ${url.replace('https://webhook.site/', 'wh.site/')}
          </div>
          <div style="margin-top:0.5rem">
            <span class="webhook-status sent"><span class="webhook-status-dot"></span>Configuré</span>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title">Journal des requêtes</div>
        <span style="font-size:0.78rem;color:var(--text-muted)">${State.webhookLogs.length} événement(s)</span>
      </div>
      <div style="padding:1.25rem">
        ${State.webhookLogs.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">📡</div>
            <div class="empty-title">Aucun webhook envoyé</div>
            <div class="empty-desc">Les événements apparaîtront ici après vos actions.</div>
          </div>
        ` : `
          <div class="webhook-log" id="webhook-log"></div>
        `}
      </div>
    </div>

    <div class="card" style="margin-top:1.25rem">
      <div class="card-header">
        <div class="card-title">Exemple de payload JSON</div>
      </div>
      <div style="padding:1.25rem">
        <div class="webhook-log">
          <div class="log-data">${JSON.stringify({
            event: "request_submitted",
            request_type: "leave_request",
            timestamp: new Date().toISOString(),
            submitted_by: { id: "U001", name: "Alice Martin", email: "alice@hrflow.io", dept: "Engineering" },
            data: { type: "conge_annuel", from: "2026-05-01", to: "2026-05-10", days: 10, reason: "Vacances familiales", urgency: "normal" }
          }, null, 2)}</div>
        </div>
      </div>
    </div>
  `;

  setTimeout(updateWebhookLog, 50);
}

function clearWebhookLogs() {
  State.webhookLogs = [];
  showToast('Logs effacés.', 'info');
  renderWebhookLogs(document.getElementById('page-content'));
}

// ───────────────────────────────────────────────────
// PROFILE & NOTIFICATIONS MODALS
// ───────────────────────────────────────────────────
function openProfileModal() {
  const u = State.currentUser;
  openModal(`
    <div class="modal-header">
      <div class="modal-title">Mon profil</div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div style="text-align:center;padding:1rem 0 1.5rem">
      <div style="width:72px;height:72px;border-radius:50%;background:${u.color};display:flex;align-items:center;justify-content:center;font-size:1.75rem;font-weight:800;color:white;margin:0 auto 0.75rem">${u.avatar}</div>
      <div style="font-size:1.1rem;font-weight:700">${u.name}</div>
      <div style="color:var(--text-muted);font-size:0.85rem">${u.email}</div>
      <span class="badge badge-info" style="margin-top:0.5rem">${roleLabel(u.role)}</span>
    </div>
    <div style="display:grid;gap:0.5rem">
      ${[['🏢','Département',u.dept],['👨‍💼','Manager',u.manager],['📅','Entrée',formatDate(u.joinDate)]].map(([i,l,v])=>`
        <div style="display:flex;justify-content:space-between;padding:0.6rem 0.875rem;background:var(--bg);border-radius:var(--radius-sm)">
          <span style="font-size:0.82rem;color:var(--text-secondary)">${i} ${l}</span>
          <span style="font-size:0.82rem;font-weight:600">${v}</span>
        </div>
      `).join('')}
    </div>
    <button class="btn btn-danger btn-full" style="margin-top:1.25rem" onclick="closeModal();doLogout()">🚪 Déconnexion</button>
  `);
}

function openNotifications() {
  const notifications = [
    { icon: '📬', text: 'Nouvelle demande de congé reçue', time: 'Il y a 5 min', unread: true },
    { icon: '✅', text: 'Demande de David Chen approuvée', time: 'Il y a 1h', unread: true },
    { icon: '💬', text: 'Commentaire ajouté par Bob Dupont', time: 'Il y a 2h', unread: false },
    { icon: '📄', text: 'Document administratif prêt', time: 'Il y a 3h', unread: false },
  ];

  openModal(`
    <div class="modal-header">
      <div class="modal-title">Notifications</div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    ${notifications.map(n => `
      <div style="display:flex;gap:0.875rem;padding:0.875rem;border-radius:var(--radius-sm);background:${n.unread?'var(--primary-light)':'var(--bg)'};margin-bottom:0.5rem">
        <span style="font-size:1.25rem">${n.icon}</span>
        <div>
          <div style="font-size:0.85rem;font-weight:${n.unread?'600':'500'}">${n.text}</div>
          <div style="font-size:0.72rem;color:var(--text-muted);margin-top:2px">${n.time}</div>
        </div>
        ${n.unread ? '<div style="width:8px;height:8px;border-radius:50%;background:var(--primary);margin-left:auto;margin-top:6px;flex-shrink:0"></div>' : ''}
      </div>
    `).join('')}
  `);
}

// ───────────────────────────────────────────────────
// HELPERS
// ───────────────────────────────────────────────────
function typeLabel(type) {
  return { leave: 'Congé', absence: 'Absence', personal: 'Info perso.', document: 'Document' }[type] || type;
}

function typeIcon(type) {
  return { leave: '🏖️', absence: '🏥', personal: '✏️', document: '📄' }[type] || '📝';
}

function statusLabel(status) {
  return { pending: 'En attente', approved: 'Approuvée', rejected: 'Refusée' }[status] || status;
}

function statusIcon(status) {
  return { pending: '⏳', approved: '✅', rejected: '❌' }[status] || '';
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

// ───────────────────────────────────────────────────
// INIT
// ───────────────────────────────────────────────────
function init() {
  const saved = sessionStorage.getItem('hrflow_user');
  if (saved) {
    try {
      State.currentUser = JSON.parse(saved);
      renderApp();
      return;
    } catch(e) {}
  }
  renderLogin();
}

// Expose globals
window.selectRole        = selectRole;
window.doLogin           = doLogin;
window.doLogout          = doLogout;
window.quickLogin        = quickLogin;
window.navigateTo        = navigateTo;
window.setFormTab        = setFormTab;
window.resetForm         = resetForm;
window.submitLeaveForm   = submitLeaveForm;
window.submitAbsenceForm = submitAbsenceForm;
window.submitPersonalForm= submitPersonalForm;
window.submitDocumentForm= submitDocumentForm;
window.actionRequest     = actionRequest;
window.confirmReject     = confirmReject;
window.openCommentModal  = openCommentModal;
window.submitComment     = submitComment;
window.showRequestDetail = showRequestDetail;
window.filterRequests    = filterRequests;
window.openProfileModal  = openProfileModal;
window.openNotifications = openNotifications;
window.clearWebhookLogs  = clearWebhookLogs;
window.closeModal        = closeModal;

document.addEventListener('DOMContentLoaded', init);
