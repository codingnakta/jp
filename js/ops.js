// =====================================================================
//  DAYEON DEPLOY — 배포·형상 관리 도구 (TASK-005 / TASK-006)
//  · 공유 폴더 탐색기 · Git 변경 기록 뷰어 · 배포 이력(CI/CD 대시보드) · QA 결과 · 지난 대화 · 가이드
//  · TASK-006: 배포 후보 비교 · 최종 QA · 배포 실행(교사 승인 후)
//  모든 데이터는 교육용 가상 데이터. 실제 저장소·서버에 접속하지 않음
// =====================================================================

const T5 = () => G.state.task5;
const OV = () => { if (!G.state.opsView) G.state.opsView = { view: "deploy", sel: null, folder: "root" }; return G.state.opsView; };
const opsAppEl = document.getElementById("ops-app");
const oLocal = { noteOpen: false, editNote: null };

function opsTaskNo() { const t6 = G.state.task6; if (t6 && t6.started) return 6; return 5; }
function addEvidence5(src, text) {
  const s = T5();
  if (s.evidence.some((e) => e.src === src && e.text === text)) { toast({ title: "DAYEON DEPLOY", text: "이미 증거 목록에 있습니다." }); return; }
  s.evidence.push({ id: "ev-" + Date.now(), src, text: String(text).slice(0, 240), time: fmtMinutes(nowMinutes()) });
  G.save();
  toast({ title: "조사 증거", sub: src, text: "증거 목록에 추가했습니다. (" + s.evidence.length + "건)" });
  if (!opsAppEl.hidden) renderOps(); else if (G.state.currentApp === "design") renderDesign();
}
function evBtn(src, text) { return `<button class="op-ev" data-op-ev="${esc(src)}" data-op-text="${esc(text)}">+ 증거</button>`; }

// ---------- 공통 틀 ----------
function renderOps() {
  const v = OV();
  const no = opsTaskNo();
  const nav5 = [["deploy", "배포 이력", "⇧"], ["files", "공유 폴더", "▤"], ["git", "Git 기록", "⎇"], ["qa", "QA 결과", "✓"], ["chat", "지난 대화", "💬"], ["guide", "배포 가이드", "¶"]];
  const nav6 = typeof opsNav6 === "function" ? opsNav6() : [];
  const nav = no === 6 ? [...nav6, ...nav5.filter((n) => ["git", "deploy", "guide"].includes(n[0]))] : nav5;
  if (!nav.some((n) => n[0] === v.view)) v.view = nav[0][0];
  const s = T5();
  opsAppEl.innerHTML = `
    <header class="op-top">
      <button class="op-back" data-op="back">← 업무로 돌아가기</button>
      <div class="op-brand" data-app-menu><span class="op-logo">▲</span><b>DAYEON DEPLOY</b><small>배포 · 형상 관리</small></div>
      <div class="op-proj">프로젝트 <b>TICKET ON</b> · 저장소 <code>${esc(TASK5.repo)}</code></div>
      <div class="op-evcount" data-op="evidence">증거 <b>${s.evidence.length}</b></div>
    </header>
    <div class="op-body">
      <nav class="op-nav">${nav.map(([k, l, ic]) => `<button class="${v.view === k ? "on" : ""}" data-op-view="${k}"><i>${ic}</i>${l}</button>`).join("")}
        <div class="op-nav-foot">${no === 5 ? `<p>TASK-005 조사 도구</p><p class="dim">파일·커밋·배포 상세의 [+ 증거]를 눌러 증거를 모으세요. 보고서에 첨부됩니다.</p>` : `<p>TASK-006 최종 배포</p><p class="dim">배포 후보 비교 → 최종 QA → 배포 실행 순서로 진행합니다.</p>`}</div>
      </nav>
      <main class="op-main">${opsViewHTML(v.view)}</main>
    </div>
    ${oLocal.noteOpen ? fileNoteModalHTML() : ""}
    ${v.view === "evidence" ? "" : ""}`;
}
function opsViewHTML(view) {
  if (view === "files") return filesViewHTML();
  if (view === "git") return gitViewHTML();
  if (view === "deploy") return deployViewHTML();
  if (view === "qa") return qaViewHTML();
  if (view === "chat") return chatViewHTML();
  if (view === "guide") return guideViewHTML();
  if (view === "evidence") return evidenceViewHTML();
  if (typeof opsView6HTML === "function") return opsView6HTML(view);
  return "";
}

// ---------- 공유 폴더 ----------
function folderPath(id) { const p = []; let f = TASK5.folders.find((x) => x.id === id); while (f) { p.unshift(f.name); f = TASK5.folders.find((x) => x.id === f.parent); } return p.join("/"); }
function filesViewHTML() {
  const v = OV(); const s = T5();
  const tree = (parent, depth) => TASK5.folders.filter((f) => f.parent === parent).map((f) => `<button class="op-tree ${v.folder === f.id ? "on" : ""}" style="padding-left:${10 + depth * 14}px" data-op-folder="${f.id}"><i>${v.folder === f.id || isAncestor(f.id, v.folder) ? "▾" : "▸"}</i>📁 ${esc(f.name)}</button>${tree(f.id, depth + 1)}`).join("");
  const files = TASK5.files.filter((f) => f.folder === v.folder);
  const sel = TASK5.files.find((f) => f.id === v.sel);
  return `<div class="op-split3">
    <aside class="op-tree-pane"><div class="op-cap">공유 드라이브</div>${tree(null, 0)}</aside>
    <section class="op-list-pane">
      <div class="op-crumb">${esc(folderPath(v.folder))}/</div>
      ${files.length ? `<table class="op-table"><thead><tr><th>이름</th><th>유형</th><th>수정 시각</th><th>수정자</th><th>크기</th><th>버전</th></tr></thead><tbody>
        ${files.map((f) => `<tr class="${v.sel === f.id ? "sel" : ""} ${s.filesViewed.includes(f.id) ? "seen" : ""}" data-op-file="${f.id}"><td><span class="op-fic">${{ Figma: "◆", PDF: "▭", Excel: "▦", "빌드": "⬒", "저장소": "⎇" }[f.type] || "▫"}</span>${esc(f.name)}</td><td>${esc(f.type)}</td><td>${esc(f.modified)}</td><td>${esc(f.author)}</td><td>${esc(f.size)}</td><td>${esc(f.version)}</td></tr>`).join("")}
      </tbody></table>` : `<div class="op-empty">이 폴더에는 파일이 없습니다. 왼쪽에서 하위 폴더를 여세요.</div>`}
      <div class="op-notes">
        <div class="op-cap">조사 기록 <small>${s.fileNotes.length}건</small><button class="op-btn primary" data-op="note-new">+ 이상한 점 기록</button></div>
        ${s.fileNotes.length ? `<ul class="op-note-list">${s.fileNotes.map((n) => `<li><b>${esc(n.file)}</b><p>${esc(n.mismatch)}</p><p class="dim">${esc(n.reason)}</p><span>${esc(n.time)}</span><button data-op-note-edit="${n.id}">수정</button><button data-op-note-del="${n.id}">삭제</button></li>`).join("")}</ul>` : `<p class="dim">파일을 열어 세부 정보를 확인하고, 이름과 내용이 다른 파일이나 이상한 점을 기록하세요.</p>`}
      </div>
    </section>
    <aside class="op-detail-pane">${sel ? fileDetailHTML(sel) : `<div class="op-empty">파일을 선택하면 상세 정보가 표시됩니다.<br><small>파일 이름만 보지 말고 실제 포함된 버전·빌드 ID·생성 시각을 확인하세요.</small></div>`}</aside>
  </div>`;
}
function isAncestor(a, b) { let f = TASK5.folders.find((x) => x.id === b); while (f) { if (f.parent === a) return true; f = TASK5.folders.find((x) => x.id === f.parent); } return false; }
function fileDetailHTML(f) {
  const i = f.info;
  const row = (k, val) => val ? `<div class="op-row"><span>${k}</span><b>${esc(val)}</b></div>` : "";
  const sum = `${f.name} · ${i.buildId ? "빌드 " + i.buildId + " · " : ""}${i.designVersion ? "디자인 " + i.designVersion + " · " : ""}${i.buildAt ? "생성 " + i.buildAt : "수정 " + f.modified} · ${esc(folderPath(f.folder))}`;
  return `<div class="op-detail">
    <div class="op-detail-head"><span class="op-fic big">${{ Figma: "◆", PDF: "▭", Excel: "▦", "빌드": "⬒", "저장소": "⎇" }[f.type] || "▫"}</span><div><b>${esc(f.name)}</b><small>${esc(folderPath(f.folder))}/</small></div></div>
    <div class="op-tag">${esc(i.kind)}</div>
    ${row("파일 버전(이름)", f.version)}${row("실제 디자인 버전", i.designVersion)}${row("실제 코드 버전", i.codeVersion)}${row("빌드 ID", i.buildId)}${row("빌드 생성 시각", i.buildAt)}${row("담당자", i.owner || f.author)}${row("마지막 수정", f.modified + " · " + f.author)}
    <p class="op-sum">${esc(i.summary)}</p>
    ${i.changes ? `<div class="op-cap">포함된 주요 변경 사항</div><ul class="op-ul">${i.changes.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>` : ""}
    <div class="op-cap">수정 기록</div><ul class="op-hist">${i.history.map((h) => `<li><span>${esc(h.at)}</span><b>${esc(h.by)}</b>${esc(h.what)}</li>`).join("")}</ul>
    <div class="op-actions">${evBtn("공유 폴더 · " + f.name, sum)}<button class="op-btn" data-op="note-new" data-op-prefile="${esc(f.name)}">이 파일 이상 기록</button></div>
  </div>`;
}
function fileNoteModalHTML() {
  const n = oLocal.editNote ? T5().fileNotes.find((x) => x.id === oLocal.editNote) : null;
  return `<div class="op-modal-bg" data-op="note-close"><div class="op-modal">
    <h3>공유 폴더 조사 기록 <small>${n ? "수정" : "새 기록"}</small></h3>
    <label>조사한 파일 <input id="op-n-file" type="text" placeholder="예: 05_배포/최종_진짜최종/ticketon_v1.0.2.zip" value="${esc(n ? n.file : oLocal.prefile || "")}"></label>
    <label>발견한 불일치 <textarea id="op-n-mismatch" rows="2" placeholder="이름·폴더와 실제 내용(버전·빌드 ID·시각)이 어떻게 다른가요?">${esc(n ? n.mismatch : "")}</textarea></label>
    <label>의심되는 이유 <textarea id="op-n-reason" rows="2" placeholder="왜 이 파일이 사건과 관련 있다고 생각하나요?">${esc(n ? n.reason : "")}</textarea></label>
    <div class="op-modal-actions"><button class="op-btn" data-op="note-close">취소</button><button class="op-btn primary" data-op="note-save">저장</button></div>
  </div></div>`;
}

// ---------- Git ----------
function gitViewHTML() {
  const v = OV(); const s = T5();
  const sel = TASK5.commits.find((c) => c.id === v.sel) || TASK5.commits[0];
  if (sel && !s.commitsViewed.includes(sel.id)) { s.commitsViewed.push(sel.id); G.save(); }
  return `<div class="op-split2">
    <section class="op-list-pane">
      <div class="op-crumb"><code>${esc(TASK5.repo)}</code> · 커밋 ${TASK5.commits.length}개 · 브랜치 main, release/1.0.4</div>
      <ul class="op-commits">${TASK5.commits.map((c) => `<li class="${sel && sel.id === c.id ? "sel" : ""}" data-op-commit="${c.id}"><div class="op-c-top"><code>${c.id}</code><span class="op-branch ${c.branch === "main" ? "main" : ""}">${esc(c.branch)}</span>${c.tag ? `<span class="op-tagv">🏷 ${esc(c.tag)}</span>` : ""}</div><b>${esc(c.msg)}</b><small>${esc(c.author)} · ${esc(c.at)}</small></li>`).join("")}</ul>
      <div class="op-cap">빌드와 커밋</div>
      <table class="op-table small"><thead><tr><th>빌드 ID</th><th>버전</th><th>커밋</th><th>브랜치</th><th>디자인</th><th>생성</th></tr></thead><tbody>${TASK5.builds.map((b) => `<tr><td><code>${b.id}</code></td><td>${b.version}</td><td><code>${b.commit}</code></td><td>${esc(b.branch)}</td><td>${b.design}</td><td>${esc(b.at)} · ${esc(b.by)}</td></tr>`).join("")}</tbody></table>
    </section>
    <aside class="op-detail-pane">${sel ? `<div class="op-detail">
      <div class="op-c-top"><code class="big">${sel.id}</code><span class="op-branch ${sel.branch === "main" ? "main" : ""}">${esc(sel.branch)}</span>${sel.tag ? `<span class="op-tagv">🏷 ${esc(sel.tag)}</span>` : ""}</div>
      <h3>${esc(sel.msg)}</h3><p class="dim">${esc(sel.author)} · ${esc(sel.at)}</p>
      <div class="op-cap">변경 파일</div><ul class="op-ul">${sel.files.map((f) => `<li><code>${esc(f)}</code></li>`).join("")}</ul>
      <div class="op-cap">변경 내용 미리보기</div><pre class="op-diff">${sel.diff.map((l) => `<span class="${l.startsWith("+") ? "add" : l.startsWith("-") ? "del" : ""}">${esc(l)}</span>`).join("\n")}</pre>
      <div class="op-actions">${evBtn("Git · " + sel.id, `${sel.id} ${sel.msg} · ${sel.branch} · ${sel.author} ${sel.at}${sel.tag ? " · " + sel.tag : ""}`)}</div>
    </div>` : ""}</aside>
  </div>`;
}

// ---------- 배포 이력 ----------
function deployViewHTML() {
  const v = OV(); const s = T5();
  const sel = TASK5.deploys.find((d) => d.id === v.sel) || TASK5.deploys[0];
  if (sel && !s.deploysViewed.includes(sel.id)) { s.deploysViewed.push(sel.id); G.save(); }
  return `<div class="op-deploy">
    <div class="op-envs">${TASK5.envs.map((e) => `<div class="op-env ${e.id}"><div class="op-env-top"><b>${esc(e.name)}</b><span class="op-status ${e.status}">● ${e.status === "running" ? "운영 중" : e.status}</span></div><div class="op-env-url">${esc(e.url)}</div><div class="op-env-ver">${esc(e.version)} <code>${esc(e.buildId)}</code></div><small>마지막 배포 ${esc(e.deployedAt)} · ${esc(e.by)}${e.note ? " · " + esc(e.note) : ""}</small>${evBtn("환경 · " + e.name, `${e.name}: ${e.version} ${e.buildId} (배포 ${e.deployedAt} ${e.by})`)}</div>`).join("")}</div>
    <div class="op-split2 tall">
      <section class="op-list-pane">
        <div class="op-crumb">배포 이력 · 최근 ${TASK5.deploys.length}건</div>
        <table class="op-table"><thead><tr><th>#</th><th>환경</th><th>버전</th><th>산출물</th><th>담당</th><th>시각</th><th>검증</th><th>결과</th></tr></thead><tbody>
          ${TASK5.deploys.map((d) => `<tr class="${sel && sel.id === d.id ? "sel" : ""}" data-op-deploy="${d.id}"><td>${d.id}</td><td><span class="op-pill ${d.env}">${d.env === "production" ? "운영" : "테스트"}</span></td><td>${d.version}</td><td>${esc(d.artifact)}</td><td>${esc(d.by)}</td><td>${esc(d.at)}</td><td class="${d.verification === "skipped" ? "warn" : ""}">${d.verification === "passed" ? "통과" : d.verification === "skipped" ? "건너뜀" : d.verification}</td><td><span class="op-status success">● 성공</span></td></tr>`).join("")}
        </tbody></table>
      </section>
      <aside class="op-detail-pane">${sel ? `<div class="op-detail">
        <div class="op-detail-head"><div><b>${sel.id} · ${sel.env === "production" ? "운영" : "테스트"} 배포</b><small>${esc(sel.at)} · ${esc(sel.by)} · ${esc(sel.duration)}</small></div><span class="op-status success">● 성공</span></div>
        <div class="op-row"><span>버전</span><b>${esc(sel.version)}</b></div>
        <div class="op-row"><span>산출물</span><b>${esc(sel.artifactPath)}</b></div>
        <div class="op-row"><span>빌드 ID</span><b><code>${esc(sel.buildId)}</code></b></div>
        <div class="op-row"><span>빌드 검증</span><b class="${sel.verification === "skipped" ? "warn" : ""}">${sel.verification === "passed" ? "통과" : sel.verification === "skipped" ? "건너뜀 (--skip-verify)" : esc(sel.verification)}</b></div>
        <div class="op-row"><span>QA 참조</span><b>${esc(sel.qaRef)}</b></div>
        <div class="op-cap">배포 작업 로그</div><pre class="op-log">${sel.log.map((l) => `<span class="${/skipped/.test(l) ? "warn" : /completed/.test(l) ? "ok" : ""}">${esc(l)}</span>`).join("\n")}</pre>
        <div class="op-actions">${evBtn("배포 · " + sel.id, `${sel.id} ${sel.env} ${sel.version} · ${sel.artifactPath} · 빌드 ${sel.buildId} · 검증 ${sel.verification} · ${sel.at} ${sel.by}`)}</div>
      </div>` : ""}</aside>
    </div>
  </div>`;
}

// ---------- QA / 지난 대화 / 가이드 / 증거 ----------
function qaViewHTML() {
  const s = T5(); if (!s.qaViewed) { s.qaViewed = true; G.save(); }
  const q = TASK5.qa;
  return `<div class="op-doc">
    <div class="op-doc-head"><h2>테스트결과.xlsx <small>04_QA · ${esc(q.at)} · ${esc(q.by)}</small></h2>${evBtn("QA · 테스트결과.xlsx", `QA ${q.at}: ${q.env} ${q.version} 빌드 ${q.buildId} · ${q.cases.length}/${q.cases.length} PASS`)}</div>
    <div class="op-kv"><div><span>테스트 환경</span><b>${esc(q.env)} (staging.ticketon.test)</b></div><div><span>테스트 대상 버전</span><b>${esc(q.version)}</b></div><div><span>빌드 ID</span><b><code>${esc(q.buildId)}</code></b></div><div><span>결과</span><b class="ok">${q.cases.length}/${q.cases.length} PASS</b></div></div>
    <table class="op-table"><thead><tr><th>#</th><th>테스트 항목</th><th>결과</th></tr></thead><tbody>${q.cases.map((c, i) => `<tr><td>${i + 1}</td><td>${esc(c[0])}</td><td class="ok">${c[1]}</td></tr>`).join("")}</tbody></table>
    <p class="dim">※ 이 결과는 테스트 환경의 빌드에 대한 것입니다. 운영 환경에 같은 빌드가 배포되었는지는 배포 이력에서 확인해야 합니다.</p>
  </div>`;
}
function chatViewHTML() {
  const s = T5(); if (!s.chatViewed) { s.chatViewed = true; G.save(); }
  return `<div class="op-doc">
    <div class="op-doc-head"><h2>#프로젝트-티켓온 · 지난 대화 <small>어제(10.18) 오후</small></h2></div>
    <p class="dim">당시 직원들이 어떤 상황을 알고 있었는지 확인하는 자료입니다. 직접적인 정답이라기보다 다른 기록과 연결해 보세요.</p>
    <ul class="op-chat">${TASK5.chatlog.map((m) => `<li><span class="op-av" style="background:${USERS[m.from].color}">${esc(USERS[m.from].name[0])}</span><div><div class="op-chat-h"><b>${esc(USERS[m.from].name)}</b><small>${esc(USERS[m.from].dept)}</small><small>${esc(m.at)}</small></div><p>${esc(m.text)}</p></div>${evBtn("메신저 · " + USERS[m.from].name + " " + m.at, `${USERS[m.from].name} (${m.at}): ${m.text}`)}</li>`).join("")}</ul>
  </div>`;
}
function guideViewHTML() {
  const s = T5(); if (!s.guideViewed) { s.guideViewed = true; G.save(); }
  return `<div class="op-doc"><div class="op-doc-head"><h2>배포 업무 가이드 <small>다연컴퍼니 개발팀 · v2</small></h2></div>${TASK5.guide.map((g) => `<section><h4>${esc(g.h)}</h4><p>${esc(g.p)}</p></section>`).join("")}</div>`;
}
function evidenceViewHTML() {
  const s = T5();
  return `<div class="op-doc"><div class="op-doc-head"><h2>확보한 증거 <small>${s.evidence.length}건</small></h2></div>
    ${s.evidence.length ? `<ul class="op-evlist">${s.evidence.map((e) => `<li><span class="op-src">${esc(e.src)}</span><p>${esc(e.text)}</p><small>${esc(e.time)}</small><button data-op-ev-del="${e.id}">삭제</button></li>`).join("")}</ul>` : `<p class="dim">아직 없습니다. 파일·커밋·배포·QA·대화 화면의 [+ 증거] 버튼으로 모으세요.</p>`}
    <p class="dim">증거는 TASK-005 보고서 ⑥ 참고한 증거 에서 선택해 첨부합니다.</p></div>`;
}

// ---------- 디자인 변경 이력 (DAYEON DESIGN '변경 이력' 탭) ----------
function designHistoryTabHTML() {
  const s = T5(); if (!s.designHistoryViewed) { s.designHistoryViewed = true; G.save(); }
  const vers = TASK5.files.filter((f) => f.folder === "design");
  return `<main class="d-center wide"><div class="op-doc in-design">
    <div class="op-doc-head"><h2>TICKETON_Design 변경 이력 <small>02_디자인 · v2 → v3 → v4</small></h2></div>
    <div class="op-vers">${vers.map((f) => `<div class="op-ver ${f.info.designVersion === "v4" ? "final" : ""}"><div class="op-ver-top"><b>${esc(f.info.designVersion)}</b><span>${esc(f.name)}</span></div><small>${esc(f.modified)} · ${esc(f.author)}</small><ul class="op-ul">${f.info.changes.map((c) => `<li>${esc(c)}</li>`).join("")}</ul><div class="op-cap">수정·전달 기록</div><ul class="op-hist">${f.info.history.map((h) => `<li><span>${esc(h.at)}</span><b>${esc(h.by)}</b>${esc(h.what)}</li>`).join("")}</ul><div class="op-actions">${evBtn("디자인 이력 · " + f.name, `${f.name} (${f.info.designVersion}) 수정 ${f.modified} ${f.author} · ${f.info.history.map((h) => h.at + " " + h.what).join(", ")}`)}<button class="d-cta secondary small" data-op-design-preview="${f.info.designVersion === "v3" ? "v4" : f.info.designVersion}">${f.info.designVersion === "v3" ? "미리보기 없음 (v4 참고)" : "화면 미리보기 (검수 탭)"}</button></div></div>`).join("")}</div>
    <p class="dim">디자인팀이 최종 작업을 완료했는지, 언제 누구에게 전달했는지 기록으로 확인하세요. 운영 사이트에 적용된 디자인은 어떤 버전이었나요?</p>
  </div></main>`;
}

// ---------- 이벤트 ----------
opsAppEl.addEventListener("click", (e) => {
  const t = (sel) => e.target.closest(sel);
  const v = OV(); const s = T5();
  const ev = t("[data-op-ev]"); if (ev) { addEvidence5(ev.dataset.opEv, ev.dataset.opText); return; }
  const op = t("[data-op]");
  if (op) {
    if (op.classList.contains("op-modal-bg") && e.target !== op) return;   // 모달 안쪽 클릭은 닫지 않음
    const a = op.dataset.op;
    if (a === "back") { showApp("task"); return; }
    if (a === "evidence") { v.view = "evidence"; renderOps(); return; }
    if (a === "note-new") { oLocal.noteOpen = true; oLocal.editNote = null; oLocal.prefile = op.dataset.opPrefile || (TASK5.files.find((f) => f.id === v.sel) ? folderPath(TASK5.files.find((f) => f.id === v.sel).folder) + "/" + TASK5.files.find((f) => f.id === v.sel).name : ""); renderOps(); return; }
    if (a === "note-close") { oLocal.noteOpen = false; renderOps(); return; }
    if (a === "note-save") {
      const file = (document.getElementById("op-n-file").value || "").trim(), mismatch = (document.getElementById("op-n-mismatch").value || "").trim(), reason = (document.getElementById("op-n-reason").value || "").trim();
      if (!file || !mismatch) { toast({ title: "DAYEON DEPLOY", text: "조사한 파일과 발견한 불일치를 적어 주세요." }); return; }
      if (oLocal.editNote) { const n = s.fileNotes.find((x) => x.id === oLocal.editNote); if (n) Object.assign(n, { file, mismatch, reason }); }
      else s.fileNotes.push({ id: "fn-" + Date.now(), file, mismatch, reason, time: fmtMinutes(nowMinutes()) });
      oLocal.noteOpen = false; G.save(); renderOps(); return;
    }
    if (typeof opsAction6 === "function" && opsAction6(a, op)) return;
    return;
  }
  const nv = t("[data-op-view]"); if (nv) { v.view = nv.dataset.opView; v.sel = null; renderOps(); return; }
  const fo = t("[data-op-folder]"); if (fo) { v.folder = fo.dataset.opFolder; v.sel = null; renderOps(); return; }
  const fi = t("[data-op-file]"); if (fi) { v.sel = fi.dataset.opFile; if (!s.filesViewed.includes(v.sel)) s.filesViewed.push(v.sel); G.save(); renderOps(); return; }
  const cm = t("[data-op-commit]"); if (cm) { v.sel = cm.dataset.opCommit; renderOps(); return; }
  const dp = t("[data-op-deploy]"); if (dp) { v.sel = dp.dataset.opDeploy; renderOps(); return; }
  const ne = t("[data-op-note-edit]"); if (ne) { oLocal.noteOpen = true; oLocal.editNote = ne.dataset.opNoteEdit; renderOps(); return; }
  const nd = t("[data-op-note-del]"); if (nd) { s.fileNotes = s.fileNotes.filter((x) => x.id !== nd.dataset.opNoteDel); G.save(); renderOps(); return; }
  const ed = t("[data-op-ev-del]"); if (ed) { s.evidence = s.evidence.filter((x) => x.id !== ed.dataset.opEvDel); G.save(); renderOps(); return; }
  if (typeof opsClick6 === "function") opsClick6(e, t);
});
designAppEl.addEventListener("click", (e) => {
  const ev = e.target.closest("[data-op-ev]"); if (ev) { addEvidence5(ev.dataset.opEv, ev.dataset.opText); return; }
  const pv = e.target.closest("[data-op-design-preview]"); if (pv) { openDesign("review", pv.dataset.opDesignPreview); }
});
function openOps(view = "deploy") {
  const no = opsTaskNo();
  if ((no === 5 && !T5().started) || (no === 6 && !G.state.task6.started)) { toast({ title: "DAYEON TASK", sub: "첨부 자료", text: "업무를 시작하면 열 수 있습니다." }); return; }
  OV().view = view; OV().sel = null;
  showApp("ops");
}

// ---------- 타임라인 검증 (TASK-005 MISSION D) ----------
function checkTimeline5() {
  const s = T5();
  const correct = [...TASK5.timeline].sort((a, b) => a.at.localeCompare(b.at)).map((e) => e.id);
  const ok = JSON.stringify(s.timeline.order) === JSON.stringify(correct);
  s.timeline.attempts = (s.timeline.attempts || 0) + 1;
  s.timeline.passed = ok;
  s.timeline.lastResult = ok ? "pass" : "fail";
  s.timeline.checkedAt = fmtMinutes(nowMinutes());
  G.save();
  return ok;
}
