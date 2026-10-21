// =====================================================================
//  TASK-004 테스트 시나리오 패널 — 결제 확인 화면 옆에서 시나리오 A/B/C 를 고르고, 회차별로 "방금 일어난 일"을 관찰
//  운영 화면(TICKET ON)의 버그 동작은 그대로 두고, 테스트 모드의 관찰 도구로 서버 결과와 화면 표시를 비교해 보여준다
//  런타임 상태: G.state.task4.runs = { A: [run...], B: [...], C: [...] } (팀별 동기화)
// =====================================================================

const RESULT_KO = {
  SUCCESS: "승인됨 — 결제 성공",
  DECLINED: "승인 거절 — 카드사가 거절함 (예: 한도 초과 · CARD_DECLINED)",
  DUPLICATE: "중복으로 거절됨 — 같은 결제가 또 와서 서버가 막음 (409)",
  TIMEOUT: "응답 없음 — 처리됐는지 알 수 없음",
  PENDING: "처리 중",
};
const SHOWN_KO = { success: "결제 완료", fail: "결제 실패 안내", pending: "결과 확인 중 안내", error: "오류 화면" };
let scnTimer = null;

function runsOf() { const t = G.state.task4; if (!t.runs) t.runs = {}; return t.runs; }
function runList(scn) { const r = runsOf(); if (!r[scn]) r[scn] = []; return r[scn]; }
function currentRun(scn) { const l = runList(scn); return l.length ? l[l.length - 1] : null; }
function runByAttempt(key) { const r = runsOf(); for (const k of Object.keys(r)) { const hit = r[k].find((x) => x.attemptKey === key); if (hit) return hit; } return null; }
function scenarioActive() { return typeof payMode === "function" && payMode() !== "legacy"; }

// 시나리오 선택 = 새 테스트 회차 시작 (독립된 결제 시도)
function startRun(scn) {
  const u = TU();
  u.scenario = scn;
  const key = "att-" + Date.now().toString(36);
  ttLocal.attemptKey = key; ttLocal.inflight = 0; ttLocal.sentCount = 0; ttLocal.processing = false; ttLocal.resolvedAttempt = null; ttLocal.err = "";
  const list = runList(scn);
  list.push({ no: list.length + 1, attemptKey: key, startedAt: Date.now(), clicks: 0, requests: [], obs: [], done: false, result: null, shown: null, charges: 0 });
  if (list.length > 10) list.shift();
  G.save();
  ttLog(`테스트 시나리오 ${scn} · ${list.length}회차 시작`);
}
function obsPush(key, level, text) {
  const run = runByAttempt(key); if (!run) return;
  run.obs.push({ t: Date.now() - run.startedAt, level, text });
  G.save();
  refreshScenarioPanel();
}
// ---- tryPay4 에서 호출하는 관찰 훅 ----
function obsClick(key, sent, reqNo, ignoredWhy) {
  const run = runByAttempt(key); if (!run) return;
  run.clicks++;
  if (sent) { run.requests.push(reqNo); obsPush(key, "info", `결제하기 클릭 #${run.clicks} → 서버로 결제 요청 보냄 (요청 #${String(reqNo).padStart(3, "0")})`); }
  else obsPush(key, "note", `결제하기 클릭 #${run.clicks} → 보내지 않음 (${ignoredWhy})`);
  if (run.clicks === 1) obsPush(key, "warn", "운영 화면: 버튼을 누른 뒤 아무 안내가 없는지 지켜보세요");
  startScnTimer();
}
function obsResponse(key, res) {
  const run = runByAttempt(key); if (!run) return;
  if (res.charged) run.charges++;
  const sec = (res.latency != null ? res.latency / 1000 : 0).toFixed(1);
  obsPush(key, res.status === "SUCCESS" ? "ok" : res.status === "DECLINED" ? "bad" : "warn", `서버 응답 (${sec}초 걸림) 요청 #${String(res.requestNo).padStart(3, "0")}: ${RESULT_KO[res.status] || res.status}${res.idempotent ? " · 같은 시도라서 저장된 결과를 돌려줌" : ""}${res.charged ? " · 💳 청구됨" : ""}`);
  if (run.charges >= 2) obsPush(key, "bad", `💳 같은 결제가 ${run.charges}번 청구되었습니다 (중복 결제)`);
}
function obsShown(key, shown, res) {
  const run = runByAttempt(key); if (!run) return;
  run.result = res.status; run.shown = shown;
  const match = (shown === "success" && res.status === "SUCCESS") || (shown === "fail" && res.status === "DECLINED") || (shown === "pending" && !["SUCCESS", "DECLINED"].includes(res.status));
  obsPush(key, match ? "ok" : "bad", `운영 화면 표시: "${SHOWN_KO[shown] || shown}" → ${match ? "✓ 실제 결과와 일치" : "✕ 실제 결과(" + (RESULT_KO[res.status] || res.status).split(" — ")[0] + ")와 다름"}`);
}
function obsFinish(key) {
  const run = runByAttempt(key); if (!run || run.done) return;
  if (ttLocal.inflight > 0 && ttLocal.attemptKey === key) return;
  run.done = true;
  const n = run.requests.length;
  const summary = `요청 ${n}건 · 승인 ${run.charges}건${run.charges >= 2 ? " (두 번 이상 청구됨)" : ""} · 화면 "${SHOWN_KO[run.shown] || "-"}"`;
  run.summary = summary;
  obsPush(key, "info", `회차 끝 — ${summary}`);
}
function startScnTimer() {
  clearInterval(scnTimer);
  scnTimer = setInterval(() => {
    if (!scenarioActive()) { clearInterval(scnTimer); return; }
    if (ttLocal.inflight > 0) refreshScenarioPanel();
    else { clearInterval(scnTimer); obsFinish(ttLocal.attemptKey); refreshScenarioPanel(); }
  }, 400);
}
function refreshScenarioPanel() {
  const el = document.getElementById("tt-scn-panel");
  if (el && G.state.ticketScreen === "checkout") el.innerHTML = scenarioPanelInner();
  const rb = document.getElementById("tt-scn-result");
  if (rb && G.state.ticketOrder) rb.innerHTML = resultBannerInner(G.state.ticketOrder);
}

// ---------- 결제 확인 화면 옆 패널 ----------
function scenarioPanelHTML() { return `<div class="tt-scn-panel" id="tt-scn-panel">${scenarioPanelInner()}</div>`; }
function scenarioPanelInner() {
  const u = TU(); const sel = u.scenario || null;
  const cards = TASK4.scenarios.map((sc) => {
    const list = runList(sc.id); const run = sel === sc.id ? currentRun(sc.id) : null; const doneN = list.filter((r) => r.done).length;
    const inflight = sel === sc.id && ttLocal.inflight > 0;
    const status = inflight ? `<span class="tt-scn-st run">진행 중 · 서버 응답 기다리는 중 ${((Date.now() - (run ? run.startedAt : Date.now())) / 1000).toFixed(1)}s</span>` : doneN ? `<span class="tt-scn-st ok">${doneN}회 완료</span>` : `<span class="tt-scn-st">미실행</span>`;
    return `<div class="tt-scn-card ${sel === sc.id ? "on" : ""}" data-scn="${sc.id}">
      <div class="tt-scn-head"><b>${sc.id}</b><span class="tt-scn-name">${esc(sc.name)}</span>${status}</div>
      <p class="tt-scn-desc"><span>서버</span>${esc(sc.desc)}</p>
      <p class="tt-scn-desc"><span>해 볼 것</span>${esc(sc.todo || "")}</p>
      ${sel === sc.id ? `<div class="tt-scn-obs"><div class="tt-scn-obs-h">방금 일어난 일 <small>${run ? run.no + "회차" : ""}</small>${run && run.done ? `<button class="tt-btn small" data-scn-again="${sc.id}">다시 하기</button>` : ""}</div>
        ${run && run.obs.length ? `<ol>${run.obs.map((o) => `<li class="${o.level}"><span>${(o.t / 1000).toFixed(1)}s</span>${esc(o.text)}</li>`).join("")}</ol>` : `<p class="dim">아래 결제 금액 칸에서 구매조건에 동의하고 <b>결제하기</b>를 누르면 여기에 기록됩니다.</p>`}
        ${run && run.done ? `<button class="tt-btn primary small" data-scn-record="${sc.id}">이 결과를 오류 재현 기록으로</button>` : ""}</div>` : ""}
    </div>`;
  }).join("");
  return `<div class="tt-scn-title">테스트 시나리오 <small>테스트 모드 · 관찰 도구</small></div>
    <p class="tt-scn-help">${sel ? "카드를 바꾸면 새 결제 시도(회차)가 시작됩니다. 운영 화면은 그대로 두고, 서버가 실제로 한 일과 화면이 보여준 것을 비교하세요." : "먼저 시나리오를 고르세요. 고르는 순간 그 시나리오의 1회차가 시작됩니다."}</p>${cards}`;
}

// ---------- 결제 결과 화면 띠 ----------
function resultBannerHTML(o) { return `<div class="tt-scn-result" id="tt-scn-result">${resultBannerInner(o)}</div>`; }
function resultBannerInner(o) {
  const run = runByAttempt(o.attemptKey); const sc = TASK4.scenarios.find((x) => x.id === o.scenario) || {};
  const serverKo = RESULT_KO[run && run.result ? run.result : o.serverStatus === "PAID" ? "SUCCESS" : o.serverStatus === "DECLINED" ? "DECLINED" : "PENDING"] || "-";
  const match = run ? ((run.shown === "success" && run.result === "SUCCESS") || (run.shown === "fail" && run.result === "DECLINED") || (run.shown === "pending" && !["SUCCESS", "DECLINED"].includes(run.result))) : null;
  return `<div class="tt-scn-result-top"><b>테스트 모드 · 시나리오 ${esc(o.scenario || "-")} ${esc(sc.name || "")}${run ? ` · ${run.no}회차` : ""}</b>
      <span class="tt-scn-cmp"><em>서버 결과</em>${esc(serverKo.split(" — ")[0])}</span><span class="tt-scn-cmp"><em>화면 표시</em>${esc(SHOWN_KO[o.shown] || "-")}</span><span class="tt-scn-st ${match ? "ok" : "bad"}">${match ? "✓ 일치" : "✕ 서로 다름"}</span>
      ${run && run.charges >= 2 ? `<span class="tt-scn-st bad">💳 ${run.charges}번 청구</span>` : ""}
      ${run ? `<button class="tt-btn primary small" data-scn-record="${esc(o.scenario)}">이 결과를 오류 재현 기록으로</button>` : ""}<button class="tt-btn small" data-scn-again="${esc(o.scenario)}">같은 시나리오 다시</button></div>
    ${run && run.obs.length ? `<ol class="tt-scn-obslist">${run.obs.map((x) => `<li class="${x.level}"><span>${(x.t / 1000).toFixed(1)}s</span>${esc(x.text)}</li>`).join("")}</ol>` : ""}`;
}

// ---------- 기록 미리 채우기 ----------
function prefillRecord(scn) {
  const run = currentRun(scn); const sc = TASK4.scenarios.find((x) => x.id === scn) || {};
  if (!run) return;
  const action = `시나리오 ${scn}(${sc.name}) · 결제 확인에서 결제하기 ${run.clicks}번 클릭`;
  const found = run.obs.filter((o) => ["ok", "bad"].includes(o.level) || /^서버 응답/.test(o.text)).map((o) => o.text).join(" / ") || (run.summary || "");
  const evidence = run.requests.length ? `요청 #${run.requests.map((n) => String(n).padStart(3, "0")).join(", #")} · 결제 결과 화면` : "결제 결과 화면";
  ttLocal.prefill = { action, found, evidence };
  ttLocal.modal = true; ttLocal.editId = null;
  G.state.ticketScreen = G.state.ticketScreen || "checkout";
  renderTicket();
}

// ---------- 이벤트 ----------
ticketAppEl.addEventListener("click", (e) => {
  if (!scenarioActive()) return;
  const again = e.target.closest("[data-scn-again]");
  if (again) { const scn = again.dataset.scnAgain; startRun(scn); if (G.state.ticketScreen !== "checkout") { G.state.ticketScreen = "checkout"; } G.save(); renderTicket(); return; }
  const rec = e.target.closest("[data-scn-record]");
  if (rec) { prefillRecord(rec.dataset.scnRecord); return; }
  const card = e.target.closest("[data-scn]");
  if (card && !e.target.closest("button")) { const scn = card.dataset.scn; if (TU().scenario === scn && ttLocal.inflight > 0) return; startRun(scn); renderTicket(); return; }
});
