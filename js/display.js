// =====================================================================
//  빔프로젝터 화면 (display.html?code=수업코드)
//  수업 진행판: 게임 시각 · 지금 할 일(현재 업무·단계·마감) · 팀별 진행 · 공개된 힌트 · 최근 알림
//  읽는 경로는 public/events/teams 뿐. 팀별 진행 요약은 교사 화면이 public.progress 로 써 준다 (보고서 내용·정답은 포함하지 않음)
// =====================================================================

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const app = document.getElementById("app");
const D = { sid: null, pub: null, events: [], teams: {}, lastSeq: 0, overlay: null, pubAt: 0 };
const PHASE_KO = { LOCKED: "미공개", ANNOUNCED: "업무 배정", ACTIVE: "조사 진행 중", REVIEW: "조사 마감 · 검토", DEBRIEF: "해설 · 발표", COMPLETED: "완료" };
const APP_KO = { work: "메신저", task: "업무 시스템", ticket: "TICKET ON", design: "디자인 도구", dev: "개발자 도구", ops: "DAYEON DEPLOY" };
// 업무별 미션 단계 (학생 화면의 MISSION 구성과 동일한 순서)
const STEPS = {
  1: [["문의 분석", "고객 문의 23건을 읽고 상황별로 묶기"], ["오류 재현", "TICKET ON에서 직접 재현하고 이상 현상 기록"], ["보고서", "조사 보고서 작성·제출"]],
  2: [["검수", "운영 화면(v2)과 최종 시안(v4) 비교 · 문제 요소 표시"], ["원칙 분석", "디자인 가이드를 읽고 관련 원칙 고르기"], ["수정안", "디자인 수정안 작성·확정"], ["보고서", "검수 보고서 제출"]],
  3: [["오류 재현", "예매하기 버튼 오류 재현 기록"], ["조사", "개발자 도구에서 콘솔·HTML·JS 단서 수집"], ["수정·테스트", "reservation.js 수정 후 테스트 실행"], ["재테스트", "TICKET ON에서 2회 확인"], ["보고서", "오류 수정 보고서 제출"]],
  4: [["A 재현", "시나리오 A/B/C로 결제 오류 재현 기록"], ["B 로그 조사", "요청 로그에서 반복 요청·실제 결과 비교"], ["C UI 개선", "결제 상태별 UI 수정안 적용"], ["D 코드 수정", "payment.js 수정 후 테스트 통과"], ["E QA", "QA 5항목 검증"], ["F 보고서", "업무 보고서 제출"]],
  5: [["A 공유 폴더", "파일 상세를 열어 이름과 실제 내용 비교 · 이상 기록"], ["B 변경 기록", "디자인 이력 · Git 기록 확인 · 조사 질문 답하기"], ["C 배포 기록", "배포 이력·QA·지난 대화 대조 · 증거 수집"], ["D 타임라인", "사건 순서 재구성 · 검증"], ["E 보고서", "조사 보고서 제출"]],
  6: [["A 배포 후보", "빌드 4개 비교 · 후보 선택"], ["B 최종 QA", "TICKET ON을 직접 조작해 6항목 검증"], ["C 출시 회의", "출시 승인 여부 합의"], ["D 보고서", "출시 판단 보고서 제출 · 팀장 승인"], ["E 배포", "체크리스트 확인 · 배포 요청"], ["F 운영 확인", "배포 후 운영 상태 확인 보고"]],
};
function parseDue(str) { const m = /(오전|오후)\s*(\d+):(\d+)/.exec(str || ""); if (!m) return null; let h = Number(m[2]) % 12; if (m[1] === "오후") h += 12; return h * 60 + Number(m[3]); }

async function boot() {
  await Sync.init();
  const p = new URLSearchParams(location.search);
  await Sync.auth.signInAnonymously();
  D.sid = p.get("sid");
  if (!D.sid && p.get("code")) D.sid = await Sync.db.get(`codes/${p.get("code").toUpperCase()}`);
  if (!D.sid) { app.innerHTML = `<div class="boot">주소에 수업을 지정하세요: <code>display.html?code=수업코드</code></div>`; return; }
  Sync.db.on(`sessions/${D.sid}/public`, (v) => { const prevTime = D.pub && D.pub.gameTime; D.pub = v; if (!v || v.gameTime !== prevTime) D.pubAt = Date.now(); render(); });
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
  setInterval(() => { const c = document.getElementById("d-clock-sec"); if (c) c.textContent = secondsText(); }, 1000);
}
function secondsText() { const s = Math.floor((Date.now() - D.pubAt) / 1000) % 60; return D.pub && D.pub.status === "running" ? String(s).padStart(2, "0") : "--"; }

// 새 이벤트가 오면 잠깐 크게 보여주는 연출
let spotTimer = null;
function spotlight(e) {
  if (["task", "hint", "debrief", "official", "ending", "invite", "leave"].includes(e.type)) {
    D.overlay = e;
    clearTimeout(spotTimer);
    if (e.type !== "ending") spotTimer = setTimeout(() => { D.overlay = null; render(); }, 9000);
  }
}

function render() {
  if (!D.pub) { app.innerHTML = `<div class="boot">세션을 찾을 수 없습니다.</div>`; return; }
  const pub = D.pub;
  const curTask = pub.currentTask || 0;
  const phase = curTask ? ((pub.tasks || {})["t" + curTask] || {}).status || "LOCKED" : null;
  const task = curTask ? TASKS.find((x) => x.no === curTask) : null;
  const teams = Object.entries(D.teams);
  const onlineN = teams.filter(([, t]) => t.online && Date.now() - (t.lastSeen || 0) < 60000).length;
  const paused = pub.status === "paused";
  const gameTime = pub.gameTime || 0;
  const rel = pub.release || {};
  const hints = D.events.filter((e) => e.type === "hint");
  const notices = D.events.filter((e) => ["task", "hint", "debrief", "official", "system", "leave", "invite"].includes(e.type)).slice(-3).reverse();
  const progress = pub.progress || {};
  const debrief = curTask ? [...D.events].reverse().find((e) => e.type === "debrief" && e.task === curTask) : null;

  // ---- 지금 할 일 ----
  let nowTitle, nowSub, nowBody = "";
  if (paused) { nowTitle = "잠시 멈춤 · 발표 / 토론 시간"; nowSub = "진행자의 안내를 따라 주세요. 게임 시각이 멈춰 있습니다."; }
  else if (pub.leaveApproved) { nowTitle = "오늘의 모든 업무가 끝났습니다"; nowSub = "퇴근 승인 완료 · 각 팀은 [퇴근하기]를 눌러 퇴근하세요"; }
  else if (pub.eval && pub.eval.published) { nowTitle = "신입사원 근무평가서 발급"; nowSub = "DAYEON TASK › 근무평가서에서 우리 팀 평가서를 확인하세요"; }
  else if (pub.evalReady) { nowTitle = "근무평가 진행 중"; nowSub = "인사팀에서 팀별 근무평가서를 작성하고 있습니다"; }
  else if (rel.status === "deploying") { nowTitle = `${rel.build} 운영 배포 진행 중`; nowSub = "DAYEON DEPLOY › 배포 실행에서 배포 로그를 확인하세요"; }
  else if (!curTask) { nowTitle = "첫 출근"; nowSub = "사내 메신저 DAYEON WORK를 둘러보며 회사 분위기를 익히세요"; }
  else if (phase === "ANNOUNCED") { nowTitle = `${task.code} · ${task.title}`; nowSub = "업무가 배정되었습니다. 메신저의 [업무 확인]으로 내용과 첨부 자료를 읽고, 시작 안내를 기다리세요"; }
  else if (phase === "ACTIVE") { nowTitle = `${task.code} · ${task.title}`; nowSub = task.subtitle || task.kind || ""; }
  else if (phase === "REVIEW") { nowTitle = `${task.code} · 조사 마감`; nowSub = "보고서를 검토하고 있습니다. 팀별 발표를 준비하세요"; }
  else if (phase === "DEBRIEF") { nowTitle = `${task.code} · 해설 · 발표`; nowSub = "해설을 보고 팀별로 발표·토론합니다"; }
  else { nowTitle = `${task.code} · 완료`; nowSub = "다음 사건을 기다리세요. 메신저를 확인하세요"; }
  if (curTask && !paused && (phase === "ACTIVE" || phase === "ANNOUNCED") && rel.status !== "deploying" && !pub.evalReady) {
    const steps = STEPS[curTask] || [];
    nowBody = `<ol class="d-steps ${phase === "ANNOUNCED" ? "dim" : ""}">${steps.map(([h, p], i) => `<li><span class="n">${i + 1}</span><div><b>${esc(h)}</b><small>${esc(p)}</small></div></li>`).join("")}</ol>`;
  }
  if (debrief && !paused && !pub.evalReady && !pub.leaveApproved) {
    nowTitle = `${task.code} · 해설`; nowSub = debrief.title || "";
    nowBody = `<div class="d-debrief">${esc(debrief.text).replace(/\n/g, "<br>")}</div>`;
  }
  if (rel.status === "done" && !pub.evalReady && !pub.leaveApproved && phase === "ACTIVE") nowBody += `<div class="d-note ok">✓ ${esc(rel.build)} 운영 배포 완료 — 배포 후 운영 상태를 확인하고 '배포 후 확인 완료'를 보고하세요</div>`;
  // 마감
  const dueMin = task ? parseDue(task.due) : null;
  const remain = dueMin != null ? dueMin - gameTime : null;
  const dueHTML = task && phase === "ACTIVE" && !paused ? `<div class="d-due ${remain != null && remain <= 15 ? "soon" : ""} ${remain != null && remain < 0 ? "over" : ""}"><span>마감 ${esc(task.due)}</span><b>${remain == null ? "" : remain >= 0 ? `${remain}분 남음` : `${-remain}분 지남`}</b></div>` : "";

  app.innerHTML = `
    <header class="top">
      <div class="brand"><span class="logo">D</span><div><b>DAYEON WORK</b><small>다연컴퍼니 · 신입인데 퇴근하겠습니다</small></div></div>
      <div class="d-clockbox ${paused ? "paused" : ""}"><small>${paused ? "일시정지" : "현재 시각"}</small><span class="clock">${SyncUtil.fmtClock(gameTime)}<i id="d-clock-sec">${secondsText()}</i></span></div>
      <div class="status">${curTask ? `<span class="task">${task.code}</span><span class="phase ${phase}">${PHASE_KO[phase]}</span>` : `<span class="phase">첫 출근</span>`}${rel.status === "done" ? `<span class="phase COMPLETED">✓ ${esc(rel.build)} 출시</span>` : ""}${pub.leaveApproved ? `<span class="phase COMPLETED">퇴근 승인</span>` : ""}</div>
      <div class="right"><span class="teams">${onlineN}/${teams.length}팀 접속</span><span class="conn ${Sync.connection.online ? "on" : "off"}"></span></div>
    </header>
    <main class="body">
      <section class="now ${paused ? "paused" : ""}">
        <div class="now-head"><div class="label">지금 할 일</div>${dueHTML}</div>
        <h1>${esc(nowTitle)}</h1>
        <p class="sub">${esc(nowSub)}</p>
        ${nowBody}
        ${hints.length ? `<div class="d-hints"><div class="label">공개된 힌트</div><ul>${hints.slice(-3).map((h) => `<li>${esc(h.text)}</li>`).join("")}</ul></div>` : ""}
      </section>
      <aside class="side">
        <div class="panel teams"><h3>팀 진행 현황${curTask ? ` <small>${task.code}</small>` : ""}</h3>
          ${teams.length ? `<ul>${teams.map(([tid, t]) => { const on = t.online && Date.now() - (t.lastSeen || 0) < 60000; const p = progress[tid]; const valid = p && p.no === curTask && curTask; const pct = valid && p.total ? Math.round(p.done / p.total * 100) : 0; return `<li><div class="t-top"><i class="${on ? "on" : ""}"></i><b>${esc(t.name)}</b>${p && p.app ? `<small>${esc(APP_KO[p.app] || p.app)}</small>` : ""}<span class="badge ${valid && p.approved ? "ok" : valid && p.submitted ? "sub" : valid && p.returned ? "ret" : ""}">${valid && p.approved ? "승인" : valid && p.returned ? "보완" : valid && p.submitted ? "제출" : valid ? `${p.done}/${p.total}` : "-"}</span></div><div class="bar"><i style="width:${valid && p.approved ? 100 : pct}%"></i></div></li>`; }).join("")}</ul>` : `<p class="dim">입장 대기 중</p>`}
        </div>
        ${pub.eval && pub.eval.published && pub.eval.showTitles && pub.eval.titles ? `<div class="panel"><h3>대표 칭호</h3><ul class="plain">${Object.entries(pub.eval.titles).map(([tid, tt]) => tt ? `<li><b>${esc((D.teams[tid] || {}).name || tid)}</b> ${esc(tt)}</li>` : "").join("")}</ul></div>` : ""}
        <div class="panel notices"><h3>최근 알림</h3>${notices.length ? `<ul class="plain">${notices.map(noticeHTML).join("")}</ul>` : `<p class="dim">아직 없음</p>`}</div>
      </aside>
    </main>
    ${D.overlay ? overlayHTML(D.overlay) : ""}`;
}
function noticeHTML(e) {
  const t = `<small>${SyncUtil.fmtClock(e.at)}</small>`;
  if (e.type === "task") return `<li><span class="tag">업무 배정</span>TASK-00${e.task.no} ${esc(e.task.title)}${t}</li>`;
  if (e.type === "hint") return `<li><span class="tag hint">힌트</span>${esc(e.text)}${t}</li>`;
  if (e.type === "debrief") return `<li><span class="tag ok">${esc(e.title)}</span>공개됨${t}</li>`;
  if (e.type === "official") return `<li><span class="tag ok">공식 서비스</span>${esc(e.text.slice(0, 48))}…${t}</li>`;
  if (e.type === "system") return `<li><span class="tag">시스템</span>${esc(e.text.slice(0, 60))}${t}</li>`;
  if (e.type === "leave") return `<li><span class="tag ok">퇴근 승인</span>${esc(e.text.slice(0, 48))}${t}</li>`;
  if (e.type === "invite") return `<li><span class="tag">채널 초대</span>#프로젝트-티켓온${t}</li>`;
  return "";
}
function overlayHTML(e) {
  let inner = "";
  if (e.type === "task") inner = `<div class="label">새로운 업무가 배정되었습니다</div><h1>TASK-00${e.task.no}</h1><h2>${esc(e.task.title)}</h2><p>${esc(e.task.desc || "")}</p><div class="meta">담당 ${esc(e.task.owner)} · 마감 ${esc(e.task.due)} · 배정 ${esc(e.task.from)}</div>`;
  else if (e.type === "hint") inner = `<div class="label">김팀장의 힌트</div><h2>${esc(e.text)}</h2>`;
  else if (e.type === "debrief") inner = `<div class="label">${esc(e.title)}</div><p class="long">${esc(e.text).replace(/\n/g, "<br>")}</p>`;
  else if (e.type === "official") inner = `<div class="label">TICKET ON 공식 서비스</div><h2>공식 서비스가 바뀌었습니다</h2><p>${esc(e.text)}</p>`;
  else if (e.type === "invite") inner = `<div class="label">채널 초대</div><h2>#프로젝트-티켓온</h2><p>김팀장님이 신입사원을 프로젝트 채널에 초대했습니다.</p>`;
  else if (e.type === "leave") inner = `<div class="label">퇴근 승인</div><h1>오늘은 정시 퇴근입니다</h1><p class="long">${esc(e.text)}</p>`;
  else if (e.type === "ending") inner = `<div class="label">ENDING</div><h1>${esc(e.title)}</h1><p class="long">${esc(e.text)}</p><div class="meta">수고하셨습니다 👏</div>`;
  return `<div class="overlay ${e.type}" onclick="D.overlay=null;render()"><div class="box">${inner}</div></div>`;
}

boot().catch((e) => { app.innerHTML = `<div class="boot">오류: ${esc(e.message || e)}</div>`; });
