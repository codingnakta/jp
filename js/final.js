// =====================================================================
//  TASK-006 《퇴근 5분 전, 최후의 배포》 + 최종 엔딩 + 학생용 근무평가서
//  · DAYEON DEPLOY 확장: 배포 후보 비교 · 최종 QA(TICKET ON 실제 조작 결과 반영) · 배포 체크리스트·배포 실행 · 배포 후 확인
//  · DAYEON TASK: 출시 승인 회의 · 최종 검수 보고서 · 근무평가서 열람 · 퇴근하기
//  실제 배포·외부 인프라 변경 없음 (교육용 가상 배포)
// =====================================================================

const T6 = () => G.state.task6;
const fLocal = { confirm: false, timer: null, doc: "notes", docCand: "v1.0.5" };

function qa6Event(name) {
  const t6 = G.state.task6; if (!t6 || !t6.started || t6.done) return;
  if (!t6.qaEvents[name]) { t6.qaEvents[name] = fmtMinutes(nowMinutes()); G.save(); }
}
function opsNav6() { return [["candidates", "배포 후보", "⬒"], ["finalqa", "최종 QA", "✓"], ["release", "배포 실행", "⇧"], ["docs", "릴리스 문서", "¶"]]; }
function candidate6() { return TASK6.candidates.find((c) => c.id === (T6().candidate || {}).id) || null; }

// ---------- 배포 후보 ----------
function opsView6HTML(view) {
  if (view === "candidates") return candidatesHTML();
  if (view === "finalqa") return finalQaHTML();
  if (view === "release") return releaseHTML();
  if (view === "docs") return docs6HTML();
  return "";
}
function candidatesHTML() {
  const v = OV(); const s = T6();
  const sel = TASK6.candidates.find((c) => c.id === v.sel) || candidate6() || null;
  const chosen = s.candidate || {};
  return `<div class="op-split2">
    <section class="op-list-pane">
      <div class="op-crumb">배포 후보 빌드 · ${TASK6.candidates.length}개 · 현재 운영: v1.0.2 (b-1002-c91e) + 핫픽스 · 테스트: v1.0.5 (b-1005-a2d8)</div>
      <ul class="op-cands">${TASK6.candidates.map((c) => `<li class="${sel && sel.id === c.id ? "sel" : ""} ${chosen.id === c.id ? "chosen" : ""}" data-op-cand="${c.id}"><div class="op-c-top"><b class="op-ver">${c.id}</b><code>${c.buildId}</code>${c.latest ? `<span class="op-pill latest">최신</span>` : ""}${chosen.id === c.id ? `<span class="op-pill chosen">선택됨</span>` : ""}</div><small>${esc(c.builtAt)} · ${esc(c.by)} · ${esc(c.branch)} · 디자인 ${esc(c.design)}</small><p>${esc(c.summary)}</p></li>`).join("")}</ul>
      <div class="op-notes"><div class="op-cap">배포 후보 선택 기록</div>
        ${chosen.id ? `<div class="op-chosen"><b>선택한 빌드: ${esc(chosen.id)}</b><p>이유: ${esc(chosen.reason || "-")}</p><p>확인한 증거: ${esc(chosen.evidence || "-")}</p><p>배포 전 추가 확인: ${esc(chosen.extra || "-")}</p><small>${esc(chosen.at || "")} · 검증 과정에서 다시 바꿀 수 있습니다.</small></div>` : `<p class="dim" style="padding:0 12px 8px">오른쪽에서 빌드를 비교하고 [이 빌드를 배포 후보로 선택]을 누르세요. 버전 번호가 아니라 QA·승인 기록을 확인하세요.</p>`}
      </div>
    </section>
    <aside class="op-detail-pane">${sel ? `<div class="op-detail">
      <div class="op-c-top"><b class="op-ver big">${sel.id}</b><code>${sel.buildId}</code>${sel.latest ? `<span class="op-pill latest">최신</span>` : ""}</div>
      <p class="op-sum">${esc(sel.summary)}</p>
      <div class="op-row"><span>빌드 생성</span><b>${esc(sel.builtAt)} · ${esc(sel.by)}</b></div>
      <div class="op-row"><span>브랜치 · 커밋</span><b>${esc(sel.branch)}</b></div>
      <div class="op-row"><span>디자인</span><b>${esc(sel.design)}</b></div>
      <div class="op-row"><span>QA 기록</span><b class="${sel.qa.status === "none" ? "warn" : ""}">${esc(sel.qa.label)}</b></div>
      <div class="op-row"><span>QA 비고</span><b>${esc(sel.qa.note)}</b></div>
      <div class="op-row"><span>배포 승인</span><b class="${sel.approval.status === "none" ? "warn" : ""}">${esc(sel.approval.label)}</b></div>
      <div class="op-cap">포함된 변경</div>${sel.includes.length ? `<ul class="op-ul">${sel.includes.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : `<p class="dim">기본 기능만</p>`}
      ${sel.excludes.length ? `<div class="op-cap">포함되지 않은 변경</div><ul class="op-ul warn">${sel.excludes.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
      <div class="op-cap">릴리스 노트</div><pre class="op-md">${esc(sel.notes.join("\n"))}</pre>
      <div class="op-actions"><button class="op-btn primary" data-op="cand-pick" data-cand="${sel.id}">${chosen.id === sel.id ? "선택 기록 수정" : "이 빌드를 배포 후보로 선택"}</button></div>
      ${s.candEdit === sel.id ? `<div class="op-form">
        <label>이 빌드를 선택한 이유<textarea id="c6-reason" rows="2">${esc(chosen.id === sel.id ? chosen.reason || "" : "")}</textarea></label>
        <label>확인한 증거 (QA·승인·릴리스 노트 등)<textarea id="c6-evidence" rows="2">${esc(chosen.id === sel.id ? chosen.evidence || "" : "")}</textarea></label>
        <label>배포 전에 추가 확인할 사항<textarea id="c6-extra" rows="2">${esc(chosen.id === sel.id ? chosen.extra || "" : "")}</textarea></label>
        <div class="op-actions"><button class="op-btn" data-op="cand-cancel">취소</button><button class="op-btn primary" data-op="cand-save" data-cand="${sel.id}">저장</button></div></div>` : ""}
    </div>` : `<div class="op-empty">왼쪽에서 빌드를 선택하면 상세 정보가 표시됩니다.</div>`}</aside>
  </div>`;
}

// ---------- 최종 QA ----------
function evalFinalQA() {
  const s = T6(); const ev = s.qaEvents || {};
  const code = typeof currentPayCode === "function" ? currentPayCode() : {}; const ui = typeof currentPayUi === "function" ? currentPayUi() : {};
  const reserveOk = typeof reserveWorks === "function" ? reserveWorks() : false;
  const obs = s.qaObs || {};
  const results = {};
  const o1 = obs["QA-001"];
  results["QA-001"] = !ev.showVisited ? { status: "NOT RUN", detail: "TICKET ON 공연 상세 화면을 아직 열지 않았습니다." } : !o1 || !o1.verdict ? { status: "NOT RUN", detail: "관찰 기록과 판정을 입력하세요." } : { status: o1.verdict, detail: `관찰: ${o1.note || ""}` };
  const o2 = obs["QA-002"];
  results["QA-002"] = !ev.mobileViewed ? { status: "NOT RUN", detail: "TICKET ON [모바일 보기]로 확인하지 않았습니다." } : !o2 || !o2.verdict ? { status: "NOT RUN", detail: "관찰 기록과 판정을 입력하세요." } : { status: o2.verdict, detail: `관찰: ${o2.note || ""}` };
  results["QA-003"] = !ev.reserveClicked && !ev.reserveFailed ? { status: "NOT RUN", detail: "공연 상세에서 예매하기를 아직 누르지 않았습니다." } : reserveOk && ev.reserveClicked ? { status: "PASS", detail: `예매하기 클릭 → 좌석 선택 이동 (${ev.reserveClicked})` } : { status: "FAIL", detail: "예매하기 버튼이 반응하지 않습니다 (이벤트 리스너 미등록)." };
  results["QA-004"] = !ev.rapidTested ? { status: "NOT RUN", detail: "결제 확인에서 연속 클릭 테스트를 하지 않았습니다 (시나리오 C)." } : code.client && code.server ? { status: "PASS", detail: `반복 요청 차단 · 서버 멱등성 확인 (${ev.rapidTested})` } : { status: "FAIL", detail: `같은 결제 시도가 여러 번 처리될 수 있습니다 (가드 ${code.client ? "○" : "×"} · 멱등성 ${code.server ? "○" : "×"})` };
  results["QA-005"] = !ev.failTested ? { status: "NOT RUN", detail: "시나리오 B(결제 실패)로 결제하지 않았습니다." } : ev.failShown && code.branch && ui.processing !== "none" && ui.fail !== "none" && ui.pending !== "none" ? { status: "PASS", detail: `처리 중 표시 · 실패 안내 · 결과 일치 (${ev.failShown})` } : { status: "FAIL", detail: `${!ev.failShown ? "실패했는데 완료처럼 표시됨" : ""}${ui.processing === "none" ? " · 처리 중 표시 없음" : ""}${ui.fail === "none" ? " · 실패 안내 없음" : ""}${ui.pending === "none" ? " · 확인 필요 안내 없음" : ""}`.replace(/^ · /, "") || "결과 표시 불일치" };
  results["QA-006"] = !ev.paidOk ? { status: "NOT RUN", detail: "시나리오 A로 결제를 끝까지 진행하지 않았습니다." } : !ev.mypageAfterPaid ? { status: "NOT RUN", detail: "결제 후 마이페이지 예매 내역을 확인하지 않았습니다." } : reserveOk && code.branch ? { status: "PASS", detail: `공연 → 좌석 → 결제 → 결과 → 예매 내역 일치 (${ev.mypageAfterPaid})` } : { status: "FAIL", detail: "흐름 중 오류가 남아 있습니다." };
  const ids = TASK6.qaCases.map((c) => c.id);
  const passed = ids.filter((id) => results[id].status === "PASS").length;
  const run = ids.filter((id) => results[id].status !== "NOT RUN").length;
  s.qa = { at: fmtMinutes(nowMinutes()), results, passed, run, total: ids.length, allPass: passed === ids.length, runs: (s.qa ? s.qa.runs || 0 : 0) + 1 };
  G.save();
  return s.qa;
}
function finalQaHTML() {
  const v = OV(); const s = T6();
  if (!s.qa) evalFinalQA();
  const q = s.qa;
  const sel = TASK6.qaCases.find((c) => c.id === v.sel) || TASK6.qaCases[0];
  const r = q.results[sel.id]; const obs = (s.qaObs || {})[sel.id] || {};
  const cls = (st) => st === "PASS" ? "ok" : st === "FAIL" ? "bad" : "na";
  return `<div class="op-qa">
    <div class="op-qa-top"><div><small>프로젝트</small><b>TICKET ON · 최종 QA</b></div><div><small>테스트 대상</small><b>테스트 환경(Staging) · ${TASK6.stagingBuild} <code>b-1005-a2d8</code></b></div><div><small>진행률</small><b>${q.run}/${q.total} 실행</b><div class="op-bar"><i style="width:${q.run / q.total * 100}%"></i></div></div><div><small>결과</small><b class="${q.allPass ? "ok" : q.passed ? "" : "bad"}">${q.passed} PASS · ${q.run - q.passed} FAIL · ${q.total - q.run} NOT RUN</b></div><button class="op-btn primary" data-op="qa-run">QA 결과 갱신</button></div>
    <div class="op-split2">
      <section class="op-list-pane"><table class="op-table"><thead><tr><th>ID</th><th>테스트</th><th>영역</th><th>방식</th><th>결과</th></tr></thead><tbody>
        ${TASK6.qaCases.map((c) => `<tr class="${sel.id === c.id ? "sel" : ""}" data-op-qa="${c.id}"><td>${c.id}</td><td><b>${esc(c.name)}</b></td><td>${esc(c.area)}</td><td>${c.kind === "observe" ? "관찰 기록" : "자동 판정"}</td><td><span class="op-res ${cls(q.results[c.id].status)}">${q.results[c.id].status}</span></td></tr>`).join("")}
      </tbody></table>
      <p class="dim" style="padding:10px 12px;margin:0">자동 판정 항목은 TICKET ON을 실제로 조작한 결과(예매 클릭·결제 요청·화면 표시)와 현재 공식 서비스 상태로 판정합니다. 버그가 남아 있으면 실패합니다. 디자인 항목은 관찰 기록을 남기고 판정하며 교사가 확인합니다.</p></section>
      <aside class="op-detail-pane"><div class="op-detail">
        <div class="op-detail-head"><div><b>${sel.id} · ${esc(sel.name)}</b><small>${esc(sel.area)} · ${sel.kind === "observe" ? "관찰 기록" : "자동 판정"}</small></div><span class="op-res ${cls(r.status)}">${r.status}</span></div>
        <div class="op-cap">테스트 단계</div><ol class="op-ol">${sel.steps.map((st) => `<li>${esc(st)}</li>`).join("")}</ol>
        <div class="op-row"><span>기대 결과</span><b>${esc(sel.expect)}</b></div>
        <div class="op-row"><span>실행 결과</span><b>${esc(r.detail)}</b></div>
        ${sel.kind === "observe" ? `<div class="op-form"><label>관찰 기록<textarea id="qa6-note" rows="3" placeholder="무엇을 확인했고 어떻게 보였는지">${esc(obs.note || "")}</textarea></label>
          <div class="op-radio"><label><input type="radio" name="qa6-verdict" value="PASS" ${obs.verdict === "PASS" ? "checked" : ""}> PASS</label><label><input type="radio" name="qa6-verdict" value="FAIL" ${obs.verdict === "FAIL" ? "checked" : ""}> FAIL</label></div>
          <div class="op-actions"><button class="op-btn" data-op="qa-ticket" data-screen="show">TICKET ON 열기</button><button class="op-btn primary" data-op="qa-obs-save" data-case="${sel.id}">기록 저장 · 판정</button></div></div>`
        : `<div class="op-actions"><button class="op-btn primary" data-op="qa-ticket" data-screen="${sel.id === "QA-003" || sel.id === "QA-006" ? "show" : "checkout"}">TICKET ON에서 실행</button><button class="op-btn" data-op="qa-run">결과 갱신</button></div>`}
      </div></aside>
    </div>
  </div>`;
}

// ---------- 배포 체크리스트 · 배포 실행 · 배포 후 확인 ----------
function releaseChecklist() {
  const s = T6(); const c = candidate6(); const q = s.qa || { results: {} }; const r = q.results || {};
  const st = (id) => (r[id] || {}).status;
  const m = s.meeting || {};
  return [
    { id: "build", ok: !!(c && c.approval.release), detail: c ? (c.approval.release ? `${c.id} · ${c.approval.label}` : `${c.id} · ${c.approval.label}`) : "배포 후보를 선택하지 않았습니다" },
    { id: "qa", ok: !!(c && c.qa.final), detail: c ? `${c.id} · ${c.qa.label}${c.qa.final ? "" : " (최종 QA 아님)"}` : "-" },
    { id: "design", ok: st("QA-001") === "PASS" && st("QA-002") === "PASS", detail: `QA-001 ${st("QA-001") || "-"} · QA-002 ${st("QA-002") || "-"}` },
    { id: "func", ok: ["QA-003", "QA-004", "QA-005", "QA-006"].every((id) => st(id) === "PASS"), detail: ["QA-003", "QA-004", "QA-005", "QA-006"].map((id) => `${id.slice(3)} ${st(id) || "-"}`).join(" · ") },
    { id: "approval", ok: m.decision === "approve" && s.review.status === "approved", detail: `회의 결정 ${m.decision === "approve" ? "출시 승인" : m.decision === "hold" ? "보류" : "미정"} · 팀장(교사) 승인 ${s.review.status === "approved" ? "완료" : "대기"}` },
    { id: "rollback", ok: !!(s.qaEvents.rollbackViewed && (m.response || "").trim().length >= 10), detail: `복구 절차 ${s.qaEvents.rollbackViewed ? "확인" : "미확인"} · 대응 방안 ${(m.response || "").trim() ? "작성" : "미작성"}` },
  ];
}
function releaseState() {
  if (G.live) { const p = (typeof Live !== "undefined" && Live.public) || {}; return p.release || { status: "none" }; }
  return T6().release || { status: "none" };
}
function releaseLogLines(rel) {
  const c = TASK6.candidates.find((x) => x.id === rel.build) || {};
  const elapsed = rel.startedAt ? Date.now() - rel.startedAt : 0;
  const base = new Date(rel.startedAt || Date.now());
  const n = rel.status === "done" ? TASK6.deployLog.length : Math.min(TASK6.deployLog.length, Math.floor(elapsed / 900) + 1);
  return TASK6.deployLog.slice(0, n).map((l, i) => { const d = new Date(base.getTime() + i * 900); return `[${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}] ` + l.replace("{BUILD}", c.buildId || "").replace("{VERSION}", rel.build || ""); });
}
function releaseDone() { const rel = releaseState(); return rel.status === "done" || (rel.status === "deploying" && Date.now() - (rel.startedAt || 0) >= TASK6.deployLog.length * 900 + 600); }
function releaseHTML() {
  const s = T6(); const c = candidate6(); const list = releaseChecklist(); const allOk = list.every((x) => x.ok);
  const rel = releaseState(); const done = releaseDone();
  if (rel.status === "deploying" && !done) { clearTimeout(fLocal.timer); fLocal.timer = setTimeout(() => { if (!opsAppEl.hidden && OV().view === "release") renderOps(); }, 900); }
  if (rel.status === "deploying" && done && !G.live) { s.release.status = "done"; s.release.doneAt = Date.now(); G.save(); }
  const chk = `<div class="op-check"><div class="op-cap">배포 전 체크리스트 <small>실제 기록으로 자동 반영</small></div><ul>${list.map((x) => { const def = TASK6.checklist.find((d) => d.id === x.id); return `<li class="${x.ok ? "ok" : "bad"}"><i>${x.ok ? "✓" : "✕"}</i><div><b>${esc(def.label)}</b><small>${esc(x.detail)}</small></div></li>`; }).join("")}</ul></div>`;
  const head = `<div class="op-envs"><div class="op-env production"><div class="op-env-top"><b>배포 대상 · 운영 (Production)</b><span class="op-status ${rel.status === "none" ? "pending" : "running"}">● ${rel.status === "none" ? "배포 대기" : done ? "배포 완료" : "배포 중"}</span></div><div class="op-env-url">ticketon.dayeon.co.kr</div><div class="op-env-ver">${done ? esc(rel.build) : "v1.0.2"} <code>${done ? esc((TASK6.candidates.find((x) => x.id === rel.build) || {}).buildId || "") : "b-1002-c91e"}</code></div><small>${done ? `배포 ${new Date(rel.startedAt).toLocaleTimeString("ko-KR")} · ${esc(rel.by || "김팀장")}` : "현재 운영 중인 버전 (사고 당시 빌드 + 핫픽스)"}</small></div>
    <div class="op-env staging"><div class="op-env-top"><b>선택된 빌드</b><span class="op-status ${allOk ? "running" : "pending"}">● ${c ? (allOk ? "검증 완료" : "검증 미완료") : "미선택"}</span></div><div class="op-env-url">${c ? esc(c.branch) : "-"}</div><div class="op-env-ver">${c ? c.id : "-"} <code>${c ? c.buildId : ""}</code></div><small>담당 이서연 · 승인 ${s.review.status === "approved" ? "팀장 승인 완료" : "팀장 승인 대기 (보고서 제출 후)"} · 배포 담당 김팀장</small></div></div>`;
  let body;
  if (rel.status === "none") {
    body = `${chk}<div class="op-actions big">${s.release && s.release.requested ? `<div class="op-wait">배포 요청을 제출했습니다 (${esc(s.release.build)}). 팀장(교사)의 승인·실행을 기다리는 중입니다.</div>` : `<button class="op-btn primary big" data-op="deploy-open" ${c ? "" : "disabled"}>운영 환경에 배포하기</button><p class="dim">버튼을 누르면 최종 확인창이 표시됩니다. 실제 배포는 팀장(교사)의 승인으로 실행됩니다.</p>`}</div>`;
  } else {
    body = `<div class="op-cap">배포 작업 로그 <small>${rel.build} → production${done ? " · 완료" : " · 진행 중"}</small></div><pre class="op-log live">${releaseLogLines(rel).map((l) => `<span class="${/successful|passed|completed/.test(l) ? "ok" : ""}">${esc(l)}</span>`).join("\n")}${done ? "" : "\n<span class='cur'>▌</span>"}</pre>
      ${done ? postCheckHTML(rel) : `<p class="dim">배포가 진행되는 동안 화면을 유지하세요.</p>`}`;
  }
  return `<div class="op-release">${head}${body}${fLocal.confirm ? deployConfirmHTML(list, allOk) : ""}</div>`;
}
function deployConfirmHTML(list, allOk) {
  const c = candidate6(); const s = T6();
  const fails = list.filter((x) => !x.ok);
  return `<div class="op-modal-bg" data-op="deploy-close"><div class="op-modal wide">
    <h3>선택한 빌드를 운영 환경에 배포하시겠습니까?</h3>
    <div class="op-kv"><div><span>선택 버전</span><b>${c ? c.id : "-"} <code>${c ? c.buildId : ""}</code></b></div><div><span>검증 상태</span><b class="${allOk ? "ok" : "warn"}">${allOk ? "체크리스트 전부 통과" : `미통과 ${fails.length}건`}</b></div><div><span>배포 대상</span><b>운영 (Production)</b></div><div><span>예상 변경</span><b>${c ? esc(c.includes.slice(0, 2).join(", ") || "기본 기능") : "-"}</b></div></div>
    ${allOk ? `<p>배포 요청이 팀장(교사)에게 전달되고, 승인 후 배포가 실행됩니다.</p>` : `<div class="op-warnbox"><b>${c && !c.qa.final ? "이 빌드는 필수 QA 승인을 완료하지 않았습니다." : "배포 전 체크리스트를 통과하지 못했습니다."}</b><ul>${fails.map((x) => `<li>${esc(TASK6.checklist.find((d) => d.id === x.id).label)} — ${esc(x.detail)}</li>`).join("")}</ul><p>QA 자료와 빌드 기록을 다시 확인하거나 적절한 버전을 선택하세요. 이전 업무의 저장 상태는 유지됩니다.</p></div>`}
    <div class="op-modal-actions"><button class="op-btn" data-op="deploy-close">${allOk ? "취소" : "돌아가서 다시 확인"}</button>${allOk ? `<button class="op-btn primary" data-op="deploy-request">배포 요청 제출</button>` : ""}</div>
  </div></div>`;
}
function postCheckHTML(rel) {
  const s = T6(); const c = TASK6.candidates.find((x) => x.id === rel.build) || {};
  const code = typeof currentPayCode === "function" ? currentPayCode() : {};
  const reserveOk = typeof reserveWorks === "function" ? reserveWorks() : false;
  const rows = [["현재 운영 중인 빌드", `${rel.build} (${c.buildId || ""})`, true], ["서비스 접속 상태", "200 OK · 응답 0.4s", true], ["예매 기능 상태", reserveOk ? "정상 (click 리스너 등록)" : "오류", reserveOk], ["가상 결제 처리 상태", code.client && code.server && code.branch ? "정상 (가드 · 멱등성 · 결과 분기)" : "점검 필요", !!(code.client && code.server && code.branch)], ["최근 오류 로그", "없음 (5분)", true], ["최종 헬스 체크", "3/3 통과", true]];
  return `<div class="op-post"><div class="op-cap">배포 후 운영 상태 확인 <small>배포 성공 ≠ 검증 완료. 직접 확인하고 보고합니다.</small></div>
    <table class="op-table"><tbody>${rows.map((r) => `<tr><th>${esc(r[0])}</th><td>${esc(r[1])}</td><td class="${r[2] ? "ok" : "warn"}">${r[2] ? "정상" : "확인 필요"}</td></tr>`).join("")}</tbody></table>
    <div class="op-actions">${s.postCheckDone ? `<div class="op-wait ok">배포 후 확인 완료 보고됨 (${esc(s.postCheckAt || "")})</div>` : `<button class="op-btn" data-op="qa-ticket" data-screen="show">TICKET ON에서 직접 확인</button><button class="op-btn primary" data-op="postcheck-done">배포 후 확인 완료 보고</button>`}</div></div>`;
}
function startOfficialRelease(build, by = "김팀장") {
  const s = T6();
  s.release = { requested: true, build, by, status: "deploying", startedAt: Date.now(), requestedAt: s.release ? s.release.requestedAt : Date.now() };
  G.save();
  toast({ title: "DAYEON DEPLOY", sub: "배포 시작", text: `팀장 승인 완료 · ${build} 운영 배포를 시작합니다.`, app: "ops" });
  if (!opsAppEl.hidden) renderOps();
}

// ---------- 릴리스 문서 ----------
function docs6HTML() {
  const s = T6(); const d = fLocal.doc;
  if (d === "rollback" && !s.qaEvents.rollbackViewed) { s.qaEvents.rollbackViewed = fmtMinutes(nowMinutes()); G.save(); }
  const tabs = [["notes", "release_notes.md"], ["qa", "QA_Final_Report"], ["design", "Design_Checklist"], ["deploy", "Deployment_Checklist"], ["rollback", "Rollback_Guide"]];
  let body;
  if (d === "notes") { const c = TASK6.candidates.find((x) => x.id === fLocal.docCand) || TASK6.candidates[2]; body = `<div class="op-doc-tabs sub">${TASK6.candidates.map((x) => `<button class="${c.id === x.id ? "on" : ""}" data-op-doccand="${x.id}">${x.id}</button>`).join("")}</div><pre class="op-md">${esc(c.notes.join("\n"))}</pre><p class="dim">빌드 ${c.buildId} · ${esc(c.builtAt)} · ${esc(c.by)}</p>`; }
  else { const doc = TASK6.docs[d]; body = `<h3>${esc(doc.title)} <small>${esc(doc.meta)}</small></h3><table class="op-table"><tbody>${doc.rows.map((r) => `<tr><th>${esc(r[0])}</th><td>${esc(r[1])}</td></tr>`).join("")}</tbody></table><p class="dim">${esc(doc.note)}</p>`; }
  return `<div class="op-doc"><div class="op-doc-tabs">${tabs.map(([k, l]) => `<button class="${d === k ? "on" : ""}" data-op-doc="${k}">${l}</button>`).join("")}</div>${body}</div>`;
}

// ---------- 이벤트 (ops.js 에서 위임) ----------
function opsAction6(a, el) {
  const s = T6(); const v = OV();
  if (a === "cand-pick") { s.candEdit = el.dataset.cand; v.sel = el.dataset.cand; renderOps(); return true; }
  if (a === "cand-cancel") { s.candEdit = null; renderOps(); return true; }
  if (a === "cand-save") {
    const reason = (document.getElementById("c6-reason").value || "").trim();
    if (!reason) { toast({ title: "DAYEON DEPLOY", text: "선택한 이유를 적어 주세요." }); return true; }
    s.candidate = { id: el.dataset.cand, reason, evidence: (document.getElementById("c6-evidence").value || "").trim(), extra: (document.getElementById("c6-extra").value || "").trim(), at: fmtMinutes(nowMinutes()) };
    s.candEdit = null; if (s.qa) s.qa.stale = true; G.save(); renderOps();
    toast({ title: "DAYEON DEPLOY", sub: "배포 후보", text: `${s.candidate.id} 를 배포 후보로 기록했습니다. 최종 QA와 체크리스트에서 검증합니다.` });
    return true;
  }
  if (a === "qa-run") { const q = evalFinalQA(); renderOps(); toast({ title: "최종 QA", text: `${q.passed} PASS · ${q.run - q.passed} FAIL · ${q.total - q.run} NOT RUN` }); return true; }
  if (a === "qa-ticket") { showApp("ticket"); const sc = el.dataset.screen || "show"; if (sc === "checkout" && !TU().seats.length) TU().seats = ["C3"]; if (sc === "checkout") TU().terms = true; goScreen(sc); return true; }
  if (a === "qa-obs-save") {
    const id = el.dataset.case; const note = (document.getElementById("qa6-note").value || "").trim(); const vd = (document.querySelector('input[name="qa6-verdict"]:checked') || {}).value;
    if (note.length < 10 || !vd) { toast({ title: "최종 QA", text: "관찰 기록(10자 이상)과 PASS/FAIL 판정을 입력하세요." }); return true; }
    s.qaObs = s.qaObs || {}; s.qaObs[id] = { note, verdict: vd, at: fmtMinutes(nowMinutes()) }; evalFinalQA(); renderOps(); return true;
  }
  if (a === "deploy-open") { fLocal.confirm = true; renderOps(); return true; }
  if (a === "deploy-close") { fLocal.confirm = false; renderOps(); return true; }
  if (a === "deploy-request") {
    fLocal.confirm = false;
    const c = candidate6(); s.release = { requested: true, build: c.id, requestedAt: Date.now(), status: "none" }; G.save();
    toast({ title: "DAYEON DEPLOY", sub: "배포 요청", text: `${c.id} 운영 배포 요청을 제출했습니다. 팀장(교사) 승인 후 배포가 실행됩니다.` });
    if (!G.live) setTimeout(() => startOfficialRelease(c.id), 2500);   // 솔로: 팀장 승인 자동
    renderOps(); return true;
  }
  if (a === "postcheck-done") {
    s.postCheckDone = true; s.postCheckAt = fmtMinutes(nowMinutes()); s.done = true; G.save(); renderOps();
    toast({ title: "DAYEON TASK", sub: "TASK-006", text: "배포 후 확인 완료를 보고했습니다. 마지막 업무가 완료되었습니다.", app: "task" });
    if (!G.live && typeof startFollowup9 === "function") setTimeout(startFollowup9, 1500);
    return true;
  }
  return false;
}
function opsClick6(e, t) {
  const v = OV();
  const c = t("[data-op-cand]"); if (c) { v.sel = c.dataset.opCand; renderOps(); return; }
  const q = t("[data-op-qa]"); if (q) { v.sel = q.dataset.opQa; renderOps(); return; }
  const d = t("[data-op-doc]"); if (d) { fLocal.doc = d.dataset.opDoc; renderOps(); return; }
  const dc = t("[data-op-doccand]"); if (dc) { fLocal.docCand = dc.dataset.opDoccand; renderOps(); return; }
}

// ---------- DAYEON TASK: 출시 승인 회의 (MISSION C) ----------
function renderMeeting6(t) {
  const s = TS(6); const q = s.qa || { results: {}, passed: 0, run: 0, total: 6 }; const c = candidate6(); const m = s.meeting || {};
  crumbEl.innerHTML = `<a data-tlist>나의 업무</a><span>/</span><a data-tdetail>업무 상세</a><span>/</span><b>최종 출시 검토 회의</b>`;
  const st = (id) => (q.results[id] || {}).status || "-";
  const a1 = c ? `${c.id} · QA ${c.qa.label} · 승인 ${c.approval.label} · 팀 최종 QA ${q.passed}/${q.total} PASS` : "배포 후보 미선택";
  const a2 = `디자인 QA-001 ${st("QA-001")} · QA-002 ${st("QA-002")} / 개발 QA-003 ${st("QA-003")} · QA-004 ${st("QA-004")} · QA-005 ${st("QA-005")} · QA-006 ${st("QA-006")}`;
  const a3 = `직전 정상 운영 빌드: v1.0.2 (b-1002-c91e) + 핫픽스 · 복구 절차 ${s.qaEvents.rollbackViewed ? "확인함" : "미확인 (Rollback_Guide)"}`;
  const ro = s.reportSubmitted && s.review.status !== "returned";
  taskContent.innerHTML = `<div class="t-page">
    <div class="t-viewer-head"><button class="btn" data-tdetail>← 업무로 돌아가기</button><div><h1>최종 출시 검토 회의</h1><span>현재 프로젝트 상태를 보고 팀이 출시 가능 여부를 판단합니다. 안건별 현황은 실제 기록에서 자동 반영됩니다.</span></div></div>
    <div class="t-agenda">${TASK6.agenda.map((a, i) => `<div class="t-agenda-item"><b>${esc(a.title)}</b><p>${esc(a.desc)}</p><div class="t-agenda-st">${esc([a1, a2, a3, m.decision ? (m.decision === "approve" ? "합의: 출시 진행" : "합의: 출시 보류") : "합의 전"][i])}</div></div>`).join("")}</div>
    <form class="t-card t-report" id="meeting-form" onsubmit="return false">
      <h3 style="margin:0 0 10px">합의 보고서</h3>
      <section class="t-rsec"><h3>1. 출시 승인 여부</h3><div class="t-radio"><label><input type="radio" name="decision" value="approve" ${m.decision === "approve" ? "checked" : ""} ${ro ? "disabled" : ""}> 출시 승인 (진행)</label><label><input type="radio" name="decision" value="hold" ${m.decision === "hold" ? "checked" : ""} ${ro ? "disabled" : ""}> 출시 보류</label></div></section>
      <section class="t-rsec"><h3>2. 승인 또는 보류한 이유</h3><textarea class="t-input" name="reason" rows="2" ${ro ? "disabled" : ""}>${esc(m.reason || "")}</textarea></section>
      <section class="t-rsec"><h3>3. 확인한 증거</h3><p class="t-help">QA 결과·빌드 기록·릴리스 노트 중 판단 근거</p><textarea class="t-input" name="evidence" rows="2" ${ro ? "disabled" : ""}>${esc(m.evidence || "")}</textarea></section>
      <section class="t-rsec"><h3>4. 남아 있는 위험 요소</h3><textarea class="t-input" name="risks" rows="2" ${ro ? "disabled" : ""}>${esc(m.risks || "")}</textarea></section>
      <section class="t-rsec"><h3>5. 문제 발생 시 대응 방안</h3><p class="t-help">롤백 대상 버전·절차·담당</p><textarea class="t-input" name="response" rows="2" ${ro ? "disabled" : ""}>${esc(m.response || "")}</textarea></section>
      ${ro ? "" : `<div class="t-ractions"><span class="t-help">자동 저장됨</span><button class="t-cta inline" data-open-report>최종 검수 보고서로</button></div>`}
    </form></div>`;
  const f = document.getElementById("meeting-form");
  const save = () => { const r = {}; f.querySelectorAll("textarea[name]").forEach((el) => (r[el.name] = el.value)); r.decision = (f.querySelector('input[name="decision"]:checked') || {}).value || null; s.meeting = { ...s.meeting, ...r, at: fmtMinutes(nowMinutes()) }; G.save(); };
  f.addEventListener("input", save); f.addEventListener("change", save);
}

// ---------- DAYEON TASK: 최종 검수 보고서 ----------
function renderReport6(t) {
  const s = TS(6);
  const { ro, html } = reportHead(t, s, "최종 검수 보고서");
  const c = candidate6(); const q = s.qa; const m = s.meeting || {}; const rel = releaseState();
  const d = (ro ? s.report : s.reportDraft) || { note: "" };
  const dis = ro ? "disabled" : "";
  taskContent.innerHTML = `<div class="t-page">
    ${html}
    <form class="t-card t-report" id="report-form" onsubmit="return false">
      <section class="t-rsec"><h3>① 배포 후보 선택 <small>자동 첨부</small></h3>${c ? `<ul class="t-applied"><li>선택한 빌드: <b>${c.id}</b> (${c.buildId})</li><li>이유: ${esc(s.candidate.reason || "-")}</li><li>확인한 증거: ${esc(s.candidate.evidence || "-")}</li><li>배포 전 추가 확인: ${esc(s.candidate.extra || "-")}</li></ul>` : `<p class="t-help">배포 후보를 아직 선택하지 않았습니다.</p>`}</section>
      <section class="t-rsec"><h3>② 최종 QA 결과 <small>자동 첨부</small></h3>${q ? `<ul class="t-applied">${TASK6.qaCases.map((x) => `<li>${x.id} ${esc(x.name)}: <b>${q.results[x.id].status}</b> — ${esc(q.results[x.id].detail)}</li>`).join("")}<li>실행 ${esc(q.at)} · ${q.passed}/${q.total} PASS</li></ul>` : `<p class="t-help">최종 QA를 실행하지 않았습니다.</p>`}</section>
      <section class="t-rsec"><h3>③ 출시 판단 <small>회의 합의 자동 첨부</small></h3>${m.decision ? `<ul class="t-applied"><li>결정: <b>${m.decision === "approve" ? "출시 승인" : "출시 보류"}</b></li><li>이유: ${esc(m.reason || "-")}</li><li>증거: ${esc(m.evidence || "-")}</li><li>남은 위험: ${esc(m.risks || "-")}</li><li>대응 방안: ${esc(m.response || "-")}</li></ul>` : `<p class="t-help">출시 승인 회의 합의가 없습니다.</p>`}</section>
      <section class="t-rsec"><h3>④ 배포 결과 <small>자동</small></h3><p class="t-help">${rel.status === "none" ? (s.release && s.release.requested ? "배포 요청 제출 · 팀장 승인 대기" : "배포 전 (보고서 승인 후 DAYEON DEPLOY에서 배포)") : rel.status === "done" || releaseDone() ? `배포 완료 · ${esc(rel.build)} · 배포 후 확인 ${s.postCheckDone ? "완료" : "미완료"}` : "배포 진행 중"}</p></section>
      <section class="t-rsec"><h3>⑤ 팀 의견 <small>선택</small></h3><textarea class="t-input" name="note" rows="2" placeholder="팀장에게 전달할 의견이나 요청" ${dis}>${esc(d.note || "")}</textarea></section>
      <div class="t-feedback" id="report-feedback" hidden></div>
      ${ro ? "" : `<div class="t-ractions"><span class="t-help" id="report-saved">자동 저장됨</span><button class="t-cta inline" data-submit-report="6">${s.review.status === "returned" ? "보완해서 다시 제출" : "출시 판단 보고서 제출"}</button></div>`}
    </form></div>`;
  if (!ro) bindDraft(s);
}
function validateReport6(r) {
  const s = TS(6); const p = []; const m = s.meeting || {};
  if (!candidate6()) p.push({ where: "MISSION A", msg: "배포 후보 빌드를 선택하고 이유를 기록하세요." });
  if (!s.qa || s.qa.run < s.qa.total) p.push({ where: "MISSION B", msg: "최종 QA 여섯 항목을 모두 실행(또는 관찰 기록)하세요." });
  if (!m.decision) p.push({ where: "MISSION C", msg: "출시 승인 여부를 결정하세요." });
  if (!(m.reason || "").trim()) p.push({ where: "MISSION C", msg: "승인 또는 보류한 이유를 작성하세요." });
  if (!(m.response || "").trim()) p.push({ where: "MISSION C", msg: "문제 발생 시 대응 방안을 작성하세요." });
  return p;
}

// ---------- 학생용 근무평가서 ----------
function renderEvalView() {
  const doc = G.state.evalDoc;
  crumbEl.innerHTML = `<b>근무평가서</b>`;
  if (!doc || doc.status !== "PUBLISHED") {
    taskContent.innerHTML = `<div class="t-page"><div class="t-empty-box ev-wait"><b>인사팀에서 근무평가서를 작성하고 있습니다.</b><br>잠시 기다려 주세요.${G.state.evalReady ? "" : "<br><small>평가서는 최종 배포 이후 발급됩니다.</small>"}</div></div>`;
    return;
  }
  if (!G.state.evalViewed) { G.state.evalViewed = true; G.save(); }
  const team = { name: G.live ? (G.live.teamName || "") : "신입 프로젝트팀 (이서연)", members: G.live ? `${G.live.teamName} 팀원` : "이서연 (신입사원)" };
  taskContent.innerHTML = `<div class="t-page ev-page">
    <div class="t-viewer-head no-print"><div><h1>신입사원 근무평가서</h1><span>인사팀 발급 · 이 팀의 활동 기록과 팀장 평가를 바탕으로 작성되었습니다.</span></div><div class="t-btns"><button class="btn" data-ev-print>인쇄</button><button class="btn" data-ev-print>PDF로 저장</button>${G.state.leaveApproved && !G.state.leftWork ? `<button class="btn primary" data-leave>퇴근하기</button>` : ""}</div></div>
    ${evalDocHTML(doc, team)}
    <div class="t-card no-print" style="margin-top:14px"><h3 style="margin:0 0 6px">평가 근거</h3><p class="t-help">각 역량 점수 옆의 근거는 이 팀의 실제 업무 기록(열람·기록·수정·테스트·보고서)에서 자동 집계된 뒤 팀장이 검토한 내용입니다. 칭호는 활동 기록과 팀장 평가를 근거로 지급됩니다.</p></div>
  </div>`;
}

// ---------- 퇴근하기 · 최종 엔딩 ----------
function leaveFab() {
  let el = document.getElementById("leave-fab");
  const show = G.state.leaveApproved && !G.state.leftWork;
  if (!show) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement("button"); el.id = "leave-fab"; el.className = "leave-fab"; el.innerHTML = `<b>퇴근하기</b><small>퇴근 승인됨</small>`; el.addEventListener("click", () => showFinalEnding("ending")); document.body.appendChild(el); }
}
function showFinalEnding(stage = "ending") {
  G.state.endingStage = stage; if (stage === "ending") G.state.leftWork = true; G.save();
  let el = document.getElementById("final-app");
  if (!el) { el = document.createElement("div"); el.id = "final-app"; el.className = "final-app"; document.body.appendChild(el); }
  leaveFab();
  const s = G.state; const done = [s.task, s.task2, s.task3, s.task4, s.task5, s.task6].filter((t) => t && t.done).length;
  const rel = releaseState(); const released = rel.status === "done" || releaseDone();
  const results = [["완료한 업무", `${done} / 6`, done === 6], ["고객사 프로젝트", released ? "출시 완료" : "출시 전", released], ["서비스 상태", released ? "정상" : "확인 전", released], ["디자인 검수", s.task2.done ? "완료" : "미완료", s.task2.done], ["개발 검수", s.task3.done && s.task4.done ? "완료" : "미완료", s.task3.done && s.task4.done], ["최종 배포", released ? "성공" : "-", released]];
  if (stage === "ending") {
    el.innerHTML = `<div class="final-box">
      <div class="final-kicker">다연컴퍼니 · DAYEON WORK</div>
      <h1 class="final-title">신입인데 퇴근하겠습니다</h1>
      <p class="final-msg typing" id="final-msg"></p>
      <div class="final-grid">${results.map((r) => `<div class="final-stat ${r[2] ? "ok" : ""}"><span>${esc(r[0])}</span><b>${esc(r[1])}</b></div>`).join("")}</div>
      <div class="final-summary"><h3>오늘의 업무</h3><ol>${EVAL.summary.map((x, i) => `<li class="${[s.task, s.task2, s.task3, s.task4, s.task5, s.task6][i].done ? "ok" : ""}"><i>${[s.task, s.task2, s.task3, s.task4, s.task5, s.task6][i].done ? "✓" : "·"}</i>TASK-00${i + 1} ${esc(x)}</li>`).join("")}</ol></div>
      ${s.evalDoc && s.evalDoc.status === "PUBLISHED" ? `<div class="final-titles">${(s.evalDoc.titles || []).map((id, i) => { const t = EVAL.titles.find((x) => x.id === id); return t ? `<span class="${i === 0 ? "main" : ""}">${esc(t.name)}</span>` : ""; }).join("")}</div>` : ""}
      <button class="final-btn" data-final="logout">오늘의 업무 종료</button>
    </div>`;
    typeText(document.getElementById("final-msg"), "축하합니다. 오늘은 정시 퇴근입니다.\n첫 출근부터 고생 많으셨습니다.");
  } else {
    el.innerHTML = `<div class="final-box dark">
      <p class="final-logout">DAYEON WORK에서 로그아웃되었습니다.<br>오늘도 고생 많으셨습니다.</p>
      <div class="final-after" id="final-after"></div>
      <div class="final-tbc" id="final-tbc" hidden>TO BE CONTINUED</div>
      <div class="final-actions" id="final-actions" hidden><button class="final-btn ghost" data-final="back">게임 화면으로</button><button class="final-btn" data-final="login">로그인 화면으로</button></div>
    </div>`;
    const lines = [["sys", "김팀장님이 새로운 프로젝트 채널을 생성했습니다. #프로젝트-모바일앱"], ["kim", "아 맞다 여러분. 내일부터 모바일 앱 프로젝트도 시작하거든요?"], ["kim", "이번에는 진짜 간단한 작업이에요~"], ["lee", "팀장님 그 말은 하지 마세요."], ["han", "ㅋㅋㅋㅋㅋㅋㅋㅋ"]];
    const box = document.getElementById("final-after");
    let i = 0;
    const next = () => { if (i >= lines.length) { document.getElementById("final-tbc").hidden = false; document.getElementById("final-actions").hidden = false; return; } const [who, text] = lines[i++]; const d = document.createElement("div"); d.className = "final-line " + who; d.innerHTML = who === "sys" ? `<span>${esc(text)}</span>` : `<b>${esc(USERS[who].name)}</b><span></span>`; box.appendChild(d); if (who === "sys") setTimeout(next, 1400); else typeText(d.querySelector("span"), text, next); };
    setTimeout(next, 1200);
  }
  el.hidden = false;
}
function typeText(el, text, onDone) {
  if (!el) return; el.textContent = ""; let i = 0;
  const tick = () => { el.textContent = text.slice(0, ++i); if (i < text.length) setTimeout(tick, text[i - 1] === "\n" ? 400 : 45); else if (onDone) setTimeout(onDone, 700); };
  tick();
}
document.addEventListener("click", (e) => {
  const f = e.target.closest("[data-final]");
  if (f) {
    if (f.dataset.final === "logout") showFinalEnding("logout");
    if (f.dataset.final === "back") { document.getElementById("final-app").hidden = true; G.state.endingStage = null; G.save(); }
    if (f.dataset.final === "login") { location.href = "index.html"; }
    return;
  }
  if (e.target.closest("[data-ev-print]")) { window.print(); return; }
  if (e.target.closest("[data-leave]")) { showFinalEnding("ending"); }
});
// 새로고침 복원
window.addEventListener("load", () => { leaveFab(); if (G.state.endingStage && G.state.leftWork) showFinalEnding(G.state.endingStage); });
