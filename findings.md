# Findings

- Repo: Next.js 16.4 (App Router, `cacheComponents: true`, `partialPrefetching: true`), React 19.3, Tailwind v4 via `@tailwindcss/turbopack`, deps: zod 4, phosphor icons, motion, neon serverless, drizzle (tidak dipakai). Belum ada commit.
- Tidak ada `.env` → Neon belum dikonfigurasi; perlu fallback file lokal.
- Next 16: data cache = `'use cache'` + `cacheLife` + `cacheTag`; mutasi di server action → `updateTag(tag)` (read-your-own-writes). Runtime API (`cookies()`) wajib di dalam `<Suspense>`.
- Middleware berganti nama jadi `proxy` di v16; tidak dipakai (cek auth di page + action).
- Neumorphism: kelemahan utama kontras rendah & tombol tak terbedakan dari dekorasi → tinta teks dihitung dari luminans base, fokus ring jelas, state ditandai LED (bukan cuma bayangan).
- Skill `taste-skill`/`design-taste-frontend` diaktifkan di `.claude/settings.json` project tapi tidak tersedia di sesi ini.
- Orca 1.4.226 runtime ready; orchestration `worker-start --spec ... --agent claude`.
