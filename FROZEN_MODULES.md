# 🔒 Frozen & Protected Frontend Modules (Strict Read-Only)

> **AUTHORITATIVE DIRECTIVE FOR ALL AGENTS, DEVELOPERS & CONTRIBUTORS:**
> The folders listed in this document are **strictly frozen, locked, and protected**.
> **NO EDITS, MODIFICATIONS, REFACTORING, RENAMING, OR DELETIONS ARE PERMITTED** inside any of these folders.
> These components represent finalized, production-verified architectural baselines.

---

## 🛑 Protected / Read-Only Folder Registry

The following **9 frontend directories** are permanently protected:

| # | Directory Path | Module / Feature Name | Description & Invariant |
| :-: | :--- | :--- | :--- |
| **1** | `frontend/faculty/assignments/` | Faculty Assignments Module | Assignment scoping & legacy redirection baseline. |
| **2** | `frontend/faculty/evaluation/` | Faculty Evaluation & Grading | Performance metrics & student grading interfaces. |
| **3** | `frontend/faculty/group-detail/` | Faculty Google Classroom Workspace | Unified Stream, Classwork, People & Grades workspace engine. |
| **4** | `frontend/faculty/groups/` | Faculty Teaching Groups | Card-grid group selector and semester course spaces. |
| **5** | `frontend/faculty/registers/` | Consolidated 3-in-1 Attendance Register | Day 1–31 matrix, ESP32 toolbar, Dual QR/PIN Studio & Roll Call. |
| **6** | `frontend/faculty/sheets/` | Faculty Attendance Sheets & Exports | Spreadsheet-style monthly ledger & export utilities. |
| **7** | `frontend/faculty/students/` | Faculty Students Roster & Gateways | Student enrollment lists, registration toggle gateways, approval queue. |
| **8** | `frontend/faculty/tests/` | Faculty Class Tests & Marksheets | Internal exam scheduling, marks roster, and assessment grids. |
| **9** | `frontend/student/group-detail/` | Student Google Classroom View | Student-side unified classroom portal & submission workflow. |

---

## 🛡️ Guardrails & Operating Rules

1. **Strict No-Edit Invariant**:
   - Do NOT edit, patch, refactor, reorganize, or format any file (`.html`, `.js`, `.css`, or assets) inside the 9 protected folders.
   - When resolving bugs or developing new features, changes must be implemented in outer, non-frozen modules or shared utilities, leaving these directories completely untouched.

2. **Cross-Session Memory Enforcement**:
   - Any AI assistant (Antigravity, Dev 2 agent, or pair programmer) resuming from context reset must treat this list as an immutable operational constraint.
   - Referenced in [AGENTS.md](file:///c:/Users/hp/.gemini/antigravity-ide/scratch/Vidya/AGENTS.md), [DEV2_ANTIGRAVITY_INSTRUCTIONS.md](file:///c:/Users/hp/.gemini/antigravity-ide/scratch/Vidya/DEV2_ANTIGRAVITY_INSTRUCTIONS.md), and [TODO.md](file:///c:/Users/hp/.gemini/antigravity-ide/scratch/Vidya/TODO.md).

3. **Collaboration & PR Protection**:
   - Any pull request or commit proposing changes inside these 9 directories should be rejected or flagged during review.
