// =====================================================================
//  교사 대시보드 (teacher.html)
//  · 수업 세션 생성/코드/팀 승인/종료
//  · 스토리 공개(메시지 1개 / 묶음 / 업무 / 힌트 / 해설 / 공식 서비스 반영 / 엔딩)
//  · 업무 단계(LOCKED→ANNOUNCED→ACTIVE→REVIEW→DEBRIEF→COMPLETED), 일시정지, 게임 시각
//  · 팀 현황·보고서 검토(승인/보완/잠금)
//  비공개 데이터(private/data-private.js)는 이 페이지에서만 읽고, 공개 시 이벤트 payload 로만 전달
// =====================================================================

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const app = document.getElementById("app");
const CLOCK_START_MIN = 9 * 60 + 5;

// ---------- 스토리 스크립트 (비공개 데이터 → 순서 있는 공개 항목) ----------
function buildStory() {
  const items = [];
  const add = (chapter, it) => items.push({ chapter, ...it });
  let invited = false;   // 초대 이후의 메시지(김팀장 DM)는 초대 묶음에 포함 (묶음이 연속되도록)
  TIMELINE.forEach((ev) => {
    if (ev.type === "invite") { invited = true; add("프로젝트 채널 초대", { type: "invite", room: ev.ch, by: ev.by, label: "채널 초대: #프로젝트-티켓온" }); }
    else add(invited ? "프로젝트 채널 초대" : "첫 출근 · 회사 분위기", { type: "message", room: ev.ch, from: ev.from, text: ev.text });
  });
  INCIDENT.forEach((ev) => {
    if (ev.type === "task") add("TASK-001 배정", { type: "task", room: "ticketon", task: ev.task, label: `업무 배정 #${ev.task.no} ${ev.task.title}` });
    else add("첫 사건 (프로젝트 채널)", { type: "message", room: "ticketon", from: ev.from, text: ev.text, file: ev.file || null });
  });
  FOLLOWUP.forEach((ev) => {
    if (ev.type === "task") add("TASK-002 배정", { type: "task", room: "ticketon", task: ev.task, label: `업무 배정 #${ev.task.no} ${ev.task.title}` });
    else if (ev.type === "system") add("TASK-002 배정", { type: "system", room: "ticketon", text: ev.text });
    else add("TASK-001 보고 후 · 디자인/개발 대화", { type: "message", room: "ticketon", from: ev.from, text: ev.text });
  });
  FOLLOWUP2.forEach((ev) => {
    if (ev.type === "task") add("TASK-003 배정", { type: "task", room: "ticketon", task: ev.task, label: `업무 배정 #${ev.task.no} ${ev.task.title}` });
    else if (ev.type === "system") add("TASK-003 배정", { type: "system", room: "ticketon", text: ev.text });
    else add("TASK-002 완료 후 · 예매 버튼 이상", { type: "message", room: "ticketon", from: ev.from, text: ev.text });
  });
  FOLLOWUP3.forEach((ev) => add("TASK-003 완료 후 · 결제 테스트", ev.type === "system" ? { type: "system", room: "ticketon", text: ev.text } : { type: "message", room: "ticketon", from: ev.from, text: ev.text }));
  (typeof FOLLOWUP4 !== "undefined" ? FOLLOWUP4 : []).forEach((ev) => {
    if (ev.type === "task") add("TASK-004 배정", { type: "task", room: "ticketon", task: ev.task, label: `업무 배정 #${ev.task.no} ${ev.task.title}` });
    else if (ev.type === "system" && ev.text.includes("배정")) add("TASK-004 배정", { type: "system", room: "ticketon", text: ev.text });
    else add("결제 대참사 사건", ev.type === "system" ? { type: "system", room: "ticketon", text: ev.text } : { type: "message", room: "ticketon", from: ev.from, text: ev.text });
  });
  (typeof FOLLOWUP5 !== "undefined" ? FOLLOWUP5 : []).forEach((ev) => add("TASK-004 엔딩 · 배포 기록 단서", ev.type === "system" ? { type: "system", room: "ticketon", text: ev.text } : { type: "message", room: "ticketon", from: ev.from, text: ev.text }));
  (typeof FOLLOWUP6 !== "undefined" ? FOLLOWUP6 : []).forEach((ev) => {
    if (ev.type === "task") add("TASK-005 배정", { type: "task", room: "ticketon", task: ev.task, label: `업무 배정 #${ev.task.no} ${ev.task.title}` });
    else if (ev.type === "system" && ev.text.includes("배정")) add("TASK-005 배정", { type: "system", room: "ticketon", text: ev.text });
    else add("TASK-005 사건 · 배포 파일 추궁", ev.type === "system" ? { type: "system", room: "ticketon", text: ev.text } : { type: "message", room: "ticketon", from: ev.from, text: ev.text });
  });
  (typeof FOLLOWUP7 !== "undefined" ? FOLLOWUP7 : []).forEach((ev) => add("TASK-005 엔딩 · 사건의 진실", ev.type === "system" ? { type: "system", room: "ticketon", text: ev.text } : { type: "message", room: "ticketon", from: ev.from, text: ev.text }));
  (typeof FOLLOWUP8 !== "undefined" ? FOLLOWUP8 : []).forEach((ev) => {
    if (ev.type === "task") add("TASK-006 배정", { type: "task", room: "ticketon", task: ev.task, label: `업무 배정 #${ev.task.no} ${ev.task.title}` });
    else if (ev.type === "system" && ev.text.includes("배정")) add("TASK-006 배정", { type: "system", room: "ticketon", text: ev.text });
    else add("TASK-006 사건 · 최후의 배포", ev.type === "system" ? { type: "system", room: "ticketon", text: ev.text } : { type: "message", room: "ticketon", from: ev.from, text: ev.text });
  });
  const simple = (list, chapter) => (typeof list !== "undefined" ? list : []).forEach((ev) => add(chapter, ev.type === "system" ? { type: "system", room: "ticketon", text: ev.text } : { type: "message", room: "ticketon", from: ev.from, text: ev.text }));
  simple(typeof FOLLOWUP9 !== "undefined" ? FOLLOWUP9 : undefined, "TASK-006 배포 결과 공개");
  simple(typeof FOLLOWUP10 !== "undefined" ? FOLLOWUP10 : undefined, "근무평가 진행");
  simple(typeof FOLLOWUP11 !== "undefined" ? FOLLOWUP11 : undefined, "퇴근 승인");
  items.forEach((it, i) => (it.index = i));
  return items;
}
let STORY = [];
let CHAPTERS = [];
const CONTENT_KEYS = ["TIMELINE", "INCIDENT", "FOLLOWUP", "FOLLOWUP2", "FOLLOWUP3", "FOLLOWUP4", "HINTS", "TEACHER_NOTES", "INQUIRY_GROUPS", "TASK2_ANSWERS", "TASK3_ANSWERS", "FOLLOWUP5", "TASK4_ANSWERS", "FOLLOWUP6", "FOLLOWUP7", "TASK5_ANSWERS", "FOLLOWUP8", "FOLLOWUP9", "FOLLOWUP10", "FOLLOWUP11", "TASK6_ANSWERS"];

// ---------- 비공개 콘텐츠 (교사 전용 DB 경로 content/private) ----------
//  1) DB 에 있으면 그것을 사용
//  2) 없으면 localhost 에서 private/data-private.js 를 읽어 자동 등록 시도
//  3) 그래도 없으면 화면에서 파일을 골라 등록
function applyContent(obj) {
  CONTENT_KEYS.forEach((k) => { if (obj[k] !== undefined) window[k] = obj[k]; });
  STORY = buildStory();
  CHAPTERS = [...new Set(STORY.map((s) => s.chapter))];
  T.contentReady = true;
}
function parsePrivateScript(text) {
  // private/data-private.js (const 선언들) 를 평가해 객체로
  const fn = new Function(text.replace(/\bconst /g, "var ") + ";return {" + CONTENT_KEYS.map((k) => `${k}: typeof ${k} === "undefined" ? undefined : ${k}`).join(",") + "};");
  return fn();
}
async function loadContent() {
  T.contentReady = false; T.contentError = "";
  try {
    const db = await Sync.db.get("content/private");
    if (db && db.TIMELINE && db.TASK6_ANSWERS) { applyContent(db); return; }
    if (db && db.TIMELINE) T.contentError = "등록된 시나리오가 예전 버전입니다(TASK-006 없음). private/data-private.js 를 다시 등록하세요.";
  } catch (e) { T.contentError = "DB에서 콘텐츠를 읽지 못했습니다: " + (e.code || e.message); }
  // localhost 폴백: 로컬 파일을 읽어 DB에 등록
  try {
    const r = await fetch("private/data-private.js", { cache: "no-store" });
    if (r.ok) {
      const obj = parsePrivateScript(await r.text());
      await registerContent(obj);
      return;
    }
  } catch (e) { /* 호스팅 환경에서는 없음 */ }
  render();
}
async function registerContent(obj) {
  const payload = {}; CONTENT_KEYS.forEach((k) => { if (obj[k] !== undefined) payload[k] = obj[k]; });
  payload.version = 1; payload.updatedAt = Date.now(); payload.by = Sync.auth.uid;
  await Sync.db.set("content/private", JSON.parse(JSON.stringify(payload)));
  applyContent(payload);
  render();
}
const PHASES = ["LOCKED", "ANNOUNCED", "ACTIVE", "REVIEW", "DEBRIEF", "COMPLETED"];
const PHASE_KO = { LOCKED: "미공개", ANNOUNCED: "배정 공개", ACTIVE: "조사 진행", REVIEW: "조사 마감·검토", DEBRIEF: "해설·발표", COMPLETED: "종료" };

// ---------- 상태 ----------
const T = {
  user: null, sessions: {}, sid: null,
  pub: null, priv: null, events: [], teams: {}, requests: {}, teamData: {},
  tab: "guide", unsubs: [], clockTimer: null, busy: false, note: {}, selectedTeam: null, msg: "",
};

// ---------- 유틸 ----------
const fmtClock = SyncUtil.fmtClock;
const userName = (id) => (USERS[id] ? USERS[id].name : id);
const roomName = (id) => { const r = [...CHANNELS, ...DMS].find((x) => x.id === id); return r ? (r.type === "dm" ? "DM " + r.name : "#" + r.name) : id; };
const isTeacher = () => T.user && !T.user.isAnonymous;
function sp(path) { return `sessions/${T.sid}/${path}`; }
function flash(m) { T.msg = m; render(); setTimeout(() => { if (T.msg === m) { T.msg = ""; render(); } }, 2500); }

// ---------- 부팅 / 인증 ----------
async function boot() {
  await Sync.init();
  Sync.auth.onChange(async (u) => {
    T.user = u;
    if (u && !u.isAnonymous) { await loadSessions(); render(); await loadContent(); }
    render();
  });
  Sync.connection.on(() => render());
  render();
}
async function login(email, pw) {
  try {
    await Sync.auth.signInWithEmail(email, pw);
    if (Sync.mode === "firebase") {
      const ok = await Sync.db.get(`teachers/${Sync.auth.uid}`);
      if (ok !== true) { await Sync.auth.signOut(); throw new Error("이 계정은 교사로 등록되어 있지 않습니다. Firebase 콘솔에서 teachers/{uid} = true 를 설정하세요. (uid: " + Sync.auth.uid + ")"); }
    }
  } catch (e) { alert(e.message || e); }
}
async function loadSessions() {
  const all = (await Sync.db.get("sessionIndex")) || {};
  T.sessions = Object.fromEntries(Object.entries(all).filter(([, v]) => v.teacherUid === Sync.auth.uid));
}

// ---------- 세션 ----------
async function createSession(title) {
  const code = SyncUtil.code();
  const sid = "s" + Date.now().toString(36);
  const pub = {
    code, title: title || "DAYEON WORK 수업", status: "running", teacherUid: Sync.auth.uid, createdAt: Date.now(),
    gameTime: CLOCK_START_MIN, eventSeq: 0, currentTask: 0,
    tasks: { t1: { status: "LOCKED" }, t2: { status: "LOCKED" }, t3: { status: "LOCKED" }, t4: { status: "LOCKED" }, t5: { status: "LOCKED" }, t6: { status: "LOCKED" } },
    officialService: { design: null, source: null, appliedAt: null, reserveFixed: false, payFixed: false, payUi: null },
  };
  await Sync.db.set(`sessions/${sid}/public`, pub);
  await Sync.db.set(`sessions/${sid}/private`, { nextIndex: 0, createdAt: Date.now() });
  await Sync.db.set(`codes/${code}`, sid);
  await Sync.db.set(`sessionIndex/${sid}`, { code, title: pub.title, teacherUid: Sync.auth.uid, createdAt: pub.createdAt, status: "running" });
  await loadSessions();
  selectSession(sid);
}
// ---------- 프로젝터용 팀 진행 요약 (public.progress) — 단계 수·제출·승인만, 보고서 내용은 포함하지 않음 ----------
function teamProgress(no, st) {
  const t = (k) => st[k] || {};
  const n = (a) => (Array.isArray(a) ? a.length : 0);
  let steps;
  if (no === 1) { const s = t("task"); steps = [s.inquiriesViewed || n(s.inquiriesOpened) >= 3, n(s.reproduced) > 0, s.reportSubmitted]; }
  else if (no === 2) { const s = t("task2"); steps = [n(s.findings) > 0, !!s.principlesChecked, !!s.designApplied, !!s.reportSubmitted]; }
  else if (no === 3) { const s = t("task3"); steps = [n(s.reproductions) > 0, n(s.clues) > 0, !!s.codeFixed, ((s.retest || {}).passes || 0) >= 2, !!s.reportSubmitted]; }
  else if (no === 4) { const s = t("task4"); steps = [n(s.reproductions) > 0, !!s.logViewed, !!s.uiApplied, !!s.codeOk, !!s.qa, !!s.reportSubmitted]; }
  else if (no === 5) { const s = t("task5"); steps = [n(s.fileNotes) > 0, !!s.designHistoryViewed && n(s.commitsViewed) > 0, n(s.deploysViewed) > 0 && n(s.evidence) > 0, !!(s.timeline && s.timeline.passed), !!s.reportSubmitted]; }
  else if (no === 6) { const s = t("task6"); steps = [!!(s.candidate && s.candidate.id), !!(s.qa && s.qa.run === s.qa.total), !!(s.meeting && s.meeting.decision), !!s.reportSubmitted, !!(s.release && s.release.requested), !!s.postCheckDone]; }
  else steps = [];
  return { done: steps.filter(Boolean).length, total: steps.length };
}
let lastProgressJson = "";
function mirrorProgress() {
  if (!T.pub || !T.sid) return;
  const no = T.pub.currentTask || 0;
  const prog = {};
  Object.entries(T.teams).forEach(([tid, tm]) => {
    const d = T.teamData[tid] || {}; const st = d.state || {};
    const p = no ? teamProgress(no, st) : { done: 0, total: 0 };
    const sub = d.submissions && d.submissions["t" + no]; const rv = d.review && d.review["t" + no];
    prog[tid] = { name: tm.name, no, done: p.done, total: p.total, submitted: !!sub, approved: !!(rv && rv.status === "approved"), returned: !!(rv && rv.status === "returned"), app: st.currentApp || null };
  });
  const json = JSON.stringify(prog);
  if (json === lastProgressJson) return;
  lastProgressJson = json;
  Sync.db.update(sp("public"), { progress: prog }).catch(() => {});
}
function safe(fn) { try { fn(); } catch (e) { console.error(e); } }
function selectSession(sid) {
  T.unsubs.forEach((u) => u()); T.unsubs = [];
  clearInterval(T.clockTimer); clearInterval(T.pollTimer);
  T.sid = sid; T.pub = null; T.priv = null; T.events = []; T.teams = {}; T.requests = {}; T.teamData = {};
  if (!sid) { render(); return; }
  T.unsubs.push(Sync.db.on(sp("public"), (v) => { const prevTask = T.pub && T.pub.currentTask; T.pub = v; if (v && v.currentTask !== prevTask) mirrorProgress(); render(); }));
  T.unsubs.push(Sync.db.on(sp("private"), (v) => { T.priv = v || { nextIndex: 0 }; render(); }));
  T.unsubs.push(Sync.db.on(sp("events"), (v) => { T.events = Object.values(v || {}).sort((a, b) => a.seq - b.seq); render(); }));
  T.unsubs.push(Sync.db.on(sp("teams"), (v) => { T.teams = v || {}; render(); }));
  T.unsubs.push(Sync.db.on(sp("joinRequests"), (v) => { T.requests = v || {}; render(); }));
  T.unsubs.push(Sync.db.on(sp("teamData"), (v) => { T.teamData = v || {}; safe(mirrorProgress); render(); }));
  // 안전망: 실시간 알림을 놓쳐도 8초마다 팀 데이터·입장 요청을 다시 읽어 화면을 맞춘다 (보고서 제출·상태 변경이 새로고침 없이 보이도록)
  clearInterval(T.pollTimer);
  T.pollTimer = setInterval(async () => {
    if (!T.sid) return;
    try {
      const [td, rq] = await Promise.all([Sync.db.get(sp("teamData")), Sync.db.get(sp("joinRequests"))]);
      let changed = false;
      if (JSON.stringify(td || {}) !== JSON.stringify(T.teamData)) { T.teamData = td || {}; safe(mirrorProgress); changed = true; }
      if (JSON.stringify(rq || {}) !== JSON.stringify(T.requests)) { T.requests = rq || {}; changed = true; }
      if (changed) render();
    } catch (e) { /* 연결 문제는 다음 주기에 재시도 */ }
  }, 8000);
  // 게임 시각: 교사 화면이 켜져 있는 동안 1분마다 1분씩 진행(일시정지 제외)
  T.clockTimer = setInterval(() => {
    if (!T.pub || T.pub.status !== "running") return;
    Sync.db.update(sp("public"), { gameTime: (T.pub.gameTime || CLOCK_START_MIN) + 1 }).catch(() => {});
  }, 60000);
  render();
}
async function setSessionStatus(status) {
  await Sync.db.update(sp("public"), { status });
  await Sync.db.update(`sessionIndex/${T.sid}`, { status });
}
async function resetSession() {
  if (!confirm("이 수업의 공개 이벤트, 팀 데이터, 입장 요청을 모두 지우고 처음 상태로 되돌립니다. 계속할까요?")) return;
  const pub = T.pub;
  await Sync.db.set(sp("events"), null);
  await Sync.db.set(sp("teamData"), null);
  await Sync.db.set(sp("teams"), null);
  await Sync.db.set(sp("members"), null);
  await Sync.db.set(sp("joinRequests"), null);
  await Sync.db.set(sp("private"), { nextIndex: 0, createdAt: Date.now() });
  await Sync.db.update(sp("public"), { status: "running", gameTime: CLOCK_START_MIN, eventSeq: 0, currentTask: 0, tasks: { t1: { status: "LOCKED" }, t2: { status: "LOCKED" }, t3: { status: "LOCKED" }, t4: { status: "LOCKED" }, t5: { status: "LOCKED" }, t6: { status: "LOCKED" } }, officialService: { design: null, source: null, appliedAt: null, reserveFixed: false, payFixed: false, payUi: null }, release: null, eval: null, evalReady: false, leaveApproved: false });
  flash("세션을 초기화했습니다. 학생 팀은 다시 입장 요청해야 합니다.");
}

// ---------- 팀 ----------
async function approve(uid) {
  const req = T.requests[uid]; if (!req) return;
  const teamId = "team-" + Date.now().toString(36);
  await Sync.db.set(sp(`teams/${teamId}`), { name: req.teamName, uid, approvedAt: Date.now(), online: true, lastSeen: Date.now() });
  await Sync.db.set(sp(`members/${uid}`), teamId);
  await Sync.db.update(sp(`joinRequests/${uid}`), { status: "approved", teamId });
}
async function reject(uid) { await Sync.db.update(sp(`joinRequests/${uid}`), { status: "rejected" }); }
async function removeTeam(teamId) {
  const t = T.teams[teamId]; if (!t || !confirm(`'${t.name}' 팀을 내보낼까요? (팀 데이터는 남습니다)`)) return;
  await Sync.db.set(sp(`members/${t.uid}`), null);
  await Sync.db.set(sp(`joinRequests/${t.uid}`), null);
  await Sync.db.set(sp(`teams/${teamId}`), null);
}

// ---------- 스토리 공개 ----------
async function publishEvent(ev) {
  const seq = (T.pub.eventSeq || 0) + 1;
  const payload = { ...ev, seq, at: T.pub.gameTime || CLOCK_START_MIN, publishedAt: Date.now() };
  delete payload.index; delete payload.chapter; delete payload.label;
  await Sync.db.push(sp("events"), payload);
  const upd = { eventSeq: seq };
  if (ev.type === "task") { upd[`tasks/t${ev.task.no}/status`] = "ANNOUNCED"; upd.currentTask = ev.task.no; }
  await Sync.db.update(sp("public"), upd);
  return seq;
}
async function publishNext(count = 1) {
  if (T.busy || !T.priv) return;
  T.busy = true; render();
  try {
    let i = T.priv.nextIndex || 0;
    for (let n = 0; n < count && i < STORY.length; n++, i++) {
      await publishEvent(STORY[i]);
      await Sync.db.update(sp("private"), { nextIndex: i + 1 });
      // 게임 시각도 조금 흐르게 (메시지당 1분)
      await Sync.db.update(sp("public"), { gameTime: (T.pub.gameTime || CLOCK_START_MIN) + 1 });
    }
  } finally { T.busy = false; render(); }
}
// 챕터(묶음) 단위
function chapterItems(name) { return STORY.filter((it) => it.chapter === name); }
function chapterDone(name) { const items = chapterItems(name); const i = T.priv ? (T.priv.nextIndex || 0) : 0; return items.length > 0 && items[items.length - 1].index < i; }
function chapterIsNext(name) { const i = T.priv ? (T.priv.nextIndex || 0) : 0; return STORY[i] && STORY[i].chapter === name; }
async function publishChapter(name) {
  if (!chapterIsNext(name)) return;
  const i = T.priv.nextIndex || 0;
  let n = 0; while (STORY[i + n] && STORY[i + n].chapter === name) n++;
  await publishNext(n);
}

// ---------- 수업 진행 가이드 (순서대로 한 단계씩) ----------
function phaseOf(no) { return ((T.pub.tasks || {})["t" + no] || {}).status || "LOCKED"; }
function phaseAtLeast(no, p) { return PHASES.indexOf(phaseOf(no)) >= PHASES.indexOf(p); }
function submissionStats(no) {
  const teams = Object.keys(T.teams);
  const sub = teams.filter((tid) => T.teamData[tid] && T.teamData[tid].submissions && T.teamData[tid].submissions["t" + no]);
  const approved = sub.filter((tid) => T.teamData[tid].review && T.teamData[tid].review["t" + no] && T.teamData[tid].review["t" + no].status === "approved");
  const pending = sub.filter((tid) => !(T.teamData[tid].review && T.teamData[tid].review["t" + no]) || T.teamData[tid].review["t" + no].status === "pending");
  return { teams: teams.length, submitted: sub.length, approved: approved.length, pending: pending.length };
}
function buildGuide() {
  const pendingReq = Object.values(T.requests).filter((r) => r.status === "pending").length;
  const teamsN = Object.keys(T.teams).length;
  const ch = (name) => ({ done: () => chapterDone(name), ready: () => chapterIsNext(name), action: { label: "공개", fn: () => publishChapter(name) }, count: chapterItems(name).length });
  const goTab = (tab, label) => ({ label, fn: () => { T.tab = tab; render(); } });
  const s1 = submissionStats(1), s2 = submissionStats(2), s3 = submissionStats(3), s4 = submissionStats(4), s5 = submissionStats(5);
  return [
    { title: "팀 입장 승인", desc: "학생 팀이 student.html 에서 수업 코드와 팀 이름으로 요청하면 승인합니다. 승인된 팀은 바로 게임 화면으로 들어갑니다. 프로젝터 화면도 지금 띄워 두세요.",
      status: `승인 ${teamsN}팀 · 대기 ${pendingReq}건`, done: () => teamsN > 0 && pendingReq === 0, ready: () => true, action: goTab("teams", pendingReq ? `입장 요청 ${pendingReq}건 승인하기` : "학생 현황 보기"), manualDone: true },
    { title: "첫 출근 대화 공개", desc: "회사 분위기 대화가 잡담방·전체공지·DM에 순서대로 도착합니다(입력 중 연출 포함, 약 1분). 학생들은 메신저를 둘러보며 분위기를 익힙니다.", ...ch("첫 출근 · 회사 분위기") },
    { title: "프로젝트 채널 초대", desc: "김팀장이 #프로젝트-티켓온 채널에 초대합니다. 학생 화면 사이드바에 채널이 생깁니다.", ...ch("프로젝트 채널 초대") },
    { title: "첫 사건 공개", desc: "CS 긴급 문의와 디자인·개발팀 충돌 대화 10개가 프로젝트 채널에 도착합니다. 학생들이 채널을 열어 읽게 하세요.", ...ch("첫 사건 (프로젝트 채널)") },
    { title: "TASK-001 배정", desc: "업무 배정 카드가 모든 팀에 도착하고 프로젝터에 크게 표시됩니다. 학생은 [업무 확인]을 눌러 업무 시스템에서 내용을 봅니다. (아직 시작은 못 함)", ...ch("TASK-001 배정") },
    { title: "TASK-001 조사 시작", desc: "학생이 [업무 시작하기]를 누를 수 있게 됩니다. 흐름: 고객 문의 23건 읽기 → TICKET ON에서 오류 재현·기록 → 조사 보고서 제출. 20~30분. 토론 시간에는 '일시정지', 막히면 '힌트'를 쓰세요.",
      status: `단계: ${PHASE_KO[phaseOf(1)]}`, done: () => phaseAtLeast(1, "ACTIVE"), ready: () => phaseOf(1) === "ANNOUNCED", action: { label: "조사 시작 열기", fn: () => setPhase(1, "ACTIVE") }, tools: true },
    { title: "조사 보고서 검토·승인", desc: "제출된 보고서를 읽고 승인하거나 보완을 요청합니다. 승인된 팀은 업무가 완료되지만 다음 스토리는 아직 열리지 않습니다.",
      status: `제출 ${s1.submitted}/${s1.teams}팀 · 승인 ${s1.approved} · 대기 ${s1.pending}`, done: () => s1.submitted > 0 && s1.pending === 0, ready: () => phaseOf(1) === "ACTIVE", action: goTab("review", s1.pending ? `검토 대기 ${s1.pending}건 보기` : "보고서 검토 탭"), manualDone: true },
    { title: "조사 마감 · 해설 공개", desc: "더 이상 제출을 받지 않고, 해설(문의 분류·원인·기대 결론)을 모든 팀과 프로젝터에 공개합니다. 팀별 발표와 토론을 진행하세요.",
      status: `단계: ${PHASE_KO[phaseOf(1)]}`, done: () => phaseAtLeast(1, "DEBRIEF"), ready: () => phaseOf(1) === "ACTIVE" || phaseOf(1) === "REVIEW", action: { label: "마감하고 해설 공개", fn: () => publishDebrief(1) } },
    { title: "TASK-001 종료", desc: "업무를 종료 상태로 표시합니다.", status: `단계: ${PHASE_KO[phaseOf(1)]}`, done: () => phaseOf(1) === "COMPLETED", ready: () => phaseOf(1) === "DEBRIEF", action: { label: "종료 처리", fn: () => setPhase(1, "COMPLETED") } },
    { title: "디자인/개발 대화 공개", desc: "보고를 본 김팀장, 한사원(디자인), 이대리(개발)의 대화. '내가 만든 디자인이 아닌데요?'로 이어집니다.", ...ch("TASK-001 보고 후 · 디자인/개발 대화") },
    { title: "TASK-002 배정", desc: "두 번째 업무 카드가 도착합니다. 학생은 [업무 확인]으로 내용을 봅니다.", ...ch("TASK-002 배정") },
    { title: "TASK-002 검수 시작", desc: "학생 흐름: 디자인 검수 뷰어에서 v2/v4 비교·문제 요소 클릭 → 가이드 읽고 원칙 선택 → 디자인 수정안 작성. 약 25분. 학생은 정답 없이 검수 완료 → 원칙 분석 완료 → 수정안 적용 → 보고서 제출까지 스스로 마칩니다. 정답·해설은 보고서를 받은 뒤 공개합니다.",
      status: `단계: ${PHASE_KO[phaseOf(2)]}`, done: () => phaseAtLeast(2, "ACTIVE"), ready: () => phaseOf(2) === "ANNOUNCED", action: { label: "검수 시작 열기", fn: () => setPhase(2, "ACTIVE") }, tools: true },
    { title: "검수 보고서 검토·승인", desc: "팀별 검수 보고서를 읽고 승인하거나 보완을 요청합니다.", status: `제출 ${s2.submitted}/${s2.teams}팀 · 승인 ${s2.approved} · 대기 ${s2.pending}`, done: () => s2.submitted > 0 && s2.pending === 0, ready: () => phaseOf(2) === "ACTIVE", action: goTab("review", s2.pending ? `검토 대기 ${s2.pending}건 보기` : "보고서 검토 탭"), manualDone: true },
    { title: "TASK-002 해설·정답 공개", desc: "보고서를 받은 뒤 공개합니다. 검수 지점의 정답(사용성 문제/단순 차이)과 원칙 연결 결과, 수정 선택지 평가가 모든 팀의 디자인 도구에 표시되고 해설이 프로젝터에 뜹니다. 공개 후 팀별 발표·토론을 진행하세요.",
      status: T.events.some((e) => e.type === "answers") ? "공개됨" : "미공개", done: () => T.events.some((e) => e.type === "answers"), ready: () => phaseOf(2) === "ACTIVE", action: { label: "해설·정답 공개", fn: () => publishDebrief(2) } },
    { title: "공식 서비스에 디자인 반영", desc: "회사의 TICKET ON에 어떤 수정안을 반영할지 정합니다. 디자인팀 시안(v4) 또는 특정 팀의 수정안을 고르면 모든 팀의 TICKET ON 화면이 바뀝니다. 기능 오류는 그대로 남습니다.",
      status: T.pub.officialService && T.pub.officialService.design ? `반영됨 (${T.pub.officialService.source})` : "미반영", done: () => !!(T.pub.officialService && T.pub.officialService.design), ready: () => true, official: true },
    { title: "TASK-002 종료", desc: "업무를 종료 상태로 표시합니다.", status: `단계: ${PHASE_KO[phaseOf(2)]}`, done: () => phaseOf(2) === "COMPLETED", ready: () => phaseAtLeast(2, "ACTIVE"), action: { label: "종료 처리", fn: () => setPhase(2, "COMPLETED") } },
    { title: "완료 후 대화 · 예매 버튼 이상", desc: "한사원이 수정된 화면을 반기고, 이대리가 '예매 버튼 눌러보셨어요?' → '왜 안 눌리지?'. 디자인이 공식 반영된 순간부터 모든 팀의 TICKET ON에서 예매하기 버튼이 눌러도 반응이 없습니다. 학생들이 직접 눌러 보게 하세요.", ...ch("TASK-002 완료 후 · 예매 버튼 이상") },
    { title: "TASK-003 배정", desc: "세 번째 업무 카드(프런트엔드 오류 조사)가 도착합니다.", ...ch("TASK-003 배정") },
    { title: "TASK-003 조사 시작", desc: "학생 흐름: TICKET ON에서 오류 재현 기록 → 개발자 도구에서 콘솔·HTML·JS 조사(단서 수집) → reservation.js 수정·테스트 → TICKET ON 재테스트 2회 → 오류 수정 보고서. 약 25~30분. 막히면 힌트(콘솔→요소→이름 비교→이벤트)를 순서대로 공개하세요.",
      status: `단계: ${PHASE_KO[phaseOf(3)]}`, done: () => phaseAtLeast(3, "ACTIVE"), ready: () => phaseOf(3) === "ANNOUNCED", action: { label: "조사 시작 열기", fn: () => setPhase(3, "ACTIVE") }, tools: true },
    { title: "오류 수정 보고서 검토·승인", desc: "팀별 코드 수정 결과(변경 줄·테스트 결과·재테스트 횟수)와 서술 답안을 보고 승인하거나 보완을 요청합니다.", status: `제출 ${s3.submitted}/${s3.teams}팀 · 승인 ${s3.approved} · 대기 ${s3.pending}`, done: () => s3.submitted > 0 && s3.pending === 0, ready: () => phaseOf(3) === "ACTIVE", action: goTab("review", s3.pending ? `검토 대기 ${s3.pending}건 보기` : "보고서 검토 탭"), manualDone: true },
    { title: "TASK-003 해설 공개", desc: "원인(id 불일치 → null → TypeError → 리스너 미등록)과 수정 방법, 교훈을 모든 팀과 프로젝터에 공개합니다. 발표·토론을 진행하세요.", status: T.events.some((e) => e.type === "debrief" && e.task === 3) ? "공개됨" : "미공개", done: () => T.events.some((e) => e.type === "debrief" && e.task === 3), ready: () => phaseAtLeast(3, "ACTIVE"), action: { label: "해설 공개", fn: () => publishDebrief(3) }, manualDone: true },
    { title: "공식 서비스에 수정 반영", desc: "검토가 끝나면 예매하기 버튼 수정을 공식 TICKET ON에 반영합니다. 그 전까지는 각 팀이 자기 테스트 환경에서만 고친 버튼을 볼 수 있습니다.", status: T.pub.officialService && T.pub.officialService.reserveFixed ? "반영됨" : "미반영", done: () => !!(T.pub.officialService && T.pub.officialService.reserveFixed), ready: () => true, action: { label: "예매 버튼 수정 공식 반영", fn: applyOfficialFix } },
    { title: "TASK-003 종료", desc: "업무를 종료 상태로 표시합니다.", status: `단계: ${PHASE_KO[phaseOf(3)]}`, done: () => phaseOf(3) === "COMPLETED", ready: () => phaseAtLeast(3, "ACTIVE"), action: { label: "종료 처리", fn: () => setPhase(3, "COMPLETED") } },
    { title: "완료 후 대화 · 결제 테스트", desc: "'이제 예매 버튼 정상 동작하네요!' → '결제까지 테스트해 볼까요?'. 학생들이 TICKET ON에서 좌석 선택 후 결제 확인에서 결제하기를 눌러 보게 하세요(여전히 무응답, 두 번째 클릭에 중복 요청 409).", ...ch("TASK-003 완료 후 · 결제 테스트") },
    { title: "결제 대참사 사건 공개", desc: "'결제 요청 중...' → 한사원 '계속 처리 중이라고만 나오는데요?' → 이대리 '같은 결제 요청이 세 번 들어왔습니다' → '화면에는 결제 완료라고 뜨는데요?' → 김팀장 고객사 전화. 학생들이 TICKET ON에서 결제하기를 눌러 보게 하세요.", ...ch("결제 대참사 사건") },
    { title: "TASK-004 배정", desc: "긴급 업무 카드 '결제 대참사'가 도착합니다. 학생은 [업무 확인]으로 내용과 첨부(payment.js, 요청 로그, 테스트 케이스, 결제 UI)를 봅니다.", ...ch("TASK-004 배정") },
    { title: "TASK-004 조사 시작", desc: "학생 흐름: A 결제 오류 재현(시나리오 A/B/C) → B 요청 로그 조사(개발자 도구 Network) → C 결제 UI 수정안(상태별 안내) → D payment.js 수정·테스트(처리 중 가드·멱등성 키·결과 분기) → E QA 5항목 → F 보고서. 약 35~40분. UI만 또는 코드만 고치면 QA가 통과하지 않습니다. 힌트(로그→UX→결과→설계) 순서로 공개하세요.",
      status: `단계: ${PHASE_KO[phaseOf(4)]}`, done: () => phaseAtLeast(4, "ACTIVE"), ready: () => phaseOf(4) === "ANNOUNCED", action: { label: "조사 시작 열기", fn: () => setPhase(4, "ACTIVE") }, tools: true },
    { title: "결제 보고서 검토·승인", desc: "팀별 UI 선택·코드 수정 줄·QA 결과(자동 첨부)와 서술 답안(발견 문제·UX 문제·개발 문제·추가 확인)을 보고 승인하거나 보완을 요청합니다.", status: `제출 ${s4.submitted}/${s4.teams}팀 · 승인 ${s4.approved} · 대기 ${s4.pending}`, done: () => s4.submitted > 0 && s4.pending === 0, ready: () => phaseOf(4) === "ACTIVE", action: goTab("review", s4.pending ? `검토 대기 ${s4.pending}건 보기` : "보고서 검토 탭"), manualDone: true },
    { title: "TASK-004 해설 공개", desc: "원인(클라이언트 가드 없음·서버 멱등성 없음·결과 미분기·상태 안내 없음)과 수정 방법, UI 선택지 평가(권장/주의/비권장)를 모든 팀과 프로젝터에 공개합니다. 학생 결제 UI 편집기에 평가가 표시됩니다.", status: T.events.some((e) => e.type === "debrief" && e.task === 4) ? "공개됨" : "미공개", done: () => T.events.some((e) => e.type === "debrief" && e.task === 4), ready: () => phaseAtLeast(4, "ACTIVE"), action: { label: "해설·평가 공개", fn: () => publishDebrief(4) } },
    { title: "공식 서비스에 결제 수정 반영", desc: "검토가 끝나면 결제 처리 수정(가드·멱등성·분기)과 권장 결제 UI를 공식 TICKET ON에 반영합니다. 모든 팀의 결제 화면이 정상 동작하게 됩니다.", status: T.pub.officialService && T.pub.officialService.payFixed ? "반영됨" : "미반영", done: () => !!(T.pub.officialService && T.pub.officialService.payFixed), ready: () => true, action: { label: "결제 수정 공식 반영", fn: applyOfficialPayFix } },
    { title: "TASK-004 종료", desc: "업무를 종료 상태로 표시합니다.", status: `단계: ${PHASE_KO[phaseOf(4)]}`, done: () => phaseOf(4) === "COMPLETED", ready: () => phaseAtLeast(4, "ACTIVE"), action: { label: "종료 처리", fn: () => setPhase(4, "COMPLETED") } },
    { title: "엔딩 대화 · 배포 기록 단서", desc: "'이제 결제 요청 정상 처리됩니다!' → 이대리 '왜 운영 서버에는 다른 코드가 올라가 있었을까요?' → 한사원 '디자인도 마찬가지였어요' → 시스템 '배포 기록 불일치 발견' → 김팀장 '그거 제가 어제 배포했는데요?' → TASK-005 수상한 배포 기록 예고(미구현).", ...ch("TASK-004 엔딩 · 배포 기록 단서") },
    { title: "TASK-005 사건 공개 · 배포 파일 추궁", desc: "이대리 '어떤 파일로 배포하셨는지 확인할 수 있을까요?' → 김팀장 '파일 이름에 최종이라고 적혀 있었는데요' → 시스템 '버전 불일치 발견' → '이것도 조사해 주실 수 있을까요?'", ...ch("TASK-005 사건 · 배포 파일 추궁") },
    { title: "TASK-005 배정", desc: "긴급 조사 업무 카드 '수상한 배포 기록'이 도착합니다. 첨부: 공유 폴더·디자인 이력·Git 기록·배포 이력·QA·지난 대화·가이드.", ...ch("TASK-005 배정") },
    { title: "TASK-005 조사 시작", desc: "학생 흐름: A 공유 폴더 조사(파일 상세·이상 기록) → B 디자인 이력·Git 기록 + 조사 질문 4개 → C DAYEON DEPLOY 배포 이력·QA·지난 대화 대조, 증거 수집 → D 타임라인 재구성·검증 → E 조사 보고서. 약 20~25분. 힌트(디자인→개발→환경→배포) 순서로 공개하세요.",
      status: `단계: ${PHASE_KO[phaseOf(5)]}`, done: () => phaseAtLeast(5, "ACTIVE"), ready: () => phaseOf(5) === "ANNOUNCED", action: { label: "조사 시작 열기", fn: () => setPhase(5, "ACTIVE") }, tools: true },
    { title: "TASK-005 조사 보고서 검토·승인", desc: "팀별 버전 불일치·타임라인(자동)·원인·예방 실패·재발 방지·증거를 보고 승인하거나 보완을 요청합니다. 재발 방지 대책은 여러 합리적 답을 허용하세요.", status: `제출 ${s5.submitted}/${s5.teams}팀 · 승인 ${s5.approved} · 대기 ${s5.pending}`, done: () => s5.submitted > 0 && s5.pending === 0, ready: () => phaseOf(5) === "ACTIVE", action: goTab("review", s5.pending ? `검토 대기 ${s5.pending}건 보기` : "보고서 검토 탭"), manualDone: true },
    { title: "TASK-005 해설 공개", desc: "디자인 v2/v4 차이, 커밋·빌드 관계, 테스트 빌드와 운영 빌드의 차이, 오래된 빌드가 선택된 경위, 확인 절차 부재를 모든 팀과 프로젝터에 공개합니다.", status: T.events.some((e) => e.type === "debrief" && e.task === 5) ? "공개됨" : "미공개", done: () => T.events.some((e) => e.type === "debrief" && e.task === 5), ready: () => phaseAtLeast(5, "ACTIVE"), action: { label: "해설 공개", fn: () => publishDebrief(5) } },
    { title: "TASK-005 종료", desc: "업무를 종료 상태로 표시합니다.", status: `단계: ${PHASE_KO[phaseOf(5)]}`, done: () => phaseOf(5) === "COMPLETED", ready: () => phaseAtLeast(5, "ACTIVE"), action: { label: "종료 처리", fn: () => setPhase(5, "COMPLETED") } },
    { title: "사건의 진실 공개 · TASK-006 예고", desc: "이대리 '...찾았습니다' → 'v1.0.4 vs v1.0.2' → 김팀장 '최종이라고 적힌 폴더에서...' → 시스템 [사고 조사 완료] → '오늘 오후 6시 고객사 시연' → TASK-006 예고.", ...ch("TASK-005 엔딩 · 사건의 진실") },
    ...(typeof guideSteps6 === "function" ? guideSteps6(ch, goTab) : []),
    { title: "엔딩 공개", desc: "프로젝터에 엔딩 화면이 표시됩니다.", status: T.events.some((e) => e.type === "ending") ? "공개됨" : "미공개", done: () => T.events.some((e) => e.type === "ending"), ready: () => true, action: { label: "엔딩 공개", fn: publishEnding } },
  ];
}
function guideTab() {
  const steps = buildGuide();
  // 건너뛰기 키는 단계 제목에서 만든다. 제목이 겹치면 뒤 단계에 번호를 붙여 서로 다른 키가 되게 한다
  // (예전에 TASK-001·TASK-005 의 "조사 보고서 검토·승인" 제목이 같아, 하나를 건너뛰면 둘이 함께 완료 처리되어 가이드가 TASK-005 해설로 건너뛰는 문제가 있었음)
  const seen = {};
  steps.forEach((st) => { seen[st.title] = (seen[st.title] || 0) + 1; st.skipId = seen[st.title] > 1 ? `${st.title} (${seen[st.title]})` : st.title; });
  const skipKey = (t) => t.replace(/[.$#\[\]\/ ]/g, "_");
  const skipped = { ...guideSkipped, ...((T.priv && T.priv.guideSkipped) || {}) };   // 건너뛴 단계는 DB(private)에 저장되어 새로고침 후에도 유지
  steps.forEach((st) => { if (st.manualDone) { const orig = st.done; st.done = () => orig() || !!skipped[skipKey(st.skipId)]; } });
  // 뒤 단계가 이미 끝났으면 앞의 수동 단계(검토·승인 등)는 지나간 것으로 본다 → 가이드가 앞 단계에 멈추지 않음
  const doneFlags = steps.map((st) => !!st.done());
  const lastDone = doneFlags.lastIndexOf(true);
  let current = doneFlags.findIndex((d, i) => !d && i > lastDone);
  if (current < 0) current = steps.length;
  const paused = T.pub.status === "paused";
  const items = steps.map((st, i) => {
    const state = i < current ? "done" : i === current ? "current" : "todo";
    const passedOver = i < current && !doneFlags[i];
    const ready = st.ready ? st.ready() : true;
    let actions = "";
    if (state === "current") {
      if (st.official) {
        actions = `<div class="btns"><button class="primary" data-official="v4">디자인팀 최종 시안(v4) 반영</button>${Object.entries(T.teamData).filter(([, d]) => d.state && d.state.task2 && d.state.task2.design).map(([tid]) => `<button data-official="${tid}">${esc(T.teams[tid] ? T.teams[tid].name : tid)} 팀 수정안 반영</button>`).join("")}</div>`;
      } else if (st.action) {
        actions = `<div class="btns"><button class="primary big-btn" data-guide="${i}" ${ready && !T.busy ? "" : "disabled"}>${esc(st.action.label)}${st.count ? ` (${st.count}개)` : ""}</button>${st.manualDone ? `<button data-guide-skip="${esc(skipKey(st.skipId))}">이 단계 건너뛰고 다음으로</button>` : ""}</div>${!ready ? `<p class="help">이 단계는 아직 실행할 수 없습니다. 앞 단계가 끝났는지 확인하세요.</p>` : ""}`;
      }
      if (st.tools) actions += `<div class="btns tools"><button data-pause="1">${paused ? "▶ 진행 재개" : "⏸ 일시정지 (토론 시간)"}</button><button data-tab="story">힌트 공개하러 가기</button><button data-tab="teams">학생 현황 보기</button></div>`;
    }
    return `<li class="g-step ${state}">
      <div class="g-no">${state === "done" ? "✓" : i + 1}</div>
      <div class="g-body">
        <div class="g-title">${esc(st.title)}${st.status ? `<span class="g-status">${esc(st.status)}</span>` : ""}${passedOver ? `<span class="g-status">지나감</span>` : ""}</div>
        ${state === "current" ? `<p class="g-desc">${esc(st.desc)}</p>${actions}` : state === "todo" ? `<p class="g-desc dim">${esc(st.desc)}</p>` : ""}
      </div>
    </li>`;
  }).join("");
  return `<div class="guide">
    <section class="card g-head">
      <div><h3>수업 진행 가이드</h3><p class="help">위에서 아래로 한 단계씩 진행합니다. 파란 버튼이 지금 할 일입니다. 세부 조작(메시지 한 개씩 공개, 단계 직접 변경)은 '스토리 진행' 탭에 있습니다.</p></div>
      <div class="g-summary"><b>${current < steps.length ? `${current + 1}단계 / ${steps.length}` : "모든 단계 완료"}</b><span>${paused ? "⏸ 일시정지 중" : "▶ 진행 중"} · 게임 시각 ${fmtClock(T.pub.gameTime)}</span></div>
    </section>
    <ol class="g-steps">${items}</ol>
  </div>`;
}
let guideSkipped = {};

function nextChapterCount() {
  const i = T.priv ? (T.priv.nextIndex || 0) : 0;
  if (i >= STORY.length) return 0;
  const ch = STORY[i].chapter;
  let n = 0; while (i + n < STORY.length && STORY[i + n].chapter === ch) n++;
  return n;
}
async function publishHint(h) {
  if (T.busy) return; T.busy = true; render();
  try { await publishEvent({ type: "hint", hintId: h.id, text: h.text, step: h.step }); await Sync.db.update(sp("private"), { [`hints/${h.id}`]: true }); }
  finally { T.busy = false; render(); }
}
async function publishDebrief(no) {
  if (T.busy) return; T.busy = true; render();
  try {
    if (no === 1) {
      const text = TEACHER_NOTES.groups.map((g) => `• ${g.label} (${g.count}건): ${g.note}`).join("\n") + "\n\n기대 결론: " + TEACHER_NOTES.expected;
      await publishEvent({ type: "debrief", task: 1, title: "TASK-001 해설", text });
    } else if (no === 2) {
      const text = TASK2_ANSWERS.teacherNotes.issues + "\n\n" + TASK2_ANSWERS.teacherNotes.recommended;
      await publishEvent({ type: "answers", task: 2, answers: { spots: TASK2_ANSWERS.spots, options: TASK2_ANSWERS.options } });
      await publishEvent({ type: "debrief", task: 2, title: "TASK-002 해설", text });
    } else if (no === 6) {
      await publishEvent({ type: "debrief", task: 6, title: "TASK-006 학습 정리", text: TASK6_ANSWERS.debrief });
    } else if (no === 5) {
      await publishEvent({ type: "debrief", task: 5, title: "TASK-005 해설", text: TASK5_ANSWERS.debrief });
    } else if (no === 4) {
      await publishEvent({ type: "answers", task: 4, answers: { ui: TASK4_ANSWERS.ui } });
      await publishEvent({ type: "debrief", task: 4, title: "TASK-004 해설", text: TASK4_ANSWERS.debrief });
    } else {
      await publishEvent({ type: "debrief", task: 3, title: "TASK-003 해설", text: TASK3_ANSWERS.debrief });
    }
    // TASK-001 은 해설 공개 = 조사 마감. TASK-002 는 정답 공개 후에도 보고서를 제출해야 하므로 단계를 유지
    if (no === 1) await Sync.db.update(sp("public"), { [`tasks/t${no}/status`]: "DEBRIEF" });
  } finally { T.busy = false; render(); }
}
async function setPhase(no, status) {
  await Sync.db.update(sp("public"), { [`tasks/t${no}/status`]: status, currentTask: no });
}
async function applyOfficial(design, source) {
  await Sync.db.update(sp("public"), { officialService: { design, source, appliedAt: Date.now() } });
  await publishEvent({ type: "official", text: `TICKET ON 공식 서비스에 디자인 수정이 반영되었습니다. (${source})`, design });
}
async function applyOfficialFix() {
  await Sync.db.update(sp("public"), { "officialService/reserveFixed": true, "officialService/fixedAt": Date.now() });
  await publishEvent({ type: "official", text: "TICKET ON 공식 서비스에 예매하기 버튼 수정(reservation.js 요소 선택자)이 반영되었습니다. 모든 팀의 예매하기 버튼이 정상 동작합니다." });
}
const OFFICIAL_PAY_UI = { btnLabel: "amount", processing: "spinner", lock: "disabled", success: "detail", fail: "reasonHelp", retry: "retryHelp", pending: "waitCheck" };
async function applyOfficialPayFix() {
  await Sync.db.update(sp("public"), { "officialService/payFixed": true, "officialService/payFixedAt": Date.now(), "officialService/payUi": OFFICIAL_PAY_UI });
  await publishEvent({ type: "official", text: "TICKET ON 공식 서비스에 결제 처리 수정(처리 중 가드 · 멱등성 키 · 결과 분기)과 결제 상태별 UI가 반영되었습니다. 모든 팀의 결제가 정상 동작합니다." });
}
async function publishEnding() {
  if (!confirm("최종 엔딩을 공개할까요?")) return;
  await publishEvent({ type: "ending", title: "오늘의 퇴근", text: "신입사원 이서연의 첫 출근이 끝났습니다. 디자인과 개발, 그리고 고객 사이에서 문제를 찾아낸 하루였습니다. 수고하셨습니다!" });
}

// ---------- 검토 ----------
async function review(teamId, no, status, locked) {
  const note = (T.note[`${teamId}-${no}`] || "").trim();
  T.note[`${teamId}-${no}`] = "";   // DB 갱신 알림으로 화면이 먼저 다시 그려지므로, 그 전에 비워야 메모칸이 비워진다
  await Sync.db.update(sp(`teamData/${teamId}/review/t${no}`), { status, note, locked: !!locked, at: Date.now(), by: Sync.auth.uid });
  render();
}

// =====================================================================
//  렌더링
// =====================================================================
// 화면은 DB 알림(팀 접속 신호 lastSeen 20초마다, 팀 상태 저장 등)마다 통째로 다시 그려진다.
// 그대로 두면 교사가 메모를 입력하는 도중 textarea 가 새 요소로 바뀌어 포커스·커서·한글 조합 중인 글자가 사라진다.
// → 한글 조합 중에는 다시 그리기를 미루고, 그 외에는 입력 중인 칸의 값·커서·포커스를 다시 그린 뒤 되살린다.
const FIELD_SEL = "textarea, select, input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=submit])";
let imeComposing = false, renderDeferred = false;
function fieldSelector(el) {
  const a = [...el.attributes].find((x) => x.name.startsWith("data-"));
  if (a) return `${el.tagName.toLowerCase()}[${a.name}="${a.value.replace(/"/g, '\\"')}"]`;
  if (el.id) return `#${el.id}`;
  return null;
}
function captureFocus() {
  const el = document.activeElement;
  if (!el || !app.contains(el) || !el.matches(FIELD_SEL)) return null;
  const sel = fieldSelector(el); if (!sel) return null;
  const text = el.tagName === "TEXTAREA" || (el.tagName === "INPUT" && typeof el.selectionStart === "number");
  return { sel, value: el.value, text, start: text ? el.selectionStart : 0, end: text ? el.selectionEnd : 0, scrollTop: el.scrollTop, pageY: window.scrollY };
}
function restoreFocus(k) {
  if (!k) return;
  const el = app.querySelector(k.sel); if (!el || el.disabled) return;
  if (el.value !== k.value) el.value = k.value;   // 입력 중이던 값이 우선 (다시 그리는 사이에 바뀐 상태보다 교사가 치고 있던 글이 중요)
  el.focus({ preventScroll: true });
  if (k.text) { try { el.setSelectionRange(k.start, k.end); } catch (e) { /* 지원하지 않는 타입 */ } }
  el.scrollTop = k.scrollTop;
  window.scrollTo(window.scrollX, k.pageY);
}
app.addEventListener("compositionstart", () => { imeComposing = true; });
app.addEventListener("compositionend", () => { imeComposing = false; if (renderDeferred) { renderDeferred = false; setTimeout(render, 0); } });
function render() {
  if (imeComposing) { renderDeferred = true; return; }
  const keep = captureFocus();
  const extra = typeof editorSnapshot === "function" ? editorSnapshot() : null;
  try { renderInner(); } catch (e) { console.error("render error", e); const el = document.getElementById("render-error"); if (!el) { const d = document.createElement("div"); d.id = "render-error"; d.style.cssText = "position:fixed;left:12px;bottom:12px;background:#fee2e2;color:#991b1b;padding:8px 12px;border-radius:8px;font-size:12px;z-index:999"; d.textContent = "화면 그리기 오류: " + (e.message || e) + " — 새로고침해 주세요"; document.body.appendChild(d); } }
  if (extra && typeof editorRestore === "function") editorRestore(extra);
  restoreFocus(keep);
}
function renderInner() {
  if (!T.user || T.user.isAnonymous) return renderLogin();
  if (!T.contentReady) return renderContentSetup();
  if (!T.sid) return renderSessions();
  renderDashboard();
}

function renderContentSetup() {
  app.innerHTML = `<div class="shell">
    ${headerHTML()}
    <div class="page">
      <section class="card">
        <h3>시나리오 콘텐츠 ${T.contentError ? "" : "불러오는 중…"}</h3>
        ${T.contentError ? `<p class="help" style="color:#dc2626">${esc(T.contentError)}</p>` : ""}
        <p class="help">미공개 스토리·힌트·정답은 교사만 읽을 수 있는 데이터베이스 경로(content/private)에 저장됩니다. 아직 등록되지 않았다면 프로젝트 폴더의 <b>private/data-private.js</b> 파일을 골라 한 번만 등록하세요. 이후에는 어느 PC에서든 로그인만 하면 됩니다.</p>
        <div class="row"><input type="file" id="content-file" accept=".js,.json"><button class="primary" id="content-register">DB에 등록</button></div>
        <p class="help">시나리오 파일을 수정했다면 같은 방법으로 다시 등록하면 덮어씁니다.</p>
      </section>
    </div></div>`;
  bindHeader();
  const btn = document.getElementById("content-register");
  if (btn) btn.addEventListener("click", async () => {
    const f = document.getElementById("content-file").files[0];
    if (!f) { alert("private/data-private.js 파일을 선택하세요."); return; }
    try {
      const text = await f.text();
      const obj = f.name.endsWith(".json") ? JSON.parse(text) : parsePrivateScript(text);
      if (!obj.TIMELINE || !obj.TASK2_ANSWERS) throw new Error("시나리오 파일 형식이 아닙니다.");
      await registerContent(obj);
      flash("콘텐츠를 등록했습니다.");
    } catch (e) { alert("등록 실패: " + (e.message || e)); }
  });
}

function renderLogin() {
  app.innerHTML = `<div class="login">
    <div class="login-card">
      <div class="logo">D</div>
      <h1>DAYEON 교사 대시보드</h1>
      <p class="mode">${esc(SyncUtil.modeLabel())}</p>
      ${Sync.mode === "local" ? `<p class="hint">로컬 시뮬레이션 모드: 아무 이메일/비밀번호로 로그인됩니다. 실제 수업에서는 Firebase 설정(js/firebase-config.js)과 교사 계정 등록이 필요합니다. (SETUP.md 참고)</p>` : `<p class="hint">Firebase Authentication 이메일/비밀번호 계정으로 로그인합니다. 교사 권한은 데이터베이스의 teachers/{uid} 로 확인합니다.</p>`}
      <form id="login-form"><input id="email" type="email" placeholder="교사 이메일" required value="${Sync.mode === "local" ? "teacher@dayeon.test" : ""}"><input id="pw" type="password" placeholder="비밀번호" required value="${Sync.mode === "local" ? "demo" : ""}"><button type="submit">로그인</button></form>
    </div></div>`;
  document.getElementById("login-form").addEventListener("submit", (e) => { e.preventDefault(); login(document.getElementById("email").value, document.getElementById("pw").value); });
}

function renderSessions() {
  const list = Object.entries(T.sessions).sort((a, b) => b[1].createdAt - a[1].createdAt);
  app.innerHTML = `<div class="shell">
    ${headerHTML()}
    <div class="page">
      <h2>수업 세션</h2>
      <form id="new-session" class="row"><input id="title" placeholder="수업 이름 (예: 2학년 3반 UI/UX 협업)" ><button type="submit" class="primary">새 수업 세션 만들기</button></form>
      <table class="tbl"><thead><tr><th>코드</th><th>이름</th><th>상태</th><th>생성</th><th></th></tr></thead><tbody>
        ${list.map(([sid, s]) => `<tr><td class="code">${esc(s.code)}</td><td>${esc(s.title)}</td><td>${esc(s.status)}</td><td>${new Date(s.createdAt).toLocaleString("ko-KR")}</td><td><button data-open="${sid}">열기</button></td></tr>`).join("") || `<tr><td colspan="5" class="empty">아직 만든 수업이 없습니다.</td></tr>`}
      </tbody></table>
    </div></div>`;
  document.getElementById("new-session").addEventListener("submit", (e) => { e.preventDefault(); createSession(document.getElementById("title").value.trim()); });
  app.querySelectorAll("[data-open]").forEach((b) => b.addEventListener("click", () => selectSession(b.dataset.open)));
}

function headerHTML() {
  return `<header class="hdr">
    <div class="hdr-brand"><span class="logo">D</span><b>DAYEON 교사 대시보드</b><small>${esc(SyncUtil.modeLabel())}</small></div>
    ${T.pub ? `<div class="hdr-session"><span class="code">코드 <b>${esc(T.pub.code)}</b></span><span>${esc(T.pub.title)}</span><span class="st ${T.pub.status}">${{ running: "진행 중", paused: "일시정지", ended: "종료" }[T.pub.status]}</span><span>게임 시각 <b>${fmtClock(T.pub.gameTime)}</b></span><a href="display.html?sid=${T.sid}" target="_blank" class="link">빔프로젝터 화면 열기 ↗</a></div>` : ""}
    <div class="hdr-right"><span class="conn ${Sync.connection.online ? "on" : "off"}">${Sync.connection.online ? "● 연결됨" : "○ 연결 끊김"}</span>${T.sid ? `<button data-act="sessions">수업 목록</button>` : ""}<button data-act="logout">로그아웃</button></div>
  </header>${T.msg ? `<div class="flash">${esc(T.msg)}</div>` : ""}`;
}

function renderDashboard() {
  if (!T.pub) { app.innerHTML = `<div class="shell">${headerHTML()}<div class="page">불러오는 중…</div></div>`; bindHeader(); return; }
  const tabs = [["guide", "진행 가이드"], ["story", "스토리 진행"], ["teams", "학생 현황"], ["review", "보고서 검토"], ["notes", "교사용 해설"], ["eval", "사원평가"], ["session", "수업 관리"]];
  const pendingN = Object.values(T.requests).filter((r) => r.status === "pending").length;
  const reviewN = Object.entries(T.teamData).reduce((n, [tid, d]) => n + [1, 2].filter((no) => d.submissions && d.submissions["t" + no] && (!(d.review && d.review["t" + no]) || d.review["t" + no].status === "pending")).length, 0);
  app.innerHTML = `<div class="shell">
    ${headerHTML()}
    <nav class="tabs">${tabs.map(([k, l]) => `<button class="${T.tab === k ? "on" : ""}" data-tab="${k}">${l}${k === "teams" && pendingN ? `<i>${pendingN}</i>` : ""}${k === "review" && reviewN ? `<i>${reviewN}</i>` : ""}</button>`).join("")}</nav>
    <div class="page">${({ guide: guideTab, story: storyTab, teams: teamsTab, review: reviewTab, notes: notesTab, eval: evalTab, session: sessionTab })[T.tab]()}</div>
  </div>`;
  bindHeader();
  app.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => { T.tab = b.dataset.tab; render(); }));
  bindTab();
}
function bindHeader() {
  app.querySelectorAll("[data-act]").forEach((b) => b.addEventListener("click", () => {
    if (b.dataset.act === "logout") { selectSession(null); T.contentReady = false; Sync.auth.signOut(); }
    if (b.dataset.act === "sessions") selectSession(null);
  }));
}

// ---------- 스토리 탭 ----------
function storyTab() {
  const i = T.priv ? (T.priv.nextIndex || 0) : 0;
  const next = STORY[i];
  const chapterN = nextChapterCount();
  const published = T.events.filter((e) => ["message", "system", "task", "invite"].includes(e.type));
  const curTask = T.pub.currentTask || 0;
  const taskRows = [1, 2, 3, 4, 5, 6].map((no) => {
    const st = phaseOf(no);
    return `<div class="task-row"><b>TASK-00${no}</b><span class="phase ${st}">${PHASE_KO[st]}</span>
      <div class="phase-btns">${PHASES.map((p) => `<button data-phase="${no}:${p}" class="${st === p ? "on" : ""}" ${p === "LOCKED" || p === "ANNOUNCED" ? "disabled" : ""}>${PHASE_KO[p]}</button>`).join("")}</div>
      <button data-debrief="${no}" ${st === "LOCKED" ? "disabled" : ""}>해설 공개${no === 2 ? " (+정답)" : ""}</button></div>`;
  }).join("");
  const hints = [...HINTS.map((h) => ({ ...h, task: "TASK-001" })), ...TASK2_ANSWERS.hints.map((h) => ({ ...h, task: "TASK-002" })), ...TASK3_ANSWERS.hints.map((h) => ({ ...h, task: "TASK-003" })), ...TASK4_ANSWERS.hints.map((h) => ({ ...h, task: "TASK-004" })), ...TASK5_ANSWERS.hints.map((h) => ({ ...h, task: "TASK-005" })), ...TASK6_ANSWERS.hints.map((h) => ({ ...h, task: "TASK-006" }))];
  const used = (T.priv && T.priv.hints) || {};
  return `
    <div class="cols">
      <section class="card">
        <h3>다음 공개 항목 <small>${i}/${STORY.length} 공개됨</small></h3>
        ${next ? `<div class="preview"><div class="chapter">${esc(next.chapter)}</div>${previewHTML(next)}</div>` : `<div class="preview done">모든 스토리를 공개했습니다.</div>`}
        <div class="btns">
          <button class="primary" data-pub="1" ${!next || T.busy ? "disabled" : ""}>메시지 한 개 공개</button>
          <button data-pub="${chapterN}" ${!next || T.busy ? "disabled" : ""}>이 묶음 끝까지 공개 (${chapterN}개)</button>
          <button data-pubtask="1" ${!next || next.type !== "task" || T.busy ? "disabled" : ""}>신규 업무 공개</button>
          <button data-pause="1">${T.pub.status === "paused" ? "▶ 진행 재개" : "⏸ 진행 일시정지"}</button>
        </div>
        <p class="help">공개는 교사가 누를 때만 일어납니다. 학생 화면은 공개된 메시지를 순서대로(입력 중 연출 포함) 표시합니다. 일시정지 중에는 게임 시각이 멈추고 학생 화면에 '진행 일시정지'가 표시됩니다.</p>
        <h4>다음 묶음 미리보기</h4>
        <ol class="upcoming">${STORY.slice(i, i + chapterN).map((it) => `<li>${previewHTML(it, true)}</li>`).join("") || "<li>-</li>"}</ol>
      </section>
      <section class="card">
        <h3>업무 단계 <small>현재 TASK-00${curTask || "-"}</small></h3>
        ${taskRows}
        <h4>힌트 공개 <small>학생에게 김팀장 DM으로 도착</small></h4>
        <ul class="hints">${hints.map((h) => `<li><span class="tag">${esc(h.task)} · ${esc(h.step)}</span><span>${esc(h.text)}</span><button data-hint="${h.id}" ${used[h.id] || T.busy ? "disabled" : ""}>${used[h.id] ? "공개됨" : "공개"}</button></li>`).join("")}</ul>
        <h4>공식 서비스 (TICKET ON)</h4>
        <p class="help">현재: ${T.pub.officialService && T.pub.officialService.design ? `수정 반영됨 (${esc(T.pub.officialService.source)})` : "운영 화면(v2) 그대로"}</p>
        <div class="btns"><button data-official="v4">디자인팀 최종 시안(v4) 반영</button>${Object.entries(T.teamData).filter(([, d]) => d.state && d.state.task2 && d.state.task2.design).map(([tid, d]) => `<button data-official="${tid}">${esc(T.teams[tid] ? T.teams[tid].name : tid)} 팀 수정안 반영</button>`).join("")}<button data-official="none">되돌리기(v2)</button></div>
        <h4>공식 수정 (TASK-003)</h4>
        <p class="help">현재: ${T.pub.officialService && T.pub.officialService.reserveFixed ? "예매하기 버튼 수정 반영됨" : "미반영 (팀별 테스트 환경에서만 동작)"}</p>
        <div class="btns"><button data-fix="1" ${T.pub.officialService && T.pub.officialService.reserveFixed ? "disabled" : ""}>예매 버튼 수정 공식 반영</button></div>
        <h4>공식 수정 (TASK-004)</h4>
        <p class="help">현재: ${T.pub.officialService && T.pub.officialService.payFixed ? "결제 처리 수정 + 권장 결제 UI 반영됨" : "미반영 (팀별 테스트 환경에서만 동작)"}</p>
        <div class="btns"><button data-fix="pay" ${T.pub.officialService && T.pub.officialService.payFixed ? "disabled" : ""}>결제 수정 공식 반영</button></div>
        <h4>엔딩</h4>
        <div class="btns"><button data-ending="1">최종 엔딩 공개</button></div>
      </section>
    </div>
    <section class="card">
      <h3>공개된 스토리 <small>${published.length}개</small></h3>
      <ol class="feed">${published.slice(-30).map((e) => `<li><span class="seq">#${e.seq}</span><span class="t">${fmtClock(e.at)}</span>${previewHTML(e, true)}</li>`).join("") || "<li>아직 공개된 메시지가 없습니다.</li>"}</ol>
    </section>`;
}
function previewHTML(it, compact = false) {
  if (it.type === "message") return `<div class="msg"><b>${esc(userName(it.from))}</b> <small>${esc(roomName(it.room))}</small><p>${esc(it.text)}</p></div>`;
  if (it.type === "system") return `<div class="msg sys"><small>시스템 · ${esc(roomName(it.room))}</small><p>${esc(it.text)}</p></div>`;
  if (it.type === "task") return `<div class="msg task"><b>업무 배정 #${it.task.no}</b><p>${esc(it.task.title)} · 마감 ${esc(it.task.due)}${it.task.priority ? ` · 우선순위 ${esc(it.task.priority)}` : ""}</p></div>`;
  if (it.type === "invite") return `<div class="msg sys"><b>채널 초대</b><p>#프로젝트-티켓온에 학생 팀 초대</p></div>`;
  if (it.type === "hint") return `<div class="msg hint"><b>힌트</b><p>${esc(it.text)}</p></div>`;
  if (it.type === "debrief") return `<div class="msg hint"><b>${esc(it.title)}</b><p>${esc(it.text).replace(/\n/g, "<br>")}</p></div>`;
  return `<div class="msg"><b>${esc(it.type)}</b></div>`;
}

// ---------- 학생 현황 탭 ----------
function teamsTab() {
  const reqs = Object.entries(T.requests).filter(([, r]) => r.status === "pending");
  const teams = Object.entries(T.teams);
  const now = Date.now();
  return `
    <section class="card">
      <h3>입장 요청 <small>${reqs.length}건</small></h3>
      ${reqs.length ? `<ul class="reqs">${reqs.map(([uid, r]) => `<li><b>${esc(r.teamName)}</b><small>${new Date(r.requestedAt).toLocaleTimeString("ko-KR")}</small><button class="primary" data-approve="${uid}">승인</button><button data-reject="${uid}">거절</button></li>`).join("")}</ul>` : `<p class="help">학생은 student.html 에서 수업 코드 <b>${esc(T.pub.code)}</b> 와 팀 이름을 입력해 요청합니다.</p>`}
    </section>
    <section class="card">
      <h3>참가 팀 <small>${teams.length}팀</small></h3>
      <table class="tbl"><thead><tr><th>팀</th><th>접속</th><th>현재 작업</th><th>TASK-001 조사</th><th>TASK-002 검수</th><th>TASK-003 디버깅</th><th>TASK-004 결제</th><th>TASK-005 조사</th><th>보고서</th><th></th></tr></thead><tbody>
      ${teams.map(([tid, t]) => {
        const d = T.teamData[tid] || {}; const s = d.state || {}; const t1 = s.task || {}; const t2 = s.task2 || {}; const t3 = s.task3 || {}; const t4 = s.task4 || {}; const t5 = s.task5 || {};
        const online = t.online && now - (t.lastSeen || 0) < 60000;
        const app = { work: "메신저", task: "업무 시스템", ticket: "TICKET ON", design: "디자인 검수", dev: "개발자 도구" }[s.currentApp] || "-";
        const rv = (no) => { const r = d.review && d.review["t" + no]; const sub = d.submissions && d.submissions["t" + no]; if (!sub) return "-"; return r ? ({ pending: "검토 대기", approved: "승인", returned: "보완 요청" }[r.status] || r.status) : "검토 대기"; };
        return `<tr><td><b>${esc(t.name)}</b></td><td><span class="dot ${online ? "on" : "off"}"></span>${online ? "온라인" : "오프라인"}<br><small>${t.lastSeen ? new Date(t.lastSeen).toLocaleTimeString("ko-KR") : ""}</small></td>
          <td>${app}</td>
          <td>${t1.started ? `문의 ${(t1.inquiriesOpened || []).length}/23 · 기록 ${(t1.reproduced || []).length}건${t1.ticketVisited ? " · 사이트 방문" : ""}` : "<small>미시작</small>"}</td>
          <td>${t2.started ? `발견 ${(t2.findings || []).length} · 원칙 ${t2.principlesChecked ? "확인" : "-"} · 수정 ${t2.designApplied ? "확정" : "-"}` : "<small>미시작</small>"}</td>
          <td>${t3.started ? `재현 ${(t3.reproductions || []).length} · 단서 ${(t3.clues || []).length} · 테스트 ${t3.codeTested ? (t3.codeFixed ? "<b style='color:#1f8a4c'>통과</b>" : "실패") : "-"} · 재테스트 ${(t3.retest || {}).passes || 0}/2` : "<small>미시작</small>"}</td>
          <td>${t4.started ? `재현 ${(t4.reproductions || []).length} · 요청 ${(t4.requests || []).length} · UI ${t4.uiApplied ? "<b style='color:#1f8a4c'>적용</b>" : "-"} · 코드 ${t4.codeTested ? (t4.codeOk ? "<b style='color:#1f8a4c'>통과</b>" : "실패") : "-"} · QA ${t4.qa ? `${t4.qa.passed}/${t4.qa.total}` : "-"}` : "<small>미시작</small>"}</td>
          <td>${t5.started ? `파일 ${(t5.filesViewed || []).length}/${TASK5.files.length} · 기록 ${(t5.fileNotes || []).length} · 증거 ${(t5.evidence || []).length} · 타임라인 ${(t5.timeline || {}).passed ? "<b style='color:#1f8a4c'>통과</b>" : ((t5.timeline || {}).attempts || 0) + "회"}` : "<small>미시작</small>"}</td>
          <td>T1 ${rv(1)}<br>T2 ${rv(2)}<br>T3 ${rv(3)}<br>T4 ${rv(4)}<br>T5 ${rv(5)}</td>
          <td><button data-team="${tid}">답안 보기</button><button data-remove="${tid}">내보내기</button></td></tr>`;
      }).join("") || `<tr><td colspan="10" class="empty">아직 승인된 팀이 없습니다.</td></tr>`}
      </tbody></table>
    </section>
    ${T.selectedTeam && T.teams[T.selectedTeam] ? teamDetailHTML(T.selectedTeam) : ""}`;
}
function teamDetailHTML(tid) {
  const t = T.teams[tid]; const d = T.teamData[tid] || {}; const s = d.state || {}; const t1 = s.task || {}; const t2 = s.task2 || {}; const t3 = s.task3 || {}; const t4 = s.task4 || {}; const t5 = s.task5 || {};
  const recs = (t1.reproduced || []).map((r) => `<li><b>${esc(r.screenLabel)}</b> <small>${esc(r.type)} · ${esc(r.time)}</small><br>${esc(r.found)}${r.expected ? `<br><i>기대: ${esc(r.expected)}</i>` : ""}</li>`).join("") || "<li>-</li>";
  const finds = (t2.findings || []).map((f) => { const sp = TASK2.spots.find((x) => x.id === f.spotId) || {}; const a = TASK2_ANSWERS.spots[f.spotId] || {}; return `<li><b>${esc(sp.label || f.spotId)}</b> <small>${a.issue ? "사용성 문제" : "단순 차이"}</small>${f.note ? `<br>${esc(f.note)}` : ""}${(t2.principles && t2.principles[f.spotId] || []).length ? `<br><i>원칙: ${esc((t2.principles[f.spotId] || []).map((id) => (TASK2.principles.find((p) => p.id === id) || {}).name).join(", "))}</i>` : ""}</li>`; }).join("") || "<li>-</li>";
  const design = t2.design ? TASK2.options.map((o) => { const c = o.choices.find((x) => x.id === t2.design[o.id]); const a = c && TASK2_ANSWERS.options[o.id][c.id]; return `<li>${esc(o.title)} → ${c ? `${esc(c.label)} <small>${a ? a.verdict : ""}</small>` : "-"}</li>`; }).join("") : "<li>-</li>";
  return `<section class="card">
    <h3>${esc(t.name)} 팀 답안 <button class="x" data-team="">닫기</button></h3>
    <div class="cols">
      <div><h4>확인한 고객 문의 ${(t1.inquiriesOpened || []).length}/23</h4><p class="small">${esc((t1.inquiriesOpened || []).map((id) => id.replace("CS-251019-", "CS-") + " (" + (INQUIRY_GROUPS[id] || "?") + ")").join(", ") || "-")}</p>
        <h4>이상 현상 기록 ${(t1.reproduced || []).length}건</h4><ul class="list">${recs}</ul></div>
      <div><h4>디자인 검수 목록 ${(t2.findings || []).length}건</h4><ul class="list">${finds}</ul><h4>디자인 수정 선택</h4><ul class="list">${design}</ul></div>
      <div><h4>오류 재현 기록 ${(t3.reproductions || []).length}건</h4><ul class="list">${(t3.reproductions || []).map((r) => `<li><b>${esc(r.screenLabel)}</b> <small>${esc(r.time)}</small><br>동작: ${esc(r.action || "")}<br>현상: ${esc(r.found)}${r.expected ? `<br><i>기대: ${esc(r.expected)}</i>` : ""}</li>`).join("") || "<li>-</li>"}</ul>
        <h4>조사 단서 ${(t3.clues || []).length}건</h4><ul class="list">${(t3.clues || []).map((c) => `<li><small>${esc(c.src)}</small><br><code>${esc(c.text)}</code></li>`).join("") || "<li>-</li>"}</ul></div>
      <div><h4>코드 수정 (reservation.js 1~2행)</h4><pre class="codebox">${esc((t3.fixedCode || (t3.code ? t3.code.split("\n").slice(0, 2).join("\n") : "")) || "(수정 없음)")}</pre>
        <p class="small">테스트: ${t3.codeTested ? (t3.codeFixed ? "통과" : "실패 · " + esc((t3.testResult || {}).summary || "")) : "미실행"}${t3.testRuns ? ` (${t3.testRuns}회)` : ""} · 재테스트 ${(t3.retest || {}).passes || 0}/2${(t3.retest || {}).count > (t3.retest || {}).passes ? ` (실패 ${(t3.retest.count - t3.retest.passes)}회)` : ""}</p></div>
      <div><h4>TASK-004 · 결제 오류 재현 ${(t4.reproductions || []).length}건</h4><ul class="list">${(t4.reproductions || []).map((r) => `<li><b>${esc(r.screenLabel)}</b> <small>${esc(r.time)}</small><br>동작: ${esc(r.action || "")}<br>현상: ${esc(r.found)}${r.expected ? `<br><i>기대: ${esc(r.expected)}</i>` : ""}${r.evidence ? `<br><small>증거: ${esc(r.evidence)}</small>` : ""}</li>`).join("") || "<li>-</li>"}</ul>
        <h4>결제 요청 로그 ${(t4.requests || []).length}건</h4><p class="small">${esc((t4.requests || []).map((r) => `#${r.no} ${r.status === 0 ? "T/O" : r.status ?? "…"} ${r.result}${r.charged ? "💳" : ""}`).join(" · ") || "-")}</p>
        <h4>조사 단서 ${(t4.clues || []).length}건</h4><ul class="list">${(t4.clues || []).map((c) => `<li><small>${esc(c.src)}</small><br><code>${esc(c.text)}</code></li>`).join("") || "<li>-</li>"}</ul></div>
      <div><h4>결제 UI 선택 ${t4.uiApplied ? "(적용됨)" : "(미적용)"}</h4><ul class="list">${t4.ui ? TASK4.ui.map((o) => { const c = o.choices.find((x) => x.id === t4.ui[o.id]); const a = c && TASK4_ANSWERS.ui[o.id] && TASK4_ANSWERS.ui[o.id][c.id]; return `<li>${esc(o.title)} → ${c ? `${esc(c.label)} <small>${a ? a.verdict : ""}</small>` : "-"}</li>`; }).join("") : "<li>-</li>"}</ul>
        <h4>payment.js 수정 (handlePayment)</h4><pre class="codebox">${esc(t4.fixedCode || (t4.code ? t4.code.split("\n").slice(TASK4.editableFrom - 1).join("\n") : "") || "(수정 없음)")}</pre>
        <p class="small">테스트: ${t4.codeTested ? (t4.codeOk ? "통과" : "실패") : "미실행"}${t4.testRuns ? ` (${t4.testRuns}회)` : ""} · 가드 ${(t4.codeFlags || {}).client ? "○" : "×"} · 멱등성 ${(t4.codeFlags || {}).server ? "○" : "×"} · 분기 ${(t4.codeFlags || {}).branch ? "○" : "×"} · 보류 처리 ${(t4.codeFlags || {}).pending ? "○" : "×"}</p>
        <h4>QA</h4><p class="small">${t4.qa ? t4.qa.tests.map((x) => `${esc(x.name)} ${x.pass ? "PASS" : "FAIL"}`).join(" · ") + ` (${t4.qa.passed}/${t4.qa.total})` : "미실행"}</p></div>
      <div><h4>TASK-005 · 공유 폴더 조사 기록 ${(t5.fileNotes || []).length}건</h4><ul class="list">${(t5.fileNotes || []).map((n) => `<li><b>${esc(n.file)}</b><br>${esc(n.mismatch)}${n.reason ? `<br><i>${esc(n.reason)}</i>` : ""}</li>`).join("") || "<li>-</li>"}</ul>
        <h4>조사 질문 답</h4><ul class="list">${TASK5.questionsB.map((q) => `<li><small>${esc(q.title)}</small><br>${esc((t5.answersB || {})[q.id] || "-")}</li>`).join("")}</ul></div>
      <div><h4>TASK-006 · 최종 배포</h4><p class="small">${(s.task6 || {}).started ? `후보 ${esc(((s.task6 || {}).candidate || {}).id || "-")} · QA ${(s.task6 || {}).qa ? `${s.task6.qa.passed}/${s.task6.qa.total}` : "-"} · 회의 ${((s.task6 || {}).meeting || {}).decision === "approve" ? "승인" : ((s.task6 || {}).meeting || {}).decision === "hold" ? "보류" : "-"} · 배포 요청 ${(s.task6 || {}).release && s.task6.release.requested ? "○" : "-"} · 배포 후 확인 ${(s.task6 || {}).postCheckDone ? "○" : "-"}` : "미시작"}</p></div>
      <div><h4>확보한 증거 ${(t5.evidence || []).length}건</h4><ul class="list">${(t5.evidence || []).map((e) => `<li><small>${esc(e.src)}</small><br>${esc(e.text)}</li>`).join("") || "<li>-</li>"}</ul>
        <h4>타임라인</h4><p class="small">${(t5.timeline || {}).order ? (t5.timeline.order.map((id, i) => `${i + 1}. ${(TASK5.timeline.find((x) => x.id === id) || {}).label}`).join(" → ")) : "-"}<br>${(t5.timeline || {}).passed ? "검증 통과" : "미통과"} · 검증 ${(t5.timeline || {}).attempts || 0}회</p></div>
    </div>
  </section>`;
}

// ---------- 보고서 검토 탭 ----------
function reviewTab() {
  const blocks = [];
  Object.entries(T.teams).forEach(([tid, t]) => {
    const d = T.teamData[tid] || {};
    [1, 2, 3, 4, 5, 6].forEach((no) => {
      const sub = d.submissions && d.submissions["t" + no];
      if (!sub) return;
      const rv = (d.review && d.review["t" + no]) || { status: "pending" };
      const r = sub.report || {};
      let body = "";
      if (no === 1) {
        const stg = (r.stages || []).map((id) => (REPORT.stages.find((x) => x.id === id) || {}).label || id).join(", ");
        body = `<p><b>① 문제 발생 단계</b> ${esc(stg || "-")}</p><p><b>② 확인된 주요 문제</b><br>${esc(r.problems || "-")}</p><p><b>③ 판단 근거</b><br>${esc(r.evidence || "-")}</p><p><b>④ 추가 확인 사항</b><br>${esc(r.followup || "-")}</p><p><b>참고 문의</b> ${esc((r.refs || []).join(", ") || "-")}</p>`;
      } else if (no === 5) {
        const st5 = (d.state && d.state.task5) || {};
        const tlTxt = ((st5.timeline || {}).order || []).map((id, i) => `${i + 1}. ${(TASK5.timeline.find((x) => x.id === id) || {}).label}`).join(" → ");
        const evs = (st5.evidence || []).filter((e) => (r.evidenceIds || []).includes(e.id));
        body = `<p><b>① 확인된 버전 불일치</b><br>운영: ${esc(r.prod || "-")} / 테스트: ${esc(r.staging || "-")}</p><p><b>② 사건 발생 과정</b><br>${esc(tlTxt || "-")} ${(st5.timeline || {}).passed ? "(검증 통과)" : "(미통과)"}</p><p><b>③ 직접 원인</b><br>${esc(r.cause || "-")}</p><p><b>④ 예방하지 못한 이유</b><br>${esc(r.why || "-")}</p><p><b>⑤ 재발 방지 대책</b><br>${esc(r.prevent || "-")}</p><p><b>⑥ 참고한 증거</b></p><ul class="list">${evs.map((e) => `<li><small>${esc(e.src)}</small> ${esc(e.text)}</li>`).join("") || "<li>-</li>"}</ul>`;
      } else if (no === 6 && typeof reviewBody6 === "function") {
        body = reviewBody6(d, r);
      } else if (no === 4) {
        const st4 = (d.state && d.state.task4) || {};
        const uiTxt = st4.uiApplied && st4.ui ? TASK4.ui.map((o) => { const c = o.choices.find((x) => x.id === st4.ui[o.id]); return c ? `${o.title.replace(/^[①-⑩]\s*/, "")}: ${c.label}` : ""; }).filter(Boolean).join(" / ") : "(미적용)";
        const codeTxt = st4.fixedCode || (st4.code ? st4.code.split("\n").slice(TASK4.editableFrom - 1).join("\n") : "") || "(수정 없음)";
        body = `<p><b>① 발견한 문제</b><br>${esc(r.problem || "-")}</p><p><b>② UX 측면의 문제</b><br>${esc(r.ux || "-")}</p><p><b>③ 개발 측면의 문제</b><br>${esc(r.dev || "-")}</p><p><b>④ 수정 사항</b><br>UI: ${esc(uiTxt)}<br><code>${esc(codeTxt)}</code>${r.fixNote ? `<br>${esc(r.fixNote)}` : ""}</p><p><b>⑤ 검증 결과</b> ${st4.qa ? st4.qa.tests.map((x) => `${esc(x.name)} ${x.pass ? "PASS" : "FAIL"}`).join(" · ") + ` (${st4.qa.passed}/${st4.qa.total})` : "QA 미실행"} · 코드 테스트 ${st4.codeOk ? "통과" : st4.codeTested ? "실패" : "미실행"}</p><p><b>⑥ 추가 확인 사항</b><br>${esc(r.followup || "-")}</p>`;
      } else if (no === 3) {
        const stg = (r.stages || []).map((id) => (TASK3.report.stages.find((x) => x.id === id) || {}).label || id).join(", ");
        const st3 = (d.state && d.state.task3) || {};
        body = `<p><b>① 오류가 발생한 기능</b> ${esc(stg || "-")}</p><p><b>② 발견한 오류</b><br>${esc(r.found || "-")}</p><p><b>③ 원인</b><br>${esc(r.cause || "-")}</p><p><b>④ 수정한 내용</b><br><code>${esc(st3.fixedCode || "(없음)")}</code>${r.fixNote ? `<br>${esc(r.fixNote)}` : ""}</p><p><b>⑤ 테스트</b> 도구 테스트 ${st3.codeFixed ? "통과" : "실패/미실행"} · 재테스트 ${(st3.retest || {}).passes || 0}/2</p><p><b>⑥ 개선 의견</b><br>${esc(r.improve || "-")}</p><p><b>⑦ 토론</b><br>${["dq1", "dq2", "dq3", "dq4"].map((k, i) => r[k] ? `${i + 1}. ${esc(r[k])}` : "").filter(Boolean).join("<br>") || "-"}</p>`;
      } else {
        const pr = (r.problems || []).map((id) => (TASK2.spots.find((x) => x.id === id) || {}).label || id).join(", ");
        const pp = (r.principles || []).map((id) => (TASK2.principles.find((x) => x.id === id) || {}).name || id).join(", ");
        body = `<p><b>① 발견한 문제</b> ${esc(pr || "-")}${r.problemsEtc ? ` / ${esc(r.problemsEtc)}` : ""}</p><p><b>② 관련 원칙</b> ${esc(pp || "-")}</p><p><b>③ 적용한 개선</b> ${esc(r.improvements || "(선택 내용은 학생 현황 참고)")}</p><p><b>④ 기대 효과</b><br>${esc(r.expected || "-")}</p><p><b>⑤ 개발 확인 사항</b><br>${esc(r.devChecks || "-")}</p>`;
      }
      blocks.push(`<section class="card rev ${rv.status}">
        <h3>${esc(t.name)} · TASK-00${no} <span class="phase ${rv.status}">${{ pending: "검토 대기", approved: "승인됨", returned: "보완 요청됨" }[rv.status] || rv.status}</span><small>제출 ${new Date(sub.submittedAt).toLocaleTimeString("ko-KR")} (게임 ${esc(sub.gameTime || "")})</small></h3>
        <div class="report">${body}</div>
        <textarea data-note="${tid}-${no}" placeholder="팀에게 전달할 메모 (김팀장 DM으로 전달, 선택)">${esc(T.note[`${tid}-${no}`] || "")}</textarea>
        <div class="btns"><button class="primary" data-review="${tid}:${no}:approved" ${rv.status === "approved" ? "disabled" : ""}>✓ 승인</button><button data-review="${tid}:${no}:returned">↩ 보완 요청 (수정 가능)</button><button data-review="${tid}:${no}:pending:lock">🔒 수정 잠금 (검토 대기)</button></div>
        ${rv.note ? `<p class="help">마지막 메모: ${esc(rv.note)}</p>` : ""}
      </section>`);
    });
  });
  return blocks.join("") || `<section class="card"><p class="help">아직 제출된 보고서가 없습니다. 팀이 제출하면 여기에 표시되고 상단 탭에 숫자가 뜹니다.</p></section>`;
}

// ---------- 교사용 해설 탭 ----------
function notesTab() {
  return `
    <section class="card"><h3>TASK-001 · 정답과 해설</h3>
      <ul class="list">${TEACHER_NOTES.groups.map((g) => `<li><b>${esc(g.label)} (${g.count}건)</b><br>${esc(g.note)}</li>`).join("")}</ul>
      <p><b>기대 결론:</b> ${esc(TEACHER_NOTES.expected)}</p>
      <p><b>테스트 사이트 오류:</b> ① 예매하기 버튼 저대비 + 파란 관심공연 버튼과 혼동 ② 결제하기: 동의 후에도 회색, 1·2회 클릭 무응답(timeout/409), 3회째 진행 ③ 서버 PENDING인데 화면은 '결제 완료', 마이페이지에는 내역 없음</p>
      <h4>발표용 질문</h4><ul class="list"><li>고객 문의 23건은 몇 가지 상황으로 묶이나요? 각 상황은 예매 과정의 어느 단계인가요?</li><li>사용자에게 보이는 안내와 실제 처리 결과가 달랐던 곳은 어디였나요?</li><li>이 문제를 디자인 문제라고만, 혹은 개발 문제라고만 말할 수 있나요?</li></ul>
    </section>
    <section class="card"><h3>TASK-002 · 검수 정답</h3>
      <p>${esc(TASK2_ANSWERS.teacherNotes.issues)}</p>
      <ul class="list">${TASK2.spots.map((sp) => { const a = TASK2_ANSWERS.spots[sp.id]; return `<li><b>${esc(sp.label)}</b> — ${a.issue ? `사용성 문제 (${a.principles.map((id) => TASK2.principles.find((p) => p.id === id).name).join(", ")})` : "단순 시각 차이"}<br><small>${esc(a.explain)}</small></li>`; }).join("")}</ul>
      <p><b>권장 수정:</b> ${esc(TASK2_ANSWERS.teacherNotes.recommended)}</p>
      <p><b>남겨야 할 오류:</b> ${esc(TASK2_ANSWERS.teacherNotes.remaining)}</p>
      <h4>발표용 질문</h4><ul class="list"><li>두 시안의 차이 중 사용자가 할 일에 영향을 주는 것과 그렇지 않은 것은 무엇인가요?</li><li>여러분이 고른 수정안이 '권장'이 아니더라도 그렇게 고른 이유는 무엇인가요?</li><li>디자인을 고쳤는데도 남아 있는 문제는 누구에게 전달해야 하나요?</li></ul>
    </section>
    <section class="card"><h3>TASK-003 · 정답과 해설</h3>
      <p><b>원인:</b> ${esc(TASK3_ANSWERS.cause)}</p>
      <p><b>수정:</b> ${esc(TASK3_ANSWERS.fix)}</p>
      <p><b>남겨야 할 오류:</b> ${esc(TASK3_ANSWERS.remaining)}</p>
      <p><b>제출 조건:</b> 재현 기록 1건↑ · 개발자 도구 열람 · 코드 테스트 통과 · TICKET ON 재테스트 2회 · ①②③⑥ 작성 · 토론 1개↑ → 교사 승인으로 완료</p>
      <h4>발표용 질문</h4><ul class="list">${TASK3_ANSWERS.questions.map((q) => `<li>${esc(q)}</li>`).join("")}</ul>
    </section>
    <section class="card"><h3>TASK-004 · 정답과 해설</h3>
      <p><b>원인:</b> ${esc(TASK4_ANSWERS.cause)}</p>
      <p><b>수정:</b> ${esc(TASK4_ANSWERS.fix)}</p>
      <p><b>해설:</b> ${esc(TASK4_ANSWERS.debrief).replace(/\n/g, "<br>")}</p>
      <p><b>다음 단서:</b> ${esc(TASK4_ANSWERS.remaining)}</p>
      <p><b>제출 조건:</b> 재현 기록 1건↑ · 요청 로그 열람 · UI 수정안 적용 · 코드 테스트 실행 · QA 실행 · ①②③⑥ 작성 → 교사 승인으로 완료. (QA 5항목은 UI와 코드가 모두 고쳐져야 전부 통과)</p>
      <h4>UI 선택지 평가</h4><ul class="list">${TASK4.ui.map((o) => `<li><b>${esc(o.title)}</b> — ${o.choices.map((c) => { const a = TASK4_ANSWERS.ui[o.id][c.id]; return `${esc(c.label)} <small>(${a ? a.verdict : "?"})</small>`; }).join(" · ")}</li>`).join("")}</ul>
      <h4>발표용 질문</h4><ul class="list">${TASK4_ANSWERS.questions.map((q) => `<li>${esc(q)}</li>`).join("")}</ul>
    </section>
    <section class="card"><h3>TASK-005 · 정답과 해설</h3>
      <p><b>버전:</b> 운영 ${esc(TASK5_ANSWERS.versions.production)} / 테스트 ${esc(TASK5_ANSWERS.versions.staging)}</p>
      <p><b>타임라인:</b> ${TASK5_ANSWERS.timelineOrder.map((id, i) => `${i + 1}. ${esc((TASK5.timeline.find((x) => x.id === id) || {}).label)}`).join(" → ")}</p>
      <p><b>조사 질문 답:</b></p><ul class="list">${TASK5.questionsB.map((q) => `<li><small>${esc(q.title)}</small><br>${esc(TASK5_ANSWERS.answersB[q.id])}</li>`).join("")}</ul>
      <p><b>직접 원인:</b> ${esc(TASK5_ANSWERS.cause)}</p>
      <p><b>실패한 과정:</b> ${esc(TASK5_ANSWERS.process)}</p>
      <p><b>재발 방지(예시):</b> ${esc(TASK5_ANSWERS.prevent)}</p>
      <p><b>해설:</b> ${esc(TASK5_ANSWERS.debrief).replace(/\n/g, "<br>")}</p>
      <p><b>제출 조건:</b> 공유 폴더 기록 1건↑ · 디자인 이력·Git·배포 로그 열람 · 타임라인 검증 통과 · ①③④⑤ 작성 · 증거 1건↑ 선택 → 교사 승인으로 완료</p>
      <h4>발표용 질문</h4><ul class="list">${TASK5_ANSWERS.questions.map((q) => `<li>${esc(q)}</li>`).join("")}</ul>
    </section>
    ${typeof notes6HTML === "function" ? notes6HTML() : ""}
    <section class="card"><h3>다음 사건 (미공개)</h3>
      <p class="help">TASK-004 엔딩 대화에서 '테스트 환경에서는 정상이던 코드가 운영에는 다르게 올라가 있었다'는 단서와 함께 배포 기록 불일치가 드러남 → <b>TASK-005. 수상한 배포 기록</b> (미구현).</p>
    </section>`;
}

// ---------- 수업 관리 탭 ----------
function sessionTab() {
  const teams = Object.keys(T.teams).length;
  return `<section class="card">
      <h3>수업 관리</h3>
      <dl class="kv"><dt>수업 코드</dt><dd class="big">${esc(T.pub.code)}</dd><dt>학생 입장 주소</dt><dd>${esc(location.origin + location.pathname.replace(/teacher\.html$/, "student.html"))}</dd><dt>빔프로젝터 화면</dt><dd><a href="display.html?sid=${T.sid}" target="_blank">display.html?sid=${esc(T.sid)}</a></dd><dt>참가 팀</dt><dd>${teams}팀</dd><dt>동기화</dt><dd>${esc(SyncUtil.modeLabel())}</dd></dl>
      <div class="btns">
        ${T.pub.status === "ended" ? `<button class="primary" data-status="running">수업 재개</button>` : `<button data-status="ended">수업 종료</button>`}
        <button data-reset="1" class="danger">세션 초기화 (이벤트·팀 데이터 삭제)</button>
      </div>
      <h4>게임 시각</h4>
      <div class="btns"><button data-clock="-10">-10분</button><button data-clock="-1">-1분</button><span class="big">${fmtClock(T.pub.gameTime)}</span><button data-clock="1">+1분</button><button data-clock="10">+10분</button></div>
      <p class="help">게임 시각은 교사 대시보드가 열려 있는 동안 실제 1분마다 1분씩, 메시지를 공개할 때마다 1분씩 흐릅니다. 일시정지 중에는 멈춥니다.</p>
    </section>`;
}

// ---------- 탭 이벤트 ----------
function bindTab() {
  const q = (s) => app.querySelectorAll(s);
  q("[data-guide]").forEach((b) => b.addEventListener("click", async () => { const st = buildGuide()[Number(b.dataset.guide)]; if (st && st.action) await st.action.fn(); render(); }));
  q("[data-guide-skip]").forEach((b) => b.addEventListener("click", () => { const k = b.dataset.guideSkip; guideSkipped[k] = true; Sync.db.update(sp("private"), { ["guideSkipped/" + k]: true }).catch(() => {}); render(); }));
  q(".tools [data-tab]").forEach((b) => b.addEventListener("click", () => { T.tab = b.dataset.tab; render(); }));
  q("[data-pub]").forEach((b) => b.addEventListener("click", () => publishNext(Number(b.dataset.pub))));
  q("[data-pubtask]").forEach((b) => b.addEventListener("click", () => publishNext(1)));
  q("[data-pause]").forEach((b) => b.addEventListener("click", () => setSessionStatus(T.pub.status === "paused" ? "running" : "paused")));
  q("[data-phase]").forEach((b) => b.addEventListener("click", () => { const [no, p] = b.dataset.phase.split(":"); setPhase(Number(no), p); }));
  q("[data-debrief]").forEach((b) => b.addEventListener("click", () => publishDebrief(Number(b.dataset.debrief))));
  q("[data-hint]").forEach((b) => b.addEventListener("click", () => { const h = [...HINTS, ...TASK2_ANSWERS.hints, ...TASK3_ANSWERS.hints, ...TASK4_ANSWERS.hints, ...TASK5_ANSWERS.hints, ...TASK6_ANSWERS.hints].find((x) => x.id === b.dataset.hint); if (h) publishHint(h); }));
  q("[data-official]").forEach((b) => b.addEventListener("click", () => {
    const v = b.dataset.official;
    if (v === "none") applyOfficial(null, "되돌림");
    else if (v === "v4") applyOfficial({ ...TASK2.v4 }, "디자인팀 최종 시안 v4");
    else { const d = T.teamData[v]; if (d && d.state && d.state.task2 && d.state.task2.design) applyOfficial({ ...d.state.task2.design, poster: TASK2.v4.poster, stage: TASK2.v4.stage, heart: TASK2.v4.heart }, `${T.teams[v].name} 팀 수정안`); }
  }));
  q("[data-ending]").forEach((b) => b.addEventListener("click", publishEnding));
  q("[data-fix]").forEach((b) => b.addEventListener("click", () => (b.dataset.fix === "pay" ? applyOfficialPayFix() : applyOfficialFix())));
  q("[data-approve]").forEach((b) => b.addEventListener("click", () => approve(b.dataset.approve)));
  q("[data-reject]").forEach((b) => b.addEventListener("click", () => reject(b.dataset.reject)));
  q("[data-remove]").forEach((b) => b.addEventListener("click", () => removeTeam(b.dataset.remove)));
  q("[data-team]").forEach((b) => b.addEventListener("click", () => { T.selectedTeam = b.dataset.team || null; render(); }));
  q("[data-note]").forEach((t) => t.addEventListener("input", () => { T.note[t.dataset.note] = t.value; }));
  q("[data-review]").forEach((b) => b.addEventListener("click", () => { const [tid, no, st, lock] = b.dataset.review.split(":"); review(tid, Number(no), st, lock === "lock"); }));
  q("[data-status]").forEach((b) => b.addEventListener("click", () => setSessionStatus(b.dataset.status)));
  q("[data-reset]").forEach((b) => b.addEventListener("click", resetSession));
  q("[data-clock]").forEach((b) => b.addEventListener("click", () => Sync.db.update(sp("public"), { gameTime: Math.max(0, (T.pub.gameTime || CLOCK_START_MIN) + Number(b.dataset.clock)) })));
}

boot();
