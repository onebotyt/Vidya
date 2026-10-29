/**
 * ══════════════════════════════════════════════════════════════
 * VidyaOS V2 — STUDENT TIMETABLE CONTROLLER
 * frontend-v2/student/timetable/timetable.js
 * ══════════════════════════════════════════════════════════════
 */

guardRoute({ roles: ['STUDENT'] });

const DAYS = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

var escapeHtml = window.escapeHtml || (typeof esc !== 'undefined' ? esc : (s => {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}));

async function loadTimetable() {
  const grid = document.getElementById('week-grid');
  if (!grid) return;

  // Determine current day of week (1=Monday ... 7=Sunday)
  const jsDay = new Date().getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
  const currentDayOfWeek = jsDay === 0 ? 7 : jsDay;

  const currentDayBadge = document.getElementById('current-day-badge');
  if (currentDayBadge) {
    currentDayBadge.textContent = `Today: ${DAYS[currentDayOfWeek] || 'Day'}`;
  }

  try {
    const res = await fetchApi('/timetable');
    const slots = (res && res.success && Array.isArray(res.data)) ? res.data : [];

    if (!slots.length) {
      grid.innerHTML = `
        <div style="text-align:center; padding:3.5rem 1.5rem; color:var(--text-muted); grid-column:1 / -1; background:var(--bg-card); border-radius:var(--radius-lg); border:1px solid var(--border-color);">
          <div style="font-size:2.2rem; margin-bottom:0.5rem;">📅</div>
          <div style="font-weight:700; font-size:1.1rem; color:var(--text-main);">No timetable schedule published yet</div>
          <div style="font-size:0.88rem; margin-top:0.25rem;">Your department faculty will assign classes and lecture halls shortly.</div>
        </div>
      `;
      return;
    }

    grid.innerHTML = [1, 2, 3, 4, 5, 6].map(day => {
      const daySlots = slots.filter(s => Number(s.day_of_week) === day);
      const isToday = (day === currentDayOfWeek);

      return `
        <div class="day-col ${isToday ? 'is-today' : ''}">
          <div class="day-header">
            <span>${DAYS[day]}</span>
            ${isToday ? '<span class="today-chip">Today</span>' : ''}
          </div>
          <div class="day-slots-container">
            ${daySlots.length ? daySlots.map(s => {
              const timeDisplay = `${escapeHtml(s.start_time || '')} – ${escapeHtml(s.end_time || '')}`;
              return `
                <div class="slot-card">
                  <div class="slot-time">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span>${timeDisplay}</span>
                  </div>
                  <div class="slot-subject">${escapeHtml(s.subject_name || s.name || 'Class Session')}</div>
                  <div class="slot-meta">
                    ${s.teacher_name ? `<span>👨‍🏫 ${escapeHtml(s.teacher_name)}</span>` : ''}
                    ${s.room ? `<span class="slot-room-tag">🏛️ ${escapeHtml(s.room)}</span>` : ''}
                  </div>
                </div>
              `;
            }).join('') : `
              <div class="empty-day-msg">
                <span>No scheduled sessions</span>
              </div>
            `}
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    grid.innerHTML = `
      <div style="text-align:center; padding:2rem; color:var(--status-absent); grid-column:1 / -1;">
        Failed to load timetable: ${escapeHtml(err.message)}
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', loadTimetable);
