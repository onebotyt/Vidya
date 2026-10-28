/**
 * ══════════════════════════════════════════════════════════════
 * VIDYAOS ADMIN DUAL-STATE NAVIGATION ENGINE (sidebar.js)
 * Location: /frontend/admin/components/sidebar/sidebar.js
 * 
 * - Dynamically mounts:
 *   1. .mobile-top-header (Mobile only, <= 768px)
 *   2. #app-sidebar (Desktop 72px rail / 250px expanded / Mobile 280px drawer)
 *   3. #sidebar-backdrop (Mobile drawer overlay)
 * - Restores and persists desktop collapsed rail state (localStorage: admin_sidebar_collapsed)
 * - Zero layout shift on navigation
 * - Keyboard shortcuts: Ctrl+B (Toggle), Escape (Dismiss)
 * ══════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  // Navigation module registry for Admin portal
  const ADMIN_NAV_ITEMS = [
    { key: 'dashboard', label: 'Dashboard', href: '/admin/dashboard.html', icon: 'dashboard' },
    { key: 'academics', label: 'Academic Structure', href: '/admin/academic-structure.html', icon: 'academicStructure' },
    { key: 'faculty', label: 'HOD Management', href: '/admin/faculty.html', icon: 'hodManagement' },
    { key: 'reports', label: 'Reports & Analytics', href: '/admin/reports.html', icon: 'reports' },
    { key: 'settings', label: 'System Settings', href: '/admin/settings.html', icon: 'settings' },
    { key: 'audit', label: 'Audit Logs', href: '/admin/audit-logs.html', icon: 'audit' }
  ];

  /**
   * Helper to fetch SVG from window.ADMIN_ICONS or return inline fallback
   */
  function getIcon(name, options = {}) {
    if (window.ADMIN_ICONS && typeof window.ADMIN_ICONS.get === 'function') {
      const svg = window.ADMIN_ICONS.get(name, options);
      if (svg) return svg;
    }
    return '';
  }

  /**
   * 1. Initialize Desktop Sidebar State (Instant / Zero Layout Shift)
   */
  function initDesktopState() {
    try {
      const saved = localStorage.getItem('admin_sidebar_collapsed');
      // Default to collapsed (72px rail) if unset or true
      const shouldCollapse = (saved === null || saved === 'true');
      if (shouldCollapse && window.innerWidth >= 769) {
        document.documentElement.classList.add('sidebar-collapsed');
        document.body.classList.add('sidebar-collapsed');
        const layout = document.getElementById('admin-app-layout');
        if (layout) layout.classList.add('sidebar-collapsed');
      } else if (saved === 'false') {
        document.documentElement.classList.remove('sidebar-collapsed');
        document.body.classList.remove('sidebar-collapsed');
        const layout = document.getElementById('admin-app-layout');
        if (layout) layout.classList.remove('sidebar-collapsed');
      }
    } catch (_) {}
  }

  // Run instant state detection immediately
  initDesktopState();

  /**
   * 2. Toggle Desktop Sidebar (72px Rail <-> 250px Expanded)
   */
  function toggleDesktopSidebar() {
    const layout = document.getElementById('admin-app-layout') || document.body;
    const isCurrentlyCollapsed = document.documentElement.classList.contains('sidebar-collapsed') ||
                                 document.body.classList.contains('sidebar-collapsed') ||
                                 layout.classList.contains('sidebar-collapsed');

    const nextState = !isCurrentlyCollapsed;

    if (nextState) {
      document.documentElement.classList.add('sidebar-collapsed');
      document.body.classList.add('sidebar-collapsed');
      layout.classList.add('sidebar-collapsed');
      localStorage.setItem('admin_sidebar_collapsed', 'true');
    } else {
      document.documentElement.classList.remove('sidebar-collapsed');
      document.body.classList.remove('sidebar-collapsed');
      layout.classList.remove('sidebar-collapsed');
      localStorage.setItem('admin_sidebar_collapsed', 'false');
    }
  }

  /**
   * 3. Toggle Mobile Drawer (<= 768px)
   */
  function toggleSidebar() {
    if (window.innerWidth >= 769) {
      toggleDesktopSidebar();
      return;
    }
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (!sidebar) return;

    const isOpen = sidebar.classList.contains('open') || sidebar.classList.contains('sidebar-open');
    if (isOpen) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }

  function openSidebar() {
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (sidebar) {
      sidebar.classList.add('open', 'sidebar-open');
    }
    if (backdrop) {
      backdrop.classList.add('open', 'active');
    }
    document.body.style.overflow = (window.innerWidth <= 768) ? 'hidden' : '';
  }

  function closeSidebar() {
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (sidebar) {
      sidebar.classList.remove('open', 'sidebar-open');
    }
    if (backdrop) {
      backdrop.classList.remove('open', 'active');
    }
    document.body.style.overflow = '';
  }

  /**
   * 4. Notifications Popover / Alert Feedback
   */
  function toggleNotifications(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    alert('Administrative notifications: All institutional systems operating normally.');
  }

  /**
   * 5. Logout Session Function
   */
  function adminLogout() {
    if (typeof window.logout === 'function') {
      window.logout();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login.html';
    }
  }

  /**
   * 6. Dynamic Component Mounting Engine
   */
  function mountAdminNavigation() {
    if (typeof document === 'undefined') return;
    const layout = document.getElementById('admin-app-layout') || document.body;
    if (!layout) return;

    const currentPath = (window.location.pathname || '').toLowerCase();

    // ── A. Mount Mobile Top Header (<= 768px only) if missing ──
    if (!document.getElementById('mobile-top-header')) {
      const menuSvg = getIcon('menu', { width: 20, height: 20, stroke: 2.2 }) ||
        `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`;

      const instSvg = getIcon('institution', { width: 18, height: 18, stroke: 2 }) ||
        `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M3 10h18M5 10v11M19 10v11M9 10v11M15 10v11M12 2L2 7h20L12 2z"></path></svg>`;

      const bellSvg = getIcon('bell', { width: 18, height: 18, stroke: 2 }) ||
        `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>`;

      const mobileHeaderHtml = `
        <header class="mobile-top-header" id="mobile-top-header">
          <div class="mobile-header-left">
            <button type="button" class="mobile-hamburger-btn" id="mobile-sidebar-toggle-btn" onclick="toggleSidebar()" aria-label="Open Navigation Menu">
              ${menuSvg}
            </button>
          </div>
          <div class="mobile-header-center">
            <a href="/admin/dashboard.html" class="mobile-brand-link">
              <span class="mobile-brand-icon">${instSvg}</span>
              <span class="mobile-brand-text">VidyaOS</span>
            </a>
          </div>
          <div class="mobile-header-right">
            <button type="button" class="mobile-header-icon-btn mobile-bell-btn" onclick="toggleNotifications(event)" aria-label="Notifications">
              ${bellSvg}
              <span class="mobile-bell-badge">1</span>
            </button>
          </div>
        </header>
      `;
      layout.insertAdjacentHTML('afterbegin', mobileHeaderHtml);
    }

    // ── B. Mount Dual-State Sidebar (#app-sidebar) if missing ──
    if (!document.getElementById('app-sidebar')) {
      const cubeSvg = getIcon('cube', { width: 32, height: 32, className: 'rail-cube-logo' }) ||
        `<svg class="rail-cube-logo" width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 3L28 9.5L16 16L4 9.5L16 3Z" fill="var(--color-primary-light, hsl(215 90% 95%))"/><path d="M4 9.5L16 16V29L4 22.5V9.5Z" fill="var(--color-primary, hsl(217 91% 60%))"/><path d="M16 16L28 9.5V22.5L16 29V16Z" fill="var(--color-primary-hover, hsl(224 76% 48%))"/></svg>`;

      const railMenuSvg = getIcon('menu', { width: 18, height: 18, stroke: 2 }) ||
        `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`;

      const expandChevronSvg = getIcon('chevronRight', { width: 14, height: 14, stroke: 2.5 }) ||
        `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>`;

      const pauseSvg = getIcon('pause', { width: 14, height: 14, stroke: 2.5 }) ||
        `<svg class="icon-pause" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="10" y1="5" x2="10" y2="19"></line><line x1="14" y1="5" x2="14" y2="19"></line></svg>`;

      const closeSvg = getIcon('close', { width: 18, height: 18, stroke: 2.2 }) ||
        `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

      const userSvg = getIcon('user', { width: 20, height: 20, stroke: 2 }) ||
        `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;

      const signoutSvg = getIcon('logout', { width: 20, height: 20, stroke: 2 }) ||
        `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>`;

      // Render Navigation items
      const navItemsHtml = ADMIN_NAV_ITEMS.map(item => {
        const isActive = currentPath.endsWith(item.href) ||
                         currentPath.endsWith(item.href.replace('.html', '')) ||
                         (item.key === 'dashboard' && (currentPath === '/admin/' || currentPath.endsWith('/admin') || currentPath.endsWith('/admin/dashboard.html') || currentPath.endsWith('/admin/dashboard')));

        const activeCls = isActive ? ' active' : '';
        const itemSvg = getIcon(item.icon, { width: 20, height: 20, stroke: 2 }) || '';

        return `
          <a href="${item.href}" class="sidebar-nav-item${activeCls}" data-nav="${item.key}" data-tooltip="${item.label}" title="${item.label}" onclick="if(window.innerWidth<=768)closeSidebar()">
            <span class="sidebar-nav-icon">${itemSvg}</span>
            <span class="sidebar-nav-label">${item.label}</span>
          </a>
        `;
      }).join('');

      const sidebarHtml = `
        <aside id="app-sidebar" class="admin-sidebar" aria-label="Admin Navigation">
          <!-- A. Rail Header (Desktop Collapsed 72px Rail) -->
          <div class="sidebar-rail-header" aria-hidden="true">
            <a href="/admin/dashboard.html" class="rail-logo-link" title="VidyaOS Admin">
              ${cubeSvg}
            </a>
            <div class="rail-controls">
              <button type="button" class="rail-menu-icon" onclick="toggleDesktopSidebar()" aria-label="Menu" title="Menu">
                ${railMenuSvg}
              </button>
              <button type="button" class="rail-expand-btn" onclick="toggleDesktopSidebar()" title="Expand sidebar" aria-label="Expand sidebar">
                ${expandChevronSvg}
              </button>
            </div>
          </div>

          <!-- B. Expanded Header (Desktop Expanded & Mobile Drawer) -->
          <div class="sidebar-expanded-header">
            <div class="sidebar-header-left">
              <span class="sidebar-header-menu-icon" aria-hidden="true">${railMenuSvg}</span>
              <span class="sidebar-header-title">VidyaOS Console</span>
            </div>
            <button type="button" class="sidebar-desktop-collapse-btn" onclick="toggleDesktopSidebar()" title="Collapse sidebar" aria-label="Collapse sidebar">
              ${pauseSvg}
            </button>
            <button type="button" class="sidebar-mobile-close-btn" onclick="closeSidebar()" title="Close menu" aria-label="Close menu">
              ${closeSvg}
            </button>
          </div>

          <!-- C. Navigation Links -->
          <nav class="sidebar-nav-body" aria-label="Admin Navigation Links">
            ${navItemsHtml}
          </nav>

          <!-- D. Sidebar Footers -->
          <div class="sidebar-expanded-footer">
            <div class="sidebar-brand-credit">VidyaOS &bull; Admin</div>
            <button type="button" class="sidebar-signout-btn" onclick="adminLogout()" title="Sign Out">Sign Out</button>
          </div>

          <div class="sidebar-rail-footer" aria-hidden="true">
            <a href="/admin/profile.html" class="rail-footer-btn" title="Admin Profile" aria-label="Admin Profile">
              ${userSvg}
            </a>
            <button type="button" class="rail-footer-btn rail-signout-btn" onclick="adminLogout()" title="Sign Out" aria-label="Sign Out">
              ${signoutSvg}
            </button>
          </div>
        </aside>

        <div id="sidebar-backdrop" class="gc-drawer-backdrop sidebar-backdrop" onclick="closeSidebar()"></div>
      `;

      // Insert sidebar immediately before .admin-main-wrap or append
      const mainWrap = document.querySelector('.admin-main-wrap');
      if (mainWrap) {
        mainWrap.insertAdjacentHTML('beforebegin', sidebarHtml);
      } else {
        layout.insertAdjacentHTML('beforeend', sidebarHtml);
      }
    }
  }

  /**
   * 7. Global Keyboard Event Listeners
   */
  document.addEventListener('keydown', function (e) {
    // Escape closes mobile drawer or collapses desktop sidebar
    if (e.key === 'Escape') {
      if (window.innerWidth <= 768) {
        closeSidebar();
      }
    }
    // Ctrl+B or Cmd+B toggles sidebar
    if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
      e.preventDefault();
      if (window.innerWidth >= 769) {
        toggleDesktopSidebar();
      } else {
        toggleSidebar();
      }
    }
  });

  // Export functions to window
  window.toggleDesktopSidebar = toggleDesktopSidebar;
  window.toggleSidebar = toggleSidebar;
  window.openSidebar = openSidebar;
  window.closeSidebar = closeSidebar;
  window.toggleNotifications = toggleNotifications;
  window.adminLogout = adminLogout;
  window.mountAdminNavigation = mountAdminNavigation;

  // Mount navigation as soon as DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initDesktopState();
      mountAdminNavigation();
    });
  } else {
    initDesktopState();
    mountAdminNavigation();
  }

})();
