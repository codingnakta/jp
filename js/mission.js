// =====================================================================
//  미션 가이드 — 학생 화면 어디서든 "지금 몇 단계, 다음에 할 일"을 보여주는 하단 바 + 단계 완료 알림
//  단계 정의는 data.js 의 MISSION_STEPS (프로젝터 화면과 공유), 완료 판정은 task.js 의 stepState1~6
// =====================================================================

const MS = { seen: {}, lastHtml: "", timer: null };

function activeMissionNo() {
  const st = G.state;
  const list = [[6, st.task6], [5, st.task5], [4, st.task4], [3, st.task3], [2, st.task2], [1, st.task]];
  const hit = list.find(([, t]) => t && t.started && !t.done);
  return hit ? hit[0] : null;
}
function missionInfo(no) {
  const fn = { 1: stepState1, 2: stepState2, 3: stepState3, 4: stepState4, 5: stepState5, 6: stepState6 }[no];
  const state = fn ? fn() : {};
  const defs = MISSION_STEPS[no] || [];
  const steps = defs.map((d) => ({ ...d, done: !!state[d.key] }));
  const doneCount = steps.filter((s) => s.done).length;
  const next = steps.find((s) => !s.done) || null;
  const t = TASKS.find((x) => x.no === no) || {};
  const s = TS(no);
  const waiting = s.reportSubmitted && s.review && ["pending", "submitting"].includes(s.review.status);
  const returned = s.review && s.review.status === "returned";
  return { no, code: t.code || `TASK-00${no}`, title: t.title || "", steps, doneCount, next, waiting, returned };
}
function goTaskDetail(no) {
  G.state.taskView = { view: "detail", taskNo: no };
  showApp("task");
}
function renderMissionBar() {
  let el = document.getElementById("mission-bar");
  const no = activeMissionNo();
  const inDetail = G.state.currentApp === "task" && G.state.taskView && G.state.taskView.view === "detail";
  if (!no || inDetail || G.state.leftWork) { if (el) el.remove(); MS.lastHtml = ""; return; }
  const m = missionInfo(no);
  let body;
  if (m.waiting) body = `<span class="mb-step">보고서 제출 완료</span><span class="mb-desc">팀장(교사) 검토를 기다리는 중입니다. 결과는 알림으로 옵니다.</span>`;
  else if (m.returned) body = `<span class="mb-step warn">보완 요청</span><span class="mb-desc">업무 상세에서 보고서를 보완해 다시 제출하세요.</span>`;
  else if (m.next) body = `<span class="mb-step">다음 · ${esc(m.next.label)}</span><span class="mb-desc">${esc(m.next.desc)}</span>`;
  else body = `<span class="mb-step">모든 단계 완료</span><span class="mb-desc">업무 상세로 돌아가 보고서를 제출하세요.</span>`;
  const html = `<div class="mb-left"><b>${esc(m.code)}</b><span class="mb-prog">${m.doneCount}/${m.steps.length}</span><span class="mb-dots">${m.steps.map((s, i) => `<i class="${s.done ? "on" : ""} ${!s.done && m.next && s.key === m.next.key ? "cur" : ""}" title="${esc(s.label)}">${i + 1}</i>`).join("")}</span></div><div class="mb-mid">${body}</div><button class="mb-btn" data-mission-go="${no}">업무 상세로</button>`;
  if (!el) { el = document.createElement("div"); el.id = "mission-bar"; el.className = "mission-bar"; document.body.appendChild(el); }
  if (html !== MS.lastHtml) { el.innerHTML = html; MS.lastHtml = html; }
}
function checkMissionProgress() {
  const no = activeMissionNo();
  if (!no) { renderMissionBar(); return; }
  const m = missionInfo(no);
  const prev = MS.seen[no];
  if (prev === undefined) MS.seen[no] = m.doneCount;
  else if (m.doneCount > prev) {
    MS.seen[no] = m.doneCount;
    const justDone = m.steps.filter((s) => s.done).slice(-1)[0];
    const inDetail = G.state.currentApp === "task" && G.state.taskView.view === "detail";
    if (!inDetail && justDone && !m.waiting) {
      toast({ title: `${m.code} · ${esc(justDone.label)} 완료 ✓`, sub: `${m.doneCount}/${m.steps.length}`, text: m.next ? `다음 단계 · ${m.next.label} — ${m.next.desc} (눌러서 업무 상세로)` : "모든 단계를 마쳤습니다. 업무 상세로 돌아가 보고서를 제출하세요. (눌러서 이동)", onClick: () => goTaskDetail(no) });
    }
  } else if (m.doneCount < prev) MS.seen[no] = m.doneCount;
  renderMissionBar();
}
document.addEventListener("click", (e) => { const b = e.target.closest("[data-mission-go]"); if (b) goTaskDetail(Number(b.dataset.missionGo)); });
window.addEventListener("load", () => { checkMissionProgress(); MS.timer = setInterval(checkMissionProgress, 1000); });
