# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start dev server at http://localhost:5173
npm run build     # tsc -b && vite build (TypeScript check + production bundle)
npm run lint      # eslint
npm run preview   # serve the production build locally
```

There are no tests in this project.

## Architecture

**Elo** is a Brazilian school management platform (SPA). All data lives in `localStorage` — 

### Data layer — `src/lib/storage.ts`

Single `storage` object wraps `localStorage` with typed helpers: `get`, `set`, `push`, `update`, `remove_item`. All keys are prefixed with `elo_`. Every stored entity must have an `id: string` field. The `storage.update<T>()` call requires an explicit type parameter or TypeScript will infer `T` as `{ id: string }` and reject extra fields.

Mock data is seeded once on first load via `seedIfEmpty()` in `src/lib/mockData.ts` — it checks the `seeded` key and populates all entities. Demo passwords are stored separately under the `passwords` key (map of `userId → password`; default is `123456`).

### Auth & permissions — `src/contexts/AuthContext.tsx` + `src/lib/constants.ts`

`AuthContext` stores `currentUser: User | null`. After `if (!user) return null` guards in render, event handler closures still see `User | null`, so use `user!.id` inside callbacks.

All role-based feature access goes through `hasPermission(role, permission)` from `constants.ts`. The `PERMISSIONS` object maps permission keys to arrays of allowed roles. Feature visibility in the sidebar (`buildNav`) and page-level guards use this.

### Role behaviour

Five roles drive most conditional rendering:
- `aluno` — gamified dashboard, own grades/attendance only
- `pai` — read-only view of child (linked via `user.child_ra` → `student.enrollment_number`)
- `professor` — can edit grades, attendance, create tasks/classroom posts
- `coordenador` / `diretor` — same as professor plus school management; only `diretor` can delete students

### Gamification — `src/lib/achievements.ts` + `src/lib/constants.ts`

XP → level: `Math.floor(xp / 100) + 1`. Five leagues: Bronze (0–999 XP), Prata (1000–2499), Ouro (2500–4999), Platina (5000–9999), Diamante (10000+). `GamificationData` is stored per student by `student_id`. Achievements are unlocked by checking counts in the stored data — there is no automatic unlock engine; pages push to the `achievements` array manually.

### Grade calculation

Assessments have a `weight` (percentage). Weighted average: `sum(score × weight) / sum(weight)`. Status from `GRADE_STATUS(avg, attendancePct)`: Aprovado (avg ≥ 7 AND freq ≥ 75%), Recuperação (avg ≥ 5), Reprovado (avg < 5). Three trimesters (`term: 1 | 2 | 3`) — never semesters.

### Student risk computation

Used in Analytics and Dashboard: `vermelho` if avg < 5 or freq < 60%; `amarelo` if avg < 7 or freq < 75%; `verde` otherwise. Each page that needs it implements its own local `computeRisk()` function reading from `assessment_grades` and `attendances` in storage.

### Styling

Tailwind CSS v3 with `darkMode: 'class'`. Custom colors: `amber` (primary actions, `#F59E0B`) and `electric` (blue accents, `#60A5FA`). Reusable CSS component classes are defined in `src/index.css` under `@layer components`: `.card`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.input`, `.select`, `.textarea`, `.label`, `.sidebar-link`, `.tab`, `.badge-approved`, `.badge-recovery`, `.badge-failed`, `.xp-bar`, `.xp-fill`. Use these classes rather than repeating Tailwind utilities.

### PDF generation — `src/lib/pdf.ts`

Uses jsPDF directly. `generateReportCard()` takes a student, their assessments, grades, and a `Record<subject, attendancePct>` map, then saves an A4 PDF automatically.
