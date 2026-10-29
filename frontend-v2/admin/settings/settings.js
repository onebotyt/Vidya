/**
 * VidyaOS Institutional Settings Controller
 * Location: /admin/settings/settings.js
 * 
 * Declarative component-driven controller using:
 *  - showToast (UI-003)
 *  - Real-time live letterhead preview
 */

(function () {
  'use strict';

  // Guard: SYSTEM_ADMIN only
  if (typeof guardRoute === 'function') {
    guardRoute({ roles: ['SYSTEM_ADMIN'] });
  }

  function esc(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async function loadSettings(isManual = false) {
    try {
      const res = await fetchApi('/admin/settings');
      if (res && res.success && res.data) {
        const s = res.data.map || res.data || {};
        const elName = document.getElementById('setting-inst-name');
        const elCode = document.getElementById('setting-inst-code');
        const elAffil = document.getElementById('setting-affiliating-body');
        const elLoc = document.getElementById('setting-location');

        if (elName) elName.value = s.institution_name || 'Government Polytechnic College';
        if (elCode) elCode.value = s.institution_code || 'GP-UBTER-101';
        if (elAffil) elAffil.value = s.affiliating_body || 'UBTER (Uttarakhand Board of Technical Education) / IRDT';
        if (elLoc) elLoc.value = s.campus_location || 'Uttarakhand, India';

        updateLivePreview();
        if (isManual && typeof showToast === 'function') {
          showToast('Settings reloaded from database', 'info');
        }
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      if (isManual && typeof showToast === 'function') {
        showToast('Failed to load settings: ' + err.message, 'error');
      }
    }
  }

  function updateLivePreview() {
    const name = document.getElementById('setting-inst-name')?.value?.trim() || 'Government Polytechnic College';
    const code = document.getElementById('setting-inst-code')?.value?.trim() || 'GP-UBTER-101';
    const affil = document.getElementById('setting-affiliating-body')?.value?.trim() || 'UBTER / IRDT Uttarakhand';
    const loc = document.getElementById('setting-location')?.value?.trim() || 'Uttarakhand, India';

    const pName = document.getElementById('preview-inst-name');
    if (pName) pName.textContent = name;
    const pCode = document.getElementById('preview-inst-code');
    if (pCode) pCode.textContent = code;
    const pAffil = document.getElementById('preview-affil');
    if (pAffil) pAffil.textContent = `${affil} \u2022 ${loc}`;
  }

  function resetToOfficialDefaults() {
    const elName = document.getElementById('setting-inst-name');
    const elCode = document.getElementById('setting-inst-code');
    const elAffil = document.getElementById('setting-affiliating-body');
    const elLoc = document.getElementById('setting-location');

    if (elName) elName.value = 'Government Polytechnic College';
    if (elCode) elCode.value = 'GP-UBTER-101';
    if (elAffil) elAffil.value = 'UBTER (Uttarakhand Board of Technical Education) / IRDT';
    if (elLoc) elLoc.value = 'Uttarakhand, India';

    updateLivePreview();
    if (typeof showToast === 'function') {
      showToast('Official UBTER defaults loaded. Click "Save Changes" to apply.', 'info');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadSettings();

    const reloadBtn = document.getElementById('btn-reload');
    if (reloadBtn) {
      reloadBtn.addEventListener('click', () => loadSettings(true));
    }

    const resetBtn = document.getElementById('btn-reset-defaults');
    if (resetBtn) {
      resetBtn.addEventListener('click', resetToOfficialDefaults);
    }

    // Real-time input listeners to live-sync the preview letterhead
    ['setting-inst-name', 'setting-inst-code', 'setting-affiliating-body', 'setting-location'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', updateLivePreview);
      }
    });

    const form = document.getElementById('identity-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('save-settings-btn');
        const origText = btn ? btn.innerHTML : '';
        if (btn) {
          btn.disabled = true;
          btn.innerHTML = `
            <div class="spinner" style="width:14px;height:14px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:6px;"></div>
            <span>Saving...</span>
          `;
        }

        try {
          const res = await fetchApi('/admin/settings', {
            method: 'PUT',
            body: JSON.stringify({
              settings: {
                institution_name: document.getElementById('setting-inst-name')?.value?.trim() || '',
                institution_code: document.getElementById('setting-inst-code')?.value?.trim() || '',
                affiliating_body: document.getElementById('setting-affiliating-body')?.value?.trim() || '',
                campus_location: document.getElementById('setting-location')?.value?.trim() || '',
              },
            }),
          });

          if (res && res.success) {
            if (typeof showToast === 'function') {
              showToast('Institutional settings saved successfully', 'success');
            }
            await loadSettings();
          } else {
            throw new Error(res?.error?.message || 'Failed to save settings');
          }
        } catch (err) {
          console.error('Error saving settings:', err);
          if (typeof showToast === 'function') {
            showToast('Failed to save settings: ' + err.message, 'error');
          }
        } finally {
          if (btn) {
            btn.disabled = false;
            btn.innerHTML = origText;
          }
        }
      });
    }
  });
})();
