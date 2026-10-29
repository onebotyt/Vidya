/**
 * ══════════════════════════════════════════════════════════════
 * VidyaOS V2 — STUDENT ATTENDANCE CONTROLLER
 * frontend-v2/student/attendance/attendance.js
 * 100% Theme Token Compliant — Zero Hardcoded Colors
 * Milestone 350 — Phase 4 Student Portal V2
 * ══════════════════════════════════════════════════════════════
 */

guardRoute(['STUDENT']);

// ── State ────────────────────────────────────────────────────
let _allSubjects = [];
let _currentSubjectId   = null;
let _currentSubjectName = '';
let _currentSubjectCode = '';
let _subjectHistory     = {};  // { subjectId|code: { 'YYYY-MM-DD': 'PRESENT'|'ABSENT' } }
let _activeSession      = null;

const _now = new Date();
let _selectedYear  = _now.getFullYear();
let _selectedMonth = _now.getMonth();

// ── Init ─────────────────────────────────────────────────────
async function initPage() {
  _syncDropdowns();
  await Promise.all([
    _checkLiveSession(),
    _loadAttendanceData()
  ]);
}

// ── Live Session ──────────────────────────────────────────────
async function _checkLiveSession() {
  try {
    const r = await fetchApi('/attendance/sessions?state=OPEN');
    const banner = document.getElementById('live-session-banner');
    if (r?.success && r.data?.length > 0) {
      _activeSession = r.data[0];
      _setText('live-subject-name', _activeSession.subject_name);
      _setText('live-teacher-name',
        `Teacher: ${_activeSession.teacher_name} • ${_activeSession.label || _activeSession.session_type}`
      );
      if (banner) banner.style.display = 'block';
    } else {
      if (banner) banner.style.display = 'none';
    }
  } catch { document.getElementById('live-session-banner').style.display = 'none'; }
}

async function submitLivePin() {
  if (!_activeSession) return;
  const pin = document.getElementById('live-pin-input')?.value.trim();
  if (!pin || pin.length !== 6) {
    if (typeof showToast === 'function') showToast('Please enter a valid 6-digit session PIN.', 'warning');
    return;
  }
  try {
    const r = await fetchApi(`/attendance/sessions/${_activeSession.id}/self-attendance`, {
      method: 'POST',
      body: JSON.stringify({ method: 'PIN', pin })
    });
    if (r?.success) {
      if (typeof showToast === 'function') showToast('Attendance submitted successfully!', 'success');
      document.getElementById('live-session-banner').style.display = 'none';
      await _loadAttendanceData();
    }
  } catch (err) {
    if (typeof showToast === 'function') showToast(err.message || 'Failed to submit attendance', 'error');
  }
}

// ── Load Attendance Data ──────────────────────────────────────
async function _loadAttendanceData() {
  try {
    const [statsRes, subsRes, histRes, profRes] = await Promise.all([
      fetchApi('/students/me/attendance/stats'),
      fetchApi('/students/me/attendance/subjects'),
      fetchApi('/students/me/attendance?limit=500'),
      fetchApi('/students/me')
    ]);

    // Identity badge
    if (profRes?.success && profRes.data) {
      const s = profRes.data;
      const rollTxt = s.class_roll_no ? `${s.class_roll_no}` : '—';
      const regTxt  = s.registration_no || '—';
      const badge   = document.getElementById('student-identity-badge');
      if (badge) {
        badge.innerHTML = `Roll: <strong>${rollTxt}</strong> • UBTER Reg: <strong>${regTxt}</strong>`;
        badge.style.display = 'inline-flex';
      }
    }

    // Overall stats
    if (statsRes?.success && statsRes.data) {
      const st  = statsRes.data;
      const pct = st.current_percentage ?? 0;
      const isDef = pct < 75.0 && (st.total_conducted ?? 0) > 0;

      _setText('overall-pct',    `${pct}%`);
      _setText('overall-counts', `${st.total_attended ?? 0} / ${st.total_conducted ?? 0} Sessions`);
      _setText('overall-msg',    st.prediction?.message || 'Attendance is within institutional requirements.');

      const card    = document.getElementById('standing-card');
      const badge   = document.getElementById('standing-badge');
      const pctEl   = document.getElementById('overall-pct');

      if (isDef) {
        if (card)  card.style.borderLeftColor = 'var(--status-absent)';
        if (badge) { badge.className = 'badge badge-absent'; badge.textContent = 'Attendance Deficit (< 75%)'; }
        if (pctEl) pctEl.style.color = 'var(--status-absent)';
      } else {
        if (card)  card.style.borderLeftColor = 'var(--status-present)';
        if (badge) { badge.className = 'badge badge-present'; badge.textContent = 'Eligible for Exams'; }
        if (pctEl) pctEl.style.color = 'var(--status-present)';
      }
    }

    // Build attendance history lookup
    _subjectHistory = {};
    if (histRes?.success && Array.isArray(histRes.data)) {
      histRes.data.forEach(item => {
        const dateStr = String(item.start_time).substring(0, 10);
        const sid  = item.subject_id;
        const code = item.subject_code;
        if (sid)  { if (!_subjectHistory[sid])  _subjectHistory[sid]  = {}; _subjectHistory[sid][dateStr]  = item.attendance_status; }
        if (code) { if (!_subjectHistory[code]) _subjectHistory[code] = {}; _subjectHistory[code][dateStr] = item.attendance_status; }
      });
    }

    // Render subject cards
    if (subsRes?.success) {
      _allSubjects = subsRes.data || [];
      _renderSubjectCards(_allSubjects);
      _handleDeepLink();
    }
  } catch (err) {
    console.error('[Attendance] Load error', err);
  }
}

function _handleDeepLink() {
  const params   = new URLSearchParams(window.location.search);
  const targetId = params.get('subject_id') || params.get('group_id');
  if (!targetId) return;
  const el = document.getElementById(`subject-card-${targetId}`);
  if (el) {
    setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.boxShadow = '0 0 0 3px var(--color-primary)';
      setTimeout(() => { el.style.transition = 'box-shadow 1s ease'; el.style.boxShadow = ''; }, 3000);
    }, 300);
  }
}

// ── Render Subject Cards ──────────────────────────────────────
function _renderSubjectCards(subjects) {
  const grid = document.getElementById('subjects-grid');
  if (!grid) return;

  if (!subjects.length) {
    grid.innerHTML = '<div class="card" style="text-align:center;padding:2.5rem;color:var(--text-muted);grid-column:1/-1;">No enrolled courses found for your cohort.</div>';
    return;
  }

  grid.innerHTML = subjects.map(s => {
    const isDef      = s.percentage < 75.0 && s.conducted > 0;
    const barColor   = isDef ? 'var(--status-absent)' : 'var(--status-present)';
    const topColor   = isDef ? 'var(--status-absent)' : 'var(--color-primary)';
    const subIdSafe  = s.subject_id || s.group_id || 0;
    const nameSafe   = (s.subject_name || '').replace(/'/g, "\\'");
    const codeSafe   = s.subject_code || '';

    return `
      <div class="subject-card" id="subject-card-${subIdSafe}"
           style="border-top-color:${topColor};"
           role="listitem">
        <div>
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.5rem;">
            <div>
              <span class="badge badge-pending" style="font-family:var(--font-mono,monospace);font-size:0.725rem;">${_esc(s.subject_code)}</span>
              <h3 style="font-size:1.1rem;font-weight:700;color:var(--text-main);margin:0.25rem 0 0;">${_esc(s.subject_name)}</h3>
            </div>
            <span class="badge" style="font-size:1.05rem;padding:0.25rem 0.6rem;background:${isDef ? 'var(--status-absent-bg)' : 'var(--status-present-bg)'};color:${isDef ? 'var(--status-absent)' : 'var(--status-present)'};border:1px solid ${isDef ? 'var(--status-absent)' : 'var(--status-present)'};">
              ${s.percentage}%
            </span>
          </div>

          <div class="pct-track" title="Attendance: ${s.percentage}% (Threshold: 75%)" role="progressbar" aria-valuenow="${s.percentage}" aria-valuemin="0" aria-valuemax="100">
            <div class="pct-marker-75" title="75% Threshold" aria-hidden="true"></div>
            <div class="pct-fill" style="width:${Math.min(100, s.percentage)}%;background:${barColor};"></div>
          </div>

          <div style="display:flex;justify-content:space-between;font-size:0.825rem;color:var(--text-muted);margin-bottom:1.25rem;">
            <div>Attended: <strong style="color:var(--text-main);">${s.attended}</strong> / ${s.conducted}</div>
            <div>Missed: <strong style="color:var(--status-absent);">${s.absent ?? (s.conducted - s.attended)}</strong></div>
          </div>
        </div>

        <div>
          <button type="button" class="btn btn-primary"
                  style="width:100%;font-weight:600;display:inline-flex;align-items:center;justify-content:center;gap:0.5rem;"
                  onclick="openCalendarModal(${subIdSafe}, '${nameSafe}', '${codeSafe}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <span>View Attendance Calendar →</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// ── Calendar Modal ────────────────────────────────────────────
function openCalendarModal(subjectId, subjectName, subjectCode) {
  _currentSubjectId   = subjectId;
  _currentSubjectName = subjectName;
  _currentSubjectCode = subjectCode;

  _setText('cal-sub-code', subjectCode);
  _setText('cal-sub-name', subjectName);

  // Auto-navigate to month with most recent recorded sessions
  const histMap  = _subjectHistory[subjectId] || _subjectHistory[subjectCode] || {};
  const recorded = Object.keys(histMap).sort();
  if (recorded.length > 0) {
    const latest      = recorded[recorded.length - 1];
    const [y, m]      = latest.split('-').map(Number);
    if (y && m) { _selectedYear = y; _selectedMonth = m - 1; }
  }

  _syncDropdowns();
  _renderCalendarGrid();
  const modal = document.getElementById('calendar-modal');
  if (modal) { modal.style.display = 'flex'; }
}

function closeCalendarModal() {
  const modal = document.getElementById('calendar-modal');
  if (modal) modal.style.display = 'none';
}

function _syncDropdowns() {
  const ms = document.getElementById('cal-month-select');
  const ys = document.getElementById('cal-year-select');
  if (ms) ms.value = _selectedMonth;
  if (ys) ys.value = _selectedYear;
}

function onMonthSelectChange() {
  _selectedMonth = parseInt(document.getElementById('cal-month-select').value, 10);
  _renderCalendarGrid();
}

function onYearSelectChange() {
  _selectedYear = parseInt(document.getElementById('cal-year-select').value, 10);
  _renderCalendarGrid();
}

function prevMonth() {
  _selectedMonth--;
  if (_selectedMonth < 0) { _selectedMonth = 11; _selectedYear--; }
  _syncDropdowns();
  _renderCalendarGrid();
}

function nextMonth() {
  _selectedMonth++;
  if (_selectedMonth > 11) { _selectedMonth = 0; _selectedYear++; }
  _syncDropdowns();
  _renderCalendarGrid();
}

// ── Render Calendar Grid ──────────────────────────────────────
function _renderCalendarGrid() {
  const grid = document.getElementById('calendar-grid');
  if (!grid) return;

  const WEEKDAYS = `
    <div class="cal-weekday sunday" role="columnheader">Sun</div>
    <div class="cal-weekday" role="columnheader">Mon</div>
    <div class="cal-weekday" role="columnheader">Tue</div>
    <div class="cal-weekday" role="columnheader">Wed</div>
    <div class="cal-weekday" role="columnheader">Thu</div>
    <div class="cal-weekday" role="columnheader">Fri</div>
    <div class="cal-weekday" role="columnheader">Sat</div>
  `;

  const firstDay   = new Date(_selectedYear, _selectedMonth, 1).getDay();
  const totalDays  = new Date(_selectedYear, _selectedMonth + 1, 0).getDate();
  const today      = new Date();
  const isCurrMonth = (today.getFullYear() === _selectedYear && today.getMonth() === _selectedMonth);
  const todayDate  = today.getDate();
  const records    = _subjectHistory[_currentSubjectId] || _subjectHistory[_currentSubjectCode] || {};

  let cells = '';
  let conducted = 0, attended = 0, absent = 0;

  // Leading empty
  for (let i = 0; i < firstDay; i++) cells += '<div class="cal-cell empty" role="gridcell"></div>';

  // Day cells
  for (let day = 1; day <= totalDays; day++) {
    const dow     = (firstDay + day - 1) % 7;
    const isSun   = dow === 0;
    const mStr    = String(_selectedMonth + 1).padStart(2, '0');
    const dStr    = String(day).padStart(2, '0');
    const dateKey = `${_selectedYear}-${mStr}-${dStr}`;
    const status  = records[dateKey];

    let cls   = 'cal-cell';
    let label = '';

    if (status === 'PRESENT' || status === 'LATE') {
      cls += ' attended-present'; label = '<span class="cal-cell-label">Present</span>'; conducted++; attended++;
    } else if (status === 'ABSENT') {
      cls += ' attended-absent'; label = '<span class="cal-cell-label">Absent</span>'; conducted++; absent++;
    } else if (isSun) {
      cls += ' sunday-holiday'; label = '<span class="cal-cell-label">Holiday</span>';
    }

    if (isCurrMonth && day === todayDate) cls += ' today-ring';

    cells += `
      <div class="${cls}" role="gridcell" title="${dateKey}: ${status || (isSun ? 'Sunday Holiday' : 'No Class')}">
        <span>${day}</span>${label}
      </div>
    `;
  }

  // Trailing empty
  const total    = firstDay + totalDays;
  const trailing = (7 - (total % 7)) % 7;
  for (let i = 0; i < trailing; i++) cells += '<div class="cal-cell empty" role="gridcell"></div>';

  grid.innerHTML = WEEKDAYS + cells;

  // Monthly summary
  const monthPct = conducted > 0 ? ((attended / conducted) * 100).toFixed(1) : '—';
  const statsEl  = document.getElementById('cal-month-stats');
  if (statsEl) {
    statsEl.innerHTML = `
      Sessions This Month: <strong>${conducted}</strong> &nbsp;|&nbsp;
      Attended: <strong style="color:var(--status-present);">${attended}</strong> &nbsp;|&nbsp;
      Absent: <strong style="color:var(--status-absent);">${absent}</strong> &nbsp;|&nbsp;
      Monthly Attendance: <strong>${monthPct}%</strong>
    `;
  }
}

// ── Keyboard ──────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeCalendarModal();
});

// ── Helpers ──────────────────────────────────────────────────
function _setText(id, text) {
  const el = typeof id === 'string' ? document.getElementById(id) : id;
  if (el) el.textContent = text;
}

function _esc(str) {
  if (str == null) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Window exports ────────────────────────────────────────────
window.openCalendarModal  = openCalendarModal;
window.closeCalendarModal = closeCalendarModal;
window.prevMonth          = prevMonth;
window.nextMonth          = nextMonth;
window.onMonthSelectChange= onMonthSelectChange;
window.onYearSelectChange = onYearSelectChange;
window.submitLivePin      = submitLivePin;

// ── Boot ─────────────────────────────────────────────────────
initPage();
