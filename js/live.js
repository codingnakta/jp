// =====================================================================
//  학생용 실시간 클라이언트 (chat.html 에서 마지막에 로드)
//  · 세션 멤버십(localStorage 'dayeon-live')이 있으면 라이브 모드로 동작
//  · 교사가 공개한 이벤트(sessions/{sid}/events)를 순서대로 재생
//  · 공통 상태(public)의 게임 시각·업무 단계·공식 서비스 상태를 반영
//  · 팀 상태(teamData/{teamId}/state)를 자동 저장하고 복원
// =====================================================================

const Live = {
  sid: null, teamId: null, teamName: null,
  public: null, review: null,
  appliedSeq: 0, pendingEvents: [], initialApplied: false,
  saveState: "idle",   // idle | saving | saved | error
  lastSavedAt: null,
  _unsubs: [], _hb: null, _saveTimer: null,

  async start() {
    const m = G.live;
    if (!m) return;
    Live.sid = m.sid; Live.teamId = m.teamId; Live.teamName = m.teamName;
    Live.renderBadge();
    await Sync.init();
    await Sync.auth.signInAnonymously();
    // 멤버십 확인 (팀 이름/URL 조작으로 다른 팀 접근 불가: 서버 규칙 + uid 확인)
    const teamId = await Sync.db.get(`sessions/${Live.sid}/members/${Sync.auth.uid}`);
    if (!teamId || teamId !== Live.teamId) {
      sessionStorage.removeItem("dayeon-live");
      if ((JSON.parse(localStorage.getItem("dayeon-live") || "null") || {}).teamId === Live.teamId) localStorage.removeItem("dayeon-live");
      location.href = "student.html?reason=membership";
      return;
    }
    // 팀 상태 복원 (DB 우선)
    const remote = await Sync.db.get(`sessions/${Live.sid}/teamData/${Live.teamId}/state`);
    if (remote) {
      ["task", "task2", "task3", "task4", "task5", "task6", "evalViewed", "leftWork", "endingStage", "opsView", "devView", "designView", "ticketScreen", "ticketUI", "ticketOrder", "taskView", "currentApp", "currentRoom", "answers", "acked"].forEach((k) => {
        if (remote[k] !== undefined) G.state[k] = typeof remote[k] === "object" && remote[k] !== null && !Array.isArray(remote[k]) ? deepMerge(G.state[k] || {}, remote[k]) : remote[k];
      });
      migrate(G.state);
    }
    // 구독
    Live._unsubs.push(Sync.db.on(`sessions/${Live.sid}/public`, Live.onPublic));
    Live._unsubs.push(Sync.db.on(`sessions/${Live.sid}/events`, Live.onEvents));
    Live._unsubs.push(Sync.db.on(`sessions/${Live.sid}/teamData/${Live.teamId}/review`, Live.onReview));
    Live._unsubs.push(Sync.db.on(`sessions/${Live.sid}/teamData/${Live.teamId}/eval`, Live.onEval));
    Sync.connection.on((on) => { Live.renderBadge(); if (on && Live.saveState === "error") Live.flushSave(); });
    // 접속 상태
    const tp = `sessions/${Live.sid}/teams/${Live.teamId}`;
    const beat = () => Sync.db.update(tp, { lastSeen: Date.now(), online: true }).catch(() => {});
    beat(); Live._hb = setInterval(beat, 20000);
    Sync.db.onDisconnectSet(`${tp}/online`, false);
    // 저장 훅: G.save → 팀 상태를 DB에도 저장
    const origSaveNow = G.saveNow;
    G.saveNow = function () { origSaveNow(); Live.queueSave(); };
    G.save = function () { clearTimeout(G._saveTimer); G._saveTimer = setTimeout(G.saveNow, 250); };
    await Live.drain();
    showApp(G.state.currentApp || "work", true);
    openRoom(G.state.currentRoom || "notice");
    Live.renderBadge();
  },

  // ---------- 공통 상태 ----------
  onPublic(p) {
    const prev = Live.public;
    Live.public = p;
    if (!p) return;
    if (typeof p.gameTime === "number") G.state.vclock = Math.max(0, (p.gameTime - CLOCK_START) * 60);
    if (p.status === "ended") Live.showEnded();
    // 공식 서비스 상태/업무 단계 변경 → 현재 화면 다시 그리기
    const changed = !prev || JSON.stringify(prev.officialService) !== JSON.stringify(p.officialService) || JSON.stringify(prev.tasks) !== JSON.stringify(p.tasks);
    if (changed && G.state.currentApp === "dev" && typeof renderDevtool === "function") renderDevtool();
    const relChanged = !prev || JSON.stringify(prev.release) !== JSON.stringify(p.release);
    if (relChanged && p.release && p.release.status === "deploying" && G.state.task6 && G.state.task6.started) toast({ title: "DAYEON DEPLOY", sub: "공식 배포", text: `팀장(교사)이 ${p.release.build} 운영 배포를 시작했습니다.`, app: "ops" });
    if (relChanged && G.state.currentApp === "ops" && typeof renderOps === "function") renderOps();
    if (p.evalReady && !G.state.evalReady) { G.state.evalReady = true; G.save(); if (G.state.currentApp === "task") renderTaskPage(); }
    if (changed) Live.rerender();
    Live.renderBadge();
  },
  onEval(v) {
    if (!v || v.status !== "PUBLISHED") return;
    const first = !G.state.evalDoc || G.state.evalDoc.status !== "PUBLISHED";
    G.state.evalDoc = v; G.save();
    if (first) toast({ title: "인사팀", sub: "근무평가서 발급", text: "이 팀의 신입사원 근무평가서가 발급되었습니다. DAYEON TASK › 근무평가서에서 확인하세요.", app: "task" });
    if (G.state.currentApp === "task") renderTaskPage();
  },
  taskPhase(no) { return (Live.public && Live.public.tasks && Live.public.tasks["t" + no] && Live.public.tasks["t" + no].status) || "LOCKED"; },
  rerender() {
    const app = G.state.currentApp;
    if (app === "task") renderTaskPage();
    else if (app === "ticket") renderTicket();
    else if (app === "design") renderDesign();
  },

  // ---------- 이벤트 재생 ----------
  onEvents(obj) {
    const list = Object.values(obj || {}).filter((e) => e && typeof e.seq === "number").sort((a, b) => a.seq - b.seq);
    const fresh = list.filter((e) => e.seq > Live.queuedSeq);
    if (!fresh.length) return;
    const silent = !Live.initialApplied;   // 첫 로드/재접속: 이미 공개된 것은 연출 없이 복원
    Live.initialApplied = true;
    Live.queuedSeq = fresh[fresh.length - 1].seq;
    Live.pendingEvents.push(...fresh.map((e) => ({ ...e, silent })));
    Live.drain();
  },
  queuedSeq: 0,
  _busy: false,
  _done: Promise.resolve(),
  drain() {
    if (Live._busy) return Live._done;
    Live._busy = true;
    Live._done = (async () => {
      try {
        while (Live.pendingEvents.length) {
          const ev = Live.pendingEvents.shift();
          if (ev.seq <= Live.appliedSeq) continue;
          Live.appliedSeq = ev.seq;
          try { await applyLiveEvent(ev, ev.silent); } catch (e) { console.error("event", ev, e); }
        }
      } finally { Live._busy = false; }
    })();
    return Live._done;
  },

  // ---------- 교사 검토 ----------
  onReview(r) {
    Live.review = r || {};
    [1, 2, 3, 4, 5, 6].forEach((no) => {
      const rv = Live.review["t" + no];
      if (!rv) return;
      const s = no === 6 ? G.state.task6 : no === 5 ? G.state.task5 : no === 4 ? G.state.task4 : no === 3 ? G.state.task3 : no === 2 ? G.state.task2 : G.state.task;
      if (!s.reportSubmitted && rv.status !== "returned") return;
      if (rv.status === "approved" && s.review.status !== "approved") {
        s.review = { status: "approved", note: rv.note || "", locked: true };
        if (no !== 6) s.done = true;   // TASK-006 은 배포 후 확인 완료로 끝남
        appendMessage("dm-kim", { from: "kim", text: rv.note ? `보고서 승인했어요. ${rv.note}` : "보고서 승인했어요. 수고했어요!" }, { notify: true });
        toast({ title: "DAYEON TASK", sub: `TASK-00${no}`, text: "보고서가 승인되었습니다.", app: "task" });
      } else if (rv.status === "returned" && s.review.status !== "returned") {
        s.review = { status: "returned", note: rv.note || "", locked: false };
        s.reportSubmitted = false;
        appendMessage("dm-kim", { from: "kim", text: `보고서 보완 부탁해요. ${rv.note || "근거를 조금 더 구체적으로 적어 주세요."}` }, { notify: true });
      } else if (rv.status === "pending" && s.review.status === "pending") {
        s.review.locked = !!rv.locked;
      }
      G.save();
    });
    if (G.state.currentApp === "task") renderTaskPage();
  },

  // ---------- 팀 상태 저장 ----------
  queueSave() {
    clearTimeout(Live._saveTimer);
    Live._saveTimer = setTimeout(Live.flushSave, 400);
  },
  async flushSave() {
    const s = G.state;
    const data = { task: s.task, task2: s.task2, task3: s.task3, task4: s.task4, task5: s.task5, task6: s.task6, evalViewed: !!s.evalViewed, leftWork: !!s.leftWork, endingStage: s.endingStage || null, opsView: s.opsView, devView: s.devView, designView: s.designView, ticketScreen: s.ticketScreen, ticketUI: s.ticketUI || null, ticketOrder: s.ticketOrder, taskView: s.taskView, currentApp: s.currentApp, currentRoom: s.currentRoom, answers: s.answers || null, acked: s.acked, updatedAt: Date.now() };
    Live.saveState = "saving"; Live.renderBadge();
    try {
      await Sync.db.set(`sessions/${Live.sid}/teamData/${Live.teamId}/state`, JSON.parse(JSON.stringify(data)));
      Live.saveState = "saved"; Live.lastSavedAt = Date.now();
    } catch (e) {
      Live.saveState = "error";
    }
    Live.renderBadge();
  },

  // 보고서 제출: 저장이 확인된 뒤에만 '제출됨'으로 표시
  async submitReport(no, report) {
    const s = TS(no);
    s.report = report; s.reportDraft = report;
    s.review = { status: "submitting", note: "", locked: false };
    renderTaskPage();
    try {
      await Sync.db.set(`sessions/${Live.sid}/teamData/${Live.teamId}/submissions/t${no}`, { report: JSON.parse(JSON.stringify(report)), submittedAt: Date.now(), gameTime: report.submittedAt });
      s.reportSubmitted = true;
      s.review = { status: "pending", note: "", locked: false };
      G.saveNow();
      await Live.flushSave();
      renderTaskPage();
      toast({ title: "DAYEON TASK", sub: `TASK-00${no}`, text: "보고서가 제출되었습니다. 교사(김팀장) 검토 후 결과가 전달됩니다.", app: "task" });
      return true;
    } catch (e) {
      s.review = { status: "none", note: "", locked: false };
      renderTaskPage();
      toast({ title: "DAYEON TASK", sub: "제출 실패", text: "네트워크 문제로 제출되지 않았습니다. 연결을 확인하고 다시 제출하세요." });
      return false;
    }
  },

  // ---------- 상태 배지 ----------
  renderBadge() {
    let el = document.getElementById("live-badge");
    if (!el) {
      el = document.createElement("div");
      el.id = "live-badge";
      document.body.appendChild(el);
    }
    const online = Sync.connection.online;
    const save = { idle: "", saving: "저장 중…", saved: "저장됨", error: "저장 실패 · 재시도 대기" }[Live.saveState];
    const paused = Live.public && Live.public.status === "paused";
    el.className = `live-badge ${online ? "on" : "off"} ${Live.saveState === "error" ? "err" : ""}`;
    el.innerHTML = `<i></i><b>${esc(Live.teamName || "팀")}</b><span>${online ? "연결됨" : "연결 끊김 · 재연결 중"}</span>${paused ? `<span class="pause">진행 일시정지</span>` : ""}${save ? `<span class="save">${save}</span>` : ""}<a class="leave" href="student.html?new=1" title="이 기기의 수업 연결을 끊고 다른 수업 코드로 입장">다른 수업</a>`;
  },
  showEnded() {
    if (document.getElementById("live-ended")) return;
    const el = document.createElement("div");
    el.id = "live-ended";
    el.className = "live-ended";
    el.innerHTML = `<div><h2>수업이 종료되었습니다</h2><p>교사가 세션을 종료했습니다. 수고하셨습니다.</p><button onclick="localStorage.removeItem('dayeon-live');sessionStorage.removeItem('dayeon-live');location.href='student.html'">나가기</button></div>`;
    document.body.appendChild(el);
  },
};

if (G.live) Live.start().catch((e) => { console.error(e); toast({ title: "연결 오류", text: String(e.message || e) }); });
