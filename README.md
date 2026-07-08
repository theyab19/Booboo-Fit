# بوبو فت — Booboo Fit 🎀

A cute, girly **Progressive Web App**: a 3-day **Push / Pull / Legs** workout guide in
Arabic (RTL, Gulf dialect, feminine grammar). Built with **vanilla HTML / CSS / JS** — no
frameworks, no build step. Made to be hosted on **GitHub Pages** and installed on an
iPhone home screen. 💗

---

## ✨ Features

- **3 day tabs** — دفع 💗 · سحب 💜 · أرجل 🧡 — switch views with no page reload.
- Each day has **3 phases**: 🤸‍♀️ إحماء → 💪 تمارين → 🧘‍♀️ إطالة.
- **Exercise cards** with animated GIF demos; every card has an **inline SVG stick-figure
  fallback** that shows automatically if the GIF fails or you're offline (never a broken image).
- **Set tracker** — tap the circles as you finish each set; progress is saved in
  `localStorage` per day, with a cute progress bar. "بدء أسبوع جديد 🔄" resets a day.
- **Rest timer** — floating button opens a bottom sheet with 60 / 90 / 120 s presets,
  big countdown, vibration + a soft chime on finish.
- Finishing all sets of a day triggers a **hearts/confetti** celebration 🎉.
- Fully installable, works **offline** (app shell + illustrations + tracker); GIFs load online.

---

## 📁 Structure

```
/index.html            App shell (RTL, meta, PWA links)
/manifest.webmanifest  PWA manifest
/sw.js                 Service worker (offline caching)
/css/style.css         Design system
/js/app.js             Program data, rendering, tracker, timer, celebration
/icons/                App icons + favicons
/README.md
```

All asset paths are **relative** (`./…`) so it works under
`https://USERNAME.github.io/REPO-NAME/`.

---

## 🚀 Deploy to GitHub Pages

1. **Create a repo** on GitHub (e.g. `booboo-fit`).
2. **Push these files** to the `main` branch:
   ```bash
   git init
   git add .
   git commit -m "Booboo Fit PWA 🎀"
   git branch -M main
   git remote add origin https://github.com/USERNAME/booboo-fit.git
   git push -u origin main
   ```
3. On GitHub: **Settings ▸ Pages ▸ Build and deployment**
   → Source: **Deploy from a branch** → Branch: **main** / **/(root)** → **Save**.
4. Wait ~1 minute, then open the published URL:
   `https://USERNAME.github.io/booboo-fit/`

### 📱 Install on iPhone
Open the URL in **Safari** → tap **Share** ⬆️ → **Add to Home Screen** → **Add**.
It launches full-screen like a native app.

> Runs from any static host too — or locally: `python -m http.server` then open
> `http://localhost:8000` (a plain `file://` open won't register the service worker).

---

## ✅ Test checklist

- [ ] **Lighthouse → PWA installable** ✓ (manifest + service worker + icons)
- [ ] **RTL layout** renders correctly ✓
- [ ] **Offline** — turn on airplane mode; the shell, SVG illustrations and tracker still work ✓
- [ ] **GIF fallbacks** — block images / go offline; every card shows its SVG figure, no broken icons ✓
- [ ] **localStorage tracker** persists after refresh; "بدء أسبوع جديد" resets a day ✓
- [ ] **Rest timer** counts down, vibrates + chimes on finish ✓
- [ ] Completing all sets of a day shows the hearts celebration ✓

---

Made with love — *Good Luck Booboo* 💌
