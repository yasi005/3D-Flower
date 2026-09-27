import * as THREE from "three";
import { CHAPTERS, type SceneKey } from "./config";

export type AnimState = Omit<SceneKey, "accent"> & {
  accent: THREE.Color;
  /** per model: 0 = closed bud, 1 = fully open (see bloom shader in flowers.ts) */
  bloom: number[];
};

// A single mutable object: the GSAP chapter timeline writes into it and every
// render loop reads from it each frame. Nothing here goes through React state,
// so transitions never trigger re-renders.
const first = CHAPTERS[0].scene;
export const anim: AnimState = {
  ...first,
  // the intro (Experience.tsx) blooms the first flower in
  opacity: first.opacity.map(() => 0),
  bloom: first.opacity.map(() => 0),
  accent: new THREE.Color(first.accent),
};

/**
 * Scroll-driven spin, modelled as a heavy flywheel. Scroll input charges
 * `boost` (a drive speed, rad/s) which bleeds away with SPIN_FRICTION; the
 * flower's `velocity` then follows idle + boost with SPIN_INERTIA lag, so it
 * winds up and settles smoothly instead of jumping to full speed (Scene.tsx).
 */
export const SPIN_FRICTION = 1.8; // 1/s: how fast the drive bleeds off
export const SPIN_INERTIA = 1.8; // 1/s: how quickly the flower follows it (lower = heavier)
const TURN = Math.PI * 2;
// The lag doesn't change the total angle travelled, which stays boost / SPIN_FRICTION,
// so these bounds give a quarter (gentle scroll) to half (hard flick) a turn. With
// friction == inertia the peak speed is only boost / e: ~0.1–0.2 turns/s.
const MIN_KICK = 0.25 * TURN * SPIN_FRICTION;
const MAX_KICK = 0.5 * TURN * SPIN_FRICTION;
/** scroll speed (px/s) that earns the full half turn */
const FAST_SCROLL = 2500;
/** input quieter than this (ms) ends a gesture, so the next one gets a new kick */
const GESTURE_GAP = 400;

/** `angle` is the flower's accumulated rotation; the side cards read it to turn in sync. */
export const spin = { velocity: first.spin, boost: 0, angle: 0 };
let gesture = { time: -Infinity, dir: 0, kick: 0 };

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Spin the flower from a scroll gesture. `scrollVelocity` is signed px/s
 * (negative = scrolling forward). Trackpads fire dozens of events per swipe
 * (plus momentum), so each gesture has a budget of at most MAX_KICK: later
 * events only add the difference if the scroll got faster, never re-charge it.
 */
export function kickSpin(scrollVelocity: number) {
  if (reducedMotion()) return;
  const dir = scrollVelocity <= 0 ? 1 : -1;
  const t = Math.min(1, Math.abs(scrollVelocity) / FAST_SCROLL);
  const kick = MIN_KICK + (MAX_KICK - MIN_KICK) * t;

  const now = performance.now();
  if (now - gesture.time > GESTURE_GAP || dir !== gesture.dir) gesture = { time: now, dir, kick: 0 };
  gesture.time = now;
  const extra = kick - gesture.kick;
  if (extra <= 0) return;
  gesture.kick = kick;

  // reversing drops what's left of the old drive; the flywheel then eases
  // through zero into the new direction rather than flipping instantly
  if (spin.boost * dir < 0) spin.boost = 0;
  spin.boost = dir * Math.min(MAX_KICK, Math.abs(spin.boost) + extra);
}

/**
 * The two page layouts. Must match the `wide` variant in globals.css: side
 * columns on landscape-ish screens, a stacked copy / flower / cards layout on
 * phones and portrait tablets.
 */
export const WIDE_QUERY = "(min-width: 640px) and (min-aspect-ratio: 5/4)";

/**
 * The free area the flower can use, in CSS px, measured from the DOM by
 * Experience.tsx: between the columns on wide screens, between the copy and
 * the card rail when stacked. The camera fits and centres the flower in it.
 */
export const layout = { wide: true, left: 0, right: 0, top: 0, bottom: 0 };
