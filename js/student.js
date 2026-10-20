// =====================================================================
//  학생 팀 입장 (student.html)
//  수업 코드 + 팀 이름 → 익명 인증 → joinRequests/{uid} 작성 → 교사 승인 대기 → chat.html
// =====================================================================

const $s = (s) => document.querySelector(s);
const form = $s("#join-form"), waitEl = $s("#wait"), errEl = $s("#error");
let sid = null, unsub = null;

// 멤버십은 탭(sessionStorage)과 기기(localStorage) 양쪽에 저장 — 한 PC에서 여러 팀 탭을 열어 시연할 때 서로 덮어쓰지 않도록 탭 저장소를 우선 사용
function saveMembership(m) { const v = JSON.stringify(m); sessionStorage.setItem("dayeon-live", v); localStorage.setItem("dayeon-live", v); }
function showError(msg) { errEl.textContent = msg; errEl.hidden = !msg; }

async function boot() {
  await Sync.init();
  $s("#mode-note").textContent = SyncUtil.modeLabel();
  Sync.connection.on((on) => { $s("#conn").textContent = on ? "● 연결됨" : "○ 연결 끊김 · 재연결 중"; });
  const reason = new URLSearchParams(location.search).get("reason");
  if (reason === "membership") showError("팀 정보가 확인되지 않아 다시 입장해야 합니다.");

  // 이미 승인된 팀이면 바로 게임으로
  const m = JSON.parse(sessionStorage.getItem("dayeon-live") || localStorage.getItem("dayeon-live") || "null");
  if (m && m.sid) {
    await Sync.auth.signInAnonymously();
    const teamId = await Sync.db.get(`sessions/${m.sid}/members/${Sync.auth.uid}`);
    const pub = await Sync.db.get(`sessions/${m.sid}/public`);
    if (teamId && teamId === m.teamId && pub && pub.status !== "ended") { sessionStorage.setItem("dayeon-live", JSON.stringify(m)); location.href = "chat.html"; return; }
    localStorage.removeItem("dayeon-live"); sessionStorage.removeItem("dayeon-live");
  }
  // 대기 중이던 요청 복원
  const pending = JSON.parse(sessionStorage.getItem("dayeon-join") || "null");
  if (pending) { sid = pending.sid; $s("#code").value = pending.code; $s("#team").value = pending.team; await waitApproval(pending.code, pending.team); }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  showError("");
  const code = $s("#code").value.trim().toUpperCase();
  const team = $s("#team").value.trim();
  if (code.length < 4) return showError("수업 코드를 확인하세요.");
  if (!team) return showError("팀 이름을 입력하세요.");
  $s("#submit").disabled = true;
  try {
    await Sync.auth.signInAnonymously();
    sid = await Sync.db.get(`codes/${code}`);
    if (!sid) throw new Error("해당 코드의 수업을 찾을 수 없습니다. 교사에게 코드를 다시 확인하세요.");
    const pub = await Sync.db.get(`sessions/${sid}/public`);
    if (!pub || pub.status === "ended") throw new Error("종료되었거나 열려 있지 않은 수업입니다.");
    // 이미 승인된 기기(같은 uid)면 바로 입장
    const existing = await Sync.db.get(`sessions/${sid}/members/${Sync.auth.uid}`);
    if (existing) {
      const tinfo = await Sync.db.get(`sessions/${sid}/teams/${existing}`);
      saveMembership({ sid, code, teamId: existing, teamName: (tinfo && tinfo.name) || team, uid: Sync.auth.uid });
      location.href = "chat.html"; return;
    }
    await Sync.db.set(`sessions/${sid}/joinRequests/${Sync.auth.uid}`, { teamName: team, requestedAt: Date.now(), status: "pending" });
    sessionStorage.setItem("dayeon-join", JSON.stringify({ sid, code, team }));
    await waitApproval(code, team);
  } catch (err) {
    showError(err.message || String(err));
    $s("#submit").disabled = false;
  }
});

async function waitApproval(code, team) {
  form.hidden = true; waitEl.hidden = false;
  $s("#wait-code").textContent = `수업 코드 ${code}`;
  $s("#wait-team").textContent = `팀 ${team}`;
  if (unsub) unsub();
  unsub = Sync.db.on(`sessions/${sid}/joinRequests/${Sync.auth.uid}`, (req) => {
    if (!req) return;
    if (req.status === "approved" && req.teamId) {
      saveMembership({ sid, code, teamId: req.teamId, teamName: req.teamName || team, uid: Sync.auth.uid });
      sessionStorage.removeItem("dayeon-join");
      $s("#wait-title").textContent = "승인되었습니다!";
      $s("#wait-desc").textContent = "게임 화면으로 이동합니다…";
      setTimeout(() => (location.href = "chat.html"), 800);
    } else if (req.status === "rejected") {
      $s("#wait-title").textContent = "입장이 거절되었습니다";
      $s("#wait-desc").textContent = req.note || "교사에게 확인한 뒤 다시 요청하세요.";
    }
  });
}

$s("#cancel").addEventListener("click", async () => {
  if (sid && Sync.auth.uid) await Sync.db.set(`sessions/${sid}/joinRequests/${Sync.auth.uid}`, null).catch(() => {});
  sessionStorage.removeItem("dayeon-join");
  if (unsub) unsub();
  waitEl.hidden = true; form.hidden = false; $s("#submit").disabled = false;
});

boot().catch((e) => showError(e.message || String(e)));
