/**
 * VidyaOS Administrator Security Profile Controller
 * Location: /admin/profile/profile.js
 * 
 * Declarative component-driven controller using:
 *  - showToast (UI-003)
 *  - StatCard telemetry metrics
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

  async function loadAdminProfile() {
    try {
      const res = await fetchApi('/auth/me');
      if (res && res.success && res.data) {
        renderAdminProfile(res.data);
      }
    } catch (err) {
      if (typeof showToast === 'function') {
        showToast(err.message || 'Failed to load administrator profile', 'error');
      }
    }
  }

  function renderAdminProfile(user) {
    const name = user.username || user.name || 'System Administrator';
    const email = user.email || 'admin@college.edu';
    const initials =
      name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase() || 'SA';

    const heroName = document.getElementById('hero-name');
    if (heroName) heroName.textContent = name;

    const heroEmail = document.getElementById('hero-email');
    if (heroEmail) heroEmail.textContent = email;

    const heroAvatar = document.getElementById('hero-avatar');
    if (heroAvatar) heroAvatar.textContent = initials;

    const inputUser = document.getElementById('admin-username');
    if (inputUser) inputUser.value = user.username || '';

    const inputEmail = document.getElementById('admin-email');
    if (inputEmail) inputEmail.value = email;
  }

  async function loadGovernanceMetrics() {
    try {
      const res = await fetchApi('/admin/stats');
      if (res && res.success && res.data) {
        const d = res.data;
        const setTxt = (id, val) => {
          const el = document.getElementById(id);
          if (el) el.textContent = val !== undefined && val !== null ? Number(val).toLocaleString() : '0';
        };

        setTxt('stat-dept', d.total_departments);
        setTxt('stat-teachers', d.total_teachers);
        setTxt('stat-students', d.total_students);
        setTxt('stat-registers', d.today_sessions);
        setTxt('stat-devices', d.active_terminals);
      }
    } catch (err) {
      console.warn('Could not load governance stats:', err);
    }
  }

  function setupPasswordToggles() {
    const toggleBtns = document.querySelectorAll('.btn-toggle-pass');
    toggleBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const input = document.getElementById(targetId);
        if (!input) return;

        if (input.type === 'password') {
          input.type = 'text';
          btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`;
        } else {
          input.type = 'password';
          btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadAdminProfile();
    loadGovernanceMetrics();
    setupPasswordToggles();

    // Profile Identity Form Submit
    const profileForm = document.getElementById('admin-profile-form');
    if (profileForm) {
      profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('save-admin-btn');
        const origText = btn ? btn.textContent : '';
        if (btn) {
          btn.disabled = true;
          btn.textContent = 'Saving...';
        }

        const username = document.getElementById('admin-username')?.value?.trim();
        const email = document.getElementById('admin-email')?.value?.trim();

        try {
          const res = await fetchApi('/admin/profile', {
            method: 'PUT',
            body: JSON.stringify({ username, email }),
          });
          if (res && res.success) {
            if (typeof showToast === 'function') {
              showToast('Administrator profile updated successfully!', 'success');
            }
            await loadAdminProfile();
          } else {
            throw new Error(res?.error?.message || 'Failed to update profile.');
          }
        } catch (err) {
          if (typeof showToast === 'function') {
            showToast(err.message || 'Error saving admin profile.', 'error');
          }
        } finally {
          if (btn) {
            btn.disabled = false;
            btn.textContent = origText;
          }
        }
      });
    }

    // Password Rotation Form Submit
    const passForm = document.getElementById('admin-pass-form');
    if (passForm) {
      passForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPassword = document.getElementById('admin-current-pass')?.value;
        const newPassword = document.getElementById('admin-new-pass')?.value;
        const confirmPassword = document.getElementById('admin-confirm-pass')?.value;

        if (newPassword !== confirmPassword) {
          if (typeof showToast === 'function') {
            showToast('New passwords do not match.', 'error');
          }
          return;
        }

        const btn = document.getElementById('save-pass-btn');
        const origText = btn ? btn.textContent : '';
        if (btn) {
          btn.disabled = true;
          btn.textContent = 'Updating...';
        }

        try {
          const res = await fetchApi('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword }),
          });
          if (res && res.success) {
            if (typeof showToast === 'function') {
              showToast('Password changed successfully!', 'success');
            }
            passForm.reset();
          } else {
            throw new Error(res?.error?.message || 'Failed to change password.');
          }
        } catch (err) {
          if (typeof showToast === 'function') {
            showToast(err.message || 'Failed to change password.', 'error');
          }
        } finally {
          if (btn) {
            btn.disabled = false;
            btn.textContent = origText;
          }
        }
      });
    }
  });
})();
