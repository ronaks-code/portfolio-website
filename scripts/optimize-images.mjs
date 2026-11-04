// One-off image pipeline: originals live in /assets, optimized WebP goes to /public/img.
// Run with `npm run images` after adding or replacing a photo.
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { parse } from "node:path";

const SRC = "assets";
const OUT = "public/img";
mkdirSync(OUT, { recursive: true });

const groups = {
  // max width in px
  1600: [
    "universe1.png", "universe2.png", "universe3.png", "universeMain.png",
    "binvision1.png", "binvision2.png", "binvision3.png",
    "amazonPrice1.png", "amazonPrice2.png", "amazonPrice3.png",
    "agriculture.png", "agriculture1.png", "agriculture2.png", "agriculture3.png", "agricultureMain.png",
    "psychology1.png", "psychologyMain.png",
    "desksetup2.webp", "desksetup3.jpeg", "desksetup4.webp",
    "app.webp", "app1.webp", "app2.webp", "accountingMain.webp", "binvisionMain.webp", "amazonMain.png",
  ],
  900: [
    "ronak.jpeg", "contactRonak.png",
    "soccer.jpg", "startups.jpg", "basketball.jpg", "journaling.jpg", "pickleball.jpg",
    "origami.jpg", "guitar.jpg", "piano.jpg", "musicproduction.jpg",
  ],
  240: ["doordash_logo.png", "amazon_logo.png", "chickfila_logo.png"],
};

let total = 0;
for (const [width, files] of Object.entries(groups)) {
  for (const f of files) {
    const out = `${OUT}/${parse(f).name}.webp`;
    const info = await sharp(`${SRC}/${f}`)
      .rotate()
      .resize({ width: Number(width), withoutEnlargement: true })
      .webp({ quality: 78, effort: 5 })
      .toFile(out);
    total += info.size;
    console.log(`${out}  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)}KB`);
  }
}

// Open Graph card + no-WebGL fallback for the hero
await sharp(`${SRC}/snow.jpg`).resize(1200, 630, { fit: "cover" }).jpeg({ quality: 80 }).toFile("public/og.jpg");
await sharp(`${SRC}/snow.jpg`).resize({ width: 1920 }).webp({ quality: 70 }).toFile(`${OUT}/snow.webp`);
console.log(`total ${(total / 1024 / 1024).toFixed(2)}MB`);
