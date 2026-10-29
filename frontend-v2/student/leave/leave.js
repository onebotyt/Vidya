/**
 * ══════════════════════════════════════════════════════════════
 * VidyaOS V2 — STUDENT LEAVE CONTROLLER
 * frontend-v2/student/leave/leave.js
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

function formatDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (e) {
    return String(d);
  }
}

async function applyLeave(e) {
  e.preventDefault();
  const fromVal = document.getElementById('f-from')?.value;
  const toVal = document.getElementById('f-to')?.value;
  const reasonVal = document.getElementById('f-reason')?.value?.trim();

  if (!fromVal || !toVal || !reasonVal) {
    if (typeof showToast === 'function') {
      showToast('Please fill out all required fields.', 'warning');
    }
    return;
  }

  if (new Date(toVal) < new Date(fromVal)) {
    if (typeof showToast === 'function') {
      showToast('End date cannot be prior to start date.', 'warning');
    }
    return;
  }

  const submitBtn = document.getElementById('btn-submit-leave');
  if (submitBtn) submitBtn.disabled = true;

  try {
    const res = await fetchApi('/leave', {
      method: 'POST',
      body: JSON.stringify({
        from_date: fromVal,
        to_date: toVal,
        reason: reasonVal
      })
    });

    if (res && res.success) {
      if (typeof showToast === 'function') {
        showToast('Leave application submitted successfully!', 'success');
      }
      document.getElementById('f-reason').value = '';
      await loadLeaves();
    } else {
      const errMsg = res?.error?.message || 'Could not submit application.';
      if (typeof showToast === 'function') {
        showToast(errMsg, 'error');
      } else {
        alert(errMsg);
      }
    }
  } catch (err) {
    if (typeof showToast === 'function') {
      showToast(err.message || 'Error submitting application.', 'error');
    }
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

async function loadLeaves() {
  const list = document.getElementById('leave-list');
  if (!list) return;

  try {
    const res = await fetchApi('/leave/my');
    if (!res || !res.success || !Array.isArray(res.data) || !res.data.length) {
      list.innerHTML = `
        <div style="text-align:center; padding:3.5rem 1.5rem; color:var(--text-muted); background:var(--bg-card); border-radius:var(--radius-lg); border:1px solid var(--border-color);">
          <div style="font-size:2.2rem; margin-bottom:0.5rem;">📄</div>
          <div style="font-weight:700; font-size:1.1rem; color:var(--text-main);">No leave applications found</div>
          <div style="font-size:0.88rem; margin-top:0.25rem;">Any submitted leave requests and their approval statuses will appear here.</div>
        </div>
      `;
      return;
    }

    list.innerHTML = res.data.map(l => {
      const statusKey = String(l.status || 'PENDING').toUpperCase();
      return `
        <div class="leave-item-card">
          <div class="leave-item-header">
            <div class="leave-item-dates">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span>${formatDate(l.from_date)} → ${formatDate(l.to_date)}</span>
            </div>
            <span class="status-pill ${statusKey}">${statusKey}</span>
          </div>
          <div class="leave-item-reason">${escapeHtml(l.reason || '')}</div>
          ${l.review_note ? `
            <div class="leave-item-note">
              <strong>Faculty Note:</strong> ${escapeHtml(l.review_note)}
            </div>
          ` : ''}
          <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.5rem;">
            Submitted on ${l.created_at ? formatDate(l.created_at) : '—'}
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    list.innerHTML = `
      <div style="text-align:center; padding:2rem; color:var(--status-absent);">
        Failed to load leaves: ${escapeHtml(err.message)}
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', loadLeaves);
