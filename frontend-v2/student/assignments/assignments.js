/**
 * ══════════════════════════════════════════════════════════════
 * VidyaOS V2 — STUDENT TO-DO HUB & COURSEWORK CONTROLLER
 * frontend-v2/student/assignments/assignments.js
 * ══════════════════════════════════════════════════════════════
 */

guardRoute({ roles: ['STUDENT'] });

const S = {
  activeTab: 'assigned',
  selectedClass: 'ALL',
  assignments: [],
  exams: [],
  classes: [],
  collapsedSections: new Set()
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

document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([
    loadEnrolledClasses(),
    loadStudentWorkData()
  ]);
});

/**
 * Loads student enrolled classes for filter dropdown
 */
async function loadEnrolledClasses() {
  try {
    const res = await fetchApi('/teaching-groups/student/my-groups');
    if (res && res.success && Array.isArray(res.data)) {
      S.classes = res.data;
      populateClassFilter(res.data);
    }
  } catch (err) {
    console.warn('Failed to load enrolled classes', err);
  }
}

function populateClassFilter(classes) {
  const sel = document.getElementById('todo-class-filter');
  if (!sel) return;

  let html = '<option value="ALL">All classes</option>';
  classes.forEach(c => {
    const name = c.name || c.subject_name || `Class ${c.id}`;
    const sem = c.semester ? ` (Sem ${c.semester})` : '';
    html += `<option value="${c.id}">${escapeHtml(name + sem)}</option>`;
  });
  sel.innerHTML = html;
}

function handleClassFilterChange(val) {
  S.selectedClass = val;
  renderTodoHub();
}

/**
 * Loads all coursework assignments and tests
 */
async function loadStudentWorkData() {
  try {
    const [asgRes, examRes] = await Promise.all([
      fetchApi('/assignments').catch(() => ({ success: false, data: [] })),
      fetchApi('/exams').catch(() => ({ success: false, data: [] }))
    ]);

    const assignments = (asgRes && asgRes.success && Array.isArray(asgRes.data)) ? asgRes.data : [];
    const exams = (examRes && examRes.success && Array.isArray(examRes.data)) ? examRes.data : [];

    S.assignments = assignments.map(a => ({
      ...a,
      item_kind: a.type || 'ASSIGNMENT',
      clean_due_date: a.due_date ? new Date(a.due_date) : null
    }));

    S.exams = exams.map(e => ({
      ...e,
      item_kind: 'TEST',
      title: e.name || 'Class Evaluation',
      due_date: e.exam_date || e.created_at,
      clean_due_date: (e.exam_date || e.created_at) ? new Date(e.exam_date || e.created_at) : null
    }));

    renderTodoHub();
  } catch (err) {
    console.error('Failed to load student work data', err);
    showEmptyState('assigned', 'Error loading coursework', err.message);
  }
}

/**
 * Categorizes and Renders the 3 To-do tabs
 */
function renderTodoHub() {
  const allItems = [...S.assignments, ...S.exams];

  // Apply Class Filter if selected
  const filteredItems = (S.selectedClass === 'ALL')
    ? allItems
    : allItems.filter(item => {
        const gId = item.group_id || item.teaching_group_id;
        return Number(gId) === Number(S.selectedClass);
      });

  const now = Date.now();

  const assignedList = [];
  const missingList = [];
  const doneList = [];

  filteredItems.forEach(item => {
    const isTest = (item.item_kind === 'TEST');
    const isSubmitted = isTest
      ? (item.marks_obtained !== null && item.marks_obtained !== undefined)
      : Boolean(item.my_status === 'SUBMITTED' || item.my_status === 'LATE' || item.my_status === 'GRADED' || item.my_file_path);

    const hasDueDate = Boolean(item.clean_due_date && !isNaN(item.clean_due_date.getTime()));
    const isPastDue = hasDueDate && (item.clean_due_date.getTime() < now);

    if (isSubmitted) {
      doneList.push(item);
    } else if (isPastDue) {
      missingList.push(item);
    } else {
      assignedList.push(item);
    }
  });

  // Update tab counter badges
  const bAssigned = document.getElementById('badge-assigned');
  if (bAssigned) bAssigned.innerText = assignedList.length;

  const bMissing = document.getElementById('badge-missing');
  const btnMissing = document.getElementById('tab-btn-missing');
  if (bMissing) {
    bMissing.innerText = missingList.length;
    if (btnMissing) {
      if (missingList.length > 0) btnMissing.classList.add('has-missing');
      else btnMissing.classList.remove('has-missing');
    }
  }

  const bDone = document.getElementById('badge-done');
  if (bDone) bDone.innerText = doneList.length;

  // Render Panes
  renderAssignedPane(assignedList);
  renderMissingPane(missingList);
  renderDonePane(doneList);
}

function switchTodoTab(tabName) {
  S.activeTab = tabName;
  ['assigned', 'missing', 'done'].forEach(t => {
    const btn = document.getElementById(`tab-btn-${t}`);
    const pane = document.getElementById(`tab-pane-${t}`);
    if (btn) btn.classList.toggle('active', t === tabName);
    if (pane) pane.classList.toggle('active', t === tabName);
  });
}

function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getEndOfWeek(date) {
  const d = getStartOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

function formatDateRelative(date) {
  if (!date || isNaN(date.getTime())) return 'No due date';
  const now = new Date();
  const diffDays = Math.round((date - now) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today, ' + date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Tomorrow, ' + date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === -1) return 'Yesterday';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function renderSection(pane, sectionKey, items, rowRenderer) {
  const isCollapsed = S.collapsedSections.has(`${pane}:${sectionKey}`);
  const groupClass = isCollapsed ? 'todo-section-group collapsed' : 'todo-section-group';

  return `
    <div class="${groupClass}" id="sec-${pane}-${escapeHtml(sectionKey)}">
      <div class="todo-section-header" onclick="toggleSection('${pane}', '${escapeHtml(sectionKey)}')">
        <div class="todo-section-title">
          <svg class="todo-section-caret" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          <span>${escapeHtml(sectionKey)}</span>
          <span class="todo-section-count">(${items.length})</span>
        </div>
      </div>
      <div class="todo-items-list">
        ${items.map(rowRenderer).join('')}
      </div>
    </div>
  `;
}

function toggleSection(pane, sectionKey) {
  const key = `${pane}:${sectionKey}`;
  if (S.collapsedSections.has(key)) {
    S.collapsedSections.delete(key);
  } else {
    S.collapsedSections.add(key);
  }
  const el = document.getElementById(`sec-${pane}-${sectionKey}`);
  if (el) el.classList.toggle('collapsed');
}

/* ─────────────────────────────────────────────────────────────
   PANE 1: ASSIGNED (Upcoming work)
   ───────────────────────────────────────────────────────────── */
function renderAssignedPane(items) {
  const container = document.getElementById('todo-list-assigned');
  if (!container) return;

  if (items.length === 0) {
    container.innerHTML = `
      <div class="todo-empty-state">
        <div class="todo-empty-icon">🎉</div>
        <div class="todo-empty-title">All caught up!</div>
        <div class="todo-empty-desc">You don't have any pending assignments or tests right now.</div>
      </div>
    `;
    return;
  }

  const now = new Date();
  const endOfThisWeek = getEndOfWeek(now);
  const startOfNextWeek = new Date(endOfThisWeek.getTime() + 1);
  const endOfNextWeek = getEndOfWeek(startOfNextWeek);

  const groups = {
    'No due date': [],
    'This week': [],
    'Next week': [],
    'Later': []
  };

  items.forEach(item => {
    if (!item.clean_due_date) {
      groups['No due date'].push(item);
    } else if (item.clean_due_date <= endOfThisWeek) {
      groups['This week'].push(item);
    } else if (item.clean_due_date <= endOfNextWeek) {
      groups['Next week'].push(item);
    } else {
      groups['Later'].push(item);
    }
  });

  container.innerHTML = Object.entries(groups).map(([sectionKey, secItems]) => {
    if (secItems.length === 0) return '';
    return renderSection('assigned', sectionKey, secItems, renderAssignedRow);
  }).join('');
}

function renderAssignedRow(item) {
  const isTest = (item.item_kind === 'TEST');
  const targetUrl = item.group_id
    ? `/student/group-detail.html?id=${item.group_id}&work=${item.id}&kind=${item.item_kind}`
    : `/student/dashboard.html`;

  const dueText = item.clean_due_date
    ? `Due ${formatDateRelative(item.clean_due_date)}`
    : 'No due date';

  const ptsText = item.max_marks ? `${item.max_marks} pts` : 'Coursework';

  return `
    <a href="${targetUrl}" class="todo-item-row" title="Open ${escapeHtml(item.title)}">
      <div class="todo-item-left">
        <div class="todo-item-icon-box ${isTest ? 'is-test' : ''}">
          ${isTest ? '📝' : '📋'}
        </div>
        <div class="todo-item-details">
          <div class="todo-item-course-badge">
            <span class="dot"></span>
            <span>${escapeHtml(item.subject_name || 'Course Class')}</span>
          </div>
          <h3 class="todo-item-title">${escapeHtml(item.title)}</h3>
          <div class="todo-item-meta-strip">
            <span class="due-date">${dueText}</span>
            <span>•</span>
            <span>${ptsText}</span>
          </div>
        </div>
      </div>
      <div class="todo-item-right">
        <span class="todo-status-pill status-assigned">Assigned</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
    </a>
  `;
}

/* ─────────────────────────────────────────────────────────────
   PANE 2: MISSING (Past-due unsubmitted work)
   ───────────────────────────────────────────────────────────── */
function renderMissingPane(items) {
  const container = document.getElementById('todo-list-missing');
  if (!container) return;

  if (items.length === 0) {
    container.innerHTML = `
      <div class="todo-empty-state">
        <div class="todo-empty-icon">✨</div>
        <div class="todo-empty-title">Nothing missing!</div>
        <div class="todo-empty-desc">Great job! You have zero overdue unsubmitted assignments. Keep it up!</div>
      </div>
    `;
    return;
  }

  const now = new Date();
  const startOfThisWeek = getStartOfWeek(now);
  const startOfLastWeek = new Date(startOfThisWeek.getTime() - 7 * 24 * 60 * 60 * 1000);

  const groups = {
    'This week': [],
    'Last week': [],
    'Earlier': []
  };

  items.forEach(item => {
    if (!item.clean_due_date) {
      groups['Earlier'].push(item);
    } else if (item.clean_due_date >= startOfThisWeek) {
      groups['This week'].push(item);
    } else if (item.clean_due_date >= startOfLastWeek) {
      groups['Last week'].push(item);
    } else {
      groups['Earlier'].push(item);
    }
  });

  container.innerHTML = Object.entries(groups).map(([sectionKey, secItems]) => {
    if (secItems.length === 0) return '';
    return renderSection('missing', sectionKey, secItems, renderMissingRow);
  }).join('');
}

function renderMissingRow(item) {
  const isTest = (item.item_kind === 'TEST');
  const targetUrl = item.group_id
    ? `/student/group-detail.html?id=${item.group_id}&work=${item.id}&kind=${item.item_kind}`
    : `/student/dashboard.html`;

  const dueText = item.clean_due_date
    ? `Due ${formatDateRelative(item.clean_due_date)}`
    : 'Past due';

  return `
    <a href="${targetUrl}" class="todo-item-row" title="Open ${escapeHtml(item.title)}">
      <div class="todo-item-left">
        <div class="todo-item-icon-box is-test">
          ${isTest ? '⚠️' : '❗'}
        </div>
        <div class="todo-item-details">
          <div class="todo-item-course-badge">
            <span class="dot" style="background:var(--status-absent);"></span>
            <span>${escapeHtml(item.subject_name || 'Course Class')}</span>
          </div>
          <h3 class="todo-item-title">${escapeHtml(item.title)}</h3>
          <div class="todo-item-meta-strip">
            <span class="due-date" style="color:var(--status-absent); font-weight:700;">${dueText}</span>
          </div>
        </div>
      </div>
      <div class="todo-item-right">
        <span class="todo-status-pill status-missing">Missing</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
    </a>
  `;
}

/* ─────────────────────────────────────────────────────────────
   PANE 3: DONE (Completed & Graded work)
   ───────────────────────────────────────────────────────────── */
function renderDonePane(items) {
  const container = document.getElementById('todo-list-done');
  if (!container) return;

  if (items.length === 0) {
    container.innerHTML = `
      <div class="todo-empty-state">
        <div class="todo-empty-icon">📁</div>
        <div class="todo-empty-title">No completed work yet</div>
        <div class="todo-empty-desc">Turned-in assignments and graded test results will be cataloged here.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="todo-items-list">
      ${items.map(renderDoneRow).join('')}
    </div>
  `;
}

function renderDoneRow(item) {
  const isTest = (item.item_kind === 'TEST');
  const targetUrl = item.group_id
    ? `/student/group-detail.html?id=${item.group_id}&work=${item.id}&kind=${item.item_kind}`
    : `/student/dashboard.html`;

  let gradeText = 'Turned in';
  if (isTest && item.marks_obtained !== null && item.marks_obtained !== undefined) {
    gradeText = `${item.marks_obtained} / ${item.max_marks || 100}`;
  } else if (item.marks !== null && item.marks !== undefined) {
    gradeText = `${item.marks} / ${item.max_marks || 100}`;
  }

  return `
    <a href="${targetUrl}" class="todo-item-row" title="Open ${escapeHtml(item.title)}">
      <div class="todo-item-left">
        <div class="todo-item-icon-box" style="background:var(--status-present-bg); color:var(--status-present);">
          ✓
        </div>
        <div class="todo-item-details">
          <div class="todo-item-course-badge">
            <span class="dot" style="background:var(--status-present);"></span>
            <span>${escapeHtml(item.subject_name || 'Course Class')}</span>
          </div>
          <h3 class="todo-item-title">${escapeHtml(item.title)}</h3>
          <div class="todo-item-meta-strip">
            <span>Score: <strong>${escapeHtml(gradeText)}</strong></span>
          </div>
        </div>
      </div>
      <div class="todo-item-right">
        <span class="todo-status-pill status-done">Done</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
    </a>
  `;
}

function showEmptyState(pane, title, desc) {
  const container = document.getElementById(`todo-list-${pane}`);
  if (!container) return;
  container.innerHTML = `
    <div class="todo-empty-state">
      <div class="todo-empty-icon">⚠️</div>
      <div class="todo-empty-title">${escapeHtml(title)}</div>
      <div class="todo-empty-desc">${escapeHtml(desc)}</div>
    </div>
  `;
}
