/**
 * VidyaOS Reusable Data Table Component
 * Location: /shared/js/ui-table.js
 * 
 * Renders high-density tables that automatically transform into
 * responsive cards on mobile screens (< 768px).
 */

(function (window) {
  'use strict';

  function esc(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Render a Data Table into a container
   * @param {Object} opts
   * @param {HTMLElement|string} opts.container - Target DOM container
   * @param {Array<{key: string, label: string, render?: Function, width?: string, align?: string}>} opts.columns
   * @param {Array<Object>} opts.data - Array of row items
   * @param {string} [opts.emptyMessage] - Text when data is empty
   * @param {Array<{label: string, icon?: string, variant?: string, onClick: Function, show?: Function}>} [opts.actions]
   */
  function renderDataTable(opts) {
    const container = typeof opts.container === 'string' ? document.getElementById(opts.container) : opts.container;
    if (!container) return;

    if (!opts.data || opts.data.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:3rem 1.5rem;color:var(--text-muted);background:var(--bg-card);border:1px solid var(--border-color);border-radius:var(--radius-lg);">
          <div style="font-size:2rem;margin-bottom:0.5rem;opacity:0.6;">📋</div>
          <div style="font-weight:600;font-size:0.95rem;color:var(--text-main);">${opts.emptyMessage || 'No records found'}</div>
          <div style="font-size:0.8125rem;margin-top:0.25rem;">Try adjusting filters or adding a new record.</div>
        </div>
      `;
      return;
    }

    let html = `
      <div class="table-container">
        <table class="data-table data-table-responsive">
          <thead>
            <tr>
    `;

    opts.columns.forEach((col) => {
      const style = [];
      if (col.width) style.push(`width:${col.width}`);
      if (col.align) style.push(`text-align:${col.align}`);
      html += `<th style="${style.join(';')}">${esc(col.label)}</th>`;
    });

    if (opts.actions && opts.actions.length > 0) {
      html += `<th style="width:140px;text-align:right;">Actions</th>`;
    }

    html += `
            </tr>
          </thead>
          <tbody>
    `;

    opts.data.forEach((row, rowIndex) => {
      html += `<tr>`;

      opts.columns.forEach((col) => {
        const val = row[col.key];
        const formatted = col.render ? col.render(val, row, rowIndex) : esc(val);
        const style = col.align ? `text-align:${col.align};` : '';
        html += `<td data-label="${esc(col.label)}" style="${style}">${formatted}</td>`;
      });

      if (opts.actions && opts.actions.length > 0) {
        html += `<td data-label="Actions" style="text-align:right;"><div style="display:inline-flex;gap:0.4rem;justify-content:flex-end;">`;
        opts.actions.forEach((act, actIndex) => {
          if (act.show && !act.show(row)) return;
          const variant = act.variant || 'secondary';
          html += `
            <button type="button" class="btn btn-sm btn-${variant} v2-row-action" data-row-index="${rowIndex}" data-act-index="${actIndex}" title="${esc(act.label)}">
              ${act.icon || ''} <span>${esc(act.label)}</span>
            </button>
          `;
        });
        html += `</div></td>`;
      }

      html += `</tr>`;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;

    container.innerHTML = html;

    // Attach Action Listeners
    if (opts.actions && opts.actions.length > 0) {
      const actionBtns = container.querySelectorAll('.v2-row-action');
      actionBtns.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const rIdx = parseInt(btn.getAttribute('data-row-index'), 10);
          const aIdx = parseInt(btn.getAttribute('data-act-index'), 10);
          const rowData = opts.data[rIdx];
          const actionDef = opts.actions[aIdx];
          if (actionDef && actionDef.onClick) {
            actionDef.onClick(rowData, rIdx);
          }
        });
      });
    }
  }

  window.renderDataTable = renderDataTable;

})(window);
