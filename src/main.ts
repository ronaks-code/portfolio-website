import "@fontsource-variable/rubik";
import "./style.css";
import { projects } from "./data";

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

// ---------- 3D hero (lazy: text paints first, three.js streams in after) ----------
const canvas = document.querySelector<HTMLCanvasElement>(".hero-canvas");
if (canvas) {
  const start = () =>
    import("./three/hero")
      .then(({ initHero }) => initHero(canvas, "/img/snow.webp"))
      .catch((err) => console.warn("Hero scene unavailable, using fallback.", err));
  if ("requestIdleCallback" in window) requestIdleCallback(start, { timeout: 600 });
  else setTimeout(start, 120);
}

// Hide the hero hint after the first interaction
document.querySelector(".hero")?.addEventListener(
  "hero:gust",
  () => document.querySelector(".hero-hint")?.classList.add("used"),
  { once: true },
);

// ---------- Playground (loads when it gets close to the viewport) ----------
const pg = document.querySelector<HTMLElement>("[data-playground]");
if (pg) {
  const pgIO = new IntersectionObserver(
    ([e]) => {
      if (!e.isIntersecting) return;
      pgIO.disconnect();
      import("./three/playground")
        .then(({ initPlayground }) => initPlayground(pg))
        .catch((err) => {
          console.warn("Playground unavailable.", err);
          pg.classList.add("no-webgl");
        });
    },
    { rootMargin: "600px 0px" },
  );
  pgIO.observe(pg);
  pg.addEventListener("playground:call", () => pg.classList.add("used"), { once: true });
}

// ---------- Hobby clips: play on hover (desktop) or while on screen (touch) ----------
document.querySelectorAll<HTMLElement>(".hobby.has-video").forEach((card) => {
  const v = card.querySelector("video")!;
  const play = () => {
    v.play().then(() => card.classList.add("playing")).catch(() => {});
  };
  const pause = () => {
    v.pause();
    card.classList.remove("playing");
  };
  if (reduced) return;
  if (finePointer) {
    card.addEventListener("pointerenter", play);
    card.addEventListener("pointerleave", pause);
  } else {
    new IntersectionObserver(([e]) => (e.isIntersecting ? play() : pause()), { threshold: 0.6 }).observe(card);
  }
});

// ---------- Typewriter (types, holds, erases, loops, like the original) ----------
const typeEl = document.querySelector<HTMLElement>("[data-type]");
if (typeEl) {
  const text = typeEl.dataset.type ?? "";
  if (reduced) typeEl.textContent = text;
  else {
    let i = 0;
    let deleting = false;
    const tick = () => {
      typeEl.textContent = text.slice(0, i);
      let wait = deleting ? 14 : 34 + Math.random() * 40;
      if (!deleting && i === text.length) {
        deleting = true;
        wait = 2600;
      } else if (deleting && i === 0) {
        deleting = false;
        wait = 600;
      }
      i += deleting ? -1 : 1;
      setTimeout(tick, wait);
    };
    setTimeout(tick, 700);
  }
}

// ---------- Scroll reveal ----------
const revealIO = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        revealIO.unobserve(e.target);
      }
    }
  },
  { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
);
document.querySelectorAll(".reveal").forEach((el) => revealIO.observe(el));

// ---------- Top bar + active section in the pill nav ----------
const topbar = document.querySelector<HTMLElement>("[data-topbar]");
const navLinks = [...document.querySelectorAll<HTMLAnchorElement>("[data-nav]")];
const sections = navLinks
  .map((a) => document.getElementById(a.dataset.nav!))
  .filter((s): s is HTMLElement => !!s);

const timeline = document.querySelector<HTMLElement>("[data-timeline]");

let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    ticking = false;
    const y = window.scrollY;
    const vh = window.innerHeight;
    topbar?.classList.toggle("scrolled", y > vh * 0.6);
    document.body.classList.toggle("past-hero", y > vh * 0.6);

    let current = "";
    for (const s of sections) if (s.getBoundingClientRect().top < vh * 0.45) current = s.id;
    for (const a of navLinks) a.classList.toggle("active", a.dataset.nav === current);

    if (timeline) {
      const r = timeline.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (vh * 0.6 - r.top) / r.height));
      timeline.style.setProperty("--progress", p.toFixed(3));
    }
  });
}
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// ---------- Tilt on hover (fine pointers only) ----------
if (finePointer && !reduced) {
  document.querySelectorAll<HTMLElement>(".tilt").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty("--rx", `${(-y * 6).toFixed(2)}deg`);
      el.style.setProperty("--ry", `${(x * 8).toFixed(2)}deg`);
      el.style.setProperty("--mx", `${((x + 0.5) * 100).toFixed(1)}%`);
      el.style.setProperty("--my", `${((y + 0.5) * 100).toFixed(1)}%`);
    });
    el.addEventListener("pointerleave", () => {
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    });
  });
}

// ---------- Project modal ----------
const modal = document.querySelector<HTMLDialogElement>("#project-modal")!;
const track = modal.querySelector<HTMLElement>(".carousel-track")!;
const dots = modal.querySelector<HTMLElement>(".carousel-dots")!;
const prev = modal.querySelector<HTMLButtonElement>(".carousel-btn.prev")!;
const next = modal.querySelector<HTMLButtonElement>(".carousel-btn.next")!;

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, props: Partial<HTMLElementTagNameMap[K]> = {}) =>
  Object.assign(document.createElement(tag), props);

function fillList(name: string, items: string[], empty: string) {
  const ul = modal.querySelector<HTMLElement>(`[data-list="${name}"]`)!;
  ul.replaceChildren(...(items.length ? items : [empty]).map((t) => el("li", { textContent: t })));
}

function slideTo(i: number) {
  const slides = track.children.length;
  const idx = (i + slides) % slides;
  track.scrollTo({ left: idx * track.clientWidth, behavior: reduced ? "auto" : "smooth" });
}

function currentSlide() {
  return Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
}

track.addEventListener(
  "scroll",
  () => {
    const i = currentSlide();
    [...dots.children].forEach((d, k) => d.classList.toggle("active", k === i));
  },
  { passive: true },
);
prev.addEventListener("click", () => slideTo(currentSlide() - 1));
next.addEventListener("click", () => slideTo(currentSlide() + 1));
track.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") slideTo(currentSlide() + 1);
  if (e.key === "ArrowLeft") slideTo(currentSlide() - 1);
});

function openProject(id: string) {
  const p = projects.find((x) => x.id === id);
  if (!p) return;
  modal.querySelector("#modal-title")!.textContent = p.fullTitle;
  modal.querySelector(".modal-dates")!.textContent = p.dates;
  modal.querySelector(".modal-description")!.textContent = p.description;

  track.replaceChildren(
    ...p.images.map((src, i) => {
      const slide = el("div", { className: "slide" });
      slide.append(el("img", { src, alt: `${p.title} screenshot ${i + 1}`, decoding: "async" }));
      return slide;
    }),
  );
  dots.replaceChildren(
    ...p.images.map((_, i) => {
      const b = el("button", { type: "button", className: i === 0 ? "active" : "" });
      b.setAttribute("aria-label", `Image ${i + 1}`);
      b.addEventListener("click", () => slideTo(i));
      return b;
    }),
  );
  const multi = p.images.length > 1;
  prev.hidden = next.hidden = dots.hidden = !multi;

  fillList("skillsUsed", p.skillsUsed, "—");
  fillList("skillsLearned", p.skillsLearned, "—");
  fillList("nextSteps", p.nextSteps, "No upcoming steps listed.");
  const links = modal.querySelector<HTMLElement>('[data-list="links"]')!;
  const entries = Object.entries(p.links);
  links.replaceChildren(
    ...(entries.length
      ? entries.map(([name, url]) => {
          const li = el("li");
          li.append(el("a", { href: url, target: "_blank", rel: "noopener noreferrer", textContent: name }));
          return li;
        })
      : [el("li", { textContent: "Under construction!" })]),
  );

  document.documentElement.classList.add("modal-open");
  modal.showModal();
  track.scrollLeft = 0;
}

function closeModal() {
  if (!modal.open) return;
  modal.classList.add("closing");
  setTimeout(
    () => {
      modal.classList.remove("closing");
      modal.close();
    },
    reduced ? 0 : 180,
  );
}

modal.addEventListener("close", () => document.documentElement.classList.remove("modal-open"));
modal.addEventListener("cancel", (e) => {
  e.preventDefault();
  closeModal();
});
modal.addEventListener("click", (e) => {
  const t = e.target as HTMLElement;
  if (t === modal || t.closest("[data-close]")) closeModal();
});
document.querySelectorAll<HTMLButtonElement>("[data-project]").forEach((b) =>
  b.addEventListener("click", () => openProject(b.dataset.project!)),
);
