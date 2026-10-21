// =====================================================================
//  TASK-004 결제 대참사
//  · PayEngine: 교육용 가상 결제 처리 엔진 (실제 결제 없음). 요청 기록·멱등성 키·시나리오 A/B/C
//  · 개발자 도구 변형: payment.js 편집(5행~), Network 로그 뷰어, 구조 분석 기반 테스트 (eval 없음)
//  · 결제 UI 편집기 (DAYEON DESIGN 의 '결제 UI' 탭): 상태별 미리보기
//  · QA 러너: 팀의 UI 선택 + 코드 수정 상태로 5개 테스트를 시뮬레이션
//  · TICKET ON 결제 확인 화면의 TASK-004 동작 (tryPay4 / result4HTML)
// =====================================================================

const T4 = () => G.state.task4;
const AK4 = () => (typeof TASK4_ANSWERS !== "undefined" ? TASK4_ANSWERS : (G.state.answers && G.state.answers.task4) || null);
const pLocal = { diff: false, selReq: null, uiState: "A", uiReviewed: {} };

// ---------- 현재 팀/공식 상태 ----------
function task4Active() { const t = T4(); return !!t.assigned; }
function payMode() {
  if (!task4Active()) return "legacy";
  if (G.live) { const p = (typeof Live !== "undefined" && Live.public) || {}; if (p.officialService && p.officialService.payFixed) return "official"; }
  else if (T4().done) return "official";
  return "team";
}
function currentPayUi() {
  const mode = payMode();
  if (mode === "official") {
    if (G.live) { const p = Live.public || {}; return (p.officialService && p.officialService.payUi) || bestUi(); }
    return T4().uiApplied ? T4().ui : bestUi();
  }
  return T4().uiApplied && T4().ui ? T4().ui : { ...TASK4.defaultUi };
}
function bestUi() { return { btnLabel: "amount", processing: "spinner", lock: "disabled", success: "detail", fail: "reasonHelp", retry: "retryHelp", pending: "waitCheck" }; }
function currentPayCode() {
  const mode = payMode();
  if (mode === "official") return { client: true, server: true, branch: true, pending: true, awaitOk: true };
  const f = T4().codeFlags;
  return f ? { ...f } : { client: false, server: false, branch: false, pending: false, awaitOk: true };
}

// =====================================================================
//  가상 결제 처리 엔진
// =====================================================================
const PayEngine = {
  store() { const t = T4(); if (!t.engine) t.engine = { byKey: {}, lastByAttempt: {} }; return t.engine; },
  send(opts) {
    const t = T4(); const eng = PayEngine.store();
    const no = (t.reqSeq || 0) + 1; t.reqSeq = no;
    const req = { no, id: `req-${no}`, time: fmtMinutes(nowMinutes()), ts: Date.now(), scenario: opts.scenario, path: "POST /api/payments",
      body: { orderId: opts.orderId, amount: opts.amount, seats: opts.seats, attemptKey: opts.attemptKey, idempotencyKey: opts.idempotencyKey || null },
      status: null, result: "PENDING", reason: null, latency: null, idempotent: false, charged: false, shown: null };
    t.requests.push(req); if (t.requests.length > 40) t.requests.shift();
    let latency, status, result, reason, idempotent = false, charged = false;
    const key = opts.idempotencyKey;
    if (key && eng.byKey[key]) { const prev = eng.byKey[key]; latency = 300; status = 200; result = prev.result; reason = prev.reason; idempotent = true; }
    else {
      const last = eng.lastByAttempt[opts.attemptKey];
      if (!key && last && Date.now() - last < 500) { latency = 1200; status = 409; result = "DUPLICATE"; reason = "DUPLICATE_REQUEST"; }
      else if (opts.scenario === "B") { latency = 1200; status = 200; result = "DECLINED"; reason = "CARD_DECLINED"; }
      else if (opts.scenario === "T") { latency = 1500; status = 0; result = "TIMEOUT"; reason = "NETWORK_TIMEOUT"; }
      else { latency = opts.scenario === "A" ? 3000 : 1500; status = 200; result = "SUCCESS"; charged = true; }
      if (key && result !== "DUPLICATE") eng.byKey[key] = { result, reason };
    }
    eng.lastByAttempt[opts.attemptKey] = Date.now();
    G.save();
    return new Promise((resolve) => setTimeout(() => {
      Object.assign(req, { status, result, reason, latency, idempotent, charged });
      G.save();
      resolve({ ok: result === "SUCCESS", status: result, httpStatus: status, reason, idempotent, charged, requestNo: no });
    }, latency));
  },
  chargesFor(attemptKey) { return T4().requests.filter((r) => r.body.attemptKey === attemptKey && r.charged).length; },
};

// ---------- 시뮬레이션 (QA·개발자 도구 테스트용, 타이머 없음) ----------
function simulatePay({ code, ui, scenario, clicks }) {
  const log = [];
  const guard = code.client || (ui && ui.lock !== "none");
  let requests = 0, charges = 0, firstResult = null; const byKey = {}; let lastTs = -9999;
  const key = code.server ? "idem-1" : null;
  clicks.forEach((ts, i) => {
    if (i > 0 && guard) { log.push(`클릭 #${i + 1} (${ts}ms) → 처리 중이라 무시 (${code.client ? "isProcessing 가드" : "버튼 비활성화"})`); return; }
    requests++;
    let result;
    if (key && byKey[key]) { result = byKey[key]; log.push(`요청 #${requests} (${ts}ms) → 200 · 같은 idempotencyKey → 저장된 결과 ${result} 반환 (추가 처리 없음)`); }
    else if (!key && ts - lastTs < 500) { result = "DUPLICATE"; log.push(`요청 #${requests} (${ts}ms) → 409 DUPLICATE (0.5초 내 재요청, 임시 방어)`); }
    else { result = scenario === "B" ? "DECLINED" : scenario === "T" ? "TIMEOUT" : "SUCCESS"; if (result === "SUCCESS") charges++; if (key) byKey[key] = result; log.push(`요청 #${requests} (${ts}ms) → ${scenario === "T" ? "응답 없음 (timeout)" : "200"} · ${result}${result === "SUCCESS" ? " · 청구 +1" : ""}`); }
    lastTs = ts;
    if (firstResult === null) firstResult = result;
  });
  let shown;
  if (!code.awaitOk) shown = code.branch ? "fail" : "success";
  else if (!code.branch) shown = "success";
  else if (firstResult === "SUCCESS") shown = "success";
  else if (firstResult === "DECLINED") shown = "fail";
  else shown = code.pending ? "pending" : "error";
  return { requests, charges, shown, firstResult, log };
}

// ---------- 코드 구조 분석 (실행하지 않음) ----------
function originalJs4() { return TASK4.js.join("\n"); }
function currentJs4() { const s = T4(); return s.code != null ? s.code : originalJs4(); }
function editable4() { return currentJs4().split("\n").slice(TASK4.editableFrom - 1).join("\n"); }
function fixedHead4() { return TASK4.js.slice(0, TASK4.editableFrom - 1); }
function analyzeCode4(text) {
  const t = text, r = {};
  const cnt = (re) => (t.match(re) || []).length;
  if (cnt(/\{/g) !== cnt(/\}/g)) r.error = "SyntaxError: 중괄호 { } 짝이 맞지 않습니다";
  else if (cnt(/\(/g) !== cnt(/\)/g)) r.error = "SyntaxError: 괄호 ( ) 짝이 맞지 않습니다";
  else if (!/async\s+function\s+handlePayment\s*\(/.test(t)) r.error = "ReferenceError: handlePayment 를 찾을 수 없습니다 (async function handlePayment() { … } 형태를 유지하세요)";
  r.callsRequest = /requestPayment\s*\(/.test(t);
  r.awaitOk = /await\s+requestPayment\s*\(/.test(t);
  r.guard = /if\s*\(\s*isProcessing\s*\)\s*\{?\s*return/.test(t) && /isProcessing\s*=\s*true/.test(t);
  r.guardStuck = r.guard && !/isProcessing\s*=\s*false/.test(t);
  r.guardDeclared = /(let|var)\s+isProcessing/.test(t);
  r.idem = r.callsRequest && /idempotencyKey\s*:/.test(t);
  r.idemFresh = r.idem && /(Date\.now\(\)|Math\.random\(\))/.test(t) && !/createIdempotencyKey\s*\(/.test(t);
  const succIdx = t.search(/showSuccessMessage\s*\(/);
  r.hasSuccess = succIdx >= 0;
  r.hasFailure = /showFailureMessage\s*\(/.test(t);
  const condIdx = t.search(/if\s*\(\s*(result\.ok|result\.status\s*===?\s*["']SUCCESS["']|result\.success)\s*\)/);
  const negIdx = t.search(/if\s*\(\s*(!\s*result\.ok|result\.status\s*!==?\s*["']SUCCESS["']|!\s*result\.success)\s*\)/);
  r.branch = r.hasSuccess && r.hasFailure && ((condIdx >= 0 && condIdx < succIdx) || negIdx >= 0);
  r.pending = /catch\s*\(/.test(t) && /showPendingMessage\s*\(/.test(t);
  return r;
}
function flagsFrom(a) {
  return { client: !!(a.guard && !a.guardStuck), server: !!(a.idem && !a.idemFresh), branch: !!(a.branch && a.awaitOk && !a.error), pending: !!a.pending, awaitOk: !!a.awaitOk && !a.error };
}

// ---------- 개발자 도구 테스트 ----------
function runCodeTest4() {
  const s = T4();
  const text = editable4();
  const a = analyzeCode4(text);
  const entries = []; const push = (level, text) => entries.push({ level, text });
  push("info", "▶ 테스트 실행: payment.js 로드 → 시나리오 A(단일 클릭) · C(연속 클릭) · B(실패) · T(응답 없음)");
  let flags;
  if (a.error) {
    push("error", "Uncaught " + a.error + " (payment.js)");
    flags = { client: false, server: false, branch: false, pending: false, awaitOk: false };
  } else {
    flags = flagsFrom(a);
    if (!a.callsRequest) push("error", "requestPayment() 호출이 없습니다 — 결제 요청이 전혀 나가지 않습니다");
    if (a.callsRequest && !a.awaitOk) push("warn", "requestPayment 앞에 await 가 없어 result 가 Promise 입니다 → result.ok 는 undefined");
    if (a.guard && !a.guardDeclared) push("warn", "isProcessing 변수를 선언하지 않았습니다 (let isProcessing = false;)");
    if (a.guardStuck) push("error", "isProcessing 을 true 로만 바꾸고 false 로 되돌리지 않습니다 → 두 번째 결제부터 영원히 막힘");
    if (a.idemFresh) push("error", "idempotencyKey 를 클릭마다 새로 만듭니다 (Date.now/Math.random) → 서버는 매번 다른 결제로 처리");
    const ui = currentPayUi();
    const normal = simulatePay({ code: flags, ui, scenario: "A", clicks: [0] });
    normal.log.forEach((l) => push("info", "[A 단일 클릭] " + l));
    push(normal.shown === "success" ? "ok" : "error", `[A] 화면: ${shownKo(normal.shown)} · 청구 ${normal.charges}건`);
    const rapid = simulatePay({ code: flags, ui, scenario: "C", clicks: [0, 300, 1000] });
    rapid.log.forEach((l) => push(l.includes("청구 +1") && rapid.charges > 1 ? "warn" : "info", "[C 연속 클릭] " + l));
    push(flags.client ? "ok" : "warn", `[검사 1] 클라이언트 반복 요청 ${flags.client ? "차단됨" : "차단 안 됨"} — 요청 ${rapid.requests}건`);
    push(flags.server ? "ok" : (rapid.charges > 1 ? "error" : "warn"), `[검사 2] 서버 중복 처리 방지(멱등성) ${flags.server ? "적용" : "없음"} — 청구 ${rapid.charges}건${!flags.server && rapid.charges <= 1 ? " (이번엔 임시 방어에 걸렸지만 보장되지 않음)" : ""}`);
    const fail = simulatePay({ code: flags, ui, scenario: "B", clicks: [0] });
    push(fail.shown === "fail" ? "ok" : "error", `[검사 3] 결제 실패(DECLINED) 시 화면: ${shownKo(fail.shown)} ${fail.shown === "fail" ? "" : "— 실제 결과와 다름"}`);
    const tmo = simulatePay({ code: flags, ui, scenario: "T", clicks: [0] });
    push(tmo.shown === "pending" ? "ok" : "warn", `[검사 4] 응답 없음(TIMEOUT) 시 화면: ${shownKo(tmo.shown)}${tmo.shown === "pending" ? "" : " — 결과가 불확실할 때 단정하지 않는 처리가 없음"}`);
  }
  const ok = flags.client && flags.server && flags.branch;
  push(ok ? "ok" : "error", ok ? "✔ TEST PASSED — 중복 요청 차단 · 서버 멱등성 · 결과 분기 모두 확인" : "✖ TEST FAILED — 실패한 검사의 콘솔 결과를 보고 코드를 다시 수정하세요");
  s.codeTested = true; s.testRuns = (s.testRuns || 0) + 1;
  s.testResult = { ok, flags, at: fmtMinutes(nowMinutes()), entries, analysis: { error: a.error || null } };
  s.codeFlags = flags;
  s.codeOk = ok;
  if (ok) s.fixedCode = text;
  if (s.qa) s.qa.stale = true;
  G.save();
  renderDevtool();
  toast({ title: "DAYEON DEV TOOLS", sub: ok ? "테스트 통과" : "테스트 실패", text: ok ? "세 가지 검사를 모두 통과했습니다. QA 실행과 TICKET ON 재테스트로 확인하세요." : "콘솔의 검사 결과를 확인하고 다시 수정하세요. 수정한 코드는 그대로 이 팀의 TICKET ON에 반영됩니다." });
}
function shownKo(s) { return { success: "결제 완료", fail: "결제 실패 안내", pending: "결과 확인 중 안내", error: "오류 (처리되지 않은 예외)" }[s] || s; }

// =====================================================================
//  개발자 도구 (TASK-004 변형)
// =====================================================================
function renderPayDevtool() {
  const s = T4(); const dv = G.state.devView;
  if (!s.devtoolOpened) { s.devtoolOpened = true; }
  const file = TASK4.files.find((f) => f.id === dv.file) || TASK4.files[0];
  if (file.id === "net" && !s.logViewed) { s.logViewed = true; }
  G.save();
  const modified = s.code != null && s.code !== originalJs4();
  const tr = s.testResult;
  const status = tr ? (tr.ok ? ["ok", "테스트 통과"] : ["err", "테스트 실패"]) : ["err", "검사 전"];
  const f = s.codeFlags || {};
  devAppEl.innerHTML = `
    <header class="dt-top">
      <button class="dt-back" data-pt="back">← 업무로 돌아가기</button>
      <div class="dt-brand"><span class="dt-logo">{ }</span><b>DAYEON DEV TOOLS</b><small>TICKET ON · 결제 처리 조사</small></div>
      <div class="dt-file-now">조사 중: <b>${esc(file.name)}</b>${modified ? `<span class="dt-mod">수정됨</span>` : ""}</div>
      <div class="dt-status ${status[0]}"><i></i>${status[1]}</div>
      <div class="dt-actions">
        <button class="dt-btn primary" data-pt="run">▶ 테스트 실행</button>
        <button class="dt-btn ${pLocal.diff ? "on" : ""}" data-pt="diff">수정 전/후 비교</button>
        <button class="dt-btn" data-pt="revert" ${modified ? "" : "disabled"}>원래 코드로</button>
        <button class="dt-btn" data-pt="ticket">TICKET ON 결제 테스트</button>
      </div>
    </header>
    <div class="dt-body">
      <aside class="dt-files">
        <h4>탐색기</h4>
        <div class="dt-folder">ticketon-web/checkout/</div>
        ${TASK4.files.map((fl) => `<button class="dt-file ${dv.file === fl.id ? "on" : ""}" data-pfile="${fl.id}"><span class="dt-ic ${fl.lang === "net" ? "log" : fl.lang}">${{ js: "JS", net: "⇅", doc: "¶" }[fl.lang]}</span><span>${esc(fl.name)}</span>${fl.id === "js" && modified ? "<i>●</i>" : ""}${fl.id === "net" ? `<em class="dt-cnt">${s.requests.length}</em>` : ""}</button>`).join("")}
        <p class="dt-help">payment_network.log 에는 이 팀이 TICKET ON에서 보낸 결제 요청이 기록됩니다. payment.js 의 강조된 부분은 직접 고칠 수 있고, 테스트를 통과한 코드는 이 팀의 결제 화면에 바로 반영됩니다.</p>
        <div class="dt-api"><h4>사용 가능한 API</h4>${TASK4.api.map((a) => `<div><code>${esc(a.sig)}</code><small>${esc(a.desc)}</small></div>`).join("")}</div>
      </aside>
      <main class="dt-main">
        <div class="dt-tabs"><span class="on">${esc(file.name)}</span></div>
        <div class="dt-editor">${pLocal.diff && file.id === "js" ? diff4HTML() : editor4HTML(file)}</div>
        <div class="dt-console">
          <div class="dt-console-head"><b>콘솔</b><span>클릭하면 조사 기록에 추가</span>${tr ? `<span class="dt-run">마지막 테스트 ${esc(tr.at)} · ${tr.ok ? "통과" : "실패"}</span>` : ""}</div>
          <ol class="dt-console-list">${console4Entries().map((e, i) => `<li class="${e.level}" data-pcon="${i}"><span class="lv">${{ error: "✖", warn: "▲", ok: "✔", info: "›" }[e.level]}</span><span class="tx">${esc(e.text)}</span></li>`).join("")}</ol>
        </div>
      </main>
      <aside class="dt-side">
        <section>
          <h4>조사 기록 <small>${s.clues.length}</small></h4>
          <ul class="dt-clues">${s.clues.length ? s.clues.map((c) => `<li><span class="src">${esc(c.src)}</span><code>${esc(c.text)}</code><button data-pclue-del="${c.id}" title="삭제">×</button></li>`).join("") : `<li class="empty">요청 기록·코드 줄·콘솔 메시지를 클릭해 단서를 모으세요.</li>`}</ul>
        </section>
        <section>
          <h4>수정 · 테스트 현황</h4>
          <ul class="dt-stat">
            <li class="${modified ? "ok" : ""}"><i></i>코드 수정 ${modified ? "됨" : "전"}</li>
            <li class="${tr ? (f.client ? "ok" : "bad") : ""}"><i></i>클라이언트 반복 요청 차단 ${tr ? (f.client ? "확인" : "미확인") : "-"}</li>
            <li class="${tr ? (f.server ? "ok" : "bad") : ""}"><i></i>서버 중복 처리 방지 ${tr ? (f.server ? "확인" : "미확인") : "-"}</li>
            <li class="${tr ? (f.branch ? "ok" : "bad") : ""}"><i></i>결과에 따른 분기 ${tr ? (f.branch ? "확인" : "미확인") : "-"}</li>
            <li class="${tr ? (f.pending ? "ok" : "half") : ""}"><i></i>결과 불확실 처리 ${tr ? (f.pending ? "확인" : "없음(권장)") : "-"}</li>
            <li class="${s.uiApplied ? "ok" : ""}"><i></i>결제 UI 수정안 ${s.uiApplied ? "적용" : "미적용"}</li>
            <li class="${s.qa ? (s.qa.allPass ? "ok" : "half") : ""}"><i></i>QA ${s.qa ? `${s.qa.passed}/${s.qa.total} 통과${s.qa.stale ? " (수정 후 재실행 필요)" : ""}` : "미실행"}</li>
          </ul>
          <p class="dt-help">UI 수정과 코드 수정은 따로 관리됩니다. 둘 다 되어야 QA 다섯 항목이 모두 통과합니다.</p>
          <button class="dt-btn wide" data-pt="ticket">TICKET ON 결제 테스트</button>
          <button class="dt-btn wide" data-pt="ui">결제 UI 편집기</button>
          <button class="dt-btn wide primary" data-pt="qa">QA 실행</button>
        </section>
      </aside>
    </div>`;
}
function console4Entries() {
  const s = T4();
  const base = [
    { level: "info", text: "[TICKET ON] 결제 확인 페이지 로드 · payment.js (build 2025.10.19-2)" },
    { level: "info", text: "[payment] payButton click → handlePayment()" },
  ];
  if (s.testResult) return [...base, { level: "info", text: `—— 테스트 실행 (${s.testResult.at}) ——` }, ...s.testResult.entries];
  return base;
}
function hl4(line) { return typeof hlJs === "function" ? hlJs(line) : esc(line); }
function editor4HTML(file) {
  if (file.id === "manual") return `<div class="dt-doc"><h3>결제 처리 업무 매뉴얼 <small>다연컴퍼니 개발팀 · v1</small></h3>${TASK4.manual.map((m) => `<section><h4>${esc(m.h)}</h4><p>${esc(m.p)}</p></section>`).join("")}</div>`;
  if (file.id === "cases") return `<div class="dt-doc"><h3>payment_test_cases.md <small>QA 테스트 케이스</small></h3><table class="dt-table"><thead><tr><th>#</th><th>테스트</th><th>기대 결과</th></tr></thead><tbody>${TASK4.cases.map((c, i) => `<tr><td>${i + 1}</td><td>${esc(c.name)}</td><td>${esc(c.expect)}</td></tr>`).join("")}</tbody></table><section><h4>테스트 시나리오</h4>${TASK4.scenarios.map((sc) => `<p><b>시나리오 ${sc.id} · ${esc(sc.name)}</b> — ${esc(sc.desc)}</p>`).join("")}</section><p class="dt-help">TICKET ON 결제 확인 화면의 테스트 모드 바에서 시나리오를 고르고 결제하기를 눌러 재현합니다. 업무 상세의 [QA 실행]은 현재 팀의 UI·코드 상태로 다섯 항목을 자동 검사합니다.</p></div>`;
  if (file.id === "net") return network4HTML();
  const head = fixedHead4();
  const edit = editable4();
  const rows = Math.min(TASK4.maxEditLines, Math.max(6, edit.split("\n").length + 1));
  return `<ol class="dt-code js">
    ${head.map((l, i) => `<li data-pline="${i + 1}"><span class="ln">${i + 1}</span><span class="code">${hl4(l) || "&nbsp;"}</span></li>`).join("")}
    <li class="edit"><span class="ln">${Array.from({ length: rows }, (_, i) => `<b>${TASK4.editableFrom + i}</b>`).join("")}</span><span class="code"><textarea id="pt-edit" rows="${rows}" spellcheck="false">${esc(edit)}</textarea><small class="dt-edit-tag">수정 가능 영역 · handlePayment</small></span></li>
  </ol>`;
}
function diff4HTML() {
  const o = originalJs4().split("\n"), c = currentJs4().split("\n");
  const n = Math.max(o.length, c.length);
  const col = (lines, other, label) => `<div class="dt-diff-col"><div class="dt-diff-cap">${label}</div><ol class="dt-code js">${Array.from({ length: n }, (_, i) => `<li class="${(lines[i] || "") !== (other[i] || "") ? "chg" : ""}"><span class="ln">${i + 1}</span><span class="code">${hl4(lines[i] || "") || "&nbsp;"}</span></li>`).join("")}</ol></div>`;
  return `<div class="dt-diff">${col(o, c, "수정 전 (원본)")}${col(c, o, "수정 후 (현재)")}</div>`;
}
function network4HTML() {
  const list = T4().requests;
  const sel = list.find((r) => r.id === pLocal.selReq) || list[list.length - 1];
  const resultCls = (r) => r.result === "SUCCESS" ? "ok" : r.result === "PENDING" ? "" : r.result === "DUPLICATE" ? "warn" : "bad";
  return `<div class="nt">
    <div class="nt-list">
      <div class="nt-head"><b>Network</b><span>POST /api/payments · ${list.length}건</span></div>
      ${list.length ? `<table class="nt-table"><thead><tr><th>#</th><th>시각</th><th>시나리오</th><th>HTTP</th><th>결과</th><th>키</th></tr></thead><tbody>
        ${[...list].reverse().map((r) => `<tr class="${sel && sel.id === r.id ? "sel" : ""} ${resultCls(r)}" data-preq="${r.id}"><td>#${String(r.no).padStart(3, "0")}</td><td>${esc(r.time)}</td><td>${esc(r.scenario)}</td><td>${r.status === null ? "…" : r.status === 0 ? "—" : r.status}</td><td>${esc(r.result)}${r.idempotent ? " ↺" : ""}${r.charged ? " 💳" : ""}</td><td>${r.body.idempotencyKey ? "idem" : "-"}</td></tr>`).join("")}
      </tbody></table>` : `<div class="nt-empty">아직 기록이 없습니다. TICKET ON 결제 확인 화면에서 테스트 결제를 진행하면 요청이 여기에 쌓입니다.</div>`}
    </div>
    <div class="nt-detail">${sel ? `
      <div class="nt-head"><b>Request #${String(sel.no).padStart(3, "0")}</b><span>${esc(sel.time)} · 시나리오 ${esc(sel.scenario)}</span><button class="dt-btn" data-pclue-req="${sel.id}">조사 기록에 추가</button></div>
      <h5>요청</h5>
      <pre>${esc(sel.path)}
Content-Type: application/json
${esc(JSON.stringify(sel.body, null, 2))}</pre>
      <h5>응답</h5>
      <pre class="${resultCls(sel)}">${sel.status === null ? "(응답 대기 중…)" : sel.status === 0 ? "(응답 없음 — timeout " + sel.latency + "ms)" : `HTTP ${sel.status} ${sel.status === 200 ? "OK" : sel.status === 409 ? "Conflict" : ""}  ·  ${sel.latency}ms
${esc(JSON.stringify({ result: sel.result, reason: sel.reason, idempotent: sel.idempotent, charged: sel.charged, attemptKey: sel.body.attemptKey }, null, 2))}`}</pre>
      <h5>처리 결과</h5>
      <p class="nt-note">${sel.result === "SUCCESS" ? "서버가 결제를 승인하고 청구했습니다." : sel.result === "DECLINED" ? "HTTP 200 이지만 카드사가 거절했습니다 (업무상 실패)." : sel.result === "DUPLICATE" ? "0.5초 안에 같은 시도의 요청이 또 와서 서버가 임시로 거절했습니다 (409). 더 늦게 오면 막지 못합니다." : sel.result === "TIMEOUT" ? "응답이 오지 않았습니다. 처리됐는지 알 수 없습니다." : sel.idempotent ? "같은 idempotencyKey 로 저장된 결과를 그대로 돌려줬습니다 (추가 처리 없음)." : "처리 중"}${sel.shown ? ` · 화면 표시: <b>${esc(sel.shown)}</b>` : ""}</p>
      <p class="nt-note dim">같은 attemptKey = 같은 결제 시도. 이 시도의 청구 횟수: <b>${PayEngine.chargesFor(sel.body.attemptKey)}</b>건</p>` : `<div class="nt-empty">왼쪽 목록에서 요청을 선택하세요.</div>`}
    </div>
  </div>`;
}
function addClue4(src, text) {
  const s = T4();
  if (s.clues.some((c) => c.src === src && c.text === text)) { toast({ title: "DAYEON DEV TOOLS", text: "이미 조사 기록에 있는 단서입니다." }); return; }
  s.clues.push({ id: "clue-" + Date.now(), src, text: text.trim().slice(0, 200), time: fmtMinutes(nowMinutes()) });
  G.save(); renderDevtool();
}
function saveEdit4() {
  const ta = document.getElementById("pt-edit");
  if (!ta) return;
  const s = T4();
  const lines = ta.value.split("\n").slice(0, TASK4.maxEditLines);
  const next = [...fixedHead4(), ...lines].join("\n");
  if (next !== currentJs4()) {
    s.code = next === originalJs4() ? null : next;
    if (s.codeOk && s.fixedCode !== lines.join("\n")) { s.codeOk = false; s.codeFlags = null; if (s.qa) s.qa.stale = true; }
    G.save();
  }
}
devAppEl.addEventListener("click", (e) => {
  if (!(T4().started && !T4().done) && G.state.devView.set !== 4) return;
  const t = (sel) => e.target.closest(sel);
  const pt = t("[data-pt]");
  if (pt) {
    const a = pt.dataset.pt;
    if (a === "back") { showApp("task"); return; }
    if (a === "run") { saveEdit4(); runCodeTest4(); return; }
    if (a === "diff") { saveEdit4(); pLocal.diff = !pLocal.diff; if (pLocal.diff) G.state.devView.file = "js"; renderDevtool(); return; }
    if (a === "revert") { const s = T4(); s.code = null; s.codeOk = false; s.codeFlags = null; s.testResult = null; s.codeTested = false; G.save(); renderDevtool(); toast({ title: "DAYEON DEV TOOLS", text: "원래 코드로 되돌렸습니다. (테스트 결과 초기화)" }); return; }
    if (a === "ticket") { saveEdit4(); showApp("ticket"); G.state.ticketScreen = "checkout"; if (!TU().seats.length) { TU().seats = ["C3"]; } renderTicket(); return; }
    if (a === "ui") { saveEdit4(); openDesign("pay"); return; }
    if (a === "qa") { saveEdit4(); G.state.taskView = { view: "qa", taskNo: 4 }; showApp("task"); return; }
    return;
  }
  const f = t("[data-pfile]");
  if (f) { saveEdit4(); G.state.devView.file = f.dataset.pfile; pLocal.diff = false; G.save(); renderDevtool(); return; }
  const del = t("[data-pclue-del]");
  if (del) { T4().clues = T4().clues.filter((c) => c.id !== del.dataset.pclueDel); G.save(); renderDevtool(); return; }
  const con = t("[data-pcon]");
  if (con) { const en = console4Entries()[Number(con.dataset.pcon)]; addClue4("console", en.text); return; }
  const rq = t("[data-pclue-req]");
  if (rq) { const r = T4().requests.find((x) => x.id === rq.dataset.pclueReq); if (r) addClue4(`network · Request #${String(r.no).padStart(3, "0")}`, `${r.path} → ${r.status === 0 ? "timeout" : r.status} ${r.result}${r.reason ? " (" + r.reason + ")" : ""}${r.body.idempotencyKey ? " · idemKey" : " · 키 없음"} · attempt ${r.body.attemptKey}`); return; }
  const row = t("[data-preq]");
  if (row) { pLocal.selReq = row.dataset.preq; renderDevtool(); return; }
  const line = t("[data-pline]");
  if (line) { const text = line.querySelector(".code").textContent; if (text.trim()) addClue4("payment.js:" + line.dataset.pline, text); return; }
});
devAppEl.addEventListener("input", (e) => { if (e.target.id === "pt-edit") saveEdit4(); });

// =====================================================================
//  결제 UI 편집기 (DAYEON DESIGN 의 '결제 UI' 탭)
// =====================================================================
function currentUiDraft() { const s = T4(); if (!s.ui) s.ui = { ...TASK4.defaultUi }; return s.ui; }
function uiStates() { return [["A", "A · 결제 진행 전"], ["B", "B · 결제 처리 중"], ["C", "C · 결제 완료"], ["F", "C · 결제 실패"], ["P", "C · 결과 확인 필요"]]; }
function payUiTabHTML() {
  const s = T4(); const d = currentUiDraft(); const ak = AK4();
  const reviewed = s.uiReviewed || {};
  const left = `<aside class="d-left edit">
    <div class="d-sec"><h4>미리보기 상태</h4><div class="d-seg vert">${uiStates().map(([k, l]) => `<button class="${pLocal.uiState === k ? "on" : ""}" data-pu-state="${k}">${l}</button>`).join("")}</div></div>
    ${TASK4.ui.map((o) => `<div class="d-sec opt ${reviewed[o.id] ? "done" : ""}"><h4>${esc(o.title)} <small>상태 ${o.state}</small></h4>${o.choices.map((c) => `<label class="d-choice ${d[o.id] === c.id ? "on" : ""}"><input type="radio" name="pu-${o.id}" value="${c.id}" data-pu-opt="${o.id}" ${d[o.id] === c.id ? "checked" : ""}><span>${esc(c.label)}</span></label>`).join("")}</div>`).join("")}
  </aside>`;
  const results = TASK4.ui.map((o) => {
    const c = o.choices.find((x) => x.id === d[o.id]);
    const v = ak && ak.ui && ak.ui[o.id] && ak.ui[o.id][d[o.id]];
    return `<li class="d-res ${reviewed[o.id] ? "done" : ""}"><div class="d-res-top"><b>${esc(o.title)}</b>${reviewed[o.id] ? `<span class="d-st ok">검토</span>` : `<span class="d-st wait">미검토</span>`}</div>${c ? `<div class="d-res-choice">${v ? `<span class="d-v ${v.verdict}">${esc(v.verdict)}</span>` : ""}${esc(c.label)}</div>${v ? `<div class="d-res-why">${esc(v.why)}</div>` : `<div class="d-res-why dim">왜 이 선택이 사용자에게 도움이 되는지 팀에서 이야기해 보세요. 평가는 교사 해설 공개 후 표시됩니다.</div>`}` : ""}</li>`;
  }).join("");
  const nRev = TASK4.ui.filter((o) => reviewed[o.id]).length;
  return `${left}
    <main class="d-center"><div class="d-single"><div class="d-cap">결제 확인 화면 미리보기 · ${uiStates().find(([k]) => k === pLocal.uiState)[1]}</div>${payPreviewHTML(d, pLocal.uiState)}</div>
      <div class="d-compare" style="margin-top:16px"><div><div class="d-cap">현재 운영 (수정 전) · 같은 상태</div>${payPreviewHTML(TASK4.defaultUi, pLocal.uiState)}</div><div class="d-intro"><h3>디자인만 고치면 끝일까요?</h3><p>처리 중 버튼을 비활성화하면 반복 클릭은 줄지만, 새로고침이나 느린 네트워크에서는 같은 결제가 또 갈 수 있습니다. UI 적용 상태와 코드 수정 상태는 따로 관리되며 QA에서 각각 검사합니다.</p></div></div>
    </main>
    <aside class="d-right">
      <div class="d-right-head"><h3>적용 결과</h3><span>${nRev}/${TASK4.ui.length} 검토</span></div>
      <p class="d-tip">왼쪽에서 옵션을 바꾸면 미리보기가 바로 바뀝니다. 상태 버튼으로 진행 전·처리 중·완료·실패·확인 필요 화면을 확인하세요.</p>
      <ol class="d-results">${results}</ol>
      <div class="d-right-foot">
        ${s.uiApplied ? `<div class="d-done">UI 수정안이 이 팀의 TICKET ON 결제 화면에 적용되었습니다.${s.codeOk ? "" : " 코드 수정이 아직 없으면 중복 요청·결과 오류는 남아 있습니다."}</div><button class="d-cta secondary" data-pu="apply">수정안 다시 적용</button>` : `<button class="d-cta" data-pu="apply" ${nRev === TASK4.ui.length ? "" : "disabled"}>UI 수정안 적용</button><p class="d-tip">7개 항목을 모두 검토하면 활성화됩니다. 적용하면 이 팀의 TICKET ON 결제 화면이 바뀝니다(공식 반영은 교사가 결정).</p>`}
        <button class="d-cta secondary" data-pu="ticket">TICKET ON 결제 테스트</button>
      </div>
    </aside>`;
}
function payPreviewHTML(ui, state) {
  const total = "244,000원";
  const label = { amount: `${total} 결제하기`, pay: "결제하기", ok: "확인", go: "결제 진행" }[ui.btnLabel] || "결제하기";
  let btn = `<button class="pp-btn">${esc(label)}</button>`;
  let extra = "";
  if (state === "B") {
    const txt = ui.processing === "none" ? label : "처리 중…";
    const spin = ui.processing === "spinner" || ui.processing === "overlay" ? `<i class="pp-spin"></i>` : "";
    const dis = ui.lock === "disabled" ? "disabled" : "";
    btn = ui.lock === "hidden" ? `<div class="pp-hidden">(버튼 숨김) ${spin}${esc(txt)}</div>` : `<button class="pp-btn ${dis ? "dis" : ""}" ${dis}>${spin}${esc(txt)}</button>`;
    if (ui.processing === "overlay") extra = `<div class="pp-overlay"><i class="pp-spin big"></i><b>결제를 처리하고 있습니다</b><small>잠시만 기다려 주세요. 화면을 닫거나 새로고침하지 마세요.</small></div>`;
  }
  let body = `
    <div class="pp-sum"><span>공연</span><b>뮤지컬 〈라스트 트레인〉</b></div>
    <div class="pp-sum"><span>좌석</span><b>C3 (R)</b></div>
    <div class="pp-sum total"><span>총 결제금액</span><b>${total}</b></div>
    <label class="pp-terms">☑ [필수] 구매조건 확인 및 결제진행 동의</label>
    ${btn}<button class="pp-ghost">이전</button>`;
  if (state === "C") {
    body = ui.success === "detail" ? `<div class="pp-res ok"><div class="pp-ic ok">✓</div><b>결제가 완료되었습니다</b><div class="pp-rc"><div><span>예매번호</span><b>T2510-4821</b></div><div><span>좌석</span><b>C3 (R)</b></div><div><span>결제금액</span><b>${total}</b></div></div><button class="pp-btn">예매 내역 확인</button><button class="pp-ghost">홈으로</button></div>`
      : ui.success === "modal" ? `<div class="pp-res"><div class="pp-modal"><b>완료</b><p>결제가 완료되었습니다.</p><button class="pp-btn">홈으로</button></div></div>`
      : `<div class="pp-res"><b>결제 완료</b></div>`;
  }
  if (state === "F") {
    const reason = ui.fail !== "none";
    body = ui.fail === "none" ? `<div class="pp-res"><b>결제 완료</b><small class="pp-warn">(실제로는 실패했지만 완료처럼 표시됨)</small></div>`
      : `<div class="pp-res fail"><div class="pp-ic bad">!</div><b>결제가 완료되지 않았습니다</b>${reason ? `<p class="pp-reason">사유: 카드사 승인 거절 (CARD_DECLINED)</p>` : ""}${ui.fail === "reasonHelp" ? `<p class="pp-help">다른 카드로 시도하거나 카드 한도·유효기간을 확인해 주세요. 결제된 금액은 없습니다.</p>` : ""}${ui.retry === "retry" ? `<button class="pp-btn">다시 시도</button>` : ui.retry === "retryHelp" ? `<button class="pp-btn">다시 시도</button><button class="pp-ghost">결제수단 변경</button><small class="pp-cs">문제가 계속되면 고객센터 1588-0000</small>` : ""}</div>`;
  }
  if (state === "P") {
    body = ui.pending === "none" ? `<div class="pp-res"><b>결제 완료</b><small class="pp-warn">(응답이 없었는데 완료처럼 표시됨)</small></div>`
      : `<div class="pp-res wait"><div class="pp-ic wait">⏳</div><b>결제 결과를 확인하고 있습니다</b><p class="pp-help">응답이 지연되고 있습니다. 잠시 후 예매 내역에서 확인해 주세요.</p>${ui.pending === "waitCheck" ? `<button class="pp-btn">결제 상태 조회</button><small class="pp-cs">같은 결제를 다시 시도하면 중복 결제가 될 수 있습니다.</small>` : ""}</div>`;
  }
  return `<div class="pp"><div class="pp-chrome"><span></span><span></span><span></span><i>ticketon.test/checkout</i></div><div class="pp-screen">${extra}<div class="pp-panel"><b class="pp-title">${state === "A" || state === "B" ? "결제 금액" : "결제 결과"}</b>${body}</div></div></div>`;
}
designAppEl.addEventListener("click", (e) => {
  const st = e.target.closest("[data-pu-state]");
  if (st) { pLocal.uiState = st.dataset.puState; renderDesign(); return; }
  const pu = e.target.closest("[data-pu]");
  if (!pu) return;
  if (pu.dataset.pu === "apply") {
    const s = T4(); s.uiApplied = true; s.uiAppliedAt = fmtMinutes(nowMinutes()); if (s.qa) s.qa.stale = true; G.save(); renderDesign();
    toast({ title: "DAYEON DESIGN", sub: "UI 수정안 적용", text: "이 팀의 TICKET ON 결제 화면에 반영되었습니다. 코드 수정 여부와는 별개이니 QA로 확인하세요.", app: "ticket" });
  }
  if (pu.dataset.pu === "ticket") { showApp("ticket"); G.state.ticketScreen = "checkout"; if (!TU().seats.length) TU().seats = ["C3"]; renderTicket(); }
});
designAppEl.addEventListener("change", (e) => {
  const o = e.target.closest("[data-pu-opt]");
  if (!o) return;
  const s = T4(); const d = currentUiDraft();
  d[o.dataset.puOpt] = o.value;
  s.uiReviewed = s.uiReviewed || {}; s.uiReviewed[o.dataset.puOpt] = true;
  if (s.uiApplied) { s.uiApplied = false; }   // 바꾸면 다시 적용해야 TICKET ON 에 반영
  G.save(); renderDesign();
});

// =====================================================================
//  QA 러너
// =====================================================================
function runQA() {
  const s = T4();
  const code = currentPayCode(); const ui = currentPayUi();
  const uiOn = s.uiApplied;
  const tests = [];
  const normal = simulatePay({ code, ui, scenario: "A", clicks: [0] });
  tests.push({ id: "normal", name: "정상 결제", pass: normal.shown === "success" && normal.charges === 1, detail: `화면: ${shownKo(normal.shown)} · 청구 ${normal.charges}건`, hint: "결제 코드의 결과 처리와 requestPayment 호출을 다시 확인하세요." });
  const rapid = simulatePay({ code, ui, scenario: "C", clicks: [0, 300, 1000] });
  tests.push({ id: "rapid", name: "빠른 연속 클릭", pass: code.server && rapid.charges === 1, detail: `요청 ${rapid.requests}건 · 청구 ${rapid.charges}건${code.client ? " · 클라이언트 차단" : ""}${code.server ? " · 서버 멱등성" : ""}`, hint: "요청 로그에서 같은 시도의 요청과 청구 횟수를 비교하고, 서버가 같은 시도를 어떻게 구분하는지 매뉴얼 4장을 보세요." });
  tests.push({ id: "slow", name: "응답 지연", pass: uiOn && ui.processing !== "none" && (ui.lock !== "none" || code.client), detail: `처리 중 안내: ${uiOn ? ui.processing : "미적용"} · 버튼: ${uiOn ? ui.lock : "미적용"}`, hint: "결제 처리 중 화면에서 사용자가 무엇을 보고 무엇을 할 수 있는지 UI 편집기의 B 상태를 확인하세요." });
  const fail = simulatePay({ code, ui, scenario: "B", clicks: [0] });
  tests.push({ id: "fail", name: "결제 실패", pass: fail.shown === "fail" && uiOn && ui.fail !== "none" && ui.retry !== "none", detail: `화면: ${shownKo(fail.shown)} · 실패 안내: ${uiOn ? ui.fail : "미적용"} · 재시도: ${uiOn ? ui.retry : "미적용"}`, hint: "서버 응답의 result 와 화면 안내가 일치하는지, 실패했을 때 사용자가 다음에 할 수 있는 일이 있는지 확인하세요." });
  tests.push({ id: "mypage", name: "예매 내역 확인", pass: code.branch && code.awaitOk && fail.shown !== "success", detail: code.branch ? "성공한 결제만 예매 내역에 반영" : "실패한 결제도 완료로 안내됨", hint: "결제 실패 시나리오 후 마이페이지 예매 내역과 결제 결과 화면을 비교하세요." });
  const passed = tests.filter((t) => t.pass).length;
  s.qa = { at: fmtMinutes(nowMinutes()), tests, passed, total: tests.length, allPass: passed === tests.length, stale: false, runs: (s.qa ? s.qa.runs || 0 : 0) + 1 };
  G.save();
  return s.qa;
}
