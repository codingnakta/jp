// 로그인 화면 목업 동작
// 실제 서버 없음. 정답은 아래 상수로 고정 (나중에 게임 단서와 맞춰서 바꾸면 됨)
const CORRECT = { empno: "2024-0117", password: "1234" };

const form = document.getElementById("login-form");
const card = form;
const empno = document.getElementById("empno");
const password = document.getElementById("password");
const errorEl = document.getElementById("error");
const togglePw = document.getElementById("toggle-pw");

togglePw.addEventListener("click", () => {
  const show = password.type === "password";
  password.type = show ? "text" : "password";
  togglePw.classList.toggle("is-on", show);
  password.focus();
});

[empno, password].forEach((el) =>
  el.addEventListener("input", () => (errorEl.hidden = true))
);

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const ok =
    empno.value.trim() === CORRECT.empno && password.value === CORRECT.password;

  if (!ok) {
    errorEl.hidden = false;
    card.classList.remove("shake");
    void card.offsetWidth; // 애니메이션 재시작
    card.classList.add("shake");
    return;
  }

  // TODO: 로그인 성공 → 다음 장면으로 전환
  location.href = "chat.html";
});

// 목업 링크는 아직 아무것도 하지 않음
["find-pw", "helpdesk", "sso-google", "sso-ms"].forEach((id) =>
  document.getElementById(id).addEventListener("click", (e) => e.preventDefault())
);
