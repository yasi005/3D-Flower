<p align="center">
  <img src="https://img.shields.io/badge/Neon%20%2F%20Flora-specimen%20archive-1a1a1f?style=for-the-badge&labelColor=090a0f" alt="Neon / Flora" />
</p>

<h1 align="center">🌸 Neon / Flora</h1>

<p align="center">
  <strong>A quiet archive of glowing specimens.</strong><br />
  Scroll through a collection of 3D flowers — less product page, more night museum.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=nextdotjs" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Three.js-0.186-000000?style=flat-square&logo=threedotjs" alt="Three.js" />
  <img src="https://img.shields.io/badge/GSAP-scroll-88CE02?style=flat-square&logo=greensock&logoColor=white" alt="GSAP" />
  <img src="https://img.shields.io/badge/Vercel-ready-000000?style=flat-square&logo=vercel" alt="Vercel" />
</p>

<p align="center">
  <i>One composition. One flower. One scroll at a time.</i>
</p>

---

## ✨ Why this exists

Most 3D demos on the web feel like tech demos first — orbit controls, debug panels, a model dropped in a void.

**Neon / Flora** started from the opposite question:

> What if a flower collection felt like walking a dim gallery at night — champagne light, catalog plates, and the specimen holding the room?

We wanted:

- 🕯 **Atmosphere over UI chrome** — the page should feel like one frame, not a dashboard  
- 🪷 **The model as the hero** — side copy and cards support it, never compete with it  
- 📜 **A story you step through** — each scroll is a new specimen, not a random camera jump  
- 📱 **Phone as a stage too** — smaller type and cards so the bloom still owns the middle  

If it reads like a product landing page, we failed. If it feels like an archive you can hold, we got it right.

---

## 🎭 What you experience

| | |
|:---|:---|
| 🖱 **Scroll / swipe** | Step specimen by specimen — wheel, trackpad, or touch |
| ⌨️ **Keys** | Arrows, page keys, Home / End |
| 🌼 **Bloom transitions** | The current flower folds shut; the next opens from a bud |
| 🌀 **Heavy spin** | Scroll charges a flywheel — it winds up and settles, never snaps |
| 📋 **Archive plates** | Left: catalog copy. Right: profile / detail views + next |

Desktop keeps the full archival layout. On a phone we quiet the plates so the flower stays the focus.

---

## 🛠 How we built it

Not a laundry list — the choices that shaped the feel:

### 🎞 One timeline, not a pile of pages

Chapters live in a single paused GSAP timeline. Scroll doesn’t move the document — it tweens the playhead from specimen to specimen. Copy, cards, accent color, and camera all ride that same beat.

### 🌱 Bloom in the shader

Petals don’t swap meshes. A small world-space warp closes the flower into a bud and opens it again, so transitions feel botanical instead of like a hard cut.

### ⚖️ Layout that respects the flower

The free space between the side plates is measured from the DOM. The camera fits the specimen into that pocket — so when UI gets quieter on mobile, the model naturally grows into the room.

### 🧪 Content as the theme file

Titles, latin names, panels, and scene keys all live in one config. Re-theme the archive without hunting through components.

---

## 🚀 Run it locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — scroll, or use the arrow keys.

```bash
npm run build   # production check
```

---

## ☁️ Ship it

Built as a static Next.js app. No env vars, no backend.

1. Push to GitHub  
2. Import on [Vercel](https://vercel.com/new)  
3. Deploy  

That’s it.

---

## 🙏 Credits

GLB models used under **CC-BY 4.0** — thank you to the artists:

- [“Flower” by olilar](https://sketchfab.com/3d-models/flower-a2eea4c5ba844243ad9484c5b5d2158e)  
- [“flower” by milaha](https://sketchfab.com/3d-models/flower-0fcaca93ce974129ba6188dda6e3b742)  
- [“Strange flower” by ghosted](https://sketchfab.com/3d-models/strange-flower-f687062b820a4d5fb6b01853c7c521b2)  

---

<p align="center">
  <sub>Neon / Flora — made to be scrolled slowly.</sub>
</p>
