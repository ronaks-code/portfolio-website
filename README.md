# ronak.studio

Personal site. Vite + vanilla TypeScript + three.js, deployed on Vercel.

- `npm run dev` – local dev server
- `npm run build` – production build to `dist/`
- `npm run images` – re-encode photos from `assets/` into `public/img/*.webp`

Content lives in `src/data.ts` (experience, projects, languages, hobbies). It is rendered
into `index.html` at build time, so edit the data file, not the HTML.

3D bits live in `src/three/` and share one lazily loaded three.js chunk:

- `hero.ts` – the snowy mountain photo multiplied by the cycling gradient (the
  original look), with depth parallax, snow that parts around the cursor, a click
  gust, and a flock of origami cranes (`cranes.ts`) that follows the cursor.
- `playground.ts` – a floating paper diorama of a seeded mountain range: drag to
  orbit, "New range" to grow a new seed, palette chips, click a peak to call the cranes.

Both pause when off-screen, render a still frame for `prefers-reduced-motion`, and
fall back to plain CSS without WebGL.
