/**
 * VidyaOS Institutional Audit Logs Controller
 * Location: /admin/audit-logs/audit-logs.js
 * 
 * Declarative component-driven controller using:
 *  - renderDataTable (UI-004)
 *  - openDetailDialog (UI-002 extension)
 *  - showToast (UI-003)
 */

(function () {
  'use strict';

  // Guard: SYSTEM_ADMIN only
  if (typeof guardRoute === 'function') {
    guardRoute({ roles: ['SYSTEM_ADMIN'] });
  }

  let currentOffset = 0;
  const pageSize = 25;
  let totalRecords = 0;
  let cachedRecords = [];

  function esc(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getEventChipClass(eventType) {
    if (!eventType) return '';
    const et = eventType.toUpperCase();
    if (et.includes('APPROVED')) return 'event-approved';
    if (et.includes('REJECTED') || et.includes('DISABLED') || et.includes('REMOVED')) return 'event-rejected';
    if (et.includes('HOD') || et.includes('COMMON_MANAGER')) return 'event-admin';
    if (et.includes('BIOMETRIC') || et.includes('DEVICE') || et.includes('ESP')) return 'event-biometric';
    if (et.includes('TEACHING_GROUP') || et.includes('ASSIGNMENT') || et.includes('TEST')) return 'event-academic';
    if (et.includes('ATTENDANCE')) return 'event-attendance';
    return '';
  }

  async function loadKpis() {
    try {
      const res = await fetchApi('/admin/audit-logs?limit=1000');
      if (res && res.success && Array.isArray(res.data)) {
        const rows = res.data;
        const totalEl = document.getElementById('kpi-total');
        if (totalEl) totalEl.textContent = (res.total || rows.length).toLocaleString();

        const govCount = rows.filter((r) => /APPROVED|REJECTED|HOD|COMMON_MANAGER/i.test(r.event_type || '')).length;
        const bioCount = rows.filter((r) => /BIOMETRIC|DEVICE|ESP/i.test(r.event_type || '')).length;
        const acadCount = rows.filter((r) => /TEACHING_GROUP|ATTENDANCE|ASSIGNMENT|TEST/i.test(r.event_type || '')).length;

        const govEl = document.getElementById('kpi-governance');
        const bioEl = document.getElementById('kpi-biometric');
        const acadEl = document.getElementById('kpi-academic');

        if (govEl) govEl.textContent = govCount.toLocaleString();
        if (bioEl) bioEl.textContent = bioCount.toLocaleString();
        if (acadEl) acadEl.textContent = acadCount.toLocaleString();
      }
    } catch (_) {
      // Telemetry failures fail gracefully without disrupting table flow
    }
  }

  async function loadAuditLogs() {
    const search = (document.getElementById('filter-search')?.value || '').trim();
    const eventType = document.getElementById('filter-event')?.value || '';
    const targetType = document.getElementById('filter-target')?.value || '';
    const startDate = document.getElementById('filter-start-date')?.value || '';
    const endDate = document.getElementById('filter-end-date')?.value || '';

    const params = new URLSearchParams({
      limit: pageSize,
      offset: currentOffset,
    });

    if (search) params.append('search', search);
    if (eventType) params.append('event_type', eventType);
    if (targetType) params.append('target_type', targetType);
    if (startDate) params.append('start_date', startDate + ' 00:00:00');
    if (endDate) params.append('end_date', endDate + ' 23:59:59');

    const container = document.getElementById('audit-table-container');
    if (container) {
      container.innerHTML = `
        <div style="text-align:center;padding:3rem 1.5rem;color:var(--text-muted);">
          <div class="spinner" style="margin:0 auto 1rem auto;"></div>
          <div>Fetching cryptographic audit trail...</div>
        </div>
      `;
    }

    try {
      const res = await fetchApi(`/admin/audit-logs?${params.toString()}`);
      if (res && res.success) {
        cachedRecords = res.data || [];
        totalRecords = res.total !== undefined ? res.total : cachedRecords.length;
        renderLogsTable(cachedRecords);
        updatePagination();
      } else {
        if (container) {
          container.innerHTML = `
            <div style="text-align:center;padding:2.5rem;color:var(--status-absent);">
              Failed to load audit logs: ${esc(res ? res.error || res.message : 'Network error')}
            </div>
          `;
        }
      }
    } catch (err) {
      if (container) {
        container.innerHTML = `
          <div style="text-align:center;padding:2.5rem;color:var(--status-absent);">
            Error loading audit trail: ${esc(err.message)}
          </div>
        `;
      }
    }
  }

  function renderLogsTable(rows) {
    renderDataTable({
      container: 'audit-table-container',
      emptyMessage: 'No audit records match your current criteria.',
      columns: [
        {
          key: 'created_at',
          label: 'Timestamp',
          width: '170px',
          render: (val) => {
            if (!val) return '<span style="color:var(--text-muted)">--</span>';
            const dateObj = new Date(val.includes('Z') ? val : val.replace(' ', 'T') + 'Z');
            const formatted = isNaN(dateObj.getTime())
              ? val
              : dateObj.toLocaleString('en-IN', {
                  year: 'numeric',
                  month: 'short',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });
            return `<span style="font-family:var(--font-family-mono);font-size:0.76rem;color:var(--text-muted);white-space:nowrap;">${esc(formatted)}</span>`;
          },
        },
        {
          key: 'event_type',
          label: 'Action / Event',
          render: (val) => {
            const chipClass = getEventChipClass(val);
            return `<span class="event-chip ${chipClass}">${esc(val || 'UNKNOWN')}</span>`;
          },
        },
        {
          key: 'actor',
          label: 'Actor',
          render: (_, row) => {
            const name = row.actor_username || row.actor_email || (row.actor_id ? `User #${row.actor_id}` : 'System');
            return `<span style="font-weight:600;color:var(--text-main);">${esc(name)}</span>`;
          },
        },
        {
          key: 'actor_role',
          label: 'Role',
          render: (val, row) => {
            const role = val || (row.actor_id === 1 ? 'SYSTEM_ADMIN' : 'USER');
            return `<span class="badge" style="background:var(--bg-surface);font-size:0.72rem;font-weight:700;">${esc(role)}</span>`;
          },
        },
        {
          key: 'target_type',
          label: 'Target Entity',
          render: (val, row) => {
            const target = val ? `${val}${row.target_id ? ` #${row.target_id}` : ''}` : '--';
            return `<span style="font-family:var(--font-family-mono);font-size:0.76rem;color:var(--text-main);">${esc(target)}</span>`;
          },
        },
        {
          key: 'details',
          label: 'Details Payload',
          render: (val, row, rowIndex) => {
            if (!val) return '<span style="color:var(--text-muted);font-size:0.75rem;">None</span>';
            const preview = typeof val === 'object' ? JSON.stringify(val) : String(val);
            return `
              <span class="json-chip" data-log-index="${rowIndex}" title="Click to view full cryptographic JSON payload">
                ${esc(preview)}
              </span>
            `;
          },
        },
        {
          key: 'ip_address',
          label: 'IP Address',
          render: (val) => `<span style="font-family:var(--font-family-mono);font-size:0.76rem;color:var(--text-muted);">${esc(val || '127.0.0.1')}</span>`,
        },
      ],
      data: rows,
    });

    // Attach click listeners for json-chip elements to trigger openDetailDialog
    const container = document.getElementById('audit-table-container');
    if (container) {
      const chips = container.querySelectorAll('.json-chip');
      chips.forEach((chip) => {
        chip.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(chip.getAttribute('data-log-index'), 10);
          const r = cachedRecords[idx];
          if (!r) return;

          openDetailDialog({
            title: `Audit Event: ${r.event_type || 'Unknown'}`,
            subtitle: `${r.created_at || ''} • Actor: ${r.actor_username || r.actor_id || 'System'} (${r.actor_role || 'ADMIN'}) • Target: ${r.target_type || '--'} #${r.target_id || ''}`,
            content: r.details || 'No payload details available.',
          });
        });
      });
    }
  }

  function updatePagination() {
    const page = Math.floor(currentOffset / pageSize) + 1;
    const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

    const pageNumEl = document.getElementById('page-num');
    if (pageNumEl) pageNumEl.textContent = `Page ${page} of ${totalPages}`;

    const infoEl = document.getElementById('pagination-info');
    if (infoEl) {
      const start = totalRecords > 0 ? currentOffset + 1 : 0;
      const end = Math.min(currentOffset + pageSize, totalRecords);
      infoEl.textContent = `Showing ${start}–${end} of ${totalRecords} entries`;
    }

    const prevBtn = document.getElementById('prev-btn');
    if (prevBtn) prevBtn.disabled = currentOffset <= 0;

    const nextBtn = document.getElementById('next-btn');
    if (nextBtn) nextBtn.disabled = currentOffset + pageSize >= totalRecords;
  }

  function changePage(direction) {
    currentOffset += direction * pageSize;
    if (currentOffset < 0) currentOffset = 0;
    loadAuditLogs();
  }

  function exportLogsJson() {
    if (!cachedRecords || cachedRecords.length === 0) {
      if (typeof showToast === 'function') {
        showToast('No audit logs loaded to export.', 'info');
      }
      return;
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(cachedRecords, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `institutional_audit_logs_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    if (typeof showToast === 'function') {
      showToast('Audit log export initiated.', 'success');
    }
  }

  // Event Listeners
  document.addEventListener('DOMContentLoaded', () => {
    const filterForm = document.getElementById('audit-filter-form');
    if (filterForm) {
      filterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        currentOffset = 0;
        loadAuditLogs();
      });
    }

    const resetBtn = document.getElementById('btn-reset-filters');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        filterForm.reset();
        currentOffset = 0;
        loadAuditLogs();
      });
    }

    const prevBtn = document.getElementById('prev-btn');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => changePage(-1));
    }

    const nextBtn = document.getElementById('next-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => changePage(1));
    }

    const refreshBtn = document.getElementById('btn-refresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        loadAuditLogs();
        loadKpis();
        if (typeof showToast === 'function') {
          showToast('Feed refreshed', 'info');
        }
      });
    }

    const exportBtn = document.getElementById('btn-export-json');
    if (exportBtn) {
      exportBtn.addEventListener('click', exportLogsJson);
    }

    // Initial Load
    loadAuditLogs();
    loadKpis();
  });
})();
