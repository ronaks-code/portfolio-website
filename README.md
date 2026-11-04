# ronak.studio

Personal site. Vite + vanilla TypeScript + three.js, deployed on Vercel.

- `npm run dev` – local dev server
- `npm run build` – production build to `dist/`
- `npm run images` – re-encode photos from `assets/` into `public/img/*.webp`

Content lives in `src/data.ts` (experience, projects, languages, hobbies). It is rendered
into `index.html` at build time, so edit the data file, not the HTML.

The 3D hero (`src/hero.ts`) is a procedural low-poly mountain range with falling snow,
lazy-loaded after first paint, paused off-screen, and replaced by a static frame for
`prefers-reduced-motion`. Without WebGL the CSS fallback (snow photo + gradient) shows.
