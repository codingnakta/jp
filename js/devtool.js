// =====================================================================
//  DAYEON DEV TOOLS — TASK-003 프런트엔드 디버깅 도구
//  · 왼쪽 파일 탐색기 / 가운데 코드 에디터(줄 번호·구문 강조) / 아래 콘솔 / 오른쪽 조사 기록·테스트 현황
//  · reservation.js 의 1~2행(요소 선택)만 직접 수정 가능. 학생 코드는 실행하지 않고(eval 없음)
//    선택자 문자열을 가상 DOM(TASK3.dom)에 대조해 결과를 시뮬레이션한다.
//  · 테스트 통과(codeFixed) 여부는 팀 테스트 환경(TICKET ON)의 예매 버튼 동작에 바로 반영된다.
// =====================================================================

const T3 = () => G.state.task3;
// devAppEl 은 task.js 에서 선언됨
const dLocal3 = { diff: false };

const ORIGINAL_JS = () => TASK3.js.join("\n");
function currentJs() {
  const s = T3();
  return s.code != null ? s.code : ORIGINAL_JS();
}
function editableText() { return currentJs().split("\n").slice(0, TASK3.editableLines.length).join("\n"); }
function restLines() { return ORIGINAL_JS().split("\n").slice(TASK3.editableLines.length); }

// ---------- 구문 강조 (간단 규칙) ----------
function hlJs(line) {
  let out = esc(line);
  out = out.replace(/(\/\/.*)$/, '<i class="c">$1</i>');
  out = out.replace(/(&quot;[^&]*?&quot;|'[^']*'|`[^`]*`)/g, '<b class="s">$1</b>');
  out = out.replace(/\b(const|let|var|function|return|document|location|window|null|true|false)\b/g, '<b class="k">$1</b>');
  out = out.replace(/\b(getElementById|querySelector|querySelectorAll|addEventListener|goToSeatSelection)\b/g, '<b class="f">$1</b>');
  return out;
}
function hlHtml(line) {
  let out = esc(line);
  out = out.replace(/(&lt;!--.*?--&gt;)/g, '<i class="c">$1</i>');
  out = out.replace(/(&lt;\/?)([a-zA-Z0-9]+)/g, '$1<b class="t">$2</b>');
  out = out.replace(/\s([a-zA-Z-]+)=(&quot;[^&]*?&quot;)/g, ' <b class="a">$1</b>=<b class="s">$2</b>');
  return out;
}

// ---------- 선택자 해석 (가상 DOM) ----------
function matchSimple(sel, el) {
  // tag#id.cls.cls / [id="x"] 정도만 지원
  sel = sel.trim();
  if (!sel) return false;
  const attr = sel.match(/^([a-zA-Z0-9]*)\[\s*id\s*=\s*["']?([^"'\]]+)["']?\s*\]$/);
  if (attr) return (!attr[1] || attr[1].toLowerCase() === el.tag) && el.id === attr[2];
  const m = sel.match(/^([a-zA-Z0-9]*)(#[A-Za-z0-9_-]+)?((?:\.[A-Za-z0-9_-]+)*)$/);
  if (!m) return null;   // 지원하지 않는 선택자
  const tag = m[1] ? m[1].toLowerCase() : "";
  const id = m[2] ? m[2].slice(1) : "";
  const classes = m[3] ? m[3].split(".").filter(Boolean) : [];
  if (tag && el.tag !== tag) return false;
  if (id && el.id !== id) return false;
  return classes.every((c) => el.classes.includes(c));
}
function resolveSelector(parsed) {
  if (parsed.kind === "id") return { kind: "el", el: TASK3.dom.find((e) => e.id === parsed.value) || null };
  if (parsed.kind === "class") { const list = TASK3.dom.filter((e) => e.classes.includes(parsed.value)); return { kind: "collection", list }; }
  if (parsed.kind === "qs") {
    const parts = parsed.value.split(",").map((x) => x.trim());
    let bad = false;
    const hits = TASK3.dom.filter((e) => parts.some((p) => { const r = matchSimple(p, e); if (r === null) bad = true; return r === true; }));
    if (bad) return { kind: "syntax", msg: `SyntaxError: '${parsed.value}' is not a valid selector (이 도구는 tag, #id, .class, [id=...] 형태만 지원합니다)` };
    if (parsed.all) return { kind: "collection", list: hits };
    return { kind: "el", el: hits[0] || null };
  }
  return { kind: "none" };
}
function parseCode(text) {
  const t = text.replace(/\s+/g, " ").trim();
  const result = { declares: /(const|let|var)\s+reserveButton\s*=/.test(t) };
  const opens = (t.match(/\(/g) || []).length, closes = (t.match(/\)/g) || []).length;
  if (opens !== closes) return { ...result, error: "SyntaxError: missing ) — 괄호 짝이 맞지 않습니다" };
  const q = (t.match(/["'`]/g) || []).length;
  if (q % 2) return { ...result, error: "SyntaxError: Invalid or unexpected token — 따옴표 짝이 맞지 않습니다" };
  let m;
  if ((m = t.match(/getElementById\(\s*(["'`])([^"'`]*)\1\s*\)/))) return { ...result, kind: "id", value: m[2], call: `getElementById("${m[2]}")` };
  if ((m = t.match(/querySelector(All)?\(\s*(["'`])([^"'`]*)\2\s*\)/))) return { ...result, kind: "qs", all: !!m[1], value: m[3], call: `querySelector${m[1] || ""}("${m[3]}")` };
  if ((m = t.match(/getElementsByClassName\(\s*(["'`])([^"'`]*)\1\s*\)/))) return { ...result, kind: "class", value: m[2], call: `getElementsByClassName("${m[2]}")` };
  if (/document\.\w+\(/.test(t)) return { ...result, error: "TypeError: document." + t.match(/document\.(\w+)\(/)[1] + " is not a function — 이 도구가 아는 메서드는 getElementById, querySelector, querySelectorAll, getElementsByClassName 입니다" };
  return { ...result, error: "ReferenceError: 요소를 선택하는 코드를 찾을 수 없습니다 (document.getElementById(...) 또는 document.querySelector(...) 형태)" };
}
function elStr(el) { return `<${el.tag}${el.id ? ` id="${el.id}"` : ""}${el.classes.length ? ` class="${el.classes.join(" ")}"` : ""}>`; }

// ---------- 테스트 실행 ----------
function runCodeTest() {
  const s = T3();
  const text = editableText();
  const entries = [];
  const push = (level, text, at) => entries.push({ level, text, at });
  let ok = false, summary = "";
  const parsed = parseCode(text);
  push("info", "▶ 테스트 실행: reservation.js 로드 → 요소 선택 → 이벤트 등록 → 예매하기 클릭 시뮬레이션");
  if (parsed.error) {
    push("error", parsed.error, "reservation.js:2");
    summary = "코드 해석 실패";
  } else if (!parsed.declares) {
    push("error", "Uncaught ReferenceError: reserveButton is not defined", "reservation.js:4");
    summary = "변수 이름이 달라져 4행에서 reserveButton 을 찾을 수 없음";
  } else {
    const r = resolveSelector(parsed);
    if (r.kind === "syntax") {
      push("error", "Uncaught " + r.msg, "reservation.js:2");
      summary = "선택자 문법 오류";
    } else if (r.kind === "collection") {
      push("info", `document.${parsed.call} → ${r.list.length}개 요소 목록 (NodeList/HTMLCollection)`);
      push("error", "Uncaught TypeError: reserveButton.addEventListener is not a function", "reservation.js:4");
      summary = "요소 '목록'에는 addEventListener 가 없음 (요소 하나를 선택해야 함)";
    } else if (!r.el) {
      push("info", `document.${parsed.call} → null (일치하는 요소 없음)`);
      push("error", "Uncaught TypeError: Cannot read properties of null (reading 'addEventListener')", "reservation.js:4");
      summary = "요소를 찾지 못함 → 이벤트 등록 실패";
    } else if (r.el.id === TASK3.target) {
      push("info", `document.${parsed.call} → ${elStr(r.el)}`);
      push("ok", "click 리스너 등록 완료 → reserveBtn (리스너 1개)");
      push("ok", "예매하기 클릭 시뮬레이션 → goToSeatSelection() 호출 → location.href = \"/seats?show=last-train\" ✓");
      if (parsed.kind !== "id" && !/#reserveBtn/.test(parsed.value) && !/\bid=/.test(parsed.value)) push("warn", `참고: '${parsed.value}' 는 문서 순서상 첫 번째로 일치한 요소에 의존합니다. 버튼이 추가되면 다른 요소가 잡힐 수 있어 id 선택을 권장합니다.`);
      ok = true;
      summary = "테스트 통과";
    } else {
      push("info", `document.${parsed.call} → ${elStr(r.el)}`);
      push("warn", `click 리스너가 ${elStr(r.el)} 에 등록됨`);
      push("error", "예매하기 클릭 시뮬레이션 → 반응 없음 (reserveBtn 에 리스너가 없음)");
      summary = "다른 요소에 이벤트가 연결됨";
    }
  }
  push(ok ? "ok" : "error", ok ? "✔ TEST PASSED — 예매 버튼 이벤트 연결 정상" : `✖ TEST FAILED — ${summary}`);
  s.codeTested = true;
  s.testResult = { ok, summary, selector: parsed.call || null, at: fmtMinutes(nowMinutes()), entries };
  s.testRuns = (s.testRuns || 0) + 1;
  const wasFixed = s.codeFixed;
  s.codeFixed = ok;
  if (ok && !wasFixed) s.retest = { count: 0, passes: 0 };   // 새로 고친 뒤에는 재테스트를 다시
  if (ok) s.fixedCode = text;
  G.save();
  renderDevtool();
  toast({ title: "DAYEON DEV TOOLS", sub: ok ? "테스트 통과" : "테스트 실패", text: ok ? "이벤트 연결이 정상입니다. 이제 TICKET ON에서 실제로 재테스트하세요." : summary + ". 콘솔 결과를 보고 코드를 다시 수정하세요." });
}

// ---------- 렌더 ----------
function devSet() { const t4 = G.state.task4; return (t4.started && !t4.done) || G.state.devView.set === 4 ? 4 : 3; }
function renderDevtool() {
  if (devSet() === 4 && typeof renderPayDevtool === "function") return renderPayDevtool();
  const s = T3();
  const dv = G.state.devView;
  if (!s.devtoolOpened) { s.devtoolOpened = true; G.save(); }
  const file = TASK3.files.find((f) => f.id === dv.file) || TASK3.files[2];
  const status = s.testResult ? (s.testResult.ok ? ["ok", "테스트 통과"] : ["err", "테스트 실패"]) : ["err", "오류 1건"];
  const modified = s.code != null && s.code !== ORIGINAL_JS();
  devAppEl.innerHTML = `
    <header class="dt-top">
      <button class="dt-back" data-dt="back">← 업무로 돌아가기</button>
      <div class="dt-brand"><span class="dt-logo">{ }</span><b>DAYEON DEV TOOLS</b><small>TICKET ON · 프런트엔드 조사</small></div>
      <div class="dt-file-now">조사 중: <b>${esc(file.name)}</b>${modified ? `<span class="dt-mod">수정됨</span>` : ""}</div>
      <div class="dt-status ${status[0]}"><i></i>${status[1]}</div>
      <div class="dt-actions">
        <button class="dt-btn primary" data-dt="run">▶ 테스트 실행</button>
        <button class="dt-btn ${dLocal3.diff ? "on" : ""}" data-dt="diff">수정 전/후 비교</button>
        <button class="dt-btn" data-dt="revert" ${modified ? "" : "disabled"}>원래 코드로</button>
        <button class="dt-btn" data-dt="ticket">TICKET ON에서 재테스트</button>
      </div>
    </header>
    <div class="dt-body">
      <aside class="dt-files">
        <h4>탐색기</h4>
        <div class="dt-folder">ticketon-web/</div>
        ${TASK3.files.map((f) => `<button class="dt-file ${dv.file === f.id ? "on" : ""}" data-file="${f.id}"><span class="dt-ic ${f.lang}">${{ html: "<>", js: "JS", log: "≡", doc: "¶" }[f.lang]}</span><span>${esc(f.name)}</span>${f.id === "js" && modified ? "<i>●</i>" : ""}</button>`).join("")}
        <p class="dt-help">파일을 열어 코드를 읽고, 의심되는 줄이나 콘솔 메시지를 클릭하면 오른쪽 조사 기록에 담깁니다. reservation.js 의 강조된 부분은 직접 고칠 수 있습니다.</p>
      </aside>
      <main class="dt-main">
        <div class="dt-tabs"><span class="on">${esc(file.name)}</span></div>
        <div class="dt-editor">${dLocal3.diff && file.id === "js" ? diffHTML() : editorHTML(file)}</div>
        <div class="dt-console">
          <div class="dt-console-head"><b>콘솔</b><span>클릭하면 조사 기록에 추가</span>${s.testResult ? `<span class="dt-run">마지막 테스트 ${esc(s.testResult.at)} · ${s.testResult.ok ? "통과" : "실패"}</span>` : ""}</div>
          <ol class="dt-console-list">${consoleEntries().map((e, i) => `<li class="${e.level}" data-con="${i}"><span class="lv">${{ error: "✖", warn: "▲", ok: "✔", info: "›" }[e.level]}</span><span class="tx">${esc(e.text)}</span>${e.at ? `<span class="at">${esc(e.at)}</span>` : ""}</li>`).join("")}</ol>
        </div>
      </main>
      <aside class="dt-side">
        <section>
          <h4>조사 기록 <small>${s.clues.length}</small></h4>
          <ul class="dt-clues">${s.clues.length ? s.clues.map((c) => `<li><span class="src">${esc(c.src)}</span><code>${esc(c.text)}</code><button data-clue-del="${c.id}" title="삭제">×</button></li>`).join("") : `<li class="empty">코드 줄이나 콘솔 메시지를 클릭해 단서를 모으세요.</li>`}</ul>
        </section>
        <section>
          <h4>수정 · 테스트 현황</h4>
          <ul class="dt-stat">
            <li class="${modified ? "ok" : ""}"><i></i>코드 수정 ${modified ? "됨" : "전"}</li>
            <li class="${s.codeTested ? (s.testResult.ok ? "ok" : "bad") : ""}"><i></i>테스트 ${s.codeTested ? (s.testResult.ok ? "통과" : "실패 · " + esc(s.testResult.summary)) : "미실행"}${s.testRuns ? ` <small>(${s.testRuns}회)</small>` : ""}</li>
            <li class="${s.retest.passes >= 2 ? "ok" : s.retest.passes ? "half" : ""}"><i></i>TICKET ON 재테스트 ${s.retest.passes}/2${s.retest.count > s.retest.passes ? ` <small>(실패 ${s.retest.count - s.retest.passes}회)</small>` : ""}</li>
          </ul>
          <p class="dt-help">${s.codeFixed ? "팀 테스트 환경의 TICKET ON에 수정 코드가 반영되어 있습니다. 공연 상세에서 예매하기를 두 번 이상 눌러 확인하세요." : "테스트를 통과하면 이 팀의 TICKET ON 테스트 환경에 수정 코드가 반영됩니다."}</p>
          <button class="dt-btn wide" data-dt="ticket">TICKET ON 열기</button>
          ${s.retest.passes >= 2 ? `<button class="dt-btn wide primary" data-dt="report">오류 수정 보고서 작성</button>` : ""}
        </section>
      </aside>
    </div>`;
}
function consoleEntries() {
  const s = T3();
  const base = TASK3.log.map((l) => ({ ...l }));
  if (s.testResult) return [...base, { level: "info", text: `—— 테스트 실행 (${s.testResult.at}) ——` }, ...s.testResult.entries];
  return base;
}
function editorHTML(file) {
  if (file.id === "manual") {
    return `<div class="dt-doc"><h3>프런트엔드 개발 업무 매뉴얼 <small>다연컴퍼니 개발팀 · v2</small></h3>${TASK3.manual.map((m) => `<section><h4>${esc(m.h)}</h4><p>${esc(m.p)}</p></section>`).join("")}</div>`;
  }
  if (file.id === "log") {
    return `<ol class="dt-code log">${TASK3.log.map((l, i) => `<li class="${l.level}" data-logline="${i}"><span class="ln">${i + 1}</span><span class="code">[${l.level}] ${esc(l.text)}${l.at ? ` <em>at ${esc(l.at)}</em>` : ""}</span></li>`).join("")}</ol>`;
  }
  if (file.id === "html") {
    return `<ol class="dt-code">${TASK3.html.map((l, i) => `<li data-line="html:${i + 1}"><span class="ln">${i + 1}</span><span class="code">${hlHtml(l) || "&nbsp;"}</span></li>`).join("")}</ol>`;
  }
  // reservation.js: 1~2행 편집 가능
  const edit = editableText();
  const rest = restLines();
  const n = TASK3.editableLines.length;
  return `<ol class="dt-code js">
    <li class="edit" data-editline="1"><span class="ln">${TASK3.editableLines.map((x) => `<b>${x}</b>`).join("")}</span><span class="code"><textarea id="dt-edit" rows="${n}" spellcheck="false">${esc(edit)}</textarea><small class="dt-edit-tag">수정 가능 영역 · 요소 선택</small></span></li>
    ${rest.map((l, i) => `<li data-line="js:${i + 1 + n}"><span class="ln">${i + 1 + n}</span><span class="code">${hlJs(l) || "&nbsp;"}</span></li>`).join("")}
  </ol>`;
}
function diffHTML() {
  const o = ORIGINAL_JS().split("\n"), c = currentJs().split("\n");
  const n = Math.max(o.length, c.length);
  const col = (lines, other, label) => `<div class="dt-diff-col"><div class="dt-diff-cap">${label}</div><ol class="dt-code js">${Array.from({ length: n }, (_, i) => `<li class="${(lines[i] || "") !== (other[i] || "") ? "chg" : ""}"><span class="ln">${i + 1}</span><span class="code">${hlJs(lines[i] || "") || "&nbsp;"}</span></li>`).join("")}</ol></div>`;
  return `<div class="dt-diff">${col(o, c, "수정 전 (원본)")}${col(c, o, "수정 후 (현재)")}</div>`;
}

// ---------- 조사 기록 ----------
function addClue(src, text) {
  const s = T3();
  if (s.clues.some((c) => c.src === src && c.text === text)) { toast({ title: "DAYEON DEV TOOLS", text: "이미 조사 기록에 있는 단서입니다." }); return; }
  s.clues.push({ id: "clue-" + Date.now(), src, text: text.trim().slice(0, 160), time: fmtMinutes(nowMinutes()) });
  G.save();
  renderDevtool();
}

// ---------- 이벤트 ----------
devAppEl.addEventListener("click", (e) => {
  if (devSet() === 4) return;   // TASK-004 변형은 paytool.js 가 처리
  const t = (sel) => e.target.closest(sel);
  const dt = t("[data-dt]");
  if (dt) {
    const a = dt.dataset.dt;
    if (a === "back") { showApp("task"); return; }
    if (a === "run") { saveEdit(); runCodeTest(); return; }
    if (a === "diff") { saveEdit(); dLocal3.diff = !dLocal3.diff; if (dLocal3.diff) { G.state.devView.file = "js"; } renderDevtool(); return; }
    if (a === "revert") { T3().code = null; T3().codeFixed = false; T3().testResult = null; T3().codeTested = false; G.save(); renderDevtool(); toast({ title: "DAYEON DEV TOOLS", text: "원래 코드로 되돌렸습니다. (테스트 결과 초기화)" }); return; }
    if (a === "ticket") { saveEdit(); showApp("ticket"); G.state.ticketScreen = "show"; renderTicket(); return; }
    if (a === "report") { saveEdit(); G.state.taskView = { view: "report", taskNo: 3 }; showApp("task"); return; }
    return;
  }
  const f = t("[data-file]");
  if (f) { saveEdit(); G.state.devView.file = f.dataset.file; dLocal3.diff = false; G.save(); renderDevtool(); return; }
  const del = t("[data-clue-del]");
  if (del) { T3().clues = T3().clues.filter((c) => c.id !== del.dataset.clueDel); G.save(); renderDevtool(); return; }
  const con = t("[data-con]");
  if (con) { const en = consoleEntries()[Number(con.dataset.con)]; addClue("console" + (en.at ? " · " + en.at : ""), en.text); return; }
  const ll = t("[data-logline]");
  if (ll) { const en = TASK3.log[Number(ll.dataset.logline)]; addClue("console.log:" + (Number(ll.dataset.logline) + 1), en.text + (en.at ? " at " + en.at : "")); return; }
  const line = t("[data-line]");
  if (line) {
    const [fid, no] = line.dataset.line.split(":");
    const src = (fid === "html" ? "index.html" : "reservation.js") + ":" + no;
    const text = line.querySelector(".code").textContent;
    if (text.trim()) addClue(src, text);
    return;
  }
});
devAppEl.addEventListener("input", (e) => { if (e.target.id === "dt-edit") saveEdit(false); });
function saveEdit(persist = true) {
  const ta = document.getElementById("dt-edit");
  if (!ta) return;
  const s = T3();
  const lines = ta.value.split("\n").slice(0, TASK3.editableLines.length);
  while (lines.length < TASK3.editableLines.length) lines.push("");
  const next = [...lines, ...restLines()].join("\n");
  if (next !== currentJs()) {
    s.code = next === ORIGINAL_JS() ? null : next;
    // 코드가 바뀌면 이전 테스트 결과는 무효 (팀 환경 반영도 해제)
    if (s.codeFixed && s.fixedCode !== lines.join("\n")) { s.codeFixed = false; }
    if (persist) G.save(); else G.save();
  }
}
// 에디터에서 편집 중 1~2행을 넘어가지 못하게
devAppEl.addEventListener("keydown", (e) => {
  if (e.target.id === "dt-edit" && e.key === "Enter") {
    const lines = e.target.value.split("\n").length;
    if (lines >= TASK3.editableLines.length) e.preventDefault();
  }
});

if (G.state.currentApp === "dev") renderDevtool();
