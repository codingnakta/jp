// =====================================================================
//  교사용 GAME MASTER 확장 — TASK-006 (공식 배포 실행·배포 결과·해설) · 사원평가 탭 · 퇴근 승인 · 수업 종료
//  teacher-app.js 가 호출하는 훅: guideSteps6(ch, goTab) / reviewBody6(d, r) / notes6HTML() / evalTab()
// =====================================================================

const EV = { team: null, showTitles: false, preview: false, timer: null };

// ---------- 진행 가이드 단계 ----------
function guideSteps6(ch, goTab) {
  const s6 = submissionStats(6);
  const rel = T.pub.release || {};
  const requested = Object.entries(T.teamData).filter(([, d]) => d.state && d.state.task6 && d.state.task6.release && d.state.task6.release.requested).length;
  const evalPub = T.pub.eval && T.pub.eval.published;
  return [
    { title: "TASK-006 사건 공개 · 최후의 배포", desc: "이대리 '최종 배포 전에 QA 결과까지 꼭 확인' → 시스템 '현재 시각 17:55 · 시연 18:00' → 김팀장 '급하게 수정한 버전도 올려놨어요. 더 최신이니까…' → '그 버전 QA는?' → '설마 또요?'", ...ch("TASK-006 사건 · 최후의 배포") },
    { title: "TASK-006 배정", desc: "마지막 업무 카드 '퇴근 5분 전, 최후의 배포'가 도착합니다. 첨부: Build_History · release_notes · QA_Final_Report · Design_Checklist · Deployment_Checklist · Rollback_Guide.", ...ch("TASK-006 배정") },
    { title: "TASK-006 검수 시작", desc: "학생 흐름: A 배포 후보 4개 비교·선택(v1.0.2/1.0.4/1.0.5/1.0.6 — 최신≠검증) → B TICKET ON 실제 조작으로 최종 QA 6항목 → C 출시 승인 회의 합의 → D 보고서 제출 → (교사 승인 후) 배포 체크리스트·배포 요청 → 교사가 공식 배포 실행 → 배포 후 확인 완료. 약 20~25분.",
      status: `단계: ${PHASE_KO[phaseOf(6)]}`, done: () => phaseAtLeast(6, "ACTIVE"), ready: () => phaseOf(6) === "ANNOUNCED", action: { label: "검수 시작 열기", fn: () => setPhase(6, "ACTIVE") }, tools: true },
    { title: "출시 판단 보고서 검토·승인", desc: "팀별 후보 선택·QA 결과·회의 합의(승인/보류)를 비교하고 승인하거나 보완을 요청합니다. 승인된 팀만 배포 요청을 낼 수 있습니다(체크리스트 '배포 승인 기록'). 보류를 택한 팀의 근거도 발표시키세요.", status: `제출 ${s6.submitted}/${s6.teams}팀 · 승인 ${s6.approved} · 대기 ${s6.pending}`, done: () => s6.submitted > 0 && s6.pending === 0, ready: () => phaseOf(6) === "ACTIVE", action: goTab("review", s6.pending ? `검토 대기 ${s6.pending}건 보기` : "보고서 검토 탭"), manualDone: true },
    { title: "공식 배포 실행 (v1.0.5)", desc: `승인된 팀이 DAYEON DEPLOY에서 배포 요청을 내면 여기서 공식 배포를 실행합니다. 모든 팀 화면에 배포 로그 연출이 동시에 표시되고 운영 버전이 v1.0.5 로 바뀝니다. 배포 요청 ${requested}팀.`, status: rel.status === "done" ? "배포 완료" : rel.status === "deploying" ? "배포 중" : `요청 ${requested}팀 · 미실행`, done: () => rel.status === "done", ready: () => phaseAtLeast(6, "ACTIVE"), action: { label: rel.status === "deploying" ? "배포 진행 중…" : "v1.0.5 운영 배포 실행", fn: applyRelease } },
    { title: "배포 결과 공개", desc: "학생들이 '배포 후 확인 완료'를 보고한 뒤 공개합니다. 시스템 '운영 서비스 상태 확인 완료 · v1.0.5' → 이대리·한사원 확인 → 김팀장 '오늘은 다 같이 정시 퇴근합시다 ^^'", ...ch("TASK-006 배포 결과 공개") },
    { title: "TASK-006 해설 공개", desc: "최신≠정답 · QA의 의미 · 디자인·개발 협업 · 배포 성공≠정상 운영 · 예방에 필요한 것 — 학습 정리를 모든 팀과 프로젝터에 공개합니다. 공개 전에는 숨겨져 있어 먼저 토론할 수 있습니다.", status: T.events.some((e) => e.type === "debrief" && e.task === 6) ? "공개됨" : "미공개", done: () => T.events.some((e) => e.type === "debrief" && e.task === 6), ready: () => phaseAtLeast(6, "ACTIVE"), action: { label: "해설 공개", fn: () => publishDebrief(6) } },
    { title: "TASK-006 종료", desc: "업무를 종료 상태로 표시합니다.", status: `단계: ${PHASE_KO[phaseOf(6)]}`, done: () => phaseOf(6) === "COMPLETED", ready: () => phaseAtLeast(6, "ACTIVE"), action: { label: "종료 처리", fn: () => setPhase(6, "COMPLETED") } },
    { title: "근무평가 진행", desc: "시스템 '신입사원 근무 실적이 인사팀으로 전달' → 김팀장 '퇴근 전에 확인할 게 하나' → '설마 또 업무?' → '인사팀에서 근무평가서를 발급했거든요!' 학생 화면에 근무평가서 메뉴가 열리고 '작성 중' 안내가 표시됩니다.", status: T.pub.evalReady ? "진행됨" : "미진행", done: () => !!T.pub.evalReady && chapterDone("근무평가 진행"), ready: () => chapterIsNext("근무평가 진행"), action: { label: "근무평가 진행", fn: async () => { await Sync.db.update(sp("public"), { evalReady: true }); await publishEvent({ type: "evalReady" }); await publishChapter("근무평가 진행"); } } },
    { title: "팀별 평가 확정", desc: "사원평가 탭에서 팀별 자동 집계 초안(점수·근거·칭호·종합 의견)을 검토해 수정하고 '공개 준비 완료'로 표시합니다. 근거가 부족한 항목은 미평가로 두거나 직접 입력하세요.", status: `준비 완료 ${Object.values(T.teamData).filter((d) => d.eval && ["READY", "PUBLISHED"].includes(d.eval.status)).length}/${Object.keys(T.teams).length}팀`, done: () => Object.keys(T.teams).length > 0 && Object.entries(T.teams).every(([tid]) => T.teamData[tid] && T.teamData[tid].eval && ["READY", "PUBLISHED"].includes(T.teamData[tid].eval.status)), ready: () => !!T.pub.evalReady, action: goTab("eval", "사원평가 탭 열기"), manualDone: true },
    { title: "평가서 전체 공개", desc: "준비 완료된 팀의 평가서를 동시에 공개합니다. 각 팀은 자기 팀 평가서만 볼 수 있습니다(DB 권한). 프로젝터에는 대표 칭호만 표시할지 선택할 수 있습니다.", status: evalPub ? "공개됨" : "미공개", done: () => !!evalPub, ready: () => Object.values(T.teamData).some((d) => d.eval && d.eval.status === "READY"), action: { label: "평가서 전체 공개", fn: publishEval } },
    { title: "퇴근 승인", desc: "김팀장 '평가서 확인하셨죠? 오늘은 모두 정시 퇴근입니다!' → 시스템 '오늘의 모든 업무가 종료되었습니다' → 모든 팀에 [퇴근하기] 버튼이 활성화됩니다. 학생이 누르면 그 팀의 화면에 최종 엔딩이 표시됩니다.", status: T.pub.leaveApproved ? "승인됨" : "미승인", done: () => !!T.pub.leaveApproved, ready: () => !!evalPub, action: { label: "퇴근 승인", fn: approveLeave } },
  ];
}

// ---------- 공식 배포 · 평가 공개 · 퇴근 승인 ----------
async function applyRelease() {
  if (T.pub.release && T.pub.release.status === "deploying") return;
  if (!confirm("v1.0.5 (b-1005-a2d8) 를 운영 환경에 배포할까요? 모든 팀 화면에 배포 연출이 표시됩니다.")) return;
  const startedAt = Date.now();
  await Sync.db.update(sp("public"), { release: { status: "deploying", build: "v1.0.5", by: "김팀장", startedAt } });
  clearTimeout(EV.timer);
  EV.timer = setTimeout(async () => {
    await Sync.db.update(sp("public"), { "release/status": "done", "release/doneAt": Date.now() });
    await publishEvent({ type: "official", text: "TICKET ON 운영 환경에 v1.0.5 (b-1005-a2d8) 배포가 완료되었습니다. 헬스 체크 3/3 통과." });
  }, TASK6.deployLog.length * 900 + 1200);
}
async function publishEval() {
  const ready = Object.entries(T.teamData).filter(([, d]) => d.eval && d.eval.status === "READY");
  if (!ready.length) { alert("공개 준비 완료(READY) 상태인 팀이 없습니다."); return; }
  if (!confirm(`${ready.length}팀의 평가서를 공개할까요? 공개 후에는 학생이 바로 볼 수 있습니다.`)) return;
  const titles = {};
  for (const [tid, d] of ready) {
    await Sync.db.update(sp(`teamData/${tid}/eval`), { status: "PUBLISHED", publishedAt: Date.now() });
    const main = (d.eval.titles || [])[0]; titles[tid] = main ? (EVAL.titles.find((t) => t.id === main) || {}).name || "" : "";
  }
  Object.entries(T.teamData).forEach(([tid, d]) => { if (d.eval && d.eval.status === "PUBLISHED" && !titles[tid]) { const main = (d.eval.titles || [])[0]; titles[tid] = main ? (EVAL.titles.find((t) => t.id === main) || {}).name || "" : ""; } });
  await Sync.db.update(sp("public"), { eval: { published: true, at: Date.now(), showTitles: EV.showTitles, titles } });
  flash(`${ready.length}팀 평가서를 공개했습니다.`);
}
async function approveLeave() {
  if (!confirm("전체 팀의 퇴근을 승인할까요? 퇴근 승인 대화가 공개되고 [퇴근하기] 버튼이 활성화됩니다.")) return;
  await publishChapter("퇴근 승인");
  await publishEvent({ type: "leave", text: "오늘의 모든 업무가 종료되었습니다. TICKET ON 프로젝트: 출시 완료 · 근무 상태: 퇴근 승인" });
  await Sync.db.update(sp("public"), { leaveApproved: true });
}

// ---------- 보고서 검토 (TASK-006) · 해설 ----------
function reviewBody6(d, r) {
  const st = (d.state && d.state.task6) || {}; const c = TASK6.candidates.find((x) => x.id === (st.candidate || {}).id); const q = st.qa; const m = st.meeting || {};
  return `<p><b>① 배포 후보</b> ${c ? `<b>${c.id}</b> (${c.buildId})` : "-"}<br>이유: ${esc((st.candidate || {}).reason || "-")}<br>증거: ${esc((st.candidate || {}).evidence || "-")}<br>추가 확인: ${esc((st.candidate || {}).extra || "-")}</p>
    <p><b>② 최종 QA</b> ${q ? `${q.passed}/${q.total} PASS` : "미실행"}<br>${q ? TASK6.qaCases.map((x) => `${x.id} ${q.results[x.id].status}`).join(" · ") : ""}${q ? `<br><small>${TASK6.qaCases.filter((x) => x.kind === "observe").map((x) => `${x.id} 관찰: ${esc(((st.qaObs || {})[x.id] || {}).note || "-")}`).join(" / ")}</small>` : ""}</p>
    <p><b>③ 출시 판단</b> <b>${m.decision === "approve" ? "출시 승인" : m.decision === "hold" ? "출시 보류" : "-"}</b><br>이유: ${esc(m.reason || "-")}<br>증거: ${esc(m.evidence || "-")}<br>남은 위험: ${esc(m.risks || "-")}<br>대응 방안: ${esc(m.response || "-")}</p>
    <p><b>④ 배포</b> ${st.release && st.release.requested ? `배포 요청 ${esc(st.release.build)}` : "요청 전"} · 배포 후 확인 ${st.postCheckDone ? "완료" : "-"}</p>
    ${r.note ? `<p><b>⑤ 팀 의견</b><br>${esc(r.note)}</p>` : ""}
    ${c && c.id !== TASK6_ANSWERS.correct ? `<p class="help" style="color:#b45309">교육용 결과(미공개): ${esc((TASK6_ANSWERS.outcomes.find((o) => o.build === c.id) || {}).text || "")}</p>` : ""}`;
}
function notes6HTML() {
  return `<section class="card"><h3>TASK-006 · 정답과 해설</h3>
    <p><b>배포할 빌드:</b> ${esc(TASK6_ANSWERS.correct)} — ${esc(TASK6_ANSWERS.why)}</p>
    <p><b>잘못된 선택의 교육용 결과:</b></p><ul class="list">${TASK6_ANSWERS.outcomes.map((o) => `<li><b>${o.build}</b> — ${esc(o.text)}</li>`).join("")}</ul>
    <p><b>학습 정리(해설):</b><br>${esc(TASK6_ANSWERS.debrief).replace(/\n/g, "<br>")}</p>
    <p><b>제출 조건:</b> 후보 선택·이유 · 최종 QA 6항목 실행 · 회의 결정·이유·대응 방안 → 교사 승인 → 체크리스트 전부 통과 시 배포 요청 → 교사 공식 배포 → 배포 후 확인 완료로 종료</p>
    <h4>발표용 질문</h4><ul class="list">${TASK6_ANSWERS.questions.map((q) => `<li>${esc(q)}</li>`).join("")}</ul>
  </section>`;
}

// ---------- 사원평가 탭 ----------
function evalTab() {
  const teams = Object.entries(T.teams);
  if (!EV.team && teams.length) EV.team = teams[0][0];
  const rows = teams.map(([tid, t]) => { const ev = (T.teamData[tid] || {}).eval; const st = ev ? ev.status : "DRAFT"; return `<tr class="${EV.team === tid ? "sel" : ""}"><td><b>${esc(t.name)}</b></td><td><span class="phase ${st === "PUBLISHED" ? "COMPLETED" : st === "READY" ? "ACTIVE" : "ANNOUNCED"}">${{ DRAFT: "작성 중", READY: "공개 준비 완료", PUBLISHED: "공개됨" }[st]}</span></td><td>${ev ? EVAL.items.map((i) => ev.scores[i.id] == null ? "-" : ev.scores[i.id]).join(" / ") : "<small>미작성</small>"}</td><td>${ev ? (ev.titles || []).map((id) => (EVAL.titles.find((x) => x.id === id) || {}).name).join(", ") : ""}</td><td>${ev ? (ev.verdict === "leave" ? "정시 퇴근 승인" : ev.verdict === "review" ? "추가 검토" : "-") : ""}</td><td><button data-ev-team="${tid}">편집</button></td></tr>`; }).join("");
  return `<section class="card">
    <h3>사원평가 <small>팀별 근무평가서</small></h3>
    <p class="help">각 팀의 실제 활동 기록(열람·기록·수정·테스트·보고서)으로 초안을 집계합니다. 점수·칭호·종합 의견을 검토·수정해 '공개 준비 완료'로 표시한 뒤 [평가서 전체 공개]를 누르세요. 공개 전에는 교사만 볼 수 있습니다.</p>
    <table class="tbl"><thead><tr><th>팀</th><th>상태</th><th>분석/UX/개발/협업/QA/보고</th><th>칭호</th><th>판정</th><th></th></tr></thead><tbody>${rows || `<tr><td colspan="6" class="empty">승인된 팀이 없습니다.</td></tr>`}</tbody></table>
    <div class="btns"><label class="help"><input type="checkbox" data-ev-showtitles ${EV.showTitles ? "checked" : ""}> 프로젝터에 팀별 대표 칭호 표시</label><button class="primary" data-ev-publish ${T.pub.eval && T.pub.eval.published ? "disabled" : ""}>평가서 전체 공개</button><button data-ev-leave ${T.pub.eval && T.pub.eval.published && !T.pub.leaveApproved ? "" : "disabled"}>퇴근 승인</button></div>
  </section>
  ${EV.team && T.teams[EV.team] ? evalEditorHTML(EV.team) : ""}`;
}
function evalEditorHTML(tid) {
  const t = T.teams[tid]; const d = T.teamData[tid] || {}; const st = d.state || {};
  const draft = computeEvalDraft(st, t.name);
  const ev = d.eval || { ...draft, status: "DRAFT", verdict: null };
  const published = ev.status === "PUBLISHED";
  const stats = [1, 2, 3, 4, 5, 6].map((no) => { const k = no === 1 ? "task" : "task" + no; const s = st[k] || {}; return `<li>TASK-00${no}: ${s.started ? (s.done ? "완료" : s.reportSubmitted ? "제출" : "진행 중") : "미시작"}</li>`; }).join("");
  return `<section class="card" data-ev-editor="${tid}">
    <h3>${esc(t.name)} 팀 평가 편집 <span class="phase ${ev.status === "PUBLISHED" ? "COMPLETED" : ev.status === "READY" ? "ACTIVE" : "ANNOUNCED"}">${{ DRAFT: "작성 중", READY: "공개 준비 완료", PUBLISHED: "공개됨" }[ev.status]}</span><button class="x" data-ev-team="">닫기</button></h3>
    <div class="cols">
      <div><h4>업무 실적</h4><ul class="list">${stats}</ul><p class="small">자동 집계 초안: ${EVAL.items.map((i) => `${i.name} ${draft.scores[i.id] == null ? "미평가" : draft.scores[i.id]}`).join(" · ")}</p><button data-ev-reset="${tid}" ${published ? "disabled" : ""}>초안으로 되돌리기</button></div>
      <div><h4>역량 평가</h4><table class="tbl small"><tbody>${EVAL.items.map((i) => `<tr><th>${esc(i.name)}</th><td><select data-ev-score="${i.id}" ${published ? "disabled" : ""}>${["", 1, 2, 3, 4, 5].map((v) => `<option value="${v}" ${String(ev.scores[i.id] ?? "") === String(v) ? "selected" : ""}>${v === "" ? "미평가" : v + "점"}</option>`).join("")}</select></td><td><small>${esc(ev.basis[i.id] || "")}</small></td></tr>`).join("")}</tbody></table></div>
      <div><h4>칭호 <small>대표 1 + 추가 최대 2</small></h4>
        <label class="help">대표 칭호 <select data-ev-main ${published ? "disabled" : ""}>${["", ...EVAL.titles.map((x) => x.id)].map((id) => `<option value="${id}" ${(ev.titles || [])[0] === id ? "selected" : ""}>${id ? (EVAL.titles.find((x) => x.id === id) || {}).name : "(없음)"}</option>`).join("")}</select></label>
        <div class="help">추가 칭호</div>${EVAL.titles.map((x) => `<label class="help"><input type="checkbox" data-ev-extra="${x.id}" ${(ev.titles || []).slice(1).includes(x.id) ? "checked" : ""} ${published ? "disabled" : ""}> ${esc(x.name)} <small>${esc(x.desc)}</small></label>`).join("")}
        <h4>최종 판정</h4><label class="help"><input type="radio" name="ev-verdict" value="leave" ${ev.verdict === "leave" ? "checked" : ""} ${published ? "disabled" : ""}> 정시 퇴근 승인</label><label class="help"><input type="radio" name="ev-verdict" value="review" ${ev.verdict === "review" ? "checked" : ""} ${published ? "disabled" : ""}> 추가 검토 필요</label></div>
      <div><h4>팀장 종합 의견</h4><textarea data-ev-comment rows="6" ${published ? "disabled" : ""}>${esc(ev.comment || "")}</textarea><p class="small">자동 문구는 참고용 초안입니다. 공개 전 수정하세요.</p>
        <div class="btns">${published ? "" : `<button data-ev-save="${tid}:DRAFT">저장 (작성 중)</button><button class="primary" data-ev-save="${tid}:READY">저장 · 공개 준비 완료</button>`}<button data-ev-preview="${tid}">${EV.preview ? "미리보기 닫기" : "평가서 미리보기"}</button></div></div>
    </div>
    ${EV.preview ? `<div class="ev-preview">${evalDocHTML(ev, { name: t.name, members: `${t.name} 팀원` }, { preview: true })}</div>` : ""}
  </section>`;
}
function readEvalEditor(tid) {
  const d = T.teamData[tid] || {}; const draft = computeEvalDraft(d.state || {}, (T.teams[tid] || {}).name);
  const scores = {}; EVAL.items.forEach((i) => { const v = app.querySelector(`[data-ev-score="${i.id}"]`).value; scores[i.id] = v === "" ? null : Number(v); });
  const main = app.querySelector("[data-ev-main]").value;
  const extras = [...app.querySelectorAll("[data-ev-extra]:checked")].map((c) => c.dataset.evExtra).filter((id) => id !== main).slice(0, 2);
  const titles = main ? [main, ...extras] : extras;
  const verdict = (app.querySelector('input[name="ev-verdict"]:checked') || {}).value || null;
  const comment = app.querySelector("[data-ev-comment]").value.trim();
  return { scores, basis: draft.basis, titles, comment, verdict, doneCount: draft.doneCount };
}
// 평가 편집기의 입력값은 저장 전까지 화면에만 있다. 화면이 다시 그려질 때(팀 접속 신호 등) 지워지지 않도록
// 교사가 손댄 뒤에는(EV.dirty) 값을 떠서 다시 그린 후 되살린다. teacher-app.js 의 render() 가 호출한다.
function editorSnapshot() {
  const root = app.querySelector("[data-ev-editor]"); if (!root || !EV.dirty) return null;
  const v = (sel) => { const el = root.querySelector(sel); return el ? el.value : undefined; };
  return {
    tid: root.dataset.evEditor,
    scores: Object.fromEntries([...root.querySelectorAll("[data-ev-score]")].map((el) => [el.dataset.evScore, el.value])),
    main: v("[data-ev-main]"),
    extras: [...root.querySelectorAll("[data-ev-extra]")].map((el) => [el.dataset.evExtra, el.checked]),
    verdict: (root.querySelector('input[name="ev-verdict"]:checked') || {}).value || null,
    comment: v("[data-ev-comment]"),
  };
}
function editorRestore(s) {
  const root = app.querySelector(`[data-ev-editor="${s.tid}"]`); if (!root) { EV.dirty = false; return; }
  const set = (sel, val) => { const el = root.querySelector(sel); if (el && !el.disabled && val !== undefined) el.value = val; };
  Object.entries(s.scores).forEach(([id, val]) => set(`[data-ev-score="${id}"]`, val));
  set("[data-ev-main]", s.main);
  s.extras.forEach(([id, on]) => { const el = root.querySelector(`[data-ev-extra="${id}"]`); if (el && !el.disabled) el.checked = on; });
  root.querySelectorAll('input[name="ev-verdict"]').forEach((el) => { if (!el.disabled) el.checked = el.value === s.verdict; });
  set("[data-ev-comment]", s.comment);
}
app.addEventListener("input", (e) => { if (e.target.closest("[data-ev-editor]")) EV.dirty = true; });
app.addEventListener("change", (e) => { if (e.target.closest("[data-ev-editor]")) EV.dirty = true; });
app.addEventListener("click", async (e) => {
  const t = (sel) => e.target.closest(sel);
  const team = t("[data-ev-team]"); if (team) { EV.team = team.dataset.evTeam || null; EV.preview = false; EV.dirty = false; render(); return; }
  const sv = t("[data-ev-save]"); if (sv) { const [tid, status] = sv.dataset.evSave.split(":"); const doc = readEvalEditor(tid); EV.dirty = false; await Sync.db.update(sp(`teamData/${tid}/eval`), { ...doc, status, updatedAt: Date.now(), by: Sync.auth.uid }); flash(`${T.teams[tid].name} 팀 평가를 저장했습니다 (${status === "READY" ? "공개 준비 완료" : "작성 중"}).`); return; }
  const rs = t("[data-ev-reset]"); if (rs) { const tid = rs.dataset.evReset; EV.dirty = false; const draft = computeEvalDraft((T.teamData[tid] || {}).state || {}, T.teams[tid].name); await Sync.db.set(sp(`teamData/${tid}/eval`), { ...draft, status: "DRAFT", verdict: null, updatedAt: Date.now() }); return; }
  const pv = t("[data-ev-preview]"); if (pv) { EV.preview = !EV.preview; render(); return; }
  if (t("[data-ev-publish]")) { publishEval(); return; }
  if (t("[data-ev-leave]")) { approveLeave(); return; }
});
app.addEventListener("change", (e) => { const st = e.target.closest("[data-ev-showtitles]"); if (st) EV.showTitles = st.checked; });
