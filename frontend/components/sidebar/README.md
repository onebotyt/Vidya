# VidyaOS Universal Reusable Sidebar Component

> **Location:** `/components/sidebar/`  
> **Status:** Production-Ready • 100% Theme Tokenized • Accordion Animated • Accessible

This folder contains the complete, reusable sidebar system for VidyaOS. It powers the navigation for:
- **Admin Console** (`/admin/*`)
- **Faculty & HOD Classroom Portal** (`/faculty/*`)
- **Student Classroom Portal** (`/student/*`)
- **Any new page you create in the future!**

---

## 🚀 How to Add the Sidebar to Any Future Page (3 Easy Steps)

When you create a new HTML page, simply include these 3 snippets:

### Step 1: Add the CSS in `<head>`
```html
<link rel="stylesheet" href="/components/sidebar/sidebar.css">
```

### Step 2: Add the Mount Point in `<body>` (right after opening `<body>`)
```html
<div id="sidebar-mount"></div>
```

### Step 3: Add the Scripts before `</body>`
```html
<script src="/components/sidebar/sidebar-config.js"></script>
<script src="/components/sidebar/sidebar.js"></script>
```

That's it! The sidebar will automatically:
1. Detect whether your page is in `/faculty/`, `/student/`, or `/admin/` (or use the user's role).
2. Render all top links, collapsible sections with chevrons, and active route highlights.
3. Automatically fetch and display dynamic classes in `TEACHING CLASSES` / `ENROLLED CLASSES`.
4. Provide smooth zero-jank CSS Grid accordion animations and keyboard accessibility (`Enter`/`Space`).
5. Wire up the mobile drawer and Escape key dismissal.

---

## 🎛️ Manual Portal Override (Optional)

If your page is in a custom folder (e.g. `/analytics/index.html`) and you want to explicitly show the Faculty sidebar or Admin sidebar:

```html
<script>
  window.addEventListener('DOMContentLoaded', () => {
    // Options: 'faculty', 'student', or 'admin'
    window.mountSidebar({ portal: 'faculty' });
  });
</script>
```

---

## 📂 Folder Contents & Architecture

| File | Purpose |
| :--- | :--- |
| [`sidebar-config.js`](file:///frontend/components/sidebar/sidebar-config.js) | Centralized menu definitions, SVG icons, collapsible groups, and role permissions. |
| [`sidebar.js`](file:///frontend/components/sidebar/sidebar.js) | Component engine: mounts the sidebar, handles accordion toggles, fetches classes, manages mobile drawer. |
| [`sidebar.css`](file:///frontend/components/sidebar/sidebar.css) | 100% theme-tokenized styles (`var(--...)`), CSS Grid row transitions (`0fr -> 1fr`), rotating chevrons. |
| [`sidebar.html`](file:///frontend/components/sidebar/sidebar.html) | Semantic reference markup showing the generated HTML structure. |
| [`README.md`](file:///frontend/components/sidebar/README.md) | Developer guide and integration instructions. |

---

## 🛠️ How to Add a New Link or Section

To add a new menu item to future pages, open [`sidebar-config.js`](file:///frontend/components/sidebar/sidebar-config.js):

### Adding a new link to an existing section:
```javascript
{
  id: 'my-new-feature',
  label: 'My New Feature',
  href: '/faculty/my-feature.html',
  iconSvg: ICONS.star,
  aliases: ['/faculty/my-feature.html', '/faculty/my-feature']
}
```

### Adding a brand new collapsible section:
```javascript
{
  id: 'my-custom-group',
  label: 'Special Modules',
  collapsible: true,        // enables accordion expand/collapse
  defaultExpanded: true,    // open by default
  items: [
    {
      id: 'sub-tool-1',
      label: 'Lab Simulator',
      href: '/faculty/simulator.html',
      iconSvg: ICONS.dashboard
    }
  ]
}
```

---

## 📱 Mobile & Desktop Drawer Controls

The sidebar exposes standard global functions you can call from any button or navbar:

```javascript
// Toggle drawer open/close
window.toggleSidebar(); // or window.toggleDrawer();

// Force close drawer
window.closeSidebar();  // or window.closeDrawer();

// Force open drawer
window.openSidebar();   // or window.openDrawer();
```
