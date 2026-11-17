/**
 * VidyaOS Student Academic Records & Dossiers Controller
 * Replaces Unified Register with a clean, decoupled student records archive.
 * Features:
 * - Filter by Session, Year, Semester, Dynamic Batch, and Search
 * - View full student academic dossier (Demographics, Tests, Attendance, Documents)
 * - Dynamic Semester filtering via checkboxes
 * - Multi-Format Export Engine (Single Student & Full Cohort: Excel, PDF, Word DOC)
 * - Passout and Active cohort handling
 */

(function () {
  'use strict';

  // Global State
  const state = {
    filters: {
      session_id: '',
      year: '',
      semester: '',
      batch: '',
      status: 'active',
      search: ''
    },
    filterOptions: {
      sessions: [],
      years: [1, 2, 3],
      semesters: [1, 2, 3, 4, 5, 6],
      batches: []
    },
    students: [],
    activeDossier: null,
    selectedDossierSemesters: [1, 2, 3, 4, 5, 6],
    activeDossierTab: 'tests',
    searchDebounce: null
  };

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;
    toast.innerHTML = `<span>${escapeHtml(msg)}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('toast-fade');
      setTimeout(() => toast.remove(), 400);
    }, 3200);
  }

  // 1. Load Filter Options
  async function loadFilterOptions() {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const res = await fetch('/api/v1/student-records/filters', {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      const json = await res.json();
      if (json.success && json.data) {
        state.filterOptions = json.data;
        renderFilterDropdowns();
      }
    } catch (err) {
      console.warn('Failed to load filter options:', err);
    }
  }

  function renderFilterDropdowns() {
    const sessionSelect = document.getElementById('filter-session');
    const batchSelect = document.getElementById('filter-batch');
    const cohortSessionSelect = document.getElementById('export-cohort-session');
    const cohortBatchSelect = document.getElementById('export-cohort-batch');

    // Populate Sessions
    if (sessionSelect && state.filterOptions.sessions) {
      sessionSelect.innerHTML = '<option value="">All Sessions</option>' +
        state.filterOptions.sessions.map(s => 
          `<option value="${s.id}" ${s.is_current ? 'selected' : ''}>${escapeHtml(s.name || s.label)}</option>`
        ).join('');
      const current = state.filterOptions.sessions.find(s => s.is_current);
      if (current) state.filters.session_id = current.id;
    }

    if (cohortSessionSelect && state.filterOptions.sessions) {
      cohortSessionSelect.innerHTML = '<option value="">All Sessions</option>' +
        state.filterOptions.sessions.map(s => 
          `<option value="${s.id}" ${s.is_current ? 'selected' : ''}>${escapeHtml(s.name || s.label)}</option>`
        ).join('');
    }

    // Populate Batches
    if (batchSelect && state.filterOptions.batches) {
      batchSelect.innerHTML = '<option value="">All Batches</option>' +
        state.filterOptions.batches.map(b => 
          `<option value="${b.passing_year}">${escapeHtml(b.label)}</option>`
        ).join('');
    }

    if (cohortBatchSelect && state.filterOptions.batches) {
      cohortBatchSelect.innerHTML = '<option value="">All Batches</option>' +
        state.filterOptions.batches.map(b => 
          `<option value="${b.passing_year}">${escapeHtml(b.label)}</option>`
        ).join('');
    }
  }

  // 2. Load Student Records
  async function loadStudentRecords() {
    const tbody = document.getElementById('rec-table-body');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="rec-loading-cell">
            <div class="rec-spinner"></div>
            <span>Fetching academic records...</span>
          </td>
        </tr>
      `;
    }

    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const params = new URLSearchParams();
      if (state.filters.session_id) params.set('academic_year_id', state.filters.session_id);
      if (state.filters.year) params.set('year', state.filters.year);
      if (state.filters.semester) params.set('semester', state.filters.semester);
      if (state.filters.batch) params.set('batch', state.filters.batch);
      if (state.filters.status) params.set('status', state.filters.status);
      if (state.filters.search) params.set('search', state.filters.search);

      const res = await fetch(`/api/v1/student-records?${params.toString()}`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      const json = await res.json();

      if (json.success && json.data) {
        state.students = json.data;
        renderStudentRecords(json.data);
      } else {
        renderStudentRecords([]);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
      renderStudentRecords([]);
    }
  }

  function renderStudentRecords(students) {
    const tbody = document.getElementById('rec-table-body');
    const countEl = document.getElementById('rec-records-count');
    const cohortTag = document.getElementById('rec-active-cohort-tag');

    if (countEl) {
      countEl.textContent = `Showing ${students.length} student${students.length === 1 ? '' : 's'}`;
    }

    if (cohortTag) {
      let desc = 'All Cohorts';
      if (state.filters.semester) desc = `Semester ${state.filters.semester}`;
      else if (state.filters.year) desc = `Year ${state.filters.year}`;
      if (state.filters.batch) desc += ` • Batch ${state.filters.batch}`;
      cohortTag.textContent = desc;
    }

    if (!tbody) return;

    if (!students || students.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="rec-empty-cell">
            No student records found matching the active filters.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = students.map((s, idx) => {
      const roll = s.class_roll_no || idx + 1;
      const enroll = s.official_enrollment_no || '--';
      const name = s.full_name || 'Unnamed Student';
      const reg = s.registration_no ? `Reg: ${s.registration_no}` : '';
      const cohort = s.current_semester ? `Y${s.current_year || Math.ceil(s.current_semester/2)} • Sem ${s.current_semester}` : '--';
      const batch = s.batch_label || (s.admission_year ? `Batch ${s.admission_year}` : '--');
      const attPct = typeof s.attendance_percentage === 'number' ? s.attendance_percentage : 100;

      let badgeClass = '';
      if (attPct < 75) badgeClass = 'low';
      else if (attPct < 80) badgeClass = 'warning';

      return `
        <tr id="student-row-${s.id}">
          <td class="rec-roll-cell">${escapeHtml(String(roll))}</td>
          <td class="col-enrollment rec-enroll-cell">${escapeHtml(enroll)}</td>
          <td>
            <div class="rec-name-cell">
              <span class="rec-student-name">${escapeHtml(name)}</span>
              ${reg ? `<span class="rec-student-reg">${escapeHtml(reg)}</span>` : ''}
            </div>
          </td>
          <td class="col-cohort">${cohort}</td>
          <td class="col-batch">${escapeHtml(batch)}</td>
          <td>
            <span class="rec-att-badge ${badgeClass}">${attPct}%</span>
          </td>
          <td class="rec-action-cell">
            <button type="button" class="rec-kebab-btn" onclick="toggleRecordKebab(event, ${s.id})" title="Actions" aria-label="Actions">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="2"></circle>
                <circle cx="12" cy="12" r="2"></circle>
                <circle cx="12" cy="19" r="2"></circle>
              </svg>
            </button>
            <div class="rec-dropdown-menu" id="rec-dropdown-${s.id}">
              <button type="button" class="rec-dropdown-item" onclick="openStudentDossier(${s.id})">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <span>View Academic Dossier</span>
              </button>
              <button type="button" class="rec-dropdown-item" onclick="quickExportStudentProfile(${s.id}, 'pdf')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>Export Personal Details (Bio-Data)</span>
              </button>
              <button type="button" class="rec-dropdown-item" onclick="quickExportStudent(${s.id}, 'excel')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <span>Export Dossier (.xlsx)</span>
              </button>
              <button type="button" class="rec-dropdown-item" onclick="quickExportStudent(${s.id}, 'doc')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
                <span>Export Dossier (.doc)</span>
              </button>
              <button type="button" class="rec-dropdown-item" onclick="quickExportStudent(${s.id}, 'pdf')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 6 2 18 2 18 9"></polyline>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                  <rect x="6" y="14" width="12" height="8"></rect>
                </svg>
                <span>Export / Print Dossier (PDF)</span>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // 3. Dropdown Menu Toggle with Dynamic Flip-up
  window.toggleRecordKebab = function (e, id) {
    e.stopPropagation();
    const allDropdowns = document.querySelectorAll('.rec-dropdown-menu');
    const target = document.getElementById(`rec-dropdown-${id}`);

    allDropdowns.forEach(d => {
      if (d !== target) d.classList.remove('show', 'flip-up');
    });

    if (target) {
      const isVisible = target.classList.contains('show');
      if (!isVisible) {
        const btnRect = e.currentTarget.getBoundingClientRect();
        const spaceBelow = window.innerHeight - btnRect.bottom;
        if (spaceBelow < 180) {
          target.classList.add('flip-up');
        } else {
          target.classList.remove('flip-up');
        }
        target.classList.add('show');
      } else {
        target.classList.remove('show', 'flip-up');
      }
    }
  };

  document.addEventListener('click', () => {
    document.querySelectorAll('.rec-dropdown-menu').forEach(d => d.classList.remove('show', 'flip-up'));
  });

  // 4. Filter Handlers
  window.onFilterChange = function () {
    const session = document.getElementById('filter-session')?.value || '';
    const sem = document.getElementById('filter-semester')?.value || '';
    const batch = document.getElementById('filter-batch')?.value || '';
    const status = document.getElementById('filter-status')?.value || 'active';

    state.filters.session_id = session;
    state.filters.semester = sem;
    state.filters.batch = batch;
    state.filters.status = status;

    loadStudentRecords();
  };

  window.onYearFilterChange = function () {
    const yr = document.getElementById('filter-year')?.value || '';
    state.filters.year = yr;

    // Dynamically adjust semester dropdown based on selected year
    const semSelect = document.getElementById('filter-semester');
    if (semSelect) {
      if (yr === '1') {
        semSelect.innerHTML = '<option value="">All Semesters (Year 1)</option><option value="1">Sem 1</option><option value="2">Sem 2</option>';
      } else if (yr === '2') {
        semSelect.innerHTML = '<option value="">All Semesters (Year 2)</option><option value="3">Sem 3</option><option value="4">Sem 4</option>';
      } else if (yr === '3') {
        semSelect.innerHTML = '<option value="">All Semesters (Year 3)</option><option value="5">Sem 5</option><option value="6">Sem 6</option>';
      } else {
        semSelect.innerHTML = `
          <option value="">All Semesters</option>
          <option value="1">Sem 1</option><option value="2">Sem 2</option>
          <option value="3">Sem 3</option><option value="4">Sem 4</option>
          <option value="5">Sem 5</option><option value="6">Sem 6</option>
        `;
      }
      semSelect.value = '';
      state.filters.semester = '';
    }

    loadStudentRecords();
  };

  window.onSearchInput = function (val) {
    clearTimeout(state.searchDebounce);
    state.searchDebounce = setTimeout(() => {
      state.filters.search = (val || '').trim();
      loadStudentRecords();
    }, 280);
  };

  window.resetFilters = function () {
    const sessionSelect = document.getElementById('filter-session');
    const yearSelect = document.getElementById('filter-year');
    const semSelect = document.getElementById('filter-semester');
    const batchSelect = document.getElementById('filter-batch');
    const statusSelect = document.getElementById('filter-status');
    const searchInput = document.getElementById('rec-search-input');

    if (sessionSelect) {
      const current = state.filterOptions.sessions?.find(s => s.is_current);
      sessionSelect.value = current ? current.id : '';
    }
    if (yearSelect) yearSelect.value = '';
    if (semSelect) semSelect.value = '';
    if (batchSelect) batchSelect.value = '';
    if (statusSelect) statusSelect.value = 'active';
    if (searchInput) searchInput.value = '';

    state.filters = {
      session_id: sessionSelect?.value || '',
      year: '',
      semester: '',
      batch: '',
      status: 'active',
      search: ''
    };

    loadStudentRecords();
  };

  // 5. Single Student Dossier Modal
  window.openStudentDossier = async function (studentId) {
    const modal = document.getElementById('modal-student-dossier');
    if (modal) modal.style.display = 'flex';

    state.selectedDossierSemesters = [1, 2, 3, 4, 5, 6];
    document.querySelectorAll('.check-sem-item').forEach(c => c.checked = true);
    const allCheck = document.getElementById('check-sem-all');
    if (allCheck) allCheck.checked = true;

    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const res = await fetch(`/api/v1/student-records/${studentId}/dossier`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      const json = await res.json();

      if (json.success && json.data) {
        state.activeDossier = json.data;
        populateDossierModal(json.data);
      } else {
        showToast('Could not load student dossier', 'error');
        closeDossierModal();
      }
    } catch (err) {
      console.error(err);
      showToast('Network error loading dossier', 'error');
      closeDossierModal();
    }
  };

  // Assessment classifier helper
  function isAssignmentAssessment(t) {
    const type = String(t.type || '').toUpperCase();
    return type.includes('ASSIGN') || type.includes('HOMEWORK') || type.includes('PROJECT') || type.includes('LAB');
  }

  function populateDossierModal(dossier) {
    const p = dossier.profile || {};

    // Header info (Clean Unicode bullets)
    const nameEl = document.getElementById('dossier-modal-name');
    const subEl = document.getElementById('dossier-modal-sub');
    if (nameEl) nameEl.textContent = `${p.full_name || 'Student Profile'} - Academic Dossier`;
    if (subEl) subEl.textContent = `Roll #${p.class_roll_no || '--'} • Enrollment: ${p.official_enrollment_no || '--'} • Batch: ${p.batch_label || ''}`;

    // Demographic profile cards
    const setText = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val || '--';
    };

    setText('dossier-full-name', p.full_name);
    setText('dossier-roll-no', p.class_roll_no);
    setText('dossier-enrollment-no', p.official_enrollment_no);
    setText('dossier-reg-no', p.registration_no);
    setText('dossier-father-name', p.father_name);
    setText('dossier-mother-name', p.mother_name);
    setText('dossier-aadhar', p.aadhar_number ? `•••• •••• ${p.aadhar_number.slice(-4)}` : '--');
    setText('dossier-dob', p.dob ? new Date(p.dob).toLocaleDateString() : '--');
    setText('dossier-gender-cat', `${p.gender || '--'} / ${p.category || 'General'}`);
    setText('dossier-email', p.email);
    setText('dossier-phone', p.phone);
    setText('dossier-address', p.address);

    // Badges count (Tests vs Assignments vs Attendance vs Docs)
    const allAssessments = dossier.assessments || [];
    const testsCount = document.getElementById('dossier-tests-count');
    const assignCount = document.getElementById('dossier-assignments-count');
    const attCount = document.getElementById('dossier-att-count');
    const docsCount = document.getElementById('dossier-docs-count');

    if (testsCount) testsCount.textContent = allAssessments.filter(a => !isAssignmentAssessment(a)).length;
    if (assignCount) assignCount.textContent = allAssessments.filter(a => isAssignmentAssessment(a)).length;
    if (attCount) attCount.textContent = (dossier.attendance || []).length;
    if (docsCount) docsCount.textContent = (dossier.documents || []).length;

    renderFilteredDossierTables();
  }

  function renderFilteredDossierTables() {
    if (!state.activeDossier) return;

    const selectedSems = state.selectedDossierSemesters || [1, 2, 3, 4, 5, 6];
    const allAssessments = state.activeDossier.assessments || [];

    // 1. Tests & Exams
    const testsBody = document.getElementById('dossier-tests-body');
    if (testsBody) {
      const tests = allAssessments.filter(a => !isAssignmentAssessment(a) && selectedSems.includes(Number(a.semester)));
      if (tests.length === 0) {
        testsBody.innerHTML = `<tr><td colspan="7" class="rec-empty-cell">No test or exam records found for selected semesters.</td></tr>`;
      } else {
        testsBody.innerHTML = tests.map(t => {
          const scored = t.marks_obtained !== null && t.marks_obtained !== undefined ? t.marks_obtained : 0;
          const max = t.max_marks || 100;
          const pct = Math.round((Number(scored) / max) * 100);
          return `
            <tr>
              <td><strong>Sem ${t.semester || '--'}</strong></td>
              <td>${escapeHtml(t.subject_name || t.subject_code || '--')}</td>
              <td>${escapeHtml(t.title || '--')}</td>
              <td><span class="rec-meta-badge">${escapeHtml(t.type || 'TEST')}</span></td>
              <td>${max}</td>
              <td><strong>${scored}</strong></td>
              <td><span class="rec-att-badge ${pct < 40 ? 'low' : ''}">${pct}%</span></td>
            </tr>
          `;
        }).join('');
      }
    }

    // 2. Coursework & Assignments
    const assignBody = document.getElementById('dossier-assignments-body');
    if (assignBody) {
      const assignments = allAssessments.filter(a => isAssignmentAssessment(a) && selectedSems.includes(Number(a.semester)));
      if (assignments.length === 0) {
        assignBody.innerHTML = `<tr><td colspan="8" class="rec-empty-cell">No assignment records found for selected semesters.</td></tr>`;
      } else {
        assignBody.innerHTML = assignments.map(a => {
          const scored = a.marks_obtained !== null && a.marks_obtained !== undefined ? a.marks_obtained : '--';
          const max = a.max_marks || 100;
          const status = a.submission_status || (scored !== '--' ? 'EVALUATED' : 'SUBMITTED');
          const dateStr = a.submitted_at ? new Date(a.submitted_at).toLocaleDateString() : '--';
          return `
            <tr>
              <td><strong>Sem ${a.semester || '--'}</strong></td>
              <td>${escapeHtml(a.subject_name || a.subject_code || '--')}</td>
              <td>${escapeHtml(a.title || '--')}</td>
              <td><span class="rec-meta-badge">${escapeHtml(a.type || 'ASSIGNMENT')}</span></td>
              <td>${max}</td>
              <td><strong>${scored}</strong></td>
              <td><span class="rec-status-pill ${status.toLowerCase()}">${escapeHtml(status)}</span></td>
              <td>${dateStr}</td>
            </tr>
          `;
        }).join('');
      }
    }

    // 3. Attendance
    const attBody = document.getElementById('dossier-att-body');
    if (attBody) {
      const atts = (state.activeDossier.attendance || []).filter(a => selectedSems.includes(Number(a.semester)));
      if (atts.length === 0) {
        attBody.innerHTML = `<tr><td colspan="7" class="rec-empty-cell">No attendance recorded for selected semesters.</td></tr>`;
      } else {
        attBody.innerHTML = atts.map(a => {
          const tot = Number(a.total_sessions) || 0;
          const pres = Number(a.attended_sessions) || 0;
          const pct = tot > 0 ? Math.round((pres * 100) / tot) : 100;
          return `
            <tr>
              <td><strong>Sem ${a.semester || '--'}</strong></td>
              <td>${escapeHtml(a.subject_name || '--')}</td>
              <td><code>${escapeHtml(a.subject_code || '--')}</code></td>
              <td>${tot}</td>
              <td><strong>${pres}</strong></td>
              <td><span class="rec-att-badge ${pct < 75 ? 'low' : ''}">${pct}%</span></td>
              <td>${pct >= 75 ? '<span style="color:var(--color-success)">Eligible</span>' : '<span style="color:var(--color-danger)">Defaulter</span>'}</td>
            </tr>
          `;
        }).join('');
      }
    }

    // 4. Documents
    const docsBody = document.getElementById('dossier-docs-body');
    if (docsBody) {
      const docs = state.activeDossier.documents || [];
      if (docs.length === 0) {
        docsBody.innerHTML = `<tr><td colspan="6" class="rec-empty-cell">No uploaded official documents found.</td></tr>`;
      } else {
        docsBody.innerHTML = docs.map(d => `
          <tr>
            <td><strong>${escapeHtml(d.title || '--')}</strong></td>
            <td><span class="rec-meta-badge">${escapeHtml(d.document_type || 'DOCUMENT')}</span></td>
            <td>${escapeHtml(d.file_name || '--')}</td>
            <td>${d.file_size ? `${Math.round(d.file_size / 1024)} KB` : '--'}</td>
            <td>${d.created_at ? new Date(d.created_at).toLocaleDateString() : '--'}</td>
            <td>
              <a href="${escapeHtml(d.file_path)}" target="_blank" class="btn-rec-outline" style="text-decoration:none; padding:0.25rem 0.65rem; font-size:0.76rem;">View File</a>
            </td>
          </tr>
        `).join('');
      }
    }
  }

  // Semester Checkbox handlers
  window.toggleSelectAllSemesters = function (checked) {
    document.querySelectorAll('.check-sem-item').forEach(c => c.checked = checked);
    if (checked) {
      state.selectedDossierSemesters = [1, 2, 3, 4, 5, 6];
    } else {
      state.selectedDossierSemesters = [];
    }
    renderFilteredDossierTables();
  };

  window.onSemesterCheckboxToggle = function () {
    const checked = [];
    document.querySelectorAll('.check-sem-item:checked').forEach(c => {
      checked.push(parseInt(c.value, 10));
    });
    state.selectedDossierSemesters = checked;
    const allBox = document.getElementById('check-sem-all');
    if (allBox) allBox.checked = checked.length === 6;
    renderFilteredDossierTables();
  };

  window.switchDossierTab = function (tab) {
    state.activeDossierTab = tab;
    document.querySelectorAll('.rec-dossier-tab').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
    document.querySelectorAll('.rec-tab-content').forEach(c => {
      c.classList.toggle('active', c.id === `dossier-content-${tab}`);
    });
  };

  window.closeDossierModal = function () {
    const modal = document.getElementById('modal-student-dossier');
    if (modal) modal.style.display = 'none';
    state.activeDossier = null;
    const menu = document.getElementById('profile-export-menu');
    if (menu) menu.style.display = 'none';
  };

  // Profile Export Dropdown Menu Toggle
  window.toggleProfileExportMenu = function (e) {
    if (e) e.stopPropagation();
    const menu = document.getElementById('profile-export-menu');
    if (!menu) return;
    const isShown = menu.style.display !== 'none';
    menu.style.display = isShown ? 'none' : 'flex';
  };

  window.addEventListener('click', (e) => {
    const menu = document.getElementById('profile-export-menu');
    if (menu && !e.target.closest('.rec-export-btn-group')) {
      menu.style.display = 'none';
    }
  });

  // Dedicated Student Personal Details (Bio-Data) Export
  window.exportStudentPersonalDetails = async function (format = 'pdf') {
    const p = state.activeDossier?.profile;
    if (!p) {
      showToast('Student personal details not available for export', 'error');
      return;
    }
    const menu = document.getElementById('profile-export-menu');
    if (menu) menu.style.display = 'none';

    if (format === 'excel') await exportPersonalDetailsExcel(p);
    else if (format === 'doc') exportPersonalDetailsDoc(p);
    else exportPersonalDetailsPdf(p);
  };

  window.quickExportStudentProfile = async function (studentId, format = 'pdf') {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const res = await fetch(`/api/v1/student-records/${studentId}/dossier`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      const json = await res.json();
      if (!json.success || !json.data || !json.data.profile) {
        showToast('Could not retrieve student personal details', 'error');
        return;
      }
      const p = json.data.profile;
      if (format === 'excel') await exportPersonalDetailsExcel(p);
      else if (format === 'doc') exportPersonalDetailsDoc(p);
      else exportPersonalDetailsPdf(p);
    } catch (err) {
      console.error(err);
      showToast('Failed to export student personal details', 'error');
    }
  };

  // Dedicated Personal Details Excel Engine
  async function exportPersonalDetailsExcel(p) {
    if (typeof ExcelJS === 'undefined') {
      showToast('Excel engine loading, please try again', 'info');
      return;
    }
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'VidyaOS';
    workbook.created = new Date();

    const ws = workbook.addWorksheet('Student Bio-Data');
    ws.columns = [
      { header: 'Profile Field', key: 'field', width: 28 },
      { header: 'Student Detail / KYC Information', key: 'value', width: 45 }
    ];

    ws.addRows([
      { field: 'Full Student Name', value: p.full_name || '--' },
      { field: 'Class Roll No', value: p.class_roll_no || '--' },
      { field: 'Official Enrollment No', value: p.official_enrollment_no || '--' },
      { field: 'UBTER Registration No', value: p.registration_no || '--' },
      { field: "Father's Name", value: p.father_name || '--' },
      { field: "Mother's Name", value: p.mother_name || '--' },
      { field: 'Date of Birth (DOB)', value: p.dob || '--' },
      { field: 'Gender', value: p.gender || '--' },
      { field: 'Category', value: p.category || 'General' },
      { field: 'Aadhar Number', value: p.aadhar_number || '--' },
      { field: 'Contact Email', value: p.email || '--' },
      { field: 'Contact Phone', value: p.phone || '--' },
      { field: 'Permanent Address', value: p.address || '--' },
      { field: 'Department', value: p.department_name || '--' },
      { field: 'Current Cohort', value: `Semester ${p.current_semester || '--'} (Year ${p.current_year || '--'})` },
      { field: 'Academic Batch', value: p.batch_label || '--' },
      { field: 'Admission Year', value: p.admission_year || '--' },
      { field: 'Passing Year', value: p.passing_year || '--' },
      { field: 'Enrollment Status', value: p.status || 'Active' }
    ]);

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Student_BioData_${p.class_roll_no || p.id}_${(p.full_name || 'student').replace(/\s+/g, '_')}.xlsx`;
    link.click();
    showToast('Student personal details (.xlsx) exported successfully', 'success');
  }

  // Dedicated Personal Details Word Engine
  function exportPersonalDetailsDoc(p) {
    let html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Student Bio-Data</title>
      <style>
        body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #111; margin: 2rem; }
        h1 { color: #1e3a8a; font-size: 18pt; margin-bottom: 0.2rem; }
        h2 { color: #2563eb; font-size: 13pt; margin-top: 1.5rem; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 0.75rem; }
        th, td { border: 1px solid #cbd5e1; padding: 8px 12px; font-size: 10pt; text-align: left; }
        th { background-color: #f1f5f9; font-weight: bold; width: 30%; color: #334155; }
        td { width: 70%; }
        .meta { font-size: 9pt; color: #64748b; margin-top: 0.25rem; }
        .sig-table { margin-top: 3rem; border: none; }
        .sig-table td { border: none; padding-top: 40px; }
      </style>
      </head>
      <body>
        <h1>VidyaOS — Official Student Personal Profile &amp; Bio-Data</h1>
        <p class="meta">Uttarakhand Board of Technical Education • Department of ${escapeHtml(p.department_name || 'Technical Education')} • Generated: ${new Date().toLocaleDateString()}</p>

        <h2>Student KYC &amp; Demographic Profile</h2>
        <table>
          <tr><th>Full Student Name</th><td><b>${escapeHtml(p.full_name || '--')}</b></td></tr>
          <tr><th>Class Roll Number</th><td><b>${escapeHtml(p.class_roll_no || '--')}</b></td></tr>
          <tr><th>Official Enrollment Number</th><td>${escapeHtml(p.official_enrollment_no || '--')}</td></tr>
          <tr><th>UBTER Registration Number</th><td>${escapeHtml(p.registration_no || '--')}</td></tr>
          <tr><th>Father's Name</th><td>${escapeHtml(p.father_name || '--')}</td></tr>
          <tr><th>Mother's Name</th><td>${escapeHtml(p.mother_name || '--')}</td></tr>
          <tr><th>Date of Birth (DOB)</th><td>${p.dob || '--'}</td></tr>
          <tr><th>Gender / Category</th><td>${escapeHtml(p.gender || '--')} / ${escapeHtml(p.category || 'General')}</td></tr>
          <tr><th>Aadhar Number</th><td>${escapeHtml(p.aadhar_number || '--')}</td></tr>
          <tr><th>Contact Phone</th><td>${escapeHtml(p.phone || '--')}</td></tr>
          <tr><th>Contact Email</th><td>${escapeHtml(p.email || '--')}</td></tr>
          <tr><th>Permanent Address</th><td>${escapeHtml(p.address || '--')}</td></tr>
          <tr><th>Department</th><td>${escapeHtml(p.department_name || '--')}</td></tr>
          <tr><th>Current Cohort</th><td>Semester ${p.current_semester || '--'} (Year ${p.current_year || '--'})</td></tr>
          <tr><th>Academic Batch</th><td>${escapeHtml(p.batch_label || '--')}</td></tr>
          <tr><th>Admission Year / Passing Year</th><td>${p.admission_year || '--'} / ${p.passing_year || '--'}</td></tr>
          <tr><th>Enrollment Status</th><td>${escapeHtml(p.status || 'Active')}</td></tr>
        </table>

        <table class="sig-table">
          <tr>
            <td align="center">_______________________<br><b>Student Signature</b></td>
            <td align="center">_______________________<br><b>Class Counselor / Faculty</b></td>
            <td align="center">_______________________<br><b>Head of Department (HOD)</b></td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Student_BioData_${p.class_roll_no || p.id}_${(p.full_name || 'student').replace(/\s+/g, '_')}.doc`;
    link.click();
    showToast('Student personal details (.doc) exported successfully', 'success');
  }

  // Dedicated Personal Details PDF Engine
  function exportPersonalDetailsPdf(p) {
    const printWin = window.open('', '_blank');
    if (!printWin) {
      showToast('Popup blocker prevented PDF print window. Please allow popups.', 'error');
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Student Personal Profile &amp; Bio-Data — ${escapeHtml(p.full_name)}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #111; padding: 2rem; margin: 0; }
          .header { border-bottom: 2px solid #2563eb; padding-bottom: 0.75rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: flex-end; }
          .header h1 { margin: 0; font-size: 1.45rem; color: #1e3a8a; }
          .header p { margin: 0.25rem 0 0; font-size: 0.85rem; color: #64748b; }
          .bio-grid { width: 100%; border-collapse: collapse; margin-bottom: 2rem; font-size: 0.88rem; }
          .bio-grid th, .bio-grid td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
          .bio-grid th { background: #f8fafc; font-weight: 700; color: #334155; width: 30%; }
          .bio-grid td { width: 70%; }
          .sig-row { display: flex; justify-content: space-between; margin-top: 3.5rem; padding: 0 1rem; }
          .sig-box { text-align: center; border-top: 1px solid #94a3b8; padding-top: 0.5rem; font-size: 0.82rem; width: 180px; }
          @media print {
            body { padding: 0.5rem; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>VidyaOS — Official Student Personal Record &amp; Bio-Data</h1>
            <p>Institution: Uttarakhand Board of Technical Education • Department of ${escapeHtml(p.department_name || 'Information Technology')}</p>
          </div>
          <div><p style="font-size:0.8rem; color:#64748b;">Printed: ${new Date().toLocaleDateString()}</p></div>
        </div>

        <table class="bio-grid">
          <tr><th>Full Student Name</th><td><b>${escapeHtml(p.full_name || '--')}</b></td></tr>
          <tr><th>Class Roll Number</th><td><b>${escapeHtml(p.class_roll_no || '--')}</b></td></tr>
          <tr><th>Official Enrollment No</th><td>${escapeHtml(p.official_enrollment_no || '--')}</td></tr>
          <tr><th>UBTER Registration No</th><td>${escapeHtml(p.registration_no || '--')}</td></tr>
          <tr><th>Father's Name</th><td>${escapeHtml(p.father_name || '--')}</td></tr>
          <tr><th>Mother's Name</th><td>${escapeHtml(p.mother_name || '--')}</td></tr>
          <tr><th>Date of Birth (DOB)</th><td>${p.dob || '--'}</td></tr>
          <tr><th>Gender / Category</th><td>${escapeHtml(p.gender || '--')} / ${escapeHtml(p.category || 'General')}</td></tr>
          <tr><th>Aadhar Number</th><td>${escapeHtml(p.aadhar_number || '--')}</td></tr>
          <tr><th>Contact Phone</th><td>${escapeHtml(p.phone || '--')}</td></tr>
          <tr><th>Contact Email</th><td>${escapeHtml(p.email || '--')}</td></tr>
          <tr><th>Permanent Address</th><td>${escapeHtml(p.address || '--')}</td></tr>
          <tr><th>Department</th><td>${escapeHtml(p.department_name || '--')}</td></tr>
          <tr><th>Current Cohort</th><td>Semester ${p.current_semester || '--'} (Year ${p.current_year || '--'})</td></tr>
          <tr><th>Academic Batch</th><td>${escapeHtml(p.batch_label || '--')}</td></tr>
          <tr><th>Admission / Passing Year</th><td>${p.admission_year || '--'} / ${p.passing_year || '--'}</td></tr>
          <tr><th>Enrollment Status</th><td>${escapeHtml(p.status || 'Active')}</td></tr>
        </table>

        <div class="sig-row">
          <div class="sig-box">Student Signature</div>
          <div class="sig-box">Faculty In-Charge</div>
          <div class="sig-box">Head of Department (Seal)</div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 300);
          };
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
    showToast('Opening print dialog for Student Personal Details...', 'info');
  }

  // 6. Comprehensive Dossier Export Engines
  window.executeSingleStudentExport = function () {
    if (!state.activeDossier) return;

    const doPdf = document.getElementById('export-single-pdf')?.checked;
    const doDoc = document.getElementById('export-single-doc')?.checked;
    const doExcel = document.getElementById('export-single-excel')?.checked;

    if (!doPdf && !doDoc && !doExcel) {
      showToast('Please select at least one format to export', 'warning');
      return;
    }

    const incProfile = document.getElementById('export-inc-profile')?.checked ?? true;
    const incTests = document.getElementById('export-inc-tests')?.checked ?? true;
    const incAssignments = document.getElementById('export-inc-assignments')?.checked ?? true;
    const incAttendance = document.getElementById('export-inc-attendance')?.checked ?? true;
    const incDocuments = document.getElementById('export-inc-documents')?.checked ?? true;

    if (!incProfile && !incTests && !incAssignments && !incAttendance && !incDocuments) {
      showToast('Please select at least one data section to include in the dossier', 'warning');
      return;
    }

    const options = {
      incProfile,
      incTests,
      incAssignments,
      incAttendance,
      incDocuments,
      selectedSemesters: state.selectedDossierSemesters || [1, 2, 3, 4, 5, 6]
    };

    if (doExcel) exportSingleStudentExcel(state.activeDossier, options);
    if (doDoc) exportSingleStudentDoc(state.activeDossier, options);
    if (doPdf) exportSingleStudentPdf(state.activeDossier, options);
  };

  window.quickExportStudent = async function (studentId, format) {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const res = await fetch(`/api/v1/student-records/${studentId}/dossier`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      const json = await res.json();
      if (!json.success || !json.data) {
        showToast('Could not retrieve student data for export', 'error');
        return;
      }
      const defaultOptions = {
        incProfile: true,
        incTests: true,
        incAssignments: true,
        incAttendance: true,
        incDocuments: true,
        selectedSemesters: [1, 2, 3, 4, 5, 6]
      };
      if (format === 'excel') exportSingleStudentExcel(json.data, defaultOptions);
      else if (format === 'doc') exportSingleStudentDoc(json.data, defaultOptions);
      else if (format === 'pdf') exportSingleStudentPdf(json.data, defaultOptions);
    } catch (err) {
      showToast('Export failed', 'error');
    }
  };

  // Single Student Excel via ExcelJS with selective sections
  async function exportSingleStudentExcel(dossier, options = {}) {
    if (typeof ExcelJS === 'undefined') {
      showToast('Excel engine loading, please try again', 'info');
      return;
    }
    const p = dossier.profile || {};
    const selectedSems = options.selectedSemesters || state.selectedDossierSemesters || [1, 2, 3, 4, 5, 6];
    const allAssessments = dossier.assessments || [];
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'VidyaOS';
    workbook.created = new Date();

    // Sheet 1: Demographic Profile
    if (options.incProfile !== false) {
      const wsProfile = workbook.addWorksheet('Student Profile');
      wsProfile.columns = [
        { header: 'Profile Field', key: 'field', width: 28 },
        { header: 'Student Detail', key: 'value', width: 40 }
      ];
      wsProfile.addRows([
        { field: 'Full Student Name', value: p.full_name || '' },
        { field: 'Class Roll No', value: p.class_roll_no || '' },
        { field: 'Official Enrollment No', value: p.official_enrollment_no || '' },
        { field: 'UBTER Registration No', value: p.registration_no || '' },
        { field: "Father's Name", value: p.father_name || '' },
        { field: "Mother's Name", value: p.mother_name || '' },
        { field: 'Date of Birth (DOB)', value: p.dob || '' },
        { field: 'Gender', value: p.gender || '' },
        { field: 'Category', value: p.category || '' },
        { field: 'Aadhar Number', value: p.aadhar_number || '' },
        { field: 'Contact Email', value: p.email || '' },
        { field: 'Contact Phone', value: p.phone || '' },
        { field: 'Permanent Address', value: p.address || '' },
        { field: 'Department', value: p.department_name || '' },
        { field: 'Current Cohort', value: `Semester ${p.current_semester || ''}` },
        { field: 'Academic Batch', value: p.batch_label || '' }
      ]);
    }

    // Sheet 2: Assessment & Tests
    if (options.incTests !== false) {
      const wsTests = workbook.addWorksheet('Tests & Exams');
      wsTests.columns = [
        { header: 'Semester', key: 'sem', width: 14 },
        { header: 'Subject', key: 'sub', width: 30 },
        { header: 'Assessment Title', key: 'title', width: 35 },
        { header: 'Type', key: 'type', width: 16 },
        { header: 'Max Marks', key: 'max', width: 14 },
        { header: 'Marks Scored', key: 'scored', width: 16 }
      ];
      allAssessments
        .filter(t => !isAssignmentAssessment(t) && selectedSems.includes(Number(t.semester)))
        .forEach(t => {
          wsTests.addRow({
            sem: `Sem ${t.semester || ''}`,
            sub: t.subject_name || t.subject_code || '',
            title: t.title || '',
            type: t.type || '',
            max: t.max_marks || 0,
            scored: t.marks_obtained !== null ? t.marks_obtained : 0
          });
        });
    }

    // Sheet 3: Coursework & Assignments
    if (options.incAssignments !== false) {
      const wsAssignments = workbook.addWorksheet('Assignments');
      wsAssignments.columns = [
        { header: 'Semester', key: 'sem', width: 14 },
        { header: 'Subject', key: 'sub', width: 30 },
        { header: 'Assignment Title', key: 'title', width: 35 },
        { header: 'Component', key: 'type', width: 16 },
        { header: 'Max Marks', key: 'max', width: 14 },
        { header: 'Marks Scored', key: 'scored', width: 16 },
        { header: 'Status', key: 'status', width: 16 }
      ];
      allAssessments
        .filter(a => isAssignmentAssessment(a) && selectedSems.includes(Number(a.semester)))
        .forEach(a => {
          wsAssignments.addRow({
            sem: `Sem ${a.semester || ''}`,
            sub: a.subject_name || a.subject_code || '',
            title: a.title || '',
            type: a.type || 'ASSIGNMENT',
            max: a.max_marks || 0,
            scored: a.marks_obtained !== null ? a.marks_obtained : '--',
            status: a.submission_status || 'SUBMITTED'
          });
        });
    }

    // Sheet 4: Attendance Matrix
    if (options.incAttendance !== false) {
      const wsAtt = workbook.addWorksheet('Attendance Summary');
      wsAtt.columns = [
        { header: 'Semester', key: 'sem', width: 14 },
        { header: 'Subject Name', key: 'sub', width: 32 },
        { header: 'Subject Code', key: 'code', width: 18 },
        { header: 'Total Sessions', key: 'total', width: 16 },
        { header: 'Attended Sessions', key: 'attended', width: 18 },
        { header: 'Attendance %', key: 'pct', width: 16 }
      ];
      (dossier.attendance || [])
        .filter(a => selectedSems.includes(Number(a.semester)))
        .forEach(a => {
          const tot = Number(a.total_sessions) || 0;
          const pres = Number(a.attended_sessions) || 0;
          const pct = tot > 0 ? Math.round((pres * 100) / tot) : 100;
          wsAtt.addRow({
            sem: `Sem ${a.semester || ''}`,
            sub: a.subject_name || '',
            code: a.subject_code || '',
            total: tot,
            attended: pres,
            pct: `${pct}%`
          });
        });
    }

    // Sheet 5: Uploaded Documents
    if (options.incDocuments !== false && dossier.documents?.length) {
      const wsDocs = workbook.addWorksheet('Official Documents');
      wsDocs.columns = [
        { header: 'Document Title', key: 'title', width: 30 },
        { header: 'Category', key: 'cat', width: 20 },
        { header: 'File Name', key: 'file', width: 35 },
        { header: 'Size (KB)', key: 'size', width: 14 },
        { header: 'Uploaded Date', key: 'date', width: 18 }
      ];
      (dossier.documents || []).forEach(d => {
        wsDocs.addRow({
          title: d.title || '',
          cat: d.document_type || '',
          file: d.file_name || '',
          size: d.file_size ? Math.round(d.file_size / 1024) : '--',
          date: d.created_at ? new Date(d.created_at).toLocaleDateString() : ''
        });
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Student_Dossier_${p.class_roll_no || p.id}_${(p.full_name || 'student').replace(/\s+/g, '_')}.xlsx`;
    link.click();
    showToast('Excel dossier exported successfully', 'success');
  }

  // Single Student Word (.doc) Export with selective sections
  function exportSingleStudentDoc(dossier, options = {}) {
    const p = dossier.profile || {};
    const selectedSems = options.selectedSemesters || state.selectedDossierSemesters || [1, 2, 3, 4, 5, 6];
    const allAssessments = dossier.assessments || [];
    const tests = allAssessments.filter(t => !isAssignmentAssessment(t) && selectedSems.includes(Number(t.semester)));
    const assignments = allAssessments.filter(a => isAssignmentAssessment(a) && selectedSems.includes(Number(a.semester)));
    const atts = (dossier.attendance || []).filter(a => selectedSems.includes(Number(a.semester)));

    let html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Student Dossier</title>
      <style>
        body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #111; margin: 2rem; }
        h1 { color: #1e3a8a; font-size: 18pt; margin-bottom: 0.2rem; }
        h2 { color: #2563eb; font-size: 13pt; margin-top: 1.5rem; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; }
        th, td { border: 1px solid #cbd5e1; padding: 6px 10px; font-size: 10pt; text-align: left; }
        th { background-color: #f1f5f9; font-weight: bold; }
      </style>
      </head>
      <body>
        <h1>VidyaOS — Official Student Academic Dossier</h1>
        <p>Generated: ${new Date().toLocaleDateString()} • Department of ${p.department_name || 'Technical Education'}</p>
    `;

    if (options.incProfile !== false) {
      html += `
        <h2>1. Student Demographic Profile</h2>
        <table>
          <tr><th width="25%">Full Student Name</th><td width="25%"><b>${escapeHtml(p.full_name || '')}</b></td><th width="25%">Class Roll Number</th><td width="25%"><b>${escapeHtml(p.class_roll_no || '')}</b></td></tr>
          <tr><th>Official Enrollment No</th><td>${escapeHtml(p.official_enrollment_no || '')}</td><th>UBTER Registration No</th><td>${escapeHtml(p.registration_no || '')}</td></tr>
          <tr><th>Father's Name</th><td>${escapeHtml(p.father_name || '')}</td><th>Mother's Name</th><td>${escapeHtml(p.mother_name || '')}</td></tr>
          <tr><th>Date of Birth</th><td>${p.dob || ''}</td><th>Gender / Category</th><td>${escapeHtml(p.gender || '')} / ${escapeHtml(p.category || '')}</td></tr>
          <tr><th>Aadhar Number</th><td>${escapeHtml(p.aadhar_number || '')}</td><th>Contact Phone</th><td>${escapeHtml(p.phone || '')}</td></tr>
          <tr><th>Contact Email</th><td>${escapeHtml(p.email || '')}</td><th>Academic Batch</th><td>${escapeHtml(p.batch_label || '')}</td></tr>
          <tr><th>Permanent Address</th><td colspan="3">${escapeHtml(p.address || '')}</td></tr>
        </table>
      `;
    }

    if (options.incTests !== false) {
      html += `
        <h2>2. Assessment &amp; Test Records</h2>
        <table>
          <tr><th>Semester</th><th>Subject</th><th>Assessment Title</th><th>Type</th><th>Max Marks</th><th>Scored Marks</th></tr>
          ${tests.map(t => `
            <tr>
              <td>Sem ${t.semester || ''}</td>
              <td>${escapeHtml(t.subject_name || '')}</td>
              <td>${escapeHtml(t.title || '')}</td>
              <td>${escapeHtml(t.type || '')}</td>
              <td>${t.max_marks || 0}</td>
              <td><b>${t.marks_obtained !== null ? t.marks_obtained : 0}</b></td>
            </tr>
          `).join('')}
        </table>
      `;
    }

    if (options.incAssignments !== false) {
      html += `
        <h2>3. Coursework &amp; Assignments</h2>
        <table>
          <tr><th>Semester</th><th>Subject</th><th>Assignment Title</th><th>Component</th><th>Max Marks</th><th>Scored Marks</th><th>Status</th></tr>
          ${assignments.map(a => `
            <tr>
              <td>Sem ${a.semester || ''}</td>
              <td>${escapeHtml(a.subject_name || '')}</td>
              <td>${escapeHtml(a.title || '')}</td>
              <td>${escapeHtml(a.type || 'ASSIGNMENT')}</td>
              <td>${a.max_marks || 0}</td>
              <td><b>${a.marks_obtained !== null ? a.marks_obtained : '--'}</b></td>
              <td>${escapeHtml(a.submission_status || 'SUBMITTED')}</td>
            </tr>
          `).join('')}
        </table>
      `;
    }

    if (options.incAttendance !== false) {
      html += `
        <h2>4. Attendance Matrix &amp; Lecture Summary</h2>
        <table>
          <tr><th>Semester</th><th>Subject Name</th><th>Code</th><th>Total Lectures</th><th>Attended</th><th>Percentage</th></tr>
          ${atts.map(a => {
            const tot = Number(a.total_sessions) || 0;
            const pres = Number(a.attended_sessions) || 0;
            const pct = tot > 0 ? Math.round((pres * 100) / tot) : 100;
            return `
              <tr>
                <td>Sem ${a.semester || ''}</td>
                <td>${escapeHtml(a.subject_name || '')}</td>
                <td>${escapeHtml(a.subject_code || '')}</td>
                <td>${tot}</td>
                <td><b>${pres}</b></td>
                <td><b>${pct}%</b></td>
              </tr>
            `;
          }).join('')}
        </table>
      `;
    }

    html += `
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Student_Dossier_${p.class_roll_no || p.id}_${(p.full_name || 'student').replace(/\s+/g, '_')}.doc`;
    link.click();
    showToast('Word dossier (.doc) exported successfully', 'success');
  }

  // Single Student PDF Export with selective sections
  function exportSingleStudentPdf(dossier, options = {}) {
    const printWin = window.open('', '_blank');
    if (!printWin) {
      showToast('Popup blocker prevented PDF print window. Please allow popups.', 'error');
      return;
    }
    const p = dossier.profile || {};
    const selectedSems = options.selectedSemesters || state.selectedDossierSemesters || [1, 2, 3, 4, 5, 6];
    const allAssessments = dossier.assessments || [];
    const tests = allAssessments.filter(t => !isAssignmentAssessment(t) && selectedSems.includes(Number(t.semester)));
    const assignments = allAssessments.filter(a => isAssignmentAssessment(a) && selectedSems.includes(Number(a.semester)));
    const atts = (dossier.attendance || []).filter(a => selectedSems.includes(Number(a.semester)));

    let sectionsHtml = '';

    if (options.incProfile !== false) {
      sectionsHtml += `
        <h2>Student Demographics</h2>
        <table>
          <tr><th>Name</th><td><b>${escapeHtml(p.full_name || '')}</b></td><th>Class Roll #</th><td><b>${escapeHtml(p.class_roll_no || '')}</b></td></tr>
          <tr><th>Enrollment #</th><td>${escapeHtml(p.official_enrollment_no || '')}</td><th>Registration #</th><td>${escapeHtml(p.registration_no || '')}</td></tr>
          <tr><th>Father's Name</th><td>${escapeHtml(p.father_name || '')}</td><th>Mother's Name</th><td>${escapeHtml(p.mother_name || '')}</td></tr>
          <tr><th>DOB</th><td>${p.dob || ''}</td><th>Gender / Category</th><td>${escapeHtml(p.gender || '')} / ${escapeHtml(p.category || '')}</td></tr>
          <tr><th>Aadhar #</th><td>${escapeHtml(p.aadhar_number || '')}</td><th>Phone / Email</th><td>${escapeHtml(p.phone || '')} • ${escapeHtml(p.email || '')}</td></tr>
          <tr><th>Address</th><td colspan="3">${escapeHtml(p.address || '')}</td></tr>
        </table>
      `;
    }

    if (options.incTests !== false) {
      sectionsHtml += `
        <h2>Class Tests &amp; Examinations</h2>
        <table>
          <tr><th>Semester</th><th>Subject</th><th>Title</th><th>Type</th><th>Max</th><th>Scored</th></tr>
          ${tests.map(t => `
            <tr>
              <td>Sem ${t.semester || ''}</td>
              <td>${escapeHtml(t.subject_name || '')}</td>
              <td>${escapeHtml(t.title || '')}</td>
              <td>${escapeHtml(t.type || '')}</td>
              <td>${t.max_marks || 0}</td>
              <td><b>${t.marks_obtained !== null ? t.marks_obtained : 0}</b></td>
            </tr>
          `).join('')}
        </table>
      `;
    }

    if (options.incAssignments !== false) {
      sectionsHtml += `
        <h2>Coursework &amp; Assignments</h2>
        <table>
          <tr><th>Semester</th><th>Subject</th><th>Title</th><th>Component</th><th>Max</th><th>Scored</th><th>Status</th></tr>
          ${assignments.map(a => `
            <tr>
              <td>Sem ${a.semester || ''}</td>
              <td>${escapeHtml(a.subject_name || '')}</td>
              <td>${escapeHtml(a.title || '')}</td>
              <td>${escapeHtml(a.type || 'ASSIGNMENT')}</td>
              <td>${a.max_marks || 0}</td>
              <td><b>${a.marks_obtained !== null ? a.marks_obtained : '--'}</b></td>
              <td>${escapeHtml(a.submission_status || 'SUBMITTED')}</td>
            </tr>
          `).join('')}
        </table>
      `;
    }

    if (options.incAttendance !== false) {
      sectionsHtml += `
        <h2>Attendance Summary</h2>
        <table>
          <tr><th>Semester</th><th>Subject Name</th><th>Code</th><th>Total</th><th>Attended</th><th>Percentage</th></tr>
          ${atts.map(a => {
            const tot = Number(a.total_sessions) || 0;
            const pres = Number(a.attended_sessions) || 0;
            const pct = tot > 0 ? Math.round((pres * 100) / tot) : 100;
            return `
              <tr>
                <td>Sem ${a.semester || ''}</td>
                <td>${escapeHtml(a.subject_name || '')}</td>
                <td>${escapeHtml(a.subject_code || '')}</td>
                <td>${tot}</td>
                <td><b>${pres}</b></td>
                <td><b>${pct}%</b></td>
              </tr>
            `;
          }).join('')}
        </table>
      `;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Student Academic Dossier — ${escapeHtml(p.full_name)}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #111; padding: 2rem; margin: 0; }
          .header { border-bottom: 2px solid #2563eb; padding-bottom: 0.75rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: flex-end; }
          .header h1 { margin: 0; font-size: 1.5rem; color: #1e3a8a; }
          .header p { margin: 0.25rem 0 0; font-size: 0.85rem; color: #64748b; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; font-size: 0.85rem; }
          th, td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
          th { background: #f8fafc; font-weight: 700; color: #334155; }
          h2 { font-size: 1.05rem; color: #1e3a8a; margin: 1rem 0 0.5rem; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>Official Student Academic Dossier</h1>
            <p>Institution: Uttarakhand Board of Technical Education • Department of ${escapeHtml(p.department_name || 'IT')}</p>
          </div>
          <div><p>Date: ${new Date().toLocaleDateString()}</p></div>
        </div>

        ${sectionsHtml}

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
    showToast('Opening print dialog for Academic Dossier...', 'info');
  }

  // 7. Cohort Batch Export (Export All)
  window.openCohortExportModal = function () {
    const modal = document.getElementById('modal-cohort-export');
    if (!modal) return;
    modal.style.display = 'flex';

    // Pre-fill active filters
    const sessSelect = document.getElementById('export-cohort-session');
    const yrSelect = document.getElementById('export-cohort-year');
    const semSelect = document.getElementById('export-cohort-semester');
    const batchSelect = document.getElementById('export-cohort-batch');

    if (sessSelect) sessSelect.value = state.filters.session_id || '';
    if (yrSelect) yrSelect.value = state.filters.year || '';
    if (semSelect) semSelect.value = state.filters.semester || '';
    if (batchSelect) batchSelect.value = state.filters.batch || '';
  };

  window.closeCohortExportModal = function () {
    const modal = document.getElementById('modal-cohort-export');
    if (modal) modal.style.display = 'none';
  };

  window.executeCohortExport = async function (e) {
    e.preventDefault();
    const session = document.getElementById('export-cohort-session')?.value || '';
    const yr = document.getElementById('export-cohort-year')?.value || '';
    const sem = document.getElementById('export-cohort-semester')?.value || '';
    const batch = document.getElementById('export-cohort-batch')?.value || '';

    const doExcel = document.getElementById('cohort-fmt-excel')?.checked;
    const doPdf = document.getElementById('cohort-fmt-pdf')?.checked;
    const doDoc = document.getElementById('cohort-fmt-doc')?.checked;

    if (!doExcel && !doPdf && !doDoc) {
      showToast('Please select at least one export format', 'warning');
      return;
    }

    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const params = new URLSearchParams();
      if (session) params.set('academic_year_id', session);
      if (yr) params.set('year', yr);
      if (sem) params.set('semester', sem);
      if (batch) params.set('batch', batch);

      const res = await fetch(`/api/v1/student-records/export?${params.toString()}`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      const json = await res.json();
      if (!json.success || !json.data || json.data.length === 0) {
        showToast('No student records found to export', 'warning');
        return;
      }

      const cohort = json.data;

      if (doExcel) exportCohortExcel(cohort, { session, yr, sem, batch });
      if (doDoc) exportCohortDoc(cohort, { session, yr, sem, batch });
      if (doPdf) exportCohortPdf(cohort, { session, yr, sem, batch });

      closeCohortExportModal();
    } catch (err) {
      console.error(err);
      showToast('Failed to export cohort data', 'error');
    }
  };

  async function exportCohortExcel(students, meta) {
    if (typeof ExcelJS === 'undefined') {
      showToast('Excel library not loaded', 'error');
      return;
    }
    const wb = new ExcelJS.Workbook();
    wb.creator = 'VidyaOS';
    const ws = wb.addWorksheet('Cohort Records');

    ws.columns = [
      { header: 'Roll #', key: 'roll', width: 10 },
      { header: 'Enrollment No', key: 'enroll', width: 18 },
      { header: 'UBTER Reg No', key: 'reg', width: 18 },
      { header: 'Full Student Name', key: 'name', width: 28 },
      { header: 'Gender', key: 'gender', width: 12 },
      { header: 'Category', key: 'cat', width: 14 },
      { header: "Father's Name", key: 'father', width: 24 },
      { header: "Mother's Name", key: 'mother', width: 24 },
      { header: 'DOB', key: 'dob', width: 14 },
      { header: 'Aadhar Number', key: 'aadhar', width: 18 },
      { header: 'Contact Phone', key: 'phone', width: 16 },
      { header: 'Email Address', key: 'email', width: 28 },
      { header: 'Permanent Address', key: 'address', width: 35 },
      { header: 'Semester', key: 'sem', width: 12 },
      { header: 'Year', key: 'yr', width: 10 },
      { header: 'Batch', key: 'batch', width: 16 },
      { header: 'Attendance %', key: 'att', width: 16 },
      { header: 'Status', key: 'status', width: 14 }
    ];

    students.forEach((s, idx) => {
      ws.addRow({
        roll: s.class_roll_no || idx + 1,
        enroll: s.official_enrollment_no || '',
        reg: s.registration_no || '',
        name: s.full_name || '',
        gender: s.gender || '',
        cat: s.category || '',
        father: s.father_name || '',
        mother: s.mother_name || '',
        dob: s.dob || '',
        aadhar: s.aadhar_number || '',
        phone: s.phone || '',
        email: s.email || '',
        address: s.address || '',
        sem: s.current_semester ? `Sem ${s.current_semester}` : '',
        yr: s.current_year ? `Year ${s.current_year}` : '',
        batch: s.batch_label || '',
        att: `${s.attendance_percentage || 100}%`,
        status: s.status || 'ACTIVE'
      });
    });

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Cohort_Student_Records_${meta.sem ? 'Sem' + meta.sem : 'All'}_${Date.now()}.xlsx`;
    link.click();
    showToast(`Exported ${students.length} student records to Excel`, 'success');
  }

  function exportCohortDoc(students, meta) {
    let html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Cohort Roster</title>
      <style>
        body { font-family: Calibri, Arial, sans-serif; font-size: 10pt; color: #111; margin: 1.5rem; }
        h1 { color: #1e3a8a; font-size: 16pt; margin-bottom: 0.2rem; }
        table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
        th, td { border: 1px solid #cbd5e1; padding: 5px 8px; font-size: 9pt; text-align: left; }
        th { background-color: #f1f5f9; font-weight: bold; }
      </style>
      </head>
      <body>
        <h1>VidyaOS — Complete Department Student Cohort Roster</h1>
        <p>Total Records: ${students.length} • Generated: ${new Date().toLocaleDateString()}</p>
        <table>
          <tr>
            <th>Roll #</th><th>Enrollment No</th><th>UBTER Reg</th><th>Student Full Name</th>
            <th>Father's Name</th><th>DOB</th><th>Phone</th><th>Cohort</th><th>Batch</th><th>Att %</th>
          </tr>
          ${students.map((s, idx) => `
            <tr>
              <td><b>${s.class_roll_no || idx + 1}</b></td>
              <td>${escapeHtml(s.official_enrollment_no || '')}</td>
              <td>${escapeHtml(s.registration_no || '')}</td>
              <td><b>${escapeHtml(s.full_name || '')}</b></td>
              <td>${escapeHtml(s.father_name || '')}</td>
              <td>${s.dob || ''}</td>
              <td>${escapeHtml(s.phone || '')}</td>
              <td>Sem ${s.current_semester || ''}</td>
              <td>${escapeHtml(s.batch_label || '')}</td>
              <td><b>${s.attendance_percentage || 100}%</b></td>
            </tr>
          `).join('')}
        </table>
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Cohort_Student_Records_${Date.now()}.doc`;
    link.click();
    showToast(`Exported ${students.length} student records to Word (.doc)`, 'success');
  }

  function exportCohortPdf(students, meta) {
    const printWin = window.open('', '_blank');
    if (!printWin) {
      showToast('Popup blocker prevented PDF print window. Please allow popups.', 'error');
      return;
    }
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Student Cohort Records Roster</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #111; padding: 1.5rem; margin: 0; }
          .header { border-bottom: 2px solid #2563eb; padding-bottom: 0.5rem; margin-bottom: 1rem; display:flex; justify-content:space-between; }
          .header h1 { margin: 0; font-size: 1.3rem; color: #1e3a8a; }
          table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
          th, td { border: 1px solid #cbd5e1; padding: 5px 8px; text-align: left; }
          th { background: #f8fafc; font-weight: 700; color: #334155; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>Department Student Cohort Academic Records</h1>
            <p>Total Records: ${students.length} • Generated: ${new Date().toLocaleDateString()}</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Roll #</th><th>Enrollment No</th><th>Student Name</th>
              <th>Father's Name</th><th>DOB</th><th>Phone</th><th>Cohort</th><th>Batch</th><th>Attendance %</th>
            </tr>
          </thead>
          <tbody>
            ${students.map((s, idx) => `
              <tr>
                <td><b>${s.class_roll_no || idx + 1}</b></td>
                <td>${escapeHtml(s.official_enrollment_no || '')}</td>
                <td><b>${escapeHtml(s.full_name || '')}</b></td>
                <td>${escapeHtml(s.father_name || '')}</td>
                <td>${s.dob || ''}</td>
                <td>${escapeHtml(s.phone || '')}</td>
                <td>Sem ${s.current_semester || ''}</td>
                <td>${escapeHtml(s.batch_label || '')}</td>
                <td><b>${s.attendance_percentage || 100}%</b></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 300);
          };
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  }

  // 8. Bootstrap & Init
  async function init() {
    await loadFilterOptions();
    await loadStudentRecords();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
