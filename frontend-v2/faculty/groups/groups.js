/**
 * ══════════════════════════════════════════════════════════════
 * VidyaOS V2 — FACULTY COHORTS & TEACHING GROUPS CONTROLLER
 * frontend-v2/faculty/groups/groups.js
 * ══════════════════════════════════════════════════════════════
 */

guardRoute({ requireRoles: ['TEACHER', 'HOD', 'ADMIN'] });

const state = {
  currentUser: null,
  groups: [],
  currentFilter: 'ACTIVE',
  searchQuery: '',
  teacherStudentsList: []
};

var escapeHtml = window.escapeHtml || (typeof esc !== 'undefined' ? esc : (s => {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}));

window.openModal = function(id) {
  const m = document.getElementById(id);
  if (m) m.style.display = 'flex';
};

window.closeModal = function(id) {
  const m = document.getElementById(id);
  if (m) m.style.display = 'none';
};

document.addEventListener('DOMContentLoaded', async () => {
  state.currentUser = getCurrentUser();
  await loadTeachingGroups();
  populateNoticeDropdown();

  // Close card menus on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.gc-dropdown-menu') && !e.target.closest('.gc-card-menu-btn')) {
      document.querySelectorAll('.gc-dropdown-menu').forEach(m => m.style.display = 'none');
    }
  });
});

async function loadTeachingGroups() {
  const container = document.getElementById('groups-container');
  try {
    const res = await fetchApi('/teaching-groups?status=ALL');
    if (res && res.success && Array.isArray(res.data)) {
      state.groups = res.data;
    } else {
      const activeRes = await fetchApi('/teaching-groups');
      state.groups = (activeRes && activeRes.success && Array.isArray(activeRes.data)) ? activeRes.data : [];
    }

    updateCounts();
    renderGroups();
  } catch (err) {
    console.error('Failed to load teaching groups', err);
    if (container) {
      container.innerHTML = `
        <div style="text-align:center; padding:3rem; color:var(--status-absent); grid-column:1 / -1;">
          Failed to load cohorts: ${escapeHtml(err.message)}
        </div>
      `;
    }
  }
}

function updateCounts() {
  const activeCount = state.groups.filter(g => g.status === 'ACTIVE' || !g.status).length;
  const archivedCount = state.groups.filter(g => g.status === 'ARCHIVED').length;
  const trashCount = state.groups.filter(g => g.status === 'TRASH').length;

  const activeEl = document.getElementById('count-active');
  const archivedEl = document.getElementById('count-archived');
  const trashEl = document.getElementById('count-trash');
  const badgeClasses = document.getElementById('count-classes-badge');

  if (activeEl) activeEl.innerText = activeCount;
  if (archivedEl) archivedEl.innerText = archivedCount;
  if (trashEl) trashEl.innerText = trashCount;
  if (badgeClasses) badgeClasses.innerText = activeCount;
}

function setGroupFilter(status) {
  state.currentFilter = status;
  document.getElementById('filter-active')?.classList.toggle('active', status === 'ACTIVE');
  document.getElementById('filter-archived')?.classList.toggle('active', status === 'ARCHIVED');
  renderGroups();
}

function filterGroupsLocally() {
  state.searchQuery = (document.getElementById('search-groups')?.value || '').trim().toLowerCase();
  renderGroups();
}

function renderGroups() {
  const container = document.getElementById('groups-container');
  if (!container) return;

  let filtered = state.groups.filter(g => {
    const s = g.status || 'ACTIVE';
    return s === state.currentFilter;
  });

  if (state.searchQuery) {
    filtered = filtered.filter(g => {
      const name = (g.name || '').toLowerCase();
      const sub = (g.subject_name || '').toLowerCase();
      const code = (g.subject_code || '').toLowerCase();
      const sec = (g.section || '').toLowerCase();
      return name.includes(state.searchQuery) || sub.includes(state.searchQuery) || code.includes(state.searchQuery) || sec.includes(state.searchQuery);
    });
  }

  if (filtered.length === 0) {
    const isSearch = Boolean(state.searchQuery);
    container.innerHTML = `
      <div style="text-align:center; padding:4rem 1.5rem; color:var(--text-muted); background:var(--bg-card); border-radius:var(--radius-lg); border:1px solid var(--border-color); grid-column:1 / -1;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text-muted); margin-bottom:0.75rem;"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
        <div style="font-weight:800; font-size:1.2rem; color:var(--text-main);">
          ${isSearch ? 'No matching cohorts found' : (state.currentFilter === 'ACTIVE' ? 'No active cohorts yet' : 'No archived cohorts')}
        </div>
        <div style="font-size:0.88rem; margin:0.35rem 0 1.25rem;">
          ${isSearch ? 'Try adjusting your search query' : 'Create your first teaching group to take attendance and manage coursework.'}
        </div>
        ${!isSearch && state.currentFilter === 'ACTIVE' ? `
          <button type="button" class="btn btn-primary" onclick="openModal('create-group-modal')">
            + Create Your First Class
          </button>
        ` : ''}
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map((g, idx) => {
    const paletteClass = `palette-${(idx % 5) + 1}`;
    const name = g.subject_name || g.name || 'Subject Class';
    const code = g.subject_code || 'CODE';
    const semText = g.semester ? `Sem ${g.semester}` : 'Term';
    const secText = g.section ? `Sec ${g.section}` : '';
    const studentCount = g.student_count ?? g.enrolled_count ?? 0;
    const isArchived = g.status === 'ARCHIVED';

    const teacherInitials = (state.currentUser?.full_name || 'T')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(p => p[0].toUpperCase())
      .join('') || 'T';

    return `
      <div class="gc-class-card" id="group-card-${g.id}">
        <!-- Header Banner -->
        <div class="gc-card-header ${paletteClass}">
          <div class="gc-card-title-wrap">
            <div>
              <a href="/faculty/group-detail.html?id=${g.id}" class="gc-card-name" title="${escapeHtml(name)}">
                ${escapeHtml(name)}
              </a>
              <div class="gc-card-sub">
                <span>${escapeHtml(code)}</span>
                ${secText ? `<span>• ${escapeHtml(secText)}</span>` : ''}
              </div>
            </div>
            <button type="button" class="gc-card-menu-btn" onclick="toggleCardMenu(${g.id}, event)" title="Cohort options" aria-label="Cohort options">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
            </button>
          </div>
          <div class="gc-card-avatar" title="${escapeHtml(state.currentUser?.full_name || 'Teacher')}">${teacherInitials}</div>
        </div>

        <!-- Dropdown Menu -->
        <div class="gc-dropdown-menu" id="card-menu-${g.id}" style="display:none;">
          <button type="button" class="gc-dropdown-item" onclick="openEditGroupModal(${g.id})">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            <span>Edit Details</span>
          </button>
          <a href="/faculty/registers.html?id=${g.id}" class="gc-dropdown-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
            <span>Attendance Ledger</span>
          </a>
          <a href="/faculty/group-detail.html?id=${g.id}" class="gc-dropdown-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M3 10h18M5 10v11M9 10v11M15 10v11M19 10v11M12 3l9 7H3l9-7z"></path></svg>
            <span>Classroom Studio</span>
          </a>
          ${isArchived ? `
            <button type="button" class="gc-dropdown-item" onclick="toggleArchiveGroup(${g.id}, false)">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"></polyline><polyline points="23 20 23 14 17 14"></polyline><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path></svg>
              <span>Restore Class</span>
            </button>
          ` : `
            <button type="button" class="gc-dropdown-item" onclick="toggleArchiveGroup(${g.id}, true)">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>
              <span>Archive Class</span>
            </button>
          `}
          <button type="button" class="gc-dropdown-item danger" onclick="trashGroup(${g.id})">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            <span>Move to Trash</span>
          </button>
        </div>

        <!-- Card Body -->
        <div class="gc-card-body">
          <div class="gc-card-stats">
            <div class="gc-stat-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              <span><strong>${studentCount}</strong> students</span>
            </div>
            <div class="gc-stat-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span>${semText}</span>
            </div>
          </div>

          <div class="gc-card-meta-chips">
            <span class="gc-chip highlight">${escapeHtml(code)}</span>
            <span class="gc-chip">${escapeHtml(semText)}</span>
            ${secText ? `<span class="gc-chip">${escapeHtml(secText)}</span>` : ''}
          </div>
        </div>

        <!-- Footer -->
        <div class="gc-card-footer">
          <a href="/faculty/registers.html?id=${g.id}" class="gc-card-action-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            <span>Registers &rarr;</span>
          </a>
          <a href="/faculty/group-detail.html?id=${g.id}" class="gc-card-action-btn" style="color:var(--text-main);">
            <span>Classroom &rarr;</span>
          </a>
        </div>
      </div>
    `;
  }).join('');
}

function toggleCardMenu(id, e) {
  e.stopPropagation();
  const menu = document.getElementById(`card-menu-${id}`);
  if (!menu) return;
  const isShown = menu.style.display === 'flex';
  document.querySelectorAll('.gc-dropdown-menu').forEach(m => m.style.display = 'none');
  if (!isShown) menu.style.display = 'flex';
}

function updateDerivedYear() {
  // Hook for semester selection helper
}

async function submitCreateGroup(e) {
  e.preventDefault();
  const subName = document.getElementById('group-subject')?.value?.trim();
  const subCode = document.getElementById('group-subject-code')?.value?.trim();
  const sem = document.getElementById('group-semester')?.value;
  const sec = document.getElementById('group-section')?.value?.trim();

  if (!subName || !subCode) {
    if (typeof showToast === 'function') showToast('Please enter subject name and code.', 'warning');
    return;
  }

  const btn = document.getElementById('btn-submit-create-group');
  if (btn) btn.disabled = true;

  try {
    const res = await fetchApi('/teaching-groups', {
      method: 'POST',
      body: JSON.stringify({
        subject_name: subName,
        subject_code: subCode,
        name: subName,
        semester: Number(sem) || 1,
        section: sec || 'A'
      })
    });

    if (res && res.success) {
      if (typeof showToast === 'function') showToast('Cohort created successfully!', 'success');
      closeModal('create-group-modal');
      document.getElementById('create-group-form')?.reset();
      await loadTeachingGroups();
    } else {
      if (typeof showToast === 'function') showToast(res?.error?.message || 'Could not create cohort', 'error');
    }
  } catch (err) {
    if (typeof showToast === 'function') showToast(err.message, 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

function openEditGroupModal(id) {
  const g = state.groups.find(x => x.id === id);
  if (!g) return;
  document.getElementById('edit-group-id').value = g.id;
  document.getElementById('edit-group-subject').value = g.subject_name || g.name || '';
  document.getElementById('edit-group-code').value = g.subject_code || '';
  document.getElementById('edit-group-semester').value = g.semester || '1';
  document.getElementById('edit-group-section').value = g.section || '';
  openModal('modal-edit-group');
}

async function submitEditGroup(e) {
  e.preventDefault();
  const id = document.getElementById('edit-group-id')?.value;
  const subName = document.getElementById('edit-group-subject')?.value?.trim();
  const subCode = document.getElementById('edit-group-code')?.value?.trim();
  const sem = document.getElementById('edit-group-semester')?.value;
  const sec = document.getElementById('edit-group-section')?.value?.trim();

  try {
    const res = await fetchApi(`/teaching-groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        subject_name: subName,
        subject_code: subCode,
        semester: Number(sem),
        section: sec
      })
    });

    if (res && res.success) {
      if (typeof showToast === 'function') showToast('Cohort details updated!', 'success');
      closeModal('modal-edit-group');
      await loadTeachingGroups();
    } else {
      if (typeof showToast === 'function') showToast(res?.error?.message || 'Update failed', 'error');
    }
  } catch (err) {
    if (typeof showToast === 'function') showToast(err.message, 'error');
  }
}

async function toggleArchiveGroup(id, archive) {
  try {
    const res = await fetchApi(`/teaching-groups/${id}/${archive ? 'archive' : 'unarchive'}`, {
      method: 'POST'
    });
    if (res && res.success) {
      if (typeof showToast === 'function') showToast(archive ? 'Cohort archived' : 'Cohort restored', 'success');
      await loadTeachingGroups();
    } else {
      if (typeof showToast === 'function') showToast(res?.error?.message || 'Action failed', 'error');
    }
  } catch (err) {
    if (typeof showToast === 'function') showToast(err.message, 'error');
  }
}

async function trashGroup(id) {
  if (!confirm('Move this cohort to trash? You can restore it later.')) return;
  try {
    const res = await fetchApi(`/teaching-groups/${id}`, { method: 'DELETE' });
    if (res && res.success) {
      if (typeof showToast === 'function') showToast('Cohort moved to trash', 'success');
      await loadTeachingGroups();
    } else {
      if (typeof showToast === 'function') showToast(res?.error?.message || 'Failed to trash cohort', 'error');
    }
  } catch (err) {
    if (typeof showToast === 'function') showToast(err.message, 'error');
  }
}

async function triggerAutoArchiveCheck() {
  if (typeof showToast === 'function') showToast('Checking for completed academic sessions...', 'info');
  try {
    const res = await fetchApi('/teaching-groups/auto-archive', { method: 'POST' });
    if (res && res.success) {
      if (typeof showToast === 'function') showToast(res.message || 'Auto-archive scan completed', 'success');
      await loadTeachingGroups();
    }
  } catch (err) {
    if (typeof showToast === 'function') showToast('No expired classes to archive.', 'info');
  }
}

/* ── Teacher Students Roster Modal ── */
window.openTeacherStudentsModal = async function() {
  openModal('modal-teacher-students');
  const wrap = document.getElementById('teacher-students-table-wrap');
  if (wrap) wrap.innerHTML = '<div style="text-align:center; padding:2rem; color:var(--text-muted);">Loading students directory...</div>';
  try {
    const res = await fetchApi('/faculty/my-students');
    if (res && res.success && Array.isArray(res.data)) {
      state.teacherStudentsList = res.data;
      renderTeacherStudentsTable(state.teacherStudentsList);
    } else {
      if (wrap) wrap.innerHTML = '<div style="text-align:center; padding:2rem; color:var(--text-muted);">No enrolled students found.</div>';
    }
  } catch (err) {
    if (wrap) wrap.innerHTML = `<div style="text-align:center; padding:2rem; color:var(--status-absent);">${escapeHtml(err.message)}</div>`;
  }
};

function renderTeacherStudentsTable(list) {
  const wrap = document.getElementById('teacher-students-table-wrap');
  if (!wrap) return;
  if (!list.length) {
    wrap.innerHTML = '<div style="text-align:center; padding:2rem; color:var(--text-muted);">No students match your query.</div>';
    return;
  }
  wrap.innerHTML = `
    <table class="one-click-table">
      <thead>
        <tr>
          <th>Roll No.</th>
          <th>Student Name</th>
          <th>Enrolled Class(es)</th>
          <th>Attended / Total</th>
          <th>Attendance %</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${list.map(st => {
          const classes = Array.isArray(st.enrolled_classes) && st.enrolled_classes.length
            ? st.enrolled_classes.map(c => `<span class="badge badge-sem" style="font-size:0.68rem; margin:1px;">${escapeHtml(c)}</span>`).join(' ')
            : '<span style="color:var(--text-muted); font-size:0.75rem;">None</span>';
          const isDefaulter = Boolean(st.below_threshold || st.is_defaulter || (st.attendance_pct != null && st.attendance_pct < 75));
          const statusBadge = isDefaulter
            ? '<span class="badge badge-absent" style="font-size:0.7rem; font-weight:700;">Below 75%</span>'
            : '<span class="badge badge-present" style="font-size:0.7rem; font-weight:700;">Regular</span>';
          return `
            <tr>
              <td style="font-weight:700; font-family:var(--font-family-mono); color:var(--color-primary);">${escapeHtml(st.roll_number || st.class_roll_no || '--')}</td>
              <td style="font-weight:600; color:var(--text-main);">${escapeHtml(st.full_name || st.name)}</td>
              <td>${classes}</td>
              <td style="font-family:var(--font-family-mono); font-weight:600;">${st.attended_sessions ?? 0} / ${st.total_sessions ?? 0}</td>
              <td>
                <span style="font-weight:700; color:${isDefaulter ? 'var(--status-absent)' : 'var(--status-present)'};">
                  ${st.attendance_pct ?? 0}%
                </span>
              </td>
              <td>${statusBadge}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

window.filterTeacherStudentsList = function() {
  const q = (document.getElementById('search-teacher-students')?.value || '').toLowerCase().trim();
  if (!q) {
    renderTeacherStudentsTable(state.teacherStudentsList);
    return;
  }
  const filtered = state.teacherStudentsList.filter(st => {
    const roll = String(st.roll_number || st.class_roll_no || '').toLowerCase();
    const name = (st.full_name || st.name || '').toLowerCase();
    return roll.includes(q) || name.includes(q);
  });
  renderTeacherStudentsTable(filtered);
};

/* ── Broadcast Announcement ── */
window.openBroadcastNoticeModal = function() {
  openModal('broadcast-notice-modal');
};

function populateNoticeDropdown() {
  const sel = document.getElementById('notice-target');
  if (!sel) return;
  const active = state.groups.filter(g => g.status === 'ACTIVE' || !g.status);
  let html = '<option value="ALL">All My Active Classes</option>';
  active.forEach(g => {
    html += `<option value="${g.id}">${escapeHtml(g.subject_name || g.name)} (${escapeHtml(g.subject_code || '')})</option>`;
  });
  sel.innerHTML = html;
}

window.submitBroadcastNotice = async function(e) {
  e.preventDefault();
  const targetVal = document.getElementById('notice-target')?.value;
  const text = document.getElementById('notice-content')?.value?.trim();

  if (!text) return;
  try {
    const res = await fetchApi('/teaching-groups/broadcast-notice', {
      method: 'POST',
      body: JSON.stringify({
        target_group_id: targetVal,
        content: text
      })
    });

    if (res && res.success) {
      if (typeof showToast === 'function') showToast('Announcement broadcasted to enrolled students!', 'success');
      closeModal('broadcast-notice-modal');
      document.getElementById('broadcast-form')?.reset();
    } else {
      if (typeof showToast === 'function') showToast(res?.error?.message || 'Could not send announcement', 'error');
    }
  } catch (err) {
    if (typeof showToast === 'function') showToast(err.message, 'error');
  }
};

/* ── Trash Bin ── */
window.openTrashBinModal = async function() {
  openModal('modal-trash-bin');
  const content = document.getElementById('trash-bin-content');
  if (content) content.innerHTML = '<div style="text-align:center; padding:2rem; color:var(--text-muted);">Loading trash...</div>';

  try {
    const res = await fetchApi('/teaching-groups?status=TRASH');
    const trash = (res && res.success && Array.isArray(res.data)) ? res.data : [];

    if (!trash.length) {
      content.innerHTML = '<div style="text-align:center; padding:2.5rem; color:var(--text-muted);">Trash bin is empty.</div>';
      return;
    }

    content.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:0.75rem;">
        ${trash.map(t => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:0.75rem 1rem; border:1px solid var(--border-color); border-radius:var(--radius-md); background:var(--bg-surface);">
            <div>
              <strong style="color:var(--text-main); font-size:0.92rem;">${escapeHtml(t.subject_name || t.name)}</strong>
              <div style="font-size:0.78rem; color:var(--text-muted);">${escapeHtml(t.subject_code || '')} • Sem ${t.semester || 1}</div>
            </div>
            <div style="display:flex; gap:0.5rem;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="restoreFromTrash(${t.id})">Restore</button>
              <button type="button" class="btn btn-sm" style="background:var(--status-absent-bg); color:var(--status-absent); border:1px solid var(--status-absent);" onclick="permanentDelete(${t.id})">Delete Permanently</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) {
    content.innerHTML = `<div style="text-align:center; padding:2rem; color:var(--status-absent);">${escapeHtml(err.message)}</div>`;
  }
};

window.restoreFromTrash = async function(id) {
  try {
    const res = await fetchApi(`/teaching-groups/${id}/restore`, { method: 'POST' });
    if (res && res.success) {
      if (typeof showToast === 'function') showToast('Class restored from trash', 'success');
      await openTrashBinModal();
      await loadTeachingGroups();
    }
  } catch (err) {
    if (typeof showToast === 'function') showToast(err.message, 'error');
  }
};

window.permanentDelete = async function(id) {
  if (!confirm('Permanently delete this class? This cannot be undone.')) return;
  try {
    const res = await fetchApi(`/teaching-groups/${id}/permanent`, { method: 'DELETE' });
    if (res && res.success) {
      if (typeof showToast === 'function') showToast('Class permanently removed', 'success');
      await openTrashBinModal();
      await loadTeachingGroups();
    }
  } catch (err) {
    if (typeof showToast === 'function') showToast(err.message, 'error');
  }
};
