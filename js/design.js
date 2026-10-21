// =====================================================================
//  DAYEON DESIGN — 디자인 검수 뷰어 (TASK-002)
//  탭: 검수(MISSION A) / 원칙 분석(MISSION B) / 디자인 수정(MISSION C)
//  미리보기는 TASK2.v2 / TASK2.v4 / 사용자 선택 옵션(동일 키)으로 HTML을 그림
// =====================================================================

const T2 = () => G.state.task2;
const DV = () => G.state.designView;
const dLocal = { hl: null, checkShown: false };

function renderDesign() {
  const dv = DV();
  const file = TASK2.files[dv.version] || TASK2.files.v2;
  const tabs = [["review", "검수"], ["principles", "원칙 분석"], ["edit", "디자인 수정"]];
  if (G.state.task4 && G.state.task4.started) tabs.push(["pay", "결제 UI"]);
  if (G.state.task5 && G.state.task5.started) tabs.push(["history", "변경 이력"]);
  designAppEl.innerHTML = `
    <header class="d-head">
      <button class="d-back" data-d="back">← 업무로 돌아가기</button>
      <div class="d-file">
        <span class="d-file-icon">Fig</span>
        <div><b>${esc(dv.tab === "history" ? "TICKETON_Design · 변경 이력" : dv.tab === "pay" ? "payment_ui.fig · 결제 상태별 UI" : dv.tab === "edit" ? "TICKETON_Design_v4.fig · 수정안" : file.name)}</b><small>${esc(dv.tab === "history" ? "TASK-005 · v2 / v3 / v4 수정·전달 기록" : dv.tab === "pay" ? "TASK-004 · 진행 전 / 처리 중 / 완료·실패 · 담당 이서연" : dv.tab === "edit" ? "운영 반영용 수정안 · 담당 이서연" : `${file.version} · 수정 ${file.date} · ${file.author}`)}</small></div>
      </div>
      <nav class="d-tabs">${tabs.map(([k, l]) => `<button class="${dv.tab === k ? "is-active" : ""}" data-dtab="${k}">${l}</button>`).join("")}</nav>
      <div class="d-head-right"><span class="d-count">검수 목록 <b>${T2().findings.length}</b></span></div>
    </header>
    <div class="d-body">
      ${dv.tab === "history" && typeof designHistoryTabHTML === "function" ? designHistoryTabHTML() : dv.tab === "pay" && typeof payUiTabHTML === "function" ? payUiTabHTML() : dv.tab === "review" ? reviewTabHTML() : dv.tab === "principles" ? principlesTabHTML() : editTabHTML()}
    </div>`;
}

// =====================================================================
//  미리보기 렌더러
// =====================================================================
const P_LABEL = { reserve: "예매하기", short: "예매", hype: "지금 바로 티켓 구매하기!!", ok: "확인" };
function hot(id, on) { return on ? ` data-spot="${id}" class="hot"` : ""; }

function previewHTML(spec, page, { hotspots = false, device = "desktop" } = {}) {
  const inner = page === "seats" ? pvSeats(spec, hotspots) : page === "checkout" ? pvCheckout(spec, hotspots) : pvShow(spec, hotspots, page === "mobile" || device === "mobile");
  const mobile = page === "mobile" || device === "mobile";
  return `<div class="pv ${mobile ? "pv-mobile" : "pv-desktop"} m-${spec.mobile} c-${spec.consistency}">
    <div class="pv-chrome"><span></span><span></span><span></span><i>${mobile ? "ticketon.test · 모바일 390px" : "ticketon.test"}</i></div>
    <div class="pv-screen">${mobile && hotspots ? `<div${hot("mobile", true)} data-whole="1">` : ""}${inner}${mobile && hotspots ? "</div>" : ""}</div>
  </div>`;
}

function pvHeader() {
  return `<div class="pv-head"><b>TICKET<span>ON</span></b><nav><a class="on">뮤지컬</a><a>콘서트</a><a>연극</a></nav><em>마이페이지</em></div>`;
}

function pvShow(s, h, mobile) {
  const btn = `<button class="pv-reserve b-${s.btnStyle} k-${s.contrast}"${hot("reserve", h)}>${esc(P_LABEL[s.label] || "예매하기")}</button>`;
  const likeP = `<button class="pv-like primary"${hot("heart", h)}>${s.heart === "filled" ? "♥" : "♡"} 관심공연 등록</button>`;
  const likeS = `<button class="pv-like secondary"${hot("heart", h)}>${s.heart === "filled" ? "♥" : "♡"} 관심공연</button>`;
  const block = s.placement === "belowInfo" ? btn + likeS : s.placement === "top" ? btn + `<div class="pv-dates">${pvDates()}</div>` + likeS : likeP + btn;
  const dates = s.placement === "top" ? "" : `<div class="pv-dates">${pvDates()}</div>`;
  return `${pvHeader()}
  <div class="pv-show">
    <div class="pv-poster p-${s.poster}"${hot("poster", h)}><i></i><b>뮤지컬 〈라스트 트레인〉</b><small>THE LAST TRAIN · 2026</small></div>
    <div class="pv-info l-${s.infoLayout}"${hot("info", h)}>
      <em>뮤지컬</em>
      <h1>뮤지컬 〈라스트 트레인〉</h1>
      <dl><dt>장소</dt><dd>다연아트홀 대극장</dd><dt>공연기간</dt><dd>2026.11.07 ~ 12.28</dd><dt>관람시간</dt><dd>150분</dd><dt>가격</dt><dd class="price">VIP 150,000원 · R 120,000원 · S 90,000원</dd></dl>
      <div class="pv-tabs"><span class="on">공연정보</span><span>캐스팅</span><span>공지사항</span></div>
      <p>종착역을 향해 달리는 마지막 열차 안, 서로 다른 이유로 탑승한 다섯 사람의 하룻밤.</p>
    </div>
    <aside class="pv-panel">
      <b>관람일 선택</b>
      ${dates}
      <small class="pv-open">오늘 11:00 티켓 오픈</small>
      ${block}
    </aside>
  </div>
  ${mobile && s.mobile === "stack" ? `<div class="pv-sticky"><button class="pv-reserve b-${s.btnStyle} k-${s.contrast}">${esc(P_LABEL[s.label] || "예매하기")}</button></div>` : ""}`;
}
function pvDates() {
  return SHOW.dates.map((d, i) => `<div class="pv-date ${i === 0 ? "sel" : ""}"><span>${d.d}</span><span>${d.t}</span><small>잔여 ${d.left}석</small></div>`).join("");
}

function pvSeats(s, h) {
  const rows = ["A", "B", "C"].map((r, ri) => {
    const cells = [];
    for (let c = 1; c <= 8; c++) {
      const taken = (ri === 0 && (c === 3 || c === 4)) || (ri === 1 && c === 7) || (ri === 2 && c === 2);
      const sel = ri === 1 && (c === 3 || c === 4);
      const sym = s.seatState === "colorOnly" ? c : taken ? "×" : sel ? "✓" : c;
      cells.push(`<i class="pv-seat g${ri} ${taken ? "taken" : ""} ${sel ? "sel" : ""} s-${s.seatState}">${sym}</i>`);
    }
    return `<div class="pv-seat-row"><span>${r}</span>${cells.join("")}</div>`;
  }).join("");
  const legend = s.seatState === "colorLabelLegend"
    ? `<div class="pv-legend"><span class="g0">VIP</span><span class="g1">R</span><span class="g2">S</span></div><div class="pv-legend states"><span class="avail">선택 가능 (번호)</span><span class="sel">✓ 선택 중</span><span class="taken">× 판매 완료</span></div>`
    : s.seatState === "colorSymbol" ? `<div class="pv-legend"><span class="g0">VIP</span><span class="g1">R</span><span class="g2">S</span></div>`
    : `<div class="pv-legend"><span class="g0">VIP</span><span class="g1">R</span><span class="g2">S</span><span class="taken">예매 완료</span></div>`;
  return `${pvHeader()}
  <div class="pv-seats">
    <div class="pv-map">
      <div class="pv-stage st-${s.stage}"${hot("stage", h)}>STAGE</div>
      ${rows}
      <div${hot("seatLegend", h)}>${legend}</div>
    </div>
    <aside class="pv-panel">
      <b>선택 정보</b>
      <div class="pv-sum"><span>좌석</span><b>B3 (R), B4 (R)</b></div>
      <div class="pv-sum total"><span>총 결제금액</span><b>244,000원</b></div>
      <div${hot("buttons", h)}><button class="pv-primary seats">결제하기 (2석)</button><button class="pv-ghost seats">이전</button></div>
    </aside>
  </div>`;
}

function pvCheckout(s, h) {
  return `${pvHeader()}
  <div class="pv-checkout">
    <div class="pv-co-main">
      <div class="pv-box"><b>예매 정보</b><div class="pv-sum"><span>공연</span><b>뮤지컬 〈라스트 트레인〉</b></div><div class="pv-sum"><span>일시</span><b>11.07 (토) 14:00</b></div><div class="pv-sum"><span>좌석</span><b>B3, B4</b></div></div>
      <div class="pv-box"><b>결제수단</b><div class="pv-radio"><span class="on">● 신용/체크카드</span><span>○ 계좌이체</span><span>○ 간편결제</span></div></div>
    </div>
    <aside class="pv-panel">
      <b>결제 금액</b>
      <div class="pv-sum total"><span>총 결제금액</span><b>244,000원</b></div>
      <label class="pv-terms">☐ [필수] 구매조건 확인 및 결제진행 동의</label>
      <div${hot("buttons", h)}><button class="pv-primary checkout">244,000원 결제하기</button><button class="pv-ghost checkout">이전</button></div>
    </aside>
  </div>`;
}

// =====================================================================
//  MISSION A — 검수
// =====================================================================
function leftPanelHTML(dv, { showVersion = true } = {}) {
  return `<aside class="d-left">
    <div class="d-sec"><h4>페이지</h4>
      ${TASK2.pages.map((p) => `<button class="d-page ${dv.page === p.id ? "is-active" : ""}" data-dpage="${p.id}"><i></i>${p.label}</button>`).join("")}
    </div>
    ${showVersion ? `<div class="d-sec"><h4>디자인 버전</h4>
      <div class="d-seg"><button class="${dv.version === "v2" && !dv.compare ? "on" : ""}" data-dver="v2">v2 기존</button><button class="${dv.version === "v4" && !dv.compare ? "on" : ""}" data-dver="v4">v4 최종</button><button class="${dv.compare ? "on" : ""}" data-dver="compare">나란히 비교</button></div>
      <p class="d-tip">같은 페이지를 버전을 바꿔 가며 비교하세요. 미리보기 안의 요소를 클릭하면 검수 목록에 담깁니다.</p>
    </div>` : ""}
  </aside>`;
}

function reviewTabHTML() {
  const dv = DV();
  const s = T2();
  const opts = { hotspots: true };
  const center = dv.compare
    ? `<div class="d-compare"><div><div class="d-cap">v2 기존 (운영 화면)</div>${previewHTML(TASK2.v2, dv.page, opts)}</div><div><div class="d-cap">v4 최종 시안</div>${previewHTML(TASK2.v4, dv.page, opts)}</div></div>`
    : `<div class="d-single"><div class="d-cap">${dv.version === "v2" ? "v2 기존 (운영 화면)" : "v4 최종 시안"} · ${TASK2.pages.find((p) => p.id === dv.page).label}</div>${previewHTML(TASK2[dv.version], dv.page, opts)}</div>`;

  const revealed = !!answerKey() && (s.findingsDone || s.findingsRevealed);   // 교사가 정답을 공개한 뒤에만 결과 표시
  const list = s.findings.map((f, i) => {
    const sp = spotInfo(f.spotId);
    const pg = TASK2.pages.find((p) => p.id === f.page);
    let status = `<span class="d-st wait">검토 중</span>`;
    let explain = "";
    if (revealed && sp.issue !== undefined) {
      status = sp.issue ? `<span class="d-st bad">사용성 문제</span>` : `<span class="d-st ok">단순 시각 차이</span>`;
      explain = `<div class="d-explain">${esc(sp.explain)}</div>`;
    }
    return `<li class="d-find ${dLocal.hl === f.id ? "hl" : ""}" data-find="${f.id}">
      <div class="d-find-top"><span class="d-find-n">${i + 1}</span><b>${esc(sp.label)}</b>${status}<button class="d-x" data-find-del="${f.id}" title="목록에서 제거">×</button></div>
      <div class="d-find-where">발견한 위치: ${esc(pg ? pg.label : f.page)} · ${esc(f.time)}</div>
      <textarea class="d-note" data-find-note="${f.id}" rows="2" placeholder="문제 내용: 무엇이 어떻게 불편한지 적어 주세요.">${esc(f.note || "")}</textarea>
      ${explain}
    </li>`;
  }).join("");

  const missed = revealed
    ? TASK2.spots.map((x) => spotInfo(x.id)).filter((x) => x.issue && !s.findings.some((f) => f.spotId === x.id))
    : [];

  return `${leftPanelHTML(dv)}
    <main class="d-center">${center}</main>
    <aside class="d-right">
      <div class="d-right-head"><h3>검수 현황</h3><span>${s.findings.length}건</span></div>
      <p class="d-tip">미리보기에서 문제라고 생각하는 요소를 클릭하세요. 같은 요소는 한 번만 담깁니다.</p>
      <ol class="d-finds">${list || `<li class="d-empty">아직 담은 항목이 없습니다.</li>`}</ol>
      ${missed.length ? `<div class="d-missed"><b>검수에서 놓친 항목</b><ul>${missed.map((m) => `<li>${esc(m.label)} — ${esc(m.explain)}</li>`).join("")}</ul></div>` : ""}
      <div class="d-right-foot">
        ${revealed
          ? `<div class="d-done">검수 결과가 공개되었습니다. 놓친 항목과 해설을 확인하세요.</div><button class="d-cta" data-dtab="principles">원칙 분석으로</button>`
          : s.findingsDone
            ? `<div class="d-done">검수 목록을 확정했습니다. 결과·해설은 교사가 공개할 때 표시됩니다.</div><button class="d-cta" data-dtab="principles">원칙 분석으로</button><button class="d-cta secondary" data-d="reopen">목록 다시 열기</button>`
            : `<button class="d-cta" data-d="reveal" ${s.findings.length ? "" : "disabled"}>검수 완료</button><p class="d-tip">문제라고 생각하는 요소를 모두 담고 메모를 적은 뒤 누르세요. 정답은 교사 해설 때 확인합니다.</p>`}
      </div>
    </aside>`;
}

// =====================================================================
//  MISSION B — 원칙 분석
// =====================================================================
function principlesTabHTML() {
  const s = T2();
  const items = s.findings.map((f) => spotInfo(f.spotId));
  const uniq = [...new Map(items.map((sp) => [sp.id, sp])).values()];
  const checked = s.principlesChecked;
  const showResult = checked && !!answerKey();
  const cards = uniq.map((sp) => {
    const sel = s.principles[sp.id] || [];
    let result = "";
    if (showResult && sp.issue !== undefined) {
      if (!sp.issue) result = `<div class="d-result neutral"><b>참고</b> 이 항목은 사용성 문제가 아닌 단순 시각 차이입니다. 원칙 위반으로 보기 어렵습니다.</div>`;
      else {
        const hit = sel.filter((p) => sp.principles.includes(p));
        const names = (ids) => ids.map((id) => TASK2.principles.find((p) => p.id === id).name).join(", ");
        result = hit.length
          ? `<div class="d-result ok"><b>적절한 연결</b> ${esc(names(hit))} — ${esc(sp.explain)}${sp.principles.length > hit.length ? `<br><small>함께 볼 수 있는 원칙: ${esc(names(sp.principles.filter((p) => !hit.includes(p))))}</small>` : ""}</div>`
          : `<div class="d-result bad"><b>다시 생각해 보기</b> 이 문제는 주로 <b>${esc(names(sp.principles))}</b>과 관련 있습니다. ${esc(sp.explain)}</div>`;
      }
    }
    return `<div class="d-pcard">
      <div class="d-pcard-head"><b>${esc(sp.label)}</b><span class="d-dim">${esc(TASK2.pages.find((p) => p.id === sp.page).label)}</span></div>
      <div class="d-chips">${TASK2.principles.map((p) => `<button class="d-chip ${sel.includes(p.id) ? "on" : ""}" data-pr="${sp.id}" data-pid="${p.id}" ${checked ? "disabled" : ""}>${esc(p.name)}</button>`).join("")}</div>
      ${result}
    </div>`;
  }).join("");

  return `<aside class="d-left">
      <div class="d-sec"><h4>UI/UX 원칙 요약</h4>
        ${TASK2.principles.map((p) => `<div class="d-pref"><b>${esc(p.name)}</b><small>${esc(p.short)}</small></div>`).join("")}
        <button class="d-link" data-d="guide">가이드 전문 보기 (DAYEON_UIUX_가이드.pdf)</button>
      </div>
    </aside>
    <main class="d-center scroll">
      <div class="d-intro"><h3>발견한 문제는 어떤 원칙과 관련 있나요?</h3><p>검수 목록의 항목마다 관련 있다고 생각하는 원칙을 1개 이상 고르세요. 하나의 문제에 여러 원칙이 관련될 수 있습니다.</p></div>
      ${cards || `<div class="d-empty big">검수 탭에서 먼저 문제를 찾아 주세요.</div>`}
    </main>
    <aside class="d-right">
      <div class="d-right-head"><h3>분석 현황</h3><span>${uniq.filter((sp) => (s.principles[sp.id] || []).length).length}/${uniq.length}</span></div>
      <p class="d-tip">모든 항목에 원칙을 고른 뒤 결과를 확인하세요. 맞고 틀림보다 '왜 그 원칙인지'를 함께 이야기해 보세요.</p>
      <div class="d-right-foot">
        ${showResult
          ? `<div class="d-done">분석 결과가 공개되었습니다. 다음은 <b>디자인 수정</b> 탭입니다.</div><button class="d-cta" data-dtab="edit">디자인 수정으로</button>`
          : checked
            ? `<div class="d-done">원칙 분석을 확정했습니다. 결과·해설은 교사가 공개할 때 표시됩니다.</div><button class="d-cta" data-dtab="edit">디자인 수정으로</button><button class="d-cta secondary" data-d="reopenPrinciples">다시 고르기</button>`
            : `<button class="d-cta" data-d="checkPrinciples" ${uniq.length && uniq.every((sp) => (s.principles[sp.id] || []).length) ? "" : "disabled"}>분석 완료</button><p class="d-tip">모든 항목에 원칙을 1개 이상 고르면 활성화됩니다. 정답은 교사 해설 때 확인합니다.</p>`}
      </div>
    </aside>`;
}

// =====================================================================
//  MISSION C — 디자인 수정
// =====================================================================
function currentDesign() {
  const s = T2();
  if (!s.design) s.design = { ...TASK2.v2 };   // 현재 운영 화면에서 출발
  return s.design;
}
function editTabHTML() {
  const dv = DV();
  const s = T2();
  const d = currentDesign();
  const reviewed = s.designReviewed || {};
  const left = `<aside class="d-left edit">
    <div class="d-sec"><h4>페이지</h4>${TASK2.pages.map((p) => `<button class="d-page ${dv.page === p.id ? "is-active" : ""}" data-dpage="${p.id}"><i></i>${p.label}</button>`).join("")}</div>
    <div class="d-sec"><h4>보기</h4><div class="d-seg"><button class="${!dv.compare ? "on" : ""}" data-dcmp="0">수정안만</button><button class="${dv.compare ? "on" : ""}" data-dcmp="1">수정 전 / 후</button></div></div>
    ${TASK2.options.map((o) => `
      <div class="d-sec opt ${reviewed[o.id] ? "done" : ""}">
        <h4>${esc(o.title)} <small>${esc(o.group)}</small></h4>
        ${o.choices.map((c) => `<label class="d-choice ${d[o.id] === c.id ? "on" : ""}"><input type="radio" name="opt-${o.id}" value="${c.id}" data-opt="${o.id}" ${d[o.id] === c.id ? "checked" : ""} ${s.designApplied ? "disabled" : ""}><span>${esc(c.label)}</span></label>`).join("")}
      </div>`).join("")}
  </aside>`;

  const page = dv.page;
  const center = dv.compare
    ? `<div class="d-compare"><div><div class="d-cap">수정 전 (현재 운영)</div>${previewHTML(TASK2.v2, page)}</div><div><div class="d-cap">수정 후 (내 선택)</div>${previewHTML(d, page)}</div></div>`
    : `<div class="d-single"><div class="d-cap">실시간 미리보기 · ${TASK2.pages.find((p) => p.id === page).label}</div>${previewHTML(d, page)}</div>`;

  const results = TASK2.options.map((o) => {
    const c = choiceInfo(o.id, d[o.id]);
    const ok = !!reviewed[o.id];
    return `<li class="d-res ${ok ? "done" : ""}">
      <div class="d-res-top"><b>${esc(o.title)}</b>${ok ? `<span class="d-st ok">검토</span>` : `<span class="d-st wait">미검토</span>`}</div>
      ${c ? `<div class="d-res-choice">${c.verdict ? `<span class="d-v ${c.verdict}">${esc(c.verdict)}</span>` : ""}${esc(c.label)}</div>${c.why ? `<div class="d-res-why">${esc(c.why)}</div>` : `<div class="d-res-why dim">선택 이유를 팀에서 이야기해 보세요. 평가는 교사 해설 공개 후 표시됩니다.</div>`}` : ""}
    </li>`;
  }).join("");
  const allReviewed = TASK2.options.every((o) => reviewed[o.id]);
  const nReviewed = TASK2.options.filter((o) => reviewed[o.id]).length;

  return `${left}
    <main class="d-center">${center}</main>
    <aside class="d-right">
      <div class="d-right-head"><h3>적용 결과</h3><span>${nReviewed}/${TASK2.options.length} 검토</span></div>
      <p class="d-tip">왼쪽에서 옵션을 바꾸면 미리보기가 바로 바뀝니다. 각 옵션은 한 번 이상 바꿔 보며 검토해야 적용할 수 있습니다.</p>
      <ol class="d-results">${results}</ol>
      <div class="d-right-foot">
        ${s.designApplied
          ? (G.live
              ? `<div class="d-done">팀 수정안이 확정되었습니다. 공식 TICKET ON 반영은 교사가 결정합니다. 이제 <b>검수 보고서</b>를 작성하세요.</div><button class="d-cta" data-d="openReport">검수 보고서 작성</button>`
              : `<div class="d-done">TICKET ON 운영 사이트에 적용되었습니다. 결과를 확인하고 <b>검수 보고서</b>를 작성하세요.</div><button class="d-cta" data-d="openTicket">TICKET ON에서 확인</button><button class="d-cta secondary" data-d="openReport">검수 보고서 작성</button>`)
          : `<button class="d-cta" data-d="apply" ${allReviewed ? "" : "disabled"}>디자인 수정 적용</button><p class="d-tip">필수 개선 항목 ${TASK2.options.length}개를 모두 검토하면 활성화됩니다. 적용하면 TICKET ON 테스트 사이트에 반영됩니다.</p>`}
      </div>
    </aside>`;
}

function applyDesign() {
  const s = T2();
  const d = currentDesign();
  s.designApplied = true;
  if (G.live) {
    // 수업 모드: 팀 수정안 확정만. 공식 TICKET ON 반영은 교사가 결정
    G.save();
    toast({ title: "DAYEON DESIGN", sub: "수정안 확정", text: "팀 수정안이 저장되었습니다. 공식 서비스 반영 여부는 검토 후 결정됩니다. 미리보기는 이 화면에서 계속 볼 수 있습니다.", app: "design" });
    renderDesign();
    return;
  }
  G.state.ticketDesign = { ...d, poster: TASK2.v4.poster, stage: TASK2.v4.stage, heart: TASK2.v4.heart };   // 선택 항목은 학생 선택, 장식은 v4 기준
  G.save();
  if (typeof ttLog === "function") ttLog("디자인 수정 적용 (TASK-002): " + TASK2.options.map((o) => `${o.id}=${d[o.id]}`).join(", "), "note");
  toast({ title: "DAYEON DESIGN", sub: "적용 완료", text: "수정안이 TICKET ON 테스트 사이트에 반영되었습니다. 화면 스타일만 바뀌며, 기능 동작은 그대로입니다.", app: "ticket" });
  renderDesign();
}

// =====================================================================
//  이벤트
// =====================================================================
designAppEl.addEventListener("click", (e) => {
  const dv = DV();
  const s = T2();
  const t = (sel) => e.target.closest(sel);

  if (t("[data-d='back']")) { showApp("task"); return; }
  if (t("[data-d='guide']")) { G.state.taskView = { view: "guide", taskNo: 2 }; showApp("task"); return; }
  if (t("[data-d='openTicket']")) { showApp("ticket"); return; }
  if (t("[data-d='openReport']")) { G.state.taskView = { view: "report", taskNo: 2 }; showApp("task"); return; }
  const tab = t("[data-dtab]");
  if (tab) { dv.tab = tab.dataset.dtab; dv.compare = false; G.save(); renderDesign(); return; }
  const pg = t("[data-dpage]");
  if (pg) { dv.page = pg.dataset.dpage; G.save(); renderDesign(); return; }
  const ver = t("[data-dver]");
  if (ver) { if (ver.dataset.dver === "compare") dv.compare = true; else { dv.compare = false; dv.version = ver.dataset.dver; } G.save(); renderDesign(); return; }
  const cmp = t("[data-dcmp]");
  if (cmp) { dv.compare = cmp.dataset.dcmp === "1"; G.save(); renderDesign(); return; }

  // 검수: 요소 클릭 → 목록에 추가
  const spot = t("[data-spot]");
  if (spot && dv.tab === "review") {
    const id = spot.dataset.spot;
    const sp = spotInfo(id);
    const page = dv.page;
    const exist = s.findings.find((f) => f.spotId === id);
    if (exist) { dLocal.hl = exist.id; toast({ title: "DAYEON DESIGN", sub: "검수", text: `'${sp.label}'은(는) 이미 검수 목록에 있습니다.` }); renderDesign(); return; }
    if (s.findingsDone) { toast({ title: "DAYEON DESIGN", sub: "검수", text: "검수 목록을 확정한 상태입니다. 바꾸려면 '목록 다시 열기'를 누르세요." }); return; }
    const f = { id: "f-" + Date.now(), spotId: id, page, note: "", time: fmtMinutes(nowMinutes()) };
    s.findings.push(f);
    dLocal.hl = f.id;
    G.save();
    renderDesign();
    return;
  }
  const del = t("[data-find-del]");
  if (del) {
    if (s.findingsDone) return;
    s.findings = s.findings.filter((f) => f.id !== del.dataset.findDel);
    G.save(); renderDesign(); return;
  }
  if (t("[data-d='reveal']")) {
    if (!s.findings.length) return;
    s.findingsDone = true; G.save(); renderDesign();
    toast({ title: "DAYEON DESIGN", sub: "검수 완료", text: "검수 목록을 확정했습니다. 다음은 원칙 분석 탭입니다. 결과·해설은 교사가 공개하면 표시됩니다." });
    return;
  }
  if (t("[data-d='reopen']")) {
    if (answerKey()) return;
    s.findingsDone = false; G.save(); renderDesign(); return;
  }

  // 원칙 분석
  const chip = t("[data-pr]");
  if (chip && !chip.disabled) {
    const arr = s.principles[chip.dataset.pr] = s.principles[chip.dataset.pr] || [];
    const i = arr.indexOf(chip.dataset.pid);
    i >= 0 ? arr.splice(i, 1) : arr.push(chip.dataset.pid);
    G.save(); renderDesign(); return;
  }
  if (t("[data-d='checkPrinciples']")) {
    s.principlesChecked = true; G.save(); renderDesign();
    toast({ title: "DAYEON DESIGN", sub: "원칙 분석", text: answerKey() ? "분석 결과와 해설이 공개되었습니다." : "원칙 분석을 확정했습니다. 다음은 디자인 수정 탭입니다." });
    return;
  }
  if (t("[data-d='reopenPrinciples']")) {
    if (answerKey()) return;
    s.principlesChecked = false; G.save(); renderDesign(); return;
  }

  // 디자인 수정 적용
  if (t("[data-d='apply']")) { applyDesign(); return; }
});

designAppEl.addEventListener("input", (e) => {
  const note = e.target.closest("[data-find-note]");
  if (note) {
    const f = T2().findings.find((x) => x.id === note.dataset.findNote);
    if (f) { f.note = note.value; G.save(); }
  }
});
designAppEl.addEventListener("change", (e) => {
  const opt = e.target.closest("[data-opt]");
  if (opt) {
    const s = T2();
    const d = currentDesign();
    d[opt.dataset.opt] = opt.value;
    s.designReviewed = s.designReviewed || {};
    s.designReviewed[opt.dataset.opt] = true;
    G.save();
    renderDesign();
  }
});

if (G.state.currentApp === "design") renderDesign();
