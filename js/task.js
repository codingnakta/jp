// =====================================================================
//  DAYEON TASK (업무 시스템) + 앱 전환
//  chat.js 뒤에 로드됨 (byId, openRoom, appendMessage, toast, G, Sched 사용)
//  화면: 나의 업무 목록 / 업무 상세(진행 현황) / 고객 문의 뷰어 / 이상 현상 기록 / 조사·검수 보고서 / UI·UX 가이드
// =====================================================================

const tasks = TASKS.map((t) => ({ ...t }));
let currentApp = "work";

const workApp = document.getElementById("work-app");
const taskApp = document.getElementById("task-app");
const ticketAppEl = document.getElementById("ticket-app");
const designAppEl = document.getElementById("design-app");
const devAppEl = document.getElementById("dev-app");
const taskContent = document.getElementById("task-content");
const crumbEl = document.getElementById("t-crumb");
const appMenu = document.getElementById("app-menu");

document.getElementById("t-me-avatar").textContent = PLAYER.name[0];
document.getElementById("t-me-name").textContent = `${PLAYER.name} · ${PLAYER.dept}`;

// ---------- 앱 전환 ----------
// 업무 도구는 해당 업무를 시작한 뒤에만 열림 (메뉴·첨부·버튼 등 모든 경로 공통)
function appUnlocked(name) {
  const st = G.state;
  if (name === "ticket") return !!st.task.started;
  if (name === "design") return !!(st.task2.started || (st.task4 && st.task4.started) || (st.task5 && st.task5.started));
  if (name === "dev") return !!(st.task3.started || (st.task4 && st.task4.started));
  if (name === "ops") return !!((st.task5 && st.task5.started) || (st.task6 && st.task6.started));
  return true;
}
function showApp(name, silent = false) {
  if (!appUnlocked(name)) {
    if (!silent) toast({ title: "DAYEON WORK", sub: { ticket: "TICKET ON", design: "DAYEON DESIGN", dev: "DAYEON DEV TOOLS", ops: "DAYEON DEPLOY" }[name] || name, text: "관련 업무를 시작하면 열 수 있습니다. 업무 상세에서 [업무 시작하기]를 누르세요." });
    name = ["work", "task"].includes(currentApp) ? currentApp : "task";
  }
  currentApp = name;
  G.state.currentApp = name;
  workApp.hidden = name !== "work";
  taskApp.hidden = name !== "task";
  ticketAppEl.hidden = name !== "ticket";
  designAppEl.hidden = name !== "design";
  devAppEl.hidden = name !== "dev";
  const opsEl = document.getElementById("ops-app"); if (opsEl) opsEl.hidden = name !== "ops";
  document.title = { task: "DAYEON TASK", ticket: "TICKET ON", design: "DAYEON DESIGN", dev: "DAYEON DEV TOOLS", ops: "DAYEON DEPLOY" }[name] || WORKSPACE.name;
  if (name === "ops" && typeof renderOps === "function") renderOps();
  if (name === "task") renderTaskPage();
  if (name === "ticket") {
    if (!G.state.task.ticketVisited) G.state.task.ticketVisited = true;
    if (typeof renderTicket === "function") renderTicket();
  }
  if (name === "design" && typeof renderDesign === "function") renderDesign();
  if (name === "dev" && typeof renderDevtool === "function") renderDevtool();
  G.save();
}

function openAppMenu(anchor) {
  const r = anchor.getBoundingClientRect();
  appMenu.hidden = false;
  appMenu.style.left = `${Math.max(8, r.left)}px`;
  appMenu.style.top = `${r.bottom + 6}px`;
  appMenu.querySelectorAll(".app-menu-item").forEach((b) => {
    b.classList.toggle("is-current", b.dataset.app === currentApp);
    if (b.dataset.app === "ticket") b.hidden = !G.state.task.started;
    if (b.dataset.app === "design") b.hidden = !G.state.task2.started;
    if (b.dataset.app === "dev") b.hidden = !G.state.task3.started;
    if (b.dataset.app === "ops") b.hidden = !((G.state.task5 && G.state.task5.started) || (G.state.task6 && G.state.task6.started));
  });
}
function closeAppMenu() { appMenu.hidden = true; }

document.addEventListener("click", (e) => {
  const trigger = e.target.closest("[data-app-menu]");
  if (trigger) {
    e.stopPropagation();
    appMenu.hidden ? openAppMenu(trigger) : closeAppMenu();
    return;
  }
  const item = e.target.closest("[data-app]");
  if (item) {
    closeAppMenu();
    showApp(item.dataset.app);
    return;
  }
  if (!e.target.closest("#app-menu")) closeAppMenu();
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAppMenu(); });

// ---------- 상태 헬퍼 ----------
const TS = (no = 1) => (no === 6 ? G.state.task6 : no === 5 ? G.state.task5 : no === 4 ? G.state.task4 : no === 3 ? G.state.task3 : no === 2 ? G.state.task2 : G.state.task);
function taskStatus(t) {
  const s = TS(t.no);
  if (!s) return t.status;
  if (s.done) return "완료";
  if (s.review && s.review.status === "pending") return "검토 대기";
  if (s.review && s.review.status === "returned") return "보완 요청";
  if (s.started) return "진행 중";
  return "진행 전";
}
const STATUS_CLS = { "진행 전": "todo", "진행 중": "doing", "완료": "done", "준비 중": "wait", "검토 대기": "wait", "보완 요청": "todo" };
function statusHTML(st) { return `<span class="t-status ${STATUS_CLS[st] || "todo"}">${esc(st)}</span>`; }
function visibleTasks() {
  return tasks.filter((t) => t.no === 1 || (t.no === 2 && G.state.task2.assigned) || (t.no === 3 && G.state.task3.assigned) || (t.no === 4 && G.state.task4.assigned) || (t.no === 5 && G.state.task5.assigned) || (t.no === 6 && G.state.task6 && G.state.task6.assigned));
}

function stepState1() {
  const s = TS(1);
  return { s1: s.inquiriesOpened.length >= 3, s2: s.reproduced.length >= 1, s3: s.reportSubmitted };
}
function stepState2() {
  const s = TS(2);
  return { a: s.findings.length >= 1, b: s.principlesChecked, c: s.designApplied, d: s.reportSubmitted };
}
function stepState6() {
  const s = TS(6); const q = s.qa; const m = s.meeting || {};
  const rel = typeof releaseState === "function" ? releaseState() : { status: "none" };
  const released = rel.status === "done" || (typeof releaseDone === "function" && releaseDone());
  return { a: !!(s.candidate && s.candidate.id), b: !!(q && q.run === q.total), c: !!(m.decision && (m.reason || "").trim()), d: s.reportSubmitted, e: released, f: s.postCheckDone };
}
function stepState5() {
  const s = TS(5);
  const bDone = s.designHistoryViewed && s.commitsViewed.length >= 1 && TASK5.questionsB.every((q) => (s.answersB[q.id] || "").trim());
  return { a: s.fileNotes.length >= 1, b: bDone, c: s.deploysViewed.length >= 1 && s.evidence.length >= 1, d: !!s.timeline.passed, e: s.reportSubmitted };
}
function stepState4() {
  const s = TS(4);
  return { a: s.reproductions.length >= 1, b: s.logViewed && s.clues.length >= 1, c: s.uiApplied, d: !!s.codeOk, e: !!s.qa, f: s.reportSubmitted };
}
function stepState3() {
  const s = TS(3);
  return { a: s.reproductions.length >= 1, b: s.devtoolOpened && s.clues.length >= 1, c: s.codeFixed, d: s.retest.passes >= 2, e: s.reportSubmitted };
}

function setView(view, taskNo = G.state.taskView.taskNo) {
  G.state.taskView = { view, taskNo };
  G.save();
  renderTaskPage();
}

// ---------- 페이지 라우팅 ----------
function renderTaskPage() {
  const nav = document.getElementById("t-nav-n");
  nav.textContent = visibleTasks().filter((t) => taskStatus(t) !== "완료").length || "";
  const { view, taskNo } = G.state.taskView;
  const t = tasks.find((x) => x.no === taskNo);
  if (view === "detail" && t) renderTaskDetail(t);
  else if (view === "inquiries" && t) renderInquiries(t);
  else if (view === "records" && t) renderRecords(t);
  else if (view === "qa" && t) renderQA(t);
  else if (view === "timeline" && t) renderTimeline5(t);
  else if (view === "meeting" && t) renderMeeting6(t);
  else if (view === "eval") renderEvalView();
  else if (view === "qb" && t) renderQuestionsB(t);
  else if (view === "evidence" && t) renderEvidence5(t);
  else if (view === "report" && t) (t.no === 6 ? renderReport6(t) : t.no === 5 ? renderReport5(t) : t.no === 4 ? renderReport4(t) : t.no === 3 ? renderReport3(t) : t.no === 2 ? renderReport2(t) : renderReport1(t));
  else if (view === "guide" && t) renderGuide(t);
  else renderTaskList();
}

// ---------- 나의 업무 목록 ----------
function renderTaskList() {
  crumbEl.innerHTML = `<b>나의 업무</b>`;
  const rows = visibleTasks().map((t) => `
    <tr class="row" data-task="${t.no}">
      <td class="code">${esc(t.code)}</td>
      <td class="ttl">${esc(t.title)}${t.priority ? ` <span class="t-prio">우선순위 ${esc(t.priority)}</span>` : ""}</td>
      <td>${statusHTML(taskStatus(t))}</td>
      <td>${esc(t.due)}</td>
      <td>${esc(t.from)}</td>
    </tr>`).join("");
  const next = G.state.task6Ready && !(G.state.task6 && G.state.task6.assigned)
    ? `<tr class="row muted"><td class="code">TASK-006</td><td class="ttl">퇴근 5분 전, 최후의 배포 (등록 대기 중)</td><td>${statusHTML("준비 중")}</td><td>-</td><td>김팀장</td></tr>`
    : G.state.task5Ready && !G.state.task5.assigned
    ? `<tr class="row muted"><td class="code">TASK-005</td><td class="ttl">수상한 배포 기록 (등록 대기 중)</td><td>${statusHTML("준비 중")}</td><td>-</td><td>김팀장</td></tr>`
    : "";
  taskContent.innerHTML = `<div class="t-page">
    <h1 class="t-page-title">나의 업무</h1>
    <table class="t-table"><thead><tr><th>번호</th><th>업무</th><th>상태</th><th>마감</th><th>배정</th></tr></thead><tbody>${rows}${next}</tbody></table>
  </div>`;
}

// ---------- 업무 상세 ----------
const ICON = {
  link: `<svg viewBox="0 0 24 24"><path d="M14 4h6v6m0-6L10 14M20 14v6H4V4h6" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>`,
  locked: `<svg viewBox="0 0 24 24"><path d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>`,
};
function reviewBanner(s) {
  if (!s.review) return "";
  if (s.review.status === "pending") return `<div class="t-banner wait"><b>검토 대기</b> 보고서를 제출했습니다. 김팀장이 확인한 뒤 승인 또는 보완 요청을 보냅니다.</div>`;
  if (s.review.status === "returned") return `<div class="t-banner bad"><b>보완 요청</b> ${esc(s.review.note || "보고서를 보완해서 다시 제출해 주세요.")}</div>`;
  if (s.review.status === "approved") return `<div class="t-banner ok"><b>승인됨</b> ${esc(s.review.note || "보고서가 승인되어 업무가 완료되었습니다.")}</div>`;
  return "";
}
function stepLI(n, ok, active, title, desc, action) {
  return `<li class="${ok ? "done" : active ? "active" : "todo"}">
    <span class="t-step-no">${ok ? "✓" : n}</span>
    <div class="t-step-body"><b>${title}</b><p>${desc}</p></div>
    ${action}
  </li>`;
}

function renderTaskDetail(t) {
  crumbEl.innerHTML = `<a data-tlist>나의 업무</a><span>/</span><b>업무 상세</b>`;
  const st = taskStatus(t);
  const s = TS(t.no);
  const files = t.attachments.map((a) => `
    <div class="t-file ${a.type === "locked" ? "locked" : ""}" data-attach="${esc(a.type)}" data-version="${esc(a.version || "")}" data-file="${esc(a.file || "")}" data-doc="${esc(a.doc || "")}" title="${a.type === "locked" ? "권한이 없습니다" : ""}">
      <span>${esc(a.name)}${a.meta ? `<small class="t-file-meta">${esc(a.meta)}</small>` : ""}</span>${ICON[a.type === "locked" ? "locked" : "link"]}
    </div>`).join("");

  let bottom = "";
  if (st === "진행 전") {
    const ph = livePhase(t.no);
    bottom = G.live && ph !== "ACTIVE"
      ? `<div class="t-locked">${ph === "ANNOUNCED" ? "업무가 배정되었습니다. 교사가 조사 시작을 열면 '업무 시작하기'가 활성화됩니다." : ph === "LOCKED" ? "아직 공개되지 않은 업무입니다." : "조사가 마감되었습니다."}</div><button class="t-cta secondary" disabled>업무 시작하기</button>`
      : `<button class="t-cta" data-start="${t.no}">업무 시작하기</button>`;
  } else if (t.no === 1) {
    const p = stepState1();
    const doneN = [p.s1, p.s2, p.s3].filter(Boolean).length;
    bottom = `${reviewBanner(s)}<div class="t-progress">
      <div class="t-progress-head"><h3>조사 진행 현황</h3><span>${doneN}/3 완료</span></div>
      <ol class="t-steps">
        ${stepLI(1, p.s1, true, "고객 문의 조사",
            `고객_문의_23건.csv를 열어 문의 내용을 읽고 공통점을 찾습니다. <em>상세 확인 ${s.inquiriesOpened.length}/23</em>`,
            `<button class="btn ${p.s1 ? "" : "primary"}" data-open-inquiries>고객 문의 열기</button>`)}
        ${stepLI(2, p.s2, p.s1, "서비스 오류 재현",
            `TICKET ON 테스트 사이트에서 예매 과정을 직접 진행하고 발견한 이상 현상을 기록합니다. <em>기록 ${s.reproduced.length}건${s.ticketVisited ? "" : " · 미방문"}</em>`,
            `<span class="t-btns"><button class="btn ${p.s2 ? "" : p.s1 ? "primary" : ""}" data-open-ticket>TICKET ON 열기</button>${s.reproduced.length ? `<button class="btn" data-open-records>기록 보기</button>` : ""}</span>`)}
        ${stepLI(3, p.s3, p.s1 && p.s2, "조사 보고서 제출",
            s.reportSubmitted ? `제출 완료 · ${esc(s.report?.submittedAt || "")} · ${esc(st)}` : `문제 발생 단계와 확인한 문제, 근거, 추가 확인 사항을 정리해 김팀장에게 제출합니다.`,
            `<button class="btn ${p.s1 && p.s2 && !p.s3 ? "primary" : ""}" data-open-report>${s.reportSubmitted ? "보고서 보기" : "조사 보고서 작성"}</button>`)}
      </ol>
    </div>`;
  } else if (t.no === 6) {
    const p = stepState6();
    const doneN = [p.a, p.b, p.c, p.d, p.e, p.f].filter(Boolean).length;
    const q = s.qa; const m = s.meeting || {};
    bottom = `${reviewBanner(s)}<div class="t-progress">
      <div class="t-progress-head"><h3>최종 배포 검수 현황</h3><span>${doneN}/6 완료</span></div>
      <ol class="t-steps">
        ${stepLI("A", p.a, true, "MISSION A · 어떤 버전을 배포할 것인가?",
            `DAYEON DEPLOY에서 배포 후보 네 개의 빌드 정보·릴리스 노트·QA·승인 기록을 비교하고 배포 후보를 선택해 이유를 기록합니다. <em>${s.candidate && s.candidate.id ? "선택: " + esc(s.candidate.id) : "미선택"}</em>`,
            `<button class="btn ${p.a ? "" : "primary"}" data-open-ops="candidates">배포 후보 보기</button>`)}
        ${stepLI("B", p.b, p.a, "MISSION B · 최종 QA 검증",
            `TICKET ON을 실제로 조작하며 QA-001~006을 실행합니다. 디자인 항목은 관찰 기록, 기능 항목은 조작 결과로 자동 판정됩니다. <em>${q ? `${q.run}/${q.total} 실행 · ${q.passed} PASS` : "미실행"}</em>`,
            `<span class="t-btns"><button class="btn ${p.a && !p.b ? "primary" : ""}" data-open-ops="finalqa">최종 QA</button><button class="btn" data-open-ticket>TICKET ON</button></span>`)}
        ${stepLI("C", p.c, p.b, "MISSION C · 출시 승인 회의",
            `QA 결과와 빌드 기록을 보고 출시 가능 여부를 팀이 판단하고 합의 보고서를 작성합니다. <em>${m.decision ? (m.decision === "approve" ? "출시 승인" : "출시 보류") : "합의 전"}</em>`,
            `<button class="btn ${p.b && !p.c ? "primary" : ""}" data-open-meeting>출시 검토 회의</button>`)}
        ${stepLI("D", p.d, p.c, "출시 판단 보고서 제출 · 팀장 승인",
            s.reportSubmitted ? `제출 완료 · ${esc(s.report?.submittedAt || "")} · ${esc(st)}` : `후보 선택·QA 결과·회의 합의가 자동 첨부된 보고서를 제출합니다. 팀장(교사) 승인 후 배포할 수 있습니다.`,
            `<button class="btn ${p.c && !p.d ? "primary" : ""}" data-open-report>${s.reportSubmitted ? "보고서 보기" : "보고서 제출"}</button>`)}
        ${stepLI("E", p.e, s.review.status === "approved", "MISSION D · 배포 실행",
            `배포 전 체크리스트(실제 기록 자동 반영)를 확인하고 [운영 환경에 배포하기]로 배포를 요청합니다. 실제 배포는 팀장(교사) 승인으로 실행됩니다. <em>${p.e ? "배포 완료" : s.release && s.release.requested ? "배포 요청됨 · 승인 대기" : s.review.status === "approved" ? "배포 가능" : "보고서 승인 후"}</em>`,
            `<button class="btn ${s.review.status === "approved" && !p.e ? "primary" : ""}" data-open-ops="release">배포 실행</button>`)}
        ${stepLI("F", p.f, p.e, "FINAL · 배포 후 운영 상태 확인",
            `배포 성공 메시지 이후 운영 버전·서비스·예매·결제·오류 로그·헬스 체크를 확인하고 '배포 후 확인 완료'를 보고합니다. <em>${p.f ? "확인 완료 " + esc(s.postCheckAt || "") : "-"}</em>`,
            `<button class="btn ${p.e && !p.f ? "primary" : ""}" data-open-ops="release">운영 상태 확인</button>`)}
      </ol>
    </div>`;
  } else if (t.no === 5) {
    const p = stepState5();
    const doneN = [p.a, p.b, p.c, p.d, p.e].filter(Boolean).length;
    const tl = s.timeline;
    bottom = `${reviewBanner(s)}<div class="t-progress">
      <div class="t-progress-head"><h3>사고 조사 현황</h3><span>${doneN}/5 완료</span></div>
      <ol class="t-steps">
        ${stepLI("A", p.a, true, "MISSION A · 수상한 프로젝트 공유 폴더",
            `공유 드라이브의 파일을 열어 이름·폴더와 실제 내용(버전·빌드 ID·생성 시각)을 비교하고 이상한 점을 기록합니다. <em>열람 ${s.filesViewed.length}/${TASK5.files.length} · 기록 ${s.fileNotes.length}건</em>`,
            `<button class="btn ${p.a ? "" : "primary"}" data-open-ops="files">공유 폴더 열기</button>`)}
        ${stepLI("B", p.b, p.a, "MISSION B · 디자인 변경 이력과 Git 기록",
            `디자인 v2→v4 변경 이력과 개발팀 커밋을 확인하고 조사 질문 4개에 답합니다. <em>디자인 이력 ${s.designHistoryViewed ? "확인" : "-"} · 커밋 ${s.commitsViewed.length}/${TASK5.commits.length} · 답변 ${TASK5.questionsB.filter((q) => (s.answersB[q.id] || "").trim()).length}/4</em>`,
            `<span class="t-btns"><button class="btn" data-open-design="history">디자인 변경 이력</button><button class="btn" data-open-ops="git">Git 기록</button><button class="btn ${p.a && !p.b ? "primary" : ""}" data-open-qb>조사 질문 답하기</button></span>`)}
        ${stepLI("C", p.c, p.b, "MISSION C · 배포 기록 조사",
            `DAYEON DEPLOY에서 테스트·운영 환경의 버전과 배포 로그를 비교하고, QA 결과·지난 대화와 대조해 증거를 모읍니다. <em>배포 ${s.deploysViewed.length}/${TASK5.deploys.length} · QA ${s.qaViewed ? "확인" : "-"} · 대화 ${s.chatViewed ? "확인" : "-"} · 증거 ${s.evidence.length}건</em>`,
            `<span class="t-btns"><button class="btn ${p.b && !p.c ? "primary" : ""}" data-open-ops="deploy">배포 이력 열기</button><button class="btn" data-open-evidence>증거 목록</button></span>`)}
        ${stepLI("D", p.d, p.c, "MISSION D · 사건 타임라인 재구성",
            `조사한 기록을 바탕으로 여섯 사건을 시간순으로 배치하고 검증합니다. <em>${tl.passed ? "검증 통과" : tl.attempts ? `검증 ${tl.attempts}회 · 불일치` : "미작성"}</em>`,
            `<button class="btn ${p.c && !p.d ? "primary" : ""}" data-open-timeline>타임라인 열기</button>`)}
        ${stepLI("E", p.e, p.d, "조사 결과 보고서",
            s.reportSubmitted ? `제출 완료 · ${esc(s.report?.submittedAt || "")} · ${esc(st)}` : `확인된 버전 불일치, 사건 발생 과정(타임라인 자동 첨부), 직접 원인, 예방하지 못한 이유, 재발 방지 대책, 참고 증거를 정리해 제출합니다.`,
            `<button class="btn ${p.d && !p.e ? "primary" : ""}" data-open-report>${s.reportSubmitted ? "보고서 보기" : "조사 보고서 작성"}</button>`)}
      </ol>
    </div>`;
  } else if (t.no === 4) {
    const p = stepState4();
    const doneN = [p.a, p.b, p.c, p.d, p.e, p.f].filter(Boolean).length;
    const q = s.qa;
    bottom = `${reviewBanner(s)}<div class="t-progress">
      <div class="t-progress-head"><h3>결제 오류 대응 현황</h3><span>${doneN}/6 완료</span></div>
      <ol class="t-steps">
        ${stepLI("A", p.a, true, "MISSION A · 결제 오류 재현",
            `TICKET ON 결제 확인 화면에서 시나리오 A·B·C로 테스트 결제를 진행하고 '오류 재현 기록'에 동작·현상·예상·증거를 적습니다. <em>기록 ${s.reproductions.length}건 · 요청 ${s.requests.length}건</em>`,
            `<span class="t-btns"><button class="btn ${p.a ? "" : "primary"}" data-open-pay-ticket>TICKET ON 결제 테스트</button>${s.reproductions.length ? `<button class="btn" data-open-records>기록 보기</button>` : ""}</span>`)}
        ${stepLI("B", p.b, p.a, "MISSION B · 결제 요청 로그 조사",
            `개발자 도구의 payment_network.log 에서 요청·응답을 비교하고, 반복된 요청과 실제 결과를 조사 기록에 담습니다. <em>단서 ${s.clues.length}건</em>`,
            `<button class="btn ${p.a && !p.b ? "primary" : ""}" data-open-pay="net">요청 로그 열기</button>`)}
        ${stepLI("C", p.c, p.b, "MISSION C · 사용자 경험 개선",
            `결제 UI 편집기에서 진행 전·처리 중·완료·실패·확인 필요 상태의 안내를 고르고 미리보기로 확인한 뒤 적용합니다. <em>${s.uiApplied ? "적용됨 " + esc(s.uiAppliedAt || "") : "미적용"}</em>`,
            `<button class="btn ${p.b && !p.c ? "primary" : ""}" data-open-design="pay">결제 UI 편집기</button>`)}
        ${stepLI("D", p.d, p.b, "MISSION D · 결제 처리 코드 수정",
            `payment.js 의 handlePayment 를 고쳐 중복 요청 차단·서버 멱등성·결과 분기를 만들고 [테스트 실행]으로 확인합니다. <em>${s.codeTested ? (s.codeOk ? "테스트 통과" : "테스트 실패") : "미실행"}${s.testRuns ? ` (${s.testRuns}회)` : ""}</em>`,
            `<button class="btn ${p.b && !p.d ? "primary" : ""}" data-open-pay="js">코드 수정하기</button>`)}
        ${stepLI("E", p.e && q && q.allPass, p.c || p.d, "MISSION E · QA 최종 검증",
            `정상·연속 클릭·지연·실패·예매 내역 다섯 항목을 현재 팀의 UI·코드 상태로 검사합니다. <em>${q ? `${q.passed}/${q.total} 통과${q.stale ? " · 수정 후 재실행 필요" : ""}` : "미실행"}</em>`,
            `<button class="btn ${(p.c || p.d) && !(q && q.allPass) ? "primary" : ""}" data-open-qa>QA 실행</button>`)}
        ${stepLI("F", p.f, p.e, "업무 보고서",
            s.reportSubmitted ? `제출 완료 · ${esc(s.report?.submittedAt || "")} · ${esc(st)}` : `발견한 문제, UX·개발 측면 원인, 수정 사항(자동 첨부), 검증 결과(자동 첨부), 추가 확인 사항을 정리해 제출합니다.`,
            `<button class="btn ${p.e && !p.f ? "primary" : ""}" data-open-report>${s.reportSubmitted ? "보고서 보기" : "업무 보고서 작성"}</button>`)}
      </ol>
    </div>`;
  } else if (t.no === 3) {
    const p = stepState3();
    const doneN = [p.a, p.b, p.c, p.d, p.e].filter(Boolean).length;
    bottom = `${reviewBanner(s)}<div class="t-progress">
      <div class="t-progress-head"><h3>디버깅 진행 현황</h3><span>${doneN}/5 완료</span></div>
      <ol class="t-steps">
        ${stepLI("A", p.a, true, "MISSION A · 오류 재현",
            `TICKET ON 공연 상세에서 예매하기 버튼을 직접 눌러 보고, 테스트 모드의 '오류 재현 기록'에 수행한 동작·실제 현상·예상 동작을 적습니다. <em>기록 ${s.reproductions.length}건${s.reproAttempts ? ` · 반응 없는 클릭 ${s.reproAttempts}회` : ""}</em>`,
            `<span class="t-btns"><button class="btn ${p.a ? "" : "primary"}" data-open-ticket>TICKET ON 열기</button>${s.reproductions.length ? `<button class="btn" data-open-records>기록 보기</button>` : ""}</span>`)}
        ${stepLI("B", p.b, p.a, "MISSION B · 개발자 도구 조사",
            `console.log, index.html, reservation.js 를 읽고 의심되는 줄과 오류 메시지를 클릭해 조사 기록에 담습니다. <em>단서 ${s.clues.length}건</em>`,
            `<button class="btn ${p.a && !p.b ? "primary" : ""}" data-open-dev="log">개발자 도구 열기</button>`)}
        ${stepLI("C", p.c, p.b, "MISSION C · 코드 수정하기",
            `reservation.js 의 요소 선택 부분을 직접 고치고 [테스트 실행]으로 결과를 확인합니다. <em>${s.codeTested ? (s.codeFixed ? "테스트 통과" : "마지막 테스트 실패") : "테스트 미실행"}${s.testRuns ? ` (${s.testRuns}회)` : ""}</em>`,
            `<button class="btn ${p.b && !p.c ? "primary" : ""}" data-open-dev="js">코드 수정하기</button>`)}
        ${stepLI("D", p.d, p.c, "MISSION D · 수정 후 재테스트",
            `TICKET ON 공연 상세로 돌아가 예매하기 버튼을 2번 이상 눌러 좌석 선택으로 이동하는지 확인합니다. <em>정상 동작 ${s.retest.passes}/2</em>`,
            `<button class="btn ${p.c && !p.d ? "primary" : ""}" data-open-ticket>TICKET ON에서 재테스트</button>`)}
        ${stepLI("E", p.e, p.d, "MISSION E · 오류 수정 보고서",
            s.reportSubmitted ? `제출 완료 · ${esc(s.report?.submittedAt || "")} · ${esc(st)}` : `발견한 오류, 원인, 수정 내용(자동 첨부), 테스트 결과(자동 첨부), 개선 의견과 팀 토론 내용을 정리해 제출합니다.`,
            `<button class="btn ${p.d && !p.e ? "primary" : ""}" data-open-report>${s.reportSubmitted ? "보고서 보기" : "오류 수정 보고서 작성"}</button>`)}
      </ol>
    </div>`;
  } else {
    const p = stepState2();
    const doneN = [p.a, p.b, p.c, p.d].filter(Boolean).length;
    bottom = `${reviewBanner(s)}<div class="t-progress">
      <div class="t-progress-head"><h3>검수 진행 현황</h3><span>${doneN}/4 완료</span></div>
      <ol class="t-steps">
        ${stepLI("A", p.a, true, "MISSION A · 틀린 디자인 찾기",
            `디자인 검수 뷰어에서 v2와 v4를 비교하고 문제라고 생각하는 요소를 클릭해 검수 목록에 담습니다. <em>발견 ${s.findings.length}건${s.findingsRevealed ? " · 검수 결과 확인됨" : ""}</em>`,
            `<button class="btn ${p.a ? "" : "primary"}" data-open-design="review">디자인 검수 열기</button>`)}
        ${stepLI("B", p.b, p.a, "MISSION B · 디자인 원칙 분석",
            `사내 UI/UX 가이드를 읽고, 발견한 문제가 어떤 디자인 원칙과 관련 있는지 연결합니다. <em>${s.guideOpened ? "가이드 열람" : "가이드 미열람"}${p.b ? " · 분석 확인됨" : ""}</em>`,
            `<span class="t-btns"><button class="btn" data-open-guide>가이드 보기</button><button class="btn ${p.a && !p.b ? "primary" : ""}" data-open-design="principles">원칙 분석 열기</button></span>`)}
        ${stepLI("C", p.c, p.b, "MISSION C · 직접 UI 수정하기",
            `예매 버튼·정보 배치·좌석 상태·모바일·버튼 일관성 옵션을 고르면서 미리보기로 확인하고, 운영 사이트에 적용합니다. <em>${p.c ? "TICKET ON 적용 완료" : "미적용"}</em>`,
            `<span class="t-btns"><button class="btn ${p.b && !p.c ? "primary" : ""}" data-open-design="edit">디자인 수정 열기</button>${p.c ? `<button class="btn" data-open-ticket>적용 결과 보기</button>` : ""}</span>`)}
        ${stepLI("D", p.d, p.c, "검수 보고서 제출",
            s.reportSubmitted ? `제출 완료 · ${esc(s.report?.submittedAt || "")} · ${esc(st)}` : `발견한 문제, 관련 원칙, 적용한 개선, 기대 효과, 개발 확인 사항을 정리해 제출합니다.`,
            `<button class="btn ${p.c && !p.d ? "primary" : ""}" data-open-report>${s.reportSubmitted ? "보고서 보기" : "검수 보고서 작성"}</button>`)}
      </ol>
    </div>`;
  }

  taskContent.innerHTML = `<div class="t-page">
    <div class="t-card">
      <div class="t-card-top">${statusHTML(st)}<span>${esc(t.code)}</span>${t.priority ? `<span class="t-prio">우선순위 ${esc(t.priority)}</span>` : ""}</div>
      <h2>${esc(t.title)}</h2>
      ${t.subtitle ? `<div class="t-subtitle">${esc(t.subtitle)}${t.kind ? ` · ${esc(t.kind)}` : ""}</div>` : ""}
      <div class="t-meta">담당자 <b>${esc(t.owner)}</b> · 마감 <b>${esc(t.due)}</b> · 배정 <b>${esc(t.from)}</b></div>
      <div class="t-sec"><h3>업무 배경</h3><p>${esc(t.background)}</p></div>
      <div class="t-sec"><h3>업무 목표</h3><p>${esc(t.goal)}</p></div>
      <div class="t-attach">
        <h3><svg viewBox="0 0 24 24"><path d="m16.5 6.5-7.8 7.8a2 2 0 0 0 2.8 2.8l8.5-8.5a4 4 0 0 0-5.7-5.7L5.8 11.4a6 6 0 0 0 8.5 8.5L21 13.2" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>첨부 자료</h3>
        ${files}
      </div>
      ${bottom}
    </div>
  </div>`;
}

function openTask(no) {
  setView("detail", no);
  showApp("task");
}

function livePhase(no) { return G.live && typeof Live !== "undefined" ? Live.taskPhase(no) : "ACTIVE"; }
function startTask(no) {
  if (G.live && livePhase(no) !== "ACTIVE") { toast({ title: "DAYEON TASK", sub: `TASK-00${no}`, text: "교사가 조사 시작을 열면 업무를 시작할 수 있습니다." }); return; }
  TS(no).started = true;
  G.save();
  renderTaskPage();
  toast({ title: "DAYEON TASK", sub: `TASK-00${no}`, text: "업무를 시작했습니다. 진행 현황을 따라 진행하세요.", app: "task" });
}

// ---------- 고객 문의 뷰어 ----------
const inqUI = { q: "", cat: "전체", ch: "전체", sel: null };

function renderInquiries(t) {
  crumbEl.innerHTML = `<a data-tlist>나의 업무</a><span>/</span><a data-tdetail>업무 상세</a><span>/</span><b>첨부 자료</b>`;
  TS(1).inquiriesViewed = true;

  const q = inqUI.q.trim();
  const list = INQUIRIES.filter((i) =>
    (inqUI.cat === "전체" || i.category === inqUI.cat) &&
    (inqUI.ch === "전체" || i.channel === inqUI.ch) &&
    (!q || (i.title + i.body + i.id + i.device).includes(q))
  );
  const sel = INQUIRIES.find((i) => i.id === inqUI.sel);
  const opened = new Set(TS(1).inquiriesOpened);

  const rows = list.map((i) => `
    <tr class="row ${i.id === inqUI.sel ? "is-sel" : ""} ${opened.has(i.id) ? "is-read" : ""}" data-inq="${i.id}">
      <td class="code">${esc(i.id)}</td>
      <td>${esc(i.time)}</td>
      <td>${esc(i.channel)}</td>
      <td><span class="t-chip">${esc(i.category)}</span></td>
      <td class="ttl">${esc(i.title)}</td>
      <td class="muted">${esc(i.device)}</td>
      <td><span class="t-status ${i.status === "접수" ? "todo" : "doing"}">${esc(i.status)}</span></td>
    </tr>`).join("");

  const detail = inquiryDetailHTML(sel);

  taskContent.innerHTML = `<div class="t-page wide">
    <div class="t-viewer-head">
      <button class="btn" data-tdetail>← 업무로 돌아가기</button>
      <div><h1>고객_문의_23건.csv</h1><span>CS팀 공유 · 2026-10-19 09:10 내보내기 · 총 23건 · 접수분류는 상담원이 접수 시 입력한 값입니다</span></div>
      <span class="t-read-count">상세 확인 ${opened.size}/23</span>
    </div>
    <div class="t-toolbar">
      <input type="search" id="inq-q" placeholder="문의 검색 (내용, 접수번호, 기기)" value="${esc(inqUI.q)}" />
      <select id="inq-cat">${["전체", ...INQUIRY_CATEGORIES].map((c) => `<option ${c === inqUI.cat ? "selected" : ""}>${c}</option>`).join("")}</select>
      <select id="inq-ch">${["전체", "전화", "채팅", "이메일"].map((c) => `<option ${c === inqUI.ch ? "selected" : ""}>${c}</option>`).join("")}</select>
      <span class="t-count">${list.length}건 표시</span>
    </div>
    <div class="t-viewer">
      <div class="t-viewer-table">
        <table class="t-table inq">
          <thead><tr><th>접수번호</th><th>시각</th><th>채널</th><th>접수분류</th><th>문의 요약</th><th>이용환경</th><th>상태</th></tr></thead>
          <tbody>${rows || `<tr><td colspan="7" class="t-empty">검색 결과가 없습니다.</td></tr>`}</tbody>
        </table>
      </div>
      ${detail}
    </div>
  </div>`;

  const qEl = document.getElementById("inq-q");
  qEl.addEventListener("input", () => { inqUI.q = qEl.value; renderInquiries(t); document.getElementById("inq-q").focus(); });
  document.getElementById("inq-cat").addEventListener("change", (e) => { inqUI.cat = e.target.value; renderInquiries(t); });
  document.getElementById("inq-ch").addEventListener("change", (e) => { inqUI.ch = e.target.value; renderInquiries(t); });
  G.save();
}

function inquiryDetailHTML(sel) {
  if (!sel) return `<div class="t-inq-detail empty">목록에서 문의를 선택하면 상세 내용이 표시됩니다.</div>`;
  return `
    <div class="t-inq-detail">
      <div class="t-inq-top"><span class="code">${esc(sel.id)}</span><span class="t-status ${sel.status === "접수" ? "todo" : "doing"}">${esc(sel.status)}</span></div>
      <h3>${esc(sel.title)}</h3>
      <dl class="t-inq-meta">
        <dt>접수시각</dt><dd>2026-10-19 ${esc(sel.time)}</dd>
        <dt>접수채널</dt><dd>${esc(sel.channel)}</dd>
        <dt>접수분류</dt><dd>${esc(sel.category)} <small class="t-dim">상담원 입력</small></dd>
        <dt>이용환경</dt><dd>${esc(sel.device)}</dd>
        <dt>담당</dt><dd>CS팀 오지은</dd>
      </dl>
      <div class="t-inq-body"><h4>문의 내용</h4><p>${esc(sel.body)}</p></div>
      <div class="t-inq-foot">상담 메모: (없음)</div>
    </div>`;
}
// 행 클릭: 전체를 다시 그리지 않고 선택 표시와 오른쪽 상세만 바꿈 (스크롤 유지)
function selectInquiry(id) {
  inqUI.sel = id;
  const s = TS(1);
  if (!s.inquiriesOpened.includes(id)) s.inquiriesOpened.push(id);
  G.save();
  taskContent.querySelectorAll("[data-inq]").forEach((tr) => {
    tr.classList.toggle("is-sel", tr.dataset.inq === id);
    if (tr.dataset.inq === id) tr.classList.add("is-read");
  });
  const old = taskContent.querySelector(".t-inq-detail");
  if (old) old.outerHTML = inquiryDetailHTML(INQUIRIES.find((i) => i.id === id));
  const cnt = taskContent.querySelector(".t-read-count");
  if (cnt) cnt.textContent = `상세 확인 ${s.inquiriesOpened.length}/23`;
}

// ---------- 이상 현상 기록 보기 ----------
function recordsListHTML(list) {
  if (!list.length) return `<div class="t-empty-box">아직 저장된 기록이 없습니다. TICKET ON 상단 테스트 모드 바에서 작성할 수 있습니다.</div>`;
  return `<div class="t-recs">${list.map((r, i) => `
    <div class="t-rec">
      <div class="t-rec-top"><span class="t-rec-n">#${i + 1}</span><b>${esc(r.screenLabel)}</b>${r.type ? `<span class="t-chip">${esc(r.type)}</span>` : ""}<span class="t-dim">${esc(r.time)}</span></div>
      ${r.action ? `<div class="t-rec-row"><span>수행한 동작</span><p>${esc(r.action)}</p></div>` : ""}
      <div class="t-rec-row"><span>${r.action ? "실제 발생한 현상" : "발견한 현상"}</span><p>${esc(r.found)}</p></div>
      ${r.expected ? `<div class="t-rec-row"><span>예상한 정상 동작</span><p>${esc(r.expected)}</p></div>` : ""}
      ${r.evidence ? `<div class="t-rec-row"><span>관련 증거</span><p>${esc(r.evidence)}</p></div>` : ""}
    </div>`).join("")}</div>`;
}
function renderRecords(t) {
  const is3 = t.no >= 3;
  crumbEl.innerHTML = `<a data-tlist>나의 업무</a><span>/</span><a data-tdetail>업무 상세</a><span>/</span><b>${is3 ? "오류 재현 기록" : "이상 현상 기록"}</b>`;
  const list = t.no === 4 ? TS(4).reproductions : t.no === 3 ? TS(3).reproductions : TS(1).reproduced;
  taskContent.innerHTML = `<div class="t-page">
    <div class="t-viewer-head">
      <button class="btn" data-tdetail>← 업무로 돌아가기</button>
      <div><h1>${is3 ? "오류 재현 기록" : "이상 현상 기록"}</h1><span>TICKET ON 테스트 모드에서 저장한 기록 ${list.length}건 · 수정·삭제는 TICKET ON에서</span></div>
      <button class="btn" data-open-ticket>TICKET ON 열기</button>
    </div>
    ${recordsListHTML(list)}
  </div>`;
}

// ---------- 보고서 공통 ----------
function reportHead(t, s, title) {
  const closed = G.live && !["ACTIVE"].includes(livePhase(t.no));
  const ro = (s.reportSubmitted && s.review.status !== "returned") || s.review.status === "submitting" || !!s.review.locked || (closed && !s.reportSubmitted && s.review.status !== "returned");
  crumbEl.innerHTML = `<a data-tlist>나의 업무</a><span>/</span><a data-tdetail>업무 상세</a><span>/</span><b>${title}</b>`;
  const sub = s.review.status === "submitting" ? "제출 중… (저장 확인 대기)"
    : closed && !s.reportSubmitted ? "조사가 마감되어 제출할 수 없습니다"
    : s.review.locked && s.review.status === "pending" ? `제출 완료 · 교사가 수정을 잠갔습니다`
    : s.review.status === "pending" ? `제출 완료 · ${esc(s.report?.submittedAt || "")} · 검토 대기`
    : s.review.status === "approved" ? `승인 · ${esc(s.report?.submittedAt || "")}`
    : s.review.status === "returned" ? `보완 요청 받음 · 수정 후 다시 제출`
    : "작성 중 · 자동 저장됨";
  return { ro, html: `<div class="t-viewer-head">
      <button class="btn" data-tdetail>← 업무로 돌아가기</button>
      <div><h1>${esc(t.code)} ${title}</h1><span>${sub}</span></div>
      ${s.reportSubmitted ? statusHTML(taskStatus(t)) : ""}
    </div>${reviewBanner(s)}` };
}
function bindDraft(s) {
  const f = document.getElementById("report-form");
  if (!f) return;
  const save = () => {
    s.reportDraft = readReportForm(f);
    const el = document.getElementById("report-saved");
    if (el) { el.textContent = `자동 저장됨 · ${fmtMinutes(nowMinutes())}`; }
    G.save();
  };
  f.addEventListener("input", save);
  f.addEventListener("change", save);
}
function readReportForm(f) {
  const r = {};
  f.querySelectorAll("textarea[name], input[type=text][name]").forEach((el) => (r[el.name] = el.value.trim()));
  const groups = {};
  f.querySelectorAll("input[type=checkbox][name]").forEach((el) => {
    (groups[el.name] = groups[el.name] || []);
    if (el.checked) groups[el.name].push(el.value);
  });
  Object.assign(r, groups);
  return r;
}
function textQ(q, d, dis) {
  return `<section class="t-rsec">
    <h3>${esc(q.title)}</h3>
    <p class="t-help">${esc(q.help)}</p>
    <textarea class="t-input" name="${q.id}" rows="4" ${dis}>${esc(d[q.id] || "")}</textarea>
  </section>`;
}
function feedbackHTML(problems) {
  return `<b>제출 전에 보완이 필요합니다.</b><ul>${problems.map((p) => `<li><span>${esc(p.where)}</span> ${esc(p.msg)}</li>`).join("")}</ul>`;
}

// ---------- TASK-001 조사 보고서 ----------
function renderReport1(t) {
  const s = TS(1);
  const { ro, html } = reportHead(t, s, "조사 보고서");
  const d = (ro ? s.report : s.reportDraft) || { stages: [], problems: "", evidence: "", followup: "", refs: [] };
  const dis = ro ? "disabled" : "";
  const opened = s.inquiriesOpened;
  taskContent.innerHTML = `<div class="t-page">
    ${html}
    <div class="t-rstats">
      <span>확인한 고객 문의 <b>${opened.length}</b>건</span>
      <span>이상 현상 기록 <b>${s.reproduced.length}</b>건</span>
      <button class="btn" data-open-records>이상 현상 기록 보기</button>
    </div>
    <form class="t-card t-report" id="report-form" onsubmit="return false">
      <section class="t-rsec">
        <h3>① 문제가 발생한 단계 <small>복수 선택</small></h3>
        <p class="t-help">문제가 확인된 위치를 분류합니다.</p>
        <div class="t-opts row">
          ${REPORT.stages.map((o) => `<label class="t-opt"><input type="checkbox" name="stages" value="${o.id}" ${(d.stages || []).includes(o.id) ? "checked" : ""} ${dis}><span>${esc(o.label)}</span></label>`).join("")}
        </div>
      </section>
      ${REPORT.questions.map((q) => textQ(q, d, dis)).join("")}
      <section class="t-rsec">
        <h3>참고한 고객 문의 <small>선택 · 읽은 문의만 표시</small></h3>
        ${opened.length ? `<div class="t-opts row chips">${opened.map((id) => `<label class="t-opt chip"><input type="checkbox" name="refs" value="${id}" ${(d.refs || []).includes(id) ? "checked" : ""} ${dis}><span>${esc(id.replace("CS-251019-", "CS-"))}</span></label>`).join("")}</div>` : `<p class="t-help">아직 읽은 고객 문의가 없습니다.</p>`}
      </section>
      <div class="t-feedback" id="report-feedback" hidden></div>
      ${ro ? "" : `<div class="t-ractions"><span class="t-help" id="report-saved">자동 저장됨</span><button class="t-cta inline" data-submit-report="1">${s.review.status === "returned" ? "보완해서 다시 제출" : "보고서 제출"}</button></div>`}
    </form>
  </div>`;
  if (!ro) bindDraft(s);
}
function validateReport1(r) {
  const s = TS(1);
  const p = [];
  if (s.inquiriesOpened.length < 3) p.push({ where: "고객 문의", msg: "고객 문의 상세를 3건 이상 확인하세요." });
  if (!s.ticketVisited) p.push({ where: "오류 재현", msg: "TICKET ON 테스트 사이트를 방문해 직접 확인하세요." });
  if (!s.reproduced.length) p.push({ where: "오류 재현", msg: "이상 현상 기록을 1건 이상 저장하세요. (TICKET ON 상단 → 이상 현상 기록)" });
  if (!(r.stages || []).length) p.push({ where: "①", msg: "문제가 발생한 단계를 1개 이상 선택하세요." });
  REPORT.questions.forEach((q) => { if (!r[q.id]) p.push({ where: q.title.slice(0, 1), msg: `'${q.title.slice(2)}' 항목을 작성하세요.` }); });
  return p;
}

// ---------- TASK-002 검수 보고서 ----------
function renderReport2(t) {
  const s = TS(2);
  const { ro, html } = reportHead(t, s, "검수 보고서");
  const d = (ro ? s.report : s.reportDraft) || { problems: [], problemsEtc: "", principles: [], improvements: "", expected: "", devChecks: "" };
  const dis = ro ? "disabled" : "";
  const spotsFound = s.findings.map((f) => TASK2.spots.find((x) => x.id === f.spotId)).filter(Boolean);
  const chosen = s.design || {};
  const applied = TASK2.options.map((o) => {
    const c = o.choices.find((x) => x.id === chosen[o.id]);
    return c ? `<li><b>${esc(o.title.replace(/^[①-⑩]\s*/, ""))}</b> → ${esc(c.label)}</li>` : "";
  }).join("");
  taskContent.innerHTML = `<div class="t-page">
    ${html}
    <div class="t-rstats">
      <span>발견한 디자인 차이 <b>${s.findings.length}</b>건</span>
      <span>원칙 분석 <b>${s.principlesChecked ? "확인됨" : "미확인"}</b></span>
      <span>디자인 적용 <b>${s.designApplied ? "완료" : "미적용"}</b></span>
    </div>
    <form class="t-card t-report" id="report-form" onsubmit="return false">
      <section class="t-rsec">
        <h3>① 운영 화면에서 발견한 문제 <small>복수 선택 · 검수 목록에서 가져옴</small></h3>
        ${spotsFound.length ? `<div class="t-opts">${spotsFound.map((sp) => `<label class="t-opt"><input type="checkbox" name="problems" value="${sp.id}" ${(d.problems || []).includes(sp.id) ? "checked" : ""} ${dis}><span>${esc(sp.label)}</span></label>`).join("")}</div>` : `<p class="t-help">디자인 검수에서 발견한 항목이 없습니다.</p>`}
        <input class="t-input" type="text" name="problemsEtc" placeholder="그 밖에 발견한 문제 (직접 입력)" value="${esc(d.problemsEtc || "")}" ${dis} />
      </section>
      <section class="t-rsec">
        <h3>② 문제와 관련된 UI/UX 원칙 <small>복수 선택</small></h3>
        <div class="t-opts row">
          ${TASK2.principles.map((p) => `<label class="t-opt"><input type="checkbox" name="principles" value="${p.id}" ${(d.principles || []).includes(p.id) ? "checked" : ""} ${dis}><span>${esc(p.name)}</span></label>`).join("")}
        </div>
      </section>
      <section class="t-rsec">
        <h3>③ 적용한 개선 사항</h3>
        ${applied ? `<ul class="t-applied">${applied}</ul>` : `<p class="t-help">아직 디자인 수정을 적용하지 않았습니다.</p>`}
        <textarea class="t-input" name="improvements" rows="3" placeholder="위 선택 외에 보충 설명이 있으면 적으세요. (선택)" ${dis}>${esc(d.improvements || "")}</textarea>
      </section>
      ${TASK2.report.questions.map((q) => textQ(q, d, dis)).join("")}
      <div class="t-feedback" id="report-feedback" hidden></div>
      ${ro ? "" : `<div class="t-ractions"><span class="t-help" id="report-saved">자동 저장됨</span><button class="t-cta inline" data-submit-report="2">${s.review.status === "returned" ? "보완해서 다시 제출" : "검수 보고서 제출"}</button></div>`}
    </form>
  </div>`;
  if (!ro) bindDraft(s);
}
function validateReport2(r) {
  const s = TS(2);
  const p = [];
  if (!s.findings.length) p.push({ where: "MISSION A", msg: "디자인 검수에서 문제라고 생각하는 요소를 1개 이상 찾으세요." });
  if (!s.principlesChecked) p.push({ where: "MISSION B", msg: "원칙 분석에서 모든 항목에 원칙을 고르고 '분석 완료'를 누르세요." });
  if (!s.designApplied) p.push({ where: "MISSION C", msg: "디자인 수정 옵션을 모두 검토하고 TICKET ON에 적용하세요." });
  if (!(r.problems || []).length && !r.problemsEtc) p.push({ where: "①", msg: "발견한 문제를 1개 이상 선택하거나 입력하세요." });
  if (!(r.principles || []).length) p.push({ where: "②", msg: "관련 원칙을 1개 이상 선택하세요." });
  TASK2.report.questions.forEach((q) => { if (!r[q.id]) p.push({ where: q.title.slice(0, 1), msg: `'${q.title.slice(2)}' 항목을 작성하세요.` }); });
  return p;
}

// ---------- TASK-003 오류 수정 보고서 ----------
function codeDiffLines() {
  const s = TS(3);
  const o = TASK3.js, c = (s.fixedCode ? [...s.fixedCode.split("\n"), ...TASK3.js.slice(TASK3.editableLines.length)] : (s.code || TASK3.js.join("\n")).split("\n"));
  return o.map((line, i) => ({ no: i + 1, before: line, after: c[i] || "", changed: line !== (c[i] || "") })).filter((x) => x.changed);
}
function renderReport3(t) {
  const s = TS(3);
  const { ro, html } = reportHead(t, s, "오류 수정 보고서");
  const d = (ro ? s.report : s.reportDraft) || { stages: [], found: "", cause: "", fixNote: "", improve: "", dq1: "", dq2: "", dq3: "", dq4: "" };
  const dis = ro ? "disabled" : "";
  const diff = codeDiffLines();
  const tr = s.testResult;
  taskContent.innerHTML = `<div class="t-page">
    ${html}
    <div class="t-rstats">
      <span>오류 재현 기록 <b>${s.reproductions.length}</b>건</span>
      <span>조사 단서 <b>${s.clues.length}</b>건</span>
      <span>코드 테스트 <b>${s.codeTested ? (s.codeFixed ? "통과" : "실패") : "미실행"}</b></span>
      <span>재테스트 <b>${s.retest.passes}/2</b></span>
      <button class="btn" data-open-records>재현 기록 보기</button>
    </div>
    <form class="t-card t-report" id="report-form" onsubmit="return false">
      <section class="t-rsec">
        <h3>① 오류가 발생한 기능 <small>복수 선택</small></h3>
        <div class="t-opts row">
          ${TASK3.report.stages.map((o) => `<label class="t-opt"><input type="checkbox" name="stages" value="${o.id}" ${(d.stages || []).includes(o.id) ? "checked" : ""} ${dis}><span>${esc(o.label)}</span></label>`).join("")}
        </div>
      </section>
      ${textQ(TASK3.report.questions[0], d, dis)}
      ${textQ(TASK3.report.questions[1], d, dis)}
      <section class="t-rsec">
        <h3>④ 수정한 내용 <small>개발자 도구에서 자동 첨부</small></h3>
        ${diff.length ? `<div class="t-code"><div class="t-code-cap">reservation.js · 변경된 줄 ${diff.length}</div>${diff.map((x) => `<div class="t-code-row"><span class="ln">${x.no}</span><del>${esc(x.before)}</del><ins>${esc(x.after)}</ins></div>`).join("")}</div>` : `<p class="t-help">아직 수정된 코드가 없습니다. 개발자 도구에서 코드를 고치고 테스트를 통과하세요.</p>`}
        <textarea class="t-input" name="fixNote" rows="2" placeholder="수정 내용에 대한 설명 (선택)" ${dis}>${esc(d.fixNote || "")}</textarea>
      </section>
      <section class="t-rsec">
        <h3>⑤ 테스트 결과 <small>자동 첨부</small></h3>
        <ul class="t-applied">
          <li>개발자 도구 테스트: <b>${tr ? (tr.ok ? "통과" : "실패 · " + esc(tr.summary)) : "미실행"}</b>${s.testRuns ? ` (실행 ${s.testRuns}회${tr ? ", 마지막 " + esc(tr.at) : ""})` : ""}</li>
          <li>TICKET ON 재테스트: 예매하기 → 좌석 선택 이동 <b>${s.retest.passes}회 정상</b>${s.retest.count > s.retest.passes ? `, 실패 ${s.retest.count - s.retest.passes}회` : ""}</li>
          <li>남아 있는 문제: 결제하기 버튼 무응답·중복 요청, 결제 결과 불일치 (이번 수정 범위 밖)</li>
        </ul>
      </section>
      ${textQ(TASK3.report.questions[2], d, dis)}
      <section class="t-rsec">
        <h3>⑦ 디자인·개발 협업 토론 <small>팀에서 논의한 내용</small></h3>
        ${TASK3.report.discussion.map((q) => `<div class="t-dq"><span class="t-chip">${esc(q.side)}</span><p class="t-help">${esc(q.q)}</p><textarea class="t-input" name="${q.id}" rows="2" ${dis}>${esc(d[q.id] || "")}</textarea></div>`).join("")}
      </section>
      <div class="t-feedback" id="report-feedback" hidden></div>
      ${ro ? "" : `<div class="t-ractions"><span class="t-help" id="report-saved">자동 저장됨</span><button class="t-cta inline" data-submit-report="3">${s.review.status === "returned" ? "보완해서 다시 제출" : "보고서 제출"}</button></div>`}
    </form>
  </div>`;
  if (!ro) bindDraft(s);
}
function validateReport3(r) {
  const s = TS(3);
  const p = [];
  if (!s.reproductions.length) p.push({ where: "MISSION A", msg: "TICKET ON에서 오류 재현 기록을 1건 이상 작성하세요." });
  if (!s.devtoolOpened) p.push({ where: "MISSION B", msg: "개발자 도구를 열어 콘솔과 코드를 확인하세요." });
  if (!s.codeTested) p.push({ where: "MISSION C", msg: "개발자 도구에서 코드를 수정하고 [테스트 실행]을 하세요." });
  else if (!s.codeFixed) p.push({ where: "MISSION C", msg: "코드 테스트가 아직 실패 상태입니다. 콘솔 결과를 보고 다시 수정하세요." });
  if (s.retest.passes < 2) p.push({ where: "MISSION D", msg: "수정 후 TICKET ON에서 예매하기 버튼을 2번 이상 정상 동작시키세요." });
  if (!(r.stages || []).length) p.push({ where: "①", msg: "오류가 발생한 기능을 1개 이상 선택하세요." });
  ["found", "cause", "improve"].forEach((k) => { const q = TASK3.report.questions.find((x) => x.id === k); if (!r[k]) p.push({ where: q.title.slice(0, 1), msg: `'${q.title.slice(2)}' 항목을 작성하세요.` }); });
  if (!["dq1", "dq2", "dq3", "dq4"].some((k) => r[k])) p.push({ where: "⑦", msg: "협업 토론 질문 중 하나 이상에 팀 의견을 적으세요." });
  return p;
}

// ---------- TASK-005 조사 질문 (MISSION B) ----------
function renderQuestionsB(t) {
  const s = TS(5);
  crumbEl.innerHTML = `<a data-tlist>나의 업무</a><span>/</span><a data-tdetail>업무 상세</a><span>/</span><b>조사 질문</b>`;
  taskContent.innerHTML = `<div class="t-page">
    <div class="t-viewer-head"><button class="btn" data-tdetail>← 업무로 돌아가기</button><div><h1>MISSION B · 변경 기록 조사 질문</h1><span>디자인 변경 이력과 Git 기록, 빌드 목록을 확인한 뒤 기록에 근거해 답하세요. 자동 저장됩니다.</span></div></div>
    <div class="t-btns" style="margin:0 0 12px"><button class="btn" data-open-design="history">디자인 변경 이력</button><button class="btn" data-open-ops="git">Git 기록 · 빌드</button><button class="btn" data-open-ops="deploy">배포 이력</button></div>
    <form class="t-card t-report" onsubmit="return false">
      ${TASK5.questionsB.map((q, i) => `<section class="t-rsec"><h3>${i + 1}. ${esc(q.title)}</h3><p class="t-help">${esc(q.help)}</p><textarea class="t-input" data-qb="${q.id}" rows="2" placeholder="기록에서 확인한 내용을 적으세요">${esc(s.answersB[q.id] || "")}</textarea></section>`).join("")}
      <div class="t-ractions"><span class="t-help">자동 저장됨</span><button class="t-cta inline" data-tdetail>업무로 돌아가기</button></div>
    </form></div>`;
}
taskContent.addEventListener("input", (e) => { const q = e.target.closest("[data-qb]"); if (q) { TS(5).answersB[q.dataset.qb] = q.value; G.save(); } });

// ---------- TASK-005 증거 목록 ----------
function renderEvidence5(t) {
  const s = TS(5);
  crumbEl.innerHTML = `<a data-tlist>나의 업무</a><span>/</span><a data-tdetail>업무 상세</a><span>/</span><b>확보한 증거</b>`;
  taskContent.innerHTML = `<div class="t-page">
    <div class="t-viewer-head"><button class="btn" data-tdetail>← 업무로 돌아가기</button><div><h1>확보한 증거 <small>${s.evidence.length}건</small></h1><span>DAYEON DEPLOY·디자인 이력의 [+ 증거] 버튼으로 모은 기록입니다. 보고서 ⑥에서 선택해 첨부합니다.</span></div></div>
    ${s.evidence.length ? `<ul class="op-evlist">${s.evidence.map((e) => `<li><span class="op-src">${esc(e.src)}</span><p>${esc(e.text)}</p><small>${esc(e.time)}</small></li>`).join("")}</ul>` : `<div class="t-empty-box">아직 없습니다.</div>`}
    <div class="t-btns" style="margin-top:12px"><button class="btn" data-open-ops="deploy">DAYEON DEPLOY 열기</button></div></div>`;
}

// ---------- TASK-005 타임라인 (MISSION D) ----------
function renderTimeline5(t) {
  const s = TS(5);
  if (!s.timeline.order) s.timeline.order = [...TASK5.timelineStart];
  crumbEl.innerHTML = `<a data-tlist>나의 업무</a><span>/</span><a data-tdetail>업무 상세</a><span>/</span><b>사건 타임라인</b>`;
  const tl = s.timeline;
  const cards = tl.order.map((id, i) => { const ev = TASK5.timeline.find((x) => x.id === id); return `<li class="t-tl-card ${tl.passed ? "locked" : ""}" draggable="${tl.passed ? "false" : "true"}" data-tl-idx="${i}"><span class="t-tl-no">${i + 1}</span><div><b>${esc(ev.label)}</b><small>${esc(ev.sub)}</small></div>${tl.passed ? "" : `<span class="mv"><button data-tl-move="${i}:-1" ${i === 0 ? "disabled" : ""} title="위로">▲</button><button data-tl-move="${i}:1" ${i === tl.order.length - 1 ? "disabled" : ""} title="아래로">▼</button></span>`}</li>`; }).join("");
  taskContent.innerHTML = `<div class="t-page">
    <div class="t-viewer-head"><button class="btn" data-tdetail>← 업무로 돌아가기</button><div><h1>MISSION D · 사건 타임라인 재구성</h1><span>조사한 기록(파일 수정 시각·커밋·빌드·배포 로그·QA)을 근거로, 실제로 무슨 일이 있었는지 이른 사건부터 순서대로 배치하세요. 카드를 끌어서 옮기거나 ▲▼ 버튼을 사용합니다.</span></div>${tl.passed ? "" : `<button class="t-cta inline" data-tl-check>순서 검증</button>`}</div>
    ${tl.lastResult === "fail" && !tl.passed ? `<div class="t-tl-res fail">일부 사건의 시간 순서가 실제 기록과 일치하지 않습니다. 각 사건이 언제 일어났는지 기록에서 다시 확인하세요. (검증 ${tl.attempts}회)</div>` : ""}
    ${tl.passed ? `<div class="t-tl-res pass"><b>타임라인 검증 통과</b> (${esc(tl.checkedAt || "")} · 검증 ${tl.attempts}회) 여섯 사건의 순서가 실제 기록과 일치합니다.</div>` : ""}
    <ol class="t-tl" id="t-tl">${cards}</ol>
    ${tl.passed ? `<div class="t-card" style="margin-top:14px"><h3 style="margin:0 0 8px">사고 원인 추리</h3><p style="margin:0 0 10px;font-size:15px">"디자인팀과 개발팀은 작업을 완료했는데 왜 고객에게 문제가 있는 서비스가 제공되었을까요?"</p><p class="t-help">확보한 증거를 사용해 직접 원인, 그렇게 판단한 증거, 예방하지 못한 업무 과정, 재발 방지 방법을 조사 보고서에 작성하세요. '누가 잘못했는가'보다 '어떤 과정이 실패했는가'에 집중합니다.</p><div class="t-btns" style="margin-top:10px"><button class="btn primary" data-open-report>조사 보고서 작성</button><button class="btn" data-open-evidence>증거 목록 (${s.evidence.length})</button></div></div>` : `<p class="t-help">조사가 더 필요하면 <a data-open-ops="deploy">배포 이력</a>, <a data-open-ops="git">Git 기록</a>, <a data-open-ops="files">공유 폴더</a>를 다시 확인하세요.</p>`}
  </div>`;
  if (!tl.passed) bindTimelineDrag();
}
let tlDrag = null;
function bindTimelineDrag() {
  const list = document.getElementById("t-tl"); if (!list) return;
  list.querySelectorAll(".t-tl-card").forEach((card) => {
    card.addEventListener("dragstart", (e) => { tlDrag = Number(card.dataset.tlIdx); card.classList.add("dragging"); e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", String(tlDrag)); } catch (_) {} });
    card.addEventListener("dragend", () => { card.classList.remove("dragging"); list.querySelectorAll(".over").forEach((c) => c.classList.remove("over")); });
    card.addEventListener("dragover", (e) => { e.preventDefault(); card.classList.add("over"); });
    card.addEventListener("dragleave", () => card.classList.remove("over"));
    card.addEventListener("drop", (e) => { e.preventDefault(); const to = Number(card.dataset.tlIdx); if (tlDrag === null || tlDrag === to) return; moveTimeline(tlDrag, to); tlDrag = null; });
  });
}
function moveTimeline(from, to) {
  const o = TS(5).timeline.order; const [it] = o.splice(from, 1); o.splice(to, 0, it);
  TS(5).timeline.lastResult = null; G.save(); renderTaskPage();
}

// ---------- TASK-005 조사 보고서 ----------
function renderReport5(t) {
  const s = TS(5);
  const { ro, html } = reportHead(t, s, "조사 결과 보고서");
  const d = (ro ? s.report : s.reportDraft) || { prod: "", staging: "", cause: "", why: "", prevent: "", evidenceIds: [] };
  const dis = ro ? "disabled" : "";
  const order = (s.timeline.order || []).map((id, i) => { const ev = TASK5.timeline.find((x) => x.id === id); return `<li>${i + 1}. ${esc(ev.label)} <small>(${esc(ev.sub)})</small></li>`; }).join("");
  const sel = new Set(d.evidenceIds || []);
  taskContent.innerHTML = `<div class="t-page">
    ${html}
    <div class="t-rstats"><span>조사 기록 <b>${s.fileNotes.length}</b></span><span>커밋 열람 <b>${s.commitsViewed.length}</b></span><span>배포 열람 <b>${s.deploysViewed.length}</b></span><span>증거 <b>${s.evidence.length}</b></span><span>타임라인 <b>${s.timeline.passed ? "통과" : "미통과"}</b></span></div>
    <form class="t-card t-report" id="report-form" onsubmit="return false">
      <section class="t-rsec"><h3>① 확인된 버전 불일치</h3><p class="t-help">배포 이력과 빌드 정보에서 확인한 운영·테스트 환경의 버전(빌드 ID 포함)을 적으세요.</p>
        <div class="t-grid2"><label class="t-lab">운영 환경 (Production)<input class="t-input" name="prod" type="text" placeholder="예: v1.0.x (빌드 ID)" value="${esc(d.prod || "")}" ${dis}></label><label class="t-lab">테스트 환경 (Staging)<input class="t-input" name="staging" type="text" placeholder="예: v1.0.x (빌드 ID)" value="${esc(d.staging || "")}" ${dis}></label></div></section>
      <section class="t-rsec"><h3>② 사건 발생 과정 <small>타임라인 자동 첨부</small></h3>${s.timeline.passed ? `<ol class="t-applied">${order}</ol>` : `<p class="t-help">타임라인 검증을 통과하면 여기에 첨부됩니다.</p>`}</section>
      ${TASK5.report.questions.map((q) => textQ(q, d, dis)).join("")}
      <section class="t-rsec"><h3>⑥ 참고한 증거 <small>${sel.size}건 선택</small></h3>${s.evidence.length ? `<ul class="t-ev-pick">${s.evidence.map((e) => `<li><label><input type="checkbox" name="evidenceIds" value="${e.id}" ${sel.has(e.id) ? "checked" : ""} ${dis}><span class="op-src">${esc(e.src)}</span><span>${esc(e.text)}</span></label></li>`).join("")}</ul>` : `<p class="t-help">확보한 증거가 없습니다. DAYEON DEPLOY에서 [+ 증거]로 모으세요.</p>`}</section>
      <div class="t-feedback" id="report-feedback" hidden></div>
      ${ro ? "" : `<div class="t-ractions"><span class="t-help" id="report-saved">자동 저장됨</span><button class="t-cta inline" data-submit-report="5">${s.review.status === "returned" ? "보완해서 다시 제출" : "보고서 제출"}</button></div>`}
    </form></div>`;
  if (!ro) bindDraft(s);
}
function validateReport5(r) {
  const s = TS(5);
  const p = [];
  if (!s.fileNotes.length) p.push({ where: "MISSION A", msg: "공유 폴더 조사 기록을 1건 이상 작성하세요." });
  if (!s.designHistoryViewed) p.push({ where: "MISSION B", msg: "디자인 변경 이력을 확인하세요." });
  if (!s.commitsViewed.length) p.push({ where: "MISSION B", msg: "Git 변경 기록을 확인하세요." });
  if (!s.deploysViewed.length) p.push({ where: "MISSION C", msg: "배포 로그를 확인하세요." });
  if (!s.timeline.passed) p.push({ where: "MISSION D", msg: "사건 타임라인 검증을 통과해야 합니다." });
  if (!(r.prod || "").trim() || !(r.staging || "").trim()) p.push({ where: "①", msg: "운영·테스트 환경의 버전을 모두 적으세요." });
  TASK5.report.questions.forEach((q) => { if (!(r[q.id] || "").trim()) p.push({ where: q.title.slice(0, 1), msg: `'${q.title.slice(2)}' 항목을 작성하세요.` }); });
  if (!(r.evidenceIds || []).length) p.push({ where: "⑥", msg: "참고한 증거를 1건 이상 선택하세요." });
  return p;
}

// ---------- TASK-004 QA 화면 ----------
function renderQA(t) {
  const s = TS(4);
  crumbEl.innerHTML = `<a data-tlist>나의 업무</a><span>/</span><a data-tdetail>업무 상세</a><span>/</span><b>QA 검증</b>`;
  const q = s.qa;
  taskContent.innerHTML = `<div class="t-page">
    <div class="t-viewer-head">
      <button class="btn" data-tdetail>← 업무로 돌아가기</button>
      <div><h1>payment_test_cases.md · QA 검증</h1><span>현재 팀의 결제 UI 수정안${s.uiApplied ? "(적용됨)" : "(미적용)"}과 코드 수정 상태${s.codeOk ? "(테스트 통과)" : s.codeTested ? "(테스트 실패)" : "(미실행)"}로 다섯 항목을 시뮬레이션합니다</span></div>
      <button class="t-cta inline" data-run-qa>▶ QA 실행</button>
    </div>
    ${q ? `<div class="t-qa-sum"><span class="big ${q.allPass ? "ok" : "bad"}">${q.passed}/${q.total} 통과</span><span class="t-dim">마지막 실행 ${esc(q.at)} · ${q.runs}회${q.stale ? " · 이후 수정이 있어 다시 실행하세요" : ""}</span></div>
    <table class="t-qa-table"><thead><tr><th>#</th><th>테스트</th><th>기대 결과</th><th>결과</th><th>상세 / 안내</th></tr></thead><tbody>
      ${q.tests.map((x, i) => `<tr><td>${i + 1}</td><td><b>${esc(x.name)}</b></td><td>${esc((TASK4.cases.find((c) => c.id === x.id) || {}).expect || "")}</td><td class="${x.pass ? "pass" : "fail"}">${x.pass ? "PASS" : "FAIL"}</td><td>${esc(x.detail)}${x.pass ? "" : `<div class="hint">${esc(x.hint)}</div>`}</td></tr>`).join("")}
    </tbody></table>
    ${q.allPass ? `<div class="t-banner ok" style="margin-top:16px"><b>검증 완료</b> 다섯 항목이 모두 통과했습니다. TICKET ON에서 직접 한 번 더 확인하고 업무 보고서를 작성하세요.</div><div class="t-btns" style="margin-top:12px"><button class="btn" data-open-pay-ticket>TICKET ON 결제 테스트</button><button class="btn primary" data-open-report>업무 보고서 작성</button></div>`
       : `<div class="t-banner wait" style="margin-top:16px"><b>보완 필요</b> 실패한 항목의 안내를 참고해 관련 화면이나 로그를 다시 확인하세요. UI 수정과 코드 수정은 따로 검사됩니다.</div><div class="t-btns" style="margin-top:12px"><button class="btn" data-open-design="pay">결제 UI 편집기</button><button class="btn" data-open-pay="js">코드 수정하기</button><button class="btn" data-open-pay="net">요청 로그</button></div>`}`
    : `<div class="t-empty-box">아직 실행하지 않았습니다. 위의 [QA 실행]을 누르면 현재 상태로 검사합니다.</div>`}
  </div>`;
}

// ---------- TASK-004 업무 보고서 ----------
function renderReport4(t) {
  const s = TS(4);
  const { ro, html } = reportHead(t, s, "업무 보고서");
  const d = (ro ? s.report : s.reportDraft) || { problem: "", ux: "", dev: "", fixNote: "", followup: "" };
  const dis = ro ? "disabled" : "";
  const uiList = s.uiApplied && s.ui ? TASK4.ui.map((o) => { const c = o.choices.find((x) => x.id === s.ui[o.id]); return c ? `<li>${esc(o.title.replace(/^[①-⑩]\s*/, ""))}: ${esc(c.label)}</li>` : ""; }).join("") : "";
  const diff = (() => { const o = TASK4.js, c = (s.code || TASK4.js.join("\n")).split("\n"); const n = Math.max(o.length, c.length); return Array.from({ length: n }, (_, i) => ({ no: i + 1, before: o[i] || "", after: c[i] || "" })).filter((x) => x.before !== x.after); })();
  const q = s.qa;
  taskContent.innerHTML = `<div class="t-page">
    ${html}
    <div class="t-rstats">
      <span>재현 기록 <b>${s.reproductions.length}</b></span><span>요청 로그 <b>${s.requests.length}</b></span><span>단서 <b>${s.clues.length}</b></span><span>UI <b>${s.uiApplied ? "적용" : "미적용"}</b></span><span>코드 <b>${s.codeOk ? "통과" : s.codeTested ? "실패" : "미실행"}</b></span><span>QA <b>${q ? `${q.passed}/${q.total}` : "미실행"}</b></span>
      <button class="btn" data-open-records>재현 기록 보기</button>
    </div>
    <form class="t-card t-report" id="report-form" onsubmit="return false">
      ${TASK4.report.questions.slice(0, 3).map((qq) => textQ(qq, d, dis)).join("")}
      <section class="t-rsec">
        <h3>④ 수정 사항 <small>자동 첨부</small></h3>
        <h4 class="t-sub">UI 수정</h4>${uiList ? `<ul class="t-applied">${uiList}</ul>` : `<p class="t-help">적용된 UI 수정안이 없습니다.</p>`}
        <h4 class="t-sub">코드 수정 (payment.js)</h4>${diff.length ? `<div class="t-code"><div class="t-code-cap">변경된 줄 ${diff.length}</div>${diff.map((x) => `<div class="t-code-row"><span class="ln">${x.no}</span><del>${esc(x.before)}</del><ins>${esc(x.after)}</ins></div>`).join("")}</div>` : `<p class="t-help">수정된 코드가 없습니다.</p>`}
        <textarea class="t-input" name="fixNote" rows="2" placeholder="수정 내용에 대한 설명 (선택)" ${dis}>${esc(d.fixNote || "")}</textarea>
      </section>
      <section class="t-rsec">
        <h3>⑤ 검증 결과 <small>자동 첨부</small></h3>
        ${q ? `<ul class="t-applied">${q.tests.map((x) => `<li>${esc(x.name)}: <b>${x.pass ? "PASS" : "FAIL"}</b> — ${esc(x.detail)}</li>`).join("")}<li>실행 ${esc(q.at)} · ${q.passed}/${q.total} 통과${q.stale ? " (이후 수정 있음)" : ""}</li></ul>` : `<p class="t-help">QA를 아직 실행하지 않았습니다.</p>`}
      </section>
      ${textQ(TASK4.report.questions[3], d, dis)}
      <div class="t-feedback" id="report-feedback" hidden></div>
      ${ro ? "" : `<div class="t-ractions"><span class="t-help" id="report-saved">자동 저장됨</span><button class="t-cta inline" data-submit-report="4">${s.review.status === "returned" ? "보완해서 다시 제출" : "보고서 제출"}</button></div>`}
    </form>
  </div>`;
  if (!ro) bindDraft(s);
}
function validateReport4(r) {
  const s = TS(4);
  const p = [];
  if (!s.reproductions.length) p.push({ where: "MISSION A", msg: "TICKET ON에서 결제 오류 재현 기록을 1건 이상 작성하세요." });
  if (!s.logViewed) p.push({ where: "MISSION B", msg: "개발자 도구에서 payment_network.log 를 확인하세요." });
  if (!s.uiApplied) p.push({ where: "MISSION C", msg: "결제 UI 수정안을 적용하세요." });
  if (!s.codeTested) p.push({ where: "MISSION D", msg: "payment.js 를 수정하고 [테스트 실행]을 하세요." });
  if (!s.qa) p.push({ where: "MISSION E", msg: "QA를 실행하세요." });
  TASK4.report.questions.forEach((qq) => { if (!r[qq.id]) p.push({ where: qq.title.slice(0, 1), msg: `'${qq.title.slice(2)}' 항목을 작성하세요.` }); });
  return p;
}

// ---------- 제출 / 검토 / 완료 ----------
function submitReport(no) {
  const f = document.getElementById("report-form");
  const r = readReportForm(f);
  const fb = document.getElementById("report-feedback");
  const problems = no === 6 ? validateReport6(r) : no === 5 ? validateReport5(r) : no === 4 ? validateReport4(r) : no === 3 ? validateReport3(r) : no === 2 ? validateReport2(r) : validateReport1(r);
  if (problems.length) {
    fb.hidden = false;
    fb.className = "t-feedback bad";
    fb.innerHTML = feedbackHTML(problems);
    fb.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  const s = TS(no);
  const report = { ...r, submittedAt: fmtMinutes(nowMinutes()) };
  if (G.live) {
    if (livePhase(no) !== "ACTIVE") { fb.hidden = false; fb.className = "t-feedback bad"; fb.innerHTML = "<b>조사가 마감되어 제출할 수 없습니다.</b>"; return; }
    if (s.review.status === "submitting") return;   // 이중 클릭 방지
    Live.submitReport(no, report);
    return;
  }
  s.report = report;
  s.reportDraft = s.report;
  s.reportSubmitted = true;
  s.review = { status: "pending", note: "" };
  G.save();
  renderTaskPage();
  toast({ title: "DAYEON TASK", sub: `TASK-00${no}`, text: "보고서를 제출했습니다. 김팀장이 검토한 뒤 결과를 알려드립니다.", app: "task" });
  schedule(3, () => appendMessage("dm-kim", { from: "kim", text: `보고서 받았어요. 확인하고 알려드릴게요 👀` }));
}

// 교사: 승인 → 업무 완료 처리
function approveReport(no, note = "") {
  const s = TS(no);
  if (!s.reportSubmitted) return;
  s.review = { status: "approved", note };
  s.done = no !== 6;   // TASK-006 은 배포 후 확인 완료로 끝남
  G.save();
  if (G.state.currentApp === "task") renderTaskPage();
  toast({ title: "DAYEON TASK", sub: `TASK-00${no}`, text: "보고서가 승인되어 업무가 완료되었습니다.", app: "task" });
  appendMessage("dm-kim", { from: "kim", text: note ? `보고서 승인했어요. ${note}` : `보고서 승인했어요. 프로젝트 채널에서 얘기 이어가요!` }, { notify: true });
  if (G.live) return;   // 라이브 모드: 다음 스토리는 교사가 공개
  setTimeout(() => {
    showApp("work");
    openRoom("ticketon");
    if (no === 1) startFollowup();
    else if (no === 2) startFollowup2();
    else if (no === 3) startFollowup3();
    else if (no === 4) startFollowup5();
    else if (no === 5) startFollowup7();
    else if (no === 6) { showApp("task"); G.state.taskView = { view: "detail", taskNo: 6 }; renderTaskPage(); return; }
  }, 1600);
}
// 교사: 보완 요청 → 다시 작성 가능
function returnReport(no, note = "") {
  const s = TS(no);
  if (!s.reportSubmitted) return;
  s.review = { status: "returned", note };
  s.reportSubmitted = false;
  G.save();
  if (G.state.currentApp === "task") renderTaskPage();
  appendMessage("dm-kim", { from: "kim", text: `보고서 보완 부탁해요. ${note || "근거를 조금 더 구체적으로 적어 주세요."}` }, { notify: true });
}

// 교사용: 강제 완료
function forceCompleteTask(no = 1) {
  const s = TS(no);
  s.started = true;
  if (no === 1) {
    s.inquiriesViewed = true;
    if (s.inquiriesOpened.length < 3) s.inquiriesOpened = INQUIRIES.slice(0, 3).map((i) => i.id);
    s.ticketVisited = true;
    if (!s.reproduced.length) s.reproduced.push({ id: "rec-" + Date.now(), screen: "checkout", screenLabel: "결제 확인", type: "사용자 조작 관련", found: "(교사 진행) 결제하기 버튼을 눌러도 반응이 없음", expected: "결제 결과 화면으로 이동", time: fmtMinutes(nowMinutes()) });
    if (!s.reportSubmitted) {
      s.report = { stages: ["start", "payreq", "payres"], problems: "(교사 진행) 예매 시작·결제 요청·결제 결과 단계에서 서로 다른 문제 확인", evidence: "고객 문의 및 테스트 결과", followup: "개발팀 결제 응답 처리 확인 필요", refs: [], submittedAt: fmtMinutes(nowMinutes()) };
      s.reportDraft = s.report; s.reportSubmitted = true;
    }
  } else if (no === 2) {
    G.state.task2.assigned = true;
    if (!s.findings.length) s.findings = TASK2.spots.map((x) => spotInfo(x.id, true)).filter((x) => x.issue).map((x) => ({ id: "f-" + x.id, spotId: x.id, page: x.page, note: "(교사 진행)", time: fmtMinutes(nowMinutes()) }));
    s.findingsRevealed = true; s.findingsDone = true;
    s.principlesChecked = true;
    if (!s.design) s.design = { ...TASK2.v4 };
    if (!s.designApplied) { G.state.ticketDesign = { ...s.design }; s.designApplied = true; }
    if (!s.reportSubmitted) {
      s.report = { problems: TASK2.spots.map((x) => spotInfo(x.id, true)).filter((x) => x.issue).map((x) => x.id), problemsEtc: "", principles: TASK2.principles.map((p) => p.id), improvements: "(교사 진행)", expected: "주요 버튼을 바로 찾고 좌석 상태를 색 없이도 구별", devChecks: "결제하기 버튼 무응답, 결제 결과 불일치", submittedAt: fmtMinutes(nowMinutes()) };
      s.reportDraft = s.report; s.reportSubmitted = true;
    }
  }
  if (no === 6) {
    G.state.task6.assigned = true;
    if (!s.candidate) s.candidate = { id: "v1.0.5", reason: "(교사 진행) 최종 QA·승인 기록", evidence: "QA_Final_Report", extra: "-", at: fmtMinutes(nowMinutes()) };
    const now = fmtMinutes(nowMinutes());
    ["showVisited", "mobileViewed", "reserveClicked", "rapidTested", "failTested", "failShown", "paidOk", "mypageAfterPaid", "rollbackViewed"].forEach((k) => { if (!s.qaEvents[k]) s.qaEvents[k] = now; });
    s.qaObs = { "QA-001": { note: "(교사 진행) 핵심 정보·주 버튼 확인", verdict: "PASS", at: now }, "QA-002": { note: "(교사 진행) 모바일 버튼 정상", verdict: "PASS", at: now } };
    if (typeof evalFinalQA === "function") evalFinalQA();
    if (!s.meeting) s.meeting = { decision: "approve", reason: "(교사 진행) 최종 QA 통과·승인 빌드", evidence: "QA_Final_Report", risks: "-", response: "v1.0.2+핫픽스로 롤백, Rollback_Guide 절차", at: now };
    if (!s.reportSubmitted) { s.report = { note: "(교사 진행)", submittedAt: now }; s.reportDraft = s.report; s.reportSubmitted = true; }
    s.review = { status: "approved", note: "" };
    if (!s.release || s.release.status !== "done") s.release = { requested: true, build: "v1.0.5", by: "김팀장", status: "done", startedAt: Date.now() - 20000, doneAt: Date.now(), requestedAt: Date.now() - 25000 };
    s.postCheckDone = true; s.postCheckAt = now;
  }
  if (no === 5) {
    G.state.task5.assigned = true;
    if (!s.fileNotes.length) s.fileNotes.push({ id: "fn-" + Date.now(), file: "05_배포/최종_진짜최종/ticketon_v1.0.2.zip", mismatch: "(교사 진행) 폴더 이름은 최종이지만 10.15 빌드 b-1002-c91e", reason: "운영 배포 D-118에 사용됨", time: fmtMinutes(nowMinutes()) });
    s.filesViewed = TASK5.files.map((f) => f.id); s.designHistoryViewed = true; s.commitsViewed = TASK5.commits.map((c) => c.id); s.deploysViewed = TASK5.deploys.map((d) => d.id); s.qaViewed = true; s.chatViewed = true;
    TASK5.questionsB.forEach((q) => { if (!s.answersB[q.id]) s.answersB[q.id] = "(교사 진행)"; });
    if (!s.evidence.length) s.evidence.push({ id: "ev-" + Date.now(), src: "배포 · D-118", text: "(교사 진행) D-118 production v1.0.2 · 최종_진짜최종/ticketon_v1.0.2.zip · 빌드 b-1002-c91e · 검증 skipped", time: fmtMinutes(nowMinutes()) });
    s.timeline = { order: [...TASK5.timeline].sort((a, b) => a.at.localeCompare(b.at)).map((e) => e.id), attempts: (s.timeline && s.timeline.attempts || 0) + 1, passed: true, lastResult: "pass", checkedAt: fmtMinutes(nowMinutes()) };
    if (!s.reportSubmitted) {
      s.report = { prod: "v1.0.2 (b-1002-c91e)", staging: "v1.0.4 (b-1004-7f3a)", cause: "(교사 진행) 오래된 빌드 산출물 선택", why: "배포 전 버전 검증 절차 없음", prevent: "빌드 ID 검증·배포 체크리스트·QA 승인", evidenceIds: [s.evidence[0].id], submittedAt: fmtMinutes(nowMinutes()) };
      s.reportDraft = s.report; s.reportSubmitted = true;
    }
  }
  if (no === 4) {
    G.state.task4.assigned = true;
    if (!s.reproductions.length) s.reproductions.push({ id: "rec-" + Date.now(), screen: "checkout", screenLabel: "결제 확인", action: "(교사 진행) 결제하기 연속 클릭", found: "요청 3건, 실패도 완료 표시", expected: "한 번만 처리되고 결과대로 안내", evidence: "Request #001~#003", time: fmtMinutes(nowMinutes()) });
    s.logViewed = true; s.devtoolOpened = true;
    if (!s.clues.length) s.clues.push({ id: "clue-" + Date.now(), src: "network", text: "(교사 진행) 같은 attemptKey 요청 3건 · 청구 2건", time: fmtMinutes(nowMinutes()) });
    s.ui = bestUi(); s.uiReviewed = Object.fromEntries(TASK4.ui.map((o) => [o.id, true])); s.uiApplied = true; s.uiAppliedAt = fmtMinutes(nowMinutes());
    s.fixedCode = 'let isProcessing = false;\n\nasync function handlePayment() {\n  if (isProcessing) return;\n  isProcessing = true;\n  try {\n    const result = await requestPayment(order, { idempotencyKey: createIdempotencyKey(order) });\n    if (result.ok) showSuccessMessage(result);\n    else showFailureMessage(result);\n  } catch (e) {\n    showPendingMessage();\n  } finally {\n    isProcessing = false;\n  }\n}';
    s.code = [...TASK4.js.slice(0, TASK4.editableFrom - 1), ...s.fixedCode.split("\n")].join("\n");
    s.codeTested = true; s.testRuns = (s.testRuns || 0) + 1; s.codeFlags = { client: true, server: true, branch: true, pending: true, awaitOk: true }; s.codeOk = true;
    s.testResult = { ok: true, flags: s.codeFlags, at: fmtMinutes(nowMinutes()), entries: [], analysis: {} };
    runQA();
    if (!s.reportSubmitted) {
      s.report = { problem: "(교사 진행) 중복 요청·실패를 완료로 안내", ux: "처리 중 안내 없음", dev: "가드·멱등성·분기 없음", fixNote: "", followup: "-", submittedAt: fmtMinutes(nowMinutes()) };
      s.reportDraft = s.report; s.reportSubmitted = true;
    }
  }
  if (no === 3) {
    G.state.task3.assigned = true;
    if (!s.reproductions.length) s.reproductions.push({ id: "rec-" + Date.now(), screen: "show", screenLabel: "공연 상세", action: "(교사 진행) 예매하기 클릭", found: "아무 반응 없음", expected: "좌석 선택으로 이동", time: fmtMinutes(nowMinutes()) });
    s.devtoolOpened = true;
    if (!s.clues.length) s.clues.push({ id: "clue-" + Date.now(), src: "console · reservation.js:4", text: "Uncaught TypeError: Cannot read properties of null (reading 'addEventListener')", time: fmtMinutes(nowMinutes()) });
    s.fixedCode = 'const reserveButton =\n  document.getElementById("reserveBtn");';
    s.code = [s.fixedCode, ...TASK3.js.slice(2)].join("\n");
    s.codeTested = true; s.codeFixed = true; s.testRuns = (s.testRuns || 0) + 1;
    s.testResult = { ok: true, summary: "테스트 통과", selector: 'getElementById("reserveBtn")', at: fmtMinutes(nowMinutes()), entries: [] };
    s.retest = { count: 2, passes: 2 };
    if (!s.reportSubmitted) {
      s.report = { stages: ["start"], found: "(교사 진행) 예매하기 클릭 시 반응 없음", cause: "HTML id(reserveBtn)와 JS 선택자(reservationBtn) 불일치", fixNote: "", improve: "-", dq1: "", dq2: "", dq3: "(교사 진행)", dq4: "", submittedAt: fmtMinutes(nowMinutes()) };
      s.reportDraft = s.report; s.reportSubmitted = true;
    }
  }
  approveReport(no, "(교사 진행)");
}

// ---------- UI/UX 가이드 (DAYEON_UIUX_가이드.pdf) ----------
function renderGuide(t) {
  crumbEl.innerHTML = `<a data-tlist>나의 업무</a><span>/</span><a data-tdetail>업무 상세</a><span>/</span><b>첨부 자료</b>`;
  TS(2).guideOpened = true;
  G.save();
  taskContent.innerHTML = `<div class="t-page">
    <div class="t-viewer-head">
      <button class="btn" data-tdetail>← 업무로 돌아가기</button>
      <div><h1>DAYEON_UIUX_가이드.pdf</h1><span>디자인팀 · 사내 UI/UX 업무 매뉴얼 v3 · 6쪽</span></div>
      <button class="btn" data-open-design="principles">원칙 분석 열기</button>
    </div>
    <div class="t-doc">
      <div class="t-doc-cover"><small>DAYEON COMPANY · DESIGN TEAM</small><h2>UI/UX 디자인 기본 원칙</h2><p>화면을 만들 때 반드시 확인해야 하는 여섯 가지 원칙입니다. 각 원칙은 '사용자가 무엇을 쉽게 할 수 있어야 하는가'를 기준으로 합니다.</p></div>
      ${TASK2.principles.map((p, i) => `
        <section class="t-doc-sec">
          <div class="t-doc-no">${i + 1}</div>
          <div>
            <h3>${esc(p.name)} <small>${esc(p.short)}</small></h3>
            <p>${esc(p.desc)}</p>
            <div class="t-doc-ex"><b>예시</b> ${esc(p.example)}</div>
          </div>
        </section>`).join("")}
      <div class="t-doc-foot">UI(User Interface)는 사용자가 보고 만지는 화면 요소이고, UX(User Experience)는 그 화면을 거치며 사용자가 느끼는 전체 경험입니다. 좋은 UI가 좋은 UX의 전부는 아니지만, 위 원칙이 무너지면 UX는 반드시 나빠집니다.</div>
    </div>
  </div>`;
}

// ---------- 클릭 처리 ----------
taskApp.addEventListener("click", (e) => {
  const row = e.target.closest("[data-task]");
  if (row) { setView("detail", Number(row.dataset.task)); return; }
  if (e.target.closest("[data-tlist]") || e.target.closest('[data-tnav="mine"]')) { setView("list", null); return; }
  if (e.target.closest("[data-tdetail]")) { setView("detail"); return; }

  const start = e.target.closest("[data-start]");
  if (start) { startTask(Number(start.dataset.start)); return; }

  if (e.target.closest("[data-open-inquiries]")) { setView("inquiries", 1); return; }
  if (e.target.closest("[data-open-records]")) { setView("records", G.state.taskView.taskNo >= 3 ? G.state.taskView.taskNo : 1); return; }
  if (e.target.closest("[data-open-ticket]")) { showApp("ticket"); return; }
  if (e.target.closest("[data-open-report]")) { setView("report"); return; }
  if (e.target.closest("[data-open-guide]")) { setView("guide", 2); return; }
  const od = e.target.closest("[data-open-design]");
  if (od) { openDesign(od.dataset.openDesign); return; }
  const odv = e.target.closest("[data-open-dev]");
  if (odv) { openDevtool(odv.dataset.openDev); return; }
  const oo = e.target.closest("[data-open-ops]");
  if (oo) { openOps(oo.dataset.openOps); return; }
  if (e.target.closest("[data-open-timeline]")) { setView("timeline", 5); return; }
  if (e.target.closest("[data-open-meeting]")) { setView("meeting", 6); return; }
  if (e.target.closest('[data-tnav="eval"]')) { setView("eval", null); return; }
  if (e.target.closest("[data-open-qb]")) { setView("qb", 5); return; }
  if (e.target.closest("[data-open-evidence]")) { setView("evidence", 5); return; }
  const tlm = e.target.closest("[data-tl-move]");
  if (tlm) { const [i, d] = tlm.dataset.tlMove.split(":").map(Number); moveTimeline(i, i + d); return; }
  if (e.target.closest("[data-tl-check]")) { const ok = checkTimeline5(); renderTaskPage(); toast({ title: "DAYEON TASK", sub: "타임라인", text: ok ? "순서가 실제 기록과 일치합니다." : "일부 사건의 시간 순서가 실제 기록과 일치하지 않습니다." }); return; }
  const op = e.target.closest("[data-open-pay]");
  if (op) { openPayTool(op.dataset.openPay); return; }
  if (e.target.closest("[data-open-pay-ticket]")) { showApp("ticket"); G.state.ticketScreen = "checkout"; if (!TU().seats.length) TU().seats = ["C3"]; goScreen("checkout"); return; }
  if (e.target.closest("[data-open-qa]")) { setView("qa", 4); return; }
  if (e.target.closest("[data-run-qa]")) { runQA(); renderTaskPage(); toast({ title: "DAYEON TASK", sub: "QA", text: `${G.state.task4.qa.passed}/${G.state.task4.qa.total} 통과` }); return; }
  const sub = e.target.closest("[data-submit-report]");
  if (sub) { submitReport(Number(sub.dataset.submitReport)); return; }

  const inq = e.target.closest("[data-inq]");
  if (inq) { selectInquiry(inq.dataset.inq); return; }

  const att = e.target.closest("[data-attach]");
  if (att) {
    const type = att.dataset.attach;
    const no = G.state.taskView.taskNo || 1;
    if (type === "locked") return;
    if (!TS(no).started) { toast({ title: "DAYEON TASK", sub: "첨부 자료", text: "업무를 시작하면 첨부 자료를 열 수 있습니다." }); return; }
    if (type === "file") setView("inquiries");
    if (type === "link") showApp("ticket");
    if (type === "guide") setView("guide");
    if (type === "design") openDesign("review", att.dataset.version);
    if (type === "dev") openDevtool(att.dataset.file || "log");
    if (type === "pay") openPayTool(att.dataset.file || "net");
    if (type === "payui") openDesign("pay");
    if (type === "ops") openOps(att.dataset.file || "deploy");
    if (type === "ops6") { if (att.dataset.doc) fLocal.doc = att.dataset.doc; openOps(att.dataset.file || "candidates"); }
    if (type === "dhist") { if (!TS(5).started) { toast({ title: "DAYEON TASK", sub: "첨부 자료", text: "업무를 시작하면 열 수 있습니다." }); return; } openDesign("history"); }
  }
});

// TASK-004 개발자 도구 열기 (paytool.js)
function openPayTool(fileId = "net") {
  if (!TS(4).started) { toast({ title: "DAYEON TASK", sub: "첨부 자료", text: "업무를 시작하면 열 수 있습니다." }); return; }
  G.state.devView.file = fileId; G.state.devView.set = 4;
  showApp("dev");
}
// 개발자 도구 열기 (devtool.js)
function openDevtool(fileId = "log") {
  if (!TS(3).started) { toast({ title: "DAYEON TASK", sub: "첨부 자료", text: "업무를 시작하면 개발자 도구를 열 수 있습니다." }); return; }
  G.state.devView.file = fileId; G.state.devView.set = 3;
  showApp("dev");
}
// 디자인 검수 뷰어 열기 (design.js)
function openDesign(tab = "review", version = null) {
  const dv = G.state.designView;
  dv.tab = tab;
  if (version) { dv.version = version; dv.compare = false; }
  G.state.task2.viewerOpened = true;
  showApp("design");
}

// ---------- 초기 앱 복원 ----------
showApp(G.state.currentApp || "work", true);
