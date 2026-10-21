// =====================================================================
//  채팅 화면 엔진
//  - 렌더링(사이드바/메시지) + 시나리오 재생(타임라인/초대/사건/후속)
//  - 상태/저장/스케줄러는 state.js (G, Sched)
//  - ?fast=1 : 8배속   ?skip=1 : 초대 건너뛰기(새 게임일 때만)   ?reset=1 : 저장 삭제
// =====================================================================

// ---------- 가짜 시계 (로그인 시각 = 오전 9:05, 게임 시간에 맞춰 흐름) ----------
const CLOCK_START = 9 * 60 + 5; // 분 단위
function nowMinutes() {
  return CLOCK_START + Sched.now / 60;
}
function fmtMinutes(m) {
  m = Math.floor(m);
  const h = Math.floor(m / 60) % 24, mm = m % 60;
  const ampm = h < 12 ? "오전" : "오후";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${ampm} ${h12}:${String(mm).padStart(2, "0")}`;
}
function fmtHHMM(str) {
  const [h, m] = str.split(":").map(Number);
  return fmtMinutes(h * 60 + m);
}
const schedule = (sec, fn) => Sched.add(sec, fn);

// ---------- 저장된 게임 불러오기 ----------
G.load();

// ---------- 방 목록 (런타임 상태) ----------
const rooms = [...CHANNELS, ...DMS].map((r) => ({
  ...r,
  unread: 0,
  visited: false,
  messages: r.messages.map((m) => ({ ...m, read: true })),
}));
const byId = (id) => rooms.find((r) => r.id === id);
let current = null;

if (G.loaded && G.savedRooms) {
  // 저장된 메시지/배지 복원
  rooms.forEach((r) => {
    const s = G.savedRooms[r.id];
    if (!s) return;
    r.visible = s.visible;
    r.unread = s.unread;
    r.messages = s.messages;
  });
} else {
  // 새 게임: 로그인 직후 읽지 않은 상태로 둘 것들
  byId("notice").messages.filter((m) => m.day === "today").forEach((m) => (m.read = false));
  byId("dm-kim").messages.forEach((m) => (m.read = false));
  rooms.forEach((r) => (r.unread = r.messages.filter((m) => !m.read).length));
}
G.rooms = rooms;

// ---------- DOM ----------
const $ = (s) => document.querySelector(s);
const listCh = $("#list-channels");
const listDm = $("#list-dms");
const msgsEl = $("#messages");
const composer = $("#composer");
const sendBtn = $("#send");
const toastsEl = $("#toasts");

$("#sb-ws-name").textContent = WORKSPACE.name;
$("#sb-company").textContent = WORKSPACE.company;
$("#search-placeholder").textContent = `${WORKSPACE.name} 검색`;
$("#rail-me").insertAdjacentText("afterbegin", PLAYER.name[0]);
$("#rail-ws").textContent = WORKSPACE.name[0];

// ---------- 유틸 ----------
function esc(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
function richText(text) {
  return esc(text).replace(/@([가-힣A-Za-z0-9_]+)/g, (m, name) => {
    const me = name === PLAYER.name;
    return `<span class="mention${me ? " me" : ""}">@${name}</span>`;
  });
}
function avatarHTML(uid, cls = "avatar") {
  const u = USERS[uid];
  return `<div class="${cls}${u.dark ? " dark" : ""}" style="background:${u.color}">${esc(u.name[0])}</div>`;
}
function deptHTML(uid) {
  const d = USERS[uid].dept;
  return d ? `<span class="msg-dept">${esc(d)}</span>` : "";
}
function msgTime(m) {
  return m.time ? fmtHHMM(m.time) : fmtMinutes(m.at);
}

// ---------- 사이드바 ----------
function renderSidebar() {
  listCh.innerHTML = rooms
    .filter((r) => r.type === "channel" && r.visible)
    .map((r) => {
      const icon = r.private
        ? `<svg viewBox="0 0 24 24"><path d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Zm-7-2a2 2 0 0 1 4 0v2h-4V7Z"/></svg>`
        : "#";
      return itemHTML(r, `<span class="pre">${icon}</span>`);
    })
    .join("");

  listDm.innerHTML = rooms
    .filter((r) => r.type === "dm" && r.visible)
    .map((r) => itemHTML(r, avatarHTML(r.user, "mini-avatar") + `<span class="dot"></span>`))
    .join("");

  const dmUnread = rooms.filter((r) => r.type === "dm").reduce((n, r) => n + r.unread, 0);
  const b = $("#rail-dm-badge");
  b.hidden = dmUnread === 0;
  b.textContent = dmUnread;
}
function itemHTML(r, pre) {
  const cls = ["sb-item", current === r.id ? "is-active" : "", r.unread ? "is-unread" : "", r.justAdded ? "is-new" : ""]
    .filter(Boolean).join(" ");
  const badge = r.unread && current !== r.id ? `<span class="badge">${r.unread}</span>` : "";
  return `<li><button class="${cls}" data-room="${r.id}">${pre}<span class="label">${esc(r.name)}</span>${badge}</button></li>`;
}
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-room]");
  if (btn) openRoom(btn.dataset.room);
});

// ---------- 메시지 ----------
function openRoom(id) {
  const r = byId(id);
  if (!r) return;
  current = id;
  r.visited = true;
  G.state.currentRoom = id;

  // 헤더
  const isDm = r.type === "dm";
  $("#ch-prefix").innerHTML = isDm
    ? avatarHTML(r.user, "mini-avatar")
    : r.private
      ? `<svg viewBox="0 0 24 24"><path d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Zm-7-2a2 2 0 0 1 4 0v2h-4V7Z"/></svg>`
      : "#";
  $("#ch-name").textContent = r.name;
  $("#ch-members").hidden = isDm;
  $("#ch-members-n").textContent = (r.desc || "").replace(/\D/g, "") || WORKSPACE.members;
  composer.dataset.placeholder = isDm ? `${r.name}에게 메시지 보내기` : `#${r.name}에 메시지 보내기`;

  renderMessages(r);
  r.messages.forEach((m) => (m.read = true));
  r.unread = 0;
  renderSidebar();
  hideTyping();
  G.save();

  if (id === "ticketon" && !G.live && !G.state.incident.started) startIncident();   // 솔로 모드에서만 자동 재생
}

function renderMessages(r) {
  let html = "";
  const isDm = r.type === "dm";
  html += `<div class="ch-intro">
    <h2>${isDm ? esc(r.name) : (r.private ? "🔒 " : "# ") + esc(r.name)}</h2>
    <p>${isDm
      ? `${esc(USERS[r.user].dept)} · ${esc(r.name)}님과의 다이렉트 메시지입니다.`
      : `${esc(r.topic || "")} · ${esc(r.desc || "")}`}</p>
  </div>`;

  let lastDay = null;
  let newlineDone = false;
  r.messages.forEach((m) => {
    const day = m.day || "today";
    if (day !== lastDay) {
      html += dayHTML(day);
      lastDay = day;
    }
    if (!m.read && !newlineDone) {
      html += `<div class="newline"></div>`;
      newlineDone = true;
    }
    html += msgHTML(m);
  });
  msgsEl.innerHTML = html;
  msgsEl.scrollTop = msgsEl.scrollHeight;
}

function dayHTML(day) {
  const label = day === "yesterday" ? "어제" : "오늘";
  return `<div class="day"><span>${label} <svg viewBox="0 0 24 24"><path d="m7 10 5 5 5-5H7Z"/></svg></span></div>`;
}

function msgHTML(m, isNew = false) {
  if (m.type === "system") {
    return `<div class="msg system"><div class="msg-sys">${richText(m.text).replace(/(김팀장님|이서연님)/g, "<b>$1</b>")} <span class="msg-time">${msgTime(m)}</span></div></div>`;
  }
  const u = USERS[m.from];
  let body = "";
  if (m.text) body += `<div class="msg-text">${richText(m.text)}</div>`;
  if (m.file) {
    const ext = (m.file.name.split(".").pop() || "").toUpperCase().slice(0, 4);
    body += `<div class="file"><div class="file-icon">${esc(ext)}</div><div><div class="file-name">${esc(m.file.name)}</div><div class="file-meta">${esc(m.file.meta || "")}</div></div></div>`;
  }
  if (m.task) {
    const t = m.task;
    body += `<div class="task">
      <div class="task-label">업무 배정 #${t.no}</div>
      <div class="task-title">${esc(t.title)}</div>
      <div class="task-desc">${esc(t.desc)}</div>
      <div class="task-meta"><span>담당 <b>${esc(t.owner)}</b></span><span>마감 <b>${esc(t.due)}</b></span><span>배정 <b>${esc(t.from)}</b></span>${t.priority ? `<span>우선순위 <b>${esc(t.priority)}</b></span>` : ""}</div>
      <div class="task-actions">
        ${m.acked
          ? `<button class="btn" disabled>✓ 확인함</button><button class="btn" data-open-task="${t.no}">DAYEON TASK에서 보기</button>`
          : `<button class="btn primary" data-ack="${t.no}">업무 확인</button><button class="btn">나중에</button>`}
      </div>
    </div>`;
  }
  if (m.reactions && m.reactions.length) {
    body += `<div class="reactions">${m.reactions
      .map((r) => `<button class="reaction${r.mine ? " mine" : ""}">${r.e} <span>${r.n}</span></button>`)
      .join("")}<button class="reaction add">☺+</button></div>`;
  }
  return `<div class="msg${isNew ? " is-new" : ""}">${avatarHTML(m.from)}
    <div class="msg-body">
      <div class="msg-head"><span class="msg-name">${esc(u.name)}</span>${deptHTML(m.from)}<span class="msg-time">${msgTime(m)}</span></div>
      ${body}
    </div></div>`;
}

function appendMessage(roomId, m, opts = {}) {
  const r = byId(roomId);
  m = { ...m, at: m.at ?? nowMinutes(), day: "today", read: current === roomId };
  r.messages.push(m);

  if (current === roomId) {
    hideTyping();
    const nearBottom = msgsEl.scrollHeight - msgsEl.scrollTop - msgsEl.clientHeight < 120;
    msgsEl.insertAdjacentHTML("beforeend", msgHTML(m, true));
    if (nearBottom) msgsEl.scrollTop = msgsEl.scrollHeight;
  } else {
    r.unread++;
    renderSidebar();
  }

  // 알림: DM이거나 나를 멘션했을 때 (현재 보고 있는 방 제외), 또는 다른 앱을 보고 있을 때
  const mentionsMe = (m.text || "").includes("@" + PLAYER.name);
  const otherApp = G.state.currentApp !== "work";
  if ((current !== roomId || otherApp) && (r.type === "dm" || mentionsMe || opts.notify) && m.from !== "me") {
    toast({ uid: m.from, title: USERS[m.from].name, sub: r.type === "dm" ? "" : "#" + r.name, text: m.text, room: roomId });
  }
  G.save();
  return m;
}

// ---------- 입력 중 표시 (메시지 목록 맨 아래 말풍선) ----------
let typingTimer = null;
function showTyping(roomId, uid) {
  if (current !== roomId) return;
  hideTyping();
  const nearBottom = msgsEl.scrollHeight - msgsEl.scrollTop - msgsEl.clientHeight < 160;
  msgsEl.insertAdjacentHTML("beforeend", `<div class="msg typing-row is-new" id="typing-row">${avatarHTML(uid)}
    <div class="msg-body">
      <div class="msg-head"><span class="msg-name">${esc(USERS[uid].name)}</span>${deptHTML(uid)}<span class="msg-time">입력 중…</span></div>
      <div class="typing-bubble"><b></b><b></b><b></b></div>
    </div></div>`);
  if (nearBottom) msgsEl.scrollTop = msgsEl.scrollHeight;
  clearTimeout(typingTimer);
  typingTimer = setTimeout(hideTyping, 12000 / Sched.speed);
}
function hideTyping() {
  const el = document.getElementById("typing-row");
  if (el) el.remove();
}

// ---------- 토스트 ----------
function toast({ uid, title, sub = "", text, room, welcome = false, app = null }) {
  const el = document.createElement("div");
  el.className = "toast" + (welcome ? " welcome" : "");
  el.innerHTML = `${uid ? avatarHTML(uid) : ""}<div class="toast-body">
    <div class="toast-title"><span>${esc(title)}</span><small>${esc(sub)}</small></div>
    <div class="toast-text">${richText(text)}</div></div>`;
  el.addEventListener("click", () => {
    if (room) { showApp("work"); openRoom(room); }
    else if (app) { showApp(app); }
    dismiss();
  });
  toastsEl.appendChild(el);
  const t = setTimeout(dismiss, 6000);
  function dismiss() {
    clearTimeout(t);
    el.classList.add("out");
    setTimeout(() => el.remove(), 250);
  }
}

// ---------- 내 메시지 보내기 ----------
composer.addEventListener("input", () => sendBtn.classList.toggle("on", composer.textContent.trim().length > 0));
composer.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMine(); }
});
sendBtn.addEventListener("click", sendMine);
function sendMine() {
  const text = composer.textContent.trim();
  if (!text) return;
  composer.textContent = "";
  sendBtn.classList.remove("on");
  appendMessage(current, { from: "me", text });
  msgsEl.scrollTop = msgsEl.scrollHeight;
}

// 업무 배정 카드 버튼
document.addEventListener("click", (e) => {
  const open = e.target.closest("[data-open-task]");
  if (open) { openTask(Number(open.dataset.openTask)); return; }

  const btn = e.target.closest("[data-ack]");
  if (!btn) return;
  const r = byId(current);
  const m = r.messages.find((x) => x.task && String(x.task.no) === btn.dataset.ack);
  if (!m) return;
  m.acked = true;
  if (m.task.no === 1) G.state.acked = true;
  else if (G.state["task" + m.task.no]) G.state["task" + m.task.no].acked = true;
  renderMessages(r);
  appendMessage("ticketon", { from: "sys", type: "system", text: `DAYEON TASK에 TASK-00${m.task.no} 업무가 등록되었습니다.` });
  const later = (sec, fn) => (G.live ? setTimeout(fn, sec * 1000) : schedule(sec, fn));
  later(2, () => { showTyping("ticketon", "kim"); });
  later(4, () => appendMessage("ticketon", { from: "kim", text: "👍 부탁할게요. 업무 상세는 DAYEON TASK에서 확인하세요. 궁금한 건 언제든 DM 주세요." }));
  // 업무 시스템으로 이동
  setTimeout(() => openTask(m.task.no), 900);
});

// ---------- 시나리오 재생 ----------
// 절대 시각(at) 기반 — STEP 2·3. offset 이후의 이벤트만 예약(새로고침 재개용)
function playTimeline(list, roomOf, offset = 0) {
  let last = 0;
  list.forEach((ev) => {
    last = Math.max(last, ev.at);
    if (ev.at <= offset) return;
    const roomId = roomOf(ev);
    const rel = ev.at - offset;
    if (ev.type === "invite") {
      schedule(rel, () => invite(ev.ch, ev.by));
      return;
    }
    if (ev.type === "task") {
      schedule(rel, () => appendMessage(roomId, { from: "kim", task: ev.task }));
      return;
    }
    // 입력 중 → 메시지
    if (ev.at - 3 > offset) schedule(rel - 3, () => showTyping(roomId, ev.from));
    schedule(rel, () => appendMessage(roomId, { from: ev.from, text: ev.text, file: ev.file }));
  });
  schedule(Math.max(0.1, last - offset + 0.1), () => { G.state.timelineDone = true; G.save(); });
}

function invite(roomId, byUid, silent = false) {
  const r = byId(roomId);
  if (G.state.invited && r.visible) return; // 중복 방지
  r.visible = true;
  r.justAdded = true;
  r.messages.forEach((m) => (m.read = false));
  r.unread = r.messages.length;
  G.state.invited = true;
  renderSidebar();
  setTimeout(() => (r.justAdded = false), 1000);
  if (!silent) toast({
    uid: byUid,
    title: USERS[byUid].name,
    sub: "채널 초대",
    text: `${USERS[byUid].name}님이 #${r.name} 채널에 회원님을 초대했습니다.`,
    room: roomId,
  });
  // 현재 보고 있는 방에도 시스템 줄 표시
  if (current && current !== roomId && !silent) {
    appendMessage(current, { from: "sys", type: "system", text: `${r.name} 채널에 초대되었습니다.` });
  }
  G.save();
}

// 순차 재생: (추가 대기) → 입력 중 표시 → 메시지 → 읽는 시간 → 다음
//  track: {started, count, done} 진행도 객체(저장용). onDone: 모두 끝났을 때
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
function playSequence(list, roomId, t = 0, track = null, onDone = null) {
  list.forEach((ev) => {
    t += ev.delay ?? 0;
    if (ev.type === "task") {
      schedule(t, () => {
        appendMessage(roomId, { from: "kim", task: ev.task }, { notify: true });
        if (G.state["task" + ev.task.no]) G.state["task" + ev.task.no].assigned = true;
        if (track) track.count++;
      });
      t += ev.pause ?? 2;
      return;
    }
    if (ev.type === "system") {
      schedule(t, () => { appendMessage(roomId, { from: "sys", type: "system", text: ev.text }); if (track) track.count++; });
      t += ev.pause ?? 1.5;
      return;
    }
    const len = (ev.text || "").length;
    const typingFor = ev.typing ?? clamp(0.6 + len * 0.025, 1, 3);    // 길수록 오래 입력
    const readFor = ev.pause ?? clamp(0.8 + len * 0.02, 1, 3);        // 길수록 오래 읽음
    schedule(t, () => showTyping(roomId, ev.from));
    t += typingFor;
    schedule(t, () => { appendMessage(roomId, { from: ev.from, text: ev.text, file: ev.file }); if (track) track.count++; });
    t += readFor;
  });
  schedule(t + 0.1, () => { if (track) track.done = true; G.save(); if (onDone) onDone(); });
  return t;
}

function startIncident() {
  G.state.incident.started = true;
  G.save();
  playSequence(INCIDENT, "ticketon", 0, G.state.incident);
}

// TASK-001 승인 후 → 디자인/개발 대화 → TASK-002 배정 (task.js 에서 호출)
function startFollowup() {
  if (G.state.followup.started) return;
  G.state.followup.started = true;
  G.save();
  playSequence(FOLLOWUP, "ticketon", 0, G.state.followup);
}
// TASK-002 승인 후: 디자인은 됐는데 예매 버튼이 안 눌림 → TASK-003 배정 카드까지
function startFollowup2() {
  if (G.state.followup2.started) return;
  G.state.followup2.started = true;
  G.save();
  playSequence(FOLLOWUP2, "ticketon", 0, G.state.followup2);
}
// TASK-003 승인 후: 예매 버튼 정상 → 결제까지 테스트해 보자
function startFollowup3() {
  if (G.state.followup3.started) return;
  G.state.followup3.started = true;
  G.save();
  playSequence(FOLLOWUP3, "ticketon", 0, G.state.followup3);
}
// 결제하기를 여러 번 눌러 중복 요청이 나면 (ticket.js 에서 호출) → TASK-004 예고
function startFollowup4() {
  if (!G.state.followup3.done || G.state.followup4.started) return;
  G.state.followup4.started = true;
  G.save();
  playSequence(FOLLOWUP4, "ticketon", 0, G.state.followup4, onFollowup4Done);
}
function onFollowup4Done() { G.save(); }   // (FOLLOWUP4 는 TASK-004 배정 카드로 끝남)
// TASK-004 승인 후: 엔딩 대화 → 배포 기록 단서 → TASK-005 예고
function startFollowup5() {
  if (G.state.followup5.started) return;
  G.state.followup5.started = true;
  G.save();
  playSequence(FOLLOWUP5, "ticketon", 0, G.state.followup5, onFollowup5Done);
}
function onFollowup5Done() {
  if (!G.state.task5Ready) { G.state.task5Ready = true; G.save(); }
  if (!G.live) setTimeout(startFollowup6, 1500);   // 솔로: 바로 TASK-005 사건으로 이어짐
}
// TASK-005 사건: 배포 파일 추궁 → 배정 카드
function startFollowup6() {
  if (G.state.followup6.started) return;
  G.state.followup6.started = true;
  G.save();
  playSequence(FOLLOWUP6, "ticketon", 0, G.state.followup6, onFollowup6Done);
}
function onFollowup6Done() { G.save(); }
// TASK-005 승인 후: 사건의 진실 → TASK-006 예고
function startFollowup7() {
  if (G.state.followup7.started) return;
  G.state.followup7.started = true;
  G.save();
  playSequence(FOLLOWUP7, "ticketon", 0, G.state.followup7, onFollowup7Done);
}
function onFollowup7Done() {
  if (!G.state.task6Ready) { G.state.task6Ready = true; G.save(); }
  if (!G.live) setTimeout(startFollowup8, 1500);
}
// TASK-006 시작: 최후의 배포 → 배정 카드
function startFollowup8() {
  if (G.state.followup8.started) return;
  G.state.followup8.started = true; G.save();
  playSequence(FOLLOWUP8, "ticketon", 0, G.state.followup8, () => G.save());
}
// 배포 결과 공개 (공식 배포·배포 후 확인 뒤)
function startFollowup9() {
  if (G.state.followup9.started) return;
  G.state.followup9.started = true; G.save();
  playSequence(FOLLOWUP9, "ticketon", 0, G.state.followup9, onFollowup9Done);
}
function onFollowup9Done() { G.save(); if (!G.live) setTimeout(startFollowup10, 2000); }
// 근무평가 진행
function startFollowup10() {
  if (G.state.followup10.started) return;
  G.state.followup10.started = true; G.save();
  playSequence(FOLLOWUP10, "ticketon", 0, G.state.followup10, onFollowup10Done);
}
function onFollowup10Done() {
  G.state.evalReady = true; G.save();
  if (G.live) return;
  // 솔로: 활동 기록으로 평가서 초안을 만들고 바로 공개 (교사 확정 단계 생략)
  const doc = computeEvalDraft(G.state, "신입 프로젝트팀");
  doc.status = "PUBLISHED"; doc.verdict = "leave"; doc.publishedAt = Date.now();
  G.state.evalDoc = doc; G.save();
  toast({ title: "인사팀", sub: "근무평가서 발급", text: "이 팀의 신입사원 근무평가서가 발급되었습니다. DAYEON TASK › 근무평가서에서 확인하세요.", app: "task" });
  if (G.state.currentApp === "task") renderTaskPage();
  setTimeout(startFollowup11, 4000);
}
// 퇴근 승인
function startFollowup11() {
  if (G.state.followup11.started) return;
  G.state.followup11.started = true; G.save();
  playSequence(FOLLOWUP11, "ticketon", 0, G.state.followup11, onFollowup11Done);
}
function onFollowup11Done() {
  G.state.leaveApproved = true; G.save();
  if (typeof leaveFab === "function") leaveFab();
  toast({ title: "DAYEON WORK", sub: "퇴근 승인", text: "오늘의 모든 업무가 종료되었습니다. [퇴근하기]를 눌러 퇴근하세요." });
}

// ---------- 시작 / 재개 (솔로 모드: private/data-private.js 의 시나리오를 자동 재생) ----------
function startSolo() {
  if (!G.loaded) {
    // 새 게임
    G.state.startedAt = Date.now();
    G.state.vclock = 0;
    openRoom("notice");
    setTimeout(() => toast({
      uid: "hr", title: "인사팀", sub: "#전체공지", welcome: true,
      text: `${PLAYER.name}님, ${WORKSPACE.company}에 오신 것을 환영합니다! 👋`,
    }), 600);
    if (params.has("skip")) {
      // 초대까지 건너뛰고 바로 프로젝트 채널 열기 (테스트용)
      G.state.timelineDone = true;
      invite("ticketon", "kim");
      openRoom("ticketon");
    } else {
      playTimeline(TIMELINE, (ev) => ev.ch, 0);
    }
    G.saveNow();
  } else {
    // 저장된 게임 재개 — 이미 지나간 이벤트는 다시 재생하지 않음
    openRoom(G.state.currentRoom || "notice");
    if (!G.state.timelineDone) playTimeline(TIMELINE, (ev) => ev.ch, G.state.vclock);
    const inc = G.state.incident;
    if (inc.started && !inc.done) playSequence(INCIDENT.slice(inc.count), "ticketon", 1, inc);
    const fu = G.state.followup;
    if (fu.started && !fu.done) playSequence(FOLLOWUP.slice(fu.count), "ticketon", 1, fu);
    else if (fu.done && !G.state.task2.assigned) {
      // 구버전 저장(TASK-002 준비 중 안내만 있던 경우): 배정 카드를 지금 추가
      const ev = FOLLOWUP.find((x) => x.type === "task");
      appendMessage("ticketon", { from: "sys", type: "system", text: "새로운 업무가 배정되었습니다." });
      appendMessage("ticketon", { from: "kim", task: ev.task }, { notify: true });
      G.state.task2.assigned = true;
      G.save();
    }
    const f2 = G.state.followup2;
    if (f2.started && !f2.done) playSequence(FOLLOWUP2.slice(f2.count), "ticketon", 1, f2);
    const f3 = G.state.followup3;
    if (f3.started && !f3.done) playSequence(FOLLOWUP3.slice(f3.count), "ticketon", 1, f3);
    const f4 = G.state.followup4;
    if (f4.started && !f4.done) playSequence(FOLLOWUP4.slice(f4.count), "ticketon", 1, f4, onFollowup4Done);
    const f5 = G.state.followup5;
    if (f5.started && !f5.done) playSequence(FOLLOWUP5.slice(f5.count), "ticketon", 1, f5, onFollowup5Done);
    const f6 = G.state.followup6;
    if (f6.started && !f6.done) playSequence(FOLLOWUP6.slice(f6.count), "ticketon", 1, f6, onFollowup6Done);
    const f7 = G.state.followup7;
    if (f7.started && !f7.done) playSequence(FOLLOWUP7.slice(f7.count), "ticketon", 1, f7, onFollowup7Done);
    [["followup8", "FOLLOWUP8", () => G.save()], ["followup9", "FOLLOWUP9", onFollowup9Done], ["followup10", "FOLLOWUP10", onFollowup10Done], ["followup11", "FOLLOWUP11", onFollowup11Done]].forEach(([k, name, cb]) => {
      const f = G.state[k];
      if (f && f.started && !f.done && typeof window[name] !== "undefined") playSequence(window[name].slice(f.count), "ticketon", 1, f, cb);
    });
  }
}

// ---------- 라이브 모드: 교사가 공개한 이벤트 적용 (live.js 에서 호출) ----------
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function applyLiveEvent(ev, silent) {
  const room = ev.room || "ticketon";
  switch (ev.type) {
    case "message":
      if (!silent) { showTyping(room, ev.from); await wait(Math.min(2500, 600 + (ev.text || "").length * 20)); }
      appendMessage(room, { from: ev.from, text: ev.text, file: ev.file || undefined, at: ev.at }, { notify: !silent });
      break;
    case "system":
      appendMessage(room, { from: "sys", type: "system", text: ev.text, at: ev.at });
      break;
    case "invite":
      invite(room, ev.by || "kim", silent);
      break;
    case "task":
      appendMessage(room, { from: "kim", task: ev.task, at: ev.at }, { notify: !silent });
      if (ev.task && G.state["task" + ev.task.no]) G.state["task" + ev.task.no].assigned = true;
      if (G.state.currentApp === "task") renderTaskPage();
      break;
    case "hint":
      appendMessage("dm-kim", { from: "kim", text: ev.text, at: ev.at }, { notify: !silent });
      break;
    case "answers":
      G.state.answers = G.state.answers || {};
      G.state.answers["task" + ev.task] = ev.answers;
      G.save();
      if (G.state.currentApp === "design") renderDesign();
      if (!silent) toast({ title: "DAYEON DESIGN", sub: "해설 공개", text: "검수 결과와 원칙 분석 해설을 확인할 수 있습니다.", app: "design" });
      break;
    case "debrief":
      // 해설은 프로젝터(수업 화면)에만 표시. 학생 화면에는 안내만
      if (!silent) toast({ title: "DAYEON WORK", sub: ev.title || "해설", text: "해설이 프로젝터 화면에 공개되었습니다. 앞을 보고 발표·토론을 준비하세요." });
      break;
    case "official":
      if (G.state.currentApp === "ticket") renderTicket();
      if (!silent) toast({ title: "TICKET ON", sub: "공식 서비스", text: ev.text, app: "ticket" });
      break;
    case "ending":
      if (!silent) toast({ title: ev.title || "엔딩", text: ev.text });
      break;
    case "leave":
      G.state.leaveApproved = true;
      if (typeof leaveFab === "function") leaveFab();
      if (!silent) toast({ title: "DAYEON WORK", sub: "퇴근 승인", text: "오늘의 모든 업무가 종료되었습니다. [퇴근하기]를 눌러 퇴근하세요." });
      break;
    case "evalReady":
      G.state.evalReady = true;
      if (G.state.currentApp === "task") renderTaskPage();
      break;
  }
  G.save();
}

if (G.live) {
  // live.js 가 이어서 시작
  Sched.paused = true;   // 게임 시각은 교사가 관리 (public.gameTime)
} else {
  // 솔로 모드: 비공개 시나리오 파일을 불러온 뒤 시작
  const sc = document.createElement("script");
  sc.src = "private/data-private.js";
  sc.onload = () => startSolo();
  sc.onerror = () => {
    openRoom("notice");
    toast({ title: "솔로 모드", text: "시나리오 파일(private/data-private.js)을 찾을 수 없습니다. 수업 모드는 student.html 로 입장하세요." });
  };
  document.head.appendChild(sc);
}
