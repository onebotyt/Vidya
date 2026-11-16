/**
 * ══════════════════════════════════════════════════════════════
 * VIDYAOS STUDENTS MANAGEMENT CONTROLLER (students.js)
 * Clean, Compact, Minimal, Mobile-First
 * PC: RollNo, Enrollment, Student Name, Actions (3-Dot Menu)
 * Mobile: RollNo, Student Name, Actions (Zero Horizontal Overflow)
 * Includes 30-Day Trash Bin & Safe Student Recovery System
 * ══════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  // Auth Gate
  if (typeof requireFacultyAuth === 'function') {
    requireFacultyAuth(['TEACHER', 'HOD', 'SYSTEM_ADMIN']);
  } else if (typeof guardRoute === 'function') {
    guardRoute({ roles: ['TEACHER', 'HOD', 'SYSTEM_ADMIN'] });
  }

  let allStudents = [];
  let pendingStudents = [];
  let trashStudents = [];
  let currentYearFilter = 'ALL';
  let studentRegOpen = false;
  let currentDetailStudentId = null;

  const esc = (s) => (s == null ? '' : String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
  const notify = (msg, type = 'info') => {
    if (typeof showToast === 'function') showToast(msg, type);
    else alert(msg);
  };

  function getInitials(name) {
    if (!name) return 'ST';
    const clean = name.replace(/^(mr\.|ms\.|mrs\.)\s+/i, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return clean.slice(0, 2).toUpperCase() || 'ST';
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
      loadStudentsRoster(),
      loadPendingStudents(),
      loadTrashStudents(),
      loadRegistrationStatus()
    ]);
  }

  // 2. Fetch Data
  async function loadStudentsRoster() {
    try {
      let res = await api('/hod/students-roster');
      if (!res || !res.success) {
        res = await api('/faculty/my-students');
      }

      if (res && res.success && Array.isArray(res.data)) {
        allStudents = res.data;
        updateCounts();
        if (currentYearFilter !== 'PENDING' && currentYearFilter !== 'TRASH') renderTable();
      }
    } catch (err) {
      console.error('[Students] Failed to load student roster:', err);
    }
  }

  async function loadPendingStudents() {
    try {
      const res = await api('/hod/registrations/pending-students');
      if (res && res.success && Array.isArray(res.data)) {
        pendingStudents = res.data;
        updateCounts();
        if (currentYearFilter === 'PENDING') renderTable();
      }
    } catch (_) {}
  }

  async function loadTrashStudents() {
    try {
      const res = await api('/hod/trash/students');
      if (res && res.success && Array.isArray(res.data)) {
        trashStudents = res.data;
        updateCounts();
        if (currentYearFilter === 'TRASH') renderTable();
      }
    } catch (err) {
      console.warn('[Students] Trash check error:', err.message);
    }
  }

  async function loadRegistrationStatus() {
    try {
      const res = await api('/hod/student-registration-status');
      if (res && res.success && res.data) {
        studentRegOpen = Boolean(res.data.is_open);
        renderToggleState();
      }
    } catch (_) {}
  }

  function renderToggleState() {
    const toggleEl = document.getElementById('toggle-student-reg');
    const badgeEl = document.getElementById('badge-toggle-student-status');
    if (toggleEl) toggleEl.checked = studentRegOpen;
    if (badgeEl) {
      badgeEl.className = `status-badge-toggle ${studentRegOpen ? 'open' : 'closed'}`;
      badgeEl.textContent = studentRegOpen ? 'OPEN' : 'CLOSED';
    }
  }

  async function toggleRegistration(checked) {
    try {
      const res = await api('/hod/student-registration-toggle', {
        method: 'POST',
        body: JSON.stringify({ is_open: checked })
      });
      if (res && res.success) {
        studentRegOpen = checked;
        renderToggleState();
        notify(`Student self-registration is now ${checked ? 'OPEN' : 'CLOSED'}`, 'success');
      } else {
        throw new Error(res?.error?.message || 'Toggle failed');
      }
    } catch (err) {
      notify(err.message, 'error');
      renderToggleState();
    }
  }

  function updateCounts() {
    const elTotal = document.getElementById('stat-total-students');
    const elDefaulter = document.getElementById('stat-defaulter-students');
    const elPending = document.getElementById('stat-pending-students');
    const badgeAll = document.getElementById('badge-count-all');
    const badgePending = document.getElementById('badge-count-pending');
    const badgeTrash = document.getElementById('badge-count-trash');
    const headerTrash = document.getElementById('header-trash-count');

    const total = allStudents.length;
    const defaulters = allStudents.filter(s => s.is_defaulter || s.below_threshold).length;
    const pending = pendingStudents.length;
    const trash = trashStudents.length;

    if (elTotal) elTotal.textContent = total;
    if (elDefaulter) elDefaulter.textContent = `${defaulters} below 75%`;
    if (elPending) elPending.textContent = pending;
    if (badgeAll) badgeAll.textContent = total;
    if (badgePending) badgePending.textContent = pending;
    if (badgeTrash) badgeTrash.textContent = trash;
    if (headerTrash) headerTrash.textContent = trash;

    // Update Year Pill Counts
    for (let yr = 1; yr <= 3; yr++) {
      const badgeYr = document.getElementById(`badge-count-y${yr}`);
      if (badgeYr) {
        const c = allStudents.filter(s => parseInt(s.year || Math.ceil((s.semester || 1) / 2), 10) === yr).length;
        badgeYr.textContent = c;
      }
    }
  }

  // 3. Switch Tabs
  function switchToPendingTab() {
    document.querySelectorAll('.stu-pill').forEach(b => b.classList.remove('active'));
    const pill = document.getElementById('pill-pending');
    if (pill) pill.classList.add('active');
    currentYearFilter = 'PENDING';
    renderTable();
  }

  function switchToTrashTab() {
    document.querySelectorAll('.stu-pill').forEach(b => b.classList.remove('active'));
    const pill = document.getElementById('pill-trash');
    if (pill) pill.classList.add('active');
    currentYearFilter = 'TRASH';
    renderTable();
  }

  // 4. Render Table (Minimal: PC = RollNo, Enrollment, Student Name, Actions)
  function renderTable() {
    const tbody = document.getElementById('students-tbody');
    const searchVal = (document.getElementById('student-search')?.value || '').toLowerCase().trim();

    if (!tbody) return;

    // Toggle table header based on Trash mode
    const thRetention = document.getElementById('th-retention');
    const thEnrollment = document.getElementById('th-enrollment');
    if (thRetention) thRetention.style.display = currentYearFilter === 'TRASH' ? '' : 'none';
    if (thEnrollment) thEnrollment.style.display = currentYearFilter === 'TRASH' ? 'none' : '';

    if (currentYearFilter === 'TRASH') {
      renderTrashTable(tbody, searchVal);
      return;
    }

    if (currentYearFilter === 'PENDING') {
      renderPendingTable(tbody, searchVal);
      return;
    }

    let list = allStudents;

    // Year filter (1, 2, 3)
    if (currentYearFilter !== 'ALL') {
      const targetYr = parseInt(currentYearFilter, 10);
      list = list.filter(s => {
        const y = parseInt(s.year || Math.ceil((s.semester || 1) / 2), 10);
        return y === targetYr;
      });
    }

    // Live search
    if (searchVal) {
      list = list.filter(s =>
        (s.full_name || '').toLowerCase().includes(searchVal) ||
        String(s.class_roll_no || s.roll_number || '').includes(searchVal) ||
        (s.official_enrollment_no || '').toLowerCase().includes(searchVal) ||
        (s.registration_no || '').toLowerCase().includes(searchVal) ||
        (s.email || '').toLowerCase().includes(searchVal)
      );
    }

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
            No students found matching current filter criteria.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = list.map((st, idx) => {
      const roll = st.class_roll_no || st.roll_number || (idx + 1);
      const enroll = st.official_enrollment_no || '—';
      const name = st.full_name || 'Student';
      const studentId = st.student_id || st.id;

      return `
        <tr>
          <td><span class="stu-roll-badge">${roll}</span></td>
          <td class="col-enrollment"><span class="stu-code-mono">${esc(enroll)}</span></td>
          <td>
            <div class="stu-name-wrap">
              <a href="#" class="stu-name-cell" onclick="viewStudentDetails(${studentId}); return false;">${esc(name)}</a>
              <span class="stu-sub-mono">${esc(enroll)}</span>
            </div>
          </td>
          <td>
            <div class="stu-actions-cell">
              <div class="stu-menu-wrap">
                <button type="button" class="btn-kebab" title="Actions" onclick="toggleStudentMenu(event, ${studentId})">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="2"></circle>
                    <circle cx="12" cy="12" r="2"></circle>
                    <circle cx="12" cy="19" r="2"></circle>
                  </svg>
                </button>
                <div class="stu-dropdown-menu" id="stu-menu-${studentId}">
                  <button type="button" class="stu-menu-item" onclick="viewStudentDetails(${studentId})">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    <span>View Details</span>
                  </button>
                  <button type="button" class="stu-menu-item" onclick="resetStudentPassword(${studentId}, '${esc(name)}')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    <span>Reset Password</span>
                  </button>
                  <button type="button" class="stu-menu-item danger" onclick="deleteStudentMember(${studentId}, '${esc(name)}')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    <span>Remove Student</span>
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // 5. Render Trash Bin Roster (30-day retention & restore action)
  function renderTrashTable(tbody, searchVal) {
    let list = trashStudents;
    if (searchVal) {
      list = list.filter(s =>
        (s.full_name || '').toLowerCase().includes(searchVal) ||
        String(s.class_roll_no || '').includes(searchVal) ||
        (s.official_enrollment_no || '').toLowerCase().includes(searchVal) ||
        (s.email || '').toLowerCase().includes(searchVal)
      );
    }

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
            No students currently in the Trash Bin.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = list.map((st, idx) => {
      const roll = st.class_roll_no || (idx + 1);
      const enroll = st.official_enrollment_no || '—';
      const name = st.full_name || 'Student';
      const daysLeft = st.days_left != null ? st.days_left : 30;
      const studentId = st.student_id || st.id;

      return `
        <tr>
          <td><span class="stu-roll-badge" style="opacity: 0.7;">${roll}</span></td>
          <td>
            <div class="stu-name-wrap">
              <span class="stu-name-cell" style="color: var(--text-main); font-weight: 700;">${esc(name)}</span>
              <div class="stu-trash-sub">
                <span>${esc(enroll)}</span>
                &bull;
                <span class="badge-retention-mobile">${daysLeft}d left</span>
              </div>
            </div>
          </td>
          <td class="col-retention">
            <span class="badge-retention">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <span>${daysLeft} days left</span>
            </span>
          </td>
          <td style="text-align: right;">
            <div class="stu-actions-cell">
              <button type="button" class="btn-restore-compact" onclick="restoreStudentMember(${studentId}, '${esc(name)}')" title="Restore student data">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
                <span>Restore</span>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // 6. Render Pending Applications
  function renderPendingTable(tbody, searchVal) {
    let list = pendingStudents;
    if (searchVal) {
      list = list.filter(r =>
        (r.full_name || '').toLowerCase().includes(searchVal) ||
        (r.official_enrollment_no || '').toLowerCase().includes(searchVal) ||
        (r.email || '').toLowerCase().includes(searchVal)
      );
    }

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
            No pending student enrollment applications in queue.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = list.map(req => `
      <tr>
        <td><span class="stu-roll-badge">—</span></td>
        <td class="col-enrollment"><span class="stu-code-mono">${esc(req.official_enrollment_no || 'APPLICANT')}</span></td>
        <td>
          <div class="stu-name-wrap">
            <strong>${esc(req.full_name)}</strong>
            <span class="stu-sub-mono">${esc(req.email)} &bull; Year ${esc(req.year || 1)}</span>
          </div>
        </td>
        <td style="text-align: right;">
          <div class="stu-actions-cell" style="gap: 0.35rem;">
            <button type="button" class="btn-stu-compact" style="padding: 0.25rem 0.55rem; font-size: 0.74rem;" onclick="approveStudentRequest(${req.id})">Approve</button>
            <button type="button" class="btn-kebab" style="color: var(--status-absent);" title="Reject" onclick="rejectStudentRequest(${req.id})">&times;</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  // 7. 3-Dot Dropdown Menu Handlers with Auto Drop-Up Flipping
  function toggleStudentMenu(e, id) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const menu = document.getElementById(`stu-menu-${id}`);
    const btn = e.currentTarget || e.target.closest('.btn-kebab');
    const isAlreadyOpen = menu?.classList.contains('show');
    closeAllMenus();

    if (menu && !isAlreadyOpen) {
      if (btn) {
        const rect = btn.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        if (spaceBelow < 175) {
          menu.classList.add('drop-up');
        } else {
          menu.classList.remove('drop-up');
        }
      }
      menu.classList.add('show');
    }
  }

  function closeAllMenus() {
    document.querySelectorAll('.stu-dropdown-menu.show').forEach(m => m.classList.remove('show'));
  }

  // 8. View Student Dossier Modal
  function viewStudentDetails(id) {
    closeAllMenus();
    const st = allStudents.find(s => (s.student_id || s.id) === id);
    if (!st) return;

    currentDetailStudentId = id;
    const modal = document.getElementById('modal-student-details');
    if (!modal) return;

    const roll = st.class_roll_no || st.roll_number || '—';
    const yr = st.year || (st.semester ? Math.ceil(st.semester / 2) : 1);
    const sem = st.semester ? `Sem ${st.semester}` : '';
    const pct = typeof st.attendance_pct === 'number' ? `${st.attendance_pct.toFixed(0)}%` : '100%';

    document.getElementById('detail-stu-avatar').textContent = getInitials(st.full_name);
    document.getElementById('detail-stu-name').textContent = st.full_name || 'Student';
    document.getElementById('detail-stu-roll').textContent = `Roll #${roll}`;
    document.getElementById('detail-stu-cohort').textContent = `Year ${yr} ${sem ? '(' + sem + ')' : ''}`;
    document.getElementById('detail-stu-enroll').textContent = st.official_enrollment_no || '—';
    document.getElementById('detail-stu-reg').textContent = st.registration_no || '—';
    document.getElementById('detail-stu-att').textContent = pct;
    document.getElementById('detail-stu-dept').textContent = st.department_name || st.department_code || 'Department Roster';
    document.getElementById('detail-stu-email').textContent = st.email || '—';
    document.getElementById('detail-stu-phone').textContent = st.phone || '—';

    modal.style.display = 'flex';
  }

  function closeStudentDetailsModal() {
    const modal = document.getElementById('modal-student-details');
    if (modal) modal.style.display = 'none';
    currentDetailStudentId = null;
  }

  function detailResetPassword() {
    if (!currentDetailStudentId) return;
    const st = allStudents.find(s => (s.student_id || s.id) === currentDetailStudentId);
    resetStudentPassword(currentDetailStudentId, st?.full_name || 'Student');
  }

  function detailDeleteStudent() {
    if (!currentDetailStudentId) return;
    const st = allStudents.find(s => (s.student_id || s.id) === currentDetailStudentId);
    deleteStudentMember(currentDetailStudentId, st?.full_name || 'Student');
    closeStudentDetailsModal();
  }

  // 9. Actions: Reset, Delete, Restore, Reindex, Approve, Reject
  async function resetStudentPassword(id, name) {
    closeAllMenus();
    const newPass = prompt(`Enter new password for ${name}:`, 'Password@123');
    if (!newPass) return;
    try {
      const res = await api(`/hod/students/${id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ new_password: newPass })
      });
      if (res && res.success) notify(`Password reset successfully for ${name}`, 'success');
      else throw new Error(res?.error?.message || 'Password reset failed');
    } catch (err) {
      notify(err.message, 'error');
    }
  }

  async function deleteStudentMember(id, name) {
    closeAllMenus();
    if (typeof window.openDeleteModal === 'function') {
      window.openDeleteModal({
        title: 'Remove Student',
        subtitle: 'Move to Department Trash Bin',
        itemName: name,
        message: 'This will remove the student from active department cohorts and move them to the Trash Bin. Records in the Trash Bin can be restored or will be permanently purged after 30 days.',
        confirmKeyword: 'remove',
        strictCase: false,
        confirmButtonText: 'Move to Trash Bin',
        onConfirm: async () => {
          const res = await api(`/hod/students/${id}`, { method: 'DELETE' });
          if (res && res.success) {
            notify(`${name} moved to Trash Bin (auto-purges in 30 days)`, 'success');
            await Promise.all([loadStudentsRoster(), loadTrashStudents()]);
          } else {
            throw new Error(res?.error?.message || 'Removal failed');
          }
        }
      });
      return;
    }

    const val = prompt(`Type "remove" to move ${name} to Trash Bin:`);
    if (val?.toLowerCase() !== 'remove') return;
    try {
      const res = await api(`/hod/students/${id}`, { method: 'DELETE' });
      if (res && res.success) {
        notify(`${name} moved to Trash Bin (auto-purges in 30 days)`, 'success');
        await Promise.all([loadStudentsRoster(), loadTrashStudents()]);
      } else {
        throw new Error(res?.error?.message || 'Removal failed');
      }
    } catch (err) {
      notify(err.message, 'error');
    }
  }

  async function restoreStudentMember(id, name) {
    try {
      const res = await api(`/hod/trash/students/${id}/restore`, { method: 'POST' });
      if (res && res.success) {
        notify(`${name} restored successfully!`, 'success');
        await Promise.all([loadStudentsRoster(), loadTrashStudents()]);
      } else {
        throw new Error(res?.error?.message || 'Restore failed');
      }
    } catch (err) {
      notify(err.message, 'error');
    }
  }

  async function reindexRoll() {
    if (!confirm('Re-sequence class roll numbers sequentially by official enrollment?')) return;
    try {
      const res = await api('/hod/students/reindex-roll', { method: 'POST', body: JSON.stringify({}) });
      if (res && res.success) {
        notify('Roll numbers re-sequenced successfully!', 'success');
        loadStudentsRoster();
      } else {
        throw new Error(res?.error?.message || 'Re-index failed');
      }
    } catch (err) {
      notify(err.message, 'error');
    }
  }

  async function approveStudentRequest(id) {
    try {
      const res = await api(`/hod/registrations/student/${id}/approve`, { method: 'POST' });
      if (res && res.success) {
        notify('Student enrollment approved!', 'success');
        loadStudentsRoster();
        loadPendingStudents();
      } else throw new Error(res?.error?.message || 'Approval failed');
    } catch (err) {
      notify(err.message, 'error');
    }
  }

  async function rejectStudentRequest(id) {
    try {
      const res = await api(`/hod/registrations/student/${id}/reject`, { method: 'POST' });
      if (res && res.success) {
        notify('Student enrollment declined', 'info');
        loadPendingStudents();
      } else throw new Error(res?.error?.message || 'Rejection failed');
    } catch (err) {
      notify(err.message, 'error');
    }
  }

  // 10. Add Student Modal
  function openAddModal() {
    const m = document.getElementById('modal-add-student');
    if (m) m.style.display = 'flex';
  }

  function closeAddModal() {
    const m = document.getElementById('modal-add-student');
    if (m) m.style.display = 'none';
  }

  async function submitAddStudent(e) {
    e.preventDefault();
    const full_name = document.getElementById('add-stu-name')?.value.trim();
    const class_roll_no = document.getElementById('add-stu-roll')?.value.trim();
    const official_enrollment_no = document.getElementById('add-stu-enroll')?.value.trim();
    const registration_no = document.getElementById('add-stu-reg')?.value.trim();
    const semester = parseInt(document.getElementById('add-stu-sem')?.value || '1', 10);
    const year = Math.ceil(semester / 2);
    const email = document.getElementById('add-stu-email')?.value.trim() || null;
    const phone = document.getElementById('add-stu-phone')?.value.trim() || null;

    if (!full_name || !official_enrollment_no) {
      notify('Student Name and Official Enrollment # are required', 'error');
      return;
    }

    try {
      const res = await api('/hod/students', {
        method: 'POST',
        body: JSON.stringify({
          full_name,
          class_roll_no: class_roll_no ? parseInt(class_roll_no, 10) : null,
          official_enrollment_no,
          registration_no,
          semester,
          year,
          email,
          phone
        })
      });
      if (res && res.success) {
        notify('Student enrolled successfully!', 'success');
        closeAddModal();
        document.getElementById('form-add-student')?.reset();
        loadStudentsRoster();
      } else {
        throw new Error(res?.error?.message || 'Failed to add student');
      }
    } catch (err) {
      notify(err.message, 'error');
    }
  }

  // 11. Bulk CSV Modal
  function openBulkModal() {
    const m = document.getElementById('modal-bulk-csv');
    if (m) m.style.display = 'flex';
  }

  function closeBulkModal() {
    const m = document.getElementById('modal-bulk-csv');
    if (m) m.style.display = 'none';
  }

  async function submitBulkCsv(e) {
    e.preventDefault();
    const csvText = document.getElementById('bulk-csv-text')?.value.trim();
    if (!csvText) {
      notify('Please paste CSV text', 'error');
      return;
    }

    const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
    const students = [];

    const startIdx = lines[0].toLowerCase().includes('name') ? 1 : 0;
    for (let i = startIdx; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim());
      if (parts.length >= 2) {
        students.push({
          full_name: parts[0],
          official_enrollment_no: parts[1],
          class_roll_no: parts[2] ? parseInt(parts[2], 10) : null,
          registration_no: parts[3] || null,
          semester: parts[4] ? parseInt(parts[4], 10) : 1,
          year: parts[4] ? Math.ceil(parseInt(parts[4], 10) / 2) : 1
        });
      }
    }

    if (students.length === 0) {
      notify('No valid student rows found in CSV', 'error');
      return;
    }

    try {
      const res = await api('/hod/students/bulk', {
        method: 'POST',
        body: JSON.stringify({ students })
      });
      if (res && res.success) {
        notify(`Successfully imported ${students.length} students!`, 'success');
        closeBulkModal();
        document.getElementById('bulk-csv-text').value = '';
        loadStudentsRoster();
      } else {
        throw new Error(res?.error?.message || 'Bulk upload failed');
      }
    } catch (err) {
      notify(err.message, 'error');
    }
  }

  // 12. Event Listeners
  function setupEventListeners() {
    document.querySelectorAll('.stu-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.stu-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentYearFilter = btn.dataset.year || 'ALL';
        renderTable();
      });
    });

    const searchInput = document.getElementById('student-search');
    if (searchInput) {
      searchInput.addEventListener('input', () => renderTable());
    }

    const toggleEl = document.getElementById('toggle-student-reg');
    if (toggleEl) {
      toggleEl.addEventListener('change', (e) => toggleRegistration(e.target.checked));
    }

    const addForm = document.getElementById('form-add-student');
    if (addForm) addForm.addEventListener('submit', submitAddStudent);

    const bulkForm = document.getElementById('form-bulk-csv');
    if (bulkForm) bulkForm.addEventListener('submit', submitBulkCsv);

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.stu-menu-wrap')) {
        closeAllMenus();
      }
    });
  }

  // Window Exports
  window.toggleStudentMenu = toggleStudentMenu;
  window.viewStudentDetails = viewStudentDetails;
  window.closeStudentDetailsModal = closeStudentDetailsModal;
  window.detailResetPassword = detailResetPassword;
  window.detailDeleteStudent = detailDeleteStudent;
  window.resetStudentPassword = resetStudentPassword;
  window.deleteStudentMember = deleteStudentMember;
  window.restoreStudentMember = restoreStudentMember;
  window.reindexRoll = reindexRoll;
  window.openAddStudentModal = openAddModal;
  window.closeAddStudentModal = closeAddModal;
  window.openBulkModal = openBulkModal;
  window.closeBulkModal = closeBulkModal;
  window.approveStudentRequest = approveStudentRequest;
  window.rejectStudentRequest = rejectStudentRequest;
  window.switchToPendingTab = switchToPendingTab;
  window.switchToTrashTab = switchToTrashTab;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
