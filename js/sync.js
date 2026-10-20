// =====================================================================
//  동기화 계층 — Firebase(Auth + Realtime Database) 또는 로컬 시뮬레이션
//  · js/firebase-config.js 가 있고 Firebase SDK가 로드되면 'firebase' 모드
//  · 없으면 'local' 모드: localStorage + BroadcastChannel 로 같은 PC의 탭끼리 동기화
//    (수업용이 아니라 UI 검증용. 권한 규칙은 서버(database.rules.json)에서만 강제됨)
//  API
//    await Sync.init()
//    Sync.mode                         'firebase' | 'local'
//    Sync.auth.uid / .user / .signInAnonymously() / .signInWithEmail(e,p) / .signOut() / .onChange(cb)
//    Sync.db.get(path) / .set(path,v) / .update(path,obj) / .push(path,v) / .on(path,cb) → off()
//    Sync.db.onDisconnectSet(path, v)  (firebase 전용, local 은 무시)
//    Sync.connection.online / .on(cb)
// =====================================================================

const Sync = {
  mode: null,
  auth: null,
  db: null,
  connection: { online: true, _cbs: [], on(cb) { this._cbs.push(cb); cb(this.online); }, _set(v) { if (this.online === v) return; this.online = v; this._cbs.forEach((c) => c(v)); } },

  async init() {
    const cfg = window.FIREBASE_CONFIG;
    const forceLocal = new URLSearchParams(location.search).has("local") || sessionStorage.getItem("dayeon-force-local") === "1";
    if (forceLocal) sessionStorage.setItem("dayeon-force-local", "1");
    if (!forceLocal && cfg && cfg.apiKey && window.firebase && firebase.database) {
      Sync.mode = "firebase";
      Sync._initFirebase(cfg);
    } else {
      Sync.mode = "local";
      Sync._initLocal();
    }
    return Sync.mode;
  },

  // ---------------------------------------------------------------- Firebase
  _initFirebase(cfg) {
    if (!firebase.apps.length) firebase.initializeApp(cfg);
    const fa = firebase.auth();
    const fd = firebase.database();
    if (window.FIREBASE_EMULATOR) {
      if (window.FIREBASE_EMULATOR.auth) fa.useEmulator(window.FIREBASE_EMULATOR.auth);
      if (window.FIREBASE_EMULATOR.database) fd.useEmulator(window.FIREBASE_EMULATOR.database.host, window.FIREBASE_EMULATOR.database.port);
    }
    const authCbs = [];
    Sync.auth = {
      uid: null, user: null,
      onChange(cb) { authCbs.push(cb); if (Sync.auth.user !== undefined) cb(Sync.auth.user); },
      async signInAnonymously() { const r = await fa.signInAnonymously(); return r.user.uid; },
      async signInWithEmail(email, pw) { const r = await fa.signInWithEmailAndPassword(email, pw); return pack(r.user); },
      async signOut() { await fa.signOut(); },
    };
    const pack = (u) => (u ? { uid: u.uid, isAnonymous: u.isAnonymous, email: u.email || null } : null);
    fa.onAuthStateChanged((u) => { Sync.auth.user = pack(u); Sync.auth.uid = u ? u.uid : null; authCbs.forEach((c) => c(Sync.auth.user)); });
    Sync.db = {
      async get(path) { const s = await fd.ref(path).get(); return s.exists() ? s.val() : null; },
      set(path, v) { return fd.ref(path).set(v); },
      update(path, obj) { return fd.ref(path).update(obj); },
      async push(path, v) { const r = fd.ref(path).push(); await r.set(v); return r.key; },
      on(path, cb) { const ref = fd.ref(path); const h = ref.on("value", (s) => cb(s.exists() ? s.val() : null)); return () => ref.off("value", h); },
      onDisconnectSet(path, v) { fd.ref(path).onDisconnect().set(v); },
      serverTime() { return Date.now(); },
    };
    fd.ref(".info/connected").on("value", (s) => Sync.connection._set(!!s.val()));
  },

  // ---------------------------------------------------------------- Local simulation
  _initLocal() {
    const KEY = "dayeon-sync-db";
    const chan = ("BroadcastChannel" in window) ? new BroadcastChannel("dayeon-sync") : null;
    const listeners = [];   // {path, cb}
    const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { return {}; } };
    const write = (tree) => localStorage.setItem(KEY, JSON.stringify(tree));
    const seg = (p) => p.split("/").filter(Boolean);
    const getAt = (tree, path) => seg(path).reduce((n, k) => (n && typeof n === "object" ? n[k] : undefined), tree);
    const setAt = (tree, path, v) => {
      const ks = seg(path); let n = tree;
      ks.slice(0, -1).forEach((k) => { if (!n[k] || typeof n[k] !== "object") n[k] = {}; n = n[k]; });
      if (v === null || v === undefined) delete n[ks[ks.length - 1]]; else n[ks[ks.length - 1]] = v;
    };
    const related = (a, b) => a === b || a.startsWith(b + "/") || b.startsWith(a + "/") || a === "" || b === "";
    const notify = (paths) => {
      const tree = read();
      listeners.forEach((l) => { if (paths.some((p) => related(p, l.path))) l.cb(clone(getAt(tree, l.path))); });
    };
    const clone = (v) => (v === undefined ? null : JSON.parse(JSON.stringify(v)));
    const broadcast = (paths) => { if (chan) chan.postMessage({ paths }); };
    if (chan) chan.onmessage = (e) => notify(e.data.paths);
    window.addEventListener("storage", (e) => { if (e.key === KEY) notify([""]); });

    // 익명 uid: 탭마다 하나 (sessionStorage)
    let uid = sessionStorage.getItem("dayeon-sync-uid");
    const authCbs = [];
    Sync.auth = {
      uid: uid, user: uid ? { uid, isAnonymous: !uid.startsWith("teacher-"), email: sessionStorage.getItem("dayeon-sync-email") } : null,
      onChange(cb) { authCbs.push(cb); cb(Sync.auth.user); },
      async signInAnonymously() {
        if (!uid || uid.startsWith("teacher-")) { uid = "anon-" + Math.random().toString(36).slice(2, 10); sessionStorage.setItem("dayeon-sync-uid", uid); sessionStorage.removeItem("dayeon-sync-email"); }
        Sync.auth.uid = uid; Sync.auth.user = { uid, isAnonymous: true, email: null };
        authCbs.forEach((c) => c(Sync.auth.user));
        return uid;
      },
      async signInWithEmail(email) {
        // 로컬 모드: 아무 이메일/비밀번호나 통과. Firebase 모드에서는 실제 계정 + teachers/{uid} 등록이 필요
        uid = "teacher-" + btoa(unescape(encodeURIComponent(email))).replace(/[^a-zA-Z0-9]/g, "").slice(0, 12);
        sessionStorage.setItem("dayeon-sync-uid", uid); sessionStorage.setItem("dayeon-sync-email", email);
        const tree = read(); setAt(tree, `teachers/${uid}`, true); write(tree);
        Sync.auth.uid = uid; Sync.auth.user = { uid, isAnonymous: false, email };
        authCbs.forEach((c) => c(Sync.auth.user));
        return Sync.auth.user;
      },
      async signOut() { uid = null; sessionStorage.removeItem("dayeon-sync-uid"); sessionStorage.removeItem("dayeon-sync-email"); Sync.auth.uid = null; Sync.auth.user = null; authCbs.forEach((c) => c(null)); },
    };
    Sync.db = {
      async get(path) { return clone(getAt(read(), path)); },
      async set(path, v) { const t = read(); setAt(t, path, clone(v)); write(t); notify([path]); broadcast([path]); },
      async update(path, obj) { const t = read(); const paths = []; Object.keys(obj).forEach((k) => { const p = (path ? path + "/" : "") + k; setAt(t, p, clone(obj[k])); paths.push(p); }); write(t); notify(paths); broadcast(paths); },
      async push(path, v) { const key = "k" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); await Sync.db.set(path + "/" + key, v); return key; },
      on(path, cb) { const l = { path, cb }; listeners.push(l); cb(clone(getAt(read(), path))); return () => { const i = listeners.indexOf(l); if (i >= 0) listeners.splice(i, 1); }; },
      onDisconnectSet() { /* 로컬 모드에서는 지원하지 않음 */ },
      serverTime() { return Date.now(); },
      _wipe() { localStorage.removeItem(KEY); notify([""]); broadcast([""]); },
    };
  },
};

// 공통 유틸
const SyncUtil = {
  code() { const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s = ""; for (let i = 0; i < 6; i++) s += a[Math.floor(Math.random() * a.length)]; return s; },
  modeLabel() { return Sync.mode === "firebase" ? "Firebase 연결" : "로컬 시뮬레이션 (같은 PC 탭 간 동기화)"; },
  fmtClock(min) {
    min = Math.floor(min || 0);
    const h = Math.floor(min / 60) % 24, mm = min % 60;
    return `${h < 12 ? "오전" : "오후"} ${h % 12 === 0 ? 12 : h % 12}:${String(mm).padStart(2, "0")}`;
  },
};
