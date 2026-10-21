// =====================================================================
//  공통 게임 상태 + 저장(localStorage) + 일시정지 가능한 스케줄러
//  로드 순서: data.js → state.js → chat.js → task.js → ticket.js → design.js → teacher.js
// =====================================================================

const params = new URLSearchParams(location.search);
// 라이브(수업) 모드 멤버십: student.html 에서 승인되면 저장됨 { sid, code, teamId, teamName, uid }
const LIVE_MEMBERSHIP = (() => { try { return JSON.parse(sessionStorage.getItem("dayeon-live") || localStorage.getItem("dayeon-live") || "null"); } catch (e) { return null; } })();
const SAVE_KEY = LIVE_MEMBERSHIP ? "dayeon-game-live-" + LIVE_MEMBERSHIP.teamId : "dayeon-game-v1";

// ---------- 기본 상태 ----------
function defaultState() {
  return {
    startedAt: null,          // 게임을 처음 시작한 실제 시각(ms)
    vclock: 0,                // 게임 시간(초). 일시정지하면 멈춤
    timelineDone: false,      // STEP 2~3 타임라인 재생 완료
    invited: false,           // 프로젝트 채널 초대됨
    incident: { started: false, count: 0, done: false },   // STEP 4 사건 재생 진행도
    acked: false,             // 업무 배정 카드 [업무 확인] (TASK-001)
    followup: { started: false, count: 0, done: false },   // TASK-001 보고 후 → TASK-002 배정 대화
    followup2: { started: false, count: 0, done: false },  // TASK-002 완료 후 1부
    followup3: { started: false, count: 0, done: false },  // TASK-003 승인 후 (결제 테스트 제안)
    followup4: { started: false, count: 0, done: false },  // 결제 대참사 사건 → TASK-004 배정
    followup5: { started: false, count: 0, done: false },  // TASK-004 엔딩 → TASK-005 예고
    task5Ready: false,
    followup6: { started: false, count: 0, done: false },  // TASK-005 사건 → TASK-005 배정
    followup7: { started: false, count: 0, done: false },  // TASK-005 엔딩 → TASK-006 예고
    task6Ready: false,
    followup8: { started: false, count: 0, done: false },  // TASK-006 사건 → 배정
    followup9: { started: false, count: 0, done: false },  // 배포 결과 공개
    followup10: { started: false, count: 0, done: false }, // 근무평가 진행
    followup11: { started: false, count: 0, done: false }, // 퇴근 승인
    task6: {                  // TASK-006
      assigned: false, acked: false, started: false,
      candidate: null, candEdit: null,                 // 배포 후보 선택 기록 {id, reason, evidence, extra, at}
      qaEvents: {}, qaObs: {}, qa: null,               // TICKET ON 조작 기록 · 관찰 기록 · 최종 QA 결과
      meeting: null,                                   // 출시 승인 회의 합의 {decision, reason, evidence, risks, response}
      release: null,                                   // 배포 요청/진행 {requested, build, status, startedAt} (솔로)
      postCheckDone: false, postCheckAt: null,
      reportDraft: null, report: null, reportSubmitted: false,
      review: { status: "none", note: "" },
      done: false,
    },
    evalReady: false, evalDoc: null, evalViewed: false,  // 근무평가서
    leaveApproved: false, leftWork: false, endingStage: null,
    task5: {                  // TASK-005
      assigned: false, acked: false, started: false,
      filesViewed: [], fileNotes: [],                 // 공유 폴더 조사 기록 [{id, file, mismatch, reason, time}]
      designHistoryViewed: false, commitsViewed: [], deploysViewed: [], qaViewed: false, chatViewed: false, guideViewed: false,
      evidence: [],                                   // [{id, src, text, time}]
      answersB: {},                                   // MISSION B 질문 답
      timeline: { order: null, attempts: 0, passed: false, lastResult: null, checkedAt: null },
      reportDraft: null, report: null, reportSubmitted: false,
      review: { status: "none", note: "" },
      done: false,
    },
    opsView: { view: "deploy", sel: null, folder: "root" },
    nextTaskReady: false,     // (구버전 호환)
    task3Ready: false,        // (구버전 호환)
    task4Ready: false,        // TASK-004 준비 알림 완료
    currentApp: "work",
    currentRoom: "notice",
    taskView: { view: "list", taskNo: null },               // list | detail | inquiries | report | guide
    ticketScreen: "show",                                    // show | seats | checkout | result | mypage
    task: {                   // TASK-001
      started: false,
      inquiriesViewed: false,   // 고객 문의 파일을 열어봄
      inquiriesOpened: [],      // 상세를 읽은 문의 id 목록
      ticketVisited: false,     // TICKET ON 방문
      reproduced: [],           // 이상 현상 기록 [{id, screen, screenLabel, type, found, expected, time}]
      testLog: [],              // 테스트 모드 이벤트 로그 [{time, text, level}]
      reportDraft: null,        // 보고서 작성 중 내용
      report: null,             // 제출된 보고서
      reportSubmitted: false,
      review: { status: "none", note: "" },   // none | pending | returned | approved  (교사 검토)
      done: false,
    },
    task2: {                  // TASK-002
      started: false,
      viewerOpened: false,      // 디자인 검수 뷰어 열람
      guideOpened: false,       // UI/UX 가이드 열람
      findings: [],             // 발견한 차이 [{id, spotId, page, note, time}]
      findingsRevealed: false, findingsDone: false, answersOpen: false,  // 검수 결과 확인(해설 공개)
      principles: {},           // { spotId: ["contrast", ...] } 원칙 연결
      principlesChecked: false, // 원칙 분석 정답 확인
      design: null,             // 수정 옵션 선택 { btnStyle, contrast, ... }
      designApplied: false,     // TICKET ON 에 적용됨
      reportDraft: null,
      report: null,
      reportSubmitted: false,
      review: { status: "none", note: "" },
      done: false,
    },
    task3: {                  // TASK-003
      assigned: false, acked: false, started: false,
      reproductions: [],        // 오류 재현 기록 [{id, screen, screenLabel, action, found, expected, time}]
      reproAttempts: 0,         // 버튼이 반응하지 않은 클릭 횟수
      devtoolOpened: false,
      clues: [],                // 조사 기록 [{id, src, text, time}]
      code: null,               // 학생이 수정한 reservation.js 전체 (null = 원본)
      codeTested: false, testRuns: 0, testResult: null,
      codeFixed: false,         // 테스트 통과 → 이 팀의 TICKET ON 테스트 환경에 반영
      fixedCode: null,
      retest: { count: 0, passes: 0 },   // 수정 후 TICKET ON 재테스트
      reportDraft: null, report: null, reportSubmitted: false,
      review: { status: "none", note: "" },
      done: false,
    },
    task4: {                  // TASK-004
      assigned: false, acked: false, started: false,
      reproductions: [],        // 오류 재현 기록 [{id, screen, screenLabel, action, found, expected, evidence, time}]
      requests: [], reqSeq: 0, engine: null,   // 가상 결제 엔진 요청 기록 (팀별)
      logViewed: false, devtoolOpened: false,
      clues: [],
      ui: null, uiReviewed: {}, uiApplied: false, uiAppliedAt: null,   // 결제 UI 수정안 (팀 테스트 환경)
      code: null, codeTested: false, testRuns: 0, testResult: null, codeFlags: null, codeOk: false, fixedCode: null,
      qa: null,
      reportDraft: null, report: null, reportSubmitted: false,
      review: { status: "none", note: "" },
      done: false,
    },
    devView: { file: "log" },
    designView: { tab: "review", page: "show", version: "v2", compare: false, device: "desktop" },
    // TICKET ON 오류 상태 — 후속 미션에서 하나씩 false로 바꾸면 사이트에 반영됨
    ticketBugs: { lowContrast: true, payButton: true, resultMismatch: true },
    ticketDesign: null,         // TASK-002 에서 적용된 디자인 옵션 (null 이면 v2 기준 운영 화면)
    ticketOrder: null,          // 테스트 사이트에서 만든 주문 { seats, total, orderNo, serverStatus }
    hintsRevealed: [],
  };
}

const G = {
  state: defaultState(),
  live: LIVE_MEMBERSHIP,  // 라이브 모드면 멤버십 객체, 솔로 모드면 null
  rooms: null,            // chat.js 가 채움 (런타임 방 목록)
  loaded: false,          // 저장된 게임을 불러왔는지
  _saveTimer: null,

  load() {
    if (params.has("reset")) { localStorage.removeItem(SAVE_KEY); history.replaceState(null, "", location.pathname); }
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(SAVE_KEY) || "null"); } catch (e) { raw = null; }
    if (!raw || !raw.state || !raw.state.startedAt) return false;
    // 기본값 위에 저장값을 얹어서, 새 필드가 추가돼도 깨지지 않게
    G.state = deepMerge(defaultState(), raw.state);
    migrate(G.state);
    G.savedRooms = raw.rooms || null;
    G.loaded = true;
    return true;
  },

  save() {
    clearTimeout(G._saveTimer);
    G._saveTimer = setTimeout(G.saveNow, 250);
  },

  saveNow() {
    clearTimeout(G._saveTimer);
    const rooms = {};
    (G.rooms || []).forEach((r) => {
      rooms[r.id] = {
        visible: r.visible,
        unread: r.unread,
        messages: r.messages.map((m) => ({ ...m })),
      };
    });
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, savedAt: Date.now(), state: G.state, rooms }));
    } catch (e) { /* 저장 공간 부족 등은 무시 */ }
  },

  reset() {
    localStorage.removeItem(SAVE_KEY);
    location.href = "index.html";
  },
};

// 예전 저장 데이터를 새 구조에 맞게 보정
function migrate(st) {
  const t = st.task;
  // 이상 현상 기록: 구버전 {items, note} → 신버전 {type, found, expected}
  t.reproduced = (t.reproduced || []).map((r, i) => ({
    id: r.id || `rec-${i}-${Date.now()}`,
    screen: r.screen, screenLabel: r.screenLabel, time: r.time,
    type: r.type || "아직 판단하기 어려움",
    found: r.found ?? [...(r.items || []), r.note || ""].filter(Boolean).join(" / "),
    expected: r.expected || "",
  }));
  // 보고서: 구버전 필드가 있으면 새 필드로 옮김
  const fix = (r) => {
    if (!r || r.problems !== undefined) return r;
    return {
      stages: r.stages || [],
      problems: r.problems || (r.symptoms ? `(이전 양식) 증상 ${r.symptoms.length}개 선택` : ""),
      evidence: r.evidence || r.reason || "",
      followup: r.followup || "",
      refs: r.refs || [],
      submittedAt: r.submittedAt,
    };
  };
  t.reportDraft = fix(t.reportDraft);
  t.report = fix(t.report);
  if (!t.review) t.review = { status: "none", note: "" };
  if (t.done && t.review.status === "none") t.review.status = "approved";
  if (!st.task2.review) st.task2.review = { status: "none", note: "" };
  if (!st.task3.review) st.task3.review = { status: "none", note: "" };
  if (!st.task3.retest) st.task3.retest = { count: 0, passes: 0 };
  if (!st.task4.review) st.task4.review = { status: "none", note: "" };
  if (!Array.isArray(st.task4.requests)) st.task4.requests = [];
  if (!st.task4.runs) st.task4.runs = {};
  if (!st.task5.review) st.task5.review = { status: "none", note: "" };
  if (!st.task5.timeline) st.task5.timeline = { order: null, attempts: 0, passed: false, lastResult: null, checkedAt: null };
  if (!st.task6.review) st.task6.review = { status: "none", note: "" };
  if (!st.task6.qaEvents) st.task6.qaEvents = {};
  if (!st.task6.qaObs) st.task6.qaObs = {};
}

function deepMerge(base, over) {
  if (Array.isArray(base) || Array.isArray(over)) return over !== undefined ? over : base;
  if (typeof base !== "object" || base === null) return over !== undefined ? over : base;
  const out = { ...base };
  Object.keys(over || {}).forEach((k) => {
    out[k] = typeof base[k] === "object" && base[k] !== null && !Array.isArray(base[k])
      ? deepMerge(base[k], over[k])
      : over[k];
  });
  return out;
}

// ---------- 스케줄러 (게임 시간 기준, 일시정지/배속 지원) ----------
const Sched = {
  speed: params.has("fast") ? 8 : 1,
  paused: false,
  items: [],
  _seq: 0,
  _last: Date.now(),

  get now() { return G.state.vclock; },

  add(sec, fn, label = "") {
    const id = ++Sched._seq;
    Sched.items.push({ id, due: G.state.vclock + sec, fn, label });
    Sched.items.sort((a, b) => a.due - b.due);
    return id;
  },
  cancel(id) { Sched.items = Sched.items.filter((i) => i.id !== id); },

  tick() {
    const nowMs = Date.now();
    const dt = (nowMs - Sched._last) / 1000;
    Sched._last = nowMs;
    if (Sched.paused) return;
    G.state.vclock += dt * Sched.speed;
    Sched._fire();
    Sched._acc = (Sched._acc || 0) + dt;
    if (Sched._acc > 2) { Sched._acc = 0; G.save(); }
  },

  _fire() {
    while (Sched.items.length && Sched.items[0].due <= G.state.vclock) {
      const it = Sched.items.shift();
      try { it.fn(); } catch (e) { console.error(e); }
    }
  },

  // 교사용: 다음 이벤트 하나를 지금 실행
  skipNext() {
    if (!Sched.items.length) return false;
    G.state.vclock = Sched.items[0].due;
    Sched._fire();
    return true;
  },
  // 교사용: 예약된 이벤트 전부 즉시 실행
  flush() {
    while (Sched.items.length) Sched.skipNext();
  },
  pending() { return Sched.items.length; },
};
setInterval(Sched.tick, 100);

// 탭을 닫거나 새로고침할 때 즉시 저장
window.addEventListener("beforeunload", () => G.saveNow());

// ---------- 정답·해설 접근 (비공개 데이터) ----------
// 솔로/교사 환경에서는 private/data-private.js 의 TASK2_ANSWERS 를, 라이브 모드에서는 교사가 공개한 이벤트로 받은 G.state.answers 를 사용
function answerKey(force = false) {
  // 솔로: 교사 패널에서 '해설·정답 공개'를 누르기 전까지 학생 화면에는 정답이 없음 (force 는 교사 패널·교사 진행용)
  if (typeof TASK2_ANSWERS !== "undefined") return force || (G.state.task2 && G.state.task2.answersOpen) ? TASK2_ANSWERS : null;
  return (G.state.answers && G.state.answers.task2) || null;
}
function spotInfo(id, force = false) {
  const sp = TASK2.spots.find((x) => x.id === id) || { id, label: id, page: "" };
  const ak = answerKey(force);
  return { ...sp, ...((ak && ak.spots && ak.spots[id]) || {}) };
}
function choiceInfo(optId, choiceId) {
  const o = TASK2.options.find((x) => x.id === optId);
  const c = o && o.choices.find((x) => x.id === choiceId);
  if (!c) return null;
  const ak = answerKey();
  return { ...c, ...((ak && ak.options && ak.options[optId] && ak.options[optId][choiceId]) || {}) };
}
