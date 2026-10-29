/**
 * Academic Structure & Department Management Controller (Frontend-v2)
 * Location: /admin/academic-structure/academic-structure.js
 * 
 * Declarative, React-like logic powered by DynamicFormDialog, ConfirmDialog, and DataTable.
 */

// 1. Guard route: Admin only
if (typeof guardRoute === 'function') {
  guardRoute(['SYSTEM_ADMIN']);
}

let allDepartments = [];
let hodInfoMap = {};
let searchQuery = '';

// Department Icon Helper
function getDeptIcon(code) {
  const c = String(code || '').toUpperCase().trim();
  if (c.includes('IT')) return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>';
  if (c.includes('EE') || c.includes('EC')) return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>';
  if (c.includes('ME')) return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>';
  if (c.includes('CE') || c.includes('CL')) return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M3 10h18M5 10v11M19 10v11M9 10v11M15 10v11M12 2L2 7h20L12 2z"></path></svg>';
  return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>';
}

// 2. Load Master Data & Session Automation Status
async function loadAllData() {
  try {
    const [deptsRes, hodsRes] = await Promise.all([
      fetchApi('/admin/departments'),
      fetchApi('/admin/hods')
    ]);

    allDepartments = deptsRes.data || [];
    const hodsList = hodsRes.data || [];

    hodInfoMap = {};
    hodsList.forEach((h) => {
      if (h.department_id) hodInfoMap[h.department_id] = h;
    });

    // Update KPI Metric Cards
    const deptCountEl = document.getElementById('stat-dept-count');
    if (deptCountEl) deptCountEl.textContent = allDepartments.length;

    const appointedHodsCount = Object.keys(hodInfoMap).length;
    const hodCountEl = document.getElementById('stat-hod-count');
    if (hodCountEl) hodCountEl.textContent = `${appointedHodsCount} / ${allDepartments.length}`;

    const badgeEl = document.getElementById('catalog-count-badge');
    if (badgeEl) {
      badgeEl.textContent = `${allDepartments.length} ${allDepartments.length === 1 ? 'Program' : 'Programs'}`;
    }

    renderTable();
  } catch (err) {
    showToast('Failed to load departments: ' + err.message, 'error');
  }
}

async function loadSessionStatus() {
  try {
    const res = await fetchApi('/admin/session/status');
    if (res.success && res.data) {
      const s = res.data;
      const termEl = document.getElementById('stat-session-term');
      if (termEl) termEl.textContent = s.session_label || 'Active Term';
      const datesEl = document.getElementById('stat-session-dates');
      if (datesEl) datesEl.textContent = `${s.start_date} to ${s.end_date}`;
    }
  } catch (err) {
    console.warn('Could not load session status:', err);
  }
}

// 3. Render High-Density Reactive DataTable
function renderTable() {
  let filtered = allDepartments;
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filtered = allDepartments.filter(
      (d) => (d.name && d.name.toLowerCase().includes(q)) || (d.code && d.code.toLowerCase().includes(q))
    );
  }

  renderDataTable({
    container: 'dept-table-container',
    columns: [
      {
        key: 'code',
        label: 'Code',
        width: '100px',
        render: (code) => `<span class="dept-code-badge">${code}</span>`
      },
      {
        key: 'name',
        label: 'Program / Department',
        render: (name, row) => `
          <div class="dept-name-cell">
            <div class="dept-icon-box">${getDeptIcon(row.code)}</div>
            <div>
              <div style="font-weight:600;color:var(--text-main);">${name}</div>
              <div style="font-size:0.75rem;color:var(--text-muted);">${row.duration || 3} Years Degree Program</div>
            </div>
          </div>
        `
      },
      {
        key: 'id',
        label: 'Appointed HOD',
        render: (deptId) => {
          const hod = hodInfoMap[deptId];
          if (hod) {
            return `
              <div style="font-weight:500;color:var(--text-main);display:flex;align-items:center;gap:0.4rem;">
                <span class="badge chip-hod">HOD</span>
                <span>${hod.full_name || hod.name || 'HOD'}</span>
              </div>
            `;
          }
          return `<span style="color:var(--text-muted);font-size:0.8125rem;">— Unappointed —</span>`;
        }
      },
      {
        key: 'status',
        label: 'Status',
        width: '110px',
        align: 'center',
        render: (status) => {
          const isActive = status === 1 || status === '1' || status === true || status === undefined;
          return isActive
            ? `<span class="badge badge-present">Active</span>`
            : `<span class="badge badge-absent">Inactive</span>`;
        }
      }
    ],
    data: filtered,
    emptyMessage: 'No departments match your filter criteria',
    actions: [
      {
        label: 'Edit',
        icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
        variant: 'secondary',
        onClick: (dept) => handleEditDepartment(dept)
      },
      {
        label: 'Delete',
        icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
        variant: 'danger-soft',
        onClick: (dept) => handleDeleteDepartment(dept)
      }
    ]
  });
}

// 4. Declarative Dynamic Form for Create / Edit
function handleAddDepartment() {
  openDynamicForm({
    title: 'Add New Department',
    subtitle: 'Define a new academic division and program code',
    fields: [
      {
        name: 'code',
        label: 'Department Code',
        type: 'text',
        required: true,
        uppercase: true,
        placeholder: 'e.g. IT, CE, ME',
        help: 'Unique abbreviation used in student roll numbers and registers'
      },
      {
        name: 'name',
        label: 'Department Full Name',
        type: 'text',
        required: true,
        placeholder: 'e.g. Information Technology'
      },
      {
        name: 'duration',
        label: 'Program Duration',
        type: 'select',
        options: [
          { value: 3, label: '3 Years (Standard Diploma)' },
          { value: 2, label: '2 Years (Lateral Entry / D.Pharm)' },
          { value: 1, label: '1 Year (Certificate Program)' }
        ]
      }
    ],
    initialValues: { duration: 3 },
    submitLabel: 'Create Department',
    onSubmit: async (values) => {
      const res = await fetchApi('/admin/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: values.code.trim().toUpperCase(),
          name: values.name.trim(),
          duration: parseInt(values.duration, 10) || 3
        })
      });
      if (res.success) {
        showToast('Department created successfully', 'success');
        await loadAllData();
      } else {
        throw new Error(res.error || 'Failed to create department');
      }
    }
  });
}

function handleEditDepartment(dept) {
  openDynamicForm({
    title: 'Edit Department',
    subtitle: `Update settings for ${dept.name}`,
    fields: [
      {
        name: 'code',
        label: 'Department Code',
        type: 'text',
        required: true,
        uppercase: true
      },
      {
        name: 'name',
        label: 'Department Full Name',
        type: 'text',
        required: true
      },
      {
        name: 'duration',
        label: 'Program Duration',
        type: 'select',
        options: [
          { value: 3, label: '3 Years (Standard Diploma)' },
          { value: 2, label: '2 Years (Lateral Entry / D.Pharm)' },
          { value: 1, label: '1 Year (Certificate Program)' }
        ]
      },
      {
        name: 'status',
        label: 'Operational Status',
        type: 'select',
        options: [
          { value: 1, label: 'Active' },
          { value: 0, label: 'Inactive / Archived' }
        ]
      }
    ],
    initialValues: {
      code: dept.code,
      name: dept.name,
      duration: dept.duration || 3,
      status: dept.status !== undefined ? dept.status : 1
    },
    submitLabel: 'Save Changes',
    onSubmit: async (values) => {
      const res = await fetchApi(`/admin/departments/${dept.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: values.code.trim().toUpperCase(),
          name: values.name.trim(),
          duration: parseInt(values.duration, 10) || 3,
          status: parseInt(values.status, 10)
        })
      });
      if (res.success) {
        showToast('Department updated successfully', 'success');
        await loadAllData();
      } else {
        throw new Error(res.error || 'Failed to update department');
      }
    }
  });
}

// 5. Declarative Confirmation Dialog for Delete
function handleDeleteDepartment(dept) {
  openConfirm({
    title: 'Delete Department?',
    message: `Are you sure you want to permanently delete this academic division? This action removes all department associations and cannot be undone.`,
    targetName: `${dept.name} (${dept.code})`,
    confirmText: 'Delete Department',
    confirmVariant: 'danger',
    requireTyping: dept.code,
    onConfirm: async () => {
      const res = await fetchApi(`/admin/departments/${dept.id}`, {
        method: 'DELETE'
      });
      if (res.success) {
        showToast('Department deleted successfully', 'success');
        await loadAllData();
      } else {
        throw new Error(res.error || 'Failed to delete department');
      }
    }
  });
}

// 6. Search Filter
function handleSearch(val) {
  searchQuery = val;
  renderTable();
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  Promise.all([loadAllData(), loadSessionStatus()]);
});
