/**
 * ══════════════════════════════════════════════════════════════
 * VIDYAOS ADMIN SVG ICON SYSTEM (icons.js)
 * Location: /frontend/admin/components/icons.js
 *
 * Dedicated, self-contained SVG icon registry for the Admin Portal.
 * Isolates all SVG assets from global styles and outside JS bundles.
 * 100% Theme Tokenized — Uses currentColor and CSS Variables.
 * 3D Isometric Vectors with Multi-Facet Shading & Lighting.
 * ══════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  /**
   * Pure SVG icon paths & 3D Isometric template builders
   */
  const ICONS = {
    // 1. VidyaOS 3D Isometric Cube Logo
    cube: (w = 32, h = 32, cls = 'rail-cube-logo') => `
      <svg class="${cls}" width="${w}" height="${h}" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <!-- Top Face (Light Highlight) -->
        <path d="M16 3L28 9.5L16 16L4 9.5L16 3Z" fill="var(--color-primary-light, hsl(215 90% 95%))" stroke="var(--color-primary)" stroke-width="0.8" stroke-linejoin="round"/>
        <!-- Left Face (Midtone Primary) -->
        <path d="M4 9.5L16 16V29L4 22.5V9.5Z" fill="var(--color-primary, hsl(217 91% 60%))" stroke="var(--color-primary-hover)" stroke-width="0.8" stroke-linejoin="round"/>
        <!-- Right Face (Deep Shadow) -->
        <path d="M16 16L28 9.5V22.5L16 29V16Z" fill="var(--color-primary-hover, hsl(224 76% 48%))" stroke="var(--color-primary-hover)" stroke-width="0.8" stroke-linejoin="round"/>
        <!-- 3D Bevel Highlight Edges -->
        <path d="M16 16L16 28" stroke="hsl(0 0% 100% / 0.35)" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M16 16L27 10" stroke="hsl(0 0% 100% / 0.28)" stroke-width="1.2" stroke-linecap="round"/>
      </svg>`.trim(),

    // 2. Navigation & Header Controls
    menu: (w = 20, h = 20, stroke = 2.2, cls = '') => `
      <svg class="${cls}" width="${w}" height="${h}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>`.trim(),

    chevronLeft: (w = 14, h = 14, stroke = 2.5, cls = '') => `
      <svg class="${cls}" width="${w}" height="${h}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>`.trim(),

    chevronRight: (w = 14, h = 14, stroke = 2.5, cls = '') => `
      <svg class="${cls}" width="${w}" height="${h}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>`.trim(),

    close: (w = 18, h = 18, stroke = 2.2, cls = '') => `
      <svg class="${cls}" width="${w}" height="${h}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>`.trim(),

    bell: (w = 18, h = 18, stroke = 2, cls = '') => `
      <svg class="${cls}" width="${w}" height="${h}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
      </svg>`.trim(),

    // 3. 3D Isometric Navigation Icons
    // 3A. Dashboard: 3D Isometric Console Structure / Central Hub
    dashboard: (w = 20, h = 20, stroke = 2, cls = '') => `
      <svg class="${cls}" width="${w}" height="${h}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <!-- Isometric Roof / Deck (Top Highlight) -->
        <polygon points="12 2 21 7 12 12 3 7" fill="currentColor" fill-opacity="0.32" stroke="currentColor" stroke-width="${stroke}" stroke-linejoin="round"/>
        <!-- Left Wall (Midtone) -->
        <polygon points="3 7 12 12 12 21 3 16" fill="currentColor" fill-opacity="0.16" stroke="currentColor" stroke-width="${stroke}" stroke-linejoin="round"/>
        <!-- Right Wall (Shadowed) -->
        <polygon points="12 12 21 7 21 16 12 21" fill="currentColor" fill-opacity="0.48" stroke="currentColor" stroke-width="${stroke}" stroke-linejoin="round"/>
        <!-- Center 3D Inset Doorway / Matrix Screen -->
        <polygon points="12 15 15.5 13 15.5 18 12 20" fill="currentColor" fill-opacity="0.75" stroke="none"/>
        <polyline points="8.5 14 8.5 19 12 21" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
      </svg>`.trim(),

    // 3B. Academic Structure: 3D Isometric Stacked Architectural Slabs (Multi-Tier)
    academicStructure: (w = 20, h = 20, stroke = 2, cls = '') => `
      <svg class="${cls}" width="${w}" height="${h}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <!-- Tier 1 Top Slab: Cap + Extruded Depth -->
        <polygon points="12 2 20 6 12 10 4 6" fill="currentColor" fill-opacity="0.35" stroke="currentColor" stroke-width="${stroke}" stroke-linejoin="round"/>
        <polygon points="4 6 12 10 12 11.5 4 7.5" fill="currentColor" fill-opacity="0.2" stroke="none"/>
        <polygon points="12 10 20 6 20 7.5 12 11.5" fill="currentColor" fill-opacity="0.55" stroke="none"/>
        <!-- Tier 2 Middle Slab -->
        <polygon points="12 8 20 12 12 16 4 12" fill="currentColor" fill-opacity="0.26" stroke="currentColor" stroke-width="${stroke}" stroke-linejoin="round"/>
        <polygon points="4 12 12 16 12 17.5 4 13.5" fill="currentColor" fill-opacity="0.2" stroke="none"/>
        <polygon points="12 16 20 12 20 13.5 12 17.5" fill="currentColor" fill-opacity="0.55" stroke="none"/>
        <!-- Tier 3 Base Platform Rim -->
        <polygon points="12 14 20 18 12 22 4 18" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="${stroke}" stroke-linejoin="round"/>
        <polyline points="4 18 12 22 20 18" stroke="currentColor" stroke-width="${stroke}" stroke-linejoin="round"/>
      </svg>`.trim(),

    // 3C. HOD Management: 3D Isometric Executive Crest & Shield
    hodManagement: (w = 20, h = 20, stroke = 2, cls = '') => `
      <svg class="${cls}" width="${w}" height="${h}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <!-- 3D Beveled Shield Base -->
        <path d="M12 2L20 5.5V11.5C20 16.5 16.5 20.5 12 22C7.5 20.5 4 16.5 4 11.5V5.5L12 2Z" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="${stroke}" stroke-linejoin="round"/>
        <!-- Shield Right Shadow Facet -->
        <path d="M12 2L20 5.5V11.5C20 16.5 16.5 20.5 12 22V2Z" fill="currentColor" fill-opacity="0.28" stroke="none"/>
        <!-- Inner 3D Executive Head -->
        <circle cx="12" cy="8.5" r="2.8" fill="currentColor" fill-opacity="0.5" stroke="currentColor" stroke-width="1.4"/>
        <path d="M7.5 16C7.5 13.5 9.5 12.5 12 12.5C14.5 12.5 16.5 13.5 16.5 16" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round"/>
        <!-- Center Bevel Spine Highlight -->
        <line x1="12" y1="2.5" x2="12" y2="21.5" stroke="currentColor" stroke-width="1.2" stroke-opacity="0.6"/>
      </svg>`.trim(),

    // 3D. Reports & Analytics: 3D Isometric Extruded Columns & Ascending Arrow
    reports: (w = 20, h = 20, stroke = 2, cls = '') => `
      <svg class="${cls}" width="${w}" height="${h}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <!-- Pillar 1 (Left Low) -->
        <polygon points="5 15 8 13.5 8 19 5 20.5" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.4"/>
        <polygon points="8 13.5 10 14.5 10 20 8 19" fill="currentColor" fill-opacity="0.45" stroke="currentColor" stroke-width="1.4"/>
        <polygon points="5 15 7 14 10 14.5 8 15.5" fill="currentColor" fill-opacity="0.32" stroke="none"/>
        <!-- Pillar 2 (Middle Medium) -->
        <polygon points="10 11 13 9.5 13 18 10 19.5" fill="currentColor" fill-opacity="0.24" stroke="currentColor" stroke-width="1.4"/>
        <polygon points="13 9.5 15 10.5 15 19 13 18" fill="currentColor" fill-opacity="0.52" stroke="currentColor" stroke-width="1.4"/>
        <polygon points="10 11 12 10 15 10.5 13 11.5" fill="currentColor" fill-opacity="0.35" stroke="none"/>
        <!-- Pillar 3 (Right Tall) -->
        <polygon points="15 6 18 4.5 18 16 15 17.5" fill="currentColor" fill-opacity="0.26" stroke="currentColor" stroke-width="1.4"/>
        <polygon points="18 4.5 20 5.5 20 17 18 16" fill="currentColor" fill-opacity="0.58" stroke="currentColor" stroke-width="1.4"/>
        <polygon points="15 6 17 5 20 5.5 18 6.5" fill="currentColor" fill-opacity="0.38" stroke="none"/>
        <!-- 3D Ascending Trajectory Arrow -->
        <polyline points="4 14 10 8 14 10 21 3" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"/>
        <polyline points="16 3 21 3 21 8" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`.trim(),

    // 3E. System Settings: 3D Isometric Beveled Cogwheel Gear
    settings: (w = 20, h = 20, stroke = 2, cls = '') => `
      <svg class="${cls}" width="${w}" height="${h}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <!-- Gear Top Isometric Rim -->
        <circle cx="12" cy="11" r="7" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="${stroke}"/>
        <!-- 3D Extruded Cylinder Depth -->
        <path d="M5 11C5 14.5 8.1 17 12 17C15.9 17 19 14.5 19 11V13.5C19 17 15.9 19.5 12 19.5C8.1 19.5 5 17 5 13.5V11Z" fill="currentColor" fill-opacity="0.48" stroke="currentColor" stroke-width="1.4"/>
        <!-- Gear Radial Teeth -->
        <path d="M12 2V5M12 17V20M2 11H5M19 11H22M5.6 4.6L7.8 6.8M16.2 15.2L18.4 17.4M18.4 4.6L16.2 6.8M7.8 15.2L5.6 17.4" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round"/>
        <!-- Center Bore Hole with Depth -->
        <circle cx="12" cy="11" r="2.5" fill="currentColor" fill-opacity="0.75" stroke="currentColor" stroke-width="1.2"/>
      </svg>`.trim(),

    // 3F. Audit Logs: 3D Isometric Security Ledger & Folio Block
    audit: (w = 20, h = 20, stroke = 2, cls = '') => `
      <svg class="${cls}" width="${w}" height="${h}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <!-- Book Top Facet -->
        <polygon points="5 4 15 2 20 6 10 8" fill="currentColor" fill-opacity="0.32" stroke="currentColor" stroke-width="${stroke}" stroke-linejoin="round"/>
        <!-- Book Front Page Block -->
        <polygon points="10 8 20 6 20 18 10 20" fill="currentColor" fill-opacity="0.52" stroke="currentColor" stroke-width="${stroke}" stroke-linejoin="round"/>
        <!-- Book Spine Wall -->
        <polygon points="5 4 10 8 10 20 5 16" fill="currentColor" fill-opacity="0.22" stroke="currentColor" stroke-width="${stroke}" stroke-linejoin="round"/>
        <!-- Front Ledger Entries -->
        <line x1="12" y1="11" x2="18" y2="9.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
        <line x1="12" y1="14" x2="18" y2="12.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
        <line x1="12" y1="17" x2="16" y2="15.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
      </svg>`.trim(),

    // 4. Session & Identity Icons
    user: (w = 20, h = 20, stroke = 2, cls = '') => `
      <svg class="${cls}" width="${w}" height="${h}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="7.5" r="3.5" fill="currentColor" fill-opacity="0.28" stroke="currentColor" stroke-width="${stroke}"/>
        <path d="M4.5 19.5C4.5 15.5 8 14 12 14C16 14 19.5 15.5 19.5 19.5" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round"/>
        <ellipse cx="12" cy="19.5" rx="7.5" ry="2" fill="currentColor" fill-opacity="0.38"/>
      </svg>`.trim(),

    logout: (w = 20, h = 20, stroke = 2, cls = '') => `
      <svg class="${cls}" width="${w}" height="${h}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <!-- 3D Isometric Door Portal -->
        <polygon points="4 3 13 5 13 21 4 19" fill="currentColor" fill-opacity="0.22" stroke="currentColor" stroke-width="${stroke}" stroke-linejoin="round"/>
        <polyline points="13 5 18 5 18 19 13 19" stroke="currentColor" stroke-width="${stroke}" stroke-linejoin="round"/>
        <!-- Outward Perspective Arrow -->
        <line x1="10" y1="12" x2="22" y2="12" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round"/>
        <polyline points="18 8 22 12 18 16" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`.trim(),

    institution: (w = 24, h = 24, stroke = 2, cls = '') => `
      <svg class="${cls}" width="${w}" height="${h}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M3 21h18M3 10h18M5 10v11M19 10v11M9 10v11M15 10v11M12 2L2 7h20L12 2z"></path>
      </svg>`.trim(),

    arrowRight: (w = 14, h = 14, stroke = 2.2, cls = '') => `
      <svg class="${cls}" width="${w}" height="${h}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
      </svg>`.trim(),

    shieldLock: (w = 16, h = 16, stroke = 2.2, cls = '') => `
      <svg class="${cls}" width="${w}" height="${h}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>`.trim(),

    userCheck: (w = 16, h = 16, stroke = 2.2, cls = '') => `
      <svg class="${cls}" width="${w}" height="${h}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="8.5" cy="7" r="4"></circle>
        <polyline points="17 11 19 13 23 9"></polyline>
      </svg>`.trim(),

    users: (w = 16, h = 16, stroke = 2.2, cls = '') => `
      <svg class="${cls}" width="${w}" height="${h}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>`.trim(),

    check: (w = 14, h = 14, stroke = 2.5, cls = '') => `
      <svg class="${cls}" width="${w}" height="${h}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>`.trim()
  };

  /**
   * Helper to retrieve rendered SVG markup with custom size and classes
   */
  function getAdminIcon(name, options = {}) {
    const fn = ICONS[name];
    if (!fn) {
      console.warn(`[AdminIcons] Icon "${name}" not found in admin registry.`);
      return '';
    }
    const width = options.width || options.w || 20;
    const height = options.height || options.h || width;
    const stroke = options.stroke || options.strokeWidth || 2;
    const cls = options.className || options.cls || '';
    return fn(width, height, stroke, cls);
  }

  /**
   * Scan DOM and auto-render elements with [data-admin-icon]
   */
  function renderAdminIcons(root = document) {
    const targets = root.querySelectorAll('[data-admin-icon]');
    targets.forEach(el => {
      const name = el.getAttribute('data-admin-icon');
      const size = parseInt(el.getAttribute('data-size') || '20', 10);
      const stroke = parseFloat(el.getAttribute('data-stroke') || '2');
      const extraClass = el.getAttribute('data-class') || '';
      const svg = getAdminIcon(name, { width: size, height: size, stroke, className: extraClass });
      if (svg) {
        el.innerHTML = svg;
      }
    });
  }

  // Export to window
  ICONS.get = getAdminIcon;
  window.ADMIN_ICONS = ICONS;
  window.getAdminIcon = getAdminIcon;
  window.renderAdminIcons = renderAdminIcons;

  // Auto-render on DOM ready
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => renderAdminIcons());
    } else {
      renderAdminIcons();
    }
  }
})();
