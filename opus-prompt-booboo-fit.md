# Prompt for Opus — "Booboo Fit" PWA

Copy everything below this line and paste it to Opus (Claude Code or claude.ai):

---

Build a complete, production-ready **PWA (Progressive Web App)** called **"بوبو فت — Booboo Fit"**: a 3-day Push/Pull/Legs workout guide in **Arabic (RTL, Gulf dialect, feminine grammar — addressing a woman)**. It will be hosted on **GitHub Pages** and installed on an iPhone home screen.

## 1. Tech constraints

- **Vanilla HTML/CSS/JS only** — no frameworks, no build step. Static files that work directly on GitHub Pages.
- All paths **relative** (`./assets/...`) so it works under `https://USERNAME.github.io/REPO-NAME/`.
- File structure:
  ```
  /index.html
  /manifest.webmanifest
  /sw.js
  /css/style.css
  /js/app.js
  /icons/  (icon files provided separately — see section 7)
  ```
- Mobile-first (target 390px width), works offline for the app shell.

## 2. Design system (must match exactly)

- Fonts (Google Fonts): headings `Baloo Bhaijaan 2` (700/800), body `IBM Plex Sans Arabic` (400–600).
- Palette:
  - Background `#FFF4F8`, cards `#FFFFFF`, text `#4B2840`, secondary text `#8A6380`
  - Push day (pink): `#E85D9E`, soft `#FFD9EA`, mist `#FFEFF6`, deep `#D1477F`
  - Pull day (lavender): `#9B7FD4`, soft `#EBE2FA`, mist `#F5F0FD`
  - Legs day (peach): `#F4846C`, soft `#FFE3DC`, mist `#FFF1ED`, deep `#D65F45`
  - Accent gold for timing chips: `#F6C25B`
- Style: girly/cute — rounded corners (radius 20–24px), soft pink shadows `rgba(232,93,158,.14)`, ribbon/sparkle emoji accents (🎀💗💜🧡✨🍑), dashed-border tip cards, gradient hero (`#FFDDEC → #F3E6FF → #FFE9E0`).
- Sticky top nav with 3 pill tabs (دفع 💗 / سحب 💜 / أرجل 🧡). Tabs switch views with JS (no page reload).
- Footer on every day view: big gradient text **"Good Luck Booboo"** + "مسوّي بحب خصيصًا لك 💌".

## 3. App structure & features

1. **Home/hero**: title "بوبو فت 🎀", subtitle "برنامجك ٣ أيام — دفع · سحب · أرجل", golden-rule card:
   - قبل التمرين: إحماء حركي ٢–٣ دقايق + ٢–٤ مجموعات خفيفة لأول تمرين مركّب.
   - بعد التمرين: إطالات ثابتة ٣٠–٤٥ ثانية لكل وضعية.
   - قاعدة التدرج: إذا خلّصتي كل العدات بأداء صحيح وباقي ١–٢ عدة بالخزان، زيدي الوزن ٢.٥–٥٪ الجلسة الجاية.
2. **Each day view** has 3 phases in order: 🤸‍♀️ الإحماء قبل التمرين → 💪 التمارين → 🧘‍♀️ الإطالة بعد التمرين.
3. **Exercise card** (same component for warm-up/exercise/stretch):
   - Media area 16:9: animated **GIF** (see section 5) with `loading="lazy"`; behind it an inline **SVG stick-figure illustration** of the movement that shows automatically if the GIF fails (`onerror` hides the img). Never show a broken-image icon.
   - Arabic name (H3) + English name (small, gray)
   - Chips: sets×reps (e.g. `4 × 6–8`) or duration (`30–45 ث`), target muscle
   - 3 short form cues in Gulf Arabic, feminine ("شدي، نزّلي، ادفعي…")
   - Button **▶ شاهدي المقطع** → opens YouTube search link in new tab (`https://www.youtube.com/results?search_query=...`)
4. **Set tracker**: each main exercise gets tappable set-circles (e.g. 4 circles for 4 sets). Tapping fills with a 💗. State saved in `localStorage` per day; a "بدء أسبوع جديد 🔄" button resets. Show a cute progress bar per day ("خلّصتي ١٢ من ١٩ مجموعة 🎉").
5. **Rest timer**: floating button opens a bottom-sheet timer with presets 60 / 90 / 120 ث, big countdown, vibration (`navigator.vibrate`) + soft sound on finish.
6. Completing all sets of a day triggers a small confetti/hearts animation + message "برافو يا بطلة! 💖".

## 4. Program content (exact data — do not change numbers)

### يوم الدفع Push (صدر · أكتاف · ترايسبس)
Warm-up (30–45s each): فتح الصدر وإدخال الإبرة (Thread the Needle ×5/جهة) · تحريك لوحي الكتف (Scapular Protraction & Rollback ×10) · مدّ ولفّ الجذع (Kneeling T-Spine Reach ×5/جهة) · ١٠ ضغط حائط + مجموعتين خفيفتين من أول تمرين.
Exercises:
| Exercise | AR | Sets×Reps |
|---|---|---|
| Chest Press | ضغط صدر | 4 × 6–8 |
| Incline Chest Press | ضغط صدر مائل | 3 × 8–10 |
| Shoulder Press | ضغط أكتاف | 3 × 8–10 |
| Cable Lateral Raise | رفرفة جانبية كيبل | 4 × 12–15 |
| Rope Triceps Pushdown | ترايسبس بالحبل | 3 × 10–12 |
| Overhead Triceps Extension | ترايسبس فوق الرأس | 3 × 12 |

Stretches (30–45s each): الطاولة المعكوسة (Reverse Table Top — صدر/كتف أمامي) · إطالة الكتف والترايسبس (Shoulder & Triceps Stretch لكل ذراع) · tip: إطالة الصدر على إطار الباب.

### يوم السحب Pull (ظهر · كتف خلفي · بايسبس)
Warm-up: القطة والبقرة (Cat-Cow ×8–10) · ضم لوحي الكتف (Scapular Squeeze ×10) · الفراشة بظهر مقوس/ممدود (Butterfly Rounded & Flat Back ×8) · tip: Band Pull-Apart ×15 إن وجد + مجموعتين خفيفتين.
Exercises:
| Exercise | AR | Sets×Reps |
|---|---|---|
| Lat Pulldown | سحب علوي | 4 × 8–10 |
| Chest Supported Row | تجديف بمسند الصدر | 3 × 10 |
| Seated Cable Row | تجديف أرضي كيبل | 3 × 10 |
| Face Pull | سحب للوجه | 3 × 15 |
| Incline Dumbbell Curl | مرجحة مائلة دمبل | 3 × 10 |
| Hammer Curl | مرجحة مطرقية | 3 × 12 |

Stretches: وضعية الجرو (Puppy Dog — لاتس) · وضعية الطفل بالمد الجانبي (Child's Pose Reach) · إطالة الرقبة والترابيس (Trap & Neck) · tip: إطالة البايسبس على الحائط.

### يوم الأرجل Legs (تركيز مؤخرة 🍑)
Warm-up: صباح الخير (Good Mornings ×10) · جسر المؤخرة (Glute Bridge ×15) · سكوات بوزن الجسم ×10 · خطوة سبايدرمان (World's Greatest Stretch ×5/جهة) · تدوير الورك ٩٠/٩٠ ×5/جهة · مجموعتين خفيفتين Hip Thrust.
Exercises:
| Exercise | AR | Sets×Reps |
|---|---|---|
| Hip Thrust | دفع الورك | 4 × 8 |
| Romanian Deadlift | رفعة رومانية | 4 × 8 |
| Leg Press | دفع أرجل | 3 × 10 |
| Bulgarian Split Squat | سكوات بلغاري | 3 × 10 لكل رجل |
| Hip Abductor | مبعدات الورك | 3 × 15 |
| Cable Kickback | ركلة خلفية كيبل | 3 × 15 لكل رجل |
| Standing Calf Raise | رفع السمانة واقفة | 4 × 15 |

Stretches: ثنيات الورك جاثية (Kneeling Hip Flexor) · الخلفية والمؤخرة جالسة (Seated Hamstring & Glute) · الفخذ الأمامي واقفة (Standing Quad) · السمانة على الحائط (Wall Calf) · tip: وضعية الرقم ٤ (Figure-4 Glute) — كلها ٣٠–٤٥ ث لكل جهة.

Write correct, safe form cues for every exercise (3 bullets each, Gulf Arabic feminine). For glute-focus exercises emphasize: دفع بالكعب، عصر المؤخرة ثانية بالأعلى، عدم تقويس أسفل الظهر.

## 5. GIF strategy (important)

**Verified working GIF URLs** — use these exact URLs for warm-ups & stretches (hotlink, do NOT download into the repo; add attribution "الصور المتحركة من Nourish Move Love" in the footer with a link to nourishmovelove.com):

- Thread the Needle: `https://www.nourishmovelove.com/wp-content/uploads/2021/03/Thread-the-needle.gif`
- Scapular Protraction: `https://www.nourishmovelove.com/wp-content/uploads/2021/03/shoulder-blade-protract.gif`
- T-Spine Reach: `https://www.nourishmovelove.com/wp-content/uploads/2021/03/opposite-hand-stretch.gif`
- Cat-Cow: `https://www.nourishmovelove.com/wp-content/uploads/2025/12/cat-cow-stretch-Cool-Down-Stretches.gif`
- Butterfly: `https://www.nourishmovelove.com/wp-content/uploads/2021/03/butterfly.gif`
- Reverse Table Top: `https://www.nourishmovelove.com/wp-content/uploads/2025/12/reverse-table-top-Cool-Down-Stretches.gif`
- Shoulder & Triceps: `https://www.nourishmovelove.com/wp-content/uploads/2025/12/shoulder-and-tricep-stretch-Cool-Down-Stretches.gif`
- Puppy Dog: `https://www.nourishmovelove.com/wp-content/uploads/2025/12/puppy-dog-stretch-Cool-Down-Stretches-routine.gif`
- Child's Pose: `https://www.nourishmovelove.com/wp-content/uploads/2021/03/childs-pose.gif`
- Trap & Neck: `https://www.nourishmovelove.com/wp-content/uploads/2021/03/trap-stretch.gif`
- Good Mornings: `https://www.nourishmovelove.com/wp-content/uploads/2025/09/1-good-morning.gif`
- Glute Bridge: `https://www.nourishmovelove.com/wp-content/uploads/2025/09/9-glute-bridge.gif`
- Squats: `https://www.nourishmovelove.com/wp-content/uploads/2025/09/4-squats.gif`
- Spiderman Step-ins: `https://www.nourishmovelove.com/wp-content/uploads/2025/09/6-spiderman-step-ins.gif`
- 90/90 Hip Rotations: `https://www.nourishmovelove.com/wp-content/uploads/2025/09/8-hip-rotations.gif`
- Kneeling Hip Flexor: `https://www.nourishmovelove.com/wp-content/uploads/2025/12/hip-flexor-stretch-Cool-Down-Stretches.gif`
- Hamstring & Glute: `https://www.nourishmovelove.com/wp-content/uploads/2025/12/quad-stretch-and-glute-stretch.gif`
- Standing Quad: `https://www.nourishmovelove.com/wp-content/uploads/2025/12/quad-stretch-standing-Cool-Down-Stretches.gif`
- Wall Calf: `https://www.nourishmovelove.com/wp-content/uploads/2025/12/standing-calf-stretch-Cool-Down-Stretches.gif`

**For the 19 main gym exercises**: if you have web access, find one GIF per exercise from free exercise-demo sites (e.g. fitnessprogramer.com, inspireusafoundation.org, wger.de) and **verify each URL actually loads (HTTP 200, content-type image/gif) before using it**. If you cannot verify a URL, do NOT guess — rely on the built-in SVG illustration + the YouTube button instead. Every card must include the SVG fallback regardless.

Add `<meta name="referrer" content="no-referrer">` to help hotlinked images load.

## 6. PWA requirements

- `manifest.webmanifest`: `name: "بوبو فت — Booboo Fit"`, `short_name: "بوبو فت"`, `dir: "rtl"`, `lang: "ar"`, `display: "standalone"`, `background_color: "#FFF4F8"`, `theme_color: "#FFDDEC"`, `start_url: "./"`, `scope: "./"`, icons: `./icons/icon-192.png`, `./icons/icon-512.png`, and `./icons/icon-maskable-512.png` with `"purpose": "maskable"`.
- `<link rel="apple-touch-icon" href="./icons/apple-touch-icon.png">`, `<link rel="icon" href="./icons/favicon.ico">` + 32/16 PNG links, `<meta name="apple-mobile-web-app-capable" content="yes">`, `<meta name="apple-mobile-web-app-status-bar-style" content="default">`, `<meta name="theme-color" content="#FFDDEC">`.
- `sw.js`: cache-first for app shell (HTML/CSS/JS/icons/fonts) with a versioned cache name; **stale-while-revalidate** for GIFs; never let a failed GIF break the page. Register with relative path: `navigator.serviceWorker.register('./sw.js')`.
- App must be fully usable offline (shell + SVG illustrations + tracker); GIFs load when online.

## 7. Icons (already provided — do not generate)

The repo will contain these files in `/icons/` (I will add them myself): `icon-1024.png, icon-512.png, icon-192.png, icon-maskable-512.png, apple-touch-icon.png, favicon.ico, favicon-32.png, favicon-16.png`. Reference them exactly as in section 6.

## 8. Deliverables & deployment

1. All source files, complete and runnable.
2. A `README.md` with GitHub Pages deployment steps: create repo → push → Settings ▸ Pages ▸ Deploy from branch (main, /root) → open the URL on iPhone Safari → Share ▸ Add to Home Screen.
3. Test checklist at the end: Lighthouse PWA installable ✓, RTL layout ✓, offline shell ✓, all GIF fallbacks ✓, localStorage tracker persists ✓.

Take your time and make the UI genuinely beautiful and cohesive — this is a gift from a husband to his wife. 💗

---
