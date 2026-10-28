/**
 * ══════════════════════════════════════════════════════════════
 * VIDYAOS UNIVERSAL REUSABLE SIDEBAR CONFIGURATION (sidebar-config.js)
 * Location: /components/sidebar/sidebar-config.js
 * 
 * Centralized navigation configuration for VidyaOS institutional portals:
 * - Admin Console
 * - Faculty & HOD Classroom Portal
 * - Student Classroom Portal
 * 
 * Defines all navigation sections, collapsible menu groups, items,
 * SVG icons, route aliases, dynamic hooks, and role-based permissions.
 * ══════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  // 1. Pure Inline Theme-Tokenized SVGs (100% vector, zero raw emojis)
  const ICONS = {
    chevron: `<svg class="gc-drawer-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>`,
    building: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21h18M3 10h18M5 10v11M19 10v11M9 10v11M15 10v11M12 2L2 7h20L12 2z"/></svg>`,
    gradCap: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
    close: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    home: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    dashboard: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>`,
    structure: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21h18"/><path d="M5 21V9l7-5 7 5v12"/><path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/><line x1="9" y1="10" x2="9" y2="10.01"/><line x1="15" y1="10" x2="15" y2="10.01"/></svg>`,
    faculty: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>`,
    reports: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
    settings: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
    audit: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    logout: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
    folder: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
    calendar: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    book: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
    clipboard: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M9 14h6"/><path d="M9 10h6"/></svg>`,
    barChart: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
    trendingUp: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
    trendingDown: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>`,
    receipt: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
    users: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    userCheck: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>`,
    archive: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>`,
    trash: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`,
    checkSquare: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
    clock: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    fileText: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>`,
    user: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    plus: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    moon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`
  };

  // 2. Centralized Portals Menu Configuration
  const SIDEBAR_CONFIGS = {
    // ══════════════════════════════════════════════════════════
    // PORTAL 1: ADMIN CONSOLE
    // ══════════════════════════════════════════════════════════
    admin: {
      portalId: 'admin',
      brand: {
        title: 'Admin Console',
        badge: 'VidyaOS',
        href: '/admin/dashboard.html',
        iconSvg: ICONS.building
      },
      footer: {
        statusText: 'VidyaOS • Admin',
        logoutLabel: 'Sign Out',
        logoutIconSvg: ICONS.logout
      },
      topItems: [],
      groups: [
        {
          id: 'admin-modules',
          label: 'Administrative Modules',
          collapsible: true,
          defaultExpanded: true,
          items: [
            {
              id: 'admin-dashboard',
              label: 'Dashboard',
              href: '/admin/dashboard.html',
              iconSvg: ICONS.dashboard,
              aliases: ['/admin', '/admin/', '/admin/dashboard', '/admin/dashboard/']
            },
            {
              id: 'admin-academic-structure',
              label: 'Academic Structure',
              href: '/admin/academic-structure.html',
              iconSvg: ICONS.structure,
              aliases: ['/admin/academic-structure', '/admin/academic-structure/', '/admin/academic_structure.html']
            },
            {
              id: 'admin-faculty',
              label: 'HOD Management',
              href: '/admin/faculty.html',
              iconSvg: ICONS.faculty,
              aliases: ['/admin/faculty', '/admin/faculty/']
            },
            {
              id: 'admin-reports',
              label: 'Reports & Analytics',
              href: '/admin/reports.html',
              iconSvg: ICONS.reports,
              aliases: ['/admin/reports', '/admin/reports/', '/admin/students']
            },
            {
              id: 'admin-settings',
              label: 'System Settings',
              href: '/admin/settings.html',
              iconSvg: ICONS.settings,
              aliases: ['/admin/settings', '/admin/settings/']
            },
            {
              id: 'admin-audit-logs',
              label: 'Audit Logs',
              href: '/admin/audit-logs.html',
              iconSvg: ICONS.audit,
              aliases: ['/admin/audit-logs', '/admin/audit-logs/']
            }
          ]
        }
      ]
    },

    // ══════════════════════════════════════════════════════════
    // PORTAL 2: FACULTY & HOD CLASSROOM PORTAL
    // ══════════════════════════════════════════════════════════
    faculty: {
      portalId: 'faculty',
      brand: {
        title: 'Classroom',
        badge: 'VidyaOS',
        href: '/faculty/dashboard.html',
        iconSvg: ICONS.gradCap
      },
      footer: {
        statusText: 'VidyaOS • Faculty',
        logoutLabel: 'Logout',
        logoutIconSvg: ICONS.logout
      },
      topItems: [
        {
          id: 'faculty-classes',
          label: 'Classes',
          href: '/faculty/dashboard.html',
          iconSvg: ICONS.home,
          aliases: ['/faculty', '/faculty/', '/faculty/dashboard.html', '/faculty/groups.html']
        },
        {
          id: 'faculty-drive',
          label: 'Faculty Drive & Vault',
          href: '/faculty/media.html',
          iconSvg: ICONS.folder,
          aliases: ['/faculty/media.html', '/faculty/media']
        },
        {
          id: 'faculty-timetable',
          label: 'Calendar & Timetable',
          href: '/faculty/timetable.html',
          iconSvg: ICONS.calendar,
          aliases: ['/faculty/timetable.html', '/faculty/timetable']
        }
      ],
      groups: [
        {
          id: 'faculty-teaching-classes',
          label: 'Teaching Classes',
          collapsible: true,
          defaultExpanded: true,
          isDynamic: true,
          customContent: '<div id="drawer-classes-list"><div style="padding:0.45rem 1.25rem;color:var(--text-muted);font-size:0.78rem;">Loading classes...</div></div>',
          items: []
        },
        {
          id: 'faculty-academic-tools',
          label: 'Academic Tools',
          collapsible: true,
          defaultExpanded: true,
          items: [
            {
              id: 'nav-reg',
              label: 'Attendance Registers',
              href: '/faculty/registers.html',
              iconSvg: ICONS.book,
              aliases: ['/faculty/registers.html', '/faculty/registers']
            },
            {
              id: 'nav-assign',
              label: 'Coursework & Assignments',
              href: '/faculty/assignments.html',
              iconSvg: ICONS.clipboard,
              aliases: ['/faculty/assignments.html', '/faculty/assignments']
            },
            {
              id: 'nav-marks',
              label: 'Marks & Tests',
              href: '/faculty/tests.html',
              iconSvg: ICONS.barChart,
              aliases: ['/faculty/tests.html', '/faculty/tests']
            },
            {
              id: 'nav-eval',
              label: 'Internal Evaluation',
              href: '/faculty/evaluation.html',
              iconSvg: ICONS.trendingUp,
              aliases: ['/faculty/evaluation.html', '/faculty/evaluation']
            },
            {
              id: 'nav-reports',
              label: 'Reports & Analytics',
              href: '/faculty/reports.html',
              iconSvg: ICONS.trendingDown,
              aliases: ['/faculty/reports.html', '/faculty/reports']
            },
            {
              id: 'nav-leaves',
              label: 'Leave Requests',
              href: '/faculty/leave-approvals.html',
              iconSvg: ICONS.receipt,
              aliases: ['/faculty/leave-approvals.html', '/faculty/leave-approvals']
            },
            {
              id: 'nav-students-item',
              label: 'Faculty & Students',
              href: '/faculty/students.html',
              iconSvg: ICONS.users,
              requiresDeptOrHod: true,
              hasBadge: true,
              aliases: ['/faculty/students.html', '/faculty/students']
            }
          ]
        },
        {
          id: 'faculty-hod-management',
          label: 'HOD Management',
          collapsible: true,
          defaultExpanded: true,
          requiresHod: true,
          items: [
            {
              id: 'nav-hod-faculty',
              label: 'Department Faculty',
              href: '/faculty/hod-teachers.html',
              iconSvg: ICONS.userCheck,
              aliases: ['/faculty/hod-teachers.html', '/faculty/hod-teachers']
            },
            {
              id: 'nav-hod-settings',
              label: 'Department Settings',
              href: '/faculty/hod-settings.html',
              iconSvg: ICONS.settings,
              aliases: ['/faculty/hod-settings.html', '/faculty/hod-settings']
            }
          ]
        },
        {
          id: 'faculty-archive-safety',
          label: 'Archive & Safety',
          collapsible: true,
          defaultExpanded: false,
          items: [
            {
              id: 'nav-archived',
              label: 'Archived Classes',
              href: '/faculty/dashboard.html?filter=ARCHIVED',
              iconSvg: ICONS.archive,
              aliases: ['/faculty/dashboard.html?filter=ARCHIVED']
            },
            {
              id: 'nav-trash',
              label: 'Trash Bin (7d Recovery)',
              href: '/faculty/dashboard.html?trash=1',
              iconSvg: ICONS.trash,
              aliases: ['/faculty/dashboard.html?trash=1']
            },
            {
              id: 'nav-settings',
              label: 'Settings',
              href: '/faculty/profile.html',
              iconSvg: ICONS.settings,
              aliases: ['/faculty/profile.html', '/faculty/profile']
            }
          ]
        }
      ]
    },

    // ══════════════════════════════════════════════════════════
    // PORTAL 3: STUDENT CLASSROOM PORTAL
    // ══════════════════════════════════════════════════════════
    student: {
      portalId: 'student',
      brand: {
        title: 'Classroom',
        badge: 'VidyaOS',
        href: '/student/dashboard.html',
        iconSvg: ICONS.gradCap
      },
      footer: {
        statusText: 'VidyaOS • Student',
        logoutLabel: 'Sign Out',
        logoutIconSvg: ICONS.logout
      },
      topItems: [
        {
          id: 'student-classes',
          label: 'Enrolled Classes',
          href: '/student/dashboard.html',
          iconSvg: ICONS.home,
          aliases: ['/student', '/student/', '/student/dashboard.html', '/student/groups.html']
        },
        {
          id: 'student-attendance',
          label: 'Attendance & Calendar',
          href: '/student/attendance.html',
          iconSvg: ICONS.calendar,
          aliases: ['/student/attendance.html', '/student/attendance']
        },
        {
          id: 'student-assignments',
          label: 'Coursework & Submissions',
          href: '/student/assignments.html',
          iconSvg: ICONS.clipboard,
          aliases: ['/student/assignments.html', '/student/assignments']
        },
        {
          id: 'student-scores',
          label: 'Class Tests & Scores',
          href: '/student/scores.html',
          iconSvg: ICONS.checkSquare,
          aliases: ['/student/scores.html', '/student/scores']
        },
        {
          id: 'student-timetable',
          label: 'Timetable & Schedule',
          href: '/student/timetable.html',
          iconSvg: ICONS.clock,
          aliases: ['/student/timetable.html', '/student/timetable']
        },
        {
          id: 'student-leave',
          label: 'Leave Applications',
          href: '/student/leave.html',
          iconSvg: ICONS.fileText,
          aliases: ['/student/leave.html', '/student/leave']
        },
        {
          id: 'student-profile',
          label: 'Student Dossier',
          href: '/student/profile.html',
          iconSvg: ICONS.user,
          aliases: ['/student/profile.html', '/student/profile']
        }
      ],
      groups: [
        {
          id: 'student-enrolled-classes',
          label: 'Enrolled Classes',
          collapsible: true,
          defaultExpanded: true,
          isDynamic: true,
          customContent: '<div id="drawer-classes-list"><div style="padding:0.45rem 1.25rem;color:var(--text-muted);font-size:0.78rem;">Loading courses...</div></div>',
          items: []
        },
        {
          id: 'student-actions-settings',
          label: 'Actions & Settings',
          collapsible: true,
          defaultExpanded: true,
          items: [
            {
              id: 'btn-join-class',
              label: 'Join Class with Code',
              iconSvg: ICONS.plus,
              isAction: true,
              onclick: "if(typeof openStudentJoinModal==='function'){openStudentJoinModal();}if(typeof closeSidebar==='function'){closeSidebar();}"
            },
            {
              id: 'btn-theme-toggle',
              label: 'Toggle Theme',
              iconSvg: ICONS.moon,
              isAction: true,
              onclick: "if(typeof toggleTheme==='function'){toggleTheme();}"
            },
            {
              id: 'btn-sign-out',
              label: 'Sign Out',
              iconSvg: ICONS.logout,
              isAction: true,
              onclick: "if(typeof logout==='function'){logout();}else{localStorage.clear();window.location.href='/index.html';}"
            }
          ]
        }
      ]
    }
  };

  // Expose globally
  window.SIDEBAR_ICONS = ICONS;
  window.SIDEBAR_CONFIGS = SIDEBAR_CONFIGS;
  // Backward compatibility default
  window.SIDEBAR_CONFIG = SIDEBAR_CONFIGS.admin;
})();
