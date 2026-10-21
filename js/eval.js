// =====================================================================
//  신입사원 근무평가서 — 팀 활동 기록 기반 초안 계산 + A4 문서 렌더링 (학생/교사 공용)
//  점수는 실제 기록이 있을 때만 계산하고, 기록이 없는 항목은 null(미평가)로 둔다. 교사가 최종 확정한다.
// =====================================================================
function clamp5(n) { return Math.max(1, Math.min(5, Math.round(n))); }
function computeEvalDraft(st, teamName) {
  const t1 = st.task || {}, t2 = st.task2 || {}, t3 = st.task3 || {}, t4 = st.task4 || {}, t5 = st.task5 || {}, t6 = st.task6 || {};
  const scores = {}, basis = {};
  // 문제 분석력: TASK-001 (문의 열람·기록·승인) + TASK-005 (증거·타임라인)
  if (t1.started || t5.started) {
    let n = 0, c = 0, b = [];
    if (t1.started) { const inq = (t1.inquiriesOpened || []).length, rec = (t1.reproduced || []).length; n += 2 + Math.min(1.5, inq / 23 * 1.5) + Math.min(1, rec * 0.4) + (t1.done ? 0.5 : 0); c++; b.push(`TASK-001 문의 ${inq}/23 열람 · 이상 현상 기록 ${rec}건${t1.done ? " · 보고서 승인" : ""}`); }
    if (t5.started) { const ev = (t5.evidence || []).length, att = (t5.timeline || {}).attempts || 0, pass = (t5.timeline || {}).passed; n += 2 + Math.min(1.5, ev * 0.3) + (pass ? (att <= 2 ? 1.5 : 1) : 0) + (t5.done ? 0.5 : 0); c++; b.push(`TASK-005 증거 ${ev}건 · 타임라인 ${pass ? `검증 통과 (${att}회)` : "미통과"}${t5.done ? " · 보고서 승인" : ""}`); }
    scores.analysis = clamp5(n / c); basis.analysis = b.join(" / ");
  } else { scores.analysis = null; basis.analysis = "기록 없음"; }
  // UI/UX: TASK-002 + TASK-004 UI
  if (t2.started || t4.started) {
    let n = 0, c = 0, b = [];
    if (t2.started) { const f = (t2.findings || []).length; n += 2 + Math.min(1.5, f * 0.3) + (t2.principlesChecked ? 0.5 : 0) + (t2.designApplied ? 0.5 : 0) + (t2.done ? 0.5 : 0); c++; b.push(`TASK-002 검수 발견 ${f}건${t2.principlesChecked ? " · 원칙 분석" : ""}${t2.designApplied ? " · 수정안 확정" : ""}${t2.done ? " · 승인" : ""}`); }
    if (t4.started) { n += 2 + (t4.uiApplied ? 2 : 0) + (t4.qa && t4.qa.allPass ? 1 : 0); c++; b.push(`TASK-004 결제 UI 수정안 ${t4.uiApplied ? "적용" : "미적용"}`); }
    scores.ux = clamp5(n / c); basis.ux = b.join(" / ");
  } else { scores.ux = null; basis.ux = "기록 없음"; }
  // 개발 오류 해결: TASK-003 + TASK-004 코드
  if (t3.started || t4.started) {
    let n = 0, c = 0, b = [];
    if (t3.started) { const rt = (t3.retest || {}).passes || 0; n += 2 + (t3.codeFixed ? 1.5 : 0) + Math.min(1, rt * 0.5) + (t3.done ? 0.5 : 0); c++; b.push(`TASK-003 코드 수정 ${t3.codeFixed ? "테스트 통과" : "미통과"} · 재테스트 ${rt}/2${t3.testRuns ? ` · 시도 ${t3.testRuns}회` : ""}`); }
    if (t4.started) { const f = t4.codeFlags || {}; n += 2 + (f.client ? 0.7 : 0) + (f.server ? 0.8 : 0) + (f.branch ? 0.7 : 0) + (f.pending ? 0.5 : 0) + (t4.done ? 0.3 : 0); c++; b.push(`TASK-004 가드 ${f.client ? "○" : "×"} 멱등성 ${f.server ? "○" : "×"} 분기 ${f.branch ? "○" : "×"} 보류 ${f.pending ? "○" : "×"}`); }
    scores.dev = clamp5(n / c); basis.dev = b.join(" / ");
  } else { scores.dev = null; basis.dev = "기록 없음"; }
  // 협업: TASK-004 UI+코드 동시 해결, TASK-005 과정 분석, TASK-006 회의 합의
  if (t4.started || t5.started || t6.started) {
    let n = 0, c = 0, b = [];
    if (t4.started) { const both = t4.uiApplied && t4.codeOk; n += 2 + (both ? 2 : t4.uiApplied || t4.codeOk ? 1 : 0) + (t4.qa && t4.qa.allPass ? 1 : 0); c++; b.push(`TASK-004 디자인·개발 ${both ? "모두 해결" : "일부 해결"}`); }
    if (t5.started && t5.report) { const len = ((t5.report.why || "") + (t5.report.prevent || "")).length; n += 2 + Math.min(2, len / 60) + (t5.done ? 1 : 0); c++; b.push(`TASK-005 과정·재발 방지 서술 ${len}자`); }
    if (t6.started && t6.meeting && t6.meeting.decision) { n += 3 + ((t6.meeting.reason || "").length > 20 ? 1 : 0) + ((t6.meeting.response || "").length > 10 ? 1 : 0); c++; b.push(`TASK-006 출시 회의 합의 (${t6.meeting.decision === "approve" ? "승인" : "보류"})`); }
    if (c) { scores.collab = clamp5(n / c); basis.collab = b.join(" / "); } else { scores.collab = null; basis.collab = "평가 근거 부족 (교사 입력)"; }
  } else { scores.collab = null; basis.collab = "기록 없음"; }
  // 테스트·품질 검증: TASK-004 QA + TASK-006 최종 QA
  if ((t4.qa) || (t6.qa)) {
    let n = 0, c = 0, b = [];
    if (t4.qa) { n += 2 + (t4.qa.passed / t4.qa.total) * 3; c++; b.push(`TASK-004 QA ${t4.qa.passed}/${t4.qa.total}`); }
    if (t6.qa) { n += 2 + (t6.qa.passed / t6.qa.total) * 2.5 + (t6.postCheckDone ? 0.5 : 0); c++; b.push(`TASK-006 최종 QA ${t6.qa.passed}/${t6.qa.total}${t6.postCheckDone ? " · 배포 후 확인" : ""}`); }
    scores.qa = clamp5(n / c); basis.qa = b.join(" / ");
  } else { scores.qa = null; basis.qa = "QA 실행 기록 없음"; }
  // 업무 보고·책임감: 제출·승인
  const tasks = [t1, t2, t3, t4, t5, t6].filter((t) => t.started);
  if (tasks.length) {
    const sub = tasks.filter((t) => t.reportSubmitted).length, ok = tasks.filter((t) => t.done).length;
    scores.report = clamp5(2 + (sub / tasks.length) * 1.5 + (ok / tasks.length) * 1.5);
    basis.report = `시작 ${tasks.length}건 · 제출 ${sub}건 · 승인 ${ok}건`;
  } else { scores.report = null; basis.report = "기록 없음"; }
  // 칭호
  const cand = [];
  if (scores.dev) cand.push(["bug", scores.dev + (t3.done ? 0.5 : 0)]);
  if (scores.ux) cand.push(["ux", scores.ux + (t2.done ? 0.5 : 0)]);
  if (scores.analysis && t5.started) cand.push(["detective", scores.analysis + ((t5.timeline || {}).passed ? 0.5 : 0)]);
  if (scores.qa) cand.push(["qa", scores.qa]);
  if (scores.collab) cand.push(["collab", scores.collab]);
  cand.sort((a, b) => b[1] - a[1]);
  const titles = cand.slice(0, 3).map((x) => x[0]);
  if (t6.done && t6.postCheckDone) { if (titles.length >= 3) titles.pop(); titles.push("leave"); }
  const done = [t1, t2, t3, t4, t5, t6].filter((t) => t.done).length;
  const strengths = EVAL.items.filter((i) => scores[i.id] >= 4).map((i) => i.name);
  const comment = `입사 첫날 발생한 TICKET ON 프로젝트의 긴급 업무 ${done}건을 완료하였습니다.${strengths.length ? ` 특히 ${strengths.slice(0, 2).join(", ")} 측면에서 우수한 역량을 보였습니다.` : ""}${t4.uiApplied && t4.codeOk ? " 디자인과 개발 관점을 함께 고려하여 결제 문제를 해결한 점이 인상적입니다." : ""}${t6.done ? " 최종 QA와 출시 판단을 거쳐 서비스를 성공적으로 출시하였습니다." : ""}`;
  return { scores, basis, titles, comment, doneCount: done, verdict: null };
}
function evalDocHTML(doc, team, opts = {}) {
  const sc = doc.scores || {}, bs = doc.basis || {};
  const titles = (doc.titles || []).map((id) => EVAL.titles.find((t) => t.id === id)).filter(Boolean);
  const stars = (n) => n == null ? `<span class="ev-na">미평가</span>` : `<span class="ev-stars" aria-label="${n}/5">${"★".repeat(n)}<i>${"★".repeat(5 - n)}</i></span>`;
  const date = opts.date || new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
  return `<article class="ev-doc">
    <header class="ev-head"><div class="ev-co">DAYEON COMPANY</div><h1>신입사원 근무 평가서</h1><div class="ev-sub">첫 출근 프로젝트 최종 평가</div></header>
    <table class="ev-info"><tbody>
      <tr><th>회사명</th><td>다연컴퍼니</td><th>소속</th><td>신규 프로젝트팀</td></tr>
      <tr><th>팀명</th><td>${esc(team.name || "-")}</td><th>참여 팀원</th><td>${esc(team.members || "이서연 (신입사원)")}</td></tr>
      <tr><th>담당 프로젝트</th><td>TICKET ON 공연 예매 서비스</td><th>완료 업무</th><td>6개 중 ${doc.doneCount ?? 0}개</td></tr>
      <tr><th>평가 일자</th><td>${esc(date)}</td><th>평가 상태</th><td>${{ DRAFT: "작성 중", READY: "공개 준비 완료", PUBLISHED: "공개" }[doc.status] || (opts.preview ? "미리보기" : "공개")}</td></tr>
    </tbody></table>
    <section class="ev-sec"><h2>직무 역량 평가</h2>
      <table class="ev-score"><tbody>${EVAL.items.map((i) => `<tr><th>${esc(i.name)}<small>${esc(i.desc)}</small></th><td>${stars(sc[i.id])}</td><td class="ev-basis">${esc(bs[i.id] || "")}</td></tr>`).join("")}</tbody></table></section>
    <section class="ev-sec ev-two"><div><h2>업무 칭호</h2><div class="ev-titles">${titles.length ? titles.map((t, i) => `<div class="ev-title ${i === 0 ? "main" : ""}"><b>${esc(t.name)}</b><small>${i === 0 ? "대표 칭호 · " : ""}${esc(t.desc)}</small></div>`).join("") : `<div class="ev-na">교사 확정 전</div>`}</div></div>
      <div><h2>팀장 종합 의견</h2><p class="ev-comment">${esc(doc.comment || "(작성 중)")}</p></div></section>
    <footer class="ev-foot"><div class="ev-verdict ${doc.verdict === "leave" ? "ok" : doc.verdict === "review" ? "warn" : ""}"><span>최종 판정</span><b>${doc.verdict === "leave" ? "정시 퇴근 승인" : doc.verdict === "review" ? "추가 검토 필요" : "판정 대기"}</b></div>
      <div class="ev-sign"><div><span>팀장</span><b>김팀장</b></div><div><span>인사팀 확인</span><b class="ev-stamp">인사팀 (확인)</b></div></div></footer>
  </article>`;
}
