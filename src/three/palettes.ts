// The original site's four Granim [top, bottom] gradient states. Kept free of
// three.js imports so the build-time HTML renderer can use it too.
export const PALETTES: { name: string; top: string; bottom: string }[] = [
  { name: "Dusk", top: "#29323c", bottom: "#485563" },
  { name: "Sunset", top: "#FF6B6B", bottom: "#556270" },
  { name: "Sky", top: "#80d3fe", bottom: "#7ea0c4" },
  { name: "Golden", top: "#f0ab51", bottom: "#eceba3" },
];
export const STATE_MS = 8000;
