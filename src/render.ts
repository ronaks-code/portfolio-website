// Build-time HTML for the content sections. Imported by vite.config.ts and
// injected into index.html, so the page ships as real static HTML (fast first
// paint, crawlable) while data.ts stays the single source of content.
import { contact, experience, hobbies, languages, projects, type Project } from "./data.ts";
import { PALETTES } from "./three/palettes.ts";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const icons = {
  mail: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/></svg>`,
  linkedin: `<svg viewBox="0 0 24 24" aria-hidden="true" class="fill"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>`,
  github: `<svg viewBox="0 0 24 24" aria-hidden="true" class="fill"><path d="M12 .3a12 12 0 0 0-3.8 23.38c.6.12.83-.26.83-.57L9 21.07c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.09-.73.09-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.63-5.48 5.92.42.36.81 1.1.81 2.22l-.01 3.29c0 .31.2.69.82.57A12 12 0 0 0 12 .3"/></svg>`,
  user: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>`,
  briefcase: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/></svg>`,
  code: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 6-6 6 6 6M16 6l6 6-6 6"/></svg>`,
  file: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h6"/></svg>`,
  heart: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.6 1-1.1a5.5 5.5 0 0 0 0-7.7z"/></svg>`,
  sparkle: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></svg>`,
  shuffle: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17l6-10 4 6 3-4 5 8z"/><path d="M3 21h18"/></svg>`,
  play: `<svg viewBox="0 0 24 24" aria-hidden="true" class="fill"><path d="M8 5v14l11-7z"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
  external: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>`,
};

export const nav = [
  { id: "introduction", label: "Introduction", icon: icons.user },
  { id: "experience", label: "Experience", icon: icons.briefcase },
  { id: "projects", label: "Projects", icon: icons.code },
  { id: "playground", label: "Playground", icon: icons.sparkle },
  { id: "resume", label: "Resume", icon: icons.file },
  { id: "contact", label: "Contact", icon: icons.mail },
];

function renderNav() {
  return nav
    .map(
      (n) => `<li><a href="#${n.id}" data-nav="${n.id}" aria-label="${n.label}">
        <span class="dot">${n.icon}</span><span class="nav-label">${n.label}</span></a></li>`,
    )
    .join("");
}

function renderExperience() {
  return experience
    .map(
      (e, i) => `<li class="tl-item reveal" style="--d:${i * 90}ms">
      <span class="tl-node" aria-hidden="true"></span>
      <article class="tl-card glow-card">
        <div class="tl-logo"><img src="${e.logo}" alt="${esc(e.company)} logo" width="56" height="56" loading="lazy" decoding="async"></div>
        <div>
          <p class="tl-date">${esc(e.date)}</p>
          <h3>${esc(e.role)}</h3>
          <h4>${esc(e.company)}</h4>
          <p>${esc(e.blurb)}</p>
        </div>
      </article>
    </li>`,
    )
    .join("");
}

function chips(list: string[], max = 3) {
  const shown = list.slice(0, max);
  const more = list.length - shown.length;
  return `<ul class="chips">${shown.map((s) => `<li>${esc(s)}</li>`).join("")}${
    more > 0 ? `<li class="more">+${more}</li>` : ""
  }</ul>`;
}

function projectCard(p: Project, i: number, big = false) {
  const fit = p.coverFit === "contain" ? " contain" : "";
  return `<article class="project-card glow-card tilt reveal${big ? " big" : ""}" style="--d:${(i % 3) * 90}ms">
    <button class="project-hit" type="button" data-project="${p.id}" aria-label="See more about ${esc(p.title)}"></button>
    <div class="project-media${fit}">
      <img src="${p.cover}" alt="${esc(p.title)}" loading="lazy" decoding="async">
    </div>
    <div class="project-body">
      <p class="time-text">${esc(p.dates)}</p>
      <h3>${esc(p.title)}</h3>
      <p class="project-summary">${esc(p.summary)}</p>
      <div class="project-foot">
        ${chips(p.skillsUsed)}
        <span class="see-more">See more ${icons.arrow}</span>
      </div>
    </div>
  </article>`;
}

function renderCurrent() {
  return projects
    .filter((p) => p.status === "current")
    .map((p, i) => projectCard(p, i, true))
    .join("");
}

function renderCompleted() {
  return projects
    .filter((p) => p.status === "completed")
    .map((p, i) => projectCard(p, i))
    .join("");
}

function renderLanguages() {
  return languages
    .map(
      (l, i) => `<div class="lang reveal" style="--d:${i * 80}ms">
      <div class="lang-top"><span>${esc(l.name)} <em>(${esc(l.note)})</em></span><span class="lang-pct">${l.level}%</span></div>
      <div class="bar" role="progressbar" aria-label="${esc(l.name)}" aria-valuenow="${l.level}" aria-valuemin="0" aria-valuemax="100">
        <div class="bar-fill" style="--w:${l.level}%"></div>
      </div>
    </div>`,
    )
    .join("");
}

function renderHobbies() {
  return hobbies
    .map((h, i) => {
      const media = h.video
        ? `<video src="${h.video}" poster="${h.image}" muted loop playsinline preload="none" aria-label="${esc(h.name)} clip"></video>
           <span class="play-badge" aria-hidden="true">${icons.play}</span>`
        : `<img src="${h.image}" alt="${esc(h.name)}" loading="lazy" decoding="async">`;
      return `<figure class="hobby tilt reveal${h.video ? " has-video" : ""}" style="--d:${(i % 3) * 80}ms">
      ${media}
      <figcaption><span>${esc(h.name)}</span>${h.note ? `<small>${esc(h.note)}</small>` : ""}</figcaption>
    </figure>`;
    })
    .join("");
}

function renderPalettes() {
  return PALETTES.map(
    (p, i) => `<button type="button" class="swatch" data-palette="${i}" aria-pressed="false" title="${p.name}"
      style="--a:${p.top};--b:${p.bottom}"><span class="sr-only">${p.name} sky</span></button>`,
  ).join("");
}

function renderSocials() {
  return `
    <a class="social email" href="${contact.email}" aria-label="Email">${icons.mail}</a>
    <a class="social linkedin" href="${contact.linkedin}" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">${icons.linkedin}</a>
    <a class="social github" href="${contact.github}" target="_blank" rel="noopener noreferrer" aria-label="GitHub">${icons.github}</a>`;
}

export const slots: Record<string, () => string> = {
  nav: renderNav,
  experience: renderExperience,
  current: renderCurrent,
  completed: renderCompleted,
  languages: renderLanguages,
  hobbies: renderHobbies,
  socials: renderSocials,
  palettes: renderPalettes,
  "icon-arrow": () => icons.arrow,
  "icon-shuffle": () => icons.shuffle,
  "icon-sparkle": () => icons.sparkle,
  "icon-file": () => icons.file,
  "icon-external": () => icons.external,
  "resume-href": () => contact.resume,
  year: () => String(new Date().getFullYear()),
};
