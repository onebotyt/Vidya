/**
 * ══════════════════════════════════════════════════════════════
 * PAGE LOGIC: REGISTERS (V2 COMPONENT-DRIVEN WORKSPACE)
 * frontend-v2/faculty/registers/registers.js
 * ══════════════════════════════════════════════════════════════
 */

guardRoute({ roles: ['TEACHER'], requireSubjects: true });

function getToken() {
  return typeof getAuthToken === 'function' ? getAuthToken() : (localStorage.getItem('access_token') || '');
}

// ─── STATE MANAGEMENT ───
let allRegisters = [];
let currentRegisterId = null;
let registerData = null;
let gridData = null;
let sessionsList = [];
let currentScansList = [];
let manualAbsentSet = new Set();
let currentActiveExamId = null;
let currentActiveTab = 'matrix'; // 'matrix' | 'assignments' | 'exams'
let currentSelectedMonth = null;
let pageSpreadMode = 'FULL'; // 'FULL' | 'PAGE_1' | 'PAGE_2'

// Live Roll Call Studio State
let currentRollCallMode = 'live';
let currentRollCallSession = null;
let rollCallClaimsPollTimer = null;
let rollCallExpiryTimer = null;
let activePinCode = null;
let activeQrToken = null;
let isLiveSessionStarted = false;

// Student status popover state
let activePopoverStudentId = null;

// Initialize Date in Toolbar
const todayStr = new Date().toISOString().slice(0, 10);
const syncDateEl = document.getElementById('sync-date');
if (syncDateEl) syncDateEl.value = todayStr;

// Helper: Escape HTML
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ─── INITIALIZATION ───
document.addEventListener('DOMContentLoaded', async () => {
  await loadRegistersList();
});

async function loadRegistersList() {
  try {
    const res = await fetchApi('/faculty/registers');
    if (res.success) {
      allRegisters = res.data || [];
      const user = getCurrentUser();
      const hasSubjects = Boolean(allRegisters.length > 0 || user?.is_hod);

      if (!hasSubjects) {
        document.getElementById('view-register-container').innerHTML = `
          <div class="card" style="text-align: center; padding: 3.5rem 2rem; color: var(--text-muted); background: var(--bg-surface); border: 1px dashed var(--border-color); margin-top: 1.5rem;">
            <div style="margin-bottom: 0.75rem; color: var(--color-primary); display: flex; justify-content: center;">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
            </div>
            <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.4rem; color: var(--text-main);">No Teaching Registers Allocated Yet</h3>
            <p style="font-size: 0.875rem; color: var(--text-muted); max-width: 540px; margin: 0 auto 1.5rem; line-height: 1.5;">
              Your Department HOD has not allocated any course subjects or official attendance registers to your profile yet. Once assigned, your digital register books will appear here automatically.
            </p>
            <a href="/faculty/dashboard.html" class="btn btn-secondary btn-sm">&larr; Back to Dashboard</a>
          </div>
        `;
        return;
      }

      renderRegisterSwitcher();

      const urlParams = new URLSearchParams(window.location.search);
      const regParam = urlParams.get('id');
      let targetId = regParam ? Number(regParam) : null;
      if (!targetId || !allRegisters.some(r => r.id === targetId)) {
        targetId = allRegisters[0]?.id;
      }

      const tabParam = urlParams.get('tab');
      if (tabParam) {
        switchRegisterTab(tabParam);
      }
      if (targetId) {
        await openRegister(targetId);
      }
    }
  } catch (err) {
    console.error('Error loading registers list:', err);
  }
}

function renderRegisterSwitcher() {
  const sel = document.getElementById('register-switcher-select');
  if (!sel) return;
  if (!allRegisters.length) {
    sel.innerHTML = '<option value="">No Registers Allocated</option>';
    return;
  }
  sel.innerHTML = allRegisters.map(r => {
    const isSel = r.id === currentRegisterId;
    const subj = r.subject_name || r.name || 'Subject';
    const code = r.subject_code ? ` [${r.subject_code}]` : '';
    const scope = r.session_type_scope || 'THEORY';
    const dept = r.department_name ? ` • ${r.department_name}` : '';
    const sem = r.semester ? ` Sem ${r.semester}` : '';
    const label = `${subj}${code} (${scope}${dept}${sem})`;
    return `<option value="${r.id}" ${isSel ? 'selected' : ''}>${label}</option>`;
  }).join('');
}

async function openRegister(registerId) {
  if (currentRegisterId !== registerId) {
    isLiveSessionStarted = false;
    currentRollCallSession = null;
    activePinCode = null;
    activeQrToken = null;
  }
  currentRegisterId = registerId;
  const tabSuffix = (currentActiveTab && currentActiveTab !== 'matrix') ? `&tab=${currentActiveTab}` : '';
  window.history.replaceState(null, '', `/faculty/registers.html?id=${registerId}${tabSuffix}`);

  const sel = document.getElementById('register-switcher-select');
  if (sel && sel.value !== String(registerId)) {
    sel.value = registerId;
  }

  await loadRegisterDetail();
  updateRegisterScopeBadges();
  loadRegisterTabsCount();
  if (currentActiveTab === 'assignments') {
    loadRegisterAssignments();
  } else if (currentActiveTab === 'exams') {
    loadRegisterExams();
  }
}

async function loadRegisterDetail(monthToLoad) {
  try {
    if (monthToLoad) currentSelectedMonth = monthToLoad;
    const qStr = currentSelectedMonth ? `?month=${currentSelectedMonth}` : '';
    const res = await fetchApi(`/faculty/registers/${currentRegisterId}${qStr}`);
    if (res.success) {
      registerData = res.data.register;
      gridData = res.data.grid;
      sessionsList = res.data.sessions || [];
      if (gridData.month) currentSelectedMonth = gridData.month;

      renderRegisterHeader();
      renderGridMatrix();
      renderSessionsList();
      checkEspStatus();
      updateRegisterScopeBadges();
    }
  } catch (err) {
    console.error('Error loading register detail:', err);
  }
}

function renderRegisterHeader() {
  const subjEl = document.getElementById('reg-meta-subject');
  if (subjEl) subjEl.innerText = `${registerData.subject_name || registerData.name} ${registerData.subject_code ? '(' + registerData.subject_code + ')' : ''}`;

  const paperEl = document.getElementById('reg-meta-paper');
  if (paperEl) paperEl.innerText = registerData.session_type_scope || 'THEORY';

  const classEl = document.getElementById('reg-meta-class');
  if (classEl) classEl.innerText = registerData.department_name || registerData.branch_name || 'Academic Cohort';

  const secEl = document.getElementById('reg-meta-section');
  const sessLabel = registerData.academic_year_label || 'Current Session';
  if (secEl) secEl.innerText = `${sessLabel} • Sem ${registerData.semester || 1}`;

  const officialBadge = document.getElementById('reg-badge-official');
  if (officialBadge) officialBadge.innerText = registerData.is_official ? 'Official Register' : 'Personal Register';

  const scopeBadge = document.getElementById('reg-badge-scope');
  if (scopeBadge) scopeBadge.innerText = registerData.session_type_scope || 'THEORY';

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const formatMonthLabel = (mStr) => {
    if (!mStr) return '';
    const [yr, mo] = mStr.split('-').map(Number);
    return `${monthNames[mo - 1]} ${yr}`;
  };

  const monthLabel = formatMonthLabel(gridData.month || currentSelectedMonth);
  const currMonthDisp = document.getElementById('current-month-display');
  if (currMonthDisp) currMonthDisp.innerText = monthLabel;

  const prntMonthTxt = document.getElementById('print-month-text');
  if (prntMonthTxt) prntMonthTxt.innerText = monthLabel.toUpperCase();

  const hiddenPicker = document.getElementById('hidden-month-picker');
  if (hiddenPicker) {
    hiddenPicker.value = gridData.month || currentSelectedMonth || todayStr.slice(0, 7);
  }
}

function openMonthPicker() {
  const inp = document.getElementById('hidden-month-picker');
  if (!inp) return;
  inp.value = currentSelectedMonth || todayStr.slice(0, 7);
  try {
    if (typeof inp.showPicker === 'function') {
      inp.showPicker();
    } else {
      inp.click();
    }
  } catch (err) {
    console.warn('showPicker:', err);
  }
}

function jumpToCurrentMonth() {
  const thisMonth = todayStr.slice(0, 7);
  if (currentSelectedMonth !== thisMonth) {
    changeRegisterMonth(thisMonth);
  }
}

function changeRegisterMonth(val) {
  if (!val || val === currentSelectedMonth) return;
  loadRegisterDetail(val);
}

function navigateMonth(delta) {
  if (!gridData || !gridData.available_months) return;
  const months = gridData.available_months;
  let currIdx = months.indexOf(currentSelectedMonth);
  if (currIdx === -1) currIdx = 0;
  let nextIdx = currIdx + delta;
  if (nextIdx >= 0 && nextIdx < months.length) {
    changeRegisterMonth(months[nextIdx]);
  } else {
    const [yr, mo] = (currentSelectedMonth || todayStr.slice(0, 7)).split('-').map(Number);
    const nextDt = new Date(yr, mo - 1 + delta, 1);
    const y = nextDt.getFullYear();
    const m = String(nextDt.getMonth() + 1).padStart(2, '0');
    changeRegisterMonth(`${y}-${m}`);
  }
}

// ─── MATRIX TABLE RENDERING ───
function renderGridMatrix() {
  const thead = document.getElementById('matrix-head');
  const tbody = document.getElementById('matrix-body');
  const tfoot = document.getElementById('matrix-foot');

  if (!gridData || !gridData.students || !gridData.students.length) {
    thead.innerHTML = '';
    tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">No enrolled students found in cohort roster.</td></tr>`;
    if (tfoot) tfoot.innerHTML = '';
    return;
  }

  const allDays = gridData.month_days || [];
  let daysToShow = allDays;
  const showSummaryColumns = (pageSpreadMode === 'FULL' || pageSpreadMode === 'PAGE_2');

  const finalizedSessions = gridData.finalized_sessions || [];
  const matrixCols = [];
  daysToShow.forEach(d => {
    const daySessions = finalizedSessions.filter(s => s.session_date === d.date);
    if (daySessions.length > 1) {
      daySessions.forEach((s, sIdx) => {
        const pNum = s.period_number || (sIdx + 1);
        matrixCols.push({
          ...d,
          period_number: pNum,
          session_id: s.id,
          col_key: `${d.date}_${pNum}`,
          session_key: `sess_${s.id}`,
          display_day: `${d.day} [P${pNum}]`,
          display_title: `${d.date} (${d.day_name}) — Period ${pNum}${s.label ? ': ' + s.label : ''}`,
          is_multi: true
        });
      });
    } else if (daySessions.length === 1) {
      const s = daySessions[0];
      const pNum = s.period_number || 1;
      matrixCols.push({
        ...d,
        period_number: pNum,
        session_id: s.id,
        col_key: d.date,
        session_key: `sess_${s.id}`,
        display_day: pNum > 1 ? `${d.day} [P${pNum}]` : `${d.day}`,
        display_title: `${d.date} (${d.day_name})${pNum > 1 ? ' — Period ' + pNum : ''}${d.holiday_label ? ' - ' + d.holiday_label : ''}`,
        is_multi: false
      });
    } else {
      matrixCols.push({
        ...d,
        period_number: 1,
        session_id: null,
        col_key: d.date,
        session_key: null,
        display_day: `${d.day}`,
        display_title: `${d.date} (${d.day_name})${d.holiday_label ? ' - ' + d.holiday_label : ''}`,
        is_multi: false
      });
    }
  });

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const [yr, mo] = (gridData.month || todayStr.slice(0, 7)).split('-').map(Number);
  const monthTitle = `${monthNames[mo - 1]?.toUpperCase() || ''} ${yr}`;

  // 1. Two-Tier Header
  let headHtml = `
    <tr>
      <th class="sticky-col-1" rowspan="2" style="width: 36px; font-size: 0.65rem; padding: 0.2rem;">Roll<br>No.</th>
      <th class="sticky-col-2" rowspan="2" style="width: 148px; min-width: 148px; max-width: 170px; font-size: 0.74rem; padding: 0.2rem 0.45rem;">Name</th>
      <th colspan="${matrixCols.length}" style="background: var(--table-th-bg); color: var(--table-th-color); font-size: 0.75rem; letter-spacing: 0.06em; text-transform: uppercase; padding: 0.2rem;">
        DATES OF LECTURE — ${monthTitle}
      </th>
  `;

  if (showSummaryColumns) {
    headHtml += `
      <th class="sticky-r-att-group" colspan="3" style="background: var(--col-att-group-bg); color: var(--col-att-group-color); font-size: 0.65rem; font-weight: 800; letter-spacing: 0.04em; padding: 0.2rem 0.1rem; width: 96px; text-align: center;">ATTENDED</th>
      <th class="sticky-r-abs-group" colspan="3" style="background: var(--col-abs-group-bg); color: var(--col-abs-group-color); font-size: 0.65rem; font-weight: 800; letter-spacing: 0.04em; padding: 0.2rem 0.1rem; width: 96px; text-align: center;">ABSENT</th>
      <th class="sticky-r-7" rowspan="2" style="background: var(--table-sticky-th-bg); color: var(--table-th-color); font-size: 0.65rem; padding: 0.2rem; width: 44px; text-align: center;">%</th>
      <th class="sticky-r-8" rowspan="2" style="background: var(--table-sticky-th-bg); color: var(--table-th-color); font-size: 0.65rem; padding: 0.2rem; width: 78px; text-align: center;">Remarks</th>
    `;
  }
  headHtml += `</tr><tr>`;

  matrixCols.forEach(col => {
    const isNonInst = col.is_holiday;
    const bg = isNonInst ? 'var(--col-holiday-bg)' : 'var(--table-bg)';
    const fg = isNonInst ? 'var(--col-holiday-color)' : 'var(--text-main)';
    const isToday = col.date === todayStr;

    if (isToday) {
      headHtml += `
        <th data-today="true" style="min-width: 28px; max-width: 38px; padding: 0.15rem 0.1rem;
            background: var(--color-primary); color: var(--color-on-primary, var(--text-white)); position: relative;"
            title="${col.display_title}">
          <div style="font-size: 0.68rem; font-weight: 900; font-family: var(--font-family-mono);">${col.display_day}</div>
          <div style="font-size: 0.52rem; font-weight: 700; opacity: 0.85;">${col.day_name.slice(0,3)}</div>
        </th>
      `;
    } else {
      headHtml += `
        <th style="min-width: 28px; max-width: 38px; padding: 0.15rem 0.1rem; background: ${bg}; color: ${fg};" title="${col.display_title}">
          <div style="font-size: 0.68rem; font-weight: 800; font-family: var(--font-family-mono);">${col.display_day}</div>
          <div style="font-size: 0.52rem; font-weight: 600; opacity: 0.75;">${col.day_name.slice(0,3)}</div>
        </th>
      `;
    }
  });

  if (showSummaryColumns) {
    headHtml += `
      <th class="sticky-r-1" style="background: var(--col-att-mo-bg); color: var(--col-att-mo-color); font-size: 0.6rem; padding: 0.15rem;" title="Attended in current month">Mo</th>
      <th class="sticky-r-2" style="background: var(--col-att-pr-bg); color: var(--col-att-pr-color); font-size: 0.6rem; padding: 0.15rem;" title="Attended prior to this month">Pr</th>
      <th class="sticky-r-3" style="background: var(--col-att-tt-bg); color: var(--col-att-tt-color); font-size: 0.62rem; font-weight: 900; padding: 0.15rem;" title="Total attended in session">Tt</th>
      <th class="sticky-r-4" style="background: var(--col-abs-mo-bg); color: var(--col-abs-mo-color); font-size: 0.6rem; padding: 0.15rem;" title="Absent in current month">Mo</th>
      <th class="sticky-r-5" style="background: var(--col-abs-pr-bg); color: var(--col-abs-pr-color); font-size: 0.6rem; padding: 0.15rem;" title="Absent prior to this month">Pr</th>
      <th class="sticky-r-6" style="background: var(--col-abs-tt-bg); color: var(--col-abs-tt-color); font-size: 0.62rem; font-weight: 900; padding: 0.15rem;" title="Total absent in session">Tt</th>
    `;
  }
  headHtml += `</tr>`;
  thead.innerHTML = headHtml;

  // 2. Identify Non-Instructional Holiday Columns
  const nonInstructionalSpans = new Set();
  daysToShow.forEach(d => {
    if (d.is_holiday) {
      const hasAnyRecord = gridData.students.some(st => Boolean(st.attendance_marks?.[d.date]));
      if (!hasAnyRecord) {
        nonInstructionalSpans.add(d.date);
      }
    }
  });

  // 3. Table Rows
  const totalStudents = gridData.students.length;
  tbody.innerHTML = gridData.students.map((st, sIdx) => {
    const isTransferred = st.enrollment_status === 'TRANSFERRED';
    const isDropped = st.enrollment_status === 'DROPPED';
    const rowClass = isTransferred ? 'row-transferred' : (isDropped ? 'row-dropped' : '');

    let cellsHtml = '';
    matrixCols.forEach(col => {
      if (nonInstructionalSpans.has(col.date)) {
        if (sIdx === 0) {
          const labelWords = (col.holiday_label || 'HOLIDAY').split(' ');
          const formattedLabel = labelWords.map(w => w.split('').join(' ')).join('   ');
          cellsHtml += `
            <td rowspan="${totalStudents}" class="vertical-holiday-cell" title="${col.holiday_label} (${col.date})">
              <div class="vertical-holiday-text">
                <span class="vertical-arrow-cap">↑</span>
                <span>${formattedLabel}</span>
                <span class="vertical-arrow-cap">↓</span>
              </div>
            </td>
          `;
        }
        return;
      }

      let mark = null;
      if (col.session_key && st.attendance_marks?.[col.session_key]) {
        mark = st.attendance_marks[col.session_key];
      } else if (col.col_key && st.attendance_marks?.[col.col_key]) {
        mark = st.attendance_marks[col.col_key];
      } else if (st.attendance_marks?.[col.date]) {
        mark = st.attendance_marks[col.date];
      }

      let penClass = 'empty';
      let penChar = '·';
      if (mark === 'PRESENT') { penClass = 'p'; penChar = 'P'; }
      else if (mark === 'ABSENT') { penClass = 'a'; penChar = 'A'; }
      else if (mark === 'LATE') { penClass = 'l'; penChar = 'L'; }

      if (isTransferred) {
        cellsHtml += `<td style="color: var(--text-muted); font-size: 0.7rem;">—</td>`;
      } else {
        cellsHtml += `
          <td style="padding: 2px;">
            <span class="pen-mark ${penClass}" 
                  onclick="toggleDigitalPen('${col.date}', ${st.student_id}, this, ${col.period_number}, ${col.session_id || 'null'})"
                  title="${escapeHtml(st.full_name)} on ${col.date} (P${col.period_number}): ${mark || 'Unmarked'}">
              ${penChar}
            </span>
          </td>
        `;
      }
    });

    let summaryHtml = '';
    if (showSummaryColumns) {
      const isDefaulter = st.is_defaulter;
      const pctColor = isDefaulter ? 'var(--status-absent)' : 'var(--status-present)';
      const pctBg = isDefaulter ? 'var(--status-absent-bg)' : 'var(--status-present-bg)';
      summaryHtml = `
        <td class="sticky-r-1" style="font-weight: 700; color: var(--col-att-mo-color); background: var(--col-att-mo-bg);">${st.month_attended}</td>
        <td class="sticky-r-2" style="color: var(--col-att-pr-color); background: var(--col-att-pr-bg);">${st.prev_attended}</td>
        <td class="sticky-r-3" style="font-weight: 900; color: var(--col-att-tt-color); background: var(--col-att-tt-bg);">${st.total_attended}</td>
        <td class="sticky-r-4" style="font-weight: 700; color: var(--col-abs-mo-color); background: var(--col-abs-mo-bg);">${st.month_absent}</td>
        <td class="sticky-r-5" style="color: var(--col-abs-pr-color); background: var(--col-abs-pr-bg);">${st.prev_absent}</td>
        <td class="sticky-r-6" style="font-weight: 900; color: var(--col-abs-tt-color); background: var(--col-abs-tt-bg);">${st.total_absent}</td>
        <td class="sticky-r-7" style="font-weight: 900; color: ${pctColor}; background: ${pctBg};">
          ${st.percentage}%
        </td>
        <td class="sticky-r-8" style="padding: 2px 3px; background: var(--table-stripe-bg); text-align: center;">
          <button type="button" class="remark-badge ${isTransferred ? 'transferred' : (isDropped ? 'dropped' : (parseFloat(st.percentage) >= 75 ? 'regular' : 'defaulter'))}"
                  onclick="openRemarkMenu(event, ${st.student_id}, '${st.enrollment_status || 'ENROLLED'}', '${escapeHtml(st.full_name)}')">
            <span class="remark-dot"></span>
            <span class="remark-text">${isTransferred ? 'Xfer' : (isDropped ? 'Drop' : (parseFloat(st.percentage) >= 75 ? 'Regular' : 'Below 75%'))}</span>
          </button>
        </td>
      `;
    }

    const cleanRoll = String(st.class_roll_no != null && String(st.class_roll_no) !== 'null' ? st.class_roll_no : (st.roll_number ? st.roll_number : (sIdx + 1))).replace(/^#/, '');

    return `
      <tr class="${rowClass}">
        <td class="sticky-col-1" style="text-align: center; font-weight: 800;">${cleanRoll}</td>
        <td class="sticky-col-2" title="${escapeHtml(st.full_name)}">
          <div style="font-weight: 700; color: var(--text-main); font-size: 0.74rem; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(st.full_name)}</div>
          <div style="font-size: 0.6rem; color: var(--text-muted); font-family: var(--font-family-mono); white-space: nowrap;">${escapeHtml(st.registration_no || st.official_enrollment_no || '—')}</div>
        </td>
        ${cellsHtml}
        ${summaryHtml}
      </tr>
    `;
  }).join('');

  // 4. Daily Present & Absent Totals in Tfoot
  if (tfoot) {
    let footP = `<tr><th class="sticky-col-1"></th><th class="sticky-col-2" style="font-size: 0.68rem; color: var(--status-present); font-weight: 800; text-align: left; padding: 0.2rem 0.45rem;">Total Present (P)</th>`;
    let footA = `<tr><th class="sticky-col-1"></th><th class="sticky-col-2" style="font-size: 0.68rem; color: var(--status-absent); font-weight: 800; text-align: left; padding: 0.2rem 0.45rem;">Total Absent (A)</th>`;

    matrixCols.forEach(col => {
      if (nonInstructionalSpans.has(col.date)) {
        footP += `<td class="vertical-holiday-cell" style="font-size: 0.7rem; color: var(--col-holiday-color);">—</td>`;
        footA += `<td class="vertical-holiday-cell" style="font-size: 0.7rem; color: var(--col-holiday-color);">—</td>`;
        return;
      }

      const daily = (col.session_key && gridData.daily_totals?.[col.session_key]) ||
                    (col.col_key && gridData.daily_totals?.[col.col_key]) ||
                    gridData.daily_totals?.[col.date];
      if (daily) {
        footP += `<td style="font-weight: 900; color: var(--status-present); font-size: 0.75rem;">P: ${daily.present}</td>`;
        footA += `<td style="font-weight: 900; color: var(--status-absent); font-size: 0.75rem;">A: ${daily.absent}</td>`;
      } else {
        footP += `<td style="color: var(--text-muted); font-size: 0.75rem;">—</td>`;
        footA += `<td style="color: var(--text-muted); font-size: 0.75rem;">—</td>`;
      }
    });

    if (showSummaryColumns) {
      footP += `<td colspan="8"></td>`;
      footA += `<td colspan="8"></td>`;
    }

    footP += `</tr>`;
    footA += `</tr>`;
    tfoot.innerHTML = footP + footA;
  }
}

// ─── DIGITAL PEN MARK TOGGLE ───
async function toggleDigitalPen(date, studentId, el, periodNumber, sessionId) {
  const currentMark = el.innerText.trim();
  let nextStatus = 'PRESENT';
  if (currentMark === 'P') nextStatus = 'ABSENT';
  else if (currentMark === 'A') nextStatus = 'LATE';
  else if (currentMark === 'L') nextStatus = 'CLEAR';
  else nextStatus = 'PRESENT';

  el.className = 'pen-mark ' + (nextStatus === 'CLEAR' ? 'empty' : nextStatus.toLowerCase());
  el.innerText = nextStatus === 'CLEAR' ? '·' : (nextStatus === 'PRESENT' ? 'P' : (nextStatus === 'ABSENT' ? 'A' : 'L'));

  try {
    const payload = { date, student_id: studentId, status: nextStatus };
    if (periodNumber) payload.period_number = periodNumber;
    if (sessionId) payload.session_id = sessionId;

    const res = await fetchApi(`/faculty/registers/${currentRegisterId}/mark-cell`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });

    if (res.success) {
      loadRegisterDetail(currentSelectedMonth);
    } else {
      showToast(res.error?.message || 'Could not update mark', 'error');
      loadRegisterDetail(currentSelectedMonth);
    }
  } catch (err) {
    showToast('Error updating attendance mark', 'error');
    loadRegisterDetail(currentSelectedMonth);
  }
}

function renderSessionsList() {
  const tbody = document.getElementById('sessions-table-body');
  if (!tbody) return;
  if (!sessionsList.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">No sessions recorded in this register yet.</td></tr>`;
    return;
  }
  tbody.innerHTML = sessionsList.map(s => `
    <tr>
      <td style="font-weight: 700; font-family: var(--font-family-mono);">${s.session_date}</td>
      <td>
        <div style="font-weight: 600;">${s.label || 'Class Session'}</div>
        <span class="badge" style="font-size: 0.68rem; margin-top: 2px;">Period ${s.period_number || 1}</span>
      </td>
      <td><span class="badge badge-late" style="font-size: 0.75rem;">${s.session_type}</span></td>
      <td>
        <span class="badge ${s.state === 'FINALIZED' ? 'badge-present' : 'badge-pending'}">
          ${s.state}
        </span>
      </td>
      <td style="text-align: center; font-weight: 600;">${gridData?.students?.length || 0}</td>
      <td style="text-align: right;">
        <span style="color:var(--status-present); font-size:0.8rem; font-weight:700;">Recorded</span>
      </td>
    </tr>
  `).join('');
}

// ─── TAB NAVIGATION ───
function switchRegisterTab(tabName) {
  if (tabName === 'marks') tabName = 'exams';
  if (!['matrix', 'assignments', 'exams'].includes(tabName)) tabName = 'matrix';
  currentActiveTab = tabName;

  const tabMatrix = document.getElementById('tab-btn-matrix');
  const tabAssign = document.getElementById('tab-btn-assignments');
  const tabExams = document.getElementById('tab-btn-exams');

  if (tabMatrix) {
    tabMatrix.classList.toggle('active', tabName === 'matrix');
    tabMatrix.setAttribute('aria-selected', tabName === 'matrix');
  }
  if (tabAssign) {
    tabAssign.classList.toggle('active', tabName === 'assignments');
    tabAssign.setAttribute('aria-selected', tabName === 'assignments');
  }
  if (tabExams) {
    tabExams.classList.toggle('active', tabName === 'exams');
    tabExams.setAttribute('aria-selected', tabName === 'exams');
  }

  const pMatrix = document.getElementById('tab-panel-matrix');
  const pAssign = document.getElementById('tab-panel-assignments');
  const pExams = document.getElementById('tab-panel-exams');

  if (pMatrix) pMatrix.style.display = tabName === 'matrix' ? 'block' : 'none';
  if (pAssign) pAssign.style.display = tabName === 'assignments' ? 'block' : 'none';
  if (pExams) pExams.style.display = tabName === 'exams' ? 'block' : 'none';

  const mControls = document.getElementById('matrix-quick-controls');
  const aControls = document.getElementById('assignments-quick-controls');
  const eControls = document.getElementById('exams-quick-controls');
  if (mControls) mControls.style.display = tabName === 'matrix' ? 'inline-flex' : 'none';
  if (aControls) aControls.style.display = tabName === 'assignments' ? 'inline-flex' : 'none';
  if (eControls) eControls.style.display = tabName === 'exams' ? 'inline-flex' : 'none';

  const u = new URL(window.location.href);
  if (currentRegisterId) u.searchParams.set('id', currentRegisterId);
  if (tabName === 'matrix') {
    u.searchParams.delete('tab');
  } else {
    u.searchParams.set('tab', tabName);
  }
  window.history.replaceState(null, '', u.toString());

  if (tabName === 'assignments') {
    loadRegisterAssignments();
  } else if (tabName === 'exams') {
    loadRegisterExams();
  }
}

function updateRegisterScopeBadges() {
  if (!registerData) return;
  const subjText = `${registerData.subject_name || registerData.name} ${registerData.subject_code ? '[' + registerData.subject_code + ']' : ''} • Year ${registerData.year || 1} Sem ${registerData.semester || 1}`;

  const aBadge = document.getElementById('assign-scope-badge');
  if (aBadge) aBadge.innerText = subjText;

  const eBadge = document.getElementById('exam-scope-badge');
  if (eBadge) eBadge.innerText = subjText;
}

function getRegisterQueryParams() {
  if (!registerData) return '';
  const params = new URLSearchParams();
  if (registerData.subject_id) params.set('subject_id', registerData.subject_id);
  if (registerData.department_id) params.set('department_id', registerData.department_id);
  if (registerData.branch_id) params.set('branch_id', registerData.branch_id);
  if (registerData.year) params.set('year', registerData.year);
  if (registerData.semester) params.set('semester', registerData.semester);
  if (registerData.academic_year_id) params.set('academic_year_id', registerData.academic_year_id);
  return params.toString();
}

async function loadRegisterTabsCount() {
  if (!registerData) return;
  const q = getRegisterQueryParams();
  try {
    const [assignRes, examRes] = await Promise.all([
      fetchApi(`/assignments?${q}`),
      fetchApi(`/exams?${q}`)
    ]);

    const assignCount = (assignRes.success && Array.isArray(assignRes.data)) ? assignRes.data.length : 0;
    const examCount = (examRes.success && Array.isArray(examRes.data)) ? examRes.data.length : 0;

    const bAssign = document.getElementById('badge-assignments-count');
    if (bAssign) bAssign.innerText = assignCount;
    const bExam = document.getElementById('badge-exams-count');
    if (bExam) bExam.innerText = examCount;
  } catch (err) {
    console.error('Error loading tab counts:', err);
  }
}

// ─── ESP32 DAY-ATTENDANCE SYNC ───
async function checkEspStatus() {
  const badge = document.getElementById('esp-status-badge');
  if (!badge || !currentRegisterId) return;
  try {
    const date = document.getElementById('sync-date')?.value || todayStr;
    const res = await fetchApi(`/attendance/registers/${currentRegisterId}/esp32-day-scans?date=${date}`);
    if (res.success && res.data) {
      const isOnline = res.data.device?.is_online;
      const scanCount = res.data.scans?.length || 0;
      if (isOnline) {
        badge.innerHTML = `<span class="badge badge-present" style="font-size: 0.68rem; padding: 0.15rem 0.45rem;">Online (${scanCount})</span>`;
      } else {
        badge.innerHTML = `<span class="badge badge-pending" style="font-size: 0.68rem; padding: 0.15rem 0.45rem;">Standby (${scanCount})</span>`;
      }
    } else {
      badge.innerHTML = `<span class="badge badge-pending" style="font-size: 0.68rem; padding: 0.15rem 0.45rem;">Ready</span>`;
    }
  } catch (err) {
    badge.innerHTML = `<span class="badge badge-pending" style="font-size: 0.68rem; padding: 0.15rem 0.45rem;">Ready</span>`;
  }
}

async function triggerEspDaySync() {
  if (!currentRegisterId) {
    showToast('Please select a register first', 'error');
    return;
  }
  const syncDate = document.getElementById('sync-date')?.value || todayStr;
  const btn = document.getElementById('btn-esp-sync');
  if (btn) { btn.disabled = true; btn.innerText = 'Syncing...'; }

  try {
    const res = await fetchApi(`/attendance/registers/${currentRegisterId}/esp32-day-scans?date=${syncDate}`);
    if (res.success) {
      currentScansList = res.data?.scans || [];
      const countEl = document.getElementById('esp-scanned-count');
      if (countEl) countEl.innerText = currentScansList.length;

      const desc = document.getElementById('esp-confirm-desc');
      if (desc) {
        desc.innerHTML = `Found <strong>${currentScansList.length}</strong> scan records for <strong>${syncDate}</strong>. Verify students, then click <strong>Confirm & Add to Register</strong>.`;
      }

      const tbody = document.getElementById('esp-scans-tbody');
      if (!currentScansList.length) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">No scans recorded on ${syncDate} for this cohort.</td></tr>`;
      } else {
        tbody.innerHTML = currentScansList.map((s, idx) => `
          <tr>
            <td style="text-align: center;">
              <input type="checkbox" class="esp-chk" value="${s.student_id}" checked>
            </td>
            <td style="font-weight: 700;">${String(s.class_roll_no || (idx + 1)).replace(/^#/, '')}</td>
            <td style="font-family: var(--font-family-mono); font-size: 0.78rem; color: var(--text-muted);">${escapeHtml(s.registration_no || '—')}</td>
            <td style="font-weight: 600;">${escapeHtml(s.full_name)}</td>
            <td style="font-family: var(--font-family-mono); font-size: 0.78rem; color: var(--text-muted);">${escapeHtml(s.official_enrollment_no || '—')}</td>
            <td style="text-align: right; font-family: var(--font-family-mono); font-size: 0.78rem;">${s.scan_time ? s.scan_time.slice(11, 19) : '—'}</td>
          </tr>
        `).join('');
      }

      document.getElementById('esp-confirm-modal').classList.add('open');
    } else {
      showToast(res.error?.message || 'Failed to fetch ESP scans', 'error');
    }
  } catch (err) {
    showToast('Error syncing ESP scans: ' + err.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerText = 'Sync ESP Scans'; }
  }
}

function toggleAllEspCheckboxes(checked) {
  document.querySelectorAll('.esp-chk').forEach(cb => cb.checked = checked);
}

async function submitEspConfirmation() {
  const syncDate = document.getElementById('sync-date')?.value || todayStr;
  const checkedBoxes = Array.from(document.querySelectorAll('.esp-chk:checked'));
  const studentIds = checkedBoxes.map(cb => Number(cb.value));

  const btn = document.getElementById('btn-confirm-save-esp');
  if (btn) { btn.disabled = true; btn.innerText = 'Saving...'; }

  try {
    const res = await fetchApi(`/attendance/registers/${currentRegisterId}/confirm-day-attendance`, {
      method: 'POST',
      body: JSON.stringify({
        date: syncDate,
        student_ids: studentIds
      })
    });

    if (res.success) {
      showToast(`Successfully confirmed attendance for ${studentIds.length} students on ${syncDate}!`, 'success');
      closeModal('esp-confirm-modal');
      loadRegisterDetail(currentSelectedMonth);
    } else {
      showToast(res.error?.message || 'Could not save attendance', 'error');
    }
  } catch (err) {
    showToast('Failed to confirm attendance: ' + err.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerText = 'Confirm & Add to Register'; }
  }
}

// ─── ROLL CALL & LIVE ATTENDANCE STUDIO ───
async function openQuickMarkModal() {
  const students = gridData?.students || [];
  if (!students.length) {
    showToast('No students enrolled in this cohort.', 'error');
    return;
  }

  const date = document.getElementById('sync-date')?.value || todayStr;
  const subName = registerData?.subject_name || 'Register Cohort';

  const subjElem = document.getElementById('rc-modal-subject');
  const dateElem = document.getElementById('rc-modal-date');
  if (subjElem) subjElem.innerText = subName;
  if (dateElem) dateElem.innerText = date;

  manualAbsentSet.clear();
  document.getElementById('manual-roll-modal').classList.add('open');
  await switchRollCallMode('live');
}

function closeRollCallModal() {
  if (rollCallClaimsPollTimer) {
    clearInterval(rollCallClaimsPollTimer);
    rollCallClaimsPollTimer = null;
  }
  if (rollCallExpiryTimer) {
    clearInterval(rollCallExpiryTimer);
    rollCallExpiryTimer = null;
  }
  document.getElementById('manual-roll-modal').classList.remove('open');
}

async function switchRollCallMode(mode) {
  currentRollCallMode = mode;

  const tabLive = document.getElementById('rc-tab-btn-live');
  const tabManual = document.getElementById('rc-tab-btn-manual');
  if (tabLive) tabLive.classList.toggle('active', mode === 'live');
  if (tabManual) tabManual.classList.toggle('active', mode === 'manual');

  const viewLive = document.getElementById('rc-view-live');
  const viewManual = document.getElementById('rc-view-manual');
  if (viewLive) viewLive.style.display = mode === 'live' ? 'block' : 'none';
  if (viewManual) viewManual.style.display = mode === 'manual' ? 'block' : 'none';

  const footerLive = document.getElementById('rc-footer-live');
  const footerManual = document.getElementById('rc-footer-manual');
  if (footerLive) footerLive.style.display = mode === 'live' ? 'flex' : 'none';
  if (footerManual) footerManual.style.display = mode === 'manual' ? 'flex' : 'none';

  if (mode === 'live') {
    renderLiveAttendanceState();
    if (isLiveSessionStarted && currentRollCallSession) {
      startClaimsPolling(currentRollCallSession.id);
    }
  } else {
    renderQuickRoster();
  }
}

function renderLiveAttendanceState() {
  const banner = document.getElementById('rc-live-starter-banner');
  const activeCont = document.getElementById('rc-live-active-container');

  if (!isLiveSessionStarted) {
    if (banner) banner.style.display = 'block';
    if (activeCont) activeCont.style.display = 'none';
  } else {
    if (banner) banner.style.display = 'none';
    if (activeCont) activeCont.style.display = 'block';
  }
}

async function ensureActiveRollCallSession() {
  if (!currentRegisterId) return null;
  const date = document.getElementById('sync-date')?.value || todayStr;
  const periodNum = parseInt(document.getElementById('rc-modal-period')?.value) || 1;

  let sess = sessionsList?.find(s => s.session_date === date && ((s.period_number || 1) === periodNum));
  if (!sess) {
    try {
      const res = await fetchApi(`/faculty/registers/${currentRegisterId}/sessions`, {
        method: 'POST',
        body: JSON.stringify({
          session_date: date,
          session_type: registerData?.session_type_scope || 'THEORY',
          label: `Class ${(sessionsList?.length || 0) + 1} (Period ${periodNum})`,
          period_number: periodNum
        })
      });
      if (res.success && res.data) {
        sess = res.data;
        if (sessionsList) sessionsList.push(sess);
      }
    } catch (err) {
      console.warn('Could not auto-create session:', err);
    }
  }

  if (sess && sess.state === 'DRAFT') {
    try {
      await fetchApi(`/attendance/sessions/${sess.id}/state`, {
        method: 'PUT',
        body: JSON.stringify({ state: 'OPEN' })
      });
      sess.state = 'OPEN';
    } catch (e) {}
  }

  currentRollCallSession = sess;
  return sess;
}

async function startLiveAttendanceSession() {
  const btn = document.getElementById('btn-generate-live-session');
  if (btn) btn.disabled = true;

  try {
    const sess = await ensureActiveRollCallSession();
    if (!sess) {
      showToast('Unable to open live class session', 'error');
      return;
    }
    await Promise.all([
      generateNewQr(false),
      generateNewPin(false)
    ]);
    isLiveSessionStarted = true;
    renderLiveAttendanceState();
    startClaimsPolling(sess.id);
    showToast('Dynamic QR & 6-Digit PIN generated successfully!', 'success');
  } catch (err) {
    showToast('Failed to start live session: ' + err.message, 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function regenerateLiveAttendanceSession() {
  const btn = document.getElementById('btn-refresh-live-session');
  if (btn) btn.disabled = true;

  try {
    await Promise.all([
      generateNewQr(false),
      generateNewPin(false)
    ]);
    showToast('QR Code & 6-Digit PIN refreshed!', 'success');
  } catch (err) {
    showToast('Failed to refresh session: ' + err.message, 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function generateNewQr(showSuccessToast = true) {
  const sess = await ensureActiveRollCallSession();
  if (!sess) return;
  try {
    const res = await fetchApi(`/attendance/sessions/${sess.id}/qr`, { method: 'POST' });
    if (res.success && res.data) {
      const { token_hash, expires_at, payload } = res.data;
      activeQrToken = token_hash;
      const tokenDisplay = document.getElementById('rc-qr-token-display');
      if (tokenDisplay) {
        tokenDisplay.innerText = token_hash || '—';
      }

      const encoded = encodeURIComponent(payload);
      const qrImg = document.getElementById('rc-qr-code-img');
      if (qrImg) {
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}&margin=6`;
      }

      startCountdownTimer(expires_at, 'rc-expiry-timer');
      if (showSuccessToast) showToast('Dynamic QR code refreshed!', 'success');
    }
  } catch (err) {
    showToast('Failed to generate dynamic QR: ' + err.message, 'error');
  }
}

function copyQrToken() {
  if (!activeQrToken) return;
  navigator.clipboard.writeText(activeQrToken).then(() => {
    showToast('QR Token copied to clipboard!', 'success');
  }).catch(() => {
    showToast('Token: ' + activeQrToken, 'info');
  });
}

async function generateNewPin(showSuccessToast = true) {
  const sess = await ensureActiveRollCallSession();
  if (!sess) return;
  try {
    const res = await fetchApi(`/attendance/sessions/${sess.id}/pin`, { method: 'POST' });
    if (res.success && res.data) {
      const { pin, expires_at } = res.data;
      activePinCode = pin;
      renderPinBoxes(pin);
      startCountdownTimer(expires_at, 'rc-expiry-timer');
      if (showSuccessToast) showToast(`Generated 6-Digit PIN: ${pin}`, 'success');
    }
  } catch (err) {
    showToast('Failed to generate 6-digit PIN: ' + err.message, 'error');
  }
}

function renderPinBoxes(pin) {
  const qrPinElem = document.getElementById('rc-qr-pin-display');
  if (qrPinElem) {
    qrPinElem.innerText = pin ? `PIN: ${pin}` : 'PIN: —';
  }
  const container = document.getElementById('pin-digits-container');
  if (container) {
    container.innerText = pin || '';
  }
}

function copyPinCode() {
  if (!activePinCode) return;
  navigator.clipboard.writeText(activePinCode).then(() => {
    showToast(`PIN Code ${activePinCode} copied!`, 'success');
  }).catch(() => {
    showToast('PIN: ' + activePinCode, 'info');
  });
}

function startCountdownTimer(expiresAt, elementId) {
  if (rollCallExpiryTimer) clearInterval(rollCallExpiryTimer);
  const targetTime = new Date(expiresAt).getTime();

  const updateDisplay = () => {
    const remainingMs = targetTime - Date.now();
    const elem = document.getElementById(elementId);
    if (!elem) return;
    if (remainingMs <= 0) {
      elem.innerText = 'EXPIRED';
      elem.style.color = 'var(--status-absent)';
      clearInterval(rollCallExpiryTimer);
      isLiveSessionStarted = false;
      return;
    }
    elem.style.color = 'var(--color-primary)';
    const totalSec = Math.floor(remainingMs / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    elem.innerText = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  updateDisplay();
  rollCallExpiryTimer = setInterval(updateDisplay, 1000);
}

function startClaimsPolling(sessionId) {
  if (rollCallClaimsPollTimer) clearInterval(rollCallClaimsPollTimer);

  const poll = async () => {
    try {
      const res = await fetchApi(`/attendance/sessions/${sessionId}/self-attendance`);
      if (res.success && Array.isArray(res.data)) {
        const count = res.data.length;
        const countElem = document.getElementById('rc-claim-count');
        const rosterElem = document.getElementById('rc-claims-roster');
        const statusElem = document.getElementById('rc-claims-status');

        if (countElem) countElem.innerText = count;
        if (statusElem) statusElem.innerText = `${count} student(s) marked attendance`;

        if (rosterElem) {
          if (count === 0) {
            rosterElem.innerHTML = `
              <div style="height: 100%; min-height: 180px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-muted); text-align: center; gap: 0.4rem; padding: 1rem;">
                <div style="color: var(--text-muted); opacity: 0.7; margin-bottom: 0.2rem;">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"></path><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"></path><circle cx="12" cy="12" r="2"></circle><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"></path><path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1"></path></svg>
                </div>
                <div style="font-size: 0.82rem; font-weight: 600; color: var(--text-main);">No check-ins yet</div>
                <div style="font-size: 0.74rem;">Students scanning the QR code or entering the PIN will appear here live in real-time.</div>
              </div>
            `;
          } else {
            rosterElem.innerHTML = res.data.map(req => {
              const rollDisp = req.class_roll_no != null && String(req.class_roll_no) !== 'null' ? `Roll ${String(req.class_roll_no).replace(/^#/, '')}` : '';
              const isQr = (req.verification_method || '').toUpperCase().includes('QR');
              const methodLabel = isQr ? 'QR Scan' : 'PIN Entry';
              const timeStr = req.timestamp ? new Date(req.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now';
              return `
                <div style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 0.45rem 0.65rem;">
                  <div>
                    <div style="font-weight: 700; color: var(--text-main); font-size: 0.82rem;">${rollDisp ? rollDisp + ' • ' : ''}${escapeHtml(req.full_name)}</div>
                    <div style="font-size: 0.7rem; color: var(--text-muted);">${methodLabel} • ${timeStr}</div>
                  </div>
                  <span class="badge badge-present" style="font-size: 0.68rem;">Present</span>
                </div>
              `;
            }).join('');
          }
        }
      }
    } catch (e) {}
  };

  poll();
  rollCallClaimsPollTimer = setInterval(poll, 3500);
}

async function finalizeClaimsAttendance(source) {
  const sess = currentRollCallSession;
  const date = document.getElementById('sync-date')?.value || todayStr;

  try {
    let claims = [];
    if (sess) {
      const cRes = await fetchApi(`/attendance/sessions/${sess.id}/self-attendance`);
      if (cRes.success) claims = cRes.data || [];
    }

    const claimedStudentIds = new Set(claims.map(c => c.student_id));
    const students = gridData?.students || [];

    let presentIds = [];
    if (source === 'LIVE') {
      if (claimedStudentIds.size === 0) {
        showToast('No students have checked in via QR or PIN yet.', 'warning');
        return;
      }
      presentIds = Array.from(claimedStudentIds);
    } else {
      presentIds = students.filter(st => !manualAbsentSet.has(st.student_id)).map(st => st.student_id);
    }

    const res = await fetchApi(`/attendance/registers/${currentRegisterId}/confirm-day-attendance`, {
      method: 'POST',
      body: JSON.stringify({
        date,
        student_ids: presentIds
      })
    });

    if (res.success) {
      showToast(`Successfully confirmed ${presentIds.length} student attendance records for ${date}!`, 'success');
      isLiveSessionStarted = false;
      closeRollCallModal();
      loadRegisterDetail(currentSelectedMonth);
    }
  } catch (err) {
    showToast('Error finalizing attendance: ' + err.message, 'error');
  }
}

function renderQuickRoster() {
  const grid = document.getElementById('quick-roster-grid');
  if (!grid) return;
  const students = gridData?.students || [];
  grid.innerHTML = students.map(st => {
    const isAbsent = manualAbsentSet.has(st.student_id);
    const rollDisplay = (st.class_roll_no != null && String(st.class_roll_no) !== 'null') ? String(st.class_roll_no).replace(/^#/, '') : '—';
    return `
      <div onclick="toggleManualAbsent(${st.student_id})" class="roster-card ${isAbsent ? 'absent' : 'present'}">
        <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700;">Roll ${rollDisplay}</div>
        <div style="font-weight: 700; font-size: 0.84rem; margin: 0.15rem 0;">${escapeHtml(st.full_name.split(' ')[0])}</div>
        <div style="font-size: 0.7rem; font-weight: 800;">${isAbsent ? 'ABSENT' : 'PRESENT'}</div>
      </div>
    `;
  }).join('');

  const total = students.length;
  const absent = manualAbsentSet.size;
  const pCount = document.getElementById('q-present-count');
  const aCount = document.getElementById('q-absent-count');
  const tCount = document.getElementById('q-total-count');
  if (pCount) pCount.innerText = total - absent;
  if (aCount) aCount.innerText = absent;
  if (tCount) tCount.innerText = total;
}

function toggleManualAbsent(studentId) {
  if (manualAbsentSet.has(studentId)) {
    manualAbsentSet.delete(studentId);
  } else {
    manualAbsentSet.add(studentId);
  }
  renderQuickRoster();
}

function markAllManual(isAbsent) {
  manualAbsentSet.clear();
  if (isAbsent) {
    (gridData?.students || []).forEach(st => manualAbsentSet.add(st.student_id));
  }
  renderQuickRoster();
}

async function submitManualAttendance() {
  const date = document.getElementById('sync-date')?.value || todayStr;
  const students = gridData?.students || [];
  const presentIds = students.filter(st => !manualAbsentSet.has(st.student_id)).map(st => st.student_id);

  const btn = document.getElementById('btn-save-manual-rc');
  if (btn) btn.disabled = true;

  try {
    const res = await fetchApi(`/attendance/registers/${currentRegisterId}/confirm-day-attendance`, {
      method: 'POST',
      body: JSON.stringify({
        date,
        student_ids: presentIds
      })
    });
    if (res.success) {
      showToast(`Saved attendance for ${presentIds.length} present students!`, 'success');
      closeRollCallModal();
      loadRegisterDetail(currentSelectedMonth);
    }
  } catch (err) {
    showToast('Failed to save attendance: ' + err.message, 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

// Compatibility stubs
function initLiveAttendanceTogether() {
  renderLiveAttendanceState();
}
function onRollCallPeriodChange() {
  currentRollCallSession = null;
  isLiveSessionStarted = false;
  renderLiveAttendanceState();
  if (currentRollCallMode === 'manual') renderQuickRoster();
}

// ─── COURSEWORK / ASSIGNMENTS ───
let currentRegisterAssignments = [];

async function loadRegisterAssignments() {
  const container = document.getElementById('register-assignments-list');
  if (!container) return;
  if (!registerData) {
    container.innerHTML = `<div class="card" style="text-align:center; padding:2rem; color:var(--text-muted);">Please select a register first.</div>`;
    return;
  }
  container.innerHTML = `<div class="card" style="text-align:center; padding:2.5rem; color:var(--text-muted);">Loading assignments...</div>`;

  try {
    const q = getRegisterQueryParams();
    const res = await fetchApi(`/assignments?${q}`);
    if (!res.success || !Array.isArray(res.data) || !res.data.length) {
      container.innerHTML = `
        <div class="card" style="text-align:center; padding:3rem 2rem; color:var(--text-muted); background:var(--bg-surface); border:1px dashed var(--border-color);">
          <h3 style="font-size:1.15rem; font-weight:700; color:var(--text-main); margin-bottom:0.35rem;">No Assignments Created Yet</h3>
          <p style="font-size:0.85rem; max-width:480px; margin:0 auto 1.25rem;">
            No homework or coursework tasks have been published for this subject yet.
          </p>
          <button type="button" class="btn btn-primary btn-sm" onclick="openCreateAssignmentModal()">+ Create Assignment</button>
        </div>
      `;
      const b = document.getElementById('badge-assignments-count');
      if (b) b.innerText = '0';
      return;
    }

    currentRegisterAssignments = res.data;
    const b = document.getElementById('badge-assignments-count');
    if (b) b.innerText = currentRegisterAssignments.length;

    container.innerHTML = currentRegisterAssignments.map(a => {
      const dueStr = a.due_date ? new Date(a.due_date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'No deadline';
      return `
        <div class="card" style="margin-bottom: 1rem; border: 1px solid var(--border-color); background: var(--bg-card); padding: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem;">
            <div>
              <div style="font-weight: 800; font-size: 1.05rem; color: var(--text-main);">${escapeHtml(a.title)}</div>
              <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">
                Due: <strong style="color: var(--status-late);">${dueStr}</strong> • Max Marks: <strong>${a.max_marks || 20}</strong>
              </div>
              ${a.description ? `<p style="font-size: 0.85rem; color: var(--text-muted); margin: 0.5rem 0 0;">${escapeHtml(a.description)}</p>` : ''}
            </div>
            <span class="badge ${a.submission_count > 0 ? 'badge-present' : 'badge-pending'}">
              ${a.submission_count || 0} Submitted
            </span>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="deleteAssignment(${a.id}, '${escapeHtml(a.title)}')">Delete</button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<div class="card" style="color:var(--status-absent); padding:1.5rem;">Failed to load assignments: ${err.message}</div>`;
  }
}

function openCreateAssignmentModal() {
  if (!registerData) {
    showToast('Please select a register first', 'error');
    return;
  }
  const scopeEl = document.getElementById('modal-assign-scope-text');
  if (scopeEl) {
    scopeEl.innerText = `${registerData.subject_name || registerData.name} • Sem ${registerData.semester || 1}`;
  }
  const dueInput = document.getElementById('assign-due-date');
  if (dueInput && !dueInput.value) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 0, 0);
    dueInput.value = tomorrow.toISOString().slice(0, 16);
  }
  document.getElementById('create-assignment-modal').classList.add('open');
}

function onRegisterAssignNumChange(val) {
  const titleInp = document.getElementById('assign-title');
  if (!titleInp) return;
  if (val && val !== 'CUSTOM') {
    titleInp.value = `Assignment ${val}`;
  }
}

async function submitRegisterAssignment(e) {
  e.preventDefault();
  if (!registerData) return;

  const saveBtn = document.getElementById('btn-save-assignment');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.innerText = 'Publishing...'; }

  const numVal = document.getElementById('assign-num-select')?.value || '1';
  let title = document.getElementById('assign-title').value.trim();
  if (numVal !== 'CUSTOM' && !/^(?:Assignment|Assign|A)\s*\d+/i.test(title)) {
    title = `Assignment ${numVal}: ${title}`;
  }

  const fd = new FormData();
  fd.append('title', title);
  fd.append('description', document.getElementById('assign-desc').value.trim());
  fd.append('due_date', document.getElementById('assign-due-date').value || '');
  fd.append('max_marks', document.getElementById('assign-total-marks').value || 20);
  fd.append('subject_id', registerData.subject_id);
  fd.append('department_id', registerData.department_id);
  if (registerData.branch_id) fd.append('branch_id', registerData.branch_id);
  fd.append('year', registerData.year || 1);
  fd.append('semester', registerData.semester || 1);

  const fileInput = document.getElementById('assign-file');
  if (fileInput && fileInput.files[0]) {
    fd.append('attachment', fileInput.files[0]);
  }

  try {
    const res = await fetchApi('/assignments', {
      method: 'POST',
      body: fd
    });
    if (res.success) {
      showToast('Assignment published successfully!', 'success');
      document.getElementById('create-assignment-form').reset();
      closeModal('create-assignment-modal');
      loadRegisterAssignments();
      loadRegisterTabsCount();
    } else {
      showToast(res.error?.message || 'Could not publish assignment', 'error');
    }
  } catch (err) {
    showToast('Failed to publish assignment: ' + err.message, 'error');
  } finally {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.innerText = 'Publish Assignment'; }
  }
}

async function deleteAssignment(id, title) {
  const confirmed = await openConfirm({
    title: 'Delete Assignment',
    message: `Are you sure you want to permanently delete "${title}"? All submissions will be removed.`,
    confirmText: 'Yes, Delete',
    confirmClass: 'btn-danger'
  });
  if (!confirmed) return;

  try {
    const res = await fetchApi(`/assignments/${id}`, { method: 'DELETE' });
    if (res.success) {
      showToast('Assignment deleted', 'success');
      loadRegisterAssignments();
      loadRegisterTabsCount();
    } else {
      showToast(res.error?.message || 'Failed to delete assignment', 'error');
    }
  } catch (err) {
    showToast('Error deleting assignment', 'error');
  }
}

// ─── CLASS TESTS & MARKS ───
let currentRegisterExams = [];

async function loadRegisterExams() {
  const container = document.getElementById('register-exams-list');
  if (!container) return;
  if (!registerData) {
    container.innerHTML = `<div class="card" style="text-align:center; padding:2rem; color:var(--text-muted);">Please select a register first.</div>`;
    return;
  }
  container.innerHTML = `<div class="card" style="text-align:center; padding:2.5rem; color:var(--text-muted);">Loading class tests...</div>`;

  try {
    const q = getRegisterQueryParams();
    const res = await fetchApi(`/exams?${q}`);
    if (!res.success || !Array.isArray(res.data) || !res.data.length) {
      container.innerHTML = `
        <div class="card" style="text-align:center; padding:3rem 2rem; color:var(--text-muted); background:var(--bg-surface); border:1px dashed var(--border-color);">
          <h3 style="font-size:1.15rem; font-weight:700; color:var(--text-main); margin-bottom:0.35rem;">No Tests or Marksheets Scheduled Yet</h3>
          <p style="font-size:0.85rem; max-width:480px; margin:0 auto 1.25rem;">
            No unit tests or exams scheduled for this subject yet.
          </p>
          <button type="button" class="btn btn-primary btn-sm" onclick="openCreateExamModal()">+ Schedule Class Test</button>
        </div>
      `;
      const b = document.getElementById('badge-exams-count');
      if (b) b.innerText = '0';
      return;
    }

    currentRegisterExams = res.data;
    const b = document.getElementById('badge-exams-count');
    if (b) b.innerText = currentRegisterExams.length;

    container.innerHTML = currentRegisterExams.map(ex => {
      const dtStr = ex.exam_date ? new Date(ex.exam_date).toLocaleDateString('en-IN') : 'Date not set';
      return `
        <div class="card" style="margin-bottom: 1rem; border: 1px solid var(--border-color); background: var(--bg-card); padding: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem;">
            <div>
              <div style="font-weight: 800; font-size: 1.05rem; color: var(--text-main);">${escapeHtml(ex.name)}</div>
              <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">
                Date: <strong>${dtStr}</strong> • Type: <span class="badge badge-late">${escapeHtml(ex.type || 'UNIT_TEST')}</span> • Max Marks: <strong>${ex.max_marks || 25}</strong>
              </div>
            </div>
            <span class="badge ${ex.scores_entered > 0 ? 'badge-present' : 'badge-pending'}">
              ${ex.scores_entered || 0} Marked
            </span>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="deleteExam(${ex.id}, '${escapeHtml(ex.name)}')">Delete</button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<div class="card" style="color:var(--status-absent); padding:1.5rem;">Failed to load class tests: ${err.message}</div>`;
  }
}

function openCreateExamModal() {
  if (!registerData) {
    showToast('Please select a register first', 'error');
    return;
  }
  const scopeEl = document.getElementById('modal-exam-scope-text');
  if (scopeEl) {
    scopeEl.innerText = `${registerData.subject_name || registerData.name} • Sem ${registerData.semester || 1}`;
  }
  const dateInput = document.getElementById('exam-date');
  if (dateInput && !dateInput.value) {
    dateInput.value = todayStr;
  }
  document.getElementById('create-exam-modal').classList.add('open');
}

function onRegisterExamTypeOrNumChange() {
  const typeEl = document.getElementById('exam-unit-type');
  const numEl = document.getElementById('exam-number-input');
  const titleInp = document.getElementById('exam-title');
  if (!typeEl || !titleInp) return;

  const type = typeEl.value;
  const num = numEl ? numEl.value.trim() : '1';
  const typeLabel = type === 'CT' ? 'Class Test' : 'Unit Test';
  titleInp.value = `${typeLabel} ${num}`;
}

async function submitRegisterExam(e) {
  e.preventDefault();
  if (!registerData) return;

  const saveBtn = document.getElementById('btn-save-exam');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.innerText = 'Scheduling...'; }

  const title = document.getElementById('exam-title').value.trim();

  try {
    const res = await fetchApi('/exams', {
      method: 'POST',
      body: JSON.stringify({
        name: title,
        type: document.getElementById('exam-type').value,
        exam_date: document.getElementById('exam-date').value || null,
        max_marks: Number(document.getElementById('exam-max-marks').value) || 25,
        subject_id: registerData.subject_id,
        department_id: registerData.department_id,
        branch_id: registerData.branch_id || null,
        year: registerData.year || 1,
        semester: registerData.semester || 1
      })
    });

    if (res.success) {
      showToast('Class test scheduled successfully!', 'success');
      document.getElementById('create-exam-form').reset();
      closeModal('create-exam-modal');
      loadRegisterExams();
      loadRegisterTabsCount();
    } else {
      showToast(res.error?.message || 'Could not create test', 'error');
    }
  } catch (err) {
    showToast('Failed to create test: ' + err.message, 'error');
  } finally {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.innerText = 'Schedule & Create Marksheet'; }
  }
}

async function deleteExam(id, title) {
  const confirmed = await openConfirm({
    title: 'Delete Class Test',
    message: `Are you sure you want to permanently delete "${title}"? All student marksheet records will be removed.`,
    confirmText: 'Yes, Delete',
    confirmClass: 'btn-danger'
  });
  if (!confirmed) return;

  try {
    const res = await fetchApi(`/exams/${id}`, { method: 'DELETE' });
    if (res.success) {
      showToast('Class test deleted', 'success');
      loadRegisterExams();
      loadRegisterTabsCount();
    } else {
      showToast(res.error?.message || 'Failed to delete test', 'error');
    }
  } catch (err) {
    showToast('Error deleting test', 'error');
  }
}

// ─── STUDENT STATUS POPOVER ───
function openRemarkMenu(e, studentId, currentStatus, studentName) {
  if (e) e.stopPropagation();
  activePopoverStudentId = studentId;
  const popover = document.getElementById('remark-action-popover');
  if (!popover) return;

  const titleEl = document.getElementById('popover-student-name');
  if (titleEl) titleEl.innerText = studentName || 'Student Status';

  const rect = e.currentTarget.getBoundingClientRect();
  popover.style.top = `${rect.bottom + window.scrollY + 4}px`;
  popover.style.left = `${Math.max(10, rect.left - 80)}px`;
  popover.style.display = 'block';
}

function closeRemarkMenu() {
  const popover = document.getElementById('remark-action-popover');
  if (popover) popover.style.display = 'none';
  activePopoverStudentId = null;
}

async function applyStudentStatus(status) {
  if (!activePopoverStudentId) return;
  const sId = activePopoverStudentId;
  closeRemarkMenu();
  try {
    const res = await fetchApi(`/faculty/registers/${currentRegisterId}/student-status`, {
      method: 'PUT',
      body: JSON.stringify({ student_id: sId, status })
    });
    if (res.success) {
      showToast(`Student status updated to ${status}`, 'success');
      loadRegisterDetail(currentSelectedMonth);
    } else {
      showToast(res.error?.message || 'Could not update status', 'error');
    }
  } catch (err) {
    showToast('Error updating status', 'error');
  }
}

document.addEventListener('click', (e) => {
  const popover = document.getElementById('remark-action-popover');
  if (popover && popover.style.display !== 'none' && !popover.contains(e.target)) {
    closeRemarkMenu();
  }
});

// ─── PERSONAL REGISTER CREATION ───
async function openCreatePersonalModal() {
  const values = await openDynamicForm({
    title: 'Create Personal Register',
    subtitle: 'Create a personal unofficial teaching register for tracking cohorts or meetings.',
    fields: [
      { name: 'name', label: 'Register Title', type: 'text', placeholder: 'e.g. Competitive Coding Batch 2026', required: true },
      { name: 'session_type_scope', label: 'Scope', type: 'select', options: [
        { label: 'Theory / Lecture', value: 'THEORY' },
        { label: 'Practical / Lab', value: 'PRACTICAL' },
        { label: 'Mixed Sessions', value: 'ALL' }
      ], defaultValue: 'THEORY', required: true }
    ],
    submitText: 'Create Register'
  });
  if (!values) return;

  try {
    const res = await fetchApi('/faculty/registers', {
      method: 'POST',
      body: JSON.stringify(values)
    });
    if (res.success) {
      showToast('Personal register created!', 'success');
      loadRegistersList();
    } else {
      showToast(res.error?.message || 'Could not create register', 'error');
    }
  } catch (err) {
    showToast('Failed to create register', 'error');
  }
}

// ─── ATTENDANCE EXPORT STUDIO ───
let selectedExportFormat = 'xlsx';
let selectedExportRange = 'all_months';
let selectedExportScope = 'BOTH';

function openAttendanceExportModal() {
  document.getElementById('modal-export-attendance').classList.add('open');
}

function closeAttendanceExportModal() {
  document.getElementById('modal-export-attendance').classList.remove('open');
}

function selectExportFormat(fmt) {
  selectedExportFormat = fmt;
  ['xlsx', 'pdf', 'doc'].forEach(f => {
    const el = document.getElementById('card-format-' + f);
    if (el) el.classList.toggle('active', f === fmt);
  });
}

function handleExportRangeChange(range) {
  selectedExportRange = range;
  ['all_months', 'overview_only', 'month', 'day'].forEach(r => {
    const el = document.getElementById('label-range-' + (r === 'all_months' ? 'all' : (r === 'overview_only' ? 'overview' : r)));
    if (el) el.classList.toggle('active', r === range);
  });
  const mRow = document.getElementById('export-context-month-row');
  const dRow = document.getElementById('export-context-day-row');
  if (mRow) mRow.style.display = range === 'month' ? 'block' : 'none';
  if (dRow) dRow.style.display = range === 'day' ? 'block' : 'none';
}

function selectExportScope(scope) {
  selectedExportScope = scope;
  ['both', 'theory', 'practical'].forEach(s => {
    const el = document.getElementById('btn-scope-' + s);
    if (el) el.classList.toggle('active', s.toUpperCase() === scope);
  });
}

async function executeAttendanceExport() {
  if (!currentRegisterId) return;
  const btn = document.getElementById('btn-execute-export');
  if (btn) btn.disabled = true;

  try {
    let url = `/faculty/registers/${currentRegisterId}/export?format=${selectedExportFormat}&range=${selectedExportRange}&scope=${selectedExportScope}`;
    const token = getToken();
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('Export request failed');
    const blob = await res.blob();
    const ext = selectedExportFormat === 'pdf' ? 'pdf' : (selectedExportFormat === 'doc' ? 'doc' : 'xlsx');
    const filename = `Attendance_Register_${currentRegisterId}_${todayStr}.${ext}`;
    const dlUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = dlUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(dlUrl);
    }, 200);
    closeAttendanceExportModal();
    showToast('Report downloaded successfully!', 'success');
  } catch (err) {
    showToast('Export failed: ' + err.message, 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ─── MASTER INTERNAL EVALUATION SPREADSHEET STUDIO ───
function openInternalEvaluationStudio() {
  if (currentRegisterId) {
    window.location.href = `/faculty/evaluation.html?id=${currentRegisterId}`;
    return;
  }
  document.getElementById('internal-eval-modal').classList.add('open');
}

function restoreUnitTestSheet() { showToast('Restoring Unit Test Sheet...', 'info'); }
function addInternalEvalColumn() { showToast('Adding evaluation column...', 'info'); }
function removeInternalEvalColumn() { showToast('Removing last column...', 'info'); }
function addInternalEvalRow() { showToast('Adding student row...', 'info'); }
function exportInternalEvalExcel() { showToast('Exporting evaluation sheet to Excel...', 'info'); }
function saveInternalEvalGrid() { showToast('Evaluation grid saved!', 'success'); }

// Modal Helper
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}
