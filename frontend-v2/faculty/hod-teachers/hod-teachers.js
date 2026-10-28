/**
 * ══════════════════════════════════════════════════════════════
 * HOD-001: DEPARTMENT FACULTY & STUDENT HUB CONTROLLER
 * Location: frontend-v2/faculty/hod-teachers/hod-teachers.js
 * 
 * Clean, declarative component-driven architecture:
 * - Zero duplicated modal markup (driven by UI-001 openDynamicForm & UI-002 openConfirm)
 * - Pure design token integration
 * - Unified AppShell navigation
 * ══════════════════════════════════════════════════════════════
 */

// Route Guard for Department Faculty and HOD
if (typeof guardRoute === 'function') {
  guardRoute({ roles: ['TEACHER', 'HOD', 'SYSTEM_ADMIN'], requireDepartmentFaculty: true });
}

// Fallback apiFetch wrapper
if (typeof window.apiFetch === 'undefined') {
  window.apiFetch = (endpoint, options) => {
    if (typeof apiRequest === 'function') return apiRequest(endpoint, options);
    if (typeof fetchApi === 'function') return fetchApi(endpoint.replace(/^\/api\/v1/, ''), options);
    const token = localStorage.getItem('token') || (typeof getAuthToken === 'function' ? getAuthToken() : '');
    const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
    return fetch(endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`, { ...options, headers: { ...headers, ...(options?.headers || {}) } })
      .then(r => r.json());
  };
}

// API constants & state
const API = '/hod';
let currentUser = null;
let isHod = false;
let currentDeptId = null;
let currentDeptCode = 'IT';
let allCohorts = [];
let allStudents = [];
let allTeachers = [];
let selectedCohort = null;
let isCohortRegOpen = false;
let isFacultyRegOpen = false;
let isDeptRegOpen = false;
let searchTimeout = null;

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

// Main Workspace Tab Switching
function showMainTab(tab) {
  const isTeachers = tab === 'teachers';
  const isRoster = tab === 'roster';
  const isPending = tab === 'pending';

  const tPanel = document.getElementById('tab-teachers-panel');
  const rPanel = document.getElementById('tab-roster-panel');
  const pPanel = document.getElementById('tab-pending-panel');

  if (tPanel) tPanel.style.display = isTeachers ? 'block' : 'none';
  if (rPanel) rPanel.style.display = isRoster ? 'block' : 'none';
  if (pPanel) pPanel.style.display = isPending ? 'block' : 'none';

  const tBtn = document.getElementById('tab-teachers-btn');
  const rBtn = document.getElementById('tab-roster-btn');
  const pBtn = document.getElementById('tab-pending-btn');

  if (tBtn) tBtn.className = isTeachers ? 'workspace-tab-btn active' : 'workspace-tab-btn';
  if (rBtn) rBtn.className = isRoster ? 'workspace-tab-btn active' : 'workspace-tab-btn';
  if (pBtn) pBtn.className = isPending ? 'workspace-tab-btn active' : 'workspace-tab-btn';

  if (isTeachers) {
    loadTeachers();
    loadPendingFaculty();
  } else if (isPending) {
    loadPendingRegistrations();
  } else if (isRoster) {
    loadStudents();
  }
}

// Initialization
(async function init() {
  try {
    // Render Unified Navigation AppShell
    if (typeof renderNavbar === 'function') {
      renderNavbar();
    }

    currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    isHod = Boolean(currentUser && (currentUser.is_hod || currentUser.role === 'HOD' || currentUser.role === 'SYSTEM_ADMIN'));

    if (isHod) {
      const hodBadge = document.getElementById('hod-badge');
      if (hodBadge) hodBadge.style.display = 'inline-block';
      const brandBadge = document.getElementById('brand-role-badge');
      if (brandBadge) brandBadge.textContent = 'HOD';

      // Reveal HOD Command buttons
      ['btn-add-teacher', 'btn-add-student', 'btn-bulk-csv', 'btn-promotion', 'btn-reindex-roll', 'btn-archive-link'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'inline-flex';
      });
    } else {
      const notice = document.getElementById('faculty-provision-notice');
      if (notice) notice.style.display = 'inline-block';
    }

    // Load Department Hierarchy
    try {
      const hRes = await apiFetch(`${API}/hierarchy`);
      if (hRes && hRes.data) {
        currentDeptId = hRes.data.department_id || hRes.data.id;
        currentDeptCode = hRes.data.department_code || hRes.data.code || 'IT';
        const deptName = hRes.data.department_name || hRes.data.name || 'Department';
        const hdr = document.getElementById('dept-header-name');
        if (hdr) hdr.textContent = `${deptName} — Faculty & Student Hub`;
        const sub = document.getElementById('dept-subtitle');
        if (sub) sub.textContent = `Directory for ${deptName}: faculty members, student enrollment, and progression.`;
      }
    } catch (_) {}

    // Load Cohorts, Teachers, and Gateways
    await loadCohorts();
    await loadTeachers();
    await loadFacultyRegistrationStatus();
    await updateRegistrationStatusBadge();

    // Check URL tab parameter or default to roster
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam === 'teachers' || tabParam === 'faculty') {
      showMainTab('teachers');
    } else if (tabParam === 'pending' || tabParam === 'approvals') {
      showMainTab('pending');
    } else {
      showMainTab('roster');
    }
  } catch (err) {
    console.error('HOD Hub initialization error:', err);
  }
})();

// ══════════════════════════════════════════════════════════════
// TEACHER CONTROLLERS
// ══════════════════════════════════════════════════════════════

async function loadTeachers() {
  const grid = document.getElementById('teacher-grid');
  try {
    const res = await apiFetch(`${API}/teachers`);
    allTeachers = res?.data || [];
    renderTeachers(allTeachers);
    const countEl = document.getElementById('stat-teachers-count');
    if (countEl) countEl.textContent = allTeachers.length;
  } catch (err) {
    console.error('Failed to load teachers:', err);
    if (grid) grid.innerHTML = `<div style="text-align: center; padding: 2rem; color: var(--status-absent); grid-column: 1 / -1;">Failed to load faculty directory.</div>`;
  }
}

function renderTeachers(teachers) {
  const grid = document.getElementById('teacher-grid');
  if (!grid) return;
  if (!teachers || teachers.length === 0) {
    grid.innerHTML = `<div style="text-align: center; padding: 2.5rem; color: var(--text-muted); grid-column: 1 / -1;">No faculty members found in this department.</div>`;
    return;
  }

  grid.innerHTML = teachers.map(t => {
    const initials = (t.full_name || 'T')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0].toUpperCase())
      .join('') || 'T';

    const isHodMember = Boolean(t.is_hod || t.user_id === currentUser?.user_id);
    const roleBadge = isHodMember
      ? `<span class="badge" style="background: var(--chip-hod-bg); color: var(--color-primary); font-weight: 700;">Head of Department</span>`
      : `<span class="badge" style="background: var(--bg-surface); color: var(--text-main); font-weight: 600; border: 1px solid var(--border-color);">Faculty Member</span>`;

    return `
      <div class="teacher-card">
        <div>
          <div class="tc-header">
            <div style="display: flex; gap: 0.75rem; align-items: center;">
              <div class="tc-avatar">${initials}</div>
              <div>
                <div class="tc-name">${esc(t.full_name)}</div>
                ${t.employee_id ? `<div class="tc-empid">EMP: ${esc(t.employee_id)}</div>` : ''}
              </div>
            </div>
            <div>${roleBadge}</div>
          </div>

          <div class="tc-meta">
            <div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              <span style="font-family: var(--font-family-mono, monospace); color: var(--text-main); font-size: 0.85rem;">${esc(t.gmail || t.email)}</span>
            </div>
            ${t.phone ? `
              <div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                <span>${esc(t.phone)}</span>
              </div>
            ` : ''}
            <div>
              <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--status-present); margin-right:6px;"></span>
              <span>Account: <strong style="color:var(--status-present);">${esc(t.status || 'ACTIVE')}</strong></span>
            </div>
          </div>
        </div>

        ${isHod ? `
          <div class="tc-actions">
            <button type="button" class="btn btn-secondary btn-sm" onclick="openResetTeacherModal(${t.id}, '${esc(t.full_name)}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="5.5"></circle><path d="M21 2l-9.6 9.6M15.5 7.5l2.5 2.5M18.5 4.5l2.5 2.5"></path></svg> Reset Password
            </button>
            <button type="button" class="btn btn-secondary btn-sm" style="color: var(--status-absent);" onclick="openDeleteTeacherModal(${t.id}, '${esc(t.full_name)}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> Remove
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

function filterTeachers(query) {
  const q = (query || '').toLowerCase().trim();
  if (!q) {
    renderTeachers(allTeachers);
    return;
  }
  const filtered = allTeachers.filter(t => 
    (t.full_name || '').toLowerCase().includes(q) ||
    (t.gmail || t.email || '').toLowerCase().includes(q) ||
    (t.employee_id || '').toLowerCase().includes(q)
  );
  renderTeachers(filtered);
}

async function loadFacultyRegistrationStatus() {
  try {
    const res = await apiFetch(`${API}/faculty-registration-status`);
    isFacultyRegOpen = Boolean(res?.data?.is_open);
    renderFacultyRegButton();
  } catch (err) {
    console.warn('Failed to load faculty registration gate status:', err);
  }
}

function renderFacultyRegButton() {
  const btn = document.getElementById('hod-faculty-reg-btn');
  const ind = document.getElementById('hod-reg-indicator');
  const txt = document.getElementById('hod-reg-text');
  if (btn && txt) {
    if (isFacultyRegOpen) {
      if (ind) ind.innerHTML = '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--status-present);"></span>';
      txt.textContent = 'Faculty Reg: OPEN';
      btn.style.borderColor = 'var(--status-present)';
      btn.style.color = 'var(--status-present)';
    } else {
      if (ind) ind.innerHTML = '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--status-absent);"></span>';
      txt.textContent = 'Faculty Reg: CLOSED';
      btn.style.borderColor = 'var(--status-absent)';
      btn.style.color = 'var(--status-absent)';
    }
  }

  // Update Gateway Tile
  const qBadge = document.getElementById('quick-teacher-reg-badge');
  const qBtn = document.getElementById('quick-teacher-reg-toggle-btn');
  if (qBadge) {
    if (isFacultyRegOpen) {
      qBadge.textContent = 'OPEN (Accepting)';
      qBadge.style.background = 'var(--status-present-bg)';
      qBadge.style.color = 'var(--status-present)';
    } else {
      qBadge.textContent = 'CLOSED (Blocked)';
      qBadge.style.background = 'var(--bg-surface)';
      qBadge.style.color = 'var(--status-absent)';
    }
  }
  if (qBtn) {
    qBtn.textContent = isFacultyRegOpen ? 'Close Teacher Reg' : 'Open Teacher Reg';
    qBtn.style.color = isFacultyRegOpen ? 'var(--status-absent)' : 'var(--status-present)';
    qBtn.style.borderColor = isFacultyRegOpen ? 'var(--status-absent)' : 'var(--status-present)';
  }
}

async function toggleFacultyRegistration() {
  const newStatus = !isFacultyRegOpen;
  try {
    const res = await apiFetch(`${API}/faculty-registration-toggle`, {
      method: 'POST',
      body: JSON.stringify({ open: newStatus })
    });
    isFacultyRegOpen = Boolean(res?.data?.is_open);
    renderFacultyRegButton();
    if (typeof showToast === 'function') {
      showToast(`Faculty registration is now ${isFacultyRegOpen ? 'OPEN' : 'CLOSED'}.`, 'success');
    }
  } catch (err) {
    if (typeof showToast === 'function') {
      showToast(err.message || 'Failed to toggle faculty registration.', 'error');
    }
  }
}

async function loadPendingFaculty() {
  const card = document.getElementById('pending-faculty-card');
  const wrap = document.getElementById('pending-faculty-wrap');
  const badge = document.getElementById('pending-faculty-badge');
  const tabBadge = document.getElementById('pending-faculty-badge-tab');
  if (!card || !wrap) return;

  try {
    const res = await apiFetch(`${API}/faculty-registrations/pending`);
    const list = res?.data || [];

    if (list.length === 0) {
      card.style.display = 'none';
      if (tabBadge) tabBadge.style.display = 'none';
      return;
    }

    card.style.display = 'block';
    if (badge) badge.textContent = `${list.length} Pending`;
    if (tabBadge) {
      tabBadge.textContent = list.length;
      tabBadge.style.display = 'inline-block';
    }

    wrap.innerHTML = `
      <table class="table" style="width: 100%; margin: 0;">
        <thead>
          <tr style="background: var(--table-th-bg);">
            <th style="padding: 0.5rem 0.75rem;">Applicant Name</th>
            <th style="padding: 0.5rem 0.75rem;">Institutional Gmail</th>
            <th style="padding: 0.5rem 0.75rem;">Phone</th>
            <th style="padding: 0.5rem 0.75rem; text-align: right;">Action</th>
          </tr>
        </thead>
        <tbody>
          ${list.map(f => `
            <tr>
              <td style="padding: 0.5rem 0.75rem; font-weight: 600;">${esc(f.full_name)}</td>
              <td style="padding: 0.5rem 0.75rem; font-family: var(--font-family-mono, monospace);">${esc(f.email)}</td>
              <td style="padding: 0.5rem 0.75rem;">${esc(f.phone || '—')}</td>
              <td style="padding: 0.5rem 0.75rem; text-align: right;">
                <button class="btn btn-primary btn-sm" onclick="approveFaculty(${f.id}, '${esc(f.full_name)}')">Approve</button>
                <button class="btn btn-secondary btn-sm" style="color: var(--status-absent);" onclick="rejectFaculty(${f.id}, '${esc(f.full_name)}')">Reject</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    console.warn('Failed to load pending faculty registrations:', err);
  }
}

async function approveFaculty(id, name) {
  if (typeof openConfirm === 'function') {
    const confirmed = await openConfirm({
      title: 'Approve Teacher Registration?',
      message: `Are you sure you want to approve teacher registration for <strong>${esc(name)}</strong>? Their institutional teaching account will be immediately activated.`,
      confirmText: 'Approve Teacher',
      confirmVariant: 'primary'
    });
    if (!confirmed) return;
  } else if (!confirm(`Approve teacher registration for ${name}?`)) {
    return;
  }

  try {
    await apiFetch(`${API}/faculty-registrations/${id}/adjudicate`, {
      method: 'POST',
      body: JSON.stringify({ action: 'APPROVE' })
    });
    if (typeof showToast === 'function') showToast(`Approved teacher ${name}!`, 'success');
    loadPendingFaculty();
    loadTeachers();
  } catch (err) {
    if (typeof showToast === 'function') showToast(err.message || 'Failed to approve teacher.', 'error');
  }
}

async function rejectFaculty(id, name) {
  if (typeof openDynamicForm === 'function') {
    const res = await openDynamicForm({
      title: 'Reject Teacher Registration',
      subtitle: `Provide a reason for declining the registration of ${esc(name)}.`,
      submitLabel: 'Decline Registration',
      fields: [
        {
          name: 'rejection_reason',
          label: 'Reason for Rejection',
          type: 'textarea',
          rows: 3,
          placeholder: 'e.g. Incomplete institutional documentation or duplicate account',
          required: true
        }
      ]
    });
    if (!res) return;

    try {
      await apiFetch(`${API}/faculty-registrations/${id}/adjudicate`, {
        method: 'POST',
        body: JSON.stringify({ action: 'REJECT', rejection_reason: res.rejection_reason })
      });
      if (typeof showToast === 'function') showToast('Registration rejected.', 'info');
      loadPendingFaculty();
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message || 'Failed to reject registration.', 'error');
    }
  } else {
    const reason = prompt(`Enter rejection reason for ${name}:`);
    if (!reason) return;
    try {
      await apiFetch(`${API}/faculty-registrations/${id}/adjudicate`, {
        method: 'POST',
        body: JSON.stringify({ action: 'REJECT', rejection_reason: reason })
      });
      if (typeof showToast === 'function') showToast('Registration rejected.', 'info');
      loadPendingFaculty();
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message || 'Failed to reject registration.', 'error');
    }
  }
}

// Declarative Add Teacher Modal
async function openCreateTeacherModal() {
  if (typeof openDynamicForm !== 'function') return;

  const result = await openDynamicForm({
    title: 'Add Teacher to Department',
    subtitle: 'Provide faculty details to create their institutional teaching account.',
    submitLabel: 'Create Teacher Account',
    fields: [
      {
        name: 'full_name',
        label: 'Full Name',
        type: 'text',
        placeholder: 'Prof. Rahul Verma',
        required: true
      },
      {
        name: 'email',
        label: 'Institutional Gmail (Login ID)',
        type: 'email',
        placeholder: 'prof.name@gmail.com',
        required: true
      },
      {
        name: 'password',
        label: 'Initial Password',
        type: 'text',
        defaultValue: 'Password@123',
        required: true
      },
      {
        name: 'phone',
        label: 'Phone Number',
        type: 'tel',
        placeholder: '9876543210'
      },
      {
        name: 'employee_id',
        label: 'Employee ID',
        type: 'text',
        placeholder: 'e.g. IT-FAC-01'
      }
    ]
  });

  if (!result) return;

  try {
    await apiFetch(`${API}/teachers`, {
      method: 'POST',
      body: JSON.stringify(result)
    });

    if (typeof showToast === 'function') showToast('Teacher created successfully!', 'success');
    loadTeachers();

    // Show Credentials Slip Dialog
    if (typeof openDetailDialog === 'function') {
      openDetailDialog({
        title: 'Teacher Created Successfully',
        subtitle: 'Please securely copy and share these credentials with the faculty member.',
        data: {
          'Faculty Name': result.full_name,
          'Login Email (Gmail)': result.email,
          'Temporary Password': result.password,
          'Employee ID': result.employee_id || 'Not Assigned',
          'Login Portal': `${window.location.origin}/login`
        }
      });
    }
  } catch (err) {
    if (typeof showToast === 'function') showToast(err.message || 'Failed to create teacher account.', 'error');
  }
}

// Declarative Reset Teacher Password Modal
async function openResetTeacherModal(id, name) {
  if (typeof openDynamicForm !== 'function') return;

  const result = await openDynamicForm({
    title: 'Reset Teacher Password',
    subtitle: `Enter a new login password for ${esc(name)}.`,
    submitLabel: 'Reset Password',
    fields: [
      {
        name: 'new_password',
        label: 'New Password',
        type: 'text',
        defaultValue: 'Password@123',
        required: true
      }
    ]
  });

  if (!result) return;

  try {
    await apiFetch(`${API}/teachers/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify(result)
    });
    if (typeof showToast === 'function') showToast('Password reset successfully!', 'success');
  } catch (err) {
    if (typeof showToast === 'function') showToast(err.message || 'Failed to reset password.', 'error');
  }
}

// Declarative Delete Teacher Modal
async function openDeleteTeacherModal(id, name) {
  if (typeof openConfirm !== 'function') return;

  const confirmed = await openConfirm({
    title: 'Permanently Delete Faculty Account?',
    message: `You are about to permanently remove <strong>${esc(name)}</strong> from this department. All subject mappings and course records will be detached.`,
    confirmText: 'Permanently Delete',
    confirmVariant: 'danger',
    requireTyping: 'DELETE'
  });

  if (!confirmed) return;

  try {
    await apiFetch(`${API}/teachers/${id}`, { method: 'DELETE' });
    if (typeof showToast === 'function') showToast('Teacher account deleted.', 'info');
    loadTeachers();
  } catch (err) {
    if (typeof showToast === 'function') showToast(err.message || 'Failed to delete teacher.', 'error');
  }
}

// ══════════════════════════════════════════════════════════════
// STUDENT ROSTER CONTROLLERS
// ══════════════════════════════════════════════════════════════

async function loadCohorts() {
  try {
    const res = await apiFetch('/faculty/cohorts');
    allCohorts = res?.data || [];
    const select = document.getElementById('cohort-select');
    if (!select) return;

    select.innerHTML = '<option value="">All Department Cohorts</option>';

    allCohorts.forEach(c => {
      const opt = document.createElement('option');
      opt.value = `${c.department_id}_${c.year}_${c.semester}`;
      opt.textContent = `${c.department_name || 'Dept'} • Year ${c.year} Sem ${c.semester}`;
      opt.dataset.deptId = c.department_id;
      opt.dataset.year = c.year;
      opt.dataset.sem = c.semester;
      select.appendChild(opt);
    });

    if (allCohorts.length > 0) {
      select.value = `${allCohorts[0].department_id}_${allCohorts[0].year}_${allCohorts[0].semester}`;
      selectedCohort = allCohorts[0];
      updateRegistrationStatusBadge();
    }
  } catch (err) {
    console.error('Failed to load cohorts:', err);
  }
}

function onCohortSelectChange() {
  const select = document.getElementById('cohort-select');
  if (!select) return;
  const val = select.value;
  if (!val) {
    selectedCohort = null;
  } else {
    const [dId, yr, sm] = val.split('_');
    selectedCohort = { department_id: parseInt(dId), year: parseInt(yr), semester: parseInt(sm) };
  }
  updateRegistrationStatusBadge();
  loadStudents();
}

async function updateRegistrationStatusBadge() {
  const statusBadge = document.getElementById('reg-toggle-status');
  const toggleBtn = document.getElementById('reg-toggle-btn');
  const rosterBadge = document.getElementById('tab-roster-reg-status');
  const rosterDeptBtn = document.getElementById('tab-roster-dept-reg-toggle-btn');
  const quickBadge = document.getElementById('quick-student-reg-badge');
  const quickBtn = document.getElementById('quick-student-reg-toggle-btn');

  const deptId = currentDeptId || (selectedCohort ? selectedCohort.department_id : (currentUser?.department_id || 4));

  try {
    const res = await apiFetch(`/faculty/cohorts/registration-status?department_id=${deptId}`);
    isDeptRegOpen = Boolean(res?.data?.is_dept_open || res?.data?.is_open);
    isCohortRegOpen = isDeptRegOpen;

    // Top Gateway Hub
    if (quickBadge) {
      if (isDeptRegOpen) {
        quickBadge.textContent = 'OPEN (ALL SEMESTERS)';
        quickBadge.style.background = 'var(--status-present-bg)';
        quickBadge.style.color = 'var(--status-present)';
      } else {
        quickBadge.textContent = 'CLOSED (BLOCKED)';
        quickBadge.style.background = 'var(--bg-surface)';
        quickBadge.style.color = 'var(--status-absent)';
      }
    }
    if (quickBtn) {
      quickBtn.textContent = isDeptRegOpen ? 'Close Student Reg' : 'Open All Semesters';
      quickBtn.style.color = isDeptRegOpen ? 'var(--status-absent)' : 'var(--status-present)';
      quickBtn.style.borderColor = isDeptRegOpen ? 'var(--status-absent)' : 'var(--status-present)';
    }

    // Tab 2 Roster Controls Bar
    if (rosterBadge) {
      if (isDeptRegOpen) {
        rosterBadge.textContent = 'OPEN (ALL SEMESTERS)';
        rosterBadge.style.background = 'var(--status-present-bg)';
        rosterBadge.style.color = 'var(--status-present)';
      } else {
        rosterBadge.textContent = 'CLOSED (BLOCKED)';
        rosterBadge.style.background = 'var(--bg-surface)';
        rosterBadge.style.color = 'var(--status-absent)';
      }
    }
    if (rosterDeptBtn) {
      rosterDeptBtn.textContent = isDeptRegOpen ? 'Close All Semesters' : 'Open All Semesters';
      rosterDeptBtn.style.color = isDeptRegOpen ? 'var(--status-absent)' : 'var(--status-present)';
      rosterDeptBtn.style.borderColor = isDeptRegOpen ? 'var(--status-absent)' : 'var(--status-present)';
    }

    // Tab 3 Badge & Button
    if (statusBadge) {
      if (isDeptRegOpen) {
        statusBadge.textContent = 'Student Reg: OPEN (All Semesters)';
        statusBadge.style.background = 'var(--status-present-bg)';
        statusBadge.style.color = 'var(--status-present)';
      } else {
        statusBadge.textContent = 'Student Reg: CLOSED (BLOCKED)';
        statusBadge.style.background = 'var(--bg-surface)';
        statusBadge.style.color = 'var(--status-absent)';
      }
    }
    if (toggleBtn) {
      toggleBtn.textContent = isDeptRegOpen ? 'Close All Semesters' : 'Open All Semesters';
    }
  } catch (err) {
    console.warn('Failed to fetch registration status:', err);
  }
}

async function toggleDepartmentStudentRegistration() {
  const deptId = currentDeptId || (selectedCohort ? selectedCohort.department_id : (currentUser?.department_id || 4));
  if (!deptId) {
    if (typeof showToast === 'function') showToast('Department ID not found.', 'info');
    return;
  }
  const newStatus = !isDeptRegOpen;
  try {
    const res = await apiFetch('/faculty/cohorts/registration-toggle', {
      method: 'POST',
      body: JSON.stringify({
        department_id: deptId,
        department_wide: true,
        open: newStatus
      })
    });
    isDeptRegOpen = Boolean(res?.data?.is_open);
    isCohortRegOpen = isDeptRegOpen;
    await updateRegistrationStatusBadge();
    if (typeof showToast === 'function') {
      showToast(`Student registration is now ${isDeptRegOpen ? 'OPEN' : 'CLOSED'} for ALL semesters in this department.`, 'success');
    }
  } catch (err) {
    if (typeof showToast === 'function') {
      showToast(err.message || 'Failed to toggle department student registration.', 'error');
    }
  }
}

function toggleCohortRegistration() {
  return toggleDepartmentStudentRegistration();
}

async function loadStudents() {
  const tbody = document.getElementById('students-tbody');
  const yr = document.getElementById('filter-year')?.value;
  const sem = document.getElementById('filter-sem')?.value;

  let queryParams = [];
  if (selectedCohort) {
    queryParams.push(`year=${selectedCohort.year}`);
    queryParams.push(`semester=${selectedCohort.semester}`);
  } else {
    if (yr) queryParams.push(`year=${yr}`);
    if (sem) queryParams.push(`semester=${sem}`);
  }

  const qStr = queryParams.length ? '?' + queryParams.join('&') : '';

  try {
    const endpoint = isHod ? `${API}/students${qStr}` : `/students${qStr}`;
    const res = await apiFetch(endpoint);
    allStudents = res?.data || [];
    renderStudents(allStudents);
  } catch (err) {
    console.error('Failed to load students:', err);
    if (tbody) tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 2rem; color: var(--status-absent);">Failed to load student roster.</td></tr>`;
  }
}

function renderStudents(students) {
  const tbody = document.getElementById('students-tbody');
  const countLabel = document.getElementById('table-count-label');
  if (!tbody) return;

  // Update Top Stats
  const totalStudents = students.length;
  const activeAccounts = students.filter(s => s.user_status === 'ACTIVE' || s.status === 'ENROLLED' || s.status === 'ACTIVE').length;

  const totalEl = document.getElementById('stat-total');
  const activeEl = document.getElementById('stat-active');
  if (totalEl) totalEl.textContent = totalStudents;
  if (activeEl) activeEl.textContent = activeAccounts;
  if (countLabel) countLabel.textContent = `Showing ${totalStudents} students`;

  if (totalStudents === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">No students found matching current filters.</td></tr>`;
    return;
  }

  tbody.innerHTML = students.map(s => {
    const rollDisplay = s.class_roll_no ? `<span style="font-weight: 700; color: var(--color-primary);">${s.class_roll_no}</span>` : '<span style="color: var(--text-muted);">—</span>';
    const ubterDisplay = s.ubter_reg_no ? `<span style="font-family: var(--font-family-mono, monospace); font-size: 0.85rem;">${esc(s.ubter_reg_no)}</span>` : '<span style="color: var(--text-muted);">—</span>';
    const enrollDisplay = `<span style="font-family: var(--font-family-mono, monospace); font-weight: 600; color: var(--text-main); font-size: 0.85rem;">${esc(s.official_enrollment_no)}</span>`;
    const bioDisplay = s.biometric_slot ? `<span class="badge" style="background: var(--bg-surface); color: var(--text-main); border: 1px solid var(--border-color);">Slot #${s.biometric_slot}</span>` : '<span style="color: var(--text-muted); font-size: 0.8rem;">Unassigned</span>';
    const googleDisplay = s.google_linked ? `<span style="color: var(--color-primary); font-weight: 700;">Linked</span>` : '<span style="color: var(--text-muted);">No</span>';
    
    const statusBadge = (s.status === 'DETAINED')
      ? `<span class="badge" style="background: var(--status-absent-bg); color: var(--status-absent); font-weight: 700;">DETAINED</span>`
      : (s.status === 'COMPLETED' || s.status === 'GRADUATED'
          ? `<span class="badge" style="background: var(--chip-hod-bg); color: var(--color-primary); font-weight: 700;">ALUMNI</span>`
          : `<span class="badge" style="background: var(--status-present-bg); color: var(--status-present); font-weight: 700;">ENROLLED</span>`);

    return `
      <tr style="border-bottom: 1px solid var(--border-color);">
        <td style="padding: 0.75rem 1rem;">${rollDisplay}</td>
        <td style="padding: 0.75rem 1rem;">${ubterDisplay}</td>
        <td style="padding: 0.75rem 1rem;">${enrollDisplay}</td>
        <td style="padding: 0.75rem 1rem; font-weight: 600; color: var(--text-main);">${esc(s.full_name)}</td>
        <td style="padding: 0.75rem 1rem; font-size: 0.85rem; color: var(--text-muted);">Y${s.year || 1} • Sem ${s.semester || 1}</td>
        <td style="padding: 0.75rem 1rem;">${bioDisplay}</td>
        <td style="padding: 0.75rem 1rem;">${statusBadge}</td>
        <td style="padding: 0.75rem 1rem; font-size: 0.85rem;">${googleDisplay}</td>
        <td style="padding: 0.75rem 1rem; text-align: right;">
          ${isHod ? `
            <div style="display: inline-flex; gap: 0.35rem;">
              <button type="button" class="btn btn-secondary btn-sm" title="Reset Password" onclick="openResetStudentModal(${s.id}, '${esc(s.full_name)}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="5.5"></circle><path d="M21 2l-9.6 9.6M15.5 7.5l2.5 2.5M18.5 4.5l2.5 2.5"></path></svg>
              </button>
              <button type="button" class="btn btn-secondary btn-sm" style="color: var(--status-absent);" onclick="openDeleteStudentModal(${s.id}, '${esc(s.full_name)}')">Withdraw</button>
            </div>
          ` : '<span style="color: var(--text-muted); font-size: 0.8rem;">Enrolled</span>'}
        </td>
      </tr>
    `;
  }).join('');
}

function debounceSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    const q = (document.getElementById('search-input')?.value || '').toLowerCase().trim();
    if (!q) {
      renderStudents(allStudents);
      return;
    }
    const filtered = allStudents.filter(s =>
      (s.full_name || '').toLowerCase().includes(q) ||
      (s.official_enrollment_no || '').toLowerCase().includes(q) ||
      (s.ubter_reg_no || '').toLowerCase().includes(q) ||
      String(s.class_roll_no || '').includes(q)
    );
    renderStudents(filtered);
  }, 200);
}

function resetFilters() {
  const sInput = document.getElementById('search-input');
  const fYear = document.getElementById('filter-year');
  const fSem = document.getElementById('filter-sem');
  const cSel = document.getElementById('cohort-select');
  if (sInput) sInput.value = '';
  if (fYear) fYear.value = '';
  if (fSem) fSem.value = '';
  if (cSel) cSel.value = '';
  selectedCohort = null;
  updateRegistrationStatusBadge();
  loadStudents();
}

// Declarative Add Student Modal
async function openAddStudentModal() {
  if (typeof openDynamicForm !== 'function') return;

  const result = await openDynamicForm({
    title: 'Add Student to Department',
    subtitle: 'Admit student into department roster. Class roll numbers are maintained automatically in alphabetical sequence.',
    submitLabel: 'Admit Student',
    fields: [
      {
        name: 'full_name',
        label: 'Full Name',
        type: 'text',
        placeholder: 'Aakash Sharma',
        required: true
      },
      {
        name: 'official_enrollment_no',
        label: 'Official Enrollment #',
        type: 'text',
        placeholder: 'e.g. 2026IT001',
        required: true
      },
      {
        name: 'ubter_reg_no',
        label: 'UBTER Registration #',
        type: 'text',
        placeholder: 'Optional board registration'
      },
      {
        name: 'email',
        label: 'Login Gmail',
        type: 'email',
        placeholder: 'student@gmail.com'
      },
      {
        name: 'year',
        label: 'Year',
        type: 'select',
        defaultValue: selectedCohort?.year || 1,
        options: [
          { value: 1, label: 'Year 1' },
          { value: 2, label: 'Year 2' },
          { value: 3, label: 'Year 3' }
        ],
        required: true
      },
      {
        name: 'semester',
        label: 'Semester',
        type: 'select',
        defaultValue: selectedCohort?.semester || 1,
        options: [
          { value: 1, label: 'Sem 1' },
          { value: 2, label: 'Sem 2' },
          { value: 3, label: 'Sem 3' },
          { value: 4, label: 'Sem 4' },
          { value: 5, label: 'Sem 5' },
          { value: 6, label: 'Sem 6' }
        ],
        required: true
      }
    ]
  });

  if (!result) return;

  try {
    const res = await apiFetch(`${API}/students`, {
      method: 'POST',
      body: JSON.stringify({
        ...result,
        year: parseInt(result.year),
        semester: parseInt(result.semester)
      })
    });

    if (typeof showToast === 'function') showToast('Student admitted successfully!', 'success');
    loadStudents();

    if (typeof openDetailDialog === 'function') {
      openDetailDialog({
        title: 'Student Admission Slip',
        subtitle: 'Student provisioned into roster. Please share credentials with student.',
        data: {
          'Student Name': result.full_name,
          'Official Enrollment #': result.official_enrollment_no,
          'Temporary Password': res?.data?.temporary_password || 'Password@123',
          'Cohort': `Year ${result.year} Semester ${result.semester}`,
          'Portal Login': `${window.location.origin}/login`
        }
      });
    }
  } catch (err) {
    if (typeof showToast === 'function') showToast(err.message || 'Failed to admit student.', 'error');
  }
}

// Declarative Bulk CSV Modal
async function openBulkStudentModal() {
  if (typeof openDynamicForm !== 'function') return;

  const result = await openDynamicForm({
    title: 'Bulk Student CSV Import',
    subtitle: 'Paste CSV rows: full_name, official_enrollment_no, ubter_reg_no, email',
    submitLabel: 'Process Bulk CSV',
    fields: [
      {
        name: 'year',
        label: 'Target Year',
        type: 'select',
        defaultValue: selectedCohort?.year || 1,
        options: [
          { value: 1, label: 'Year 1' },
          { value: 2, label: 'Year 2' },
          { value: 3, label: 'Year 3' }
        ],
        required: true
      },
      {
        name: 'semester',
        label: 'Target Semester',
        type: 'select',
        defaultValue: selectedCohort?.semester || 1,
        options: [
          { value: 1, label: 'Sem 1' },
          { value: 2, label: 'Sem 2' },
          { value: 3, label: 'Sem 3' },
          { value: 4, label: 'Sem 4' },
          { value: 5, label: 'Sem 5' },
          { value: 6, label: 'Sem 6' }
        ],
        required: true
      },
      {
        name: 'csv',
        label: 'CSV Data (One student per line)',
        type: 'textarea',
        rows: 8,
        placeholder: 'Aakash Sharma, 2026IT001, REG101, aakash@gmail.com\nBhavna Joshi, 2026IT002, REG102, bhavna@gmail.com',
        required: true
      }
    ]
  });

  if (!result) return;

  const lines = result.csv.split('\n').filter(Boolean);
  const students = lines.map(line => {
    const parts = line.split(',').map(p => p.trim());
    return {
      full_name: parts[0],
      official_enrollment_no: parts[1],
      ubter_reg_no: parts[2] || undefined,
      email: parts[3] || undefined
    };
  }).filter(s => s.full_name && s.official_enrollment_no);

  if (students.length === 0) {
    if (typeof showToast === 'function') showToast('No valid student rows found in CSV data.', 'error');
    return;
  }

  try {
    const res = await apiFetch(`${API}/students/bulk`, {
      method: 'POST',
      body: JSON.stringify({
        year: parseInt(result.year),
        semester: parseInt(result.semester),
        students
      })
    });

    if (typeof showToast === 'function') showToast(`Successfully provisioned ${students.length} students!`, 'success');
    loadStudents();

    const createdList = res?.data?.created || [];
    if (typeof openDetailDialog === 'function' && createdList.length > 0) {
      const summaryData = {};
      createdList.forEach((s, idx) => {
        summaryData[`#${idx + 1} ${s.full_name}`] = `Roll ${s.class_roll_no || '—'} | Enroll ${s.official_enrollment_no} | Pass: ${s.temporary_password}`;
      });
      openDetailDialog({
        title: 'Bulk Admission Complete',
        subtitle: `Provisioned ${createdList.length} accounts. Copy or save credentials.`,
        data: summaryData
      });
    }
  } catch (err) {
    if (typeof showToast === 'function') showToast(err.message || 'Failed to process bulk import.', 'error');
  }
}

// Declarative Re-index Roll Numbers Modal
async function openReindexRollModal() {
  if (typeof openDynamicForm !== 'function') return;

  const result = await openDynamicForm({
    title: 'Re-order Class Roll Numbers',
    subtitle: 'Re-sequence roll numbers strictly alphabetically (A–Z) from 1 to N without gaps.',
    submitLabel: 'Re-sequence Roll Numbers',
    fields: [
      {
        name: 'year',
        label: 'Target Year',
        type: 'select',
        defaultValue: selectedCohort?.year || 1,
        options: [
          { value: 1, label: 'Year 1' },
          { value: 2, label: 'Year 2' },
          { value: 3, label: 'Year 3' }
        ],
        required: true
      },
      {
        name: 'semester',
        label: 'Target Semester',
        type: 'select',
        defaultValue: selectedCohort?.semester || 1,
        options: [
          { value: 1, label: 'Sem 1' },
          { value: 2, label: 'Sem 2' },
          { value: 3, label: 'Sem 3' },
          { value: 4, label: 'Sem 4' },
          { value: 5, label: 'Sem 5' },
          { value: 6, label: 'Sem 6' }
        ],
        required: true
      }
    ]
  });

  if (!result) return;

  try {
    await apiFetch(`${API}/students/reindex-roll`, {
      method: 'POST',
      body: JSON.stringify({
        year: parseInt(result.year),
        semester: parseInt(result.semester)
      })
    });
    if (typeof showToast === 'function') showToast('Roll numbers re-sequenced alphabetically (A–Z)!', 'success');
    loadStudents();
  } catch (err) {
    if (typeof showToast === 'function') showToast(err.message || 'Failed to re-index roll numbers.', 'error');
  }
}

// Declarative Semester Progression Engine
async function openPromotionProgressionModal() {
  if (typeof openDynamicForm !== 'function') return;

  const result = await openDynamicForm({
    title: 'Semester Promotion & Progression Engine',
    subtitle: `Advance eligible cohorts to the next semester cycle. Department Code safety check required (${currentDeptCode}).`,
    submitLabel: 'Advance Semester Cycle',
    fields: [
      {
        name: 'action',
        label: 'Progression Direction',
        type: 'select',
        defaultValue: 'promote',
        options: [
          { value: 'promote', label: 'Advance / Promote Cohorts (→ Next Semester)' },
          { value: 'demote', label: 'Rollback / Demote Cohorts (← Previous Semester)' }
        ],
        required: true
      },
      {
        name: 'confirm_code',
        label: `Department Security Code (Type ${currentDeptCode} to unlock)`,
        type: 'text',
        placeholder: currentDeptCode,
        required: true
      }
    ]
  });

  if (!result) return;

  if (result.confirm_code.trim().toUpperCase() !== currentDeptCode.toUpperCase()) {
    if (typeof showToast === 'function') showToast(`Incorrect department code. Please type ${currentDeptCode}.`, 'error');
    return;
  }

  try {
    const res = await apiFetch(`${API}/promotion/execute`, {
      method: 'POST',
      body: JSON.stringify({
        action: result.action,
        confirm_code: result.confirm_code.trim().toUpperCase()
      })
    });
    if (typeof showToast === 'function') showToast(res.message || 'Semester progression successfully executed!', 'success');
    loadStudents();
  } catch (err) {
    if (typeof showToast === 'function') showToast(err.message || 'Progression execution failed.', 'error');
  }
}

// Declarative Reset Student Password Modal
async function openResetStudentModal(id, name) {
  if (typeof openDynamicForm !== 'function') return;

  const result = await openDynamicForm({
    title: 'Reset Student Password',
    subtitle: `Set a new password for student ${esc(name)}.`,
    submitLabel: 'Save New Password',
    fields: [
      {
        name: 'new_password',
        label: 'New Password',
        type: 'text',
        defaultValue: 'Password@123',
        required: true
      }
    ]
  });

  if (!result) return;

  try {
    await apiFetch(`${API}/students/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify(result)
    });
    if (typeof showToast === 'function') showToast('Student password updated successfully!', 'success');
  } catch (err) {
    if (typeof showToast === 'function') showToast(err.message || 'Failed to reset student password.', 'error');
  }
}

// Declarative Delete Student Modal (Withdrawal)
async function openDeleteStudentModal(id, name) {
  if (typeof openConfirm !== 'function') return;

  const confirmed = await openConfirm({
    title: 'Student Withdrawal / Left College?',
    message: `Are you sure you want to withdraw <strong>${esc(name)}</strong> from the department roster? Class roll numbers for their cohort will automatically re-index without gaps.`,
    confirmText: 'Confirm Withdrawal',
    confirmVariant: 'danger'
  });

  if (!confirmed) return;

  try {
    await apiFetch(`${API}/students/${id}`, { method: 'DELETE' });
    if (typeof showToast === 'function') showToast('Student withdrawn from roster.', 'info');
    loadStudents();
  } catch (err) {
    if (typeof showToast === 'function') showToast(err.message || 'Failed to withdraw student.', 'error');
  }
}

// ══════════════════════════════════════════════════════════════
// PENDING STUDENT REGISTRATIONS QUEUE
// ══════════════════════════════════════════════════════════════

async function loadPendingRegistrations() {
  const tbody = document.getElementById('pending-tbody');
  const badge = document.getElementById('pending-badge');
  const statBadge = document.getElementById('stat-pending');

  try {
    const res = await apiFetch('/students/registrations/pending');
    const list = res?.data || [];

    if (badge) {
      badge.textContent = list.length;
      badge.style.display = list.length > 0 ? 'inline-block' : 'none';
    }
    if (statBadge) statBadge.textContent = list.length;
    const countLbl = document.getElementById('pending-count-label');
    if (countLbl) countLbl.textContent = `${list.length} requests pending`;

    if (!tbody) return;

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">No pending student registrations.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(r => `
      <tr style="border-bottom: 1px solid var(--border-color);">
        <td style="padding: 0.75rem 1rem; font-weight: 600;">${esc(r.full_name)}</td>
        <td style="padding: 0.75rem 1rem; font-family: var(--font-family-mono, monospace);">${esc(r.official_enrollment_no || r.enrollment_no)}</td>
        <td style="padding: 0.75rem 1rem; font-family: var(--font-family-mono, monospace); font-size: 0.85rem;">${esc(r.email)}</td>
        <td style="padding: 0.75rem 1rem; font-size: 0.85rem;">${esc(r.department_name || 'IT')} Y${r.year} S${r.semester}</td>
        <td style="padding: 0.75rem 1rem; font-size: 0.8rem; color: var(--text-muted);">${new Date(r.registered_at || r.created_at || Date.now()).toLocaleDateString()}</td>
        <td style="padding: 0.75rem 1rem; text-align: right;">
          <button class="btn btn-primary btn-sm" onclick="openApproveModal(${r.student_id || r.id}, '${esc(r.full_name)}', '${esc(r.official_enrollment_no || r.enrollment_no)}')">Approve</button>
          <button class="btn btn-secondary btn-sm" style="color: var(--status-absent);" onclick="openRejectModal(${r.student_id || r.id}, '${esc(r.full_name)}')">Reject</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Failed to load pending registrations:', err);
    if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--status-absent);">Failed to load pending registrations queue.</td></tr>`;
  }
}

// Declarative Student Approval Modal
async function openApproveModal(id, name, enrollNo) {
  if (typeof openDynamicForm !== 'function') return;

  const result = await openDynamicForm({
    title: 'Approve Student Registration',
    subtitle: `Admit ${esc(name)} into the active department roster.`,
    submitLabel: 'Confirm & Approve',
    fields: [
      {
        name: 'official_enrollment_no',
        label: 'Official Enrollment Number',
        type: 'text',
        defaultValue: enrollNo || '',
        placeholder: 'e.g. 2024IT001',
        required: true
      }
    ]
  });

  if (!result) return;

  try {
    await apiFetch(`/students/registrations/${id}/adjudicate`, {
      method: 'POST',
      body: JSON.stringify({
        action: 'APPROVE',
        official_enrollment_no: result.official_enrollment_no.trim()
      })
    });
    if (typeof showToast === 'function') showToast('Student registration approved!', 'success');
    loadPendingRegistrations();
    loadStudents();
  } catch (err) {
    if (typeof showToast === 'function') showToast(err.message || 'Failed to approve student.', 'error');
  }
}

// Declarative Student Rejection Modal
async function openRejectModal(id, name) {
  if (typeof openDynamicForm !== 'function') return;

  const result = await openDynamicForm({
    title: 'Reject Registration',
    subtitle: `Decline registration for ${esc(name)}.`,
    submitLabel: 'Confirm Rejection',
    fields: [
      {
        name: 'rejection_reason',
        label: 'Reason for Rejection',
        type: 'textarea',
        rows: 3,
        placeholder: 'e.g. Invalid enrollment certificate or details mismatch',
        required: true
      }
    ]
  });

  if (!result) return;

  try {
    await apiFetch(`/students/registrations/${id}/adjudicate`, {
      method: 'POST',
      body: JSON.stringify({ action: 'REJECT', rejection_reason: result.rejection_reason.trim() })
    });
    if (typeof showToast === 'function') showToast('Registration rejected.', 'info');
    loadPendingRegistrations();
  } catch (err) {
    if (typeof showToast === 'function') showToast(err.message || 'Failed to reject registration.', 'error');
  }
}

// Aliases for compatibility
window.openCreateModal = openCreateTeacherModal;
window.openAddModal = openAddStudentModal;
window.openBulkModal = openBulkStudentModal;
window.openReindexModal = openReindexRollModal;
window.openPromotionModal = openPromotionProgressionModal;
window.openResetModal = openResetTeacherModal;
window.openDeleteModal = openDeleteTeacherModal;
window.openResetStudentModal = openResetStudentModal;
window.openDeleteStudentModal = openDeleteStudentModal;
window.openApproveModal = openApproveModal;
window.openRejectModal = openRejectModal;
window.showMainTab = showMainTab;
window.toggleFacultyRegistration = toggleFacultyRegistration;
window.toggleDepartmentStudentRegistration = toggleDepartmentStudentRegistration;
window.toggleCohortRegistration = toggleCohortRegistration;
window.filterTeachers = filterTeachers;
window.debounceSearch = debounceSearch;
window.resetFilters = resetFilters;
window.onCohortSelectChange = onCohortSelectChange;
window.loadStudents = loadStudents;
