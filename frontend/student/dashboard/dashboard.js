/**
 * ══════════════════════════════════════════════════════════════
 * STUDENT CLASSROOM DASHBOARD CONTROLLER (EXECUTIVE SUITE)
 * frontend/student/dashboard/dashboard.js
 * 100% Theme Token Compliant — Zero Hardcoded Colors
 * ══════════════════════════════════════════════════════════════
 */

// Route Guard for Student Role
if (typeof guardRoute === 'function') {
  try {
    guardRoute(['STUDENT']);
  } catch {
    guardRoute({ requireRoles: ['STUDENT'] });
  }
}

let currentActiveSession = null;
let studentDashboardState = {
  profile: null,
  classes: [],
  subjectAttendance: {},
  currentFilter: 'ALL', // 'ALL' | 'THEORY' | 'PRACTICAL'
  searchQuery: ''
};

document.addEventListener('DOMContentLoaded', () => {
  loadStudentDashboard();
  loadEnrolledClasses();
  initDropdownCloseListeners();
});

/**
 * Main Loader: Fetches Student Profile, Attendance Telemetry, and Enrolled Classes
 */
async function loadStudentDashboard() {
  try {
    // 1. Load Student Profile
    const profRes = await fetchApi('/students/me');
    if (profRes && profRes.success && profRes.data) {
      const s = profRes.data;
      studentDashboardState.profile = s;

      // Update DOM with strict contract compliance (no '#' prefix before roll number)
      const nameEl = document.getElementById('student-name');
      if (nameEl) nameEl.innerText = s.full_name || 'Student';

      const headerNameEl = document.getElementById('header-student-name');
      if (headerNameEl) headerNameEl.innerText = s.full_name || 'Student Portal';

      const headerDisplayEl = document.getElementById('header-student-display-name');
      if (headerDisplayEl) headerDisplayEl.innerText = s.full_name || 'Student';

      const cohortEl = document.getElementById('student-cohort-info');
      if (cohortEl) {
        cohortEl.innerText = `${s.department_name || s.branch_name || 'Information Technology'} (${s.branch_code || s.department_code || 'IT'}) • Year ${s.year || 3}, Sem ${s.semester || 5}`;
      }

      const rollTxt = s.class_roll_no !== undefined && s.class_roll_no !== null ? `${s.class_roll_no}` : '—';
      const regTxt = s.registration_no || '—';
      const rollBadgeEl = document.getElementById('student-roll-badge');
      if (rollBadgeEl) {
        rollBadgeEl.innerHTML = `Roll: <strong>${rollTxt}</strong> • UBTER Reg: <strong>${regTxt}</strong>`;
      }

      // Populate Navbar & Popover Avatar
      const initials = getInitials(s.full_name || 'Student');
      const avatarBtn = document.getElementById('gc-user-avatar');
      if (avatarBtn) avatarBtn.innerText = initials;

      const popAvatar = document.getElementById('popover-avatar');
      if (popAvatar) popAvatar.innerText = initials;

      const popName = document.getElementById('popover-user-name');
      if (popName) popName.innerText = s.full_name || 'Student Member';

      const popEmail = document.getElementById('popover-user-email');
      if (popEmail) popEmail.innerText = s.email || `${s.username || 'student'}@college.edu`;

      const popRegBadge = document.getElementById('popover-reg-badge');
      if (popRegBadge) {
        popRegBadge.innerHTML = `<span class="badge badge-present" style="font-size:0.75rem;">Roll: <strong>${rollTxt}</strong> • UBTER Reg: <strong>${regTxt}</strong></span>`;
      }
    }

    // 2. Load Attendance Stats & Predictor
    const statsRes = await fetchApi('/students/me/attendance/stats');
    if (statsRes && statsRes.success && statsRes.data) {
      const stats = statsRes.data;
      const pct = stats.current_percentage !== undefined ? stats.current_percentage : 0;
      const isSafe = pct >= 75;

      const pctEl = document.getElementById('metric-percentage');
      if (pctEl) {
        pctEl.innerText = `${pct}%`;
        pctEl.style.color = isSafe ? 'var(--status-present)' : 'var(--status-absent)';
      }

      const pctPill = document.getElementById('metric-percentage-pill');
      if (pctPill) {
        pctPill.className = `status-pill ${isSafe ? 'status-ontrack' : 'status-below'}`;
        pctPill.innerText = isSafe ? '● On Track' : '▲ Below Target';
      }

      const attEl = document.getElementById('metric-attended');
      if (attEl) attEl.innerText = stats.total_attended || 0;

      const attSubEl = document.getElementById('metric-attended-sub');
      if (attSubEl) attSubEl.innerText = `Present: ${stats.present_count || 0} | Late: ${stats.late_count || 0}`;

      const absEl = document.getElementById('metric-absent');
      if (absEl) absEl.innerText = stats.total_absent || 0;

      const condEl = document.getElementById('metric-conducted');
      if (condEl) condEl.innerText = stats.total_conducted || 0;

      // Render Compliance Standing Card
      const pCard = document.getElementById('predictor-card');
      const pIcon = document.getElementById('predictor-icon');
      const pHead = document.getElementById('predictor-headline');
      const pBadge = document.getElementById('predictor-status-badge');
      const pMsg = document.getElementById('predictor-message');

      if (pCard && stats.prediction) {
        if (stats.prediction.status === 'SAFE') {
          pCard.className = 'eligibility-box';
          pCard.style.background = 'var(--status-present-bg)';
          pCard.style.borderColor = 'var(--status-present)';
          if (pIcon) {
            pIcon.style.background = 'var(--status-present)';
            pIcon.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
          }
          if (pHead) {
            pHead.innerText = 'Good Standing (Eligible)';
            pHead.style.color = 'var(--status-present)';
          }
          if (pBadge) {
            pBadge.className = 'status-pill status-ontrack';
            pBadge.innerText = 'Eligible for Exams';
          }
        } else {
          pCard.className = 'eligibility-box';
          pCard.style.background = 'var(--status-absent-bg)';
          pCard.style.borderColor = 'var(--status-absent)';
          if (pIcon) {
            pIcon.style.background = 'var(--status-absent)';
            pIcon.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
          }
          if (pHead) {
            pHead.innerText = 'Attendance Deficit Warning';
            pHead.style.color = 'var(--status-absent)';
          }
          if (pBadge) {
            pBadge.className = 'status-pill status-below';
            pBadge.innerText = 'Action Required';
          }
        }
        if (pMsg) pMsg.innerText = stats.prediction.message;
      }
    }

    // 3. Load Subjects Attendance Breakdown
    const subjRes = await fetchApi('/students/me/attendance/subjects');
    if (subjRes && subjRes.success && Array.isArray(subjRes.data)) {
      const container = document.getElementById('subjects-container');
      const subjMap = {};

      subjRes.data.forEach(sub => {
        const codeKey = (sub.subject_code || '').trim().toUpperCase();
        const nameKey = (sub.subject_name || '').trim().toUpperCase();
        if (codeKey) subjMap[codeKey] = sub;
        if (nameKey) subjMap[nameKey] = sub;
      });
      studentDashboardState.subjectAttendance = subjMap;

      if (container) {
        if (subjRes.data.length === 0) {
          container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.875rem;">No enrolled subjects found.</p>';
        } else {
          container.innerHTML = subjRes.data.map(sub => {
            const subSafe = sub.percentage >= 75;
            return `
              <div class="subject-progress-row">
                <div class="subject-info-head">
                  <span class="subject-name-bold">${escapeHtml(sub.subject_code)} - ${escapeHtml(sub.subject_name)}</span>
                  <div class="subject-pct-tag-wrap">
                    <span class="subject-pct-num" style="color: ${subSafe ? 'var(--status-present)' : 'var(--status-absent)'};">
                      ${sub.percentage}%
                    </span>
                    <span style="font-size:0.75rem;color:var(--text-muted);">(${sub.attended}/${sub.conducted})</span>
                  </div>
                </div>
                <div class="subject-meter-track">
                  <div class="subject-meter-fill" style="width: ${sub.percentage}%; background-color: ${subSafe ? 'var(--status-present)' : 'var(--status-absent)'};"></div>
                </div>
              </div>
            `;
          }).join('');
        }
      }
    }

    // 4. Load Enrolled Google Classroom Classes & Groups
    await loadEnrolledClasses();

    // 5. Load History Log
    const histRes = await fetchApi('/students/me/attendance?limit=8');
    if (histRes && histRes.success && Array.isArray(histRes.data)) {
      const tbody = document.getElementById('history-tbody');
      if (tbody) {
        if (histRes.data.length === 0) {
          tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No finalized attendance records yet.</td></tr>';
        } else {
          tbody.innerHTML = histRes.data.map(h => {
            const statusLower = (h.attendance_status || 'absent').toLowerCase();
            const badgeClass = statusLower === 'present' ? 'badge-present' : (statusLower === 'late' ? 'badge-late' : 'badge-absent');
            return `
              <tr>
                <td>${typeof formatDate === 'function' ? formatDate(h.start_time) : (h.start_time || '').slice(0, 10)}</td>
                <td><strong>${escapeHtml(h.subject_code || h.subject_name || 'Course')}</strong></td>
                <td><span class="badge ${badgeClass}">${h.attendance_status || 'ABSENT'}</span></td>
                <td style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(h.source || 'MANUAL')}</td>
              </tr>
            `;
          }).join('');
        }
      }
    }

    // 6. Check Active Live Attendance Sessions
    const sessRes = await fetchApi('/attendance/sessions?state=OPEN');
    if (sessRes && sessRes.success && Array.isArray(sessRes.data) && sessRes.data.length > 0) {
      currentActiveSession = sessRes.data[0];
      const banner = document.getElementById('active-session-banner');
      if (banner) banner.style.display = 'block';

      const subEl = document.getElementById('active-session-subject');
      if (subEl) subEl.innerText = `${currentActiveSession.subject_code || ''} — ${currentActiveSession.subject_name || 'Active Session'}`;

      const infoEl = document.getElementById('active-session-info');
      if (infoEl) {
        infoEl.innerText = `Teacher: ${currentActiveSession.teacher_name || 'Instructor'} | Mode: ${currentActiveSession.session_type || 'LECTURE'}`;
      }
    } else {
      const banner = document.getElementById('active-session-banner');
      if (banner) banner.style.display = 'none';
    }
  } catch (err) {
    console.error('Error loading student classroom dashboard', err);
  }
}

/**
 * Fetches and renders Enrolled Teaching Groups as modern course cards
 */
async function loadEnrolledClasses() {
  try {
    const res = await fetchApi('/teaching-groups/student/my-groups');
    if (res && res.success && Array.isArray(res.data)) {
      studentDashboardState.classes = res.data;
      updateClassesFilterCounts();
      renderGoogleClassCards();
      renderDrawerClasses();
    }
  } catch (err) {
    console.error('Failed to load student classes:', err);
    const grid = document.getElementById('classes-grid');
    if (grid) {
      grid.innerHTML = `
        <div class="gc-empty-card">
          <div class="gc-empty-icon" style="color:var(--status-absent);">✕</div>
          <h3 class="gc-empty-title">Error Loading Classes</h3>
          <p class="gc-empty-text">${escapeHtml(err.message || 'Unable to connect to server')}</p>
        </div>
      `;
    }
  }
}

/**
 * Updates filter counter badges in the toolbar
 */
function updateClassesFilterCounts() {
  const allCount = studentDashboardState.classes.length;
  const theoryCount = studentDashboardState.classes.filter(c => (c.component || '').toUpperCase() === 'THEORY').length;
  const practicalCount = studentDashboardState.classes.filter(c => (c.component || '').toUpperCase() === 'PRACTICAL').length;

  const countBadge = document.getElementById('count-classes-badge');
  if (countBadge) countBadge.innerText = allCount;

  const allEl = document.getElementById('count-all');
  if (allEl) allEl.innerText = allCount;

  const theoryEl = document.getElementById('count-theory');
  if (theoryEl) theoryEl.innerText = theoryCount;

  const practicalEl = document.getElementById('count-practical');
  if (practicalEl) practicalEl.innerText = practicalCount;
}

/**
 * Filter handler for ALL, THEORY, PRACTICAL
 */
function setClassesFilter(filter) {
  studentDashboardState.currentFilter = filter;
  ['all', 'theory', 'practical'].forEach(f => {
    const btn = document.getElementById(`filter-${f}`);
    if (btn) {
      if (f.toUpperCase() === filter) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
  });
  renderGoogleClassCards();
}

/**
 * Real-time search handlers
 */
function handleClassesSearch(query) {
  studentDashboardState.searchQuery = (query || '').toLowerCase().trim();
  const topInput = document.getElementById('admin-module-search');
  if (topInput && topInput.value !== query) topInput.value = query;
  renderGoogleClassCards();
}

function handleGlobalSearch(query) {
  studentDashboardState.searchQuery = (query || '').toLowerCase().trim();
  const localInput = document.getElementById('search-classes');
  if (localInput && localInput.value !== query) localInput.value = query;
  renderGoogleClassCards();
}

/**
 * Renders the modern high-fidelity course cards grid matching mockup
 */
function renderGoogleClassCards() {
  const grid = document.getElementById('classes-grid');
  if (!grid) return;

  let filtered = studentDashboardState.classes;

  if (studentDashboardState.currentFilter !== 'ALL') {
    filtered = filtered.filter(c => (c.component || '').toUpperCase() === studentDashboardState.currentFilter);
  }

  if (studentDashboardState.searchQuery) {
    const q = studentDashboardState.searchQuery;
    filtered = filtered.filter(c => {
      const name = (c.name || '').toLowerCase();
      const sub = (c.subject_name || '').toLowerCase();
      const code = (c.subject_code || '').toLowerCase();
      const teacher = (c.teacher_name || '').toLowerCase();
      return name.includes(q) || sub.includes(q) || code.includes(q) || teacher.includes(q);
    });
  }

  if (filtered.length === 0) {
    if (studentDashboardState.classes.length === 0) {
      grid.innerHTML = `
        <div class="gc-empty-card">
          <div class="gc-empty-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
              <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
            </svg>
          </div>
          <h3 class="gc-empty-title">No Enrolled Classes Yet</h3>
          <p class="gc-empty-text">
            You are not enrolled in any subject classes. Ask your course instructors for the 6-character invite code to join.
          </p>
          <button class="btn btn-primary" onclick="openStudentJoinModal()" style="display:inline-flex;align-items:center;gap:0.4rem;border-radius:var(--radius-full, 9999px);">
            <span>+</span> <span>Join Class with Invite Code</span>
          </button>
        </div>
      `;
    } else {
      grid.innerHTML = `
        <div class="gc-empty-card">
          <div class="gc-empty-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <h3 class="gc-empty-title">No Classes Matched</h3>
          <p class="gc-empty-text">No courses match your filter or search criteria.</p>
          <button class="btn btn-secondary btn-sm" onclick="clearClassesFilter()">Clear Filter</button>
        </div>
      `;
    }
    return;
  }

  const banners = ['banner-blue', 'banner-green', 'banner-purple'];

  grid.innerHTML = filtered.map((c, index) => {
    const bannerClass = banners[index % banners.length];
    const isTheory = (c.component || '').toUpperCase() === 'THEORY';
    const compLabel = isTheory ? 'Theory' : 'Practical';
    const code = c.subject_code || (c.subject_name || '').slice(0, 6).toUpperCase();
    const teacherInitials = getInitials(c.teacher_name || c.subject_name || 'Class');

    // Find matching attendance record
    const subMatch = studentDashboardState.subjectAttendance[(code || '').toUpperCase()] || 
                     studentDashboardState.subjectAttendance[(c.subject_name || '').toUpperCase()];
    const pct = subMatch ? subMatch.percentage : 100;
    const isSafe = pct >= 75;

    return `
      <article class="student-course-card" id="class-card-${c.id}">
        <!-- Gradient Banner Header -->
        <header class="card-banner ${bannerClass}">
          <div class="banner-top-row">
            <div class="banner-title-wrap">
              <div class="banner-initial-avatar">${teacherInitials}</div>
              <div style="min-width:0;">
                <h3 class="banner-subject-title" title="${escapeHtml(c.subject_name || c.name)}">
                  <a href="/student/group-detail.html?id=${c.id}" style="color:inherit;text-decoration:none;">
                    ${escapeHtml(c.subject_name || c.name || 'Subject Class')}
                  </a>
                </h3>
                <div style="font-size:0.78rem;opacity:0.9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                  ${escapeHtml(c.teacher_name || 'Course Instructor')} • Sem ${c.semester || 1}
                </div>
              </div>
            </div>
            <span class="banner-code-pill">${escapeHtml(code)}</span>
          </div>

          <div class="banner-bottom-row">
            <span class="banner-tag-pill">${compLabel}</span>
            <span>Batch ${escapeHtml(c.cohort_name || 'Regular')}</span>
          </div>
        </header>

        <!-- Card Content Body -->
        <div class="card-content-body">
          <div class="card-stats-row">
            <div class="stats-students-chip" title="Enrolled Students">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span>${c.student_count || 48} Students</span>
            </div>

            <!-- Attendance Circular Donut SVG -->
            <div class="stats-donut-wrap" title="Attendance Progress">
              <svg class="donut-chart-svg" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--border-color)" stroke-width="3.5" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="${isSafe ? 'var(--status-present)' : 'var(--status-absent)'}" stroke-width="3.5" stroke-dasharray="${pct}, 100" />
              </svg>
              <div>
                <span class="donut-pct-text" style="color:${isSafe ? 'var(--status-present)' : 'var(--status-absent)'}">${pct}%</span>
                <span class="donut-pct-label">Attendance</span>
              </div>
            </div>

            <span class="status-pill ${isSafe ? 'status-ontrack' : 'status-below'}">
              ${isSafe ? '● On Track' : '▲ Below Target'}
            </span>
          </div>

          <!-- Thin Meter Bar -->
          <div class="card-meter-bar">
            <div class="card-meter-fill" style="width: ${pct}%; background-color: ${isSafe ? 'var(--status-present)' : 'var(--status-absent)'};"></div>
          </div>

          <!-- 2x2 Action Buttons Grid -->
          <div class="card-actions-2x2">
            <a href="/student/group-detail.html?id=${c.id}&tab=attendance" class="btn-card-secondary" title="View Detailed Attendance Register">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span>Attendance</span>
            </a>

            <a href="/student/group-detail.html?id=${c.id}&tab=classwork" class="btn-card-secondary" title="View Coursework & Assignments">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
              </svg>
              <span>Coursework</span>
            </a>

            <a href="/student/group-detail.html?id=${c.id}&tab=people" class="btn-card-secondary" title="View Classmates & Faculty">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span>People</span>
            </a>

            <a href="/student/group-detail.html?id=${c.id}" class="btn-card-primary" title="View Classroom Details & Stream">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <span>Details</span>
            </a>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

/**
 * Clear filter helper
 */
function clearClassesFilter() {
  studentDashboardState.currentFilter = 'ALL';
  studentDashboardState.searchQuery = '';
  const searchInput = document.getElementById('search-classes');
  if (searchInput) searchInput.value = '';
  const topInput = document.getElementById('admin-module-search');
  if (topInput) topInput.value = '';
  setClassesFilter('ALL');
}

/**
 * Renders enrolled classes with colored dots in the Slide-out Left Drawer (if present)
 */
function renderDrawerClasses() {
  const container = document.getElementById('drawer-classes-list');
  if (!container) return;

  if (studentDashboardState.classes.length === 0) {
    container.innerHTML = '<div style="padding: 0.5rem 1.5rem; font-size: 0.8rem; color: var(--text-muted);">No enrolled classes.</div>';
    return;
  }

  const dotColors = [
    'var(--color-primary)',
    'var(--status-present)',
    'var(--status-excused)',
    'var(--status-late)',
    'var(--color-primary-hover)'
  ];

  container.innerHTML = studentDashboardState.classes.map((c, i) => {
    const color = dotColors[i % dotColors.length];
    return `
      <a href="/student/group-detail.html?id=${c.id}" class="gc-drawer-link" style="font-size:0.84rem;padding:0.5rem 1.5rem;display:flex;align-items:center;gap:0.5rem;text-decoration:none;color:var(--text-main);">
        <span class="gc-class-dot" style="background: ${color}; width:10px; height:10px; border-radius:50%; flex-shrink:0;"></span>
        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(c.name || c.subject_name)}</span>
      </a>
    `;
  }).join('');
}

/**
 * Left Drawer Toggle Controller (delegates to universal sidebar)
 */
function toggleDrawer(forceState) {
  const sidebar = document.getElementById('app-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (sidebar) {
    const isOpen = forceState !== undefined ? forceState : (!sidebar.classList.contains('open') && !sidebar.classList.contains('sidebar-open'));
    sidebar.classList.toggle('open', isOpen);
    sidebar.classList.toggle('sidebar-open', isOpen);
    document.body.classList.toggle('sidebar-open', isOpen);
    if (backdrop) {
      backdrop.classList.toggle('open', isOpen);
      backdrop.classList.toggle('active', isOpen);
    }
    const btn = document.getElementById('btn-menu-toggle');
    if (btn) btn.setAttribute('aria-pressed', isOpen ? 'true' : 'false');
    return;
  }
  if (typeof window.toggleSidebar === 'function') {
    window.toggleSidebar(forceState);
    return;
  }
}

/**
 * User Profile Popover Controller
 */
function toggleUserProfile(forceState) {
  const pop = document.getElementById('user-profile-popover');
  if (!pop) return;

  const isOpen = forceState !== undefined ? forceState : (pop.style.display === 'none' || !pop.style.display);
  pop.style.display = isOpen ? 'flex' : 'none';
}

/**
 * Theme Toggle Handler
 */
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  try {
    localStorage.setItem('theme', next);
  } catch {}
}

/**
 * Global click listener to close dropdowns when clicking outside
 */
function initDropdownCloseListeners() {
  document.addEventListener('click', (e) => {
    // Profile Popover
    const profilePopover = document.getElementById('user-profile-popover');
    const profileTrigger = e.target.closest('.gc-student-profile-pill') || e.target.closest('#gc-user-avatar');
    if (profilePopover && profilePopover.style.display !== 'none' && !profilePopover.contains(e.target) && !profileTrigger) {
      profilePopover.style.display = 'none';
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      toggleDrawer(false);
      toggleUserProfile(false);
      closeJoinModal();
      closeSelfAttendanceModal();
      closeStudentStreamModal();
    }
  });
}

/**
 * Self Attendance Modal Handlers
 */
function openSelfAttendanceModal() {
  const modal = document.getElementById('self-attendance-modal');
  if (modal) modal.classList.add('open');
}

function closeSelfAttendanceModal() {
  const modal = document.getElementById('self-attendance-modal');
  if (modal) modal.classList.remove('open');
}

function toggleSelfMethod() {
  const method = document.getElementById('self-method')?.value;
  const pinField = document.getElementById('pin-field');
  const qrField = document.getElementById('qr-field');
  if (pinField) pinField.style.display = method === 'PIN' ? 'block' : 'none';
  if (qrField) qrField.style.display = method === 'QR' ? 'block' : 'none';
}

document.getElementById('self-attendance-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentActiveSession) return;

  const method = document.getElementById('self-method')?.value;
  const btn = document.getElementById('submit-self-btn');
  if (btn) btn.disabled = true;

  try {
    const payload = { method };
    if (method === 'PIN') payload.pin = document.getElementById('self-pin')?.value.trim();
    if (method === 'QR') payload.qr_token = document.getElementById('self-qr')?.value.trim();

    const res = await fetchApi(`/attendance/sessions/${currentActiveSession.id}/self-attendance`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (res && res.success) {
      if (typeof showToast === 'function') showToast('Attendance submitted! Awaiting professor approval.', 'success');
      closeSelfAttendanceModal();
      const banner = document.getElementById('active-session-banner');
      if (banner) banner.style.display = 'none';
    }
  } catch (err) {
    if (btn) btn.disabled = false;
  }
});

/**
 * Mobile Floating Action Button (FAB) Handlers
 */
function toggleStudentFabMenu(forceState) {
  const menu = document.getElementById('student-fab-menu');
  const trigger = document.getElementById('student-fab-trigger');
  if (!menu || !trigger) return;

  const isOpen = forceState !== undefined ? forceState : (menu.style.display === 'none' || !menu.style.display);
  if (isOpen) {
    menu.style.display = 'flex';
    trigger.classList.add('is-open');
  } else {
    menu.style.display = 'none';
    trigger.classList.remove('is-open');
  }
}

document.addEventListener('click', (e) => {
  const wrapper = document.getElementById('student-fab-wrapper');
  if (wrapper && !wrapper.contains(e.target)) {
    toggleStudentFabMenu(false);
  }
});

/**
 * Join Class with Invite Code Modal Handlers
 */
function openStudentJoinModal() {
  const input = document.getElementById('join-invite-code');
  if (input) input.value = '';
  const err = document.getElementById('join-error-msg');
  if (err) err.style.display = 'none';
  const modal = document.getElementById('join-group-modal');
  if (modal) modal.style.display = 'flex';
  setTimeout(() => input?.focus(), 150);
}

function closeJoinModal() {
  const modal = document.getElementById('join-group-modal');
  if (modal) modal.style.display = 'none';
}

async function handleStudentJoinSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('join-invite-code');
  const errBox = document.getElementById('join-error-msg');
  const submitBtn = document.getElementById('btn-submit-join');

  const code = (input?.value || '').trim().toUpperCase();
  if (!code) {
    if (errBox) {
      errBox.textContent = 'Please enter an invite code';
      errBox.style.display = 'block';
    }
    return;
  }

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Joining...';
    }
    if (errBox) errBox.style.display = 'none';

    const res = await fetchApi('/teaching-groups/join', {
      method: 'POST',
      body: JSON.stringify({ invite_code: code })
    });

    if (res && res.success) {
      if (typeof showToast === 'function') showToast(res.message || 'Successfully joined class!', 'success');
      closeJoinModal();
      const joinedId = res.data?.id || res.data?.group_id;
      if (joinedId) {
        window.location.href = `/student/group-detail.html?id=${joinedId}`;
        return;
      }
      await loadEnrolledClasses();
    } else {
      throw new Error(res?.error?.message || res?.message || 'Failed to join group');
    }
  } catch (err) {
    if (errBox) {
      errBox.textContent = err.message || 'Invalid invite code or class not found';
      errBox.style.display = 'block';
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Join Class';
    }
  }
}

/**
 * Interactive Classroom Stream & Announcements Modal
 */
async function openStudentStreamModal(groupId, groupName, teacherName) {
  const modal = document.getElementById('student-stream-modal');
  if (!modal) return;

  const titleEl = document.getElementById('stream-class-name');
  if (titleEl) titleEl.innerText = groupName || 'Class Stream';

  const metaEl = document.getElementById('stream-class-meta');
  if (metaEl) metaEl.innerText = `Teacher: ${teacherName || 'Instructor'} • Announcements & Questions`;

  modal.style.display = 'flex';
  const container = document.getElementById('stream-posts-container');
  if (container) {
    container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 2rem;">Loading stream announcements...</div>';
  }

  try {
    const res = await fetchApi(`/teaching-groups/${groupId}/stream`);
    if (res && res.success && Array.isArray(res.data)) {
      if (res.data.length === 0) {
        if (container) {
          container.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); padding: 2.5rem 1rem;">
              <div style="font-size: 1.8rem; margin-bottom: 0.5rem;">📢</div>
              <h4 style="margin: 0 0 0.25rem 0; color: var(--text-main); font-weight: 700;">No Announcements Yet</h4>
              <p style="margin: 0; font-size: 0.85rem;">Your professor has not posted announcements for this class yet.</p>
            </div>
          `;
        }
      } else {
        if (container) {
          container.innerHTML = res.data.map(post => `
            <div class="card" style="padding: 1rem 1.15rem; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <strong style="font-size: 0.9rem; color: var(--text-main);">${escapeHtml(post.author_name || 'Instructor')}</strong>
                  <span class="badge" style="background: var(--chip-faculty-bg); color: var(--color-primary); font-size: 0.68rem; font-weight: 700;">TEACHER</span>
                </div>
                <span style="font-size: 0.72rem; color: var(--text-muted);">${typeof formatDate === 'function' ? formatDate(post.created_at) : (post.created_at || '').slice(0, 10)}</span>
              </div>
              <div style="font-size: 0.88rem; color: var(--text-main); line-height: 1.5; white-space: pre-wrap;">${escapeHtml(post.content || '')}</div>
              ${post.attachment_path ? `
                <div style="margin-top: 0.65rem; padding-top: 0.5rem; border-top: 1px solid var(--border-color);">
                  <a href="${post.attachment_path}" target="_blank" class="btn btn-secondary btn-sm" style="font-size: 0.75rem; display: inline-flex; align-items: center; gap: 0.35rem;">
                    <span>📎</span> <span>${escapeHtml(post.attachment_name || 'Attachment')}</span>
                  </a>
                </div>
              ` : ''}
            </div>
          `).join('');
        }
      }
    }
  } catch (err) {
    if (container) {
      container.innerHTML = `<div style="text-align: center; color: var(--status-absent); padding: 1.5rem;">Failed to load stream: ${escapeHtml(err.message)}</div>`;
    }
  }
}

function closeStudentStreamModal() {
  const modal = document.getElementById('student-stream-modal');
  if (modal) modal.style.display = 'none';
}

/**
 * Helper: Extract initials from a name (e.g. "Aarav Sharma" -> "AS")
 */
function getInitials(name) {
  if (!name || typeof name !== 'string') return 'ST';
  const clean = name.replace(/^(prof\.|dr\.|mr\.|ms\.|mrs\.)\s+/i, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase() || 'ST';
}

// Window interoperability exports
window.openJoinModal = openStudentJoinModal;
window.openStudentJoinModal = openStudentJoinModal;
window.closeJoinModal = closeJoinModal;
window.closeStudentJoinModal = closeJoinModal;
window.handleJoinSubmit = handleStudentJoinSubmit;
window.openStudentStream = openStudentStreamModal;
window.loadEnrolledClasses = loadEnrolledClasses;
window.handleClassesSearch = handleClassesSearch;
window.handleGlobalSearch = handleGlobalSearch;
window.setClassesFilter = setClassesFilter;
window.clearClassesFilter = clearClassesFilter;
window.toggleSidebar = toggleDrawer;
window.toggleDrawer = toggleDrawer;
window.toggleAppSidebar = toggleDrawer;
window.toggleUserProfile = toggleUserProfile;
window.toggleTheme = toggleTheme;
