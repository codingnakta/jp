// =====================================================================
//  빔프로젝터 화면 (display.html?sid=... 또는 ?code=...)
//  공개된 이벤트(메신저 대화·업무 배정·힌트·해설·공식 반영·엔딩)와 공통 상태만 표시
//  교사용 설정, 미공개 정답, 팀별 보고서는 표시하지 않음 (읽기 경로도 public/events 뿐)
// =====================================================================

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const app = document.getElementById("app");
const D = { sid: null, pub: null, events: [], teams: {}, lastSeq: 0, overlay: null };
const PHASE_KO = { LOCKED: "미공개", ANNOUNCED: "업무 배정", ACTIVE: "조사 진행 중", REVIEW: "조사 마감 · 검토", DEBRIEF: "해설 · 발표", COMPLETED: "완료" };
const userName = (id) => (USERS[id] ? USERS[id].name : id);
const userDept = (id) => (USERS[id] ? USERS[id].dept : "");
const userColor = (id) => (USERS[id] ? USERS[id].color : "#999");
const roomName = (id) => { const r = [...CHANNELS, ...DMS].find((x) => x.id === id); return r ? (r.type === "dm" ? "DM · " + r.name : "#" + r.name) : id; };

async function boot() {
  await Sync.init();
  const p = new URLSearchParams(location.search);
  await Sync.auth.signInAnonymously();
  D.sid = p.get("sid");
  if (!D.sid && p.get("code")) D.sid = await Sync.db.get(`codes/${p.get("code").toUpperCase()}`);
  if (!D.sid) { app.innerHTML = `<div class="boot">주소에 수업을 지정하세요: <code>display.html?code=수업코드</code></div>`; return; }
  Sync.db.on(`sessions/${D.sid}/public`, (v) => { D.pub = v; render(); });
  Sync.db.on(`sessions/${D.sid}/events`, (v) => {
    const list = Object.values(v || {}).sort((a, b) => a.seq - b.seq);
    const fresh = list.filter((e) => e.seq > D.lastSeq);
    D.events = list;
    if (D.lastSeq && fresh.length) spotlight(fresh[fresh.length - 1]);
    D.lastSeq = list.length ? list[list.length - 1].seq : 0;
    render();
  });
  Sync.db.on(`sessions/${D.sid}/teams`, (v) => { D.teams = v || {}; render(); });
  Sync.connection.on(() => render());
}

// 새 이벤트가 오면 잠깐 크게 보여주는 연출
let spotTimer = null;
function spotlight(e) {
  if (["task", "hint", "debrief", "official", "ending", "invite"].includes(e.type)) {
    D.overlay = e;
    clearTimeout(spotTimer);
    if (e.type !== "ending") spotTimer = setTimeout(() => { D.overlay = null; render(); }, 9000);
  }
}

function render() {
  if (!D.pub) { app.innerHTML = `<div class="boot">세션을 찾을 수 없습니다.</div>`; return; }
  const curTask = D.pub.currentTask || 0;
  const phase = curTask ? D.pub.tasks["t" + curTask].status : null;
  const teams = Object.values(D.teams);
  const online = teams.filter((t) => t.online && Date.now() - (t.lastSeen || 0) < 60000).length;
  const feed = D.events.filter((e) => ["message", "system", "task", "invite", "hint", "debrief", "official"].includes(e.type)).slice(-14);
  const hints = D.events.filter((e) => e.type === "hint");
  const official = D.pub.officialService && D.pub.officialService.design;

  app.innerHTML = `
    <header class="top">
      <div class="brand"><span class="logo">D</span><b>DAYEON WORK</b><small>다연컴퍼니 · 신입인데 퇴근하겠습니다</small></div>
      <div class="status">
        ${curTask ? `<span class="task">TASK-00${curTask}</span><span class="phase ${phase}">${PHASE_KO[phase]}</span>` : `<span class="phase">첫 출근</span>`}
        ${D.pub.status === "paused" ? `<span class="paused">⏸ 잠시 멈춤 · 토론 시간</span>` : ""}
      </div>
      <div class="right"><span class="clock">${SyncUtil.fmtClock(D.pub.gameTime)}</span><span class="teams">${online}/${teams.length}팀 접속</span><span class="conn ${Sync.connection.online ? "on" : "off"}"></span></div>
    </header>
    <main class="body">
      <section class="feed">
        <h2>#프로젝트-티켓온 · 사내 메신저</h2>
        <div class="msgs">${feed.map(feedHTML).join("") || `<div class="empty">아직 공개된 대화가 없습니다.</div>`}</div>
      </section>
      <aside class="side">
        <div class="panel"><h3>현재 업무</h3>${curTask ? taskPanel(curTask) : `<p class="dim">아직 배정된 업무가 없습니다.</p>`}</div>
        <div class="panel"><h3>공개된 힌트</h3>${hints.length ? `<ul>${hints.map((h) => `<li>${esc(h.text)}</li>`).join("")}</ul>` : `<p class="dim">아직 없음</p>`}</div>
        <div class="panel"><h3>TICKET ON 공식 서비스</h3>${official ? `<p class="ok">디자인 수정 반영됨 · ${esc(D.pub.officialService.source)}</p><ul class="design">${designSummary(official)}</ul>` : `<p class="dim">운영 화면(기존 v2) 그대로</p>`}</div>
        <div class="panel teams"><h3>참가 팀</h3>${teams.length ? `<ul>${teams.map((t) => `<li><i class="${t.online && Date.now() - (t.lastSeen || 0) < 60000 ? "on" : ""}"></i>${esc(t.name)}</li>`).join("")}</ul>` : `<p class="dim">입장 대기 중</p>`}</div>
      </aside>
    </main>
    ${D.overlay ? overlayHTML(D.overlay) : ""}`;
  const m = app.querySelector(".msgs"); if (m) m.scrollTop = m.scrollHeight;
}

function feedHTML(e) {
  if (e.type === "message") return `<div class="m"><span class="av" style="background:${userColor(e.from)}">${esc(userName(e.from)[0])}</span><div><div class="h"><b>${esc(userName(e.from))}</b><small>${esc(userDept(e.from))}</small><small class="room">${esc(roomName(e.room))}</small><small>${SyncUtil.fmtClock(e.at)}</small></div><p>${esc(e.text)}</p></div></div>`;
  if (e.type === "system") return `<div class="m sys"><p>${esc(e.text)}</p></div>`;
  if (e.type === "invite") return `<div class="m sys"><p>김팀장님이 #프로젝트-티켓온 채널에 신입사원을 초대했습니다.</p></div>`;
  if (e.type === "task") return `<div class="m card"><div class="label">업무 배정 #${e.task.no}</div><b>${esc(e.task.title)}</b><p>${esc(e.task.desc || "")}</p><small>담당 ${esc(e.task.owner)} · 마감 ${esc(e.task.due)} · 배정 ${esc(e.task.from)}${e.task.priority ? ` · 우선순위 ${esc(e.task.priority)}` : ""}</small></div>`;
  if (e.type === "hint") return `<div class="m card hint"><div class="label">힌트</div><p>${esc(e.text)}</p></div>`;
  if (e.type === "debrief") return `<div class="m card debrief"><div class="label">${esc(e.title)}</div><p>${esc(e.text).replace(/\n/g, "<br>")}</p></div>`;
  if (e.type === "official") return `<div class="m card ok"><div class="label">공식 서비스</div><p>${esc(e.text)}</p></div>`;
  return "";
}
function taskPanel(no) {
  const t = TASKS.find((x) => x.no === no);
  const st = D.pub.tasks["t" + no].status;
  return `<div class="tp"><b>TASK-00${no}</b><div class="title">${esc(t ? t.title : "")}</div><div class="phase ${st}">${PHASE_KO[st]}</div>
    <ol class="steps">${["업무 배정", "조사 진행", "조사 마감·검토", "해설·발표", "완료"].map((l, i) => `<li class="${["ANNOUNCED", "ACTIVE", "REVIEW", "DEBRIEF", "COMPLETED"].indexOf(st) >= i ? "on" : ""}">${l}</li>`).join("")}</ol></div>`;
}
function designSummary(d) {
  return TASK2.options.map((o) => { const c = o.choices.find((x) => x.id === d[o.id]); return c ? `<li>${esc(o.title.replace(/^[①-⑩]\s*/, ""))}: <b>${esc(c.label)}</b></li>` : ""; }).join("");
}
function overlayHTML(e) {
  let inner = "";
  if (e.type === "task") inner = `<div class="label">새로운 업무가 배정되었습니다</div><h1>TASK-00${e.task.no}</h1><h2>${esc(e.task.title)}</h2><p>${esc(e.task.desc || "")}</p><div class="meta">담당 ${esc(e.task.owner)} · 마감 ${esc(e.task.due)} · 배정 ${esc(e.task.from)}</div>`;
  else if (e.type === "hint") inner = `<div class="label">김팀장의 힌트</div><h2>${esc(e.text)}</h2>`;
  else if (e.type === "debrief") inner = `<div class="label">${esc(e.title)}</div><p class="long">${esc(e.text).replace(/\n/g, "<br>")}</p>`;
  else if (e.type === "official") inner = `<div class="label">TICKET ON 공식 서비스</div><h2>디자인 수정이 반영되었습니다</h2><p>${esc(e.text)}</p>`;
  else if (e.type === "invite") inner = `<div class="label">채널 초대</div><h2>#프로젝트-티켓온</h2><p>김팀장님이 신입사원을 프로젝트 채널에 초대했습니다.</p>`;
  else if (e.type === "ending") inner = `<div class="label">ENDING</div><h1>${esc(e.title)}</h1><p class="long">${esc(e.text)}</p><div class="meta">수고하셨습니다 👏</div>`;
  return `<div class="overlay ${e.type}" onclick="D.overlay=null;render()"><div class="box">${inner}</div></div>`;
}

boot().catch((e) => { app.innerHTML = `<div class="boot">오류: ${esc(e.message || e)}</div>`; });
