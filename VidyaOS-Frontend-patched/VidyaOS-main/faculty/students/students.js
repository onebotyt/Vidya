/**
 * ══════════════════════════════════════════════════════════════
 * VIDYAOS STUDENTS MANAGEMENT CONTROLLER (students.js)
 * Clean, Compact, Dynamic (Zero Redundant Code)
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
  let currentYearFilter = 'ALL';
  let studentRegOpen = false;

  const esc = (s) => (s == null ? '' : String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
  const notify = (msg, type = 'info') => {
    if (typeof showToast === 'function') showToast(msg, type);
    else alert(msg);
  };

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
      loadRegistrationStatus()
    ]);
  }

  // 2. Fetch Data
  async function loadStudentsRoster() {
    try {
      // Try HOD students roster first, fallback to my-students
      let res = await api('/hod/students-roster');
      if (!res || !res.success) {
        res = await api('/faculty/my-students');
      }

      if (res && res.success && Array.isArray(res.data)) {
        allStudents = res.data;
        updateCounts();
        renderTable();
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

    const total = allStudents.length;
    const defaulters = allStudents.filter(s => s.is_defaulter || s.below_threshold).length;
    const pending = pendingStudents.length;

    if (elTotal) elTotal.textContent = total;
    if (elDefaulter) elDefaulter.textContent = `${defaulters} below 75%`;
    if (elPending) elPending.textContent = pending;
    if (badgeAll) badgeAll.textContent = total;
    if (badgePending) badgePending.textContent = pending;

    // Update Year Pill Counts
    for (let yr = 1; yr <= 3; yr++) {
      const badgeYr = document.getElementById(`badge-count-y${yr}`);
      if (badgeYr) {
        const c = allStudents.filter(s => parseInt(s.year || Math.ceil((s.semester || 1) / 2), 10) === yr).length;
        badgeYr.textContent = c;
      }
    }
  }

  // 3. Render Table
  function renderTable() {
    const tbody = document.getElementById('students-tbody');
    const searchVal = (document.getElementById('student-search')?.value || '').toLowerCase().trim();

    if (!tbody) return;

    if (currentYearFilter === 'PENDING') {
      renderPendingTable(tbody);
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
          <td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
            No students found matching current filter criteria.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = list.map(st => {
      const roll = st.class_roll_no || st.roll_number || '—';
      const reg = st.registration_no || '—';
      const enroll = st.official_enrollment_no || '—';
      const name = st.full_name || 'Student';
      const sem = st.semester ? `Sem ${st.semester}` : '';
      const yr = st.year || (st.semester ? Math.ceil(st.semester / 2) : 1);
      const cohort = `Y${yr}${sem ? ' &middot; ' + sem : ''}`;

      const pct = typeof st.attendance_pct === 'number' ? st.attendance_pct : 100;
      const isLow = pct < 75;
      const pctPill = `<span class="stu-pct-pill ${isLow ? 'low' : 'good'}">${pct.toFixed(0)}%</span>`;

      return `
        <tr>
          <td><span class="stu-roll-badge">${roll}</span></td>
          <td><span class="stu-code-mono">${esc(reg)}</span></td>
          <td><span class="stu-code-mono">${esc(enroll)}</span></td>
          <td>
            <a href="#" class="stu-name-cell" onclick="viewStudent(${st.student_id || st.id}); return false;">${esc(name)}</a>
          </td>
          <td><span style="font-size: 0.78rem; font-weight: 600; color: var(--text-muted);">${cohort}</span></td>
          <td>${pctPill}</td>
          <td>
            <div class="stu-actions-cell">
              <a href="/faculty/esp32-devices/index.html" class="btn-icon-action" title="ESP32 Biometrics Enrollment">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.5a1 1 0 0 1-2 0v-5a1 1 0 0 1 2 0z"/></svg>
              </a>
              <button type="button" class="btn-icon-action danger" title="Remove Student" onclick="deleteStudent(${st.student_id || st.id}, '${esc(name)}')">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function renderPendingTable(tbody) {
    if (pendingStudents.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
            No pending student enrollment applications in queue.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = pendingStudents.map(req => `
      <tr>
        <td><span class="stu-roll-badge">—</span></td>
        <td><span class="stu-code-mono">${esc(req.registration_no || '—')}</span></td>
        <td><span class="stu-code-mono">${esc(req.official_enrollment_no || 'APPLICANT')}</span></td>
        <td><strong>${esc(req.full_name)}</strong><div style="font-size: 0.72rem; color: var(--text-muted);">${esc(req.email)}</div></td>
        <td>Year ${esc(req.year || 1)} / Sem ${esc(req.semester || 1)}</td>
        <td><span class="stu-pct-pill low">Pending</span></td>
        <td>
          <div class="stu-actions-cell">
            <button type="button" class="btn-stu-compact" style="padding: 0.25rem 0.55rem; font-size: 0.74rem;" onclick="approveStudentRequest(${req.id})">Approve</button>
            <button type="button" class="btn-icon-action danger" title="Reject" onclick="rejectStudentRequest(${req.id})">&times;</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  // 4. Actions
  async function deleteStudent(id, name) {
    if (!confirm(`Are you sure you want to remove student "${name}" from department roster?`)) return;
    try {
      const res = await api(`/hod/students/${id}`, { method: 'DELETE' });
      if (res && res.success) {
        notify(`${name} removed successfully`, 'success');
        loadStudentsRoster();
      } else {
        throw new Error(res?.error?.message || 'Delete failed');
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

  // 5. Add Student Modal
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

  // 6. Bulk CSV Modal
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

    // Parse header vs rows
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

  // Event Listeners
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
  }

  window.deleteStudent = deleteStudent;
  window.reindexRoll = reindexRoll;
  window.openAddStudentModal = openAddModal;
  window.closeAddStudentModal = closeAddModal;
  window.openBulkModal = openBulkModal;
  window.closeBulkModal = closeBulkModal;
  window.approveStudentRequest = approveStudentRequest;
  window.rejectStudentRequest = rejectStudentRequest;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
