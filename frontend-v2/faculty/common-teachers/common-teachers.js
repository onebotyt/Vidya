/**
 * ══════════════════════════════════════════════════════════════
 * HOD-003: COMMON FACULTY MANAGEMENT CONTROLLER
 * Location: frontend-v2/faculty/common-teachers/common-teachers.js
 * 
 * Clean, declarative component-driven architecture:
 * - Pure token-driven styling
 * - Unified AppShell integration
 * - Declarative dialogs (openConfirm, openDynamicForm) for review queue
 * ══════════════════════════════════════════════════════════════
 */

// Route Guard
if (typeof guardRoute === 'function') {
  guardRoute({ roles: ['COMMON_FACULTY_MANAGER', 'SYSTEM_ADMIN', 'HOD', 'TEACHER'] });
}

// Fallback apiFetch wrapper
if (typeof window.apiFetch === 'undefined') {
  window.apiFetch = async (endpoint, options = {}) => {
    if (typeof apiRequest === 'function') return apiRequest(endpoint, options);
    if (typeof fetchApi === 'function') return fetchApi(endpoint.replace(/^\/api\/v1/, ''), options);
    const token = localStorage.getItem('access_token') || localStorage.getItem('token') || (typeof getAuthToken === 'function' ? getAuthToken() : '');
    const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}), ...(options.headers || {}) };
    const r = await fetch(endpoint, { ...options, headers });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || data.success === false) throw new Error(data?.error?.message || data?.message || `HTTP ${r.status}`);
    return data;
  };
}

const API = '/api/v1';
let pendingList = [];
let rosterList = [];

// Escaping utility
function esc(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Initialization
async function init() {
  if (typeof renderNavbar === 'function') {
    renderNavbar();
  }
  await loadAllData();
}

async function loadAllData() {
  await Promise.all([loadPending(), loadRoster()]);
}

async function loadPending() {
  const wrap = document.getElementById('pending-common-wrap');
  const badge = document.getElementById('pending-common-badge');
  if (!wrap) return;

  try {
    const res = await apiFetch(`${API}/faculty/common/pending`);
    pendingList = res.data || [];
    if (badge) badge.textContent = `${pendingList.length} Pending`;

    if (!pendingList.length) {
      wrap.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
          <div style="display:flex; justify-content:center; margin-bottom:0.5rem; color:var(--status-present);">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <div style="font-weight: 600; color: var(--text-main);">No Pending Common Faculty Registrations</div>
          <div style="font-size: 0.8rem; margin-top: 0.25rem;">All registration applications for common faculty have been processed.</div>
        </div>`;
      return;
    }

    wrap.innerHTML = `
      <div class="table-scroll-wrapper" style="overflow-x: auto;">
        <table class="table" style="margin: 0; font-size: 0.85rem; width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: var(--table-th-bg); border-bottom: 2px solid var(--border-color); text-align: left;">
              <th style="padding: 0.75rem 1rem;">Candidate</th>
              <th style="padding: 0.75rem 1rem;">Institutional Gmail</th>
              <th style="padding: 0.75rem 1rem;">Phone</th>
              <th style="padding: 0.75rem 1rem;">Employee ID</th>
              <th style="padding: 0.75rem 1rem;">Applied On</th>
              <th style="padding: 0.75rem 1rem; text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${pendingList.map(item => `
              <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 0.75rem 1rem;">
                  <div style="font-weight: 600; color: var(--text-main);">${esc(item.full_name)}</div>
                </td>
                <td style="padding: 0.75rem 1rem; font-family: var(--font-family-mono, monospace); font-size: 0.82rem; color: var(--color-primary);">${esc(item.email)}</td>
                <td style="padding: 0.75rem 1rem; font-size: 0.8rem; color: var(--text-muted);">${esc(item.phone || '—')}</td>
                <td style="padding: 0.75rem 1rem; font-size: 0.8rem; color: var(--text-muted); font-family: var(--font-family-mono, monospace);">${esc(item.employee_id || '—')}</td>
                <td style="padding: 0.75rem 1rem; font-size: 0.78rem; color: var(--text-muted);">${new Date(item.created_at || Date.now()).toLocaleDateString()}</td>
                <td style="padding: 0.75rem 1rem; text-align: right;">
                  <div style="display: inline-flex; gap: 0.4rem; align-items: center;">
                    <button type="button" class="btn btn-primary btn-sm" onclick="approveCommonFaculty(${item.id}, '${esc(item.full_name)}')">Approve</button>
                    <button type="button" class="btn btn-secondary btn-sm" style="color: var(--status-absent);" onclick="rejectCommonFaculty(${item.id}, '${esc(item.full_name)}')">Reject</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (err) {
    wrap.innerHTML = `<div style="color: var(--status-absent); font-size: 0.85rem; text-align: center; padding: 1.5rem;">Failed to load pending requests: ${esc(err.message)}</div>`;
  }
}

async function loadRoster() {
  const wrap = document.getElementById('active-roster-wrap');
  const badge = document.getElementById('roster-count-badge');
  if (!wrap) return;

  try {
    const res = await apiFetch(`${API}/faculty/common/members`);
    rosterList = res.data || [];
    if (badge) badge.textContent = `${rosterList.length} Members`;
    renderRoster(rosterList);
  } catch (err) {
    wrap.innerHTML = `<div style="color: var(--status-absent); font-size: 0.85rem; text-align: center; padding: 1.5rem;">Failed to load roster: ${esc(err.message)}</div>`;
  }
}

function filterRoster(query) {
  const q = (query || '').toLowerCase().trim();
  if (!q) {
    renderRoster(rosterList);
    return;
  }
  const filtered = rosterList.filter(m =>
    (m.full_name || '').toLowerCase().includes(q) ||
    (m.gmail || m.email || '').toLowerCase().includes(q) ||
    (m.employee_id || '').toLowerCase().includes(q)
  );
  renderRoster(filtered);
}

function renderRoster(list) {
  const wrap = document.getElementById('active-roster-wrap');
  if (!wrap) return;

  if (!list.length) {
    wrap.innerHTML = `
      <div style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
        <div style="display:flex; justify-content:center; margin-bottom:0.75rem; color:var(--text-muted);">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
        </div>
        <div style="font-weight: 600; color: var(--text-main);">No Common Faculty Members Found</div>
        <div style="font-size: 0.82rem; margin-top: 0.25rem;">Approved common faculty who belong to no specific department will appear here.</div>
      </div>`;
    return;
  }

  wrap.innerHTML = `
    <div class="faculty-grid">
      ${list.map(t => {
        const initial = (t.full_name || 'T').charAt(0).toUpperCase();
        return `
          <div class="faculty-card">
            <div style="display: flex; gap: 0.75rem; align-items: center; margin-bottom: 0.85rem;">
              <div class="fc-avatar">${initial}</div>
              <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 700; font-size: 1rem; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${esc(t.full_name)}</div>
                <div style="font-size: 0.8rem; color: var(--color-primary); font-family: var(--font-family-mono, monospace); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${esc(t.gmail || t.email)}</div>
              </div>
              <span class="badge" style="background:var(--status-present-bg); color:var(--status-present); font-size: 0.72rem; font-weight:700;">Active</span>
            </div>
            <div style="border-top: 1px dashed var(--border-color); padding-top: 0.65rem; font-size: 0.8rem; color: var(--text-muted); display: flex; justify-content: space-between; flex-wrap: wrap; gap: 0.4rem;">
              <span>${t.employee_id ? `Emp ID: <strong style="color: var(--text-main); font-family: var(--font-family-mono, monospace);">${esc(t.employee_id)}</strong>` : 'No Emp ID'}</span>
              <span>${t.phone ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:2px;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg> ${esc(t.phone)}` : ''}</span>
            </div>
          </div>
        `;
      }).join('')}
    </div>`;
}

// Declarative Approval Action
async function approveCommonFaculty(reqId, name) {
  if (typeof openConfirm === 'function') {
    const confirmed = await openConfirm({
      title: 'Approve Common Faculty Member?',
      message: `Are you sure you want to approve <strong>${esc(name)}</strong> as an institutional Common Faculty member? They will be granted permissions to teach cross-department courses.`,
      confirmText: 'Approve Member',
      confirmVariant: 'primary'
    });
    if (!confirmed) return;
  } else if (!confirm(`Approve ${name} as a Common Faculty member?`)) {
    return;
  }

  try {
    const res = await apiFetch(`${API}/faculty/common/${reqId}/approve`, {
      method: 'POST'
    });
    if (typeof showToast === 'function') {
      showToast(res.message || 'Common faculty member approved successfully!', 'success');
    }
    await loadAllData();
  } catch (err) {
    if (typeof showToast === 'function') {
      showToast(err.message || 'Failed to approve request.', 'error');
    }
  }
}

// Declarative Rejection Action
async function rejectCommonFaculty(reqId, name) {
  if (typeof openDynamicForm === 'function') {
    const result = await openDynamicForm({
      title: 'Reject Common Faculty Registration',
      subtitle: `Specify the reason for declining registration for ${esc(name)}.`,
      submitLabel: 'Decline Registration',
      fields: [
        {
          name: 'reason',
          label: 'Reason for Rejection',
          type: 'textarea',
          rows: 3,
          defaultValue: 'Application requirements not met',
          required: true
        }
      ]
    });
    if (!result) return;

    try {
      const res = await apiFetch(`${API}/faculty/common/${reqId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: result.reason.trim() || 'Application not approved' })
      });
      if (typeof showToast === 'function') {
        showToast(res.message || 'Registration rejected.', 'info');
      }
      await loadPending();
    } catch (err) {
      if (typeof showToast === 'function') {
        showToast(err.message || 'Failed to reject request.', 'error');
      }
    }
  } else {
    const reason = prompt(`Enter rejection reason for ${name}:`, 'Application requirements not met');
    if (reason === null) return;
    try {
      const res = await apiFetch(`${API}/faculty/common/${reqId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: reason.trim() || 'Application not approved' })
      });
      if (typeof showToast === 'function') {
        showToast(res.message || 'Registration rejected.', 'info');
      }
      await loadPending();
    } catch (err) {
      if (typeof showToast === 'function') {
        showToast(err.message || 'Failed to reject request.', 'error');
      }
    }
  }
}

// Window export for test contracts
window.loadAllData = loadAllData;
window.filterRoster = filterRoster;
window.approveCommonFaculty = approveCommonFaculty;
window.rejectCommonFaculty = rejectCommonFaculty;

init();
