/**
 * ══════════════════════════════════════════════════════════════
 * VIDYAOS UNIVERSAL REUSABLE COLLAPSIBLE SIDEBAR ENGINE (sidebar.js)
 * Location: /components/sidebar/sidebar.js
 * 
 * Standalone client-side component loader and interaction controller:
 * - Mounts the reusable institutional sidebar into #sidebar-mount or replaces #app-sidebar
 * - Supports Admin, Faculty (with HOD awareness), and Student portals automatically
 * - Manages independent collapsible menu groups with smooth accordion animations
 * - Manages active-route highlighting and auto-expansion of active groups
 * - Provides full keyboard accessibility (Enter/Space, ARIA attributes)
 * - Supports mobile drawer open/close and backdrop dismissal
 * - Asynchronously populates dynamic classes into collapsible teaching/enrolled groups
 * ══════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  // Helper: Sanitize string for attribute/text output
  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // 1. Resolve Active Portal Configuration
  function resolvePortalConfig(overridePortal) {
    const configs = window.SIDEBAR_CONFIGS || {};
    if (overridePortal && configs[overridePortal]) {
      return configs[overridePortal];
    }

    const currentPath = window.location.pathname.toLowerCase();

    // Path-based resolution
    if (currentPath.includes('/faculty/')) {
      return configs.faculty || configs.admin;
    }
    if (currentPath.includes('/student/')) {
      return configs.student || configs.admin;
    }
    if (currentPath.includes('/admin/')) {
      return configs.admin;
    }

    // Role-based fallback from auth context if available
    if (typeof window.getCurrentUser === 'function') {
      const u = window.getCurrentUser();
      if (u) {
        if (u.roles?.includes('SYSTEM_ADMIN')) return configs.admin;
        if (u.roles?.includes('STUDENT')) return configs.student || configs.admin;
        if (u.roles?.includes('TEACHER') || u.is_hod) return configs.faculty || configs.admin;
      }
    }

    // Fallback to window.SIDEBAR_CONFIG or admin
    return window.SIDEBAR_CONFIG || configs.admin || Object.values(configs)[0];
  }

  // 2. Route Matching Logic
  function isRouteActive(item) {
    if (!item) return false;
    const currentPath = window.location.pathname.toLowerCase();
    const currentSearch = window.location.search.toLowerCase();
    const fullCurrent = (currentPath + currentSearch);
    const cleanCurrent = currentPath.replace(/\/index\.html$/, '').replace(/\.html$/, '').replace(/\/$/, '') || '/';

    // Direct href match
    if (item.href) {
      const itemHref = item.href.toLowerCase();
      // If href contains query parameter, require exact query match
      if (itemHref.includes('?')) {
        if (fullCurrent === itemHref || fullCurrent.includes(itemHref)) return true;
      } else {
        const cleanHref = itemHref.replace(/\/index\.html$/, '').replace(/\.html$/, '').replace(/\/$/, '') || '/';
        if (cleanCurrent === cleanHref) return true;
        if (cleanHref.endsWith('dashboard') && (cleanCurrent === '/faculty' || cleanCurrent === '/faculty/dashboard' || cleanCurrent === '/admin' || cleanCurrent === '/admin/dashboard' || cleanCurrent === '/student' || cleanCurrent === '/student/dashboard')) {
          return true;
        }
      }
    }

    // Check aliases
    if (Array.isArray(item.aliases)) {
      for (const alias of item.aliases) {
        const cleanAlias = alias.toLowerCase().replace(/\/index\.html$/, '').replace(/\.html$/, '').replace(/\/$/, '') || '/';
        if (cleanCurrent === cleanAlias || fullCurrent.includes(alias.toLowerCase())) return true;
      }
    }

    // Check nested children if any
    if (Array.isArray(item.children)) {
      for (const child of item.children) {
        if (isRouteActive(child)) return true;
      }
    }

    return false;
  }

  // 3. User Permission Check Helper
  function userHasPermission(itemOrGroup, user) {
    if (!itemOrGroup) return true;

    // Check explicit HOD requirement
    if (itemOrGroup.requiresHod) {
      if (user) return Boolean(user.is_hod);
      // Fallback: if URL includes hod, display it
      const p = window.location.pathname.toLowerCase();
      return p.includes('hod-') || p.includes('hod');
    }

    // Check Dept Faculty or HOD requirement
    if (itemOrGroup.requiresDeptOrHod) {
      if (user) {
        return Boolean(
          user.is_hod || 
          user.department_id || 
          user.teacher?.department_id || 
          user.is_class_teacher || 
          (Array.isArray(user.roles) && user.roles.some(r => ['TEACHER', 'HOD', 'SYSTEM_ADMIN'].includes(String(r).toUpperCase())))
        );
      }
      return true; // Default to visible on faculty pages
    }

    // Check role array
    if (Array.isArray(itemOrGroup.roles) && itemOrGroup.roles.length > 0) {
      if (!user) return true; // Default to visible so options NEVER disappear
      const userRoles = (Array.isArray(user.roles) ? user.roles : [user.role || '']).map(r => String(r).toLowerCase());
      if (userRoles.includes('system_admin') || userRoles.includes('admin') || userRoles.includes('superadmin')) return true;
      const hasRole = itemOrGroup.roles.some(r => {
        const lr = r.toLowerCase();
        if ((lr === 'admin' || lr === 'superadmin') && userRoles.includes('system_admin')) return true;
        return userRoles.includes(lr);
      });
      return hasRole;
    }

    return true;
  }

  // 4. Generate HTML Markup for Navigation Items
  function renderMenuItem(item, level = 1, user = null) {
    if (!userHasPermission(item, user)) return '';

    const active = isRouteActive(item);
    const hasChildren = Array.isArray(item.children) && item.children.length > 0;
    const levelClass = level > 1 ? `level-${level}` : '';

    // Action button (e.g., Join Class modal, theme toggle, sign out)
    if (item.isAction) {
      return `
        <button type="button" 
                class="gc-drawer-link gc-drawer-action-btn ${levelClass}" 
                id="${escapeHtml(item.id || '')}"
                onclick="${escapeHtml(item.onclick || '')}"
                title="${escapeHtml(item.label)}">
          ${item.iconSvg ? `<span class="gc-drawer-icon">${item.iconSvg}</span>` : ''}
          <span>${escapeHtml(item.label)}</span>
        </button>
      `;
    }

    // Collapsible Subgroup
    if (hasChildren) {
      const subId = `subgroup-${item.id || Math.random().toString(36).substr(2, 9)}`;
      const isSubActive = active;
      const childrenHtml = item.children.map(ch => renderMenuItem(ch, level + 1, user)).join('');

      return `
        <div class="gc-drawer-group gc-drawer-subgroup ${isSubActive ? 'expanded' : ''}" data-group-id="${subId}">
          <button type="button" class="gc-drawer-group-header ${levelClass}"
                  aria-expanded="${isSubActive ? 'true' : 'false'}"
                  aria-controls="${subId}-content"
                  id="${subId}-header">
            <span class="gc-drawer-group-title">
              ${item.iconSvg ? `<span class="gc-drawer-icon">${item.iconSvg}</span>` : ''}
              <span>${escapeHtml(item.label)}</span>
            </span>
            ${window.SIDEBAR_ICONS?.chevron || ''}
          </button>
          <div class="gc-drawer-group-content" id="${subId}-content" role="region" aria-labelledby="${subId}-header">
            <div class="gc-drawer-group-inner">
              ${childrenHtml}
            </div>
          </div>
        </div>
      `;
    }

    // Standard Link
    return `
      <a href="${escapeHtml(item.href || '#')}" 
         id="${escapeHtml(item.id || '')}"
         class="gc-drawer-link ${active ? 'active' : ''} ${levelClass}" 
         data-menu-id="${escapeHtml(item.id || '')}"
         onclick="if(window.innerWidth<=768&&typeof window.closeSidebar==='function')window.closeSidebar()">
        ${item.iconSvg ? `<span class="gc-drawer-icon">${item.iconSvg}</span>` : ''}
        <span>${escapeHtml(item.label)}</span>
        ${item.hasBadge ? `<span id="${escapeHtml(item.id)}-badge" class="gc-drawer-badge" style="display:none;"></span>` : ''}
      </a>
    `;
  }

  // 5. Render Navigation Groups
  function renderGroup(group, user = null) {
    if (!userHasPermission(group, user)) return '';

    const isCollapsible = group.collapsible !== false;
    const groupId = `group-${escapeHtml(group.id || Math.random().toString(36).substr(2, 9))}`;
    
    // Check if any child item inside this group is active
    let hasActiveChild = false;
    if (Array.isArray(group.items)) {
      hasActiveChild = group.items.some(item => isRouteActive(item));
    }

    // Auto-expand if active or if defaultExpanded is set
    const isExpanded = hasActiveChild || group.defaultExpanded !== false;
    
    // Items markup
    let bodyContent = '';
    if (group.customContent) {
      bodyContent += group.customContent;
    }
    if (Array.isArray(group.items)) {
      bodyContent += group.items.map(it => renderMenuItem(it, 1, user)).join('');
    }

    const chevronSvg = window.SIDEBAR_ICONS?.chevron || `<svg class="gc-drawer-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>`;

    if (!isCollapsible) {
      return `
        <div class="gc-drawer-group" data-group-id="${groupId}">
          <div class="gc-drawer-sec-title">${escapeHtml(group.label)}</div>
          <div class="gc-drawer-group-inner">
            ${bodyContent}
          </div>
        </div>
      `;
    }

    return `
      <div class="gc-drawer-group ${isExpanded ? 'expanded' : ''}" data-group-id="${groupId}">
        <button type="button" class="gc-drawer-group-header" 
                aria-expanded="${isExpanded ? 'true' : 'false'}" 
                aria-controls="${groupId}-content" 
                id="${groupId}-header">
          <span class="gc-drawer-group-title">
            ${group.iconSvg ? `<span class="gc-drawer-icon">${group.iconSvg}</span>` : ''}
            <span>${escapeHtml(group.label)}</span>
          </span>
          ${chevronSvg}
        </button>
        <div class="gc-drawer-group-content" id="${groupId}-content" role="region" aria-labelledby="${groupId}-header">
          <div class="gc-drawer-group-inner">
            ${bodyContent}
          </div>
        </div>
      </div>
    `;
  }

  // 6. Master Sidebar HTML Assembly
  function buildSidebarHtml(config, user = null) {
    const brand = config.brand || {};
    const footer = config.footer || {};
    const icons = window.SIDEBAR_ICONS || config.icons || {};

    // Dynamic footer text calculation
    let statusText = footer.statusText || 'VidyaOS';
    if (config.portalId === 'faculty' && user) {
      if (user.is_hod) {
        statusText = `VidyaOS • HOD - ${user.hod_department_name || user.department_name || 'Information Technology'}`;
      } else {
        statusText = 'VidyaOS • Faculty';
      }
    } else if (config.portalId === 'student') {
      statusText = 'VidyaOS • Student';
    } else if (config.portalId === 'admin') {
      statusText = 'VidyaOS • Admin';
    }

    // Top standalone items (e.g. Classes, Drive, Timetable)
    let topItemsHtml = '';
    if (Array.isArray(config.topItems) && config.topItems.length > 0) {
      topItemsHtml = `
        <div class="gc-top-links">
          ${config.topItems.map(item => renderMenuItem(item, 1, user)).join('')}
        </div>
        <div class="gc-drawer-divider"></div>
      `;
    }

    // Collapsible Groups
    const groupsHtml = Array.isArray(config.groups) 
      ? config.groups.map(g => renderGroup(g, user)).join('') 
      : '';

    const closeSvg = icons.close || `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    const logoutSvg = footer.logoutIconSvg || icons.logout || `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`;

    return `
      <aside id="app-sidebar" class="app-sidebar gc-drawer" aria-label="Navigation Sidebar">
        <div class="gc-drawer-header">
          <a href="${escapeHtml(brand.href || '#')}" class="gc-brand-link">
            <div class="gc-brand-icon">
              ${brand.iconSvg || icons.gradCap || icons.building}
            </div>
            <div class="gc-brand-title-wrap">
              <span class="gc-brand-title">${escapeHtml(brand.title || 'Classroom')}</span>
              <span class="gc-brand-sub">${escapeHtml(brand.badge || 'VidyaOS')}</span>
            </div>
          </a>
          <button type="button" class="gc-drawer-close-btn" onclick="window.closeSidebar()" aria-label="Close menu" title="Close menu">
            ${closeSvg}
          </button>
        </div>

        <div class="gc-drawer-body">
          ${topItemsHtml}
          ${groupsHtml}
        </div>

        <div class="gc-drawer-footer">
          <div class="gc-drawer-status-pill">
            <span class="gc-drawer-dot"></span>
            <span>${escapeHtml(statusText)}</span>
          </div>
          <button type="button" class="gc-drawer-logout-btn" onclick="if(typeof logout==='function'){logout();}else{localStorage.clear();window.location.href='/index.html';}" title="Sign out of system">
            ${logoutSvg}
            <span>${escapeHtml(footer.logoutLabel || 'Logout')}</span>
          </button>
        </div>
      </aside>
      <div id="sidebar-backdrop" class="gc-drawer-backdrop sidebar-backdrop" onclick="window.closeSidebar()"></div>
    `;
  }

  // 7. Accordion Click and Keyboard Handlers
  function setupAccordionHandlers(sidebarElement) {
    if (!sidebarElement) return;
    const headers = sidebarElement.querySelectorAll('.gc-drawer-group-header');

    headers.forEach(header => {
      const toggle = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        const group = header.closest('.gc-drawer-group');
        if (!group) return;

        const isCurrentlyExpanded = header.getAttribute('aria-expanded') === 'true' || group.classList.contains('expanded');
        const nextState = !isCurrentlyExpanded;

        header.setAttribute('aria-expanded', nextState ? 'true' : 'false');
        group.classList.toggle('expanded', nextState);
      };

      header.addEventListener('click', toggle);

      // Keyboard accessibility (Enter and Space)
      header.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          toggle(e);
        }
      });
    });
  }

  // 8. Dynamic Teaching & Enrolled Classes Loader
  async function loadDynamicClasses(portalId) {
    const container = document.getElementById('drawer-classes-list');
    if (!container) return;

    const token = (typeof window.getAuthToken === 'function') 
      ? window.getAuthToken() 
      : localStorage.getItem('auth_token');
    
    if (!token) return;

    const currentUrl = (window.location.pathname + window.location.search).toLowerCase();

    if (portalId === 'faculty') {
      try {
        const res = await fetch('/api/v1/teaching-groups?status=ACTIVE', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return;
        const json = await res.json();
        const groups = json?.data || [];
        if (!groups.length) {
          container.innerHTML = '<div style="padding:0.45rem 1.25rem; color:var(--text-muted); font-size:0.78rem;">No active classes</div>';
          return;
        }
        container.innerHTML = groups.map(g => {
          const initial = (g.name || 'C').charAt(0).toUpperCase();
          const href = `/faculty/group-detail.html?id=${g.id}`;
          const isActive = currentUrl.includes(`id=${g.id}`);
          const safeName = escapeHtml(g.name || '');
          return `
            <a href="${href}" class="gc-drawer-link ${isActive ? 'active' : ''}" title="${safeName}" style="padding:0.45rem 1.25rem;">
              <span class="gc-class-avatar">${initial}</span>
              <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${safeName}</span>
            </a>
          `;
        }).join('');
      } catch (_) {}
    } else if (portalId === 'student') {
      try {
        let res = await fetch('/api/v1/teaching-groups/student/my-groups', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
          res = await fetch('/api/v1/student/enrolled-groups', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
        }
        if (!res.ok) return;
        const json = await res.json();
        const groups = json?.data || [];
        if (!groups.length) {
          container.innerHTML = '<div style="padding:0.45rem 1.25rem; color:var(--text-muted); font-size:0.78rem;">No enrolled classes</div>';
          return;
        }
        container.innerHTML = groups.map(g => {
          const initial = (g.name || 'C').charAt(0).toUpperCase();
          const href = `/student/group-detail.html?id=${g.id}`;
          const isActive = currentUrl.includes(`id=${g.id}`);
          const safeName = escapeHtml(g.name || '');
          return `
            <a href="${href}" class="gc-drawer-link ${isActive ? 'active' : ''}" title="${safeName}" style="padding:0.45rem 1.25rem;">
              <span class="gc-class-avatar">${initial}</span>
              <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${safeName}</span>
            </a>
          `;
        }).join('');
      } catch (_) {}
    }
  }

  // 9. Drawer Open / Close / Toggle Functions
  function toggleSidebar() {
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (!sidebar) return;

    const isOpen = sidebar.classList.toggle('open');
    sidebar.classList.toggle('sidebar-open', isOpen);
    document.body.classList.toggle('sidebar-open', isOpen);

    if (backdrop) {
      backdrop.classList.toggle('open', isOpen);
      backdrop.classList.toggle('active', isOpen);
    }

    const toggleBtn = document.getElementById('sidebar-toggle-btn') || document.getElementById('btn-menu-toggle');
    if (toggleBtn) toggleBtn.setAttribute('aria-pressed', isOpen ? 'true' : 'false');
  }

  function closeSidebar() {
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (!sidebar) return;

    sidebar.classList.remove('sidebar-open', 'open');
    document.body.classList.remove('sidebar-open');

    if (backdrop) {
      backdrop.classList.remove('active', 'open');
    }

    const toggleBtn = document.getElementById('sidebar-toggle-btn') || document.getElementById('btn-menu-toggle');
    if (toggleBtn) toggleBtn.setAttribute('aria-pressed', 'false');
  }

  function openSidebar() {
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (!sidebar) return;

    sidebar.classList.add('sidebar-open', 'open');
    document.body.classList.add('sidebar-open');

    if (backdrop) {
      backdrop.classList.add('active', 'open');
    }

    const toggleBtn = document.getElementById('sidebar-toggle-btn') || document.getElementById('btn-menu-toggle');
    if (toggleBtn) toggleBtn.setAttribute('aria-pressed', 'true');
  }

  // Global Escape key dismissal
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeSidebar();
    }
  });

  // 10. Mount Component
  function mountSidebar(options = {}) {
    const portalConfig = resolvePortalConfig(options.portal);
    if (!portalConfig) {
      console.warn('[SidebarComponent] No navigation configuration found.');
      return;
    }

    let user = options.user || null;
    if (!user && typeof window.getCurrentUser === 'function') {
      try { user = window.getCurrentUser(); } catch (_) {}
    }
    if (!user) {
      try {
        const stored = localStorage.getItem('auth_user') || localStorage.getItem('user');
        if (stored) user = JSON.parse(stored);
      } catch (_) {}
    }

    let mountPoint = document.getElementById('sidebar-mount');
    const existingSidebar = document.getElementById('app-sidebar');
    const existingBackdrop = document.getElementById('sidebar-backdrop');

    // If an existing sidebar exists, replace it cleanly with the component
    if (existingSidebar) {
      const parent = existingSidebar.parentNode;
      const placeholder = document.createElement('div');
      placeholder.id = 'sidebar-mount';
      parent.replaceChild(placeholder, existingSidebar);
      if (existingBackdrop) existingBackdrop.remove();
      mountPoint = placeholder;
    }

    const markup = buildSidebarHtml(portalConfig, user);

    if (mountPoint) {
      mountPoint.outerHTML = markup;
    } else {
      document.body.insertAdjacentHTML('afterbegin', markup);
    }

    const newSidebar = document.getElementById('app-sidebar');
    if (newSidebar) {
      setupAccordionHandlers(newSidebar);
      loadDynamicClasses(portalConfig.portalId);
    }
  }

  // 11. Public API & Universal Bindings
  window.toggleSidebar = toggleSidebar;
  window.closeSidebar = closeSidebar;
  window.openSidebar = openSidebar;
  window.toggleDrawer = toggleSidebar;
  window.closeDrawer = closeSidebar;
  window.openDrawer = openSidebar;
  window.toggleAppSidebar = toggleSidebar;
  window.mountSidebar = mountSidebar;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => mountSidebar());
  } else {
    mountSidebar();
  }
})();
