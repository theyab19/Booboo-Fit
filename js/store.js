/* ==========================================================================
   بوبو فت — Booboo Fit · data + auth + sync layer  (window.Store)
   Offline-first: localStorage is the working store; when logged in it syncs to
   Supabase so the log is durable and available on any device. No external SDK.
   ========================================================================== */
(function () {
  'use strict';

  var CFG = window.BOOBOO_CONFIG || {};
  var URL_BASE = (CFG.SUPABASE_URL || '').replace(/\/+$/, '');
  var ANON = CFG.SUPABASE_ANON_KEY || '';
  var CLOUD = !!(URL_BASE && ANON);

  var LS = {
    rows: 'bf:log:rows',   // key `${day}|${ex}|${week}|${set}` -> {w,r,d,u}
    week: 'bf:log:week',   // day -> currentWeek
    dirtyR: 'bf:log:dirtyRows',
    dirtyW: 'bf:log:dirtyWeeks',
    auth: 'bf:auth'
  };
  var read = function (k, fb) { try { return JSON.parse(localStorage.getItem(k)) || fb; } catch (_) { return fb; } };
  var write = function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} };

  var rows = read(LS.rows, {});
  var week = read(LS.week, {});
  var dirtyRows = read(LS.dirtyR, {}); // key -> true
  var dirtyWeeks = read(LS.dirtyW, {}); // day -> true
  var auth = read(LS.auth, null);      // {access_token, refresh_token, expires_at, user:{id,email}}

  var listeners = [];
  var status = CLOUD ? (auth ? 'idle' : 'local') : 'local';
  var lastError = '';

  var dataListeners = [];
  function emit() { listeners.forEach(function (cb) { try { cb(); } catch (_) {} }); }
  function dataEmit() { dataListeners.forEach(function (cb) { try { cb(); } catch (_) {} }); }
  function setStatus(s, err) { status = s; lastError = err || ''; emit(); }

  var K = function (day, ex, wk, set) { return day + '|' + ex + '|' + wk + '|' + set; };
  var curWeek = function (day) { return week[day] || 1; };

  // ---- date helpers (for the dashboard / progress stats) ----
  function dkey(iso) {
    var d = new Date(iso); if (isNaN(d.getTime())) return null;
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function weekStartSunday(ref) {
    var x = new Date(ref); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - x.getDay()); return x;
  }

  /* ---------------- auth / fetch ---------------- */
  function saveAuth(a) { auth = a; write(LS.auth, a); }

  function authHeaders(json) {
    var h = { apikey: ANON, Authorization: 'Bearer ' + (auth ? auth.access_token : ANON) };
    if (json) h['Content-Type'] = 'application/json';
    return h;
  }

  function api(path, opts) {
    return fetch(URL_BASE + path, opts).then(function (res) {
      return res.text().then(function (t) {
        if (!res.ok) throw new Error(res.status + ' ' + t);
        return t ? JSON.parse(t) : null; // return=minimal responses have an empty body
      });
    });
  }

  function setSession(data) {
    if (!data || !data.access_token) throw new Error('no session');
    saveAuth({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + (data.expires_in || 3600) * 1000,
      user: { id: data.user && data.user.id, email: data.user && data.user.email }
    });
  }

  function refreshIfNeeded() {
    if (!auth) return Promise.resolve(false);
    if (Date.now() < auth.expires_at - 60000) return Promise.resolve(true);
    return fetch(URL_BASE + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: auth.refresh_token })
    }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d && d.access_token) { setSession(d); return true; } saveAuth(null); return false; })
      .catch(function () { return false; });
  }

  function signIn(kind, email, password) {
    if (!CLOUD) return Promise.reject(new Error('cloud غير مفعّل'));
    var path = kind === 'signup' ? '/auth/v1/signup' : '/auth/v1/token?grant_type=password';
    setStatus('syncing');
    return fetch(URL_BASE + path, {
      method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password })
    }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (o) {
        if (!o.ok || !o.j.access_token) {
          var msg = o.j.msg || o.j.error_description || o.j.message || 'تعذّر تسجيل الدخول';
          throw new Error(msg);
        }
        setSession(o.j);
        return firstSync();
      }).then(function () { setStatus('synced'); return true; })
      .catch(function (e) { setStatus(auth ? 'synced' : 'local', e.message); throw e; });
  }

  function logout() {
    var t = auth && auth.access_token;
    saveAuth(null);
    setStatus('local');
    if (t) fetch(URL_BASE + '/auth/v1/logout', { method: 'POST', headers: { apikey: ANON, Authorization: 'Bearer ' + t } }).catch(function () {});
    return Promise.resolve();
  }

  /* ---------------- sync ---------------- */
  function pull() {
    return api('/rest/v1/workout_logs?select=day,exercise,week,set_index,weight,reps,done,updated_at', { headers: authHeaders() })
      .then(function (list) {
        (list || []).forEach(function (row) {
          var key = K(row.day, row.exercise, row.week, row.set_index);
          if (dirtyRows[key]) return; // keep unsynced local edits
          rows[key] = { w: row.weight, r: row.reps, d: !!row.done, u: row.updated_at };
        });
        write(LS.rows, rows);
        return api('/rest/v1/day_state?select=day,current_week', { headers: authHeaders() });
      })
      .then(function (ds) {
        (ds || []).forEach(function (s) { if (!dirtyWeeks[s.day]) week[s.day] = s.current_week; });
        write(LS.week, week);
      });
  }

  function rowBody(key) {
    var p = key.split('|'); var v = rows[key] || {};
    return { day: p[0], exercise: p[1], week: +p[2], set_index: +p[3], weight: v.w == null ? null : v.w, reps: v.r == null ? null : v.r, done: !!v.d, updated_at: new Date().toISOString() };
  }

  function pushDirty() {
    if (!auth || !navigator.onLine) return Promise.resolve();
    var rKeys = Object.keys(dirtyRows), wDays = Object.keys(dirtyWeeks);
    if (!rKeys.length && !wDays.length) return Promise.resolve();
    var jobs = [];
    if (rKeys.length) {
      jobs.push(api('/rest/v1/workout_logs?on_conflict=user_id,day,exercise,week,set_index', {
        method: 'POST',
        headers: (function () { var h = authHeaders(true); h.Prefer = 'resolution=merge-duplicates,return=minimal'; return h; })(),
        body: JSON.stringify(rKeys.map(rowBody))
      }).then(function () { rKeys.forEach(function (k) { delete dirtyRows[k]; }); write(LS.dirtyR, dirtyRows); }));
    }
    if (wDays.length) {
      jobs.push(api('/rest/v1/day_state?on_conflict=user_id,day', {
        method: 'POST',
        headers: (function () { var h = authHeaders(true); h.Prefer = 'resolution=merge-duplicates,return=minimal'; return h; })(),
        body: JSON.stringify(wDays.map(function (d) { return { day: d, current_week: curWeek(d), updated_at: new Date().toISOString() }; }))
      }).then(function () { wDays.forEach(function (d) { delete dirtyWeeks[d]; }); write(LS.dirtyW, dirtyWeeks); }));
    }
    return Promise.all(jobs);
  }

  // On login: push local edits up, then pull the merged truth down.
  function firstSync() {
    return refreshIfNeeded().then(function () { return pushDirty(); }).then(function () { return pull(); });
  }

  var syncTimer = null;
  function scheduleSync() {
    if (!CLOUD || !auth) return;
    setStatus('syncing');
    clearTimeout(syncTimer);
    syncTimer = setTimeout(function () {
      refreshIfNeeded().then(pushDirty)
        .then(function () { setStatus('synced'); })
        .catch(function (e) { setStatus('offline', e.message); });
    }, 600);
  }

  /* ---------------- public data API ---------------- */
  function markDirtyRow(key) { dirtyRows[key] = true; write(LS.dirtyR, dirtyRows); }

  // Auto-advance a day's week when its current log is from an earlier calendar
  // week (Sunday-based). Archives the old week → it becomes "last week" + history.
  function rollIfNewWeek(day) {
    var cur = curWeek(day), maxU = null;
    Object.keys(rows).forEach(function (k) {
      var p = k.split('|'); if (p[0] !== day || +p[2] !== cur) return;
      var v = rows[k]; if (v && v.u) { var t = new Date(v.u).getTime(); if (!isNaN(t) && (maxU == null || t > maxU)) maxU = t; }
    });
    if (maxU == null) return false; // current week empty → nothing to archive
    if (weekStartSunday(maxU).getTime() < weekStartSunday(new Date()).getTime()) {
      week[day] = cur + 1; write(LS.week, week);
      dirtyWeeks[day] = true; write(LS.dirtyW, dirtyWeeks);
      scheduleSync();
      return true;
    }
    return false;
  }

  var Store = {
    cloudEnabled: CLOUD,
    onChange: function (cb) { listeners.push(cb); },
    onData: function (cb) { dataListeners.push(cb); },
    status: function () { return status; },
    error: function () { return lastError; },
    isAuthed: function () { return !!auth; },
    user: function () { return auth ? auth.user : null; },

    signup: function (e, p) { return signIn('signup', e, p); },
    login: function (e, p) { return signIn('login', e, p); },
    logout: logout,

    currentWeek: curWeek,

    get: function (day, ex, set) {
      var v = rows[K(day, ex, curWeek(day), set)];
      return v ? { weight: v.w, reps: v.r, done: !!v.d } : { weight: null, reps: null, done: false };
    },
    last: function (day, ex, set) {
      var wk = curWeek(day); if (wk <= 1) return null;
      var v = rows[K(day, ex, wk - 1, set)];
      if (!v || (v.w == null && v.r == null && !v.d)) return null;
      return { weight: v.w, reps: v.r, done: !!v.d };
    },
    // Full week-by-week history for one exercise (newest week first).
    history: function (day, ex) {
      var byWeek = {};
      Object.keys(rows).forEach(function (key) {
        var p = key.split('|');
        if (p[0] !== day || p[1] !== ex) return;
        var v = rows[key];
        if (!v || (v.w == null && v.r == null && !v.d)) return;
        var wk = +p[2], set = +p[3];
        (byWeek[wk] = byWeek[wk] || {})[set] = { weight: v.w, reps: v.r, done: !!v.d };
      });
      return Object.keys(byWeek).map(Number).sort(function (a, b) { return b - a; })
        .map(function (wk) { return { week: wk, sets: byWeek[wk] }; });
    },

    // ---- dashboard / progress analytics (derived from row updated-at dates) ----
    trainedDates: function () {
      var seen = {};
      Object.keys(rows).forEach(function (k) { var v = rows[k]; if (v && v.d && v.u) { var dk = dkey(v.u); if (dk) seen[dk] = true; } });
      return Object.keys(seen).sort();
    },
    weekStats: function (ref) {
      var start = weekStartSunday(ref || new Date());
      var end = new Date(start); end.setDate(end.getDate() + 7);
      var perVol = [0, 0, 0, 0, 0, 0, 0], perSets = [0, 0, 0, 0, 0, 0, 0], days = {}, vol = 0, sets = 0;
      Object.keys(rows).forEach(function (k) {
        var v = rows[k]; if (!v || !v.d || !v.u) return;
        var d = new Date(v.u); if (d < start || d >= end) return;
        var wd = d.getDay();
        sets++; perSets[wd]++; days[dkey(v.u)] = true;
        if (v.w != null && v.r != null) { var vv = v.w * v.r; vol += vv; perVol[wd] += vv; }
      });
      return { volume: vol, sets: sets, days: Object.keys(days).length, perVol: perVol, perSets: perSets, weekStart: start };
    },
    streak: function () {
      var dates = this.trainedDates(); if (!dates.length) return 0;
      var set = {}; dates.forEach(function (d) { set[d] = true; });
      var cur = new Date(); cur.setHours(0, 0, 0, 0);
      if (!set[dkey(cur.toISOString())]) { cur.setDate(cur.getDate() - 1); if (!set[dkey(cur.toISOString())]) return 0; }
      var n = 0;
      while (set[dkey(cur.toISOString())]) { n++; cur.setDate(cur.getDate() - 1); }
      return n;
    },
    totalVolume: function () {
      var t = 0; Object.keys(rows).forEach(function (k) { var v = rows[k]; if (v && v.d && v.w != null && v.r != null) t += v.w * v.r; });
      return t;
    },
    // per-day this-week done sets for one exercise's day (for the day cards / hero)
    dayDoneThisWeek: function (day, exs) {
      var start = weekStartSunday(new Date()), end = new Date(start); end.setDate(end.getDate() + 7);
      var wk = curWeek(day), done = 0, total = 0;
      exs.forEach(function (e) {
        total += e.sets;
        for (var s = 0; s < e.sets; s++) {
          var v = rows[K(day, e.ex, wk, s)];
          if (v && v.d) done++;
        }
      });
      return { done: done, total: total };
    },
    series: function (day, ex) {
      var byWeek = {};
      Object.keys(rows).forEach(function (k) {
        var p = k.split('|'); if (p[0] !== day || p[1] !== ex) return;
        var v = rows[k]; if (!v || v.w == null) return;
        var wk = +p[2]; byWeek[wk] = byWeek[wk] == null ? v.w : Math.max(byWeek[wk], v.w);
      });
      return Object.keys(byWeek).map(Number).sort(function (a, b) { return a - b; })
        .map(function (wk) { return { week: wk, weight: byWeek[wk] }; });
    },
    pr: function (day, ex) {
      var m = null;
      Object.keys(rows).forEach(function (k) {
        var p = k.split('|'); if (p[0] !== day || p[1] !== ex) return;
        var v = rows[k]; if (v && v.w != null) m = (m == null ? v.w : Math.max(m, v.w));
      });
      return m;
    },
    recentWeeksVolume: function (n) {
      n = n || 8;
      var start = weekStartSunday(new Date()), buckets = [];
      for (var i = n - 1; i >= 0; i--) {
        var s = new Date(start); s.setDate(s.getDate() - i * 7);
        var e = new Date(s); e.setDate(e.getDate() + 7);
        buckets.push({ start: s, end: e, volume: 0 });
      }
      Object.keys(rows).forEach(function (k) {
        var v = rows[k]; if (!v || !v.d || v.w == null || v.r == null || !v.u) return;
        var d = new Date(v.u);
        for (var j = 0; j < buckets.length; j++) { if (d >= buckets[j].start && d < buckets[j].end) { buckets[j].volume += v.w * v.r; break; } }
      });
      return buckets;
    },
    set: function (day, ex, set, patch) {
      rollIfNewWeek(day);
      var key = K(day, ex, curWeek(day), set);
      var v = rows[key] || { w: null, r: null, d: false };
      if ('weight' in patch) v.w = patch.weight;
      if ('reps' in patch) v.r = patch.reps;
      if ('done' in patch) v.d = !!patch.done;
      v.u = new Date().toISOString();
      rows[key] = v; write(LS.rows, rows);
      markDirtyRow(key);
      scheduleSync();
    },

    // progress for the current week: exs = [{ex, sets}]
    progress: function (day, exs) {
      var total = 0, done = 0;
      exs.forEach(function (e) {
        total += e.sets;
        for (var s = 0; s < e.sets; s++) { var v = rows[K(day, e.ex, curWeek(day), s)]; if (v && v.d) done++; }
      });
      return { total: total, done: done };
    },

    newWeek: function (day) {
      week[day] = curWeek(day) + 1; write(LS.week, week);
      dirtyWeeks[day] = true; write(LS.dirtyW, dirtyWeeks);
      scheduleSync();
      emit();
    },
    rollIfNewWeek: function (day) { return rollIfNewWeek(day); },

    init: function () {
      if (CLOUD && auth) {
        setStatus('syncing');
        refreshIfNeeded().then(function (ok) {
          if (!ok) { setStatus('local'); emit(); return; }
          return pushDirty().then(pull).then(function () { setStatus('synced'); emit(); dataEmit(); });
        }).catch(function () { setStatus('offline'); emit(); });
      }
      window.addEventListener('online', function () { if (auth) scheduleSync(); });
    }
  };

  window.Store = Store;
})();
