/**
 * VidyaOS Declarative Dialog Engine
 * Location: /shared/js/ui-dialog.js
 * 
 * Provides zero-markup dynamic modals:
 *  - openDynamicForm(options)  : Schema-driven 2-to-10 field edit/create form dialog
 *  - openConfirm(options)      : Destructive action confirmation dialog with optional typed confirm
 */

(function (window) {
  'use strict';

  let activeDialog = null;

  function trapFocus(dialogEl) {
    const focusable = dialogEl.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    setTimeout(() => first.focus(), 50);

    dialogEl.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      } else if (e.key === 'Escape') {
        closeActiveDialog();
      }
    });
  }

  function closeActiveDialog() {
    if (!activeDialog) return;
    activeDialog.classList.remove('open');
    document.body.classList.remove('modal-open');
    setTimeout(() => {
      if (activeDialog && activeDialog.parentNode) {
        activeDialog.parentNode.removeChild(activeDialog);
      }
      activeDialog = null;
    }, 200);
  }

  /**
   * Open a Dynamic Schema-Driven Form Dialog
   * @param {Object} opts
   * @param {string} opts.title - Modal title
   * @param {string} [opts.subtitle] - Modal subtitle / helper text
   * @param {Array<{name: string, label: string, type: string, required?: boolean, options?: Array<any>, placeholder?: string, help?: string, uppercase?: boolean}>} opts.fields
   * @param {Object} [opts.initialValues] - Existing values for editing
   * @param {string} [opts.submitLabel] - Label for submit button (default: 'Save')
   * @param {string} [opts.submitVariant] - 'primary' | 'danger' (default: 'primary')
   * @param {Function} opts.onSubmit - Async callback receiving form values object
   */
  function openDynamicForm(opts) {
    closeActiveDialog();

    const backdrop = document.createElement('div');
    backdrop.className = 'v2-dialog-backdrop';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');

    const card = document.createElement('div');
    card.className = 'v2-dialog-card';

    // Mobile Sheet Handle
    const handle = document.createElement('div');
    handle.className = 'v2-sheet-handle';
    card.appendChild(handle);

    // Header
    const header = document.createElement('div');
    header.className = 'v2-dialog-header';
    header.innerHTML = `
      <div>
        <h2 class="v2-dialog-title">${opts.title || 'Form'}</h2>
        ${opts.subtitle ? `<div class="v2-dialog-subtitle">${opts.subtitle}</div>` : ''}
      </div>
      <button type="button" class="v2-dialog-close" aria-label="Close dialog">&times;</button>
    `;
    card.appendChild(header);

    // Form & Body
    const form = document.createElement('form');
    form.autocomplete = 'off';

    const body = document.createElement('div');
    body.className = 'v2-dialog-body';

    const initialValues = opts.initialValues || {};

    (opts.fields || []).forEach((field) => {
      const group = document.createElement('div');
      group.className = 'form-group';

      const label = document.createElement('label');
      label.className = 'form-label';
      label.htmlFor = `v2-field-${field.name}`;
      label.innerHTML = `${field.label} ${field.required ? '<span style="color:var(--status-absent)">*</span>' : ''}`;
      group.appendChild(label);

      let input;
      const curVal = initialValues[field.name] !== undefined ? initialValues[field.name] : '';

      if (field.type === 'select') {
        input = document.createElement('select');
        input.className = 'form-select';
        input.id = `v2-field-${field.name}`;
        input.name = field.name;
        if (field.required) input.required = true;

        (field.options || []).forEach((opt) => {
          const optEl = document.createElement('option');
          if (typeof opt === 'object' && opt !== null) {
            optEl.value = opt.value !== undefined ? opt.value : opt.id;
            optEl.textContent = opt.label || opt.name;
          } else {
            optEl.value = opt;
            optEl.textContent = opt;
          }
          if (String(optEl.value) === String(curVal)) optEl.selected = true;
          input.appendChild(optEl);
        });
      } else if (field.type === 'textarea') {
        input = document.createElement('textarea');
        input.className = 'form-textarea';
        input.id = `v2-field-${field.name}`;
        input.name = field.name;
        input.rows = field.rows || 3;
        if (field.placeholder) input.placeholder = field.placeholder;
        if (field.required) input.required = true;
        input.value = curVal;
      } else {
        input = document.createElement('input');
        input.className = 'form-control';
        input.id = `v2-field-${field.name}`;
        input.name = field.name;
        input.type = field.type || 'text';
        if (field.placeholder) input.placeholder = field.placeholder;
        if (field.required) input.required = true;
        if (field.uppercase) {
          input.style.textTransform = 'uppercase';
          input.style.fontFamily = 'var(--font-family-mono)';
        }
        input.value = curVal;
      }

      group.appendChild(input);

      if (field.help) {
        const hint = document.createElement('div');
        hint.className = 'form-hint';
        hint.textContent = field.help;
        group.appendChild(hint);
      }

      body.appendChild(group);
    });

    const errorBanner = document.createElement('div');
    errorBanner.className = 'form-error';
    errorBanner.style.display = 'none';
    errorBanner.style.padding = '0.6rem 0.85rem';
    errorBanner.style.borderRadius = 'var(--radius-sm)';
    errorBanner.style.backgroundColor = 'var(--status-absent-bg)';
    errorBanner.style.border = '1px solid var(--status-absent)';
    errorBanner.style.marginBottom = '1rem';
    body.appendChild(errorBanner);

    form.appendChild(body);

    // Footer
    const footer = document.createElement('div');
    footer.className = 'v2-dialog-footer';
    footer.innerHTML = `
      <button type="button" class="btn btn-secondary v2-cancel-btn">Cancel</button>
      <button type="submit" class="btn btn-${opts.submitVariant || 'primary'} v2-submit-btn">${opts.submitLabel || 'Save'}</button>
    `;
    form.appendChild(footer);

    card.appendChild(form);
    backdrop.appendChild(card);
    document.body.appendChild(backdrop);
    document.body.classList.add('modal-open');

    activeDialog = backdrop;

    // Events
    header.querySelector('.v2-dialog-close').addEventListener('click', closeActiveDialog);
    footer.querySelector('.v2-cancel-btn').addEventListener('click', closeActiveDialog);

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeActiveDialog();
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = footer.querySelector('.v2-submit-btn');
      const origText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';
      errorBanner.style.display = 'none';

      const formData = new FormData(form);
      const values = {};
      for (let [key, val] of formData.entries()) {
        values[key] = val;
      }

      try {
        if (opts.onSubmit) {
          await opts.onSubmit(values);
        }
        closeActiveDialog();
      } catch (err) {
        errorBanner.textContent = err.message || 'Operation failed. Please try again.';
        errorBanner.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = origText;
      }
    });

    requestAnimationFrame(() => {
      backdrop.classList.add('open');
      trapFocus(backdrop);
    });
  }

  /**
   * Open a Destructive / Action Confirmation Dialog
   * @param {Object} opts
   * @param {string} opts.title - Dialog title (e.g. 'Delete Department?')
   * @param {string} opts.message - Detailed explanation
   * @param {string} [opts.targetName] - Name of entity being deleted
   * @param {string} [opts.confirmText] - Button label (default: 'Delete')
   * @param {string} [opts.confirmVariant] - 'danger' | 'primary' (default: 'danger')
   * @param {string} [opts.requireTyping] - If set, user must type this exact string to confirm
   * @param {Function} opts.onConfirm - Async callback on confirmation
   */
  function openConfirm(opts) {
    closeActiveDialog();

    const backdrop = document.createElement('div');
    backdrop.className = 'v2-dialog-backdrop';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');

    const card = document.createElement('div');
    card.className = 'v2-dialog-card';
    card.style.maxWidth = '440px';
    card.style.textAlign = 'center';

    const handle = document.createElement('div');
    handle.className = 'v2-sheet-handle';
    card.appendChild(handle);

    const body = document.createElement('div');
    body.className = 'v2-dialog-body';
    body.style.paddingTop = '1.75rem';

    const iconWrap = document.createElement('div');
    iconWrap.style.cssText = 'width:52px;height:52px;border-radius:50%;margin:0 auto 1rem auto;display:flex;align-items:center;justify-content:center;background-color:var(--status-absent-bg);color:var(--status-absent);';
    iconWrap.innerHTML = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;
    body.appendChild(iconWrap);

    const titleEl = document.createElement('h3');
    titleEl.style.cssText = 'font-size:1.15rem;font-weight:700;color:var(--text-main);margin-bottom:0.5rem;';
    titleEl.textContent = opts.title || 'Confirm Action';
    body.appendChild(titleEl);

    const msgEl = document.createElement('p');
    msgEl.style.cssText = 'font-size:0.875rem;color:var(--text-muted);line-height:1.45;margin-bottom:1.25rem;';
    msgEl.textContent = opts.message || 'Are you sure you want to proceed?';
    body.appendChild(msgEl);

    if (opts.targetName) {
      const targetP = document.createElement('div');
      targetP.style.cssText = 'font-size:0.875rem;font-weight:600;color:var(--text-main);background:var(--bg-surface);padding:0.5rem;border-radius:var(--radius-sm);margin-bottom:1.25rem;border:1px solid var(--border-color);';
      targetP.textContent = opts.targetName;
      body.appendChild(targetP);
    }

    let typeInput = null;
    if (opts.requireTyping) {
      const typeWrap = document.createElement('div');
      typeWrap.style.cssText = 'text-align:left;margin-bottom:1.25rem;';
      typeWrap.innerHTML = `
        <label class="form-label" style="font-size:0.8125rem;">Type <strong>${opts.requireTyping}</strong> to confirm:</label>
        <input type="text" class="form-control" id="v2-confirm-typing" placeholder="Type here..." autocomplete="off">
      `;
      body.appendChild(typeWrap);
      typeInput = typeWrap.querySelector('input');
    }

    const errorBanner = document.createElement('div');
    errorBanner.className = 'form-error';
    errorBanner.style.display = 'none';
    errorBanner.style.padding = '0.6rem 0.85rem';
    errorBanner.style.borderRadius = 'var(--radius-sm)';
    errorBanner.style.backgroundColor = 'var(--status-absent-bg)';
    errorBanner.style.border = '1px solid var(--status-absent)';
    errorBanner.style.marginBottom = '1rem';
    body.appendChild(errorBanner);

    card.appendChild(body);

    const footer = document.createElement('div');
    footer.className = 'v2-dialog-footer';
    footer.style.justifyContent = 'center';
    footer.innerHTML = `
      <button type="button" class="btn btn-secondary v2-cancel-btn" style="flex:1;">Cancel</button>
      <button type="button" class="btn btn-${opts.confirmVariant || 'danger'} v2-confirm-btn" style="flex:1;">${opts.confirmText || 'Delete'}</button>
    `;
    card.appendChild(footer);

    backdrop.appendChild(card);
    document.body.appendChild(backdrop);
    document.body.classList.add('modal-open');

    activeDialog = backdrop;

    const confirmBtn = footer.querySelector('.v2-confirm-btn');
    if (opts.requireTyping) {
      confirmBtn.disabled = true;
      typeInput.addEventListener('input', () => {
        confirmBtn.disabled = typeInput.value.trim() !== String(opts.requireTyping).trim();
      });
    }

    footer.querySelector('.v2-cancel-btn').addEventListener('click', closeActiveDialog);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeActiveDialog();
    });

    confirmBtn.addEventListener('click', async () => {
      const origText = confirmBtn.textContent;
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Processing...';
      errorBanner.style.display = 'none';

      try {
        if (opts.onConfirm) {
          await opts.onConfirm();
        }
        closeActiveDialog();
      } catch (err) {
        errorBanner.textContent = err.message || 'Operation failed.';
        errorBanner.style.display = 'block';
        confirmBtn.disabled = false;
        confirmBtn.textContent = origText;
      }
    });

    requestAnimationFrame(() => {
      backdrop.classList.add('open');
      trapFocus(backdrop);
    });
  }

  /**
   * Open an Inspect / Details Dialog (e.g. for audit logs, JSON payloads, entity details)
   * @param {Object} opts
   * @param {string} opts.title - Modal title
   * @param {string} [opts.subtitle] - Metadata or summary line
   * @param {Object|string} opts.content - Payload (object will be JSON pretty-printed)
   * @param {string} [opts.closeLabel] - Close button text (default: 'Close')
   */
  function openDetailDialog(opts) {
    closeActiveDialog();

    const backdrop = document.createElement('div');
    backdrop.className = 'v2-dialog-backdrop';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');

    const card = document.createElement('div');
    card.className = 'v2-dialog-card';
    card.style.maxWidth = '580px';

    const handle = document.createElement('div');
    handle.className = 'v2-sheet-handle';
    card.appendChild(handle);

    const header = document.createElement('div');
    header.className = 'v2-dialog-header';
    header.innerHTML = `
      <div>
        <h2 class="v2-dialog-title">${opts.title || 'Event Details'}</h2>
        ${opts.subtitle ? `<div class="v2-dialog-subtitle" style="word-break:break-word;">${opts.subtitle}</div>` : ''}
      </div>
      <button type="button" class="v2-dialog-close" aria-label="Close dialog">&times;</button>
    `;
    card.appendChild(header);

    const body = document.createElement('div');
    body.className = 'v2-dialog-body';

    const pre = document.createElement('pre');
    pre.style.cssText = 'background:var(--bg-surface);border:1px solid var(--border-color);border-radius:var(--radius-sm);padding:0.85rem;font-family:var(--font-family-mono);font-size:0.78rem;max-height:300px;overflow-y:auto;color:var(--text-main);white-space:pre-wrap;word-break:break-all;margin:0;';
    
    if (typeof opts.content === 'object' && opts.content !== null) {
      pre.textContent = JSON.stringify(opts.content, null, 2);
    } else {
      pre.textContent = opts.content || 'No details available.';
    }
    body.appendChild(pre);
    card.appendChild(body);

    const footer = document.createElement('div');
    footer.className = 'v2-dialog-footer';
    footer.style.justifyContent = 'flex-end';
    footer.innerHTML = `
      <button type="button" class="btn btn-secondary v2-cancel-btn">${opts.closeLabel || 'Close'}</button>
    `;
    card.appendChild(footer);

    backdrop.appendChild(card);
    document.body.appendChild(backdrop);
    document.body.classList.add('modal-open');

    activeDialog = backdrop;

    header.querySelector('.v2-dialog-close').addEventListener('click', closeActiveDialog);
    footer.querySelector('.v2-cancel-btn').addEventListener('click', closeActiveDialog);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeActiveDialog();
    });

    requestAnimationFrame(() => {
      backdrop.classList.add('open');
      trapFocus(backdrop);
    });
  }

  // Export to window
  window.openDynamicForm = openDynamicForm;
  window.openConfirm = openConfirm;
  window.openDetailDialog = openDetailDialog;
  window.closeDialog = closeActiveDialog;

})(window);

