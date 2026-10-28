/**
 * ══════════════════════════════════════════════════════════════
 * HOD-002: DEPARTMENT POLICIES & SETTINGS CONTROLLER
 * Location: frontend-v2/faculty/hod-settings/hod-settings.js
 * 
 * Clean, declarative component-driven architecture:
 * - Pure token-driven styling
 * - Unified AppShell integration
 * - Granular security code validation for curriculum alteration
 * ══════════════════════════════════════════════════════════════
 */

// Route Guard for HOD
if (typeof guardRoute === 'function') {
  guardRoute({ roles: ['TEACHER', 'HOD', 'SYSTEM_ADMIN'], requireHOD: true });
}

// Fallback apiFetch wrapper
if (typeof window.apiFetch === 'undefined') {
  window.apiFetch = (endpoint, options) => {
    if (typeof apiRequest === 'function') return apiRequest(endpoint, options);
    if (typeof fetchApi === 'function') return fetchApi(endpoint.replace(/^\/api\/v1/, ''), options);
    const token = localStorage.getItem('token') || (typeof getAuthToken === 'function' ? getAuthToken() : '');
    const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
    return fetch(endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`, { ...options, headers: { ...headers, ...(options?.headers || {}) } })
      .then(r => r.json());
  };
}

let currentSettings = null;

// Initialization
async function init() {
  if (typeof renderNavbar === 'function') {
    renderNavbar();
  }
  await loadSettings();
}

async function loadSettings() {
  try {
    const res = await apiFetch('/hod/settings');
    if ((res.success || res.status === 'success' || res.data) && res.data) {
      currentSettings = res.data;
      renderSettings(res.data);
    }
  } catch (err) {
    if (typeof showToast === 'function') {
      showToast('Failed to load department settings: ' + err.message, 'error');
    }
  }
}

function renderSettings(d) {
  const header = document.getElementById('dept-header-name');
  if (header) header.textContent = `${d.department_name} — Policies & Settings`;

  const sub = document.getElementById('page-subtitle');
  if (sub) {
    sub.textContent = `Departmental curriculum specifications, attendance evaluation thresholds, and hardware scanner telemetry rules for ${d.department_name}.`;
  }

  // Telemetry KPIs
  const kpiDur = document.getElementById('kpi-duration');
  const kpiDurSub = document.getElementById('kpi-duration-sub');
  if (kpiDur) kpiDur.textContent = `${d.degree_duration_years} Years`;
  if (kpiDurSub) kpiDurSub.textContent = `Semesters 1 to ${d.degree_duration_years * 2}`;

  const kpiThresh = document.getElementById('kpi-threshold');
  if (kpiThresh) kpiThresh.textContent = `${d.defaulter_threshold_percent || 75}%`;

  const kpiRes = document.getElementById('kpi-resources');
  const kpiResSub = document.getElementById('kpi-resources-sub');
  if (kpiRes) kpiRes.textContent = `${d.teachers_count || 0} Faculty • ${d.students_count || 0} Students`;
  if (kpiResSub) kpiResSub.textContent = `${d.terminals_count || 0} Biometric Terminals Registered`;

  // Form Fields
  const selDur = document.getElementById('setting-duration');
  if (selDur) selDur.value = String(Math.min(d.degree_duration_years || 3, 4));

  const inpThresh = document.getElementById('setting-threshold');
  if (inpThresh) inpThresh.value = d.defaulter_threshold_percent || 75;

  // Governance Information
  const mDeptName = document.getElementById('m-dept-name');
  const mDeptCode = document.getElementById('m-dept-code');
  const confirmCodeLbl = document.getElementById('confirm-dept-code-label');
  const mHodName = document.getElementById('m-hod-name');
  const mHodEmail = document.getElementById('m-hod-email');

  if (mDeptName) mDeptName.textContent = d.department_name;
  if (mDeptCode) mDeptCode.textContent = d.department_code;
  if (confirmCodeLbl) confirmCodeLbl.textContent = d.department_code;
  if (mHodName) mHodName.textContent = d.hod_name || 'Department Leadership';
  if (mHodEmail) mHodEmail.textContent = d.hod_email || 'hod@college.edu';

  onDurationChange();
}

function onDurationChange() {
  const selEl = document.getElementById('setting-duration');
  if (!selEl) return;
  const selected = parseInt(selEl.value, 10);
  const original = currentSettings ? currentSettings.degree_duration_years : 3;
  const confirmBox = document.getElementById('duration-confirm-box');
  const confirmInput = document.getElementById('setting-confirm-code');

  if (selected !== original) {
    if (confirmBox) confirmBox.style.display = 'block';
  } else {
    if (confirmBox) confirmBox.style.display = 'none';
    if (confirmInput) confirmInput.value = '';
  }
}

async function saveCurriculumSettings() {
  if (!currentSettings) return;
  const selEl = document.getElementById('setting-duration');
  const duration = parseInt(selEl.value, 10);
  const btn = document.getElementById('save-curriculum-btn');

  // Verify security code if duration changed
  if (duration !== currentSettings.degree_duration_years) {
    const codeInput = document.getElementById('setting-confirm-code')?.value.trim().toUpperCase();
    if (codeInput !== currentSettings.department_code.toUpperCase()) {
      if (typeof showToast === 'function') {
        showToast(`Please enter your exact department code (${currentSettings.department_code}) to confirm changing degree duration.`, 'warning');
      }
      return;
    }
  }

  btn.disabled = true;
  btn.textContent = 'Saving...';

  try {
    const res = await apiFetch('/hod/settings', {
      method: 'PUT',
      body: JSON.stringify({
        degree_duration_years: duration
      })
    });
    if (res.success || res.status === 'success') {
      if (typeof showToast === 'function') {
        showToast('Curriculum duration saved successfully!', 'success');
      }
      await loadSettings();
    }
  } catch (err) {
    if (typeof showToast === 'function') {
      showToast(err.message || 'Failed to update curriculum settings.', 'error');
    }
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Curriculum Settings';
  }
}

async function savePolicySettings() {
  const inp = document.getElementById('setting-threshold');
  const threshold = parseInt(inp?.value, 10);
  if (isNaN(threshold) || threshold < 50 || threshold > 100) {
    if (typeof showToast === 'function') {
      showToast('Threshold must be a percentage between 50% and 100%.', 'warning');
    }
    return;
  }

  const btn = document.getElementById('save-policy-btn');
  btn.disabled = true;
  btn.textContent = 'Updating...';

  try {
    const res = await apiFetch('/hod/settings', {
      method: 'PUT',
      body: JSON.stringify({
        defaulter_threshold_percent: threshold
      })
    });
    if (res.success || res.status === 'success') {
      if (typeof showToast === 'function') {
        showToast('Attendance eligibility threshold updated successfully!', 'success');
      }
      await loadSettings();
    }
  } catch (err) {
    if (typeof showToast === 'function') {
      showToast(err.message || 'Failed to update threshold settings.', 'error');
    }
  } finally {
    btn.disabled = false;
    btn.textContent = 'Update Attendance Threshold';
  }
}

// Window export for test contracts
window.loadSettings = loadSettings;
window.saveCurriculumSettings = saveCurriculumSettings;
window.savePolicySettings = savePolicySettings;
window.onDurationChange = onDurationChange;

init();
