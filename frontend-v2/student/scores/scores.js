/**
 * ══════════════════════════════════════════════════════════════
 * VidyaOS V2 — STUDENT SCORES CONTROLLER
 * frontend-v2/student/scores/scores.js
 * ══════════════════════════════════════════════════════════════
 */

guardRoute({ roles: ['STUDENT'] });

var escapeHtml = window.escapeHtml || (typeof esc !== 'undefined' ? esc : (s => {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}));

async function init() {
  await Promise.all([
    loadProfileHeader(),
    loadScores()
  ]);
}

async function loadProfileHeader() {
  try {
    const res = await fetchApi('/students/me');
    if (res && res.success && res.data) {
      const s = res.data;
      const nameEl = document.getElementById('scores-student-name');
      if (nameEl) nameEl.textContent = s.full_name || 'Student';

      const badgeEl = document.getElementById('scores-cohort-badge');
      if (badgeEl) badgeEl.textContent = `Year ${s.year || 1} • Sem ${s.semester || 1}`;

      const deptEl = document.getElementById('scores-dept-info');
      if (deptEl) {
        deptEl.textContent = `${s.department_name || 'Department'} (${s.branch_code || s.department_code || ''}) • ${s.academic_year_label || 'Current Session'}`;
      }

      const rollEl = document.getElementById('scores-roll-no');
      if (rollEl) rollEl.textContent = s.class_roll_no ? `${s.class_roll_no}` : '—';

      const regEl = document.getElementById('scores-reg-no');
      if (regEl) regEl.textContent = s.registration_no || '—';

      const enrEl = document.getElementById('scores-enrollment-no');
      if (enrEl) enrEl.textContent = s.official_enrollment_no || '—';

      const card = document.getElementById('student-id-card');
      if (card) card.style.display = 'flex';
    }
  } catch (err) {
    console.warn('Could not load student profile header:', err);
  }
}

async function loadScores() {
  const wrap = document.getElementById('scores-wrap');
  if (!wrap) return;

  try {
    const res = await fetchApi('/exams');
    if (!res.success || !res.data || !res.data.length) {
      wrap.innerHTML = `
        <div style="text-align: center; padding: 3.5rem 1.5rem; color: var(--text-muted);">
          <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">📝</div>
          <div style="font-weight: 700; font-size: 1.1rem; color: var(--text-main);">No recorded test scores yet</div>
          <div style="font-size: 0.88rem; margin-top: 0.25rem;">Upcoming unit tests and evaluations will appear here once entered by faculty.</div>
        </div>
      `;
      return;
    }

    const exams = res.data;
    let scoredCount = 0;
    let totalScoreSum = 0;
    let totalMaxSum = 0;
    let topPct = 0;
    let topName = '—';

    exams.forEach(ex => {
      if (ex.marks_obtained !== null && ex.marks_obtained !== undefined && ex.max_marks) {
        scoredCount++;
        totalScoreSum += Number(ex.marks_obtained);
        totalMaxSum += Number(ex.max_marks);
        const p = (Number(ex.marks_obtained) / Number(ex.max_marks)) * 100;
        if (p > topPct) {
          topPct = p;
          topName = `${ex.name || 'Test'} (${Math.round(p)}%)`;
        }
      }
    });

    // Update KPI strip
    const kpiWrap = document.getElementById('scores-summary-grid');
    if (kpiWrap && exams.length > 0) {
      kpiWrap.style.display = 'grid';
      const testsCountEl = document.getElementById('kpi-tests-count');
      if (testsCountEl) testsCountEl.textContent = exams.length;

      const avgEl = document.getElementById('kpi-avg-pct');
      if (avgEl) {
        avgEl.textContent = totalMaxSum > 0 ? `${((totalScoreSum / totalMaxSum) * 100).toFixed(1)}%` : '—';
      }

      const topEl = document.getElementById('kpi-top-score');
      if (topEl) topEl.textContent = topName;
    }

    wrap.innerHTML = `
      <div class="scores-table-wrap">
        <table class="scores-table">
          <thead>
            <tr>
              <th>Test / Examination</th>
              <th>Subject &amp; Code</th>
              <th style="width: 140px;">Exam Date</th>
              <th style="width: 180px; text-align: right;">Score Obtained</th>
            </tr>
          </thead>
          <tbody>
            ${exams.map(ex => {
              const hasScore = ex.marks_obtained !== null && ex.marks_obtained !== undefined;
              const pct = hasScore && ex.max_marks ? (Number(ex.marks_obtained) / Number(ex.max_marks)) * 100 : null;
              const isGood = pct !== null && pct >= 40;
              const formattedDate = ex.exam_date 
                ? new Date(ex.exam_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) 
                : '—';

              return `
              <tr>
                <td style="font-weight: 700; color: var(--text-main);">
                  <div>${escapeHtml(ex.name || 'Unit Assessment')}</div>
                  <div style="font-size:0.75rem; color:var(--text-muted); font-weight:normal; margin-top:0.15rem;">Max: ${ex.max_marks || 100} pts</div>
                </td>
                <td>
                  <div style="font-weight:600; color:var(--text-main);">${escapeHtml(ex.subject_name || 'Subject')}</div>
                  <span class="code-badge" style="font-size: 0.72rem; margin-top:0.2rem; display:inline-block;">${escapeHtml(ex.subject_code || '')}</span>
                </td>
                <td style="color:var(--text-muted); font-size:0.84rem;">
                  ${formattedDate}
                </td>
                <td style="text-align: right;">
                  <div class="score-value ${pct !== null ? (isGood ? 'good' : 'low') : ''}">
                    ${hasScore ? `${ex.marks_obtained} / ${ex.max_marks}` : '<span style="color: var(--text-muted); font-weight: normal; font-size: 0.8rem;">Pending Entry</span>'}
                  </div>
                  ${pct !== null ? `
                    <div style="display:flex; justify-content:flex-end;">
                      <div class="score-pct-bar">
                        <div class="score-pct-fill ${isGood ? 'good' : 'low'}" style="width: ${Math.min(100, Math.max(0, pct))}%"></div>
                      </div>
                    </div>
                  ` : ''}
                </td>
              </tr>
            `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    wrap.innerHTML = `<div style="color: var(--status-absent); padding: 2rem; text-align: center;">Failed to load test scores: ${escapeHtml(err.message)}</div>`;
  }
}

document.addEventListener('DOMContentLoaded', init);
