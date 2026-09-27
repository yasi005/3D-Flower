<p align="center">
  <strong>Neon / Flora</strong>
</p>

<p align="center">
  A quiet archive of glowing specimens.<br />
  Scroll through a collection of 3D flowers — less product page, more night museum.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-090a0f?style=flat-square&labelColor=1a1a1f" alt="Next.js" />
  <img src="https://img.shields.io/badge/Three.js-R3F-090a0f?style=flat-square&labelColor=1a1a1f" alt="Three.js" />
  <img src="https://img.shields.io/badge/GSAP-scroll-090a0f?style=flat-square&labelColor=1a1a1f" alt="GSAP" />
</p>

---

## Why

Most 3D demos on the web feel like tech demos first — orbit controls, debug panels, a model dropped in a void.

Neon / Flora started from the opposite question: *what if a flower collection felt like walking a dim gallery at night?* Champagne light, catalog plates, and the specimen holding the room.

I wanted atmosphere over UI chrome. The model as the hero. A story you step through — each scroll a new specimen, not a random camera jump. On a phone, quieter plates so the bloom still owns the middle.

If it reads like a product landing page, I failed. If it feels like an archive you can hold, I got it right.

---

## The experience

- **Scroll or swipe** — step specimen by specimen  
- **Keys** — arrows, page keys, Home / End  
- **Bloom** — the current flower folds shut; the next opens from a bud  
- **Spin** — scroll charges a flywheel that winds up and settles  
- **Plates** — catalog copy on the left, profile and detail views on the right  

Desktop keeps the full archival layout. Mobile softens it so the flower stays the focus.

---

## How it was built

**One timeline, not a pile of pages.**  
Chapters live in a single paused GSAP timeline. Scroll doesn’t move the document — it tweens the playhead. Copy, cards, accent, and camera ride the same beat.

**Bloom in the shader.**  
Petals don’t swap meshes. A world-space warp closes the flower into a bud and opens it again, so transitions feel botanical instead of like a hard cut.

**Layout that respects the flower.**  
The free space between the side plates is measured from the DOM. The camera fits the specimen into that pocket — when the UI gets quieter, the model grows into the room.

**Content as the theme.**  
Titles, latin names, panels, and scene keys live in one config. Re-theme the archive without hunting through components.

---

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy

Static Next.js app. No env vars, no backend.

Push to GitHub → import on [Vercel](https://vercel.com/new) → deploy.

---

## Credits

Models under **CC-BY 4.0**:

- [Flower by olilar](https://sketchfab.com/3d-models/flower-a2eea4c5ba844243ad9484c5b5d2158e)  
- [flower by milaha](https://sketchfab.com/3d-models/flower-0fcaca93ce974129ba6188dda6e3b742)  
- [Strange flower by ghosted](https://sketchfab.com/3d-models/strange-flower-f687062b820a4d5fb6b01853c7c521b2)  

---

<p align="center">
  <sub>Made to be scrolled slowly.</sub>
</p>
