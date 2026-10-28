/**
 * ══════════════════════════════════════════════════════════════
 * VIDYAOS ADMIN TOP HEADER ENGINE (header.js)
 * Location: /frontend/admin/components/header/header.js
 * 
 * - Handles Top Header mounting inside .admin-main-wrap
 * - Global shortcut: Ctrl+K / Cmd+K focuses search
 * - Theme toggle (Light / Dark mode) with persistence
 * - User Profile popover toggle and outside-click dismissal
 * - Live user name and avatar population
 * ══════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  /**
   * 1. Mount Top Header if missing from .admin-main-wrap
   */
  function mountAdminHeader() {
    if (typeof document === 'undefined') return;
    const mainWrap = document.querySelector('.admin-main-wrap');
    if (!mainWrap || document.getElementById('admin-top-header')) return;

    const headerHtml = `
      <header class="admin-top-header" id="admin-top-header" aria-label="Admin Header Bar">
        <div class="header-left">
          <button type="button" class="header-menu-toggle-btn" id="header-sidebar-toggle-btn" onclick="toggleDesktopSidebar()" title="Toggle Navigation Menu" aria-label="Toggle Navigation Menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          <div class="header-search-wrap">
            <svg class="header-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" class="header-search-input" id="admin-global-search" placeholder="Search students, faculty, departments, etc..." autocomplete="off" aria-label="Global Search">
            <kbd class="search-kbd-badge" title="Press Ctrl + K to focus search">Ctrl + K</kbd>
          </div>
        </div>

        <div class="header-right">
          <button type="button" class="header-icon-btn header-theme-toggle" id="theme-toggle-btn" onclick="toggleDashboardTheme()" title="Toggle Dark/Light Mode" aria-label="Toggle Dark/Light Mode">
            <svg class="icon-theme" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          </button>

          <button type="button" class="header-icon-btn header-bell-btn" onclick="toggleNotifications(event)" title="3 Unread Notifications" aria-label="Notifications">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <span class="header-bell-badge">3</span>
          </button>

          <div class="header-user-profile" id="header-user-profile" onclick="toggleAdminProfileMenu(event)" role="button" tabindex="0" aria-haspopup="true" aria-expanded="false" title="System Administrator Profile">
            <div class="user-avatar-badge" aria-hidden="true">
              <span id="header-user-initials">SA</span>
            </div>
            <div class="user-info-text">
              <span class="user-name" id="top-header-user-name">Admin</span>
              <span class="user-role">System Administrator</span>
            </div>
            <svg class="user-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>

          <div class="header-profile-dropdown" id="header-profile-dropdown" aria-hidden="true">
            <a href="/admin/profile.html" class="profile-dropdown-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="4"></circle><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path></svg>
              <span>My Profile</span>
            </a>
            <a href="/admin/settings.html" class="profile-dropdown-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
              <span>System Settings</span>
            </a>
            <div class="profile-dropdown-divider"></div>
            <button type="button" class="profile-dropdown-item dropdown-logout-btn" onclick="logout()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>
    `;

    mainWrap.insertAdjacentHTML('afterbegin', headerHtml);
    syncHeaderIdentity();
  }

  /**
   * 2. Synchronize Header User Identity
   */
  function syncHeaderIdentity() {
    try {
      const user = (typeof window.getCurrentUser === 'function')
        ? window.getCurrentUser()
        : JSON.parse(localStorage.getItem('user') || 'null');

      if (!user) return;

      const name = user.full_name || user.name || user.username || 'Admin';
      const elName = document.getElementById('top-header-user-name');
      const elInitials = document.getElementById('header-user-initials');

      if (elName) elName.textContent = name;
      if (elInitials) {
        const parts = name.trim().split(/\s+/);
        const initials = parts.length >= 2
          ? (parts[0][0] + parts[1][0]).toUpperCase()
          : name.slice(0, 2).toUpperCase();
        elInitials.textContent = initials || 'SA';
      }
    } catch (_) {}
  }

  /**
   * 3. Toggle Profile Dropdown
   */
  function toggleAdminProfileMenu(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    const dropdown = document.getElementById('header-profile-dropdown');
    const trigger = document.getElementById('header-user-profile');
    if (!dropdown || !trigger) return;

    const isOpen = dropdown.classList.contains('open');
    if (isOpen) {
      dropdown.classList.remove('open');
      dropdown.setAttribute('aria-hidden', 'true');
      trigger.setAttribute('aria-expanded', 'false');
    } else {
      dropdown.classList.add('open');
      dropdown.setAttribute('aria-hidden', 'false');
      trigger.setAttribute('aria-expanded', 'true');
    }
  }

  // Dismiss dropdown on outside click
  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('header-profile-dropdown');
    const trigger = document.getElementById('header-user-profile');
    if (dropdown && dropdown.classList.contains('open')) {
      if (!dropdown.contains(e.target) && !trigger.contains(e.target)) {
        dropdown.classList.remove('open');
        dropdown.setAttribute('aria-hidden', 'true');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
      }
    }
  });

  /**
   * 4. Theme Toggle Engine
   */
  function toggleDashboardTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    try {
      localStorage.setItem('theme', nextTheme);
    } catch (_) {}
  }

  /**
   * 5. Global Keyboard Shortcut: Ctrl + K / Cmd + K to focus Search
   */
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      const searchInput = document.getElementById('admin-global-search');
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    }
  });

  // Attach to window
  window.mountAdminHeader = mountAdminHeader;
  window.toggleAdminProfileMenu = toggleAdminProfileMenu;
  window.toggleDashboardTheme = toggleDashboardTheme;

  // Mount on DOM ready
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', mountAdminHeader);
    } else {
      mountAdminHeader();
    }
  }
})();
