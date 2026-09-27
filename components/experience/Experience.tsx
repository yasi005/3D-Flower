"use client";

import { memo, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { Preload, useProgress } from "@react-three/drei";
import gsap from "gsap";
import { Observer } from "gsap/Observer";
import { CHAPTERS } from "./config";
import { anim, kickSpin, layout, WIDE_QUERY } from "./state";
import Scene, { TOP_DOWN_FOV } from "./Scene";
import HoloViewport from "./HoloViewport";

gsap.registerPlugin(Observer);

const N = CHAPTERS.length;
const pad = (n: number) => String(n).padStart(2, "0");

const Stage = memo(function Stage() {
  return (
    <Canvas
      style={{ position: "fixed", inset: 0 }}
      dpr={1}
      frameloop="always"
      performance={{ min: 0.5 }}
      camera={{ position: [0, 11, 0], fov: TOP_DOWN_FOV, near: 0.1, far: 100 }}
      // tone mapping is applied once, by the composer's ToneMapping pass
      gl={{ antialias: false, powerPreference: "high-performance", toneMapping: THREE.NoToneMapping, stencil: false }}
    >
      <Suspense fallback={null}>
        <Scene />
        <Preload all />
      </Suspense>
    </Canvas>
  );
});

/**
 * Title as outlined letters in the flower's accent. Keyed by chapter, so each
 * change remounts it and the letters flood with colour then drain to an outline
 * one after another (.title-letter in globals.css).
 */
function OutlineTitle({ text }: { text: string }) {
  let i = 0;
  return (
    <span className="title-outline">
      <span className="sr-only">{text}</span>
      {text.split(" ").map((word, w) => (
        <span key={w} className="title-word" aria-hidden>
          {[...word].map((ch, c) => (
            <span key={c} className="title-letter" style={{ "--i": i++ } as React.CSSProperties}>
              {ch}
            </span>
          ))}
          {" "}
        </span>
      ))}
    </span>
  );
}

const MIN_BOOT_MS = 1600;

function Loader({ realProgress, assetsReady, onDone }: { realProgress: number; assetsReady: boolean; onDone: () => void }) {
  const [fade, setFade] = useState(false);
  const display = useRef(0);
  const started = useRef(0);
  const finished = useRef(false);
  const realRef = useRef(realProgress);
  const readyRef = useRef(assetsReady);
  const numRef = useRef<HTMLParagraphElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const lastShown = useRef(-1);

  useEffect(() => {
    realRef.current = realProgress;
    readyRef.current = assetsReady;
  }, [realProgress, assetsReady]);

  useEffect(() => {
    started.current = performance.now();
    let raf = 0;
    const tick = () => {
      const elapsedMs = performance.now() - started.current;
      const real = realRef.current;
      const ready = readyRef.current;
      // time crawl so the counter never snaps — feels like a real unpack
      const crawl = Math.min(92, (elapsedMs / MIN_BOOT_MS) * 92);
      const fromAssets = Math.min(real * 0.88, 92);
      let target = Math.max(crawl, fromAssets);

      if (ready && elapsedMs >= MIN_BOOT_MS) {
        target = 100;
      } else if (ready) {
        // assets finished early — hold in the high 90s until the minimum beat
        target = Math.min(96, 88 + (elapsedMs / MIN_BOOT_MS) * 8);
      }

      // slow ease — lower = heavier, more “loading”
      display.current += (target - display.current) * 0.06;
      const next = display.current;
      const rounded = Math.min(100, Math.round(next));
      // write the DOM directly — setState every frame was re-rendering the whole page
      if (rounded !== lastShown.current) {
        lastShown.current = rounded;
        if (numRef.current) numRef.current.textContent = pad(rounded);
        if (barRef.current) barRef.current.style.width = `${Math.min(100, next)}%`;
      }

      if (!finished.current && ready && elapsedMs >= MIN_BOOT_MS && next >= 99.2) {
        finished.current = true;
        if (numRef.current) numRef.current.textContent = pad(100);
        if (barRef.current) barRef.current.style.width = "100%";
        setFade(true);
        // lift the curtain; flower is already staged underneath
        window.setTimeout(onDone, 280);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background transition-opacity duration-[480ms] ease-out ${
        fade ? "opacity-0" : "opacity-100"
      }`}
      aria-hidden={fade}
    >
      <p className="text-[10px] uppercase tracking-[0.35em] text-muted">The Collection</p>
      <p ref={numRef} className="font-serif text-6xl font-light italic text-foreground">
        00
      </p>
      <div className="h-px w-32 bg-hairline">
        <div ref={barRef} className="h-full bg-accent/70" style={{ width: "0%" }} />
      </div>
    </div>
  );
}

export default function Experience() {
  const root = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const index = useRef(0);
  // input stays locked until the intro reveal finishes, and during transitions
  const busy = useRef(true);
  const busyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [chapter, setChapter] = useState(0);
  const { progress, active } = useProgress();
  const assetsReady = !active && progress >= 100;
  const [bootDone, setBootDone] = useState(false);
  const onBootDone = useCallback(() => setBootDone(true), []);

  // One paused master timeline: time i = chapter i. Wheel/swipe/keys tween the
  // playhead from one chapter to the next; the page itself never scrolls.
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        paused: true,
        defaults: { ease: "power2.inOut" },
        onUpdate: () => {
          root.current?.style.setProperty("--accent", `#${anim.accent.getHexString()}`);
          if (bar.current) bar.current.style.transform = `scaleX(${tl.time() / (N - 1)})`;
        },
      });

      // 3D keyframes: glide from chapter i to i+1, starting the instant the
      // playhead leaves chapter i (no lead-in gap)
      for (let i = 0; i < N - 1; i++) {
        // opacity is left out: flowers bloom in/out on their own (bloomTo)
        const { accent, camZ, spin, rotY } = CHAPTERS[i + 1].scene;
        const c = new THREE.Color(accent);
        tl.to(anim, { camZ, spin, rotY, duration: 1 }, i);
        tl.to(anim.accent, { r: c.r, g: c.g, b: c.b, duration: 1 }, i);
      }
      tl.to("[data-hint]", { autoAlpha: 0, duration: 0.2 }, 0);
      tl.set({}, {}, N - 1);
      timeline.current = tl;
    }, root);
    return () => ctx.revert();
  }, []);

  // Single copy + CTA plate — content swaps via React state, so layers can never stack.
  const punchText = useCallback(() => {
    const el = root.current;
    if (!el) return;
    const plates = el.querySelectorAll<HTMLElement>("[data-chapter], [data-cta]");
    gsap.killTweensOf(plates);
    gsap.fromTo(
      plates,
      { autoAlpha: 0, y: 22, filter: "blur(6px)" },
      {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 1.1,
        ease: "expo.out",
        delay: 0.18,
        stagger: 0.08,
        overwrite: true,
      },
    );

    const ink = el.querySelector<HTMLElement>("[data-chapter] .copy-rule-ink");
    if (ink) {
      gsap.fromTo(ink, { scaleX: 0 }, { scaleX: 1, duration: 0.9, delay: 0.45, ease: "expo.out", transformOrigin: "left center" });
    }
    const railInk = el.querySelector<HTMLElement>(".rail-rule-ink");
    if (railInk) {
      gsap.fromTo(railInk, { scaleX: 0 }, { scaleX: 1, duration: 0.9, delay: 0.55, ease: "expo.out", transformOrigin: "left center" });
    }
  }, []);
  // Image cards, choreographed against bloomTo's clock: the frame wipes shut
  // (bottom edge rising, like the outgoing copy) while the old flower folds,
  // then at 0.3s — the moment the next bud starts unfurling — the frame opens
  // from below with a slow zoom-out and focus pull, a sheen of light riding the
  // reveal edge. The two cards follow each other by a beat.
  const sweepCards = useCallback((withExit: boolean) => {
    const el = root.current;
    if (!el) return;
    const media = Array.from(el.querySelectorAll<HTMLElement>("[data-card-media]"));
    const sheens = Array.from(el.querySelectorAll<HTMLElement>("[data-card-sheen]"));
    const captions = Array.from(el.querySelectorAll<HTMLElement>("[data-card-caption]"));
    gsap.killTweensOf([...media, ...sheens, ...captions]);

    const OPEN = "inset(0% 0% 0% 0%)";
    const revealAt = withExit ? 0.3 : 0;
    const tl = gsap.timeline();
    if (withExit) {
      tl.to(media, { clipPath: "inset(0% 0% 100% 0%)", scale: 1.04, duration: 0.3, ease: "power2.in", stagger: 0.06 }, 0);
    }
    // the caption text swaps on this frame, so it only ever fades in
    tl.set(captions, { autoAlpha: 0, y: 6 }, 0)
      .fromTo(
        media,
        { clipPath: "inset(100% 0% 0% 0%)", scale: 1.14, filter: "blur(8px)" },
        { clipPath: OPEN, scale: 1, filter: "blur(0px)", duration: 1.4, ease: "expo.out", stagger: 0.08 },
        revealAt,
      )
      .fromTo(
        sheens,
        { yPercent: 100, autoAlpha: 1 },
        { yPercent: -100, duration: 0.9, ease: "power3.out", stagger: 0.08 },
        revealAt,
      )
      .to(sheens, { autoAlpha: 0, duration: 0.4, stagger: 0.08 }, revealAt + 0.5)
      .to(captions, { autoAlpha: 1, y: 0, duration: 0.9, ease: "expo.out", stagger: 0.08 }, revealAt + 0.25);
  }, []);

  // Flower transition: outgoing folds shut into a bud and fades; incoming
  // fades in as a bud then slowly unfurls. The long expo-ish bloom is the show.
  const bloomTo = useCallback((to: number) => {
    gsap.killTweensOf([anim.opacity, anim.bloom]);
    const target = CHAPTERS[to].scene.opacity;
    target.forEach((o, i) => {
      if (o > 0) return;
      gsap.to(anim.bloom, { [i]: 0, duration: 0.8, ease: "power2.in" });
      gsap.to(anim.opacity, { [i]: 0, duration: 0.55, delay: 0.25, ease: "power1.in" });
    });
    // start the incoming flower from a bud unless it was still mid-close
    if (anim.opacity[to] < 0.01) anim.bloom[to] = 0;
    gsap.to(anim.opacity, { [to]: target[to], duration: 0.6, delay: 0.3, ease: "power2.out" });
    gsap.to(anim.bloom, { [to]: 1, duration: 2, delay: 0.3, ease: "power3.out" });
  }, []);

  const goTo = useCallback(
    (target: number) => {
      const tl = timeline.current;
      const i = gsap.utils.clamp(0, N - 1, target);
      if (!tl || busy.current || i === index.current) return;
      busy.current = true;
      if (busyTimer.current) clearTimeout(busyTimer.current);
      const from = index.current;
      const distance = Math.abs(i - from);
      index.current = i;
      // all three fire on the same frame: spin burst, text punch, 3D glide.
      // (wheel/swipe already kicked with its real velocity; this covers keys and
      // buttons, and never lowers a stronger scroll kick)
      kickSpin(i > from ? -1 : 1);
      setChapter(i);
      sweepCards(true);
      bloomTo(i);
      // text punch is ~1.28s; keep input locked until both scene + copy settle
      // so a trackpad burst can't start a new punch over a half-risen layer
      const sceneDur = Math.min(0.7 + (distance - 1) * 0.15, 1.2);
      tl.tweenTo(i, {
        duration: sceneDur,
        // front-loaded so the scene visibly responds on the first frame
        ease: "power3.out",
      });
      // unlock after the scene tween settles
      busyTimer.current = setTimeout(() => {
        busy.current = false;
        busyTimer.current = null;
      }, sceneDur * 1000 + 120);
    },
    [sweepCards, bloomTo],
  );

  // Rise the single copy/CTA plate after React commits the new chapter text —
  // stacking is impossible because only one plate exists.
  const skipPunch = useRef(true);
  useLayoutEffect(() => {
    if (skipPunch.current) {
      skipPunch.current = false;
      return;
    }
    punchText();
  }, [chapter, punchText]);

  // Intro: once the boot curtain lifts, bloom the first flower open — same
  // theatrical path as a chapter change. Runs once.
  const introduced = useRef(false);
  useEffect(() => {
    if (!bootDone) return;
    if (!introduced.current) {
      introduced.current = true;
      bloomTo(index.current);
      // cards open with the first bloom, timed to its 0.3s unfurl
      gsap.delayedCall(0.3, () => sweepCards(false));
      const ink = root.current?.querySelector<HTMLElement>("[data-chapter] .copy-rule-ink");
      if (ink) gsap.fromTo(ink, { scaleX: 0 }, { scaleX: 1, duration: 1, delay: 0.5, ease: "expo.out", transformOrigin: "left center" });
      const railInk = root.current?.querySelector<HTMLElement>(".rail-rule-ink");
      if (railInk) gsap.fromTo(railInk, { scaleX: 0 }, { scaleX: 1, duration: 1, delay: 0.65, ease: "expo.out", transformOrigin: "left center" });
    }
    const unlock = setTimeout(() => (busy.current = false), 300);
    return () => {
      clearTimeout(unlock);
      if (busyTimer.current) clearTimeout(busyTimer.current);
    };
  }, [bootDone, bloomTo, sweepCards]);

  useEffect(() => {
    const observer = Observer.create({
      target: window,
      type: "wheel,touch",
      wheelSpeed: -1,
      tolerance: 6,
      preventDefault: true,
      // every scroll/swipe spins the flower, even mid-transition
      onChange: (self) => kickSpin(self.velocityY || self.deltaY * 60),
      onUp: () => goTo(index.current + 1),
      onDown: () => goTo(index.current - 1),
    });
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowDown", "ArrowRight", "PageDown", " "].includes(e.key)) goTo(index.current + 1);
      else if (["ArrowUp", "ArrowLeft", "PageUp"].includes(e.key)) goTo(index.current - 1);
      else if (e.key === "Home") goTo(0);
      else if (e.key === "End") goTo(N - 1);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      observer.kill();
      window.removeEventListener("keydown", onKey);
    };
  }, [goTo]);

  // Tell the 3D camera where the flower is free to sit: between the columns on
  // wide screens, between the copy and the card rail when stacked.
  useEffect(() => {
    const copy = root.current?.querySelector<HTMLElement>("[data-copy]");
    const rail = root.current?.querySelector<HTMLElement>("[data-rail]");
    if (!copy || !rail) return;
    const wide = window.matchMedia(WIDE_QUERY);
    const measure = () => {
      const c = copy.getBoundingClientRect();
      const r = rail.getBoundingClientRect();
      layout.wide = wide.matches;
      if (layout.wide) {
        Object.assign(layout, { left: c.right, right: r.left, top: 0, bottom: window.innerHeight });
      } else {
        Object.assign(layout, { left: 0, right: window.innerWidth, top: c.bottom, bottom: r.top });
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(copy);
    ro.observe(rail);
    window.addEventListener("resize", measure);
    wide.addEventListener("change", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      wide.removeEventListener("change", measure);
    };
  }, []);

  const current = CHAPTERS[chapter];

  return (
    <div ref={root} className="experience fixed inset-0 overflow-hidden">
      <Stage />
      {/* soft-light wash on top of the WebGL frame — lifts the void without a gold slab */}
      <div className="stage-wash pointer-events-none fixed inset-0 z-[1]" aria-hidden />
      <div className="bg-vignette pointer-events-none fixed inset-0 z-[1]" aria-hidden />
      <Loader realProgress={progress} assetsReady={assetsReady} onDone={onBootDone} />

      {/* ── Masthead ───────────────────────────────────────────────────── */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-20 flex items-baseline justify-between px-5 pb-3 pt-[max(1rem,env(safe-area-inset-top))] wide:px-edge wide:pb-4 wide:py-10 short:py-4">
        <span className="text-[10px] font-normal uppercase tracking-[0.35em] text-foreground/85">
          Neon <span className="text-muted">/</span> Flora
        </span>
        <span className="flex items-baseline gap-2 text-muted">
          <span className="font-serif text-lg italic text-accent wide:text-xl">{pad(chapter + 1)}</span>
          <span className="text-[10px] tracking-[0.25em]">/ {pad(N)}</span>
        </span>
      </header>

      {/* ── Chapter copy: archival specimen plate (left / top) ─────────── */}
      <section
        data-copy
        className="pointer-events-none fixed inset-x-5 top-[calc(env(safe-area-inset-top)+3.75rem)] z-10 max-w-sm wide:inset-x-auto wide:left-edge wide:top-1/2 wide:max-w-none wide:w-[min(22rem,23vw)] wide:-translate-y-1/2"
      >
        <article data-chapter className="copy-plate origin-left will-change-[transform,opacity,filter]">
          <span className="copy-watermark font-serif" aria-hidden>
            {pad(chapter + 1)}
          </span>
          <span className="copy-filament" aria-hidden />
          <span className="copy-corner copy-corner--tl" aria-hidden />
          <span className="copy-corner copy-corner--tr" aria-hidden />
          <span className="copy-corner copy-corner--bl" aria-hidden />
          <span className="copy-corner copy-corner--br" aria-hidden />

          <div className="relative pl-3 wide:pl-6">
            <div className="flex items-baseline gap-3">
              <p className="text-[9px] uppercase tracking-[0.25em] text-muted wide:text-[11px]">{current.pretitle}</p>
              <span className="copy-pulse hidden h-1.5 w-1.5 rounded-full bg-accent/80 wide:block short:hidden" aria-hidden />
            </div>

            <p className="mt-2 font-serif text-[12px] italic tracking-[0.04em] text-accent/75 wide:mt-5 wide:text-[15px] short:mt-1.5 short:text-[11px]">
              {current.latin}
            </p>

            <h2 className="mt-1.5 font-serif text-[1.85rem] font-light leading-[0.98] tracking-[-0.01em] text-foreground wide:mt-3 wide:text-[clamp(2.6rem,3.8vw,4.25rem)] short:mt-1 short:text-[1.7rem]">
              <OutlineTitle key={chapter} text={current.title} />
            </h2>

            <span className="copy-rule mt-3 wide:mt-8 short:mt-2.5" aria-hidden>
              <span className="copy-rule-ink" />
            </span>

            <p className="mt-3 line-clamp-2 max-w-sm text-[12px] font-light leading-[1.6] text-muted wide:mt-5 wide:line-clamp-4 wide:text-[14px] wide:leading-[1.7] short:mt-2 short:line-clamp-2 short:text-[12px]">
              {current.body}
            </p>

            <ul className="mt-6 hidden flex-wrap items-center gap-x-3 gap-y-2 wide:flex short:hidden">
              {current.meta.map((m) => (
                <li key={m} className="copy-chip text-[9px] uppercase tracking-[0.22em] text-muted">
                  {m}
                </li>
              ))}
            </ul>
          </div>
        </article>
      </section>

      {/* ── View plate: archival cards + CTA (right / bottom) ──────────── */}
      <aside
        data-rail
        className="fixed inset-x-5 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-10 wide:inset-x-auto wide:bottom-auto wide:right-edge wide:top-1/2 wide:w-[min(15.5rem,17vw)] wide:-translate-y-1/2"
      >
        <div className="rail-plate mx-auto w-full max-w-[17rem] wide:max-w-none">
          <span className="copy-corner copy-corner--tl" aria-hidden />
          <span className="copy-corner copy-corner--tr" aria-hidden />
          <span className="copy-corner copy-corner--bl" aria-hidden />
          <span className="copy-corner copy-corner--br" aria-hidden />
          <span className="rail-filament" aria-hidden />

          <div className="relative pr-1 wide:pr-5">
            <div className="mb-2.5 hidden items-baseline justify-between gap-2 wide:flex short:hidden">
              <div className="flex items-baseline gap-2.5">
                <p className="text-[9px] uppercase tracking-[0.25em] text-muted">{"// View //"}</p>
                <span className="copy-pulse h-1 w-1 rounded-full bg-accent/80" aria-hidden />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 wide:gap-3">
              {current.panels.map((p, i) => (
                <figure key={i} className="rail-frame">
                  <div className="glass relative aspect-[3/2] w-full overflow-hidden wide:aspect-[4/5] short:aspect-[4/3]">
                    <span className="rail-frame-corner rail-frame-corner--tl" aria-hidden />
                    <span className="rail-frame-corner rail-frame-corner--tr" aria-hidden />
                    <span className="rail-frame-corner rail-frame-corner--bl" aria-hidden />
                    <span className="rail-frame-corner rail-frame-corner--br" aria-hidden />
                    <div data-card-media className="absolute inset-0 will-change-[clip-path,transform,filter]">
                      <HoloViewport mode={p.mode} index={chapter} />
                    </div>
                    <span data-card-sheen className="card-sheen" aria-hidden />
                  </div>
                  <figcaption
                    data-card-caption
                    className="mt-2 hidden items-center gap-2 truncate text-[9px] uppercase tracking-[0.22em] text-muted wide:mt-3 wide:flex short:hidden"
                  >
                    <span className="rail-cap-mark" aria-hidden />
                    {p.label}
                  </figcaption>
                </figure>
              ))}
            </div>

            <span className="copy-rule mt-3 hidden wide:block short:hidden" aria-hidden>
              <span className="copy-rule-ink rail-rule-ink" />
            </span>

            <div className="mt-3 wide:mt-5 short:mt-2.5">
              <div
                data-cta
                className="flex origin-left items-center justify-between gap-4 will-change-[transform,opacity,filter] wide:flex-col wide:items-stretch wide:gap-4"
              >
                <div className="hidden wide:block short:hidden">
                  <p className="text-[9px] uppercase tracking-[0.22em] text-muted">Archive note</p>
                  <p className="mt-1.5 line-clamp-2 font-serif text-[13px] font-light italic leading-snug text-muted">{current.cta.caption}</p>
                </div>
                <button
                  onClick={() => goTo(current.cta.action === "top" ? 0 : chapter + 1)}
                  className="pill flex w-full items-center justify-between gap-6 px-5 py-3 text-[10px] uppercase tracking-[0.25em] short:py-2.5"
                >
                  {current.cta.label}
                  <span className="pill-arrow font-serif text-base leading-none" aria-hidden>
                    {current.cta.action === "top" ? "↺" : "→"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Chapter index ──────────────────────────────────────────────── */}
      <nav aria-label="Chapters" className="fixed bottom-10 left-1/2 z-20 hidden -translate-x-1/2 flex-col items-center gap-4 wide:flex short:hidden">
        <div className="flex items-center gap-10">
          {CHAPTERS.map((c, i) => (
            <button
              key={c.id}
              onClick={() => goTo(i)}
              aria-label={`Go to ${c.title}`}
              aria-current={i === chapter}
              className={`font-serif text-sm italic transition-colors duration-700 ${
                i === chapter ? "text-foreground" : "text-muted/70 hover:text-muted"
              }`}
            >
              {pad(i + 1)}
            </button>
          ))}
        </div>
        <div className="h-px w-40 bg-hairline">
          <div ref={bar} className="h-full w-full origin-left scale-x-0 bg-accent/70" />
        </div>
      </nav>

      <div
        data-hint
        className="pointer-events-none fixed bottom-24 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-3 wide:flex short:hidden"
      >
        <span className="text-[9px] uppercase tracking-[0.35em] text-muted">Scroll</span>
        <span className="hint-line h-10 w-px" />
      </div>

      {/* <p className="fixed bottom-4 right-edge z-10 hidden text-[9px] tracking-[0.15em] text-muted/40 wide:block short:hidden">
        Models (CC-BY 4.0):{" "}
        <a className="transition-colors hover:text-muted" href="https://sketchfab.com/3d-models/flower-a2eea4c5ba844243ad9484c5b5d2158e" target="_blank" rel="noreferrer">
          &ldquo;Flower&rdquo; by olilar
        </a>{" "}
        ·{" "}
        <a className="transition-colors hover:text-muted" href="https://sketchfab.com/3d-models/flower-0fcaca93ce974129ba6188dda6e3b742" target="_blank" rel="noreferrer">
          &ldquo;flower&rdquo; by milaha
        </a>{" "}
        ·{" "}
        <a className="transition-colors hover:text-muted" href="https://sketchfab.com/3d-models/strange-flower-f687062b820a4d5fb6b01853c7c521b2" target="_blank" rel="noreferrer">
          &ldquo;Strange flower&rdquo; by ghosted
        </a>
      </p> */}
    </div>
  );
}
