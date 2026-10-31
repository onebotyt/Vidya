## 🛡️ VidyaOS Component Developer Pull Request

### 📌 Summary of Changes
- **Target Role / Domain**: [ ] Admin (`admin/components/`) | [ ] Faculty (`faculty/components/`) | [ ] Student (`student/components/`) | [ ] Shared Primitives (`components/`)
- **Component(s) Modified / Added**: 
- **Purpose**: Explain how this component eliminates duplicate code or reduces page payload.

---

### 🔍 Component Isolation Checklist
Please confirm that your Pull Request satisfies all isolation and guardrail rules:
- [ ] **Components Only**: My changes are strictly inside `components/` directories.
- [ ] **No Backend / Core Changes**: I have NOT modified `backend/`, database files (`*.sqlite`), server files, or `package.json`.
- [ ] **No Frozen Modules**: I have NOT modified any of the 9 frozen frontend modules (`faculty/registers/`, `faculty/assignments/`, etc.).
- [ ] **Role Isolation**: Admin components do not leak into student/faculty views, and vice versa.
- [ ] **Theme Token Compliance**: No hardcoded hex (`#hex`) or `rgb(...)` colors. All styling uses CSS variables (e.g. `var(--bg-app)`, `var(--text-main)`, `var(--border-color)`).
- [ ] **Responsive Design**: Tested on both Desktop (>= 1024px) and Mobile (<= 768px).
- [ ] **Documentation**: Documented changes in component README or `TODO.md`.

---

### 🧪 Local Verification Command
Before requesting review, ensure the local guard passes:
```bash
node scripts/verify-components-only.js
```
All checks must pass green.
