/**
 * ══════════════════════════════════════════════════════════════
 * VIDYAOS FACULTY MANAGEMENT CONTROLLER (faculty.js)
 * Clean, Compact, Dynamic (Zero Redundant Code)
 * ══════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  // HOD RBAC Check
  if (typeof requireFacultyAuth === 'function') {
    requireFacultyAuth(['HOD', 'SYSTEM_ADMIN']);
  } else if (typeof guardRoute === 'function') {
    guardRoute({ roles: ['HOD', 'SYSTEM_ADMIN'], redirectUrl: '/faculty/dashboard/index.html' });
  }

  let allFaculty = [];
  let pendingFaculty = [];
  let currentFilter = 'ALL';
  let regOpen = false;

  const esc = (s) => (s == null ? '' : String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
  const notify = (msg, type = 'info') => {
    if (typeof showToast === 'function') showToast(msg, type);
    else alert(msg);
  };

  function getInitials(name) {
    if (!name) return 'FA';
    const clean = name.replace(/^(prof\.|dr\.|mr\.|ms\.|mrs\.)\s+/i, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return clean.slice(0, 2).toUpperCase() || 'FA';
  }

  async function api(url, opts = {}) {
    if (typeof fetchApi === 'function') return await fetchApi(url, opts);
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    const res = await fetch(`/api/v1${url}`, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(opts.headers || {})
      }
    });
    return await res.json();
  }

  // 1. Initial Load
  async function init() {
    setupEventListeners();
    await Promise.all([
      loadFacultyRoster(),
      loadPendingFaculty(),
      loadRegistrationStatus()
    ]);
  }

  // 2. Fetch Data
  async function loadFacultyRoster() {
    try {
      const res = await api('/hod/faculty-roster');
      if (res && res.success && Array.isArray(res.data)) {
        allFaculty = res.data;
        updateCounts();
        renderTable();
      }
    } catch (err) {
      console.error('[Faculty] Failed to load faculty roster:', err);
    }
  }

  async function loadPendingFaculty() {
    try {
      const res = await api('/hod/registrations/pending-faculty');
      if (res && res.success && Array.isArray(res.data)) {
        pendingFaculty = res.data;
        updateCounts();
        if (currentFilter === 'PENDING') renderTable();
      }
    } catch (err) {
      console.warn('[Faculty] Pending registrations check:', err.message);
    }
  }

  async function loadRegistrationStatus() {
    try {
      const res = await api('/hod/faculty-registration-status');
      if (res && res.success && res.data) {
        regOpen = Boolean(res.data.is_open);
        renderToggleState();
      }
    } catch (_) {}
  }

  function renderToggleState() {
    const toggleEl = document.getElementById('toggle-faculty-reg');
    const badgeEl = document.getElementById('badge-toggle-status');
    if (toggleEl) toggleEl.checked = regOpen;
    if (badgeEl) {
      badgeEl.className = `status-badge-toggle ${regOpen ? 'open' : 'closed'}`;
      badgeEl.textContent = regOpen ? 'OPEN' : 'CLOSED';
    }
  }

  async function toggleRegistration(checked) {
    try {
      const res = await api('/hod/faculty-registration-toggle', {
        method: 'POST',
        body: JSON.stringify({ is_open: checked })
      });
      if (res && res.success) {
        regOpen = checked;
        renderToggleState();
        notify(`Faculty self-registration is now ${checked ? 'OPEN' : 'CLOSED'}`, 'success');
      } else {
        throw new Error(res?.error?.message || 'Toggle failed');
      }
    } catch (err) {
      notify(err.message, 'error');
      renderToggleState();
    }
  }

  function updateCounts() {
    const elTotal = document.getElementById('stat-total-faculty');
    const elActive = document.getElementById('stat-active-faculty');
    const elPending = document.getElementById('stat-pending-faculty');
    const badgeAll = document.getElementById('badge-count-all');
    const badgePending = document.getElementById('badge-count-pending');

    const total = allFaculty.length;
    const active = allFaculty.filter(f => f.status === 'ACTIVE').length;
    const pending = pendingFaculty.length;

    if (elTotal) elTotal.textContent = total;
    if (elActive) elActive.textContent = `${active} active`;
    if (elPending) elPending.textContent = pending;
    if (badgeAll) badgeAll.textContent = total;
    if (badgePending) badgePending.textContent = pending;
  }

  // 3. Render Table
  function renderTable() {
    const tbody = document.getElementById('faculty-tbody');
    const searchVal = (document.getElementById('faculty-search')?.value || '').toLowerCase().trim();

    if (!tbody) return;

    if (currentFilter === 'PENDING') {
      renderPendingTable(tbody);
      return;
    }

    let list = allFaculty;

    // Filter by designation / role
    if (currentFilter === 'HOD') {
      list = list.filter(f => (f.employee_id || '').toUpperCase().includes('HOD') || (f.role || '').toUpperCase() === 'HOD');
    } else if (currentFilter === 'CLASS_TEACHER') {
      list = list.filter(f => f.is_class_teacher || (f.employee_id || '').toUpperCase().includes('CT'));
    } else if (currentFilter === 'LECTURER') {
      list = list.filter(f => !(f.employee_id || '').toUpperCase().includes('HOD') && !f.is_class_teacher && !(f.employee_id || '').toUpperCase().includes('CT'));
    }

    // Search query filter
    if (searchVal) {
      list = list.filter(f =>
        (f.full_name || '').toLowerCase().includes(searchVal) ||
        (f.employee_id || '').toLowerCase().includes(searchVal) ||
        (f.email || '').toLowerCase().includes(searchVal) ||
        (f.phone || '').toLowerCase().includes(searchVal)
      );
    }

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
            No faculty members match current filter criteria.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = list.map((f, idx) => {
      const isHod = (f.employee_id || '').toUpperCase().includes('HOD') || (f.role || '').toUpperCase() === 'HOD';
      const isCt = f.is_class_teacher || (f.employee_id || '').toUpperCase().includes('CT');
      const roleBadge = isHod
        ? '<span class="fac-role-chip hod">HOD</span>'
        : (isCt ? '<span class="fac-role-chip class-teacher">Class Teacher</span>' : '<span class="fac-role-chip lecturer">Lecturer</span>');

      const subjectsCount = (Array.isArray(f.subjects) ? f.subjects.length : f.assignment_count) || 0;
      const initials = getInitials(f.full_name);

      return `
        <tr>
          <td style="color: var(--text-muted); font-size: 0.75rem; width: 36px;">${idx + 1}</td>
          <td>
            <div class="fac-member-cell">
              <div class="fac-avatar">${initials}</div>
              <div>
                <div class="fac-member-name">${esc(f.full_name)}</div>
                <div class="fac-member-email">${esc(f.email || f.gmail || 'No email')}</div>
              </div>
            </div>
          </td>
          <td><span class="fac-emp-code">${esc(f.employee_id || '—')}</span></td>
          <td>${roleBadge}</td>
          <td>
            <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-main);">${subjectsCount} Subjects</span>
            <span style="font-size: 0.72rem; color: var(--text-muted);"> (${f.teaching_load || subjectsCount} hrs/wk)</span>
          </td>
          <td>
            <div class="fac-actions-cell">
              <button type="button" class="btn-icon-action" title="Reset Password" onclick="resetFacultyPassword(${f.id}, '${esc(f.full_name)}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              </button>
              ${!isHod ? `
                <button type="button" class="btn-icon-action danger" title="Remove Faculty" onclick="deleteFacultyMember(${f.id}, '${esc(f.full_name)}')">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function renderPendingTable(tbody) {
    if (pendingFaculty.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
            No pending faculty registration requests in queue.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = pendingFaculty.map((req, idx) => `
      <tr>
        <td style="color: var(--text-muted); font-size: 0.75rem; width: 36px;">${idx + 1}</td>
        <td>
          <div class="fac-member-cell">
            <div class="fac-avatar">${getInitials(req.full_name)}</div>
            <div>
              <div class="fac-member-name">${esc(req.full_name)}</div>
              <div class="fac-member-email">${esc(req.email)} &middot; ${esc(req.phone || '')}</div>
            </div>
          </div>
        </td>
        <td><span class="fac-emp-code">${esc(req.employee_id || 'PENDING')}</span></td>
        <td><span class="fac-role-chip lecturer">Applicant</span></td>
        <td style="font-size: 0.75rem; color: var(--text-muted);">${new Date(req.created_at).toLocaleDateString()}</td>
        <td>
          <div class="fac-actions-cell">
            <button type="button" class="btn-primary-compact" style="padding: 0.25rem 0.55rem; font-size: 0.74rem;" onclick="approveRequest(${req.id})">Approve</button>
            <button type="button" class="btn-icon-action danger" title="Reject" onclick="rejectRequest(${req.id})">&times;</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  // 4. Actions
  async function resetFacultyPassword(id, name) {
    const newPass = prompt(`Enter new password for ${name}:`, 'Welcome@123');
    if (!newPass) return;
    try {
      const res = await api(`/hod/teachers/${id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ new_password: newPass })
      });
      if (res && res.success) notify(`Password reset successfully for ${name}`, 'success');
      else throw new Error(res?.error?.message || 'Password reset failed');
    } catch (err) {
      notify(err.message, 'error');
    }
  }

  async function deleteFacultyMember(id, name) {
    if (!confirm(`Are you sure you want to remove ${name} from department faculty?`)) return;
    try {
      const res = await api(`/hod/teachers/${id}`, { method: 'DELETE' });
      if (res && res.success) {
        notify(`${name} removed successfully`, 'success');
        loadFacultyRoster();
      } else {
        throw new Error(res?.error?.message || 'Removal failed');
      }
    } catch (err) {
      notify(err.message, 'error');
    }
  }

  async function approveRequest(id) {
    try {
      const res = await api(`/hod/registrations/faculty/${id}/approve`, { method: 'POST' });
      if (res && res.success) {
        notify('Faculty request approved successfully!', 'success');
        loadFacultyRoster();
        loadPendingFaculty();
      } else throw new Error(res?.error?.message || 'Approval failed');
    } catch (err) {
      notify(err.message, 'error');
    }
  }

  async function rejectRequest(id) {
    const reason = prompt('Optional rejection reason:') || 'Registration request declined';
    try {
      const res = await api(`/hod/registrations/faculty/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
      if (res && res.success) {
        notify('Faculty request rejected', 'info');
        loadPendingFaculty();
      } else throw new Error(res?.error?.message || 'Rejection failed');
    } catch (err) {
      notify(err.message, 'error');
    }
  }

  // 5. Add Faculty Modal
  function openAddModal() {
    const m = document.getElementById('modal-add-faculty');
    if (m) m.style.display = 'flex';
  }

  function closeAddModal() {
    const m = document.getElementById('modal-add-faculty');
    if (m) m.style.display = 'none';
  }

  async function submitAddFaculty(e) {
    e.preventDefault();
    const full_name = document.getElementById('add-fac-name')?.value.trim();
    const employee_id = document.getElementById('add-fac-empid')?.value.trim();
    const email = document.getElementById('add-fac-email')?.value.trim();
    const phone = document.getElementById('add-fac-phone')?.value.trim();
    const password = document.getElementById('add-fac-pass')?.value || 'Welcome@123';

    if (!full_name || !employee_id || !email) {
      notify('Full name, Employee ID, and Email are required', 'error');
      return;
    }

    try {
      const res = await api('/hod/teachers', {
        method: 'POST',
        body: JSON.stringify({ full_name, employee_id, email, phone, password })
      });
      if (res && res.success) {
        notify('Faculty member onboarded successfully!', 'success');
        closeAddModal();
        document.getElementById('form-add-faculty')?.reset();
        loadFacultyRoster();
      } else {
        throw new Error(res?.error?.message || 'Failed to add faculty');
      }
    } catch (err) {
      notify(err.message, 'error');
    }
  }

  // Event Listeners
  function setupEventListeners() {
    // Pills
    document.querySelectorAll('.fac-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.fac-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter || 'ALL';
        renderTable();
      });
    });

    // Live Search
    const searchInput = document.getElementById('faculty-search');
    if (searchInput) {
      searchInput.addEventListener('input', () => renderTable());
    }

    // Toggle switch
    const toggleEl = document.getElementById('toggle-faculty-reg');
    if (toggleEl) {
      toggleEl.addEventListener('change', (e) => toggleRegistration(e.target.checked));
    }

    // Modal Form
    const addForm = document.getElementById('form-add-faculty');
    if (addForm) {
      addForm.addEventListener('submit', submitAddFaculty);
    }
  }

  // Window Exports for inline calls
  window.resetFacultyPassword = resetFacultyPassword;
  window.deleteFacultyMember = deleteFacultyMember;
  window.approveRequest = approveRequest;
  window.rejectRequest = rejectRequest;
  window.openAddFacultyModal = openAddModal;
  window.closeAddFacultyModal = closeAddModal;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
