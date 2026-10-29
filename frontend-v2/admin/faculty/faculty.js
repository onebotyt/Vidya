/**
 * Faculty & HOD Management Controller (Frontend-v2)
 * Location: /admin/faculty/faculty.js
 * 
 * Declarative, React-like logic powered by DynamicFormDialog, ConfirmDialog, and DataTable.
 */

if (typeof guardRoute === 'function') {
  guardRoute(['SYSTEM_ADMIN']);
}

const API = '/api/v1';
let hodData = [];
let pendingHods = [];
let departments = [];
let searchQuery = '';
let selectedDeptFilter = '';
let adminGates = { hod_open: false, common_faculty_open: false };

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

// 1. Data Bootstrap
async function init() {
  await Promise.all([
    loadDepartments(),
    loadHODs(),
    loadPendingHods(),
    loadRegistrationGates()
  ]);
}

// 2. Load Master Hierarchy & Departments
async function loadDepartments() {
  try {
    const res = await fetchApi(`${API}/admin/hierarchy`);
    departments = Array.isArray(res.data) ? res.data : (res.data?.departments || []);
    
    // Populate Department Filter Dropdown
    const filterSelect = document.getElementById('hod-dept-filter');
    if (filterSelect) {
      filterSelect.innerHTML = '<option value="">All Departments</option>';
      departments.forEach((d) => {
        const opt = document.createElement('option');
        opt.value = d.id;
        opt.textContent = `${d.name} (${d.code})`;
        filterSelect.appendChild(opt);
      });
    }

    const deptCountEl = document.getElementById('stat-dept-count');
    if (deptCountEl) deptCountEl.textContent = departments.length;
  } catch (err) {
    console.warn('Failed to load departments:', err);
  }
}

// 3. Load HOD Accounts
async function loadHODs() {
  try {
    const res = await fetchApi(`${API}/admin/hods`);
    hodData = res.data || [];

    const badge = document.getElementById('hod-count-badge');
    if (badge) badge.textContent = `${hodData.length} HOD${hodData.length !== 1 ? 's' : ''}`;

    const statCount = document.getElementById('stat-hod-count');
    if (statCount) statCount.textContent = hodData.length;

    renderHODTable();
  } catch (err) {
    showToast('Failed to load HOD accounts: ' + err.message, 'error');
  }
}

// 4. Load Pending Self-Registered HODs
async function loadPendingHods() {
  try {
    let res;
    try {
      res = await fetchApi(`${API}/admin/registrations/pending-hods`);
    } catch (_) {
      res = await fetchApi(`${API}/admin/hods/pending`);
    }
    pendingHods = res?.data || [];

    const pendingSection = document.getElementById('pending-hods-section');
    const pendingStat = document.getElementById('stat-pending-count');
    const pendingBadge = document.getElementById('pending-badge-count');

    if (pendingStat) pendingStat.textContent = pendingHods.length;
    if (pendingBadge) pendingBadge.textContent = `${pendingHods.length} Pending`;

    if (pendingHods.length > 0 && pendingSection) {
      pendingSection.style.display = 'block';
      renderPendingTable();
    } else if (pendingSection) {
      pendingSection.style.display = 'none';
    }
  } catch (err) {
    console.warn('Could not load pending HODs:', err);
  }
}

// 5. Anti-Spam Registration Gates
async function loadRegistrationGates() {
  try {
    const res = await fetchApi(`${API}/admin/registration-gates`);
    if (res && res.success && res.data) {
      adminGates = res.data;
      renderRegistrationGates();
    }
  } catch (err) {
    console.warn('Failed to load registration gates:', err);
  }
}

function renderRegistrationGates() {
  const hodLabel = document.getElementById('hod-gate-label');
  const commonLabel = document.getElementById('common-gate-label');
  const hodBtn = document.getElementById('btn-toggle-hod-gate');
  const commonBtn = document.getElementById('btn-toggle-common-gate');

  if (hodLabel) {
    hodLabel.textContent = adminGates.hod_open ? 'Open' : 'Closed';
    if (hodBtn) {
      hodBtn.style.color = adminGates.hod_open ? 'var(--status-present)' : 'var(--status-absent)';
      hodBtn.style.borderColor = adminGates.hod_open ? 'var(--status-present)' : 'var(--border-color)';
    }
  }

  if (commonLabel) {
    commonLabel.textContent = adminGates.common_faculty_open ? 'Open' : 'Closed';
    if (commonBtn) {
      commonBtn.style.color = adminGates.common_faculty_open ? 'var(--status-present)' : 'var(--status-absent)';
      commonBtn.style.borderColor = adminGates.common_faculty_open ? 'var(--status-present)' : 'var(--border-color)';
    }
  }
}

async function toggleAdminGate(target) {
  const isHod = target === 'HOD';
  const current = isHod ? adminGates.hod_open : adminGates.common_faculty_open;

  try {
    const res = await fetchApi(`${API}/admin/registration-gates/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target, open: !current })
    });
    if (res && res.success) {
      if (isHod) adminGates.hod_open = Boolean(res.data?.is_open);
      else adminGates.common_faculty_open = Boolean(res.data?.is_open);
      renderRegistrationGates();
      showToast(`${isHod ? 'HOD' : 'Common Faculty'} gate ${!current ? 'opened' : 'closed'} successfully`, 'success');
    }
  } catch (err) {
    showToast('Failed to toggle gate: ' + err.message, 'error');
  }
}

// 6. Render Main HOD DataTable
function renderHODTable() {
  let filtered = hodData;

  if (selectedDeptFilter) {
    filtered = filtered.filter((h) => String(h.department_id) === String(selectedDeptFilter));
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(
      (h) =>
        (h.full_name && h.full_name.toLowerCase().includes(q)) ||
        (h.gmail && h.gmail.toLowerCase().includes(q)) ||
        (h.department_name && h.department_name.toLowerCase().includes(q)) ||
        (h.employee_id && h.employee_id.toLowerCase().includes(q))
    );
  }

  renderDataTable({
    container: 'hod-table-container',
    columns: [
      {
        key: 'full_name',
        label: 'HOD Member',
        render: (name, row) => `
          <div class="fac-user-cell">
            <div class="fac-avatar">${(name || 'H').charAt(0).toUpperCase()}</div>
            <div>
              <div style="font-weight:600;color:var(--text-main);">${name}</div>
              ${row.employee_id ? `<div style="font-size:0.75rem;color:var(--text-muted);font-family:var(--font-family-mono);">${row.employee_id}</div>` : ''}
            </div>
          </div>
        `
      },
      {
        key: 'department_name',
        label: 'Department',
        render: (deptName) =>
          deptName
            ? `<span class="badge chip-hod">${deptName}</span>`
            : `<span style="color:var(--text-muted);font-size:0.8125rem;">— Unassigned —</span>`
      },
      {
        key: 'gmail',
        label: 'Login Email',
        render: (email) => `<span style="font-family:var(--font-family-mono);font-size:0.8125rem;color:var(--color-primary);">${email}</span>`
      },
      {
        key: 'must_change_password',
        label: 'Account Status',
        align: 'center',
        render: (pendingChange) =>
          pendingChange
            ? `<span class="badge badge-late">Pending Login</span>`
            : `<span class="badge badge-present">Active</span>`
      },
      {
        key: 'created_at',
        label: 'Appointed Date',
        render: (date) => `<span style="font-size:0.8125rem;color:var(--text-muted);">${fmtDate(date)}</span>`
      }
    ],
    data: filtered,
    emptyMessage: 'No HOD accounts match your filter criteria',
    actions: [
      {
        label: 'Reassign',
        icon: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>',
        variant: 'secondary',
        onClick: (hod) => handleReassignDept(hod)
      },
      {
        label: 'Reset Pwd',
        icon: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>',
        variant: 'secondary',
        onClick: (hod) => handleResetPassword(hod)
      },
      {
        label: 'Delete',
        icon: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
        variant: 'danger-soft',
        onClick: (hod) => handleDeleteHOD(hod)
      }
    ]
  });
}

// 7. Render Pending Approvals DataTable
function renderPendingTable() {
  renderDataTable({
    container: 'pending-table-container',
    columns: [
      {
        key: 'full_name',
        label: 'Applicant Name',
        render: (name) => `<span style="font-weight:600;color:var(--text-main);">${name}</span>`
      },
      {
        key: 'gmail',
        label: 'Email',
        render: (email) => `<span style="font-family:var(--font-family-mono);font-size:0.8125rem;">${email}</span>`
      },
      {
        key: 'department_name',
        label: 'Requested Department',
        render: (dept) => `<span class="badge chip-hod">${dept || 'General'}</span>`
      },
      {
        key: 'created_at',
        label: 'Submitted',
        render: (date) => fmtDate(date)
      }
    ],
    data: pendingHods,
    actions: [
      {
        label: 'Approve',
        variant: 'primary',
        onClick: async (req) => {
          try {
            const res = await fetchApi(`${API}/admin/hods/pending/${req.id}/approve`, { method: 'POST' });
            if (res.success) {
              showToast(`Approved ${req.full_name} as HOD!`, 'success');
              await Promise.all([loadHODs(), loadPendingHods()]);
            }
          } catch (err) {
            showToast('Approval failed: ' + err.message, 'error');
          }
        }
      },
      {
        label: 'Reject',
        variant: 'danger-soft',
        onClick: async (req) => {
          openConfirm({
            title: 'Reject HOD Application?',
            message: `Reject registration request for ${req.full_name}?`,
            onConfirm: async () => {
              const res = await fetchApi(`${API}/admin/hods/pending/${req.id}/reject`, { method: 'POST' });
              if (res.success) {
                showToast(`Rejected request for ${req.full_name}`, 'info');
                await loadPendingHods();
              }
            }
          });
        }
      }
    ]
  });
}

// 8. Declarative Dialogs: Create, Reassign, Reset, Delete
function handleCreateHOD() {
  const deptOptions = departments.map((d) => ({
    value: d.id,
    label: `${d.name} (${d.code})`
  }));

  openDynamicForm({
    title: 'Appoint Head of Department',
    subtitle: 'Create a new HOD administrator account and assign department authority',
    fields: [
      {
        name: 'full_name',
        label: 'Full Name',
        type: 'text',
        required: true,
        placeholder: 'e.g. Dr. Rajesh Sharma'
      },
      {
        name: 'gmail',
        label: 'Institutional Gmail / Email',
        type: 'email',
        required: true,
        placeholder: 'e.g. hod.it@college.edu',
        help: 'Used for single sign-on and login'
      },
      {
        name: 'employee_id',
        label: 'Employee / Faculty ID',
        type: 'text',
        placeholder: 'e.g. FAC-IT-01'
      },
      {
        name: 'department_id',
        label: 'Department Assignment',
        type: 'select',
        required: true,
        options: deptOptions
      },
      {
        name: 'temporary_password',
        label: 'Initial Temporary Password',
        type: 'text',
        placeholder: 'Password@123',
        help: 'The user will be prompted to rotate password on first sign in'
      }
    ],
    initialValues: { temporary_password: 'Password@123' },
    submitLabel: 'Create & Appoint HOD',
    onSubmit: async (values) => {
      const res = await fetchApi(`${API}/admin/hods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: values.full_name.trim(),
          gmail: values.gmail.trim(),
          employee_id: values.employee_id?.trim() || null,
          department_id: parseInt(values.department_id, 10),
          password: values.temporary_password || 'Password@123'
        })
      });
      if (res.success) {
        showToast('HOD appointed successfully!', 'success');
        await loadHODs();
      } else {
        throw new Error(res.error || 'Failed to appoint HOD');
      }
    }
  });
}

function handleReassignDept(hod) {
  const deptOptions = departments.map((d) => ({
    value: d.id,
    label: `${d.name} (${d.code})`
  }));

  openDynamicForm({
    title: 'Reassign Department',
    subtitle: `Transfer department leadership for ${hod.full_name}`,
    fields: [
      {
        name: 'department_id',
        label: 'Select New Department',
        type: 'select',
        required: true,
        options: deptOptions
      }
    ],
    initialValues: { department_id: hod.department_id },
    submitLabel: 'Update Department',
    onSubmit: async (values) => {
      const res = await fetchApi(`${API}/admin/hods/${hod.teacher_id}/reassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department_id: parseInt(values.department_id, 10)
        })
      });
      if (res.success) {
        showToast('Department reassigned successfully!', 'success');
        await loadHODs();
      } else {
        throw new Error(res.error || 'Failed to reassign department');
      }
    }
  });
}

function handleResetPassword(hod) {
  openDynamicForm({
    title: 'Reset Password',
    subtitle: `Generate new login credentials for ${hod.full_name}`,
    fields: [
      {
        name: 'new_password',
        label: 'New Temporary Password',
        type: 'text',
        required: true,
        placeholder: 'Password@123'
      }
    ],
    initialValues: { new_password: 'Password@123' },
    submitLabel: 'Reset Password',
    onSubmit: async (values) => {
      const res = await fetchApi(`${API}/admin/teachers/${hod.teacher_id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: values.new_password
        })
      });
      if (res.success) {
        showToast(`Password reset for ${hod.full_name}!`, 'success');
        await loadHODs();
      } else {
        throw new Error(res.error || 'Failed to reset password');
      }
    }
  });
}

function handleDeleteHOD(hod) {
  openConfirm({
    title: 'Revoke HOD Powers & Delete Account?',
    message: `Are you sure you want to remove ${hod.full_name}? This will revoke department head authority and delete the user account.`,
    targetName: `${hod.full_name} (${hod.gmail})`,
    confirmText: 'Delete Account',
    confirmVariant: 'danger',
    requireTyping: hod.full_name,
    onConfirm: async () => {
      const res = await fetchApi(`${API}/admin/teachers/${hod.teacher_id}`, {
        method: 'DELETE'
      });
      if (res.success) {
        showToast('Account deleted successfully', 'success');
        await loadHODs();
      } else {
        throw new Error(res.error || 'Failed to delete account');
      }
    }
  });
}

// 9. Filters
function handleSearch(val) {
  searchQuery = val;
  renderHODTable();
}

function handleDeptFilter(deptId) {
  selectedDeptFilter = deptId;
  renderHODTable();
}

window.handleCreateHOD = handleCreateHOD;
window.handleSearch = handleSearch;
window.handleDeptFilter = handleDeptFilter;
window.toggleAdminGate = toggleAdminGate;

window.addEventListener('DOMContentLoaded', init);
