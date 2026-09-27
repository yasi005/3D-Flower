// The whole story lives here. Each chapter is one step of the single-page
// experience (one wheel notch / swipe / arrow key): its copy, its right-side
// panels, and the 3D keyframe the scene settles into. Edit this file to re-theme.

export const MODEL_URLS = [
  "/flower-3d-models/clean/4.glb",
  "/flower-3d-models/clean/3.glb",
  "/flower-3d-models/clean/2.glb",
  "/flower-3d-models/clean/1.glb",
] as const;

/** side = eye-level turntable, detail = high angle close-up */
export type PanelMode = "side" | "detail";

export type SceneKey = {
  /** opacity per model (same order as MODEL_URLS): 1 = as authored, 0 = hidden */
  opacity: number[];
  /** continuous spin speed, radians / second */
  spin: number;
  /** extra rotation offset added on top of the spin */
  rotY: number;
  /** camera distance above the flower (overhead view) */
  camZ: number;
  /** UI accent (title outline, hairline rules, active nav, counter), sampled from the
   *  flower's own materials and lifted so it reads on the dark ground */
  accent: string;
};

export type Chapter = {
  id: string;
  pretitle: string;
  /** botanical-style classification under the pretitle */
  latin: string;
  title: string;
  body: string;
  meta: string[];
  panels: [{ label: string; mode: PanelMode }, { label: string; mode: PanelMode }];
  cta: { caption: string; label: string; action: "next" | "top" };
  scene: SceneKey;
};

export const CHAPTERS: Chapter[] = [
  {
    id: "specimen-01",
    pretitle: "// SPECIMEN 01 //",
    latin: "Lumen petala · translucent",
    title: "Neon Bloom",
    body: "Layer after layer of translucent petals, opening around a single centre. Light gathers in the folds and softens as it leaves.",
    meta: ["01 / 04", "TRANSLUCENT", "STUDIO A"],
    panels: [
      { label: "SPECIMEN 01 / PROFILE", mode: "side" },
      { label: "SPECIMEN 01 / DETAIL", mode: "detail" },
    ],
    cta: { caption: "Four specimens in the collection. Continue to the next.", label: "Next specimen", action: "next" },
    scene: { opacity: [1, 0, 0, 0], spin: 0.1, rotY: 0, camZ: 5.2, accent: "#a9c8ff" },
  },
  {
    id: "specimen-02",
    pretitle: "// SPECIMEN 02 //",
    latin: "Dahlia quanta · clearcoat",
    title: "Quantum Dahlia",
    body: "Glossy, textured petals arranged around a crown of fine stamens. Each surface holds a quiet reflection of the room.",
    meta: ["02 / 04", "CLEARCOAT", "STUDIO B"],
    panels: [
      { label: "SPECIMEN 02 / PROFILE", mode: "side" },
      { label: "SPECIMEN 02 / DETAIL", mode: "detail" },
    ],
    cta: { caption: "Two more specimens to go.", label: "Next specimen", action: "next" },
    scene: { opacity: [0, 1, 0, 0], spin: 0.12, rotY: 0, camZ: 5.2, accent: "#8e98ff" },
  },
  {
    id: "specimen-03",
    pretitle: "// SPECIMEN 03 //",
    latin: "Flora anomala · emissive",
    title: "Strange Bloom",
    body: "An unusual flower with petals that glow faintly from within — less lit than lit by itself.",
    meta: ["03 / 04", "EMISSIVE", "STUDIO C"],
    panels: [
      { label: "SPECIMEN 03 / PROFILE", mode: "side" },
      { label: "SPECIMEN 03 / DETAIL", mode: "detail" },
    ],
    cta: { caption: "One last specimen remains.", label: "Next specimen", action: "next" },
    scene: { opacity: [0, 0, 1, 0], spin: 0.1, rotY: 0, camZ: 5.2, accent: "#f4a3d6" },
  },
  {
    id: "specimen-04",
    pretitle: "// SPECIMEN 04 //",
    latin: "Crystallum flos · reflective",
    title: "Crystal Bloom",
    body: "A crystalline flower with facets that catch the light and throw it back in thin, sharp edges.",
    meta: ["04 / 04", "REFLECTIVE", "STUDIO D"],
    panels: [
      { label: "SPECIMEN 04 / PROFILE", mode: "side" },
      { label: "SPECIMEN 04 / DETAIL", mode: "detail" },
    ],
    cta: { caption: "Back to the first specimen.", label: "Restart", action: "top" },
    scene: { opacity: [0, 0, 0, 1], spin: 0.1, rotY: 0, camZ: 5.2, accent: "#e39a52" },
  },
];
