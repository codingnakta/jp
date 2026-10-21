// =====================================================================
//  TICKET ON — 공연 예매 테스트 사이트 (세 번째 앱)
//  - 상단에 DAYEON TASK 테스트 모드 바(이상 현상 기록 / 이벤트 로그 / 돌아가기)
//  - 오류는 G.state.ticketBugs 로 켜고 끔 (후속 미션에서 수정 반영용)
//      lowContrast    : 예매하기 버튼 대비가 낮아 찾기 어려움
//      payButton      : 결제하기 버튼이 동의 후에도 비활성처럼 보이고, 눌러도 반응 없음(3회째 진행)
//      resultMismatch : 서버 상태는 PENDING 인데 화면은 '결제 완료'로 안내
// =====================================================================

const SCREEN_LABEL = { show: "공연 상세", seats: "좌석 선택", checkout: "결제 확인", result: "결제 결과", mypage: "마이페이지" };
// 적용된 디자인 옵션 (TASK-002 에서 적용하기 전에는 v2 = 운영 화면)
// 수업 모드: 공식 서비스 상태(교사가 반영)만 TICKET ON 에 적용. 솔로 모드: 학생이 적용한 디자인
const design = () => (G.live
  ? ((typeof Live !== "undefined" && Live.public && Live.public.officialService && Live.public.officialService.design) || TASK2.v2)
  : (G.state.ticketDesign || TASK2.v2));
const BTN_CLS = { blue: "d-blue", outline: "d-outline", red: "d-red", gray: "d-gray" };

// ---------- TASK-003: 예매하기 버튼 이벤트 미연결 오류 ----------
//  디자인 수정이 공식 반영된 뒤(또는 TASK-003 배정 후) 활성화. CSS 가 아니라 '클릭해도 아무 일도 없음'으로 연출.
//  팀 테스트 환경: 이 팀이 개발자 도구에서 테스트를 통과하면(codeFixed) 동작. 공식: 교사가 수정 반영(reserveFixed)하면 모두 동작.
function reserveBugActive() {
  if (G.live) {
    const p = (typeof Live !== "undefined" && Live.public) || {};
    const t3 = p.tasks && p.tasks.t3 && p.tasks.t3.status;
    return !!(p.officialService && p.officialService.design) || (!!t3 && t3 !== "LOCKED");
  }
  return !!G.state.ticketDesign || !!G.state.task3.assigned;
}
function reserveWorks() {
  if (!reserveBugActive()) return true;
  // TASK-004 부터는 스토리상 예매 버튼이 고쳐진 상태 (교사가 공식 반영을 누르지 않았어도)
  if (G.state.task4 && (G.state.task4.assigned || G.state.task4.started)) return true;
  if (G.live) {
    const p = (typeof Live !== "undefined" && Live.public) || {};
    if (p.officialService && p.officialService.reserveFixed) return true;
    const t4 = p.tasks && p.tasks.t4 && p.tasks.t4.status; if (t4 && t4 !== "LOCKED") return true;
  } else if (G.state.task3.done) return true;
  return !!G.state.task3.codeFixed || (typeof codeResolves3 === "function" && codeResolves3());
}
// 현재 이상 현상 기록이 들어갈 업무 (TASK-003 진행 중이면 3, 아니면 1)
function recordTaskNo() { const t4 = G.state.task4, t3 = G.state.task3; if (t4.started && !t4.done) return 4; return t3.started && !t3.done ? 3 : 1; }
function recList() { const n = recordTaskNo(); return n === 4 ? G.state.task4.reproductions : n === 3 ? G.state.task3.reproductions : G.state.task.reproduced; }
const LABELS = { reserve: "예매하기", short: "예매", hype: "지금 바로 티켓 구매하기!!", ok: "확인" };

const SEAT_ROWS = [
  { r: "A", grade: "VIP" }, { r: "B", grade: "VIP" },
  { r: "C", grade: "R" },   { r: "D", grade: "R" },
  { r: "E", grade: "S" },   { r: "F", grade: "S" },
];
const SEAT_COLS = 10;
const TAKEN = new Set(["A3", "A4", "A7", "B1", "B2", "B8", "B9", "C5", "C6", "D2", "D10", "E4", "E5", "E6", "F1", "F9"]);
const FEE = 2000;

// 사이트 내 UI 상태 (앱 전환/새로고침에도 유지되도록 G.state 에 저장)
function TU() {
  if (!G.state.ticketUI) G.state.ticketUI = { dateIdx: 0, seats: [], terms: false, attempts: 0, liked: false, tab: "info" };
  return G.state.ticketUI;
}
const ttLocal = { logOpen: false, recOpen: false, modal: false, editId: null, confirmRestart: false, processing: false, err: "", device: "desktop" };

const won = (n) => n.toLocaleString("ko-KR") + "원";
const bugs = () => G.state.ticketBugs;

// ---------- 이벤트 로그 ----------
function ttLog(text, level = "info") {
  const log = G.state.task.testLog;
  log.push({ time: fmtMinutes(nowMinutes()), text, level });
  if (log.length > 80) log.splice(0, log.length - 80);
  G.save();
  const n = document.getElementById("tt-log-n");
  if (n) n.textContent = log.length;
  if (ttLocal.logOpen) renderTicket();
}

// 조사와 관련 없는 메뉴: 들어가지 않고 안내만 띄움
function notRelated(what) {
  ttLog(`${what} 클릭 → 이번 조사와 관련 없는 메뉴 (비활성)`);
  toast({ title: "테스트 모드", sub: "관련 없음", text: `'${what}'은(는) 이번 조사(TASK-001)와 관련 없는 메뉴입니다. 테스트 환경에서는 비활성화되어 있습니다.` });
}

// ---------- 렌더 ----------
function renderTicket() {
  const screen = G.state.ticketScreen || "show";
  ticketAppEl.innerHTML = `
    ${testBarHTML(screen)}
    <div class="tk-wrap ${ttLocal.device === "mobile" ? "is-mobile" : ""}">
    <div class="tk-site m-${design().mobile} c-${design().consistency}">
      ${siteHeaderHTML(screen)}
      <div class="tk-page">${screenHTML(screen)}</div>
      <footer class="tk-footer">© TICKET ON · 다연컴퍼니 · 테스트 환경 (staging) · 실제 결제가 발생하지 않습니다</footer>
    </div>
    </div>
    ${ttLocal.logOpen ? logDrawerHTML() : ""}
    ${ttLocal.recOpen ? recordDrawerHTML() : ""}
    ${ttLocal.modal ? recordModalHTML(screen) : ""}
    ${ttLocal.confirmRestart ? restartModalHTML() : ""}
  `;
  setTimeout(() => { const bar = ticketAppEl.querySelector(".tt-bar"); if (bar) ticketAppEl.style.setProperty("--ttbar-h", bar.offsetHeight + "px"); }, 0);
}

function testBarHTML(screen) {
  const ts = G.state.task;
  return `<div class="tt-bar">
    <span class="tt-badge">테스트 모드</span>
    <span class="tt-title">DAYEON TASK · ${recordTaskNo() === 4 ? "TASK-004 · 결제 오류 재현·검증" : recordTaskNo() === 3 ? "TASK-003 · 오류 재현·재테스트" : "TASK-001 · 서비스 오류 재현"}</span>
    <span class="tt-screen">현재 화면: <b>${SCREEN_LABEL[screen]}</b></span>
    <div class="tt-actions">
      <button class="tt-btn primary ${ttLocal.recOpen ? "on" : ""}" data-tt="records">${recordTaskNo() >= 3 ? "오류 재현 기록" : "이상 현상 기록"} <b>${recList().length}</b></button>
      <button class="tt-btn ${ttLocal.logOpen ? "on" : ""}" data-tt="log">이벤트 로그 <b id="tt-log-n">${ts.testLog.length}</b></button>
      <button class="tt-btn ${ttLocal.device === "mobile" ? "on" : ""}" data-tt="device">${ttLocal.device === "mobile" ? "PC 보기" : "모바일 보기"}</button>
      ${G.state.task3.started && !G.state.task3.done ? `<button class="tt-btn" data-tt="dev">개발자 도구</button><span class="tt-retest">재테스트 <b>${G.state.task3.retest.passes}/2</b></span>` : ""}
      ${G.state.task4.started && !G.state.task4.done ? `<button class="tt-btn" data-tt="dev4">개발자 도구</button><button class="tt-btn" data-tt="ui4">결제 UI 편집</button>` : ""}
      <button class="tt-btn" data-tt="restart">처음부터 다시</button>
      <button class="tt-btn" data-tt="back">업무로 돌아가기</button>
    </div>
  </div>`;
}

function siteHeaderHTML(screen) {
  return `<header class="tk-head">
    <div class="tk-head-inner">
      <button class="tk-logo" data-go="show"><span>TICKET</span><span class="on">ON</span></button>
      <nav class="tk-nav">
        <a data-go="show" class="${screen === "show" ? "is-active" : ""}">뮤지컬</a>
        ${["콘서트", "연극", "전시", "랭킹"].map((c) => `<a class="na" data-na="${c} 메뉴">${c}</a>`).join("")}
      </nav>
      <div class="tk-search na" data-na="검색"><input placeholder="공연, 아티스트 검색" disabled><span>⌕</span></div>
      <div class="tk-user"><button data-go="mypage" class="${screen === "mypage" ? "is-active" : ""}">마이페이지</button><span class="tk-user-name na" data-na="회원 정보">테스트계정 님</span></div>
    </div>
  </header>`;
}

function screenHTML(screen) {
  switch (screen) {
    case "seats": return seatsHTML();
    case "checkout": return checkoutHTML();
    case "result": return resultHTML();
    case "mypage": return mypageHTML();
    default: return showHTML();
  }
}

// ---------- 1. 공연 상세 ----------
function showHTML() {
  const u = TU();
  const d = design();
  const tabs = { info: "공연정보", cast: "캐스팅", notice: "공지사항" };
  const tabBody = {
    info: `<p>종착역을 향해 달리는 마지막 열차 안, 서로 다른 이유로 탑승한 다섯 사람의 하룻밤을 그린 창작 뮤지컬. 2024년 초연 당시 객석 점유율 97%를 기록한 화제작이 더 커진 무대로 돌아옵니다.</p>
           <ul class="tk-bul"><li>공연시간 ${SHOW.runtime}</li><li>${SHOW.age}</li><li>공연 시작 후 입장이 제한될 수 있습니다.</li></ul>`,
    cast: `<div class="tk-cast">${SHOW.cast.map((c) => `<div class="tk-cast-card"><div class="tk-cast-ph"></div><b>${c}</b><span>출연</span></div>`).join("")}</div>`,
    notice: `<ul class="tk-bul"><li>1인 4매까지 예매 가능합니다.</li><li>예매 수수료 장당 ${won(FEE)}이 부과됩니다.</li><li>취소 수수료는 공연일 기준으로 차등 적용됩니다.</li></ul>`,
  };
  return `<div class="tk-show">
    <div class="tk-poster"><div class="tk-poster-art"><span class="tk-poster-line"></span><span class="tk-poster-line s"></span></div><div class="tk-poster-title">${SHOW.title}</div><div class="tk-poster-sub">THE LAST TRAIN · 2026</div></div>
    <div class="tk-info l-${d.infoLayout}">
      <div class="tk-genre">${SHOW.genre}</div>
      <h1>${SHOW.title}</h1>
      <dl class="tk-meta">
        <dt>장소</dt><dd>${SHOW.venue}</dd>
        <dt>공연기간</dt><dd>${SHOW.period}</dd>
        <dt>공연시간</dt><dd>${SHOW.runtime}</dd>
        <dt>관람연령</dt><dd>${SHOW.age}</dd>
        <dt>가격</dt><dd>VIP석 ${won(SHOW.prices.VIP)} · R석 ${won(SHOW.prices.R)} · S석 ${won(SHOW.prices.S)}</dd>
      </dl>
      <div class="tk-tabs">${Object.keys(tabs).map((k) => `<button class="${u.tab === k ? "is-active" : ""}" data-tab="${k}">${tabs[k]}</button>`).join("")}</div>
      <div class="tk-tab-body">${tabBody[u.tab] || tabBody.info}</div>
    </div>
    <aside class="tk-book">
      <div class="tk-book-title">관람일 선택</div>
      <div class="tk-dates">${SHOW.dates.map((d, i) => `<button class="tk-date ${u.dateIdx === i ? "is-sel" : ""}" data-date="${i}"><span>${d.d}</span><span>${d.t}</span><small>잔여 ${d.left}석</small></button>`).join("")}</div>
      <div class="tk-open">${SHOW.openAt}</div>
      ${reserveBlockHTML(u, d)}
      <div class="tk-note">예매 전 공지사항을 확인해 주세요.</div>
    </aside>
  </div>`;
}

// 예매하기/관심공연 버튼 묶음 (배치·스타일·대비·문구 옵션 반영)
function reserveBlockHTML(u, d) {
  const reserve = `<button class="tk-reserve ${BTN_CLS[d.btnStyle]} k-${d.contrast}" data-reserve>${esc(LABELS[d.label] || "예매하기")}</button>`;
  const likePrimary = `<button class="tk-like ${u.liked ? "on" : ""}" data-like>${u.liked ? "♥ 관심공연 등록됨" : "♡ 관심공연 등록"}</button>`;
  const likeSecondary = `<button class="tk-like secondary ${u.liked ? "on" : ""}" data-like>${u.liked ? "♥ 관심공연" : "♡ 관심공연"}</button>`;
  if (d.placement === "belowInfo") return reserve + likeSecondary;
  if (d.placement === "top") return `<div class="tk-top-reserve">${reserve}</div>` + likeSecondary;
  return likePrimary + reserve;   // belowLike (현재 운영)
}

// ---------- 2. 좌석 선택 ----------
function seatsHTML() {
  const u = TU();
  const d = SHOW.dates[u.dateIdx];
  const rows = SEAT_ROWS.map((row) => {
    const cells = [];
    for (let c = 1; c <= SEAT_COLS; c++) {
      const id = row.r + c;
      const taken = TAKEN.has(id);
      const sel = u.seats.includes(id);
      const d = design();
      const sym = d.seatState === "colorOnly" ? c : taken ? "×" : sel ? "✓" : c;
      cells.push(`<button class="tk-seat g-${row.grade} ${taken ? "taken" : ""} ${sel ? "sel" : ""} s-${d.seatState}" data-seat="${id}" ${taken ? "disabled" : ""} title="${id} · ${row.grade}석 · ${taken ? "판매 완료" : sel ? "선택 중" : "선택 가능"}">${sym}</button>`);
    }
    return `<div class="tk-seat-row"><span class="tk-row-label">${row.r}</span>${cells.join("")}</div>`;
  }).join("");
  const total = seatTotal();
  return `<div class="tk-seats">
    <div class="tk-seat-map">
      <div class="tk-crumb">공연 상세 › <b>좌석 선택</b> › 결제 확인 › 결제 결과</div>
      <div class="tk-stage">STAGE</div>
      ${rows}
      ${seatLegendHTML()}
    </div>
    <aside class="tk-book">
      <div class="tk-book-title">선택 정보</div>
      <div class="tk-sum"><span>공연</span><b>${SHOW.title}</b></div>
      <div class="tk-sum"><span>일시</span><b>${d.d} ${d.t}</b></div>
      <div class="tk-sum"><span>좌석</span><b>${u.seats.length ? u.seats.map((s) => `${s} (${gradeOf(s)})`).join(", ") : "-"}</b></div>
      <div class="tk-sum total"><span>총 결제금액</span><b>${won(total)}</b></div>
      <div class="tk-note">1인 최대 4매 · 예매 수수료 장당 ${won(FEE)} 포함</div>
      ${ttLocal.err ? `<div class="tk-err">${ttLocal.err}</div>` : ""}
      <button class="tk-primary" data-to-checkout>결제하기 (${u.seats.length}석)</button>
      <button class="tk-ghost" data-go="show">이전</button>
    </aside>
  </div>`;
}
function seatLegendHTML() {
  const d = design();
  const grades = `<span class="g-VIP">VIP석 ${won(SHOW.prices.VIP)}</span><span class="g-R">R석 ${won(SHOW.prices.R)}</span><span class="g-S">S석 ${won(SHOW.prices.S)}</span>`;
  if (d.seatState === "colorLabelLegend")
    return `<div class="tk-legend">${grades}</div><div class="tk-legend states"><span class="st-avail">선택 가능 (번호)</span><span class="st-sel">✓ 선택 중</span><span class="st-taken">× 판매 완료</span></div>`;
  if (d.seatState === "colorSymbol")
    return `<div class="tk-legend">${grades}</div>`;
  return `<div class="tk-legend">${grades}<span class="taken">예매 완료</span></div>`;
}
function gradeOf(seatId) { return SEAT_ROWS.find((r) => r.r === seatId[0]).grade; }
function seatTotal() {
  return TU().seats.reduce((n, s) => n + SHOW.prices[gradeOf(s)] + FEE, 0);
}

// ---------- 3. 결제 확인 ----------
function checkoutHTML() {
  const u = TU();
  const b = bugs();
  const d = SHOW.dates[u.dateIdx];
  const ticketSum = u.seats.reduce((n, s) => n + SHOW.prices[gradeOf(s)], 0);
  const fee = u.seats.length * FEE;
  // 버그: 동의 여부와 상관없이 항상 비활성처럼 보임 / 정상: 동의 전 비활성, 동의 후 파랑
  let btnCls = b.payButton ? "looks-disabled" : (u.terms ? "" : "is-disabled");
  let btnText = ttLocal.processing ? `<span class="tk-spin"></span> 처리 중…` : `${won(ticketSum + fee)} 결제하기`;
  let btnAttr = "", overlay = "", sent = "";
  if (typeof payMode === "function" && payMode() !== "legacy") {
    // TASK-004: 팀의 UI 수정안(또는 공식) 에 따라 버튼·처리 중 표시가 달라짐
    const ui = currentPayUi();
    const label = { amount: `${won(ticketSum + fee)} 결제하기`, pay: "결제하기", ok: "확인", go: "결제 진행" }[ui.btnLabel] || "결제하기";
    btnCls = u.terms ? "" : "is-disabled";
    if (ttLocal.processing) {
      const txt = ui.processing === "none" ? label : "처리 중…";
      const spin = ui.processing === "spinner" || ui.processing === "overlay" ? `<span class="tk-spin"></span> ` : "";
      btnText = spin + esc(txt);
      if (ui.lock === "disabled") { btnCls += " is-disabled"; btnAttr = "disabled"; }
      if (ui.lock === "hidden") btnAttr = 'style="display:none"';
      if (ui.processing === "overlay") overlay = `<div class="tk-overlay"><span class="tk-spin"></span><b>결제를 처리하고 있습니다</b><small>잠시만 기다려 주세요. 화면을 닫거나 새로고침하지 마세요.</small></div>`;
      if (ui.processing === "none") sent = `<div class="tk-sent">요청 전송됨 (${ttLocal.sentCount || 1})</div>`;
    } else btnText = esc(label);
  }
  return `${overlay}<div class="tk-checkout">
    <div class="tk-co-main">
      <div class="tk-crumb">공연 상세 › 좌석 선택 › <b>결제 확인</b> › 결제 결과</div>
      <section class="tk-box">
        <h3>예매 정보</h3>
        <div class="tk-sum"><span>공연</span><b>${SHOW.title}</b></div>
        <div class="tk-sum"><span>일시</span><b>${d.d} ${d.t}</b></div>
        <div class="tk-sum"><span>장소</span><b>${SHOW.venue}</b></div>
        <div class="tk-sum"><span>좌석</span><b>${u.seats.map((s) => `${s} (${gradeOf(s)})`).join(", ")}</b></div>
      </section>
      <section class="tk-box">
        <h3>예매자 정보</h3>
        <div class="tk-form"><label>이름<input value="테스트계정" readonly></label><label>연락처<input value="010-0000-0000" readonly></label><label>이메일<input value="qa-test@dayeon.test" readonly></label></div>
      </section>
      <section class="tk-box">
        <h3>결제수단</h3>
        <div class="tk-pay"><label><input type="radio" name="pm" checked> 신용/체크카드</label><label class="na" data-na="계좌이체"><input type="radio" name="pm" disabled> 계좌이체</label><label class="na" data-na="간편결제"><input type="radio" name="pm" disabled> 간편결제</label></div>
        <div class="tk-form"><label>카드사<select><option>다연카드</option><option>국민</option><option>신한</option><option>현대</option></select></label><label>할부<select><option>일시불</option><option>2개월</option><option>3개월</option></select></label></div>
      </section>
    </div>
    <div class="tk-co-side"><aside class="tk-book">
      <div class="tk-book-title">결제 금액</div>
      <div class="tk-sum"><span>티켓 금액</span><b>${won(ticketSum)}</b></div>
      <div class="tk-sum"><span>예매 수수료</span><b>${won(fee)}</b></div>
      <div class="tk-sum total"><span>총 결제금액</span><b>${won(ticketSum + fee)}</b></div>
      <label class="tk-terms"><input type="checkbox" data-terms ${u.terms ? "checked" : ""}> [필수] 구매조건 확인 및 결제진행 동의</label>
      ${ttLocal.err ? `<div class="tk-err">${ttLocal.err}</div>` : ""}
      <button class="tk-primary tk-paybtn ${btnCls}" data-pay ${btnAttr}>${btnText}</button>${sent}
      <button class="tk-ghost" data-go="seats">이전</button>
    </aside>${typeof scenarioActive === "function" && scenarioActive() ? scenarioPanelHTML() : ""}</div>
  </div>`;
}

// ---------- 4. 결제 결과 ----------
function resultHTML() {
  const o = G.state.ticketOrder;
  if (!o) return `<div class="tk-result"><div class="tk-box center"><h2>주문 정보가 없습니다</h2><button class="tk-primary" data-go="show">공연 상세로</button></div></div>`;
  if (o.v4) return result4HTML(o);
  const b = bugs();
  // 버그: 서버 상태가 PENDING 이어도 '결제 완료'로 안내
  const showPaid = o.serverStatus === "PAID" || (b.resultMismatch && o.serverStatus === "PENDING");
  const d = SHOW.dates[o.dateIdx];
  return `<div class="tk-result">
    <div class="tk-crumb">공연 상세 › 좌석 선택 › 결제 확인 › <b>결제 결과</b></div>
    <div class="tk-box center">
      ${showPaid
        ? `<div class="tk-check ok">✓</div><h2>결제가 완료되었습니다</h2><p>예매가 정상적으로 처리되었습니다. 티켓은 마이페이지 › 예매 내역에서 확인하실 수 있습니다.</p>`
        : `<div class="tk-check wait">⏳</div><h2>결제 승인을 확인하고 있습니다</h2><p>카드사 승인 결과를 기다리는 중입니다. 완료되면 문자와 이메일로 안내드립니다.</p>`}
      <div class="tk-receipt">
        <div class="tk-sum"><span>예매번호</span><b>${o.orderNo}</b></div>
        <div class="tk-sum"><span>공연</span><b>${SHOW.title}</b></div>
        <div class="tk-sum"><span>일시</span><b>${d.d} ${d.t}</b></div>
        <div class="tk-sum"><span>좌석</span><b>${o.seats.join(", ")}</b></div>
        <div class="tk-sum"><span>결제금액</span><b>${won(o.total)}</b></div>
        <div class="tk-sum"><span>결제수단</span><b>신용카드 (다연카드)</b></div>
      </div>
      <div class="tk-btns"><button class="tk-primary" data-go="mypage">예매 내역 확인</button><button class="tk-ghost" data-go="show">홈으로</button></div>
    </div>
  </div>`;
}

// ---------- 5. 마이페이지 ----------
function mypageHTML() {
  const o = G.state.ticketOrder;
  const paid = o && o.serverStatus === "PAID";
  const pending = o && o.serverStatus === "PENDING";
  const dupCharges = o && o.v4 ? PayEngine.chargesFor(o.attemptKey) : 0;
  const d = o ? SHOW.dates[o.dateIdx] : null;
  return `<div class="tk-my">
    <aside class="tk-my-nav"><b>마이페이지</b><a class="is-active">예매 내역</a>${["취소 내역", "관심 공연", "회원 정보"].map((l) => `<a class="na" data-na="${l}">${l}</a>`).join("")}</aside>
    <div class="tk-my-main">
      <h2>예매 내역</h2>
      ${paid ? `<div class="tk-order"><div class="tk-order-top"><b>${o.orderNo}</b><span class="tk-tag ok">예매 완료</span></div><div>${SHOW.title} · ${d.d} ${d.t} · ${o.seats.join(", ")}</div></div>`
             : `<div class="tk-empty">예매 내역이 없습니다.</div>`}
      ${dupCharges > 1 ? `<div class="tk-dupwarn">⚠ 같은 예매에 결제 승인이 <b>${dupCharges}건</b> 기록되어 있습니다. (중복 결제)</div>` : ""}
      <h2 class="mt">결제 확인 중인 주문 <small>${pending ? 1 : 0}건</small></h2>
      ${pending ? `<div class="tk-order pending"><div class="tk-order-top"><b>${o.orderNo}</b><span class="tk-tag wait">승인 대기</span></div><div>${SHOW.title} · ${d.d} ${d.t} · ${o.seats.join(", ")}</div><div class="tk-order-foot">결제 상태: <b>PENDING</b> · 승인 완료 시 예매 내역으로 이동됩니다. 30분 내 미승인 시 자동 취소됩니다.</div></div>`
               : `<div class="tk-empty small">없음</div>`}
    </div>
  </div>`;
}

// ---------- 로그 드로어 / 기록 모달 ----------
function logDrawerHTML() {
  const log = G.state.task.testLog;
  return `<aside class="tt-log">
    <div class="tt-log-head"><b>이벤트 로그</b><span>테스트 모드가 기록한 클릭/요청/응답</span><button data-tt="log">닫기</button></div>
    <ol class="tt-log-list">${log.length ? log.map((l) => `<li class="${l.level}"><span>${esc(l.time)}</span>${esc(l.text)}</li>`).join("") : `<li class="info"><span>-</span>아직 기록이 없습니다. 사이트에서 버튼을 눌러보세요.</li>`}</ol>
  </aside>`;
}
function recordModalHTML(screen) {
  const rec = ttLocal.editId ? recList().find((r) => r.id === ttLocal.editId) : null;
  const scr = rec ? rec.screen : screen;
  const type = rec ? rec.type : "";
  if (recordTaskNo() >= 3) return recordModal3HTML(screen, rec, scr);
  return `<div class="tt-modal-bg" data-tt="modal-bg">
    <div class="tt-modal wide">
      <h3>이상 현상 기록 <small>${rec ? "수정" : "새 기록"}</small></h3>
      <div class="tt-field"><label>① 현재 테스트 화면</label><div class="tt-static"><b>${SCREEN_LABEL[scr]}</b> · ${rec ? esc(rec.time) : fmtMinutes(nowMinutes())} <span class="tt-auto">자동 입력</span></div></div>
      <div class="tt-field"><label>② 문제 유형 <small>단일 선택 · 분류용</small></label>
        <div class="tt-types">${RECORD_TYPES.map((t) => `<label class="${type === t ? "is-sel" : ""}"><input type="radio" name="rtype" value="${esc(t)}" ${type === t ? "checked" : ""}> ${esc(t)}</label>`).join("")}</div></div>
      <div class="tt-field"><label>③ 발견한 현상</label><p class="tt-q">어떤 상황에서 무엇을 발견했나요?</p><textarea id="tt-found" rows="4" placeholder="수행한 동작과 실제로 관찰한 현상을 적어 주세요.">${rec ? esc(rec.found) : ""}</textarea></div>
      <div class="tt-field"><label>④ 예상한 정상 동작</label><p class="tt-q">원래는 어떻게 동작해야 한다고 생각하나요?</p><textarea id="tt-expected" rows="3" placeholder="기대했던 동작이나 화면을 적어 주세요.">${rec ? esc(rec.expected) : ""}</textarea></div>
      <div class="tt-modal-actions">
        ${rec ? `<button class="tt-btn danger-text" data-tt="rec-delete">삭제</button>` : ""}
        <span class="tt-spacer"></span>
        <button class="tt-btn" data-tt="modal-close">취소</button><button class="tt-btn primary" data-tt="modal-save">저장</button>
      </div>
    </div>
  </div>`;
}
function recordModal3HTML(screen, rec, scr) {
  return `<div class="tt-modal-bg" data-tt="modal-bg">
    <div class="tt-modal wide">
      <h3>오류 재현 기록 <small>${rec ? "수정" : "새 기록"} · TASK-00${recordTaskNo()}</small></h3>
      <div class="tt-field"><label>① 테스트한 페이지</label><div class="tt-static"><b>${SCREEN_LABEL[scr]}</b> · ${rec ? esc(rec.time) : fmtMinutes(nowMinutes())} <span class="tt-auto">자동 입력</span></div></div>
      <div class="tt-field"><label>② 수행한 동작</label><textarea id="tt-action" rows="2" placeholder="무엇을 어떤 순서로 눌렀나요?">${rec ? esc(rec.action || "") : esc((ttLocal.prefill || {}).action || "")}</textarea></div>
      <div class="tt-field"><label>③ 실제 발생한 현상</label><textarea id="tt-found" rows="3" placeholder="화면에서 실제로 무엇이 일어났나요? (또는 일어나지 않았나요?)">${rec ? esc(rec.found) : esc((ttLocal.prefill || {}).found || "")}</textarea></div>
      <div class="tt-field"><label>④ 예상한 정상 동작</label><textarea id="tt-expected" rows="2" placeholder="원래는 어떻게 동작해야 한다고 생각하나요?">${rec ? esc(rec.expected) : ""}</textarea></div>
      ${recordTaskNo() === 4 ? `<div class="tt-field"><label>⑤ 관련 증거 <small>요청 번호, 화면, 로그 등</small></label><input id="tt-evidence" type="text" placeholder="예: Request #002, #003 · 결제 결과 화면" value="${rec ? esc(rec.evidence || "") : esc((ttLocal.prefill || {}).evidence || "")}"></div>` : ""}
      <div class="tt-modal-actions">
        ${rec ? `<button class="tt-btn danger-text" data-tt="rec-delete">삭제</button>` : ""}
        <span class="tt-spacer"></span>
        <button class="tt-btn" data-tt="modal-close">취소</button><button class="tt-btn primary" data-tt="modal-save">저장</button>
      </div>
    </div>
  </div>`;
}
function recordDrawerHTML() {
  const list = recList();
  return `<aside class="tt-log tt-records">
    <div class="tt-log-head"><b>${recordTaskNo() === 3 ? "오류 재현 기록" : "이상 현상 기록"}</b><span>${list.length}건 · 클릭하면 수정</span><button data-tt="records">닫기</button></div>
    <div class="tt-rec-new"><button class="tt-btn primary" data-tt="record">+ 새 기록 작성 (현재 화면: ${SCREEN_LABEL[G.state.ticketScreen || "show"]})</button></div>
    <ol class="tt-rec-list">${list.length ? list.map((r) => `<li data-rec="${r.id}"><div class="tt-rec-top"><b>${esc(r.screenLabel)}</b>${r.type ? `<span class="tt-rec-type">${esc(r.type)}</span>` : ""}<span>${esc(r.time)}</span></div>${r.action ? `<div class="tt-rec-exp">동작: ${esc(r.action)}</div>` : ""}<div class="tt-rec-found">${esc(r.found)}</div>${r.expected ? `<div class="tt-rec-exp">기대: ${esc(r.expected)}</div>` : ""}${r.evidence ? `<div class="tt-rec-exp">증거: ${esc(r.evidence)}</div>` : ""}</li>`).join("")
      : `<li class="empty">아직 기록이 없습니다. 사이트에서 이상한 점을 발견하면 '새 기록 작성'을 눌러 적어 주세요.</li>`}</ol>
  </aside>`;
}
function restartModalHTML() {
  const n = G.state.task.testLog.length;
  return `<div class="tt-modal-bg" data-tt="restart-cancel">
    <div class="tt-modal">
      <h3>처음부터 다시 시작</h3>
      <p>테스트 사이트를 처음 상태로 되돌립니다. 아래 내용이 초기화됩니다.</p>
      <ul class="tt-reset-list">
        <li>선택한 관람일·좌석, 결제 진행 상태, 생성된 주문</li>
        <li>이벤트 로그 <b>${n}건</b> (전부 삭제됨)</li>
      </ul>
      <p class="tt-keep">이상 현상·오류 재현 기록은 유지됩니다.</p>
      <div class="tt-modal-actions"><button class="tt-btn" data-tt="restart-cancel">취소</button><button class="tt-btn danger" data-tt="restart-confirm">초기화</button></div>
    </div>
  </div>`;
}

// ---------- 동작 ----------
function goScreen(s) {
  G.state.ticketScreen = s;
  ttLocal.err = "";
  if (typeof qa6Event === "function") { if (s === "show") qa6Event("showVisited"); if (s === "mypage" && G.state.ticketOrder && G.state.ticketOrder.serverStatus === "PAID" && G.state.ticketOrder.v4) qa6Event("mypageAfterPaid"); }
  if (s === "checkout") { if (typeof scenarioActive === "function" && scenarioActive() && TU().scenario) startRun(TU().scenario); else { ttLocal.attemptKey = "att-" + Date.now().toString(36); ttLocal.inflight = 0; ttLocal.sentCount = 0; ttLocal.processing = false; } }
  G.save();
  renderTicket();
  if (s === "result") logResultFetch();
  if (s === "mypage") logMypageFetch();
}
function logResultFetch() {
  const o = G.state.ticketOrder;
  if (!o) return;
  const shown = (o.serverStatus === "PAID" || bugs().resultMismatch) ? "결제 완료" : "승인 확인 중";
  const mismatch = o.serverStatus !== "PAID" && shown === "결제 완료";
  ttLog(`GET /api/orders/${o.orderNo} → 200 { status: "${o.serverStatus}" } · 화면 표시: "${shown}"`, mismatch ? "error" : "info");
}
function logMypageFetch() {
  const o = G.state.ticketOrder;
  if (!o) { ttLog("GET /api/my/reservations → 200 [] (예매 0건)"); return; }
  ttLog(`GET /api/my/reservations → 200 [] (예매 0건) · pendingOrders: ${o.serverStatus === "PENDING" ? 1 : 0}`, o.serverStatus === "PENDING" ? "warn" : "info");
}

// ---------- TASK-004: 가상 결제 엔진을 쓰는 결제 ----------
function tryPay4() {
  const u = TU();
  const ui = currentPayUi(); const code = currentPayCode();
  if (!u.terms) { ttLocal.err = "구매조건에 동의해 주세요."; ttLog("결제하기 클릭 → 약관 미동의로 차단 (정상)"); renderTicket(); return; }
  if (!u.scenario) { ttLocal.err = "오른쪽 '테스트 시나리오'에서 A·B·C 중 하나를 먼저 고르세요."; renderTicket(); return; }
  if (!ttLocal.attemptKey) startRun(u.scenario);
  if (ttLocal.inflight > 0 && (code.client || ui.lock !== "none")) { ttLog(`결제하기 클릭 → 처리 중이라 무시 (${code.client ? "isProcessing 가드" : "버튼 비활성화"})`, "note"); obsClick(ttLocal.attemptKey, false, null, code.client ? "코드의 처리 중 가드가 막음" : "버튼이 비활성화됨"); if (typeof qa6Event === "function") qa6Event("rapidTested"); return; }
  if (ttLocal.inflight > 0 && typeof qa6Event === "function") qa6Event("rapidTested");
  const scenario = u.scenario;
  const t4 = G.state.task4;
  ttLocal.err = ""; ttLocal.inflight = (ttLocal.inflight || 0) + 1; ttLocal.sentCount = (ttLocal.sentCount || 0) + 1; ttLocal.processing = true;
  const attemptKey = ttLocal.attemptKey;
  const idem = code.server ? attemptKey + "-idem" : null;
  ttLog(`결제하기 클릭 → POST /api/payments (시나리오 ${scenario}${idem ? ", idempotencyKey" : ", 키 없음"})`);
  obsClick(attemptKey, true, (t4.reqSeq || 0) + 1);
  renderTicket();
  PayEngine.send({ scenario, attemptKey, idempotencyKey: idem, orderId: "ORD-" + attemptKey.slice(4).toUpperCase(), amount: seatTotal(), seats: [...u.seats] }).then((res) => {
    ttLocal.inflight = Math.max(0, ttLocal.inflight - 1);
    const req = t4.requests.find((r) => r.no === res.requestNo);
    obsResponse(attemptKey, { ...res, latency: req ? req.latency : null });
    ttLog(`응답 #${res.requestNo} → ${res.httpStatus === 0 ? "timeout" : res.httpStatus} ${res.status}${res.idempotent ? " (idempotent)" : ""}${res.charged ? " · 청구" : ""}`, res.status === "SUCCESS" ? "info" : res.status === "DECLINED" ? "warn" : res.status === "DUPLICATE" ? "warn" : "error");
    if (ttLocal.resolvedAttempt === attemptKey) { if (ttLocal.inflight === 0) obsFinish(attemptKey); renderTicket(); return; }   // 첫 응답만 화면에 반영 (나머지는 로그만)
    ttLocal.resolvedAttempt = attemptKey; ttLocal.processing = false;
    let shown;
    if (!code.branch) shown = "success";
    else if (res.status === "SUCCESS" || (res.idempotent && res.status === "SUCCESS")) shown = "success";
    else if (res.status === "DECLINED") shown = "fail";
    else shown = code.pending ? "pending" : "error";
    if (req) req.shown = { success: "결제 완료", fail: "결제 실패 안내", pending: "결과 확인 중", error: "오류" }[shown];
    const serverStatus = res.status === "SUCCESS" ? "PAID" : res.status === "DECLINED" ? "DECLINED" : "PENDING";
    G.state.ticketOrder = { v4: true, orderNo: "T2510-" + String(1000 + Math.floor(Math.random() * 9000)), seats: [...u.seats], dateIdx: u.dateIdx, total: seatTotal(), serverStatus, shown, reason: res.reason, attemptKey, scenario };
    ttLog(`화면 표시: "${req ? req.shown : shown}" · 실제 결과: ${res.status}`, (shown === "success" && res.status !== "SUCCESS") ? "error" : "info");
    obsShown(attemptKey, shown, res); if (ttLocal.inflight === 0) obsFinish(attemptKey);
    if (typeof qa6Event === "function") { if (scenario === "C") qa6Event("rapidTested"); if (scenario === "B") qa6Event("failTested"); if (res.status === "DECLINED" && shown === "fail") qa6Event("failShown"); if (res.status === "SUCCESS" && shown === "success") qa6Event("paidOk"); }
    G.save();
    goScreen("result");
  });
}
function result4HTML(o) {
  const ui = currentPayUi();
  const d = SHOW.dates[o.dateIdx];
  const receipt = `<div class="tk-receipt">
        <div class="tk-sum"><span>예매번호</span><b>${o.orderNo}</b></div>
        <div class="tk-sum"><span>공연</span><b>${SHOW.title}</b></div>
        <div class="tk-sum"><span>일시</span><b>${d.d} ${d.t}</b></div>
        <div class="tk-sum"><span>좌석</span><b>${o.seats.join(", ")}</b></div>
        <div class="tk-sum"><span>결제금액</span><b>${won(o.total)}</b></div>
      </div>`;
  let body;
  if (o.shown === "success") {
    body = ui.success === "detail"
      ? `<div class="tk-check ok">✓</div><h2>결제가 완료되었습니다</h2><p>예매가 정상적으로 처리되었습니다. 티켓은 마이페이지 › 예매 내역에서 확인하실 수 있습니다.</p>${receipt}<div class="tk-btns"><button class="tk-primary" data-go="mypage">예매 내역 확인</button><button class="tk-ghost" data-go="show">홈으로</button></div>`
      : ui.success === "modal" ? `<div class="tk-check ok">✓</div><h2>완료</h2><p>결제가 완료되었습니다.</p><div class="tk-btns"><button class="tk-primary" data-go="show">홈으로</button></div>`
      : `<h2>결제 완료</h2><div class="tk-btns"><button class="tk-ghost" data-go="mypage">예매 내역</button><button class="tk-ghost" data-go="show">홈으로</button></div>`;
  } else if (o.shown === "fail") {
    body = `<div class="tk-check bad">!</div><h2>결제가 완료되지 않았습니다</h2>${ui.fail !== "none" ? `<p class="tk-reason">사유: 카드사 승인 거절 (${esc(o.reason || "CARD_DECLINED")})</p>` : ""}${ui.fail === "reasonHelp" ? `<p class="tk-help">다른 카드로 시도하거나 카드 한도·유효기간을 확인해 주세요. 결제된 금액은 없습니다.</p>` : ""}<div class="tk-btns">${ui.retry !== "none" ? `<button class="tk-primary" data-go="checkout">다시 시도</button>` : ""}${ui.retry === "retryHelp" ? `<button class="tk-ghost" data-go="checkout">결제수단 변경</button>` : ""}<button class="tk-ghost" data-go="show">홈으로</button></div>${ui.retry === "retryHelp" ? `<small class="tk-cs">문제가 계속되면 고객센터 1588-0000</small>` : ""}`;
  } else if (o.shown === "pending") {
    body = `<div class="tk-check wait">⏳</div><h2>결제 결과를 확인하고 있습니다</h2><p class="tk-help">응답이 지연되고 있습니다. 잠시 후 예매 내역에서 확인해 주세요.</p><div class="tk-btns">${ui.pending === "waitCheck" ? `<button class="tk-primary" data-go="mypage">결제 상태 조회</button>` : ""}<button class="tk-ghost" data-go="show">홈으로</button></div>${ui.pending === "waitCheck" ? `<small class="tk-cs">같은 결제를 다시 시도하면 중복 결제가 될 수 있습니다.</small>` : ""}`;
  } else {
    body = `<div class="tk-check bad">✖</div><h2>오류가 발생했습니다</h2><p class="tk-help">처리되지 않은 예외 (${esc(o.reason || "UNKNOWN")}). 결제가 됐는지 알 수 없습니다.</p><div class="tk-btns"><button class="tk-ghost" data-go="show">홈으로</button></div>`;
  }
  return `<div class="tk-result">${typeof resultBannerHTML === "function" ? resultBannerHTML(o) : ""}<div class="tk-crumb">공연 상세 › 좌석 선택 › 결제 확인 › <b>결제 결과</b></div><div class="tk-box center">${body}</div></div>`;
}

function tryPay() {
  const u = TU();
  if (ttLocal.processing) return;
  if (!u.terms) {
    ttLocal.err = "구매조건에 동의해 주세요.";
    ttLog("결제하기 클릭 → 약관 미동의로 차단 (정상)");
    renderTicket();
    return;
  }
  ttLocal.err = "";
  u.attempts++;
  ttLocal.processing = true;
  renderTicket();
  const attempt = u.attempts;
  const b = bugs();
  setTimeout(() => {
    ttLocal.processing = false;
    if (b.payButton && attempt === 1) {
      ttLog("결제하기 클릭 #1 → POST /api/payments → 응답 없음 (timeout 1500ms)", "warn");
      renderTicket();
      if (!G.live && G.state.task2.done && typeof startFollowup3 === "function") startFollowup3();
      return;
    }
    if (b.payButton && attempt === 2) {
      ttLog("결제하기 클릭 #2 → POST /api/payments → 409 Conflict (duplicate request)", "warn");
      renderTicket();
      if (!G.live && G.state.task3.done && typeof startFollowup4 === "function") startFollowup4();
      return;
    }
    const orderNo = "T2510-" + String(1000 + Math.floor(Math.random() * 9000));
    const serverStatus = b.resultMismatch ? "PENDING" : "PAID";
    G.state.ticketOrder = { orderNo, seats: [...u.seats], dateIdx: u.dateIdx, total: seatTotal(), serverStatus };
    ttLog(`결제하기 클릭 #${attempt} → POST /api/payments → 200 { orderNo: "${orderNo}", status: "${serverStatus}" }`, serverStatus === "PAID" ? "info" : "warn");
    goScreen("result");
  }, 1500);
}

function saveRecord(screen) {
  const is3 = recordTaskNo() >= 3;
  const type = is3 ? "" : ((ticketAppEl.querySelector('input[name="rtype"]:checked') || {}).value || "");
  const action = is3 ? (document.getElementById("tt-action")?.value || "").trim() : "";
  const evidence = (document.getElementById("tt-evidence")?.value || "").trim();
  const found = (document.getElementById("tt-found")?.value || "").trim();
  const expected = (document.getElementById("tt-expected")?.value || "").trim();
  if (!is3 && !type) { toast({ title: "테스트 모드", text: "문제 유형을 선택하세요." }); return; }
  if (is3 && !action) { toast({ title: "테스트 모드", text: "수행한 동작을 적어 주세요." }); return; }
  if (!found) { toast({ title: "테스트 모드", text: "발견한 현상을 적어 주세요." }); return; }
  const list = recList();
  if (ttLocal.editId) {
    const r = list.find((x) => x.id === ttLocal.editId);
    if (r) Object.assign(r, is3 ? { action, found, expected, evidence } : { type, found, expected });
    ttLog(`${is3 ? "오류 재현" : "이상 현상"} 기록 수정 (${r ? r.screenLabel : ""}): ${found.slice(0, 40)}`, "note");
  } else {
    list.push({ id: "rec-" + Date.now(), screen, screenLabel: SCREEN_LABEL[screen], type, action, found, expected, evidence, time: fmtMinutes(nowMinutes()) });
    ttLog(`${is3 ? "오류 재현" : "이상 현상"} 기록 (${SCREEN_LABEL[screen]}${type ? " · " + type : ""}): ${found.slice(0, 40)}`, "note");
  }
  ttLocal.modal = false; ttLocal.editId = null; ttLocal.prefill = null;
  G.save();
  renderTicket();
  toast({ title: "테스트 모드", sub: "이상 현상 기록", text: `기록이 저장되었습니다. (총 ${list.length}건)` });
}
function deleteRecord() {
  const list = recList();
  const i = list.findIndex((x) => x.id === ttLocal.editId);
  if (i >= 0) { ttLog(`이상 현상 기록 삭제 (${list[i].screenLabel})`, "note"); list.splice(i, 1); }
  ttLocal.modal = false; ttLocal.editId = null; ttLocal.prefill = null;
  G.save();
  renderTicket();
}

function restartTicket() {
  ttLocal.attemptKey = null; ttLocal.inflight = 0; ttLocal.processing = false;
  G.state.ticketUI = null;
  G.state.ticketOrder = null;
  G.state.ticketScreen = "show";
  G.state.task.testLog = [];
  ttLocal.confirmRestart = false;
  ttLocal.logOpen = false;
  ttLocal.err = "";
  G.save();
  ttLog("테스트 세션 초기화 (처음부터 다시) — 이전 이벤트 로그 삭제됨");
  renderTicket();
  toast({ title: "테스트 모드", sub: "초기화", text: "테스트 사이트와 이벤트 로그를 초기화했습니다. 공연 상세부터 다시 진행하세요." });
}

ticketAppEl.addEventListener("click", (e) => {
  const tt = e.target.closest("[data-tt]");
  if (tt) {
    const a = tt.dataset.tt;
    if (a === "back") { showApp("task"); return; }
    if (a === "log") { ttLocal.logOpen = !ttLocal.logOpen; ttLocal.recOpen = false; renderTicket(); return; }
    if (a === "records") { ttLocal.recOpen = !ttLocal.recOpen; ttLocal.logOpen = false; renderTicket(); return; }
    if (a === "record") { ttLocal.modal = true; ttLocal.editId = null; renderTicket(); return; }
    if (a === "modal-close") { ttLocal.modal = false; ttLocal.editId = null; ttLocal.prefill = null; renderTicket(); return; }
    if (a === "modal-bg") { if (e.target === tt) { ttLocal.modal = false; ttLocal.editId = null; ttLocal.prefill = null; renderTicket(); } return; }
    if (a === "modal-save") { saveRecord(G.state.ticketScreen || "show"); return; }
    if (a === "rec-delete") { deleteRecord(); return; }
    if (a === "dev") { showApp("dev"); return; }
    if (a === "dev4") { G.state.devView.file = "net"; showApp("dev"); return; }
    if (a === "ui4") { openDesign("pay"); return; }
    if (a === "device") { ttLocal.device = ttLocal.device === "mobile" ? "desktop" : "mobile"; if (ttLocal.device === "mobile" && typeof qa6Event === "function") qa6Event("mobileViewed"); ttLog(`${ttLocal.device === "mobile" ? "모바일" : "PC"} 보기로 전환`); renderTicket(); return; }
    if (a === "restart") { ttLocal.confirmRestart = true; renderTicket(); return; }
    if (a === "restart-cancel") { if (e.target === tt || tt.tagName === "BUTTON") { ttLocal.confirmRestart = false; renderTicket(); } return; }
    if (a === "restart-confirm") { restartTicket(); return; }
    return;
  }
  const u = TU();
  const recRow = e.target.closest("[data-rec]");
  if (recRow) { ttLocal.editId = recRow.dataset.rec; ttLocal.modal = true; renderTicket(); return; }
  const na = e.target.closest("[data-na]");
  if (na) { e.preventDefault(); notRelated(na.dataset.na); return; }
  const go = e.target.closest("[data-go]");
  if (go) {
    const s = go.dataset.go;
    ttLog(`${s === "mypage" ? "마이페이지" : s === "show" ? "홈/공연 상세" : SCREEN_LABEL[s]} 이동`);
    goScreen(s);
    return;
  }
  const tab = e.target.closest("[data-tab]");
  if (tab) { u.tab = tab.dataset.tab; renderTicket(); return; }
  const date = e.target.closest("[data-date]");
  if (date) { u.dateIdx = Number(date.dataset.date); ttLog(`관람일 선택: ${SHOW.dates[u.dateIdx].d} ${SHOW.dates[u.dateIdx].t}`); renderTicket(); return; }
  if (e.target.closest("[data-like]")) {
    u.liked = !u.liked;
    ttLog(`관심공연 ${u.liked ? "등록" : "해제"} 클릭 → 찜 목록 ${u.liked ? "추가" : "제거"} (예매 진행 아님)`);
    renderTicket();
    return;
  }
  if (e.target.closest("[data-reserve]")) {
    if (!reserveWorks()) {
      // 이벤트 리스너가 등록되지 않은 상태: 화면은 그대로, 로그에만 남김
      const t3 = G.state.task3;
      t3.reproAttempts = (t3.reproAttempts || 0) + 1;
      if (t3.started && !t3.done && t3.codeTested) { t3.retest.count++; }
      ttLog("예매하기 클릭 → 반응 없음 (click 이벤트 리스너가 등록되어 있지 않음)", "error");
      if (t3.started && !t3.done) toast({ title: "TICKET ON", sub: "예매하기 반응 없음", text: t3.codeTested ? "개발자 도구의 코드가 아직 reserveBtn 을 잡지 못합니다. reservation.js 를 다시 고치고 [테스트 실행]으로 확인하세요." : "아직 수정 전입니다. 개발자 도구에서 reservation.js 의 선택자를 고치면 이 버튼에 바로 반영됩니다.", app: "dev" });
      if (typeof qa6Event === "function") qa6Event("reserveFailed");
      G.save();
      renderTicket();
      return;
    }
    const t3 = G.state.task3;
    if (reserveBugActive() && t3.started && !t3.done) {
      t3.retest.count++; t3.retest.passes++;
      ttLog(`예매하기 클릭 → 좌석 선택 화면 이동 ✓ (수정 코드 재테스트 ${t3.retest.passes}회)`, "note");
      if (t3.retest.passes === 2) toast({ title: "테스트 모드", sub: "재테스트", text: "예매하기 버튼이 두 번 연속 정상 동작했습니다. 이제 오류 수정 보고서를 작성할 수 있습니다." });
    } else {
      ttLog(`예매하기 클릭 → 좌석 선택 화면 이동${design().btnStyle === "gray" ? " (버튼 스타일: #d7dadf on #eceef1)" : ""}`);
    }
    if (typeof qa6Event === "function") qa6Event("reserveClicked");
    goScreen("seats");
    return;
  }
  const seat = e.target.closest("[data-seat]");
  if (seat) {
    const id = seat.dataset.seat;
    if (u.seats.includes(id)) u.seats = u.seats.filter((s) => s !== id);
    else if (u.seats.length >= 4) { ttLocal.err = "1인 최대 4매까지 선택할 수 있습니다."; }
    else u.seats.push(id);
    renderTicket();
    return;
  }
  if (e.target.closest("[data-to-checkout]")) {
    if (!u.seats.length) { ttLocal.err = "좌석을 선택해 주세요."; ttLog("결제하기(좌석) 클릭 → 좌석 미선택으로 차단 (정상)"); renderTicket(); return; }
    ttLog(`좌석 확정: ${u.seats.join(", ")} → 결제 확인 화면 이동`);
    goScreen("checkout");
    return;
  }
  if (e.target.closest("[data-pay]")) { if (typeof payMode === "function" && payMode() !== "legacy") tryPay4(); else tryPay(); return; }
});
ticketAppEl.addEventListener("change", (e) => {
  const scn = e.target.closest("[data-tt-scn]");
  if (scn) { TU().scenario = scn.value; ttLog(`테스트 시나리오 변경: ${scn.value}`); G.save(); renderTicket(); return; }
  const t = e.target.closest("[data-terms]");
  if (t) {
    TU().terms = t.checked;
    ttLog(`약관 동의 ${t.checked ? "체크" : "해제"} → 결제하기 버튼 상태: ${bugs().payButton ? "변화 없음 (비활성 스타일 유지)" : t.checked ? "활성" : "비활성"}`, bugs().payButton && t.checked ? "warn" : "info");
    G.save();
    renderTicket();
  }
});

// 새로고침 시 TICKET ON 을 보고 있었다면 바로 그리기 (task.js 의 showApp 은 이 파일보다 먼저 실행됨)
if (G.state.currentApp === "ticket") renderTicket();
