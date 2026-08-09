/* ==========================================================================
   بوبو فت — Booboo Fit · UI (dark, bottom-nav app)
   Screens: home · workout (list → exercise detail) · progress · account
   Data + helpers come from window.BF; storage/sync from window.Store.
   ========================================================================== */
(function () {
  'use strict';
  var BF = window.BF, S = window.Store;
  var PROGRAM = BF.PROGRAM, DAYS = BF.DAYS, PHASE = BF.PHASE;
  var icon = BF.icon, illuSvg = BF.illuSvg, toAr = BF.toAr, parseNum = BF.parseNum;

  var DAY_META = {
    chest:  { short: 'صدر',   color: '#8E7BFF' },
    quads:  { short: 'أمامي', color: '#FF7A45' },
    back:   { short: 'ظهر',   color: '#38C6FF' },
    glutes: { short: 'خلفي',  color: '#FF4D93' }
  };
  var LIST = { warmup: 'warmup', exercise: 'exercises', stretch: 'stretches' };
  var WD = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س']; // Sun..Sat

  var lsGet = function (k, fb) { try { var v = localStorage.getItem(k); return v == null ? fb : v; } catch (_) { return fb; } };
  var lsSet = function (k, v) { try { localStorage.setItem(k, v); } catch (_) {} };
  var name = lsGet('bf:name', '');
  var restDefault = parseInt(lsGet('bf:rest', '90'), 10) || 90;

  var exListOf = function (day) { return PROGRAM[day].exercises.map(function (e) { return { ex: e.en, sets: e.sets }; }); };
  var dayTotals = function (day) { return S.progress(day, exListOf(day)); };
  var ytLink = function (en) { return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(en + ' exercise proper form'); };
  var greeting = function () { var h = new Date().getHours(); return h < 12 ? 'صباح الخير' : 'مساء الخير'; };
  var fmtVol = function (v) { v = Math.round(v); return v >= 1000 ? toAr((v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)) + ' طن' : toAr(v); };
  var chev = function (dir) {
    var d = dir === 'back' ? 'M9 6l6 6-6 6' : 'M15 6l-6 6 6 6';
    return '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="' + d + '"/></svg>';
  };

  /* ---------------- state ---------------- */
  var screen = 'home';
  var curDay = 'chest';
  var ex = { day: 'chest', phase: 'exercise', i: 0, open: false };

  var screenEl = document.getElementById('screen');
  var exScreen = document.getElementById('exScreen');
  var navBtns = [].slice.call(document.querySelectorAll('.navbtn'));
  var themeMeta = document.querySelector('meta[name=theme-color]');

  function go(name, day) {
    screen = name;
    if (day) curDay = day;
    navBtns.forEach(function (b) { var on = b.dataset.nav === name; b.classList.toggle('is-active', on); b.setAttribute('aria-selected', on); });
    render();
    screenEl.scrollTop = 0;
  }
  function render() {
    screenEl.innerHTML = screen === 'home' ? homeHTML()
      : screen === 'workout' ? workoutHTML()
      : screen === 'progress' ? progressHTML()
      : accountHTML();
  }
  function softRerender() {
    var a = document.activeElement;
    if (a && a.classList && (a.classList.contains('lr__in') || a.tagName === 'INPUT')) return;
    render();
    if (ex.open) exScreen.innerHTML = exScreenHTML();
  }

  /* ==========================================================================
     HOME
     ========================================================================== */
  function statTile(ic, label, val, unit, tone) {
    return '<div class="stile stile--' + tone + '"><div class="stile__ic">' + icon(ic) + '</div>' +
      '<div class="stile__k">' + label + '</div><div class="stile__v">' + val + ' <span>' + unit + '</span></div></div>';
  }
  function barsHTML(vals, labels, todayIdx) {
    var max = Math.max.apply(null, vals.concat([1]));
    return vals.map(function (v, i) {
      var h = v > 0 ? Math.max(8, Math.round(v / max * 100)) : 3;
      var t = (i === todayIdx) ? ' is-today' : '';
      return '<div class="wb"><div class="wb__track"><div class="wb__fill' + t + '" style="height:' + h + '%"></div></div>' +
        '<span class="wb__lbl' + t + '">' + labels[i] + '</span></div>';
    }).join('');
  }
  function homeHTML() {
    DAYS.forEach(function (d) { S.rollIfNewWeek(d); });
    var ws = S.weekStats();
    var goal = 4;
    var pct = Math.min(100, Math.round(ws.days / goal * 100));
    var useSets = ws.perVol.every(function (v) { return v === 0; });
    var vals = (useSets ? ws.perSets : ws.perVol).slice();
    var bars = barsHTML(vals, WD, new Date().getDay());

    var dayCards = DAYS.map(function (d) {
      var m = DAY_META[d], dt = S.dayDoneThisWeek(d, exListOf(d));
      var p = dt.total ? Math.round(dt.done / dt.total * 100) : 0;
      return '<button class="daycard" data-goday="' + d + '" style="--c:' + m.color + '">' +
        '<div class="daycard__top"><span class="daycard__dot"></span><span class="daycard__pct">' + toAr(p) + '%</span></div>' +
        '<div class="daycard__name">' + PROGRAM[d].title.replace('اليوم ', '') + '</div>' +
        '<div class="daycard__sub">' + PROGRAM[d].sub + '</div>' +
        '<div class="minibar"><i style="width:' + p + '%;background:' + m.color + '"></i></div></button>';
    }).join('');

    return '<header class="topbar">' +
        '<div><div class="topbar__hi">' + greeting() + '</div><div class="topbar__name">' + (name || 'يا بطلة') + '</div></div>' +
        '<button class="avatar" data-nav="account" aria-label="حسابي">' + (name ? name.trim().charAt(0) : 'ب') + '</button></header>' +
      '<section class="herocard">' +
        '<div class="herocard__l"><div class="herocard__k">تمارين هذا الأسبوع</div>' +
          '<div class="herocard__v">' + toAr(ws.days) + ' <span>من ٤ أيام</span></div>' +
          '<button class="btn btn--onaccent" data-nav="workout">' + icon('play') + '<span>ابدئي التمرين</span></button></div>' +
        '<div class="ring" style="--p:' + pct + '"><div class="ring__in">' + toAr(pct) + '<i>%</i></div></div></section>' +
      '<div class="stat2">' +
        statTile('star', 'أيام متتالية', toAr(S.streak()), 'يوم', 'v') +
        statTile('chart', 'حجم الأسبوع', fmtVol(ws.volume), 'كجم', 'g') +
        statTile('dumbbell', 'مجموعات الأسبوع', toAr(ws.sets), 'مجموعة', 'b') +
        statTile('trend', 'إجمالي الحجم', fmtVol(S.totalVolume()), 'كجم', 'p') + '</div>' +
      '<section class="panel"><div class="panel__head"><span>هذا الأسبوع</span><small>' + (useSets ? 'مجموعات' : 'كجم') + ' باليوم</small></div>' +
        '<div class="weekbars">' + bars + '</div></section>' +
      '<div class="sec-head"><span>أيامك</span><button class="linkbtn" data-nav="workout">الكل</button></div>' +
      '<div class="daygrid">' + dayCards + '</div><div class="botpad"></div>';
  }

  /* ==========================================================================
     WORKOUT (list) + exercise detail
     ========================================================================== */
  function exrowHTML(day, phase, i, it) {
    var media = it.gif ? '<img class="exrow__img" src="' + it.gif + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">' : '';
    var meta, state;
    if (phase === 'exercise') {
      var done = 0; for (var s = 0; s < it.sets; s++) { if (S.get(day, it.en, s).done) done++; }
      var full = done >= it.sets;
      meta = toAr(it.sets) + ' × ' + it.reps + ' · ' + it.muscle;
      state = '<span class="exrow__state' + (full ? ' is-done' : (done ? ' is-part' : '')) + '">' + (full ? icon('check') : toAr(done) + '/' + toAr(it.sets)) + '</span>';
    } else {
      meta = it.reps + ' · ' + it.en;
      state = '<span class="exrow__state exrow__state--ghost">' + it.reps + '</span>';
    }
    return '<button class="exrow" data-open="' + day + '|' + phase + '|' + i + '">' +
      '<span class="exrow__media">' + illuSvg(it.illu) + media + '</span>' +
      '<span class="exrow__main"><span class="exrow__name">' + it.ar + '</span><span class="exrow__meta">' + meta + '</span></span>' +
      state + '<span class="exrow__chev">' + chev() + '</span></button>';
  }
  function grpHTML(day, phase, items) {
    var p = PHASE[phase];
    return '<div class="grp"><div class="grp__head">' + icon(p.icon) + '<span>' + p.head + '</span><small>' + toAr(items.length) + '</small></div>' +
      items.map(function (it, i) { return exrowHTML(day, phase, i, it); }).join('') + '</div>';
  }
  function workoutHTML() {
    var d = curDay; S.rollIfNewWeek(d);
    var m = DAY_META[d], dt = dayTotals(d);
    var pct = dt.total ? Math.round(dt.done / dt.total * 100) : 0;
    var pills = DAYS.map(function (x) {
      return '<button class="pill' + (x === d ? ' is-active' : '') + '" data-day="' + x + '" style="--c:' + DAY_META[x].color + '">' + DAY_META[x].short + '</button>';
    }).join('');
    return '<header class="screen-head"><h1>التمرين</h1></header>' +
      '<div class="pills">' + pills + '</div>' +
      '<section class="dayhero" style="--c:' + m.color + '"><div class="dayhero__name">' + PROGRAM[d].title + '</div>' +
        '<div class="dayhero__sub">' + PROGRAM[d].sub + '</div>' +
        '<div class="dayhero__row"><div class="dayhero__bar"><i style="width:' + pct + '%"></i></div><span>' + toAr(dt.done) + '/' + toAr(dt.total) + ' مجموعة</span></div></section>' +
      grpHTML(d, 'warmup', PROGRAM[d].warmup) +
      grpHTML(d, 'exercise', PROGRAM[d].exercises) +
      grpHTML(d, 'stretch', PROGRAM[d].stretches) + '<div class="botpad"></div>';
  }

  function daySeq(day) {
    var seq = [];
    ['warmup', 'exercise', 'stretch'].forEach(function (ph) { PROGRAM[day][LIST[ph]].forEach(function (_, i) { seq.push({ phase: ph, i: i }); }); });
    return seq;
  }
  function logHTML(day, it) {
    var exn = it.en, rows = '';
    for (var s = 0; s < it.sets; s++) {
      var cur = S.get(day, exn, s), last = S.last(day, exn, s);
      var wVal = cur.weight == null ? '' : toAr(cur.weight), rVal = cur.reps == null ? '' : toAr(cur.reps);
      var lastLine = last ? '<div class="lr__last">' + icon('reset') + ' آخر أسبوع · <b>' + (last.weight == null ? '—' : toAr(last.weight)) + '</b> كجم × <b>' + (last.reps == null ? '—' : toAr(last.reps)) + '</b></div>' : '';
      rows += '<div class="lset"><div class="lr" data-day="' + day + '" data-ex="' + exn + '" data-set="' + s + '">' +
        '<span class="lr__n">' + toAr(s + 1) + '</span>' +
        '<span class="lr__f"><input class="lr__in" data-field="weight" type="text" inputmode="decimal" enterkeyhint="next" autocomplete="off" placeholder="الوزن" value="' + wVal + '"><span class="lr__u">كجم</span></span>' +
        '<span class="lr__x">×</span>' +
        '<span class="lr__f lr__f--r"><input class="lr__in" data-field="reps" type="text" inputmode="numeric" enterkeyhint="done" autocomplete="off" placeholder="عدات" value="' + rVal + '"></span>' +
        '<button class="lr__done' + (cur.done ? ' is-done' : '') + '" type="button" aria-pressed="' + cur.done + '">' + (cur.done ? icon('check') : '') + '</button></div>' + lastLine + '</div>';
    }
    return '<div class="logwrap"><div class="logwrap__head"><span>وزنك وعداتك</span><small>الرمادي = آخر أسبوع</small></div>' + rows + '</div>';
  }
  function exScreenHTML() {
    var day = ex.day, ph = ex.phase, i = ex.i;
    var arr = PROGRAM[day][LIST[ph]], it = arr[i], m = DAY_META[day], isMain = ph === 'exercise';
    var seq = daySeq(day);
    var pos = 0; for (var k = 0; k < seq.length; k++) { if (seq[k].phase === ph && seq[k].i === i) { pos = k; break; } }
    var hasNext = pos < seq.length - 1, hasPrev = pos > 0;
    var chips = isMain
      ? '<span class="chip chip--accent">' + toAr(it.sets) + ' × ' + it.reps + '</span><span class="chip">' + it.muscle + '</span>'
      : '<span class="chip chip--accent">' + it.reps + '</span><span class="chip">' + PHASE[ph].tag + '</span>';
    var media = it.gif ? '<img class="exmedia__img" src="' + it.gif + '" alt="' + it.ar + '" referrerpolicy="no-referrer" onerror="this.remove()">' : '';
    return '<div class="exsc" style="--c:' + m.color + '">' +
      '<div class="exsc__bar"><button class="iconbtn" id="exBack" aria-label="رجوع">' + chev('back') + '</button>' +
        '<div class="exsc__ttl"><b>' + it.ar + '</b><span>' + it.en + '</span></div>' +
        (isMain ? '<button class="iconbtn" data-hist="' + day + '|' + it.en + '|' + it.ar + '" aria-label="السجل">' + icon('chart') + '</button>' : '<span class="iconbtn iconbtn--sp"></span>') + '</div>' +
      '<div class="exsc__scroll">' +
        '<div class="exmedia">' + illuSvg(it.illu) + media + '</div>' +
        '<div class="chips">' + chips + '</div>' +
        '<div class="cuesbox"><div class="cuesbox__h">' + icon('bulb') + '<span>طريقة الأداء</span></div>' +
          '<ul class="cues">' + it.cues.map(function (c) { return '<li>' + c + '</li>'; }).join('') + '</ul></div>' +
        (isMain ? logHTML(day, it) : '') +
        '<a class="watch" href="' + ytLink(it.en) + '" target="_blank" rel="noopener">' + icon('play') + '<span>شاهدي المقطع على يوتيوب</span></a>' +
        '<div class="botpad"></div></div>' +
      '<div class="exsc__nav">' +
        '<button class="exnav__side" id="exPrev"' + (hasPrev ? '' : ' disabled') + '>' + chev('back') + '<span>السابق</span></button>' +
        '<button class="exnav__rest" id="exRest">' + icon('clock') + '<span>راحة</span></button>' +
        '<button class="exnav__side exnav__next" id="exNext"><span>' + (hasNext ? 'التالي' : 'خلّصنا') + '</span>' + chev() + '</button></div></div>';
  }
  function openExercise(day, phase, i) {
    S.rollIfNewWeek(day);
    ex = { day: day, phase: phase, i: i, open: true };
    exScreen.innerHTML = exScreenHTML();
    exScreen.hidden = false;
    requestAnimationFrame(function () { exScreen.classList.add('is-in'); });
    document.body.classList.add('noscroll');
  }
  function closeExercise() {
    ex.open = false;
    exScreen.classList.remove('is-in');
    document.body.classList.remove('noscroll');
    setTimeout(function () { if (!ex.open) { exScreen.hidden = true; exScreen.innerHTML = ''; } }, 240);
    if (screen === 'workout') render();
  }
  function stepExercise(delta) {
    var seq = daySeq(ex.day), pos = 0;
    for (var k = 0; k < seq.length; k++) { if (seq[k].phase === ex.phase && seq[k].i === ex.i) { pos = k; break; } }
    var np = pos + delta;
    if (np < 0) return;
    if (np >= seq.length) { closeExercise(); return; }
    ex.phase = seq[np].phase; ex.i = seq[np].i;
    exScreen.innerHTML = exScreenHTML();
    exScreen.querySelector('.exsc__scroll').scrollTop = 0;
  }

  /* ==========================================================================
     PROGRESS
     ========================================================================== */
  function sparkline(vals) {
    if (!vals.length) return '';
    if (vals.length < 2) return '<svg class="spark" viewBox="0 0 100 34" preserveAspectRatio="none"><line x1="0" y1="17" x2="100" y2="17" stroke="var(--c)" stroke-width="2.5" opacity=".55"/></svg>';
    var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals), rng = (mx - mn) || 1;
    var pts = vals.map(function (v, i) { return (i / (vals.length - 1) * 100).toFixed(1) + ',' + (31 - (v - mn) / rng * 28).toFixed(1); }).join(' ');
    var lastY = (31 - (vals[vals.length - 1] - mn) / rng * 28).toFixed(1);
    return '<svg class="spark" viewBox="0 0 100 34" preserveAspectRatio="none"><polyline points="' + pts + '" fill="none" stroke="var(--c)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="100" cy="' + lastY + '" r="3" fill="var(--c)"/></svg>';
  }
  function progressHTML() {
    DAYS.forEach(function (d) { S.rollIfNewWeek(d); });
    var weeks = S.recentWeeksVolume(8);
    var vals = weeks.map(function (w) { return w.volume; });
    var labels = weeks.map(function (w, i) { return i === weeks.length - 1 ? 'الآن' : toAr(weeks.length - 1 - i); });
    var bars = barsHTML(vals, labels, weeks.length - 1);

    var exItems = '';
    DAYS.forEach(function (d) {
      PROGRAM[d].exercises.forEach(function (it) {
        var ser = S.series(d, it.en); if (!ser.length) return;
        exItems += '<button class="prow" data-hist="' + d + '|' + it.en + '|' + it.ar + '" style="--c:' + DAY_META[d].color + '">' +
          '<span class="prow__main"><span class="prow__name">' + it.ar + '</span><span class="prow__pr">أعلى وزن ' + toAr(S.pr(d, it.en)) + ' كجم</span></span>' +
          '<span class="prow__spark">' + sparkline(ser.map(function (p) { return p.weight; })) + '</span>' +
          '<span class="exrow__chev">' + chev() + '</span></button>';
      });
    });
    var body = exItems
      ? '<div class="sec-head"><span>تقدّم التمارين</span></div><div class="prows">' + exItems + '</div>'
      : '<div class="empty">سجّلي أوزانك في التمرين، وبيبين تقدّمك هنا أسبوع بعد أسبوع.</div>';

    return '<header class="screen-head"><h1>تقدّمي</h1></header>' +
      '<section class="panel"><div class="panel__head"><span>الحجم الأسبوعي</span><small>كجم مرفوعة</small></div>' +
        '<div class="weekbars weekbars--wide">' + bars + '</div></section>' + body + '<div class="botpad"></div>';
  }

  /* ==========================================================================
     ACCOUNT
     ========================================================================== */
  var syncText = function () { return ({ syncing: 'يحفظ…', offline: 'غير متصل — بيتزامن لاحقًا', synced: 'محفوظ بالسحابة' })[S.status()] || 'محلي على الجهاز'; };
  function accountHTML() {
    var authed = S.isAuthed();
    var cloud = !S.cloudEnabled ? '' :
      '<section class="card"><div class="card__h">' + icon('cloud') + '<span>المزامنة السحابية</span></div>' +
      (authed
        ? '<div class="acc-row"><div class="acc-row__l"><div class="acc-row__k">مسجّلة الدخول</div><div class="acc-row__v" dir="ltr">' + (S.user().email || '') + '</div></div>' +
          '<button class="btn btn--ghost" id="accLogout">خروج</button></div><div class="acc-note">' + syncText() + '</div>'
        : '<p class="acc-note">سجّلي الدخول عشان يتحفظ وزنك وعداتك بالسحابة وما يروح أبدًا، وتشوفينه على أي جهاز.</p>' +
          '<button class="btn btn--primary btn--full" id="accLogin">تسجيل الدخول</button>') + '</section>';
    var nameCard = '<section class="card"><div class="card__h">' + icon('star') + '<span>اسمك</span></div>' +
      '<input id="accName" class="field" type="text" placeholder="بوبو" value="' + (name || '') + '" enterkeyhint="done"><div class="acc-note">يظهر بالترحيب على الرئيسية</div></section>';
    var restChips = [60, 90, 120].map(function (s) { return '<button class="chip-btn' + (s === restDefault ? ' is-active' : '') + '" data-rest="' + s + '">' + toAr(s) + ' ث</button>'; }).join('');
    var restCard = '<section class="card"><div class="card__h">' + icon('clock') + '<span>مدة الراحة الافتراضية</span></div><div class="chiprow">' + restChips + '</div></section>';
    var about = '<section class="card"><div class="card__h">' + icon('heart') + '<span>عن التطبيق</span></div>' +
      '<p class="acc-note">الصور المتحركة من Nourish Move Love و Fitness Programer.<br>مسوّي بحب خصيصًا لك.</p></section>';
    return '<header class="screen-head"><h1>حسابي</h1></header>' + cloud + nameCard + restCard + about + '<div class="botpad"></div>';
  }

  /* ==========================================================================
     Rest timer
     ========================================================================== */
  var sheet = document.getElementById('timerSheet'), sheetOv = document.getElementById('sheetOverlay');
  var tDisp = document.getElementById('timerDisplay'), tToggle = document.getElementById('timerToggle'), tReset = document.getElementById('timerReset');
  var presets = [].slice.call(document.querySelectorAll('.timer__presets .chip-btn'));
  var selected = restDefault, remaining = restDefault, ticking = null, audioCtx = null;
  var fmt = function (s) { return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
  var drawTimer = function () { tDisp.textContent = fmt(remaining); };
  var setToggle = function (run) { tToggle.innerHTML = run ? icon('pause') + '<span>إيقاف</span>' : icon('play') + '<span>ابدئي</span>'; };
  function beep() {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      var now = audioCtx.currentTime;
      [0, 0.22, 0.44].forEach(function (t, i) {
        var o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.type = 'sine'; o.frequency.value = 660 + i * 220;
        g.gain.setValueAtTime(0.0001, now + t); g.gain.exponentialRampToValueAtTime(0.25, now + t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.2);
        o.connect(g).connect(audioCtx.destination); o.start(now + t); o.stop(now + t + 0.22);
      });
    } catch (_) {}
  }
  function stopT() { if (ticking) { clearInterval(ticking); ticking = null; } setToggle(false); }
  function finishT() { stopT(); remaining = selected; drawTimer(); tDisp.classList.add('is-done'); setTimeout(function () { tDisp.classList.remove('is-done'); }, 1800); if (navigator.vibrate) navigator.vibrate([120, 60, 120, 60, 240]); beep(); }
  function startT() { if (remaining <= 0) remaining = selected; setToggle(true); try { if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); } catch (_) {} ticking = setInterval(function () { remaining -= 1; drawTimer(); if (remaining <= 0) finishT(); }, 1000); }
  function openTimer() { selected = restDefault; remaining = restDefault; presets.forEach(function (p) { p.classList.toggle('is-active', +p.dataset.seconds === selected); }); drawTimer(); setToggle(false); sheet.hidden = false; sheetOv.hidden = false; }
  function closeTimer() { stopT(); sheet.hidden = true; sheetOv.hidden = true; }
  presets.forEach(function (p) { p.addEventListener('click', function () { presets.forEach(function (x) { x.classList.remove('is-active'); }); p.classList.add('is-active'); selected = +p.dataset.seconds; stopT(); remaining = selected; drawTimer(); }); });
  tToggle.addEventListener('click', function () { ticking ? stopT() : startT(); });
  tReset.addEventListener('click', function () { stopT(); remaining = selected; drawTimer(); });
  document.getElementById('sheetClose').addEventListener('click', closeTimer);
  sheetOv.addEventListener('click', closeTimer);
  setToggle(false); drawTimer();

  /* ==========================================================================
     Login modal
     ========================================================================== */
  var loginSheet = document.getElementById('loginSheet'), loginOv = document.getElementById('loginOverlay');
  var loginForm = document.getElementById('loginForm'), loginEmail = document.getElementById('loginEmail'), loginPass = document.getElementById('loginPass');
  var loginError = document.getElementById('loginError'), loginSubmit = document.getElementById('loginSubmit'), loginToggle = document.getElementById('loginToggle'), loginTitle = document.getElementById('loginTitle');
  var signupMode = false;
  function setSignup(on) { signupMode = on; loginTitle.textContent = on ? 'حساب جديد' : 'تسجيل الدخول'; loginSubmit.textContent = on ? 'إنشاء الحساب' : 'دخول'; loginToggle.textContent = on ? 'عندك حساب؟ سجّلي الدخول' : 'ما عندك حساب؟ أنشئي واحد'; }
  function openLogin() { loginError.textContent = ''; loginSheet.hidden = false; loginOv.hidden = false; setTimeout(function () { loginEmail.focus(); }, 60); }
  function closeLogin() { loginSheet.hidden = true; loginOv.hidden = true; }
  loginOv.addEventListener('click', closeLogin);
  document.getElementById('loginClose').addEventListener('click', closeLogin);
  loginToggle.addEventListener('click', function () { setSignup(!signupMode); });
  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = (loginEmail.value || '').trim(), pass = loginPass.value || '';
    if (!email || pass.length < 6) { loginError.textContent = 'اكتبي إيميل وكلمة مرور ٦ حروف على الأقل'; return; }
    loginError.textContent = ''; loginSubmit.disabled = true; loginSubmit.textContent = 'لحظة…';
    (signupMode ? S.signup(email, pass) : S.login(email, pass))
      .then(function () { closeLogin(); render(); })
      .catch(function (err) { loginError.textContent = err.message || 'تعذّر تسجيل الدخول'; })
      .then(function () { loginSubmit.disabled = false; setSignup(signupMode); });
  });
  setSignup(false);

  /* ==========================================================================
     History modal
     ========================================================================== */
  var historySheet = document.getElementById('historySheet'), historyOv = document.getElementById('historyOverlay');
  var historyTitle = document.getElementById('historyTitle'), historyBody = document.getElementById('historyBody');
  function openHistory(day, exn, nm) {
    var hist = S.history(day, exn), ser = S.series(day, exn), pr = S.pr(day, exn);
    historyTitle.textContent = 'سجل · ' + nm;
    var top = ser.length ? '<div class="histtop" style="--c:' + DAY_META[day].color + '"><div class="histtop__pr"><small>أعلى وزن</small><b>' + toAr(pr) + ' كجم</b></div><div class="histtop__spark">' + sparkline(ser.map(function (p) { return p.weight; })) + '</div></div>' : '';
    if (!hist.length) { historyBody.innerHTML = '<p class="empty">ما فيه سجل بعد.<br>سجّلي وزنك وعداتك، وأول ما تبدئين أسبوع جديد بيتخزّن هنا.</p>'; }
    else {
      historyBody.innerHTML = top + hist.map(function (wk) {
        var idxs = Object.keys(wk.sets).map(Number).sort(function (a, b) { return a - b; });
        var chips = idxs.map(function (si) { var v = wk.sets[si]; return '<span class="hset' + (v.done ? ' is-done' : '') + '"><b>' + (v.weight == null ? '—' : toAr(v.weight)) + '</b> كجم × <b>' + (v.reps == null ? '—' : toAr(v.reps)) + '</b></span>'; }).join('');
        return '<div class="hweek"><div class="hweek__k">الأسبوع ' + toAr(wk.week) + '</div><div class="hweek__s">' + chips + '</div></div>';
      }).join('');
    }
    historySheet.hidden = false; historyOv.hidden = false;
  }
  function closeHistory() { historySheet.hidden = true; historyOv.hidden = true; }
  historyOv.addEventListener('click', closeHistory);
  document.getElementById('historyClose').addEventListener('click', closeHistory);

  /* ==========================================================================
     Celebration
     ========================================================================== */
  var celebrateLayer = document.getElementById('celebrate');
  var CONFETTI = ['#8E7BFF', '#FF7A45', '#38C6FF', '#FF4D93', '#3DDC97', '#FFD166'];
  function celebrate(msg) {
    for (var i = 0; i < 42; i++) {
      var s = document.createElement('span'); s.className = 'confetti';
      var sz = 8 + Math.random() * 8;
      s.style.width = sz + 'px'; s.style.height = sz + 'px';
      s.style.left = Math.random() * 100 + 'vw';
      s.style.background = CONFETTI[Math.floor(Math.random() * CONFETTI.length)];
      s.style.borderRadius = Math.random() < 0.5 ? '50%' : '2px';
      var dur = 2.4 + Math.random() * 1.8;
      s.style.animationDuration = dur + 's'; s.style.animationDelay = Math.random() * 0.5 + 's';
      celebrateLayer.appendChild(s);
      (function (node, d) { setTimeout(function () { node.remove(); }, (d + 0.6) * 1000); })(s, dur);
    }
    if (msg) {
      var t = document.createElement('div'); t.className = 'toast';
      t.innerHTML = '<span class="toast__ic">' + icon('check') + '</span><span>' + msg + '</span>';
      document.body.appendChild(t);
      requestAnimationFrame(function () { t.classList.add('is-show'); });
      setTimeout(function () { t.remove(); }, 2400);
    }
  }

  /* ==========================================================================
     Global interactions
     ========================================================================== */
  document.addEventListener('click', function (e) {
    var t = e.target;
    var nav = t.closest('[data-nav]'); if (nav) { go(nav.dataset.nav); return; }
    var goday = t.closest('[data-goday]'); if (goday) { go('workout', goday.dataset.goday); return; }
    var pill = t.closest('.pill[data-day]'); if (pill) { curDay = pill.dataset.day; render(); return; }
    var open = t.closest('[data-open]'); if (open) { var p = open.dataset.open.split('|'); openExercise(p[0], p[1], +p[2]); return; }
    var hist = t.closest('[data-hist]'); if (hist) { var h = hist.dataset.hist.split('|'); openHistory(h[0], h[1], h[2]); return; }

    if (t.closest('#exBack')) { closeExercise(); return; }
    if (t.closest('#exPrev')) { stepExercise(-1); return; }
    if (t.closest('#exNext')) { stepExercise(1); return; }
    if (t.closest('#exRest')) { openTimer(); return; }

    var done = t.closest('.lr__done');
    if (done) {
      var row = done.closest('.lr'); var day = row.dataset.day, exn = row.dataset.ex, set = +row.dataset.set;
      var cur = S.get(day, exn, set); var next = !cur.done;
      var before = dayTotals(day); var wasComplete = before.total > 0 && before.done === before.total;
      S.set(day, exn, set, { done: next });
      done.classList.toggle('is-done', next); done.innerHTML = next ? icon('check') : ''; done.setAttribute('aria-pressed', String(next));
      var after = dayTotals(day);
      if (!wasComplete && after.total > 0 && after.done === after.total) celebrate('برافو يا بطلة');
      return;
    }
    if (t.closest('#accLogin')) { openLogin(); return; }
    if (t.closest('#accLogout')) { S.logout().then(render); return; }
    var restChip = t.closest('[data-rest]');
    if (restChip) { restDefault = +restChip.dataset.rest; lsSet('bf:rest', String(restDefault)); render(); return; }
  });

  document.addEventListener('change', function (e) {
    var inp = e.target;
    if (inp.classList && inp.classList.contains('lr__in')) {
      var row = inp.closest('.lr'); var day = row.dataset.day, exn = row.dataset.ex, set = +row.dataset.set;
      var n = parseNum(inp.value);
      if (inp.dataset.field === 'weight') { S.set(day, exn, set, { weight: n }); inp.value = n == null ? '' : toAr(n); }
      else { var r = n == null ? null : Math.round(n); S.set(day, exn, set, { reps: r }); inp.value = r == null ? '' : toAr(r); }
      return;
    }
    if (inp.id === 'accName') { name = inp.value.trim(); lsSet('bf:name', name); }
  });

  /* ==========================================================================
     Boot
     ========================================================================== */
  S.onChange(function () { if (screen === 'account' && !ex.open) { var a = document.activeElement; if (!(a && a.id === 'accName')) render(); } });
  S.onData(function () { DAYS.forEach(function (d) { S.rollIfNewWeek(d); }); softRerender(); });
  DAYS.forEach(function (d) { S.rollIfNewWeek(d); });
  render();
  S.init();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('./sw.js').catch(function () {}); });
  }
})();
