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
    cube: (w = 32, h = 32, stroke = 2, cls = 'rail-cube-logo') => `
      <svg class="${cls || 'rail-cube-logo'}" width="${w}" height="${h}" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
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
    dashboard: (w = 20, h = 20, stroke = 1.8, cls = '') => `
      <svg class="${cls}" width="${w}" height="${h}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <!-- Isometric Roof / Deck (Top Highlight) -->
        <polygon points="12 2 21 7 12 12 3 7" fill="currentColor" fill-opacity="0.3" stroke="currentColor" stroke-width="${stroke}" stroke-linejoin="round"/>
        <!-- Left Wall (Midtone) -->
        <polygon points="3 7 12 12 12 21 3 16" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="${stroke}" stroke-linejoin="round"/>
        <!-- Right Wall (Shadowed) -->
        <polygon points="12 12 21 7 21 16 12 21" fill="currentColor" fill-opacity="0.45" stroke="currentColor" stroke-width="${stroke}" stroke-linejoin="round"/>
        <!-- Center 3D Inset Aperture / Portal Screen -->
        <polygon points="12 14 16 11.7 16 17.5 12 19.8" fill="currentColor" fill-opacity="0.75" stroke="none"/>
        <polyline points="8 14.5 8 18.5 12 20.8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
      </svg>`.trim(),

    // 3B. Academic Structure: 3D Isometric Stepped Tiered Architecture
    academicStructure: (w = 20, h = 20, stroke = 1.8, cls = '') => `
      <svg class="${cls}" width="${w}" height="${h}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <!-- Tier 1 Top Slab: Cap + Extruded Depth -->
        <polygon points="12 2 19 6 12 10 5 6" fill="currentColor" fill-opacity="0.35" stroke="currentColor" stroke-width="${stroke}" stroke-linejoin="round"/>
        <polyline points="5 6 5 8.5 12 12.5 19 8.5 19 6" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="${stroke}" stroke-linejoin="round"/>
        <!-- Tier 2 Middle Slab -->
        <polyline points="3 10.5 12 15.5 21 10.5" stroke="currentColor" stroke-width="${stroke}" stroke-linejoin="round"/>
        <polyline points="3 10.5 3 13.5 12 18.5 21 13.5 21 10.5" fill="currentColor" fill-opacity="0.3" stroke="currentColor" stroke-width="${stroke}" stroke-linejoin="round"/>
        <!-- Tier 3 Base Platform Rim -->
        <polyline points="2 15.5 12 21 22 15.5" stroke="currentColor" stroke-width="${stroke}" stroke-linejoin="round"/>
      </svg>`.trim(),

    // 3C. HOD Management: 3D Isometric Executive Crest & Shield
    hodManagement: (w = 20, h = 20, stroke = 1.8, cls = '') => `
      <svg class="${cls}" width="${w}" height="${h}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <!-- 3D Beveled Shield Base -->
        <path d="M12 2L20 5.5V11C20 16.5 16.5 20.5 12 22C7.5 20.5 4 16.5 4 11V5.5L12 2Z" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="${stroke}" stroke-linejoin="round"/>
        <!-- Shield Right Shadow Facet -->
        <path d="M12 2L20 5.5V11C20 16.5 16.5 20.5 12 22V2Z" fill="currentColor" fill-opacity="0.28" stroke="none"/>
        <!-- Center Bevel Spine -->
        <line x1="12" y1="2" x2="12" y2="22" stroke="currentColor" stroke-width="${stroke}"/>
        <!-- Inner Executive Crest -->
        <circle cx="12" cy="8.5" r="2.5" fill="currentColor" fill-opacity="0.5" stroke="currentColor" stroke-width="1.3"/>
        <path d="M8 15.5C8 13.2 9.8 12 12 12C14.2 12 16 13.2 16 15.5" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round"/>
      </svg>`.trim(),

    // 3D. Reports & Analytics: 3D Isometric Extruded Columns & Ascending Arrow
    reports: (w = 20, h = 20, stroke = 1.8, cls = '') => `
      <svg class="${cls}" width="${w}" height="${h}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <!-- Pillar 1 (Left Low) -->
        <polygon points="4 15 7.5 13 7.5 19 4 21" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
        <polygon points="7.5 13 10 14.5 10 20.5 7.5 19" fill="currentColor" fill-opacity="0.45" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
        <polygon points="4 15 6.5 13.5 10 14.5 7.5 16" fill="currentColor" fill-opacity="0.3"/>
        <!-- Pillar 2 (Middle Medium) -->
        <polygon points="9.5 11 13 9 13 19 9.5 21" fill="currentColor" fill-opacity="0.25" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
        <polygon points="13 9 15.5 10.5 15.5 20.5 13 19" fill="currentColor" fill-opacity="0.5" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
        <polygon points="9.5 11 12 9.5 15.5 10.5 13 12" fill="currentColor" fill-opacity="0.35"/>
        <!-- Pillar 3 (Right Tall) -->
        <polygon points="15 6 18.5 4 18.5 19 15 21" fill="currentColor" fill-opacity="0.3" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
        <polygon points="18.5 4 21 5.5 21 20.5 18.5 19" fill="currentColor" fill-opacity="0.6" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
        <polygon points="15 6 17.5 4.5 21 5.5 18.5 7" fill="currentColor" fill-opacity="0.4"/>
        <!-- 3D Ascending Trajectory Arrow -->
        <polyline points="3 13 9 8 14 11 21 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <polyline points="16 3 21 3 21 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`.trim(),

    // 3E. System Settings: 3D Isometric Precision Beveled Gear
    settings: (w = 20, h = 20, stroke = 1.8, cls = '') => `
      <svg class="${cls}" width="${w}" height="${h}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <!-- Gear Top Isometric Deck Rim -->
        <ellipse cx="12" cy="10" rx="7.5" ry="4" fill="currentColor" fill-opacity="0.22" stroke="currentColor" stroke-width="${stroke}"/>
        <!-- 3D Extruded Cylinder Depth -->
        <path d="M4.5 10V14C4.5 16.2 7.8 18 12 18C16.2 18 19.5 16.2 19.5 14V10" fill="currentColor" fill-opacity="0.45" stroke="currentColor" stroke-width="${stroke}"/>
        <!-- Gear Radial Teeth -->
        <path d="M12 4.5V2M12 15.5V18M5 7L2.5 6M19 13L21.5 14M5 13L2.5 14M19 7L21.5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <!-- Inner 3D Precision Bore Hole -->
        <ellipse cx="12" cy="10" rx="2.8" ry="1.5" fill="currentColor" fill-opacity="0.8" stroke="currentColor" stroke-width="1.2"/>
      </svg>`.trim(),

    // 3F. Audit Logs: 3D Isometric Security Ledger & Folio Block
    audit: (w = 20, h = 20, stroke = 1.8, cls = '') => `
      <svg class="${cls}" width="${w}" height="${h}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <!-- Book Top Facet -->
        <polygon points="5 4 15 2 20 5.5 10 7.5" fill="currentColor" fill-opacity="0.3" stroke="currentColor" stroke-width="${stroke}" stroke-linejoin="round"/>
        <!-- Book Front Page Block -->
        <polygon points="10 7.5 20 5.5 20 17.5 10 19.5" fill="currentColor" fill-opacity="0.5" stroke="currentColor" stroke-width="${stroke}" stroke-linejoin="round"/>
        <!-- Book Spine Wall -->
        <polygon points="5 4 10 7.5 10 19.5 5 16" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="${stroke}" stroke-linejoin="round"/>
        <!-- Front Ledger Entries -->
        <line x1="12" y1="10.5" x2="18" y2="9.3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
        <line x1="12" y1="13.5" x2="18" y2="12.3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
        <line x1="12" y1="16.5" x2="16" y2="15.7" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
      </svg>`.trim(),

    // 4. Session & Identity Icons
    user: (w = 20, h = 20, stroke = 1.8, cls = '') => `
      <svg class="${cls}" width="${w}" height="${h}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="7.5" r="3.5" fill="currentColor" fill-opacity="0.28" stroke="currentColor" stroke-width="${stroke}"/>
        <path d="M4.5 19.5C4.5 15.5 8 14 12 14C16 14 19.5 15.5 19.5 19.5" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round"/>
        <ellipse cx="12" cy="19.5" rx="7.5" ry="2" fill="currentColor" fill-opacity="0.38"/>
      </svg>`.trim(),

    logout: (w = 20, h = 20, stroke = 1.8, cls = '') => `
      <svg class="${cls}" width="${w}" height="${h}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polygon points="4 3 13 5 13 21 4 19" fill="currentColor" fill-opacity="0.22" stroke="currentColor" stroke-width="${stroke}" stroke-linejoin="round"/>
        <polyline points="13 5 18 5 18 19 13 19" stroke="currentColor" stroke-width="${stroke}" stroke-linejoin="round"/>
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
