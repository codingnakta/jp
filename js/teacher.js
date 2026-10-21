// =====================================================================
//  교사용 진행 도구 (숨김)
//  - 열기: Ctrl + Shift + T  또는  ?teacher=1
//  - 상태 확인 / 일시정지 / 다음 이벤트 / 배속 / 힌트(김팀장 DM) / 보고서 검토·승인 / 강제 진행 / 초기화
// =====================================================================

const teacherRoot = document.getElementById("teacher-root");
const TP = { enabled: params.has("teacher"), open: false, timer: null, tab: "status", note: "" };

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.shiftKey && (e.key === "T" || e.key === "t")) {
    e.preventDefault();
    TP.enabled = true;
    TP.open = !TP.open;
    renderTeacher();
  }
});

function currentMission() {
  const s = G.state, t1 = s.task, t2 = s.task2;
  if (!s.invited) return "STEP 2 · 첫 출근 (초대 전)";
  if (!s.incident.done) return "STEP 4 · 첫 사건 진행 중";
  if (!t1.started) return "TASK-001 · 업무 확인/시작 대기";
  if (!t1.done) {
    if (t1.review.status === "pending") return "TASK-001 · 보고서 검토 대기 (승인 필요)";
    if (t1.inquiriesOpened.length < 3) return "TASK-001 · 고객 문의 조사";
    if (!t1.reproduced.length) return "TASK-001 · 오류 재현";
    return "TASK-001 · 조사 보고서 작성";
  }
  if (!t2.assigned) return "TASK-001 완료 · 후속 대화 중";
  if (!t2.started) return "TASK-002 · 업무 확인/시작 대기";
  if (!t2.done) {
    if (t2.review.status === "pending") return "TASK-002 · 검수 보고서 검토 대기 (승인 필요)";
    if (!t2.findingsRevealed) return "TASK-002 · MISSION A 틀린 디자인 찾기";
    if (!t2.principlesChecked) return "TASK-002 · MISSION B 원칙 분석";
    if (!t2.designApplied) return "TASK-002 · MISSION C UI 수정";
    return "TASK-002 · 검수 보고서 작성";
  }
  const t3 = s.task3;
  if (!t3.assigned) return "TASK-002 완료 · 후속 대화 중";
  if (!t3.started) return "TASK-003 · 업무 확인/시작 대기";
  if (!t3.done) {
    if (t3.review.status === "pending") return "TASK-003 · 보고서 검토 대기 (승인 필요)";
    if (!t3.reproductions.length) return "TASK-003 · A 오류 재현";
    if (!t3.codeFixed) return "TASK-003 · B/C 조사·코드 수정";
    if (t3.retest.passes < 2) return "TASK-003 · D 재테스트";
    return "TASK-003 · E 보고서 작성";
  }
  const t4 = s.task4;
  if (!t4.assigned) return "TASK-003 완료 · 결제 테스트 대기";
  if (!t4.started) return "TASK-004 · 업무 확인/시작 대기";
  if (!t4.done) {
    if (t4.review.status === "pending") return "TASK-004 · 보고서 검토 대기 (승인 필요)";
    if (!t4.reproductions.length) return "TASK-004 · A 결제 오류 재현";
    if (!t4.uiApplied && !t4.codeOk) return "TASK-004 · B/C/D 조사·UI·코드";
    if (!t4.qa || !t4.qa.allPass) return "TASK-004 · E QA 검증";
    return "TASK-004 · 보고서 작성";
  }
  if (!s.followup5.done) return "TASK-004 완료 · 엔딩 대화 중";
  const t5 = s.task5;
  if (!t5.assigned) return "TASK-005 사건 진행 중";
  if (!t5.started) return "TASK-005 · 업무 확인/시작 대기";
  if (!t5.done) return t5.review.status === "pending" ? "TASK-005 · 보고서 검토 대기 (승인 필요)" : t5.timeline.passed ? "TASK-005 · 보고서 작성" : "TASK-005 · 조사 중";
  if (!s.followup7.done) return "TASK-005 완료 · 엔딩 대화 중";
  const t6 = s.task6;
  if (!t6.assigned) return "TASK-006 사건 진행 중";
  if (!t6.started) return "TASK-006 · 업무 확인/시작 대기";
  if (!t6.done) return t6.review.status === "pending" ? "TASK-006 · 보고서 검토 대기 (승인 필요)" : t6.release && t6.release.status === "done" ? "TASK-006 · 배포 후 확인 대기" : t6.review.status === "approved" ? "TASK-006 · 배포 실행 대기" : "TASK-006 · 검수 중";
  if (!s.leaveApproved) return "TASK-006 완료 · 엔딩·평가 진행 중";
  return s.leftWork ? "퇴근 완료" : "퇴근 승인 · 퇴근하기 대기";
}

function renderTeacher() {
  if (!TP.enabled) { teacherRoot.innerHTML = ""; return; }
  if (G.live || typeof HINTS === "undefined") { teacherRoot.innerHTML = ""; TP.open = false; return; }   // 수업 모드에서는 teacher.html 사용
  if (!TP.open) {
    teacherRoot.innerHTML = "";   // 닫혀 있을 때는 아무것도 표시하지 않음 (별도 버튼으로 toggleTeacherPanel() 호출)
    clearInterval(TP.timer);
    return;
  }
  const tabs = [["status", "진행"], ["review", "검토"], ["data", "학생 기록"], ["hints", "힌트"], ["answers", "해설"]];
  teacherRoot.innerHTML = `<div class="tp-panel">
    <div class="tp-head"><b>교사용 진행 도구</b><span>${Sched.paused ? "⏸ 일시정지" : "▶ 진행 중"} · x${Sched.speed} · ${fmtMinutes(nowMinutes())} · 예약 ${Sched.pending()}</span><button data-tp="close">접기</button></div>
    <div class="tp-mission">${esc(currentMission())}</div>
    <nav class="tp-tabs">${tabs.map(([k, l]) => `<button class="${TP.tab === k ? "on" : ""}" data-tptab="${k}">${l}</button>`).join("")}</nav>
    <div class="tp-body">${({ status: tpStatus, review: tpReview, data: tpData, hints: tpHints, answers: tpAnswers })[TP.tab]()}</div>
  </div>`;
  clearInterval(TP.timer);
  TP.timer = setInterval(() => {
    if (!TP.open) return;
    if (document.activeElement && document.activeElement.closest(".tp-panel")) return;  // 입력 중에는 갱신 안 함
    if (TP.tab === "status") renderTeacher();
  }, 2000);
}

const flag = (ok, label, extra = "") => `<li class="${ok ? "ok" : ""}"><i>${ok ? "✓" : "·"}</i>${label}${extra ? `<small>${extra}</small>` : ""}</li>`;

function tpStatus() {
  const s = G.state, t1 = s.task, t2 = s.task2;
  const inTask2 = t2.assigned;
  return `
    <div class="tp-sec">
      <h4>진행 상태</h4>
      <ul class="tp-flags">
        ${flag(s.invited, "프로젝트 채널 초대")}
        ${flag(s.incident.done, "첫 사건 대화", s.incident.started ? `${s.incident.count}/${INCIDENT.length}` : "")}
        ${flag(t1.started, "TASK-001 시작")}
        ${flag(t1.inquiriesOpened.length >= 3, "고객 문의 확인", `${t1.inquiriesOpened.length}/23`)}
        ${flag(t1.reproduced.length > 0, "이상 현상 기록", `${t1.reproduced.length}건`)}
        ${flag(t1.reportSubmitted || t1.done, "조사 보고서 제출", t1.review.status === "pending" ? "검토 대기" : t1.review.status)}
        ${flag(t1.done, "TASK-001 완료")}
        ${flag(t2.assigned, "TASK-002 배정", s.followup.started ? `${s.followup.count}/${FOLLOWUP.length}` : "")}
        ${flag(t2.started, "TASK-002 시작")}
        ${flag(t2.findingsRevealed, "A 검수 결과 확인", `발견 ${t2.findings.length}`)}
        ${flag(t2.principlesChecked, "B 원칙 분석 확인")}
        ${flag(t2.designApplied, "C 디자인 적용")}
        ${flag(t2.reportSubmitted || t2.done, "검수 보고서 제출", t2.review.status === "pending" ? "검토 대기" : t2.review.status)}
        ${flag(t2.done, "TASK-002 완료")}
        ${flag(s.task3.assigned, "TASK-003 배정")}
        ${flag(s.task3.codeFixed, "코드 수정 테스트 통과", `재테스트 ${s.task3.retest.passes}/2`)}
        ${flag(s.task3.done, "TASK-003 완료")}
        ${flag(s.task4.assigned, "TASK-004 배정")}
        ${flag(s.task4.uiApplied, "결제 UI 적용")}
        ${flag(s.task4.codeOk, "결제 코드 테스트 통과")}
        ${flag(!!(s.task4.qa && s.task4.qa.allPass), "QA 전부 통과", s.task4.qa ? `${s.task4.qa.passed}/${s.task4.qa.total}` : "")}
        ${flag(s.task4.done, "TASK-004 완료")}
        ${flag(s.followup5.done, "엔딩 → TASK-005 예고")}
        ${flag(s.task5.assigned, "TASK-005 배정")}
        ${flag(!!s.task5.timeline.passed, "타임라인 검증 통과", s.task5.timeline.attempts ? `${s.task5.timeline.attempts}회` : "")}
        ${flag(s.task5.done, "TASK-005 완료")}
        ${flag(s.followup7.done, "사건의 진실 → TASK-006 예고")}
        ${flag(s.task6.assigned, "TASK-006 배정")}
        ${flag(!!(s.task6.qa && s.task6.qa.allPass), "최종 QA 전부 통과", s.task6.qa ? `${s.task6.qa.passed}/${s.task6.qa.total}` : "")}
        ${flag(!!(s.task6.release && s.task6.release.status === "done"), "공식 배포 완료", s.task6.release ? s.task6.release.build || "" : "")}
        ${flag(s.task6.done, "TASK-006 완료 (배포 후 확인)")}
        ${flag(!!(s.evalDoc && s.evalDoc.status === "PUBLISHED"), "근무평가서 발급")}
        ${flag(s.leaveApproved, "퇴근 승인")}
      </ul>
    </div>
    <div class="tp-sec">
      <h4>진행 제어</h4>
      <div class="tp-btns">
        <button data-tp="pause">${Sched.paused ? "▶ 재개" : "⏸ 일시정지"}</button>
        <button data-tp="next" ${Sched.pending() ? "" : "disabled"}>다음 이벤트 ▶</button>
        <button data-tp="fast">${Sched.speed > 1 ? "보통 속도" : "빠르게 x8"}</button>
        <button data-tp="invite" ${s.invited ? "disabled" : ""}>초대 지금 실행</button>
        <button data-tp="flush" ${Sched.pending() ? "" : "disabled"}>예약 대화 끝까지</button>
      </div>
      <h4 style="margin-top:10px">미션 단계</h4>
      <div class="tp-btns">
        <button data-tp="complete1" ${t1.done ? "disabled" : ""}>TASK-001 완료 처리</button>
        <button data-tp="complete2" ${!t1.done || t2.done ? "disabled" : ""}>TASK-002 완료 처리</button>
        <button data-tp="complete3" ${!t2.done || s.task3.done ? "disabled" : ""}>TASK-003 완료 처리</button>
        <button data-tp="complete4" ${!s.task3.done || s.task4.done ? "disabled" : ""}>TASK-004 완료 처리</button>
        <button data-tp="complete5" ${!s.task4.done || s.task5.done ? "disabled" : ""}>TASK-005 완료 처리</button>
        <button data-tp="complete6" ${!s.task5.done || s.task6.done ? "disabled" : ""}>TASK-006 완료 처리 (배포 포함)</button>
        <button data-tp="release" ${!(s.task6.release && s.task6.release.requested && s.task6.release.status === "none") ? "disabled" : ""}>공식 배포 실행 (요청 승인)</button>
        <button data-tp="reveal" ${!t2.started || t2.answersOpen ? "disabled" : ""}>TASK-002 해설·정답 공개</button>
        <button data-tp="checkP" ${!t2.started || t2.principlesChecked ? "disabled" : ""}>원칙 분석 공개</button>
        <button data-tp="repro3" ${!t2.done || s.followup3.started ? "disabled" : ""}>결제 오류 재현 대화 재생</button>
        <button data-tp="restart2" ${!t2.started ? "disabled" : ""}>TASK-002 다시 시작</button>
        <button data-tp="restart1" ${!t1.started || t1.done ? "disabled" : ""}>TASK-001 다시 시작</button>
        <button data-tp="reset" class="danger">게임 초기화</button>
      </div>
      <p class="tp-help">일시정지 중에는 메신저 대화와 게임 시계가 멈춥니다. 학생 토론 시간에 사용하세요. 완료 처리는 보고서를 샘플로 채워 승인합니다.</p>
    </div>`;
}

function tpReview() {
  const s = G.state;
  const blocks = [1, 2].map((no) => {
    const t = no === 2 ? s.task2 : s.task;
    const r = t.report;
    if (!t.reportSubmitted && !t.done) return `<div class="tp-sec"><h4>TASK-00${no} 보고서</h4><p class="tp-help">아직 제출되지 않았습니다.</p></div>`;
    let body = "";
    if (no === 1 && r) {
      const stg = (r.stages || []).map((id) => (REPORT.stages.find((x) => x.id === id) || {}).label || id).join(", ");
      body = `<div class="tp-report">
        <p><b>① 문제 발생 단계</b> ${esc(stg || "-")}</p>
        <p><b>② 확인된 주요 문제</b><br>${esc(r.problems || "-")}</p>
        <p><b>③ 판단 근거</b><br>${esc(r.evidence || "-")}</p>
        <p><b>④ 추가 확인 사항</b><br>${esc(r.followup || "-")}</p>
        <p><b>참고 문의</b> ${esc((r.refs || []).join(", ") || "-")}</p>
      </div>`;
    } else if (r) {
      const pr = (r.problems || []).map((id) => (TASK2.spots.find((x) => x.id === id) || {}).label || id).join(", ");
      const pp = (r.principles || []).map((id) => (TASK2.principles.find((x) => x.id === id) || {}).name || id).join(", ");
      const d = t.design || {};
      const choices = TASK2.options.map((o) => { const c = o.choices.find((x) => x.id === d[o.id]); return c ? `${o.title.replace(/^[①-⑩]\\s*/, "")}: ${c.label} (${c.verdict})` : ""; }).filter(Boolean).join(" · ");
      body = `<div class="tp-report">
        <p><b>① 발견한 문제</b> ${esc(pr || "-")}${r.problemsEtc ? ` / ${esc(r.problemsEtc)}` : ""}</p>
        <p><b>② 관련 원칙</b> ${esc(pp || "-")}</p>
        <p><b>③ 적용한 개선</b> ${esc(choices || "-")}${r.improvements ? `<br>${esc(r.improvements)}` : ""}</p>
        <p><b>④ 기대 효과</b><br>${esc(r.expected || "-")}</p>
        <p><b>⑤ 개발 확인 사항</b><br>${esc(r.devChecks || "-")}</p>
      </div>`;
    }
    const actions = t.review.status === "pending"
      ? `<textarea class="tp-note" data-tp-note="${no}" rows="2" placeholder="학생에게 전달할 메모 (김팀장 DM으로 전송, 선택)">${esc(TP.note)}</textarea>
         <div class="tp-btns"><button data-tp="approve" data-no="${no}" class="ok">✓ 승인 (업무 완료)</button><button data-tp="return" data-no="${no}">↩ 보완 요청</button></div>`
      : `<p class="tp-help">상태: ${esc(t.review.status === "approved" ? "승인됨" : t.review.status === "returned" ? "보완 요청됨 (재제출 대기)" : t.review.status)}${t.review.note ? ` · ${esc(t.review.note)}` : ""}</p>`;
    return `<div class="tp-sec"><h4>TASK-00${no} 보고서 <small>${esc(r?.submittedAt || "")}</small></h4>${body}${actions}</div>`;
  });
  return blocks.join("");
}

function tpData() {
  const s = G.state, t1 = s.task, t2 = s.task2;
  const inq = t1.inquiriesOpened.map((id) => { const i = INQUIRIES.find((x) => x.id === id); return i ? `<li>${esc(id.replace("CS-251019-", "CS-"))} <small>${esc(i.category)} · 그룹 ${i.g}</small> ${esc(i.title)}</li>` : ""; }).join("");
  const recs = t1.reproduced.map((r) => `<li><b>${esc(r.screenLabel)}</b> <small>${esc(r.type)} · ${esc(r.time)}</small><br>${esc(r.found)}${r.expected ? `<br><i>기대: ${esc(r.expected)}</i>` : ""}</li>`).join("");
  const finds = t2.findings.map((f) => { const sp = spotInfo(f.spotId, true); return `<li><b>${esc(sp.label)}</b> <small>${sp.issue ? "사용성 문제" : "단순 차이"}</small>${f.note ? `<br>${esc(f.note)}` : ""}${(t2.principles[sp.id] || []).length ? `<br><i>원칙: ${esc((t2.principles[sp.id] || []).map((id) => TASK2.principles.find((p) => p.id === id).name).join(", "))}</i>` : ""}</li>`; }).join("");
  return `
    <div class="tp-sec"><h4>확인한 고객 문의 <small>${t1.inquiriesOpened.length}/23</small></h4><ul class="tp-list">${inq || "<li>없음</li>"}</ul></div>
    <div class="tp-sec"><h4>이상 현상 기록 <small>${t1.reproduced.length}건</small></h4><ul class="tp-list">${recs || "<li>없음</li>"}</ul></div>
    <div class="tp-sec"><h4>디자인 검수 목록 <small>${t2.findings.length}건</small></h4><ul class="tp-list">${finds || "<li>없음</li>"}</ul></div>
    <div class="tp-sec"><h4>디자인 수정 선택</h4><ul class="tp-list">${t2.design ? TASK2.options.map((o) => { const c = o.choices.find((x) => x.id === t2.design[o.id]); return `<li>${esc(o.title)} → ${c ? `${esc(c.label)} <small>${c.verdict}</small>` : "-"}</li>`; }).join("") : "<li>없음</li>"}</ul></div>`;
}

function tpHints() {
  const all = [...HINTS.map((h) => ({ ...h, task: "TASK-001" })), ...TASK2_ANSWERS.hints.map((h) => ({ ...h, task: "TASK-002" })), ...TASK3_ANSWERS.hints.map((h) => ({ ...h, task: "TASK-003" })), ...TASK4_ANSWERS.hints.map((h) => ({ ...h, task: "TASK-004" })), ...TASK5_ANSWERS.hints.map((h) => ({ ...h, task: "TASK-005" })), ...TASK6_ANSWERS.hints.map((h) => ({ ...h, task: "TASK-006" }))];
  return `<div class="tp-sec"><h4>힌트 공개 <small>김팀장 DM으로 도착 · 질문형</small></h4>
    <ul class="tp-hints">${all.map((h) => `<li><span class="tp-step">${esc(h.task)}<br>${esc(h.step)}</span><span>${esc(h.text)}</span><button data-tp="hint" data-hint="${h.id}" ${G.state.hintsRevealed.includes(h.id) ? "disabled" : ""}>${G.state.hintsRevealed.includes(h.id) ? "공개됨" : "공개"}</button></li>`).join("")}</ul></div>`;
}

function tpAnswers() {
  const t2 = G.state.task2;
  return `
    <div class="tp-sec">
      <h4>TASK-001 · 사건의 실제 원인</h4>
      <ul class="tp-notes">${TEACHER_NOTES.groups.map((g) => `<li><b>${g.label} (${g.count}건)</b><br>${esc(g.note)}</li>`).join("")}</ul>
      <p><b>기대 결론:</b> ${esc(TEACHER_NOTES.expected)}</p>
      <p><b>테스트 사이트 오류:</b> ① 예매하기 버튼 저대비 + 파란 관심공연 버튼과 혼동 ② 결제하기: 동의 후에도 회색, 1·2회 클릭 무응답(timeout/409), 3회째 진행 ③ 서버 PENDING인데 화면은 '결제 완료', 마이페이지에는 내역 없음</p>
      <p><b>제출 조건:</b> 문의 상세 3건↑ · 사이트 방문 · 기록 1건↑ · 단계 1개↑ · 서술 3문항 작성 → 교사 승인으로 완료</p>
    </div>
    <div class="tp-sec">
      <h4>TASK-002 · 검수 정답</h4>
      <p>${esc(TASK2_ANSWERS.teacherNotes.issues)}</p>
      <ul class="tp-notes">${TASK2.spots.map((x) => spotInfo(x.id, true)).map((sp) => `<li><b>${esc(sp.label)}</b> — ${sp.issue ? `사용성 문제 (${(sp.principles || []).map((id) => TASK2.principles.find((p) => p.id === id).name).join(", ")})` : "단순 시각 차이"}<br><small>${esc(sp.explain || "")}</small></li>`).join("")}</ul>
      <p><b>권장 수정:</b> ${esc(TASK2_ANSWERS.teacherNotes.recommended)}</p>
      <p><b>남겨야 할 오류:</b> ${esc(TASK2_ANSWERS.teacherNotes.remaining)}</p>
      <p><b>제출 조건:</b> 발견 1건↑ · 원칙 분석 확인 · 디자인 적용 · 문제/원칙 선택 · 기대 효과/개발 확인 작성 → 교사 승인으로 완료</p>
    </div>
    <div class="tp-sec">
      <h4>TASK-003 · 정답</h4>
      <p><b>원인:</b> ${esc(TASK3_ANSWERS.cause)}</p>
      <p><b>수정:</b> ${esc(TASK3_ANSWERS.fix)}</p>
      <p><b>남겨야 할 오류:</b> ${esc(TASK3_ANSWERS.remaining)}</p>
    </div>
    <div class="tp-sec">
      <h4>TASK-004 · 정답</h4>
      <p><b>원인:</b> ${esc(TASK4_ANSWERS.cause)}</p>
      <p><b>수정:</b> ${esc(TASK4_ANSWERS.fix)}</p>
      <p><b>다음 단서:</b> ${esc(TASK4_ANSWERS.remaining)}</p>
    </div>
    <div class="tp-sec">
      <h4>TASK-005 · 정답</h4>
      <p><b>버전:</b> 운영 ${esc(TASK5_ANSWERS.versions.production)} / 테스트 ${esc(TASK5_ANSWERS.versions.staging)}</p>
      <p><b>원인:</b> ${esc(TASK5_ANSWERS.cause)}</p>
      <p><b>과정:</b> ${esc(TASK5_ANSWERS.process)}</p>
    </div>
    <div class="tp-sec">
      <h4>TASK-006 · 정답</h4>
      <p><b>배포할 빌드:</b> ${esc(TASK6_ANSWERS.correct)} — ${esc(TASK6_ANSWERS.why)}</p>
    </div>`;
}

teacherRoot.addEventListener("input", (e) => {
  const n = e.target.closest("[data-tp-note]");
  if (n) TP.note = n.value;
});

teacherRoot.addEventListener("click", (e) => {
  const tab = e.target.closest("[data-tptab]");
  if (tab) { TP.tab = tab.dataset.tptab; renderTeacher(); return; }
  const b = e.target.closest("[data-tp]");
  if (!b) return;
  const a = b.dataset.tp;
  const s = G.state;
  if (a === "open") { TP.open = true; }
  if (a === "close") { TP.open = false; }
  if (a === "pause") { Sched.paused = !Sched.paused; }
  if (a === "next") { Sched.skipNext(); }
  if (a === "fast") { Sched.speed = Sched.speed > 1 ? 1 : 8; }
  if (a === "invite") { Sched.flush(); if (!s.invited) invite("ticketon", "kim"); }
  if (a === "flush") { Sched.flush(); }
  if (a === "complete1") { forceCompleteTask(1); }
  if (a === "complete2") { forceCompleteTask(2); }
  if (a === "complete3") { forceCompleteTask(3); }
  if (a === "complete4") { forceCompleteTask(4); }
  if (a === "complete5") { forceCompleteTask(5); }
  if (a === "complete6") { forceCompleteTask(6); if (!G.state.followup9.started) startFollowup9(); }
  if (a === "release") { startOfficialRelease(G.state.task6.release.build); }
  if (a === "reveal") { s.task2.answersOpen = true; s.task2.findingsRevealed = true; G.save(); if (s.currentApp === "design") renderDesign(); toast({ title: "DAYEON DESIGN", sub: "TASK-002 해설", text: "검수 결과·원칙 분석 결과·수정 선택지 평가가 공개되었습니다." }); }
  if (a === "checkP") { s.task2.principlesChecked = true; G.save(); if (s.currentApp === "design") renderDesign(); }
  if (a === "repro3") { if (typeof startFollowup3 === "function") { showApp("work"); openRoom("ticketon"); startFollowup3(); } }
  if (a === "restart2") {
    if (!confirm("TASK-002 진행(검수 목록, 원칙 분석, 디자인 수정, 보고서)을 지우고 처음부터 다시 시작합니다. TICKET ON에 적용된 디자인도 되돌립니다.")) return;
    const keep = { assigned: true, acked: s.task2.acked, started: true };
    s.task2 = Object.assign(defaultState().task2, keep);
    s.ticketDesign = null;
    s.followup2 = { started: false, count: 0, done: false };
    s.followup3 = { started: false, count: 0, done: false };
    s.task3Ready = false;
    G.save();
    if (s.currentApp === "design") renderDesign();
    if (s.currentApp === "task") renderTaskPage();
    if (s.currentApp === "ticket") renderTicket();
  }
  if (a === "restart1") {
    if (!confirm("TASK-001 진행(문의 확인, 이상 현상 기록, 보고서)을 지우고 처음부터 다시 시작합니다.")) return;
    const keep = { started: true, testLog: s.task.testLog };
    s.task = Object.assign(defaultState().task, keep);
    G.save();
    if (s.currentApp === "task") renderTaskPage();
  }
  if (a === "approve") { approveReport(Number(b.dataset.no), TP.note.trim()); TP.note = ""; }
  if (a === "return") { returnReport(Number(b.dataset.no), TP.note.trim()); TP.note = ""; }
  if (a === "reset") { if (confirm("저장된 게임 진행을 모두 지우고 로그인 화면으로 돌아갑니다. 계속할까요?")) G.reset(); return; }
  if (a === "hint") {
    const h = [...HINTS, ...TASK2_ANSWERS.hints, ...TASK3_ANSWERS.hints, ...TASK4_ANSWERS.hints, ...TASK5_ANSWERS.hints, ...TASK6_ANSWERS.hints].find((x) => x.id === b.dataset.hint);
    if (h && !s.hintsRevealed.includes(h.id)) {
      s.hintsRevealed.push(h.id);
      appendMessage("dm-kim", { from: "kim", text: h.text }, { notify: true });
      G.save();
    }
  }
  renderTeacher();
});

renderTeacher();

// 외부(직접 만든 버튼)에서 열고 닫기: toggleTeacherPanel() / openTeacherPanel() / closeTeacherPanel()
function toggleTeacherPanel() {
  if (G.live) { alert("수업 모드에서는 teacher.html(교사 대시보드)을 사용하세요."); return; }
  if (typeof HINTS === "undefined") { alert("솔로 모드 시나리오(private/data-private.js)가 없어 교사 패널을 열 수 없습니다."); return; }
  TP.enabled = true; TP.open = !TP.open; renderTeacher();
}
function openTeacherPanel() { TP.enabled = true; TP.open = true; renderTeacher(); }
function closeTeacherPanel() { TP.open = false; renderTeacher(); }
