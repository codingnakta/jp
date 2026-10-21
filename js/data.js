// =====================================================================
//  게임 데이터 (공개): 구성원 / 채널 / 업무 / 고객 문의 / 공연 정보
//  미공개 시나리오·정답은 private/data-private.js (학생 배포본에는 포함하지 않음)
//  - 대사와 타이밍은 전부 여기서 수정하면 됨
//  - at: 로그인(또는 채널 입장) 후 몇 초 뒤에 발생하는지
// =====================================================================

const WORKSPACE = { name: "DAYEON WORK", company: "다연컴퍼니", members: 28 };

const PLAYER = { id: "me", name: "이서연", dept: "프로젝트팀", title: "신입사원" };

const USERS = {
  me:  { name: "이서연", dept: "프로젝트팀 · 신입사원", color: "#1a8cff" },
  kim: { name: "김팀장", full: "김민준", dept: "프로젝트팀 · 팀장", color: "#6c5ce7" },
  lee: { name: "이대리", full: "이지훈", dept: "개발팀 · 대리", color: "#00b894" },
  han: { name: "한사원", full: "한유리", dept: "디자인팀 · 사원", color: "#e17055" },
  hr:  { name: "인사팀", full: "박수진", dept: "인사팀", color: "#fdcb6e", dark: true },
  ga:  { name: "총무팀", full: "서민호", dept: "총무팀", color: "#636e72" },
  cs:  { name: "오지은", dept: "CS팀 · 매니저", color: "#d63031" },
  des: { name: "정유진", dept: "디자인팀 · 리드", color: "#e84393" },
  dev: { name: "최준호", dept: "개발팀 · 백엔드", color: "#0984e3" },
  sys: { name: "시스템", dept: "", color: "#b2bec3", system: true },
};

// day: "yesterday" | "today", time: "HH:MM" (24h)
const CHANNELS = [
  {
    id: "notice", name: "전체공지", type: "channel", visible: true,
    desc: "다연컴퍼니 구성원 28명", topic: "회사 전체 공지사항",
    messages: [
      { from: "hr", day: "yesterday", time: "15:10",
        text: "📢 이번 주 금요일(10/24) 오후 4시, 10월 타운홀 미팅이 있습니다. 대회의실에서 진행되며 온라인 참석도 가능합니다.",
        reactions: [{ e: "👀", n: 6 }] },
      { from: "ga", day: "yesterday", time: "16:40",
        text: "3층 탕비실 정수기 필터 교체는 내일(수) 오전 10시에 진행됩니다. 작업 중 약 20분간 사용이 어렵습니다." },
      { from: "hr", day: "yesterday", time: "17:12",
        text: "내일 신규 입사자 1명이 프로젝트팀에 합류합니다. 따뜻하게 맞아주세요 🙌",
        reactions: [{ e: "🎉", n: 9 }, { e: "👋", n: 4 }] },
      { from: "hr", day: "today", time: "08:30",
        text: "금일 신규 입사자분들을 환영합니다. 👋 프로젝트팀 @이서연 님, 다연컴퍼니에 오신 것을 환영합니다!",
        reactions: [{ e: "🎉", n: 7 }, { e: "👋", n: 5 }] },
      { from: "kim", day: "today", time: "08:41",
        text: "신입분들 오시면 프로젝트 채널 초대 부탁드립니다~" },
    ],
  },
  {
    id: "ticketon", name: "프로젝트-티켓온", type: "channel", visible: false, private: true,
    desc: "구성원 7명", topic: "티켓온 2.0 런칭 프로젝트 · D-12",
    messages: [
      { from: "sys", day: "today", time: "09:01", type: "system",
        text: "김팀장님이 이서연님을 채널에 초대했습니다." },
    ],
  },
  {
    id: "design", name: "디자인팀", type: "channel", visible: true,
    desc: "구성원 5명", topic: "디자인팀 작업 공유",
    messages: [
      { from: "han", day: "yesterday", time: "14:20",
        text: "티켓온 최종 시안 v4 공유드립니다. 예매 버튼 강조 컬러랑 좌석 범례 반영했어요. 개발팀에도 전달 완료!",
        file: { name: "TICKETON_Design_v4.fig", meta: "Figma 링크" },
        reactions: [{ e: "👍", n: 3 }] },
      { from: "des", day: "yesterday", time: "18:05",
        text: "오늘은 여기까지! 내일 개발팀 리뷰 있으니까 다들 일찍 와요 🙏" },
    ],
  },
  {
    id: "dev", name: "개발팀", type: "channel", visible: true,
    desc: "구성원 8명", topic: "개발팀 배포 / 이슈 공유",
    messages: [
      { from: "lee", day: "yesterday", time: "19:30",
        text: "티켓온 결제 모듈 v2.0.3 스테이징 배포 완료했습니다. 내일 오전 QA 부탁드려요.",
        reactions: [{ e: "✅", n: 2 }] },
      { from: "lee", day: "yesterday", time: "19:31",
        text: "변경사항: 결제 버튼 컴포넌트 교체(공유 폴더 시안 v2 기준), 비활성 상태 스타일 추가" },
    ],
  },
  {
    id: "chat", name: "잡담방", type: "channel", visible: true,
    desc: "다연컴퍼니 구성원 28명", topic: "업무 얘기 금지 🙅",
    messages: [
      { from: "han", day: "yesterday", time: "11:48", text: "오늘 점심 뭐 드세요?" },
      { from: "lee", day: "yesterday", time: "11:49", text: "국밥 ㄱ" },
      { from: "han", day: "yesterday", time: "11:49", text: "또요?ㅋㅋㅋㅋ 이번 주만 세 번째" },
      { from: "lee", day: "yesterday", time: "11:50", text: "국밥은 질리지 않습니다", reactions: [{ e: "😂", n: 5 }] },
      { from: "ga", day: "yesterday", time: "17:55", text: "퇴근하실 때 창문 꼭 닫아주세요~ 어제 비 들이쳤습니다" },
    ],
  },
];

const DMS = [
  {
    id: "dm-kim", name: "김팀장", type: "dm", user: "kim", visible: true,
    messages: [
      { from: "kim", day: "today", time: "09:02",
        text: "이서연님 안녕하세요, 프로젝트팀 김민준입니다. 첫 출근 축하드려요 🙂" },
      { from: "kim", day: "today", time: "09:02",
        text: "오전엔 전체공지랑 잡담방 둘러보시면서 분위기 익히시고, 이따 프로젝트 채널에 초대드릴게요." },
    ],
  },
  { id: "dm-lee", name: "이대리", type: "dm", user: "lee", visible: true, messages: [] },
  { id: "dm-han", name: "한사원", type: "dm", user: "han", visible: true, messages: [] },
];

// ---------------------------------------------------------------------
// DAYEON TASK (업무 시스템) 에 표시될 업무 상세
// status: "진행 전" | "진행 중" | "완료"
// attachments type: "file" | "link" | "locked"
// ---------------------------------------------------------------------
const TASKS = [
  {
    no: 1, code: "TASK-001", status: "진행 전",
    title: "결제 버튼 오류 원인 파악",
    owner: "이서연", due: "오전 10:30", from: "김팀장",
    background: "공연 예매 서비스에서 고객 문의가 23건 접수되었습니다. 디자인팀과 개발팀은 서로 다른 원인을 주장하고 있으며, 정확한 원인은 확인되지 않았습니다.",
    goal: "실제 예매 과정을 확인하고 문제가 발생하는 단계를 찾아 김팀장에게 보고하세요.",
    attachments: [
      { type: "file",   name: "고객_문의_23건.csv" },
      { type: "link",   name: "TICKET ON 테스트 사이트" },
      { type: "locked", name: "디자인팀_최종시안.fig" },
    ],
  },
];

// =====================================================================
//  TASK-001 실무 미션 데이터
// =====================================================================

// ---------------------------------------------------------------------
// 고객 문의 23건 (고객_문의_23건.csv)
//  (정답 분류는 private/data-private.js 의 INQUIRY_GROUPS 에 있음)
//  category: CS 상담원이 입력한 접수 분류 (정답과 1:1로 대응하지 않음)
// ---------------------------------------------------------------------
const INQUIRIES = [
  { id: "CS-251019-001", time: "08:12", channel: "전화",  category: "예매",     device: "PC 크롬",          status: "접수",
    title: "예매 버튼이 어디 있나요",
    body: "라스트 트레인 예매하려고 공연 페이지 들어갔는데 예매하는 버튼을 못 찾겠어요. 하트 버튼만 보이고요. 10분 넘게 찾다가 전화드립니다." },
  { id: "CS-251019-002", time: "08:15", channel: "채팅",  category: "예매",     device: "아이폰 사파리",    status: "접수",
    title: "예매 버튼이 회색이에요",
    body: "예매하기 버튼이 회색이라 매진인 줄 알았어요. 눌러보니 되긴 하는데 원래 이런가요?" },
  { id: "CS-251019-003", time: "08:18", channel: "전화",  category: "결제",     device: "PC 크롬",          status: "확인중",
    title: "결제하기가 안 눌려요",
    body: "좌석 고르고 결제 화면까지 갔는데 결제하기 버튼이 안 눌려요. 약관 동의도 체크했어요. 시간 제한 있다고 해서 급해요." },
  { id: "CS-251019-004", time: "08:21", channel: "이메일", category: "예매",    device: "갤럭시 크롬",      status: "접수",
    title: "매진인가요?",
    body: "안녕하세요. 오늘 11시 오픈이라고 해서 미리 페이지를 열어두었는데 예매하기 버튼이 흐리게 표시되어 있습니다. 아직 오픈 전이라 그런 건지, 매진이라 그런 건지 알 수 없어서 문의드립니다. 다른 공연 페이지도 똑같이 흐리게 보여요. 확인 부탁드립니다." },
  { id: "CS-251019-005", time: "08:24", channel: "채팅",  category: "결제",     device: "아이폰 사파리",    status: "확인중",
    title: "처리 중만 뜨고 끝나요",
    body: "결제하기 누르면 '처리 중'이라고 잠깐 뜨고 아무 일도 안 일어나요. 세 번 눌렀더니 그제야 넘어갔어요." },
  { id: "CS-251019-006", time: "08:27", channel: "전화",  category: "예매확인", device: "PC 크롬",          status: "확인중",
    title: "결제 완료인데 예매 내역이 없어요",
    body: "결제 완료 화면까지 봤는데 마이페이지에 예매 내역이 없어요. 예매번호도 받았는데요. 다시 결제해야 하나요?" },
  { id: "CS-251019-007", time: "08:30", channel: "전화",  category: "기타",     device: "PC 엣지",          status: "접수",
    title: "파란 버튼 눌렀는데 예매가 안 돼요",
    body: "공연 페이지에서 파란색 큰 버튼 눌렀는데 하트만 생기고 예매가 안 돼요. 예매하는 데가 따로 있나요?" },
  { id: "CS-251019-008", time: "08:33", channel: "채팅",  category: "예매",     device: "아이폰 사파리",    status: "접수",
    title: "부모님이 예매를 못 하시겠대요",
    body: "어머니가 예매하려는데 버튼이 안 보인다고 하셔서 제가 대신 봤는데 저도 한참 찾았어요. 글씨가 너무 연해요." },
  { id: "CS-251019-009", time: "08:36", channel: "이메일", category: "결제",    device: "PC 크롬",          status: "확인중",
    title: "중복 결제가 될까 봐 걱정됩니다",
    body: "결제하기 버튼이 반응이 없어서 5번 정도 눌렀습니다. 그 뒤에 결제 완료 화면이 떴는데, 혹시 5번 다 결제된 건 아닌지 걱정됩니다. 카드사 문자는 아직 안 왔습니다. 확인 부탁드립니다." },
  { id: "CS-251019-010", time: "08:39", channel: "이메일", category: "예매확인", device: "아이폰 사파리",   status: "확인중",
    title: "예매가 된 게 맞나요?",
    body: "결제 완료 화면이 떴고 예매번호 T2510-0417을 받았습니다. 그런데 마이페이지에는 '결제 확인 중' 주문만 있고 예매 내역이 없습니다. 카드 승인 문자는 왔습니다. 제 티켓이 정상적으로 예매된 게 맞나요? 공연 당일 입장이 걱정됩니다." },
  { id: "CS-251019-011", time: "08:41", channel: "이메일", category: "예매",    device: "PC 크롬",          status: "접수",
    title: "버튼 글자가 잘 안 보입니다",
    body: "시각이 좋지 않은 편인데 예매하기 버튼의 글자색과 배경색이 거의 같아 읽기가 어렵습니다. 화면을 확대해도 구분이 잘 안 됩니다. 개선 부탁드립니다." },
  { id: "CS-251019-012", time: "08:44", channel: "전화",  category: "결제",     device: "갤럭시 크롬",      status: "확인중",
    title: "약관 체크했는데 버튼이 계속 회색",
    body: "구매조건 동의 체크했는데도 결제 버튼이 계속 회색이에요. 눌러도 되는 건지 모르겠어요." },
  { id: "CS-251019-013", time: "08:46", channel: "채팅",  category: "예매확인", device: "갤럭시 크롬",      status: "확인중",
    title: "완료라더니 확인 중이래요",
    body: "완료됐다고 해놓고 마이페이지 가면 확인 중이라고 나와요. 뭐가 맞는 거예요?" },
  { id: "CS-251019-014", time: "08:47", channel: "전화",  category: "예매",     device: "갤럭시 삼성브라우저", status: "접수",
    title: "예매 버튼이 비활성 같아요",
    body: "버튼이 눌리지 않는 것처럼 보여서 안 눌렀어요. 회차를 안 골라서 그런가 했는데 골라도 똑같이 회색이에요." },
  { id: "CS-251019-015", time: "08:49", channel: "채팅",  category: "결제",     device: "PC 크롬",          status: "확인중",
    title: "결제 버튼 먹통",
    body: "결제하기 먹통입니다 빨리 봐주세요 11시 오픈인데" },
  { id: "CS-251019-016", time: "08:52", channel: "채팅",  category: "기타",     device: "아이폰 크롬",      status: "접수",
    title: "모바일에서 버튼이 안 보여요",
    body: "폰으로 보면 예매하기가 화면 아래 잘려서 안 보이고, 스크롤해도 회색이라 눈에 안 띄어요." },
  { id: "CS-251019-017", time: "08:55", channel: "이메일", category: "결제",    device: "PC 파이어폭스",    status: "확인중",
    title: "결제 버튼이 한 번에 안 됩니다",
    body: "결제 정보 입력 후 엔터를 눌러도 아무 반응이 없고, 마우스로 버튼을 눌러도 한 번에는 안 됩니다. 두세 번 눌러야 진행됩니다. 브라우저 문제인가 싶어 다른 브라우저로도 해봤는데 같습니다." },
  { id: "CS-251019-018", time: "08:58", channel: "전화",  category: "결제",     device: "PC 크롬",          status: "확인중",
    title: "결제 완료라는데 카드 문자가 안 와요",
    body: "사이트에서는 결제 완료라는데 카드사 문자가 안 와요. 결제가 된 건지 안 된 건지 모르겠어요." },
  { id: "CS-251019-019", time: "09:00", channel: "전화",  category: "결제",     device: "아이폰 사파리",    status: "확인중",
    title: "결제 화면에서 멈춰요",
    body: "결제하기 누르니까 화면이 잠깐 멈추고 다시 그대로예요. 좌석 선택 시간 끝날까 봐 불안해요." },
  { id: "CS-251019-020", time: "09:03", channel: "채팅",  category: "예매",     device: "PC 크롬",          status: "접수",
    title: "예매 버튼 어디예요?",
    body: "예매 버튼 어디예요?" },
  { id: "CS-251019-021", time: "09:04", channel: "이메일", category: "예매확인", device: "PC 엣지",         status: "확인중",
    title: "예매 내역 미반영",
    body: "결제 완료 안내를 받았으나 예매 내역 조회 시 '예매 내역이 없습니다'로 표시됩니다. 30분째 그대로입니다. 처리 부탁드립니다." },
  { id: "CS-251019-022", time: "09:06", channel: "채팅",  category: "결제",     device: "갤럭시 크롬",      status: "확인중",
    title: "버튼 눌리는 느낌이 없어요",
    body: "버튼을 눌러도 눌리는 느낌이 없어요. 비활성처럼 보이는데 실제로는 되는 건가요?" },
  { id: "CS-251019-023", time: "09:08", channel: "채팅",  category: "예매확인", device: "아이폰 크롬",      status: "접수",
    title: "결제 완료 떴는데 티켓이 없어요",
    body: "결제 완료 떴는데 티켓이 없어요 ㅠㅠ" },
];
const INQUIRY_CATEGORIES = ["예매", "결제", "예매확인", "기타"];

// ---------------------------------------------------------------------
// 조사 보고서 선택지
// ---------------------------------------------------------------------
const REPORT = {
  stages: [
    { id: "browse",  label: "공연 탐색" },
    { id: "start",   label: "예매 시작" },
    { id: "seat",    label: "좌석 선택" },
    { id: "payreq",  label: "결제 요청" },
    { id: "payres",  label: "결제 결과 확인" },
    { id: "mypage",  label: "예매 내역 조회" },
  ],
  questions: [
    { id: "problems", title: "② 확인된 주요 문제", help: "고객 문의와 테스트 결과에서 발견한 주요 문제를 정리하세요." },
    { id: "evidence", title: "③ 그렇게 판단한 근거", help: "고객 문의 번호나 테스트 결과 등 구체적인 증거를 작성하세요." },
    { id: "followup", title: "④ 추가로 확인해야 할 사항", help: "어떤 부분을 더 조사해야 하는지 이유와 함께 작성하세요." },
  ],
};

// TICKET ON 이상 현상 기록 — 문제 유형(분류용, 원인을 암시하지 않음)
const RECORD_TYPES = ["화면 표시 관련", "사용자 조작 관련", "처리 결과 관련", "아직 판단하기 어려움"];

// ---------------------------------------------------------------------
// TICKET ON 테스트 사이트 데이터
// ---------------------------------------------------------------------
const SHOW = {
  title: "뮤지컬 〈라스트 트레인〉",
  genre: "뮤지컬",
  venue: "다연아트홀 대극장",
  period: "2026.11.07 ~ 2026.12.28",
  runtime: "150분 (인터미션 15분)",
  age: "8세 이상 관람가",
  cast: ["김도현", "박서윤", "이준혁", "최가온"],
  dates: [
    { d: "11.07 (토)", t: "14:00", left: 128 },
    { d: "11.07 (토)", t: "19:00", left: 34 },
    { d: "11.08 (일)", t: "15:00", left: 61 },
  ],
  prices: { VIP: 150000, R: 120000, S: 90000 },
  openAt: "오늘 11:00 티켓 오픈",
};

// =====================================================================
//  TASK-002. 제가 만든 디자인이 아닌데요? — 디자인 시안 불일치 원인 조사 및 UI/UX 개선
// =====================================================================
TASKS.push({
  no: 2, code: "TASK-002", status: "진행 전",
  title: "디자인 시안 불일치 원인 조사 및 UI/UX 개선",
  subtitle: "제가 만든 디자인이 아닌데요?",
  owner: "이서연", due: "오전 11:30", from: "김팀장", priority: "높음",
  background: "디자인팀은 TICKET ON 웹사이트의 최종 디자인 시안으로 v4를 전달했다고 주장합니다. 하지만 개발팀은 v2를 전달받았으며 그에 따라 구현했다고 주장하고 있습니다. 현재 운영 사이트에서는 실제 고객이 사용하기 어려운 UI 문제가 여러 개 발견되었습니다.",
  goal: "기존 운영 화면과 디자인팀 최종 시안을 비교합니다. 사용자 경험에 영향을 주는 문제를 찾아내고, 어떤 디자인 원칙을 위반했는지 분석합니다. 적절한 개선안을 직접 적용한 뒤 수정된 화면을 확인하고 검수 결과를 보고합니다.",
  attachments: [
    { type: "design", version: "v2", name: "TICKETON_Design_v2.fig", meta: "기존 디자인 · 개발팀 공유 폴더" },
    { type: "design", version: "v4", name: "TICKETON_Design_v4.fig", meta: "디자인팀 최종 시안" },
    { type: "link",   name: "TICKET_ON_운영사이트", meta: "현재 테스트 사이트" },
    { type: "guide",  name: "DAYEON_UIUX_가이드.pdf", meta: "디자인 업무 참고자료" },
  ],
});

const TASK2 = {
  // ---------- 디자인 파일 메타 ----------
  files: {
    v2: { name: "TICKETON_Design_v2.fig", version: "v2", date: "2026-09-28", author: "디자인팀 한유리", note: "개발팀 공유 폴더에 있던 버전" },
    v4: { name: "TICKETON_Design_v4.fig", version: "v4 (최종)", date: "2026-10-16", author: "디자인팀 한유리", note: "디자인팀이 최종 전달했다고 주장하는 버전" },
  },
  pages: [
    { id: "show",     label: "공연 상세" },
    { id: "seats",    label: "좌석 선택" },
    { id: "checkout", label: "결제 확인" },
    { id: "mobile",   label: "모바일 (공연 상세)" },
  ],

  // ---------- MISSION A. 검수 지점 (클릭 가능한 요소) ----------
  //  정답(issue/principles/explain)은 private/data-private.js 의 TASK2_ANSWERS 에 있음
  spots: [
    { id: "reserve",    page: "show",     label: "예매하기 버튼" },
    { id: "info",       page: "show",     label: "공연 정보 영역 (공연명·날짜·가격)" },
    { id: "seatLegend", page: "seats",    label: "좌석 상태 표시와 범례" },
    { id: "buttons",    page: "checkout", label: "결제 화면 버튼 스타일" },
    { id: "mobile",     page: "mobile",   label: "모바일 레이아웃" },
    { id: "poster",     page: "show",     label: "포스터 색감·장식선" },
    { id: "stage",      page: "seats",    label: "무대(STAGE) 표시 모양" },
    { id: "heart",      page: "show",     label: "관심공연 하트 아이콘" },
  ],

  // ---------- MISSION B. 디자인 원칙 (사내 가이드) ----------
  principles: [
    { id: "hierarchy", name: "시각적 위계", short: "중요한 정보가 먼저 보이도록 구성",
      desc: "사용자의 시선은 크고, 진하고, 대비가 강한 것에 먼저 갑니다. 화면에서 가장 중요한 정보와 행동(예: 공연명, 예매 버튼)을 크기·굵기·색·위치로 가장 먼저 보이게 만들고, 덜 중요한 정보는 작게 둡니다.",
      example: "공연명은 가장 크게, 날짜와 장소는 중간, 안내 문구는 작게. 주요 버튼은 하나만 강조색으로." },
    { id: "contrast", name: "대비", short: "글자와 배경, 버튼이 명확하게 구별되도록 구성",
      desc: "글자색과 배경색의 밝기 차이가 충분해야 읽을 수 있습니다. 웹 접근성 기준(WCAG)에서는 일반 글자 4.5:1 이상의 명도 대비를 권장합니다. 버튼은 주변과 구별되는 색으로 '누를 수 있는 것'임을 드러내야 합니다.",
      example: "연회색 배경 위 연회색 글자(비권장) → 흰 배경 위 짙은 글자, 블루 배경 위 흰 글자(권장)." },
    { id: "consistency", name: "일관성", short: "동일한 기능은 비슷한 디자인과 동작을 유지",
      desc: "같은 역할의 요소는 화면이 바뀌어도 같은 모양·위치·동작을 유지해야 합니다. 사용자는 한 번 배운 규칙을 다른 화면에서도 그대로 쓰기 때문에, 규칙이 깨지면 매번 다시 배워야 합니다.",
      example: "모든 화면에서 '다음 단계' 버튼은 오른쪽 아래, 채움 블루. '이전'은 윤곽선 버튼." },
    { id: "accessibility", name: "접근성", short: "다양한 사용자가 정보를 이해하고 조작할 수 있도록 구성",
      desc: "색각 이상, 저시력, 고령, 작은 화면, 키보드만 쓰는 사용자도 같은 정보를 얻고 같은 일을 할 수 있어야 합니다. 색에만 의존하지 말고 텍스트·기호·모양을 함께 쓰고, 터치 영역과 글자 크기를 충분히 둡니다.",
      example: "좌석 상태를 색 + 기호(✓ ×) + 범례 텍스트로 표시. 버튼 높이 44px 이상." },
    { id: "feedback", name: "피드백", short: "사용자의 행동에 대해 상태와 결과를 알려주는 것",
      desc: "클릭·선택·입력을 했을 때 '받아들여졌다'는 신호(색 변화, 체크 표시, 로딩, 완료 메시지)를 즉시 보여줘야 합니다. 신호가 없으면 사용자는 같은 동작을 반복하거나 포기합니다.",
      example: "좌석을 누르면 선택 중 표시가 바뀌고 합계가 갱신됨. 결제하기를 누르면 처리 중 → 결과 안내." },
    { id: "responsive", name: "반응형 디자인", short: "화면 크기에 따라 사용 가능한 레이아웃 제공",
      desc: "같은 페이지가 PC·태블릿·스마트폰에서 각각 읽기 쉽고 조작 가능해야 합니다. 폭이 좁아지면 열을 줄이고(여러 열 → 한 열), 주요 버튼은 손이 닿는 곳에 두며, 내용이 잘리거나 가로 스크롤이 생기지 않게 합니다.",
      example: "PC에서는 정보+예매 패널 2열, 모바일에서는 1열 + 하단 고정 예매 버튼." },
  ],

  // ---------- MISSION C. 디자인 수정 옵션 ----------
  //  선택지 평가(verdict/why)는 private/data-private.js 의 TASK2_ANSWERS 에 있음
  options: [
    { id: "btnStyle", title: "① 예매 버튼 강조 스타일", group: "예매 버튼 개선", choices: [
      { id: "blue",    label: "블루 채움 (강조)" },
      { id: "outline", label: "블루 윤곽선" },
      { id: "red",     label: "빨강 채움" },
      { id: "gray",    label: "연회색 유지 (현재)" },
    ]},
    { id: "contrast", title: "② 버튼 글자 대비", group: "예매 버튼 개선", choices: [
      { id: "high",   label: "높음 (흰 글자 / 진한 배경)" },
      { id: "mid",    label: "중간 (회색 글자)" },
      { id: "low",    label: "낮음 (배경과 비슷한 글자)" },
    ]},
    { id: "label", title: "③ 버튼 문구", group: "예매 버튼 개선", choices: [
      { id: "reserve", label: "예매하기" },
      { id: "short",   label: "예매" },
      { id: "hype",    label: "지금 바로 티켓 구매하기!!" },
      { id: "ok",      label: "확인" },
    ]},
    { id: "placement", title: "④ 버튼 배치", group: "예매 버튼 개선", choices: [
      { id: "belowInfo", label: "관람일 선택 바로 아래, 관심공연은 보조로" },
      { id: "top",       label: "패널 맨 위" },
      { id: "belowLike", label: "관심공연 버튼 아래 (현재)" },
    ]},
    { id: "infoLayout", title: "⑤ 공연 정보 배치", group: "공연 정보 배치", choices: [
      { id: "hierarchy", label: "공연명 크게 → 날짜·장소 → 가격 순" },
      { id: "priceFirst", label: "가격을 가장 크게" },
      { id: "equal",     label: "모두 같은 크기 (현재)" },
    ]},
    { id: "seatState", title: "⑥ 좌석 상태 구별 방식", group: "좌석 상태 디자인", choices: [
      { id: "colorLabelLegend", label: "색 + 기호(✓ ×) + 텍스트 범례" },
      { id: "colorSymbol",      label: "색 + 기호만" },
      { id: "colorOnly",        label: "색만 (현재)" },
    ]},
    { id: "mobile", title: "⑦ 모바일 레이아웃", group: "모바일 대응", choices: [
      { id: "stack", label: "한 열로 쌓기 + 하단 고정 예매 버튼" },
      { id: "scale", label: "전체 축소해서 맞추기" },
      { id: "fixed", label: "데스크톱 폭 유지 (현재)" },
    ]},
    { id: "consistency", title: "⑧ 버튼 일관성 규칙", group: "버튼 일관성", choices: [
      { id: "unified", label: "주요=채움 블루 / 보조=윤곽선, 모든 화면 동일" },
      { id: "allOutline", label: "모든 버튼 윤곽선" },
      { id: "mixed",   label: "화면마다 제각각 (현재)" },
    ]},
  ],
  // 시안별 옵션 값 (미리보기와 TICKET ON 이 같은 키를 사용)
  v2: { btnStyle: "gray", contrast: "low",  label: "reserve", placement: "belowLike", infoLayout: "equal",     seatState: "colorOnly",        mobile: "fixed", consistency: "mixed",   poster: "warm", stage: "round", heart: "outline" },
  v4: { btnStyle: "blue", contrast: "high", label: "reserve", placement: "belowInfo", infoLayout: "hierarchy", seatState: "colorLabelLegend", mobile: "stack", consistency: "unified", poster: "cool", stage: "flat",  heart: "filled" },

  // ---------- 검수 보고서 질문 ----------
  report: {
    questions: [
      { id: "expected", title: "④ 개선 후 기대되는 사용자 경험", help: "수정한 화면에서 사용자가 어떻게 달라진 경험을 하게 될지 적으세요." },
      { id: "devChecks", title: "⑤ 추가로 확인해야 할 개발 관련 사항", help: "디자인 수정으로 해결되지 않는 부분이나 개발팀에 확인을 요청할 내용을 적으세요." },
    ],
  },

};

// =====================================================================
//  TASK-003. 작동하지 않는 버튼의 비밀 — 예매 버튼 오류 추적 및 프런트엔드 디버깅
// =====================================================================
TASKS.push({
  no: 3, code: "TASK-003", status: "진행 전",
  title: "작동하지 않는 버튼의 비밀",
  subtitle: "예매 버튼 오류 추적 및 프런트엔드 디버깅",
  owner: "이서연", due: "오후 1:30", from: "김팀장", priority: "높음", kind: "프런트엔드 오류 조사",
  background: "TICKET ON의 UI 개선 작업이 완료되었지만, 공연 상세 페이지에서 '예매하기' 버튼을 클릭해도 좌석 선택 화면으로 이동하지 않는 문제가 발생하고 있습니다. 디자인팀은 시안과 구현 화면이 일치한다고 보고했으며, 개발팀은 프런트엔드 코드의 문제 가능성을 조사 중입니다.",
  goal: "오류가 발생하는 상황을 직접 재현하고, 개발자 도구에서 오류 메시지를 확인합니다. HTML과 JavaScript 코드를 분석해 원인을 찾아 수정하고, 수정 결과를 테스트한 뒤 오류 수정 보고서를 작성합니다.",
  attachments: [
    { type: "link", name: "TICKET_ON_테스트사이트", meta: "오류 재현 · 재테스트" },
    { type: "dev", file: "html", name: "index.html", meta: "공연 상세 화면 일부" },
    { type: "dev", file: "js", name: "reservation.js", meta: "예매 기능 관련 코드" },
    { type: "dev", file: "log", name: "console.log", meta: "브라우저 콘솔 기록" },
    { type: "dev", file: "manual", name: "프런트엔드_개발_업무_매뉴얼.pdf", meta: "디버깅 참고자료" },
  ],
});

const TASK3 = {
  // ---------- 개발자 도구에 표시되는 파일 ----------
  files: [
    { id: "html", name: "index.html", lang: "html", label: "공연 상세 화면 일부" },
    { id: "js", name: "reservation.js", lang: "js", label: "예매 기능 코드", editable: true },
    { id: "log", name: "console.log", lang: "log", label: "브라우저 콘솔 기록" },
    { id: "manual", name: "프런트엔드_개발_업무_매뉴얼.pdf", lang: "doc", label: "참고자료" },
  ],
  html: [
    `<!-- 공연 상세: 예매 패널 (v4 디자인 반영) -->`,
    `<section class="booking-panel">`,
    `  <h1 id="showTitle">뮤지컬 〈라스트 트레인〉</h1>`,
    `  <p id="showDate">2026.11.07 ~ 12.28 · 다연아트홀 대극장</p>`,
    `  <p id="showPrice">VIP 150,000원 · R 120,000원 · S 90,000원</p>`,
    `  <div class="show-info">종착역을 향해 달리는 마지막 열차…</div>`,
    ``,
    `  <button id="reserveBtn" class="btn btn-primary">`,
    `    예매하기`,
    `  </button>`,
    `  <button id="likeBtn" class="btn btn-secondary">`,
    `    ♡ 관심공연`,
    `  </button>`,
    `</section>`,
    ``,
    `<script src="reservation.js"></script>`,
  ],
  // reservation.js: 1~2행이 수정 가능 영역 (요소 선택). 오류는 4행에서 발생
  js: [
    `const reserveButton =`,
    `  document.getElementById("reservationBtn");`,
    ``,
    `reserveButton.addEventListener("click", () => {`,
    `  goToSeatSelection();`,
    `});`,
    ``,
    `function goToSeatSelection() {`,
    `  location.href = "/seats?show=last-train";`,
    `}`,
  ],
  editableLines: [1, 2],
  log: [
    { level: "info", text: "[TICKET ON] 공연 상세 페이지 로드 · 디자인 v4 반영 (build 2026.10.19-2)" },
    { level: "info", text: "[TICKET ON] 예매 패널 렌더링 완료 (booking-panel)" },
    { level: "error", text: "Uncaught TypeError: Cannot read properties of null (reading 'addEventListener')", at: "reservation.js:4" },
    { level: "info", text: "[TICKET ON] 관심공연 버튼 이벤트 등록 완료 (likeBtn)" },
  ],
  // 가상 DOM: 개발자 도구의 테스트가 선택자를 검사할 때 사용
  dom: [
    { tag: "h1", id: "showTitle", classes: [] },
    { tag: "p", id: "showDate", classes: [] },
    { tag: "p", id: "showPrice", classes: [] },
    { tag: "div", id: "", classes: ["show-info"] },
    { tag: "button", id: "reserveBtn", classes: ["btn", "btn-primary"], text: "예매하기" },
    { tag: "button", id: "likeBtn", classes: ["btn", "btn-secondary"], text: "♡ 관심공연" },
  ],
  target: "reserveBtn",
  manual: [
    { h: "1. HTML과 JavaScript는 어떻게 연결되나요?", p: "HTML은 화면에 보이는 요소(버튼, 글자, 입력창)를 정의하고, JavaScript는 그 요소를 찾아서 동작을 붙입니다. 브라우저는 HTML을 읽어 DOM(문서 객체 모델)이라는 나무 구조를 만들고, JavaScript는 이 DOM에서 요소를 찾아 조작합니다." },
    { h: "2. 요소를 찾는 방법 (선택자)", p: "document.getElementById(\"아이디\") 는 HTML에서 id=\"아이디\" 인 요소 하나를 돌려줍니다. document.querySelector(\"#아이디\") 나 document.querySelector(\".클래스\") 도 같은 일을 합니다. 찾는 요소가 없으면 결과는 null(없음) 입니다." },
    { h: "3. 이벤트 리스너", p: "요소.addEventListener(\"click\", 함수) 는 그 요소를 클릭했을 때 함수를 실행하도록 등록합니다. 요소가 null이면 addEventListener 자체를 부를 수 없어서 오류가 나고, 그 줄 이후의 코드는 실행되지 않습니다." },
    { h: "4. 콘솔 오류 읽는 법", p: "'Cannot read properties of null (reading 'X')' 는 null 에서 X 를 읽으려 했다는 뜻입니다. 뒤에 붙는 '파일명:줄번호' 가 오류가 난 위치입니다. 그 줄에서 어떤 값이 null 이 되었는지, 그 값은 어디서 만들어졌는지 거슬러 올라가며 찾습니다." },
    { h: "5. 수정 후 확인", p: "코드를 고친 뒤에는 (1) 콘솔에 오류가 사라졌는지 (2) 실제 화면에서 기능이 동작하는지 (3) 두 번 이상 반복해도 같은 결과인지 확인합니다. 하나만 확인하고 끝내지 않습니다." },
  ],
  report: {
    stages: [
      { id: "start", label: "예매 시작 (예매하기 버튼)" },
      { id: "seat", label: "좌석 선택" },
      { id: "payreq", label: "결제 요청" },
      { id: "payres", label: "결과 안내" },
    ],
    questions: [
      { id: "found", title: "② 발견한 오류", help: "테스트 과정에서 확인한 오류를 설명하세요." },
      { id: "cause", title: "③ 오류의 원인", help: "어떤 코드 또는 동작 때문에 문제가 발생했는지 설명하세요." },
      { id: "improve", title: "⑥ 추가 개선 의견", help: "사용자 경험이나 개발 품질을 높이기 위해 추가로 개선할 사항이 있나요?" },
    ],
    discussion: [
      { id: "dq1", side: "디자인 관점", q: "사용자가 예매하기 버튼을 클릭했을 때 어떤 결과를 기대할까요?" },
      { id: "dq2", side: "디자인 관점", q: "화면이 전환되지 않거나 오류가 발생했다면 사용자에게 어떻게 알려주는 것이 좋을까요?" },
      { id: "dq3", side: "개발 관점", q: "어떤 코드 때문에 버튼이 동작하지 않았나요?" },
      { id: "dq4", side: "개발 관점", q: "앞으로 비슷한 오류를 방지하려면 무엇을 확인해야 할까요?" },
    ],
  },
};

// =====================================================================
//  TASK-004. 결제 대참사 — 중복 결제 요청 및 잘못된 결제 상태 안내 문제 해결
// =====================================================================
TASKS.push({
  no: 4, code: "TASK-004", status: "진행 전",
  title: "결제 대참사",
  subtitle: "중복 결제 요청 및 잘못된 결제 상태 안내 문제 해결",
  owner: "이서연", due: "오후 3:00", from: "김팀장", priority: "긴급", kind: "결제 오류 조사·개선",
  background: "TICKET ON에서 결제 관련 문제가 발생했습니다. 고객은 결제 버튼을 클릭한 후 진행 상황을 명확하게 알 수 없으며, 같은 결제를 여러 번 요청할 수 있습니다. 일부 결제는 실제로 정상 처리되지 않았지만 웹사이트에서는 완료된 것으로 안내하고 있습니다.",
  goal: "결제 오류를 직접 재현하고, 실제 요청 기록과 사용자 화면을 비교합니다. 사용자 경험상의 문제를 분석하고 결제 처리 코드를 조사한 뒤, UI와 개발 로직을 모두 개선합니다. 수정 결과를 QA로 검증하고 업무 보고서를 제출합니다.",
  attachments: [
    { type: "link", name: "TICKET_ON_결제테스트", meta: "결제 확인 화면 · 시나리오 A/B/C" },
    { type: "pay", file: "js", name: "payment.js", meta: "결제 처리 코드" },
    { type: "pay", file: "net", name: "payment_network.log", meta: "요청 및 응답 기록" },
    { type: "payui", name: "payment_ui.fig", meta: "결제 UI 시안 · 상태별 디자인" },
    { type: "pay", file: "cases", name: "payment_test_cases.md", meta: "테스트 케이스" },
    { type: "pay", file: "manual", name: "결제_처리_업무_매뉴얼.pdf", meta: "참고자료" },
  ],
});

const TASK4 = {
  files: [
    { id: "js", name: "payment.js", lang: "js", label: "결제 처리 코드", editable: true },
    { id: "net", name: "payment_network.log", lang: "net", label: "요청·응답 기록 (Network)" },
    { id: "cases", name: "payment_test_cases.md", lang: "doc", label: "테스트 케이스" },
    { id: "manual", name: "결제_처리_업무_매뉴얼.pdf", lang: "doc", label: "참고자료" },
  ],
  // payment.js — 5행부터 끝까지 수정 가능 (handlePayment 와 그 위의 선언)
  js: [
    `// 결제 확인 화면 - 결제하기 버튼`,
    `const payButton = document.getElementById("payBtn");`,
    ``,
    `payButton.addEventListener("click", handlePayment);`,
    ``,
    `async function handlePayment() {`,
    `  const result = await requestPayment(order);`,
    ``,
    `  showSuccessMessage();`,
    `}`,
  ],
  editableFrom: 5,
  maxEditLines: 16,
  // 코드에서 쓸 수 있는 함수/변수 (매뉴얼과 동일)
  api: [
    { sig: "requestPayment(order, options?)", desc: "결제 요청을 보내고 결과 객체를 돌려줍니다 (await 필요). options.idempotencyKey 를 넣으면 같은 결제 시도를 서버가 한 번만 처리합니다." },
    { sig: "result.ok / result.status", desc: "result.ok 는 결제 성공 여부(true/false). result.status 는 \"SUCCESS\" | \"DECLINED\" | \"DUPLICATE\" | \"TIMEOUT\". result.reason 은 실패 사유." },
    { sig: "createIdempotencyKey(order)", desc: "이번 결제 시도를 나타내는 고유 키를 만듭니다. 같은 시도 안에서는 같은 값을 돌려줍니다." },
    { sig: "showSuccessMessage(result)", desc: "결제 완료 화면을 보여줍니다." },
    { sig: "showFailureMessage(result)", desc: "결제 실패 안내와 다시 시도 방법을 보여줍니다." },
    { sig: "showPendingMessage()", desc: "결과를 확인하는 중이라는 안내를 보여줍니다 (응답 지연·오류)." },
    { sig: "isProcessing", desc: "처리 중 여부를 담을 수 있는 변수 (직접 선언해서 사용)." },
  ],
  cases: [
    { id: "normal", name: "정상 결제", expect: "완료 안내와 실제 처리 결과가 일치한다" },
    { id: "rapid", name: "빠른 연속 클릭", expect: "동일 결제 시도가 중복 처리되지 않는다" },
    { id: "slow", name: "응답 지연", expect: "처리 중 상태가 명확히 표시된다" },
    { id: "fail", name: "결제 실패", expect: "실패 안내와 적절한 후속 행동을 제공한다" },
    { id: "mypage", name: "예매 내역 확인", expect: "실제 성공한 예매만 정상 반영된다" },
  ],
  scenarios: [
    { id: "A", name: "느린 응답", desc: "응답이 약 3초 뒤 도착합니다. 그동안 버튼을 다시 누를 수 있는지 확인하세요." },
    { id: "B", name: "결제 실패", desc: "카드사가 결제를 거절합니다. 화면 안내가 실제 결과와 맞는지 확인하세요." },
    { id: "C", name: "중복 요청", desc: "같은 결제 시도에 요청이 여러 번 발생합니다. 요청 개수와 실제 처리 결과를 비교하세요." },
  ],
  manual: [
    { h: "1. 결제 요청은 '기다리는' 작업입니다", p: "requestPayment() 는 서버에 요청을 보내고 응답이 올 때까지 기다립니다. 그래서 async 함수 안에서 await 를 붙여 호출해야 결과 객체를 받을 수 있습니다. await 가 없으면 결과 대신 '약속(Promise)'이 들어와 result.ok 같은 값이 undefined 가 됩니다." },
    { h: "2. HTTP 상태 코드와 결제 성공은 다릅니다", p: "서버가 200 OK 로 응답했다는 것은 '요청을 받아 처리했다'는 뜻이지 '결제가 승인됐다'는 뜻이 아닙니다. 승인 여부는 응답 본문의 result.ok 또는 result.status(SUCCESS / DECLINED …)로 판단해야 합니다. 409 는 서버가 같은 요청을 이미 받았다는 뜻입니다." },
    { h: "3. 처리 중에는 다시 보내지 않기 (클라이언트 보호)", p: "사용자가 버튼을 여러 번 누르면 요청이 그만큼 나갑니다. 처리 중 플래그(isProcessing)를 두고 요청 전에 true, 응답 후에 false 로 바꾸면서 true 일 때는 함수를 바로 return 하면 반복 요청을 막을 수 있습니다. 화면에서는 버튼을 비활성화하고 '처리 중' 안내를 보여줍니다." },
    { h: "4. 같은 결제 시도는 한 번만 처리하기 (서버 보호, 멱등성)", p: "클라이언트 보호만으로는 부족합니다(새로고침, 느린 네트워크, 다른 탭). 같은 결제 시도에 같은 키(idempotencyKey)를 붙여 보내면 서버는 그 키로 결과를 하나만 저장하고, 같은 키가 다시 오면 처리하지 않고 저장된 결과를 돌려줍니다. 키는 시도마다 하나여야 하며 클릭할 때마다 새로 만들면 의미가 없습니다." },
    { h: "5. 결과에 따라 화면을 나누기", p: "성공(SUCCESS)이면 완료 화면, 실패(DECLINED)면 사유와 다시 시도 방법, 응답이 없거나 오류(TIMEOUT)면 '결과를 확인하는 중'을 보여줍니다. 결과가 불확실할 때 성공이나 실패로 단정하면 고객이 이중 결제하거나 표를 잃을 수 있습니다." },
  ],
  // 결제 UI 옵션 (상태별). 평가(verdict/why)는 private/data-private.js 의 TASK4_ANSWERS 에 있음
  ui: [
    { id: "btnLabel", title: "① 결제 버튼 문구", state: "A", choices: [
      { id: "amount", label: "'244,000원 결제하기' (금액 포함)" }, { id: "pay", label: "'결제하기' (현재)" }, { id: "ok", label: "'확인'" }, { id: "go", label: "'결제 진행'" } ] },
    { id: "processing", title: "② 처리 중 안내", state: "B", choices: [
      { id: "none", label: "안내 없음 (현재)" }, { id: "text", label: "버튼 문구가 '처리 중…'으로 바뀜" }, { id: "spinner", label: "버튼 문구 변경 + 로딩 스피너" }, { id: "overlay", label: "화면 전체 로딩 오버레이 + '결제를 처리하고 있습니다' 안내" } ] },
    { id: "lock", title: "③ 처리 중 버튼 상태", state: "B", choices: [
      { id: "none", label: "그대로 누를 수 있음 (현재)" }, { id: "disabled", label: "처리 중에는 버튼 비활성화" }, { id: "hidden", label: "처리 중에는 버튼 숨김" } ] },
    { id: "success", title: "④ 결제 성공 안내", state: "C", choices: [
      { id: "text", label: "'결제 완료' 텍스트만 (현재)" }, { id: "detail", label: "체크 아이콘 + 예매번호·좌석 + '예매 내역 확인' 버튼" }, { id: "modal", label: "팝업으로 '완료' 표시 후 홈으로 이동" } ] },
    { id: "fail", title: "⑤ 결제 실패 안내", state: "C", choices: [
      { id: "none", label: "별도 안내 없음 (현재: 완료처럼 표시)" }, { id: "reason", label: "빨간 오류 문구 + 실패 사유" }, { id: "reasonHelp", label: "오류 문구 + 사유 + 해결 방법(다른 카드, 한도 확인)" } ] },
    { id: "retry", title: "⑥ 실패 후 다시 시도", state: "C", choices: [
      { id: "none", label: "없음 (현재)" }, { id: "retry", label: "'다시 시도' 버튼" }, { id: "retryHelp", label: "'다시 시도' + '결제수단 변경' + 고객센터 안내" } ] },
    { id: "pending", title: "⑦ 결과 확인 필요(지연·오류) 안내", state: "C", choices: [
      { id: "none", label: "없음 (현재)" }, { id: "wait", label: "'결제 결과를 확인하고 있습니다' + 잠시 후 조회 안내" }, { id: "waitCheck", label: "확인 중 안내 + '결제 상태 조회' 버튼 + 중복 결제 주의 문구" } ] },
  ],
  defaultUi: { btnLabel: "pay", processing: "none", lock: "none", success: "text", fail: "none", retry: "none", pending: "none" },
  report: {
    questions: [
      { id: "problem", title: "① 발견한 문제", help: "결제 과정에서 어떤 문제가 발생했나요?" },
      { id: "ux", title: "② 사용자 경험 측면의 문제", help: "사용자가 어떤 상황에서 혼란을 겪거나 잘못된 행동을 할 수 있었나요?" },
      { id: "dev", title: "③ 개발 측면의 문제", help: "어떤 프로그램 동작 때문에 오류가 발생했나요?" },
      { id: "followup", title: "⑥ 추가 확인이 필요한 사항", help: "결제 처리와 관련하여 추가로 확인할 사항을 작성하세요." },
    ],
  },
};

// =====================================================================
//  TASK-005 《수상한 배포 기록》 — 공유 폴더 · Git 기록 · 배포 이력 · QA · 지난 대화 · 타임라인 (모두 교육용 가상 데이터)
//  시간 기준: 사건 전날(10.18) 오후 ~ 오늘(10.19) 아침. 게임 전체의 버전 데이터와 일치해야 함
//   · v1.0.2 (빌드 b-1002-c91e) = 디자인 v2 + 오류 수정 전 코드 = 사고 당시 운영 버전
//   · v1.0.4 (빌드 b-1004-7f3a) = 디자인 v4 + 예매 버튼·결제 처리 수정 = 스테이징/QA 통과 버전
// =====================================================================
TASKS.push({
  no: 5, code: "TASK-005", status: "진행 전",
  title: "수상한 배포 기록",
  subtitle: "사라진 수정 내역과 잘못된 운영 버전의 진실",
  owner: "이서연", due: "오후 4:30", from: "김팀장", priority: "긴급", kind: "배포 사고 조사",
  background: "TICKET ON의 운영 환경과 테스트 환경에서 서로 다른 디자인과 코드가 발견되었습니다. 디자인팀과 개발팀은 최종 작업을 완료했다고 보고했으나, 실제 운영 사이트에는 이전 버전의 산출물이 반영되어 있었습니다. 당시 배포 과정에 문제가 있었을 가능성이 있습니다.",
  goal: "프로젝트 파일의 버전을 조사하고, 디자인팀과 개발팀의 변경 기록을 확인합니다. 테스트 환경과 운영 환경의 차이를 분석하고 배포 기록과 관련 자료를 대조한 뒤, 사고 발생 과정을 시간순으로 재구성하고 근본 원인과 재발 방지 대책을 작성합니다.",
  attachments: [
    { type: "ops", file: "files", name: "프로젝트_공유폴더", meta: "TICKET_ON 공유 드라이브" },
    { type: "dhist", name: "디자인_변경이력", meta: "TICKETON_Design v2 → v4" },
    { type: "ops", file: "git", name: "Git_커밋기록", meta: "ticketon-web 저장소" },
    { type: "ops", file: "deploy", name: "배포_이력", meta: "DAYEON DEPLOY" },
    { type: "ops", file: "qa", name: "QA_테스트결과", meta: "스테이징 테스트 10.18" },
    { type: "ops", file: "chat", name: "메신저_지난대화", meta: "#프로젝트-티켓온 · 어제" },
    { type: "ops", file: "guide", name: "배포_업무가이드", meta: "참고자료" },
  ],
});

const TASK5 = {
  // ---------- 공유 폴더 ----------
  folders: [
    { id: "root", name: "TICKET_ON", parent: null },
    { id: "plan", name: "01_기획자료", parent: "root" },
    { id: "design", name: "02_디자인", parent: "root" },
    { id: "dev", name: "03_개발", parent: "root" },
    { id: "src", name: "source", parent: "dev" },
    { id: "build", name: "build", parent: "dev" },
    { id: "qa", name: "04_QA", parent: "root" },
    { id: "rel", name: "05_배포", parent: "root" },
    { id: "final", name: "final", parent: "rel" },
    { id: "finalnew", name: "final_new", parent: "rel" },
    { id: "finalfinal", name: "최종_진짜최종", parent: "rel" },
  ],
  files: [
    { id: "f-plan", folder: "plan", name: "TICKETON_기획안_v1.pdf", type: "PDF", modified: "10.06 14:20", author: "김팀장", size: "2.4 MB", version: "v1",
      info: { kind: "기획 문서", summary: "공연 예매 서비스 기획안 (화면 흐름·요구사항). 사건과 직접 관련은 없음.", history: [{ at: "10.06 14:20", by: "김팀장", what: "업로드" }] } },
    { id: "f-d2", folder: "design", name: "TICKETON_Design_v2.fig", type: "Figma", modified: "10.10 16:05", author: "한사원", size: "18.2 MB", version: "v2",
      info: { kind: "디자인 파일", designVersion: "v2", summary: "운영 사이트(v1.0.2)에 적용된 디자인. 예매하기 버튼 대비 낮음, 좌석 상태 표현 불명확, 모바일 레이아웃 문제.", changes: ["예매하기 버튼: 연회색 (저대비)", "좌석 상태: 색만으로 구분", "모바일: 결제 버튼 잘림"], history: [{ at: "10.10 16:05", by: "한사원", what: "업로드" }, { at: "10.13 10:30", by: "이대리", what: "개발 반영 (v1.0.2)" }] } },
    { id: "f-d3", folder: "design", name: "TICKETON_Design_v3.fig", type: "Figma", modified: "10.14 11:40", author: "한사원", size: "19.0 MB", version: "v3",
      info: { kind: "디자인 파일", designVersion: "v3", summary: "중간 수정안. 공연 정보 배치와 주요 버튼 스타일 개선. 예매하기 버튼은 아직 미확정.", changes: ["공연 정보 배치 개선", "주요 버튼 스타일 개선"], history: [{ at: "10.14 11:40", by: "한사원", what: "업로드" }, { at: "10.14 15:00", by: "김팀장", what: "검토 의견 (예매 버튼 더 강조)" }] } },
    { id: "f-d4", folder: "design", name: "TICKETON_Design_v4.fig", type: "Figma", modified: "10.18 17:20", author: "한사원", size: "19.6 MB", version: "v4 (최종)",
      info: { kind: "디자인 파일", designVersion: "v4", summary: "디자인팀 최종 시안. 예매하기 버튼 최종 디자인, 좌석 상태·접근성 개선, 모바일 레이아웃 수정. 10.18 17:22 메신저로 전달됨.", changes: ["예매하기 버튼: 파란색 주 버튼 (최종)", "좌석 상태: 색 + 아이콘·텍스트", "모바일 레이아웃 수정"], history: [{ at: "10.18 17:20", by: "한사원", what: "최종 업로드" }, { at: "10.18 17:22", by: "한사원", what: "#프로젝트-티켓온에 전달" }, { at: "10.18 17:28", by: "이대리", what: "개발 반영 (커밋 c17a3b8)" }] } },
    { id: "f-src", folder: "src", name: "ticketon-web (git)", type: "저장소", modified: "10.18 17:30", author: "이대리", size: "-", version: "release/1.0.4",
      info: { kind: "소스 저장소", codeVersion: "release/1.0.4 · 최신 커밋 5d0c4e2", summary: "개발팀 소스. 브랜치 release/1.0.4 에 예매 버튼 수정·결제 처리 수정·디자인 v4 적용이 커밋되어 있음. 자세한 내용은 Git_커밋기록 참고.", history: [{ at: "10.15 17:50", by: "이대리", what: "release 1.0.2 (9e3b1a0)" }, { at: "10.18 16:40", by: "이대리", what: "fix: reserve button (a81f2c9)" }, { at: "10.18 16:55", by: "이대리", what: "fix: payment result (b42e7d1)" }, { at: "10.18 17:28", by: "이대리", what: "style: design v4 (c17a3b8)" }, { at: "10.18 17:30", by: "이대리", what: "release 1.0.4 (5d0c4e2)" }] } },
    { id: "f-b102", folder: "build", name: "ticketon_v1.0.2.zip", type: "빌드", modified: "10.15 17:58", author: "이대리", size: "4.1 MB", version: "v1.0.2",
      info: { kind: "빌드 산출물", buildId: "b-1002-c91e", designVersion: "v2", codeVersion: "9e3b1a0 (main · v1.0.2)", buildAt: "10.15 17:58", owner: "이대리", summary: "초기 운영 배포용 빌드. 디자인 v2, 예매 버튼·결제 처리 수정 전 코드.", changes: ["공연 상세·좌석·결제 기본 기능"], history: [{ at: "10.15 17:58", by: "이대리", what: "빌드 생성" }, { at: "10.15 18:00", by: "김팀장", what: "05_배포/final 로 복사" }] } },
    { id: "f-b104", folder: "build", name: "ticketon_v1.0.4.zip", type: "빌드", modified: "10.18 17:35", author: "이대리", size: "4.3 MB", version: "v1.0.4",
      info: { kind: "빌드 산출물", buildId: "b-1004-7f3a", designVersion: "v4", codeVersion: "5d0c4e2 (release/1.0.4)", buildAt: "10.18 17:35", owner: "이대리", summary: "스테이징 테스트용 빌드. 디자인 v4 + 예매 버튼 수정(a81f2c9) + 결제 처리 수정(b42e7d1) 포함.", changes: ["fix: reserve button event selector", "fix: payment result handling", "style: apply final design v4"], history: [{ at: "10.18 17:35", by: "이대리", what: "빌드 생성" }, { at: "10.18 17:38", by: "이대리", what: "스테이징 배포 (D-117)" }, { at: "10.18 17:40", by: "이대리", what: "05_배포/final_new 로 복사" }] } },
    { id: "f-qa", folder: "qa", name: "테스트결과.xlsx", type: "Excel", modified: "10.18 17:45", author: "이대리", size: "96 KB", version: "10.18",
      info: { kind: "QA 결과", buildId: "b-1004-7f3a", summary: "스테이징(v1.0.4, 빌드 b-1004-7f3a)에서 12개 항목 테스트 · 12 PASS. 자세한 내용은 QA_테스트결과 참고.", history: [{ at: "10.18 17:45", by: "이대리", what: "테스트 완료·업로드" }] } },
    { id: "f-rf102", folder: "final", name: "ticketon_v1.0.2.zip", type: "빌드", modified: "10.15 18:00", author: "김팀장", size: "4.1 MB", version: "v1.0.2",
      info: { kind: "빌드 산출물 (복사본)", buildId: "b-1002-c91e", designVersion: "v2", codeVersion: "9e3b1a0 (main · v1.0.2)", buildAt: "10.15 17:58", owner: "이대리", summary: "10.15 운영 배포 때 사용한 파일의 복사본. 내용은 03_개발/build/ticketon_v1.0.2.zip 과 같음.", changes: ["공연 상세·좌석·결제 기본 기능"], history: [{ at: "10.15 18:00", by: "김팀장", what: "복사" }, { at: "10.15 18:02", by: "김팀장", what: "운영 배포 (D-110)" }] } },
    { id: "f-rn104", folder: "finalnew", name: "ticketon_v1.0.4.zip", type: "빌드", modified: "10.18 17:40", author: "이대리", size: "4.3 MB", version: "v1.0.4",
      info: { kind: "빌드 산출물 (복사본)", buildId: "b-1004-7f3a", designVersion: "v4", codeVersion: "5d0c4e2 (release/1.0.4)", buildAt: "10.18 17:35", owner: "이대리", summary: "QA 통과한 v1.0.4 빌드의 복사본. 운영 배포용으로 올려 둔 파일.", changes: ["fix: reserve button event selector", "fix: payment result handling", "style: apply final design v4"], history: [{ at: "10.18 17:40", by: "이대리", what: "복사 (운영 배포용)" }] } },
    { id: "f-ff102", folder: "finalfinal", name: "ticketon_v1.0.2.zip", type: "빌드", modified: "10.16 09:10", author: "김팀장", size: "4.1 MB", version: "v1.0.2",
      info: { kind: "빌드 산출물 (복사본)", buildId: "b-1002-c91e", designVersion: "v2", codeVersion: "9e3b1a0 (main · v1.0.2)", buildAt: "10.15 17:58", owner: "이대리", summary: "10.16 아침 김팀장이 복사해 둔 빌드 파일. 포함된 버전·빌드 ID·생성 시각은 아래 정보를 확인.", changes: ["공연 상세·좌석·결제 기본 기능"], history: [{ at: "10.16 09:10", by: "김팀장", what: "복사 (폴더 생성)" }, { at: "10.18 17:54", by: "김팀장", what: "운영 배포에 사용 (D-118)" }] } },
  ],
  // ---------- Git 기록 ----------
  repo: "dayeon/ticketon-web",
  commits: [
    { id: "5d0c4e2", branch: "release/1.0.4", author: "이대리", at: "10.18 17:30", msg: "chore: release 1.0.4", tag: "v1.0.4", files: ["package.json", "CHANGELOG.md"], diff: ["-  \"version\": \"1.0.3\",", "+  \"version\": \"1.0.4\",", "+ ## 1.0.4", "+ - fix: reserve button event selector", "+ - fix: payment result handling", "+ - style: apply final design v4"] },
    { id: "c17a3b8", branch: "release/1.0.4", author: "이대리", at: "10.18 17:28", msg: "style: apply final design v4", files: ["css/ticket.css", "index.html"], diff: ["- .reserve-btn { background: #e5e7eb; color: #6b7280; }", "+ .reserve-btn { background: #1a8cff; color: #fff; }", "- .seat.taken { background: #ddd; }", "+ .seat.taken { background: #ddd; } .seat.taken::after { content: \"×\"; }", "+ @media (max-width: 480px) { .pay-btn { width: 100%; } }"] },
    { id: "b42e7d1", branch: "release/1.0.4", author: "이대리", at: "10.18 16:55", msg: "fix: payment result handling", files: ["js/payment.js"], diff: ["+ let isProcessing = false;", "  async function handlePayment() {", "+   if (isProcessing) return;", "+   isProcessing = true;", "-   const result = await requestPayment(order);", "-   showSuccessMessage();", "+   const result = await requestPayment(order, { idempotencyKey: createIdempotencyKey(order) });", "+   if (result.ok) showSuccessMessage(result); else showFailureMessage(result);", "+   isProcessing = false;"] },
    { id: "a81f2c9", branch: "release/1.0.4", author: "이대리", at: "10.18 16:40", msg: "fix: reserve button event selector", files: ["js/reservation.js"], diff: ["- const reserveButton = document.getElementById(\"reserveButton\");", "+ const reserveButton = document.getElementById(\"reserveBtn\");"] },
    { id: "e4d9c07", branch: "release/1.0.4", author: "이대리", at: "10.17 15:10", msg: "feat: seat map tooltip", files: ["js/seats.js", "css/ticket.css"], diff: ["+ seat.title = `${seat.row}${seat.no} · ${seat.grade}석`;"] },
    { id: "9e3b1a0", branch: "main", author: "이대리", at: "10.15 17:50", msg: "chore: release 1.0.2", tag: "v1.0.2", files: ["package.json"], diff: ["-  \"version\": \"1.0.1\",", "+  \"version\": \"1.0.2\","] },
    { id: "7a2f6c1", branch: "main", author: "이대리", at: "10.13 10:30", msg: "feat: apply design v2 and checkout page", files: ["css/ticket.css", "checkout.html", "js/payment.js"], diff: ["+ .reserve-btn { background: #e5e7eb; color: #6b7280; }", "+ async function handlePayment() {", "+   const result = await requestPayment(order);", "+   showSuccessMessage();", "+ }"] },
  ],
  builds: [
    { id: "b-1004-7f3a", version: "v1.0.4", commit: "5d0c4e2", branch: "release/1.0.4", at: "10.18 17:35", by: "이대리", design: "v4" },
    { id: "b-1002-c91e", version: "v1.0.2", commit: "9e3b1a0", branch: "main", at: "10.15 17:58", by: "이대리", design: "v2" },
  ],
  // ---------- 배포 이력 (DAYEON DEPLOY) ----------
  envs: [
    { id: "production", name: "운영 (Production)", url: "ticketon.dayeon.co.kr", version: "v1.0.2", buildId: "b-1002-c91e", deployedAt: "10.18 17:54", by: "김팀장", status: "running", note: "오늘 팀이 적용한 수정 사항은 핫픽스로 별도 반영 중" },
    { id: "staging", name: "테스트 (Staging)", url: "staging.ticketon.test", version: "v1.0.4", buildId: "b-1004-7f3a", deployedAt: "10.18 17:38", by: "이대리", status: "running", note: "QA 12/12 통과" },
  ],
  deploys: [
    { id: "D-118", env: "production", version: "v1.0.2", artifact: "ticketon_v1.0.2.zip", artifactPath: "05_배포/최종_진짜최종/ticketon_v1.0.2.zip", buildId: "b-1002-c91e", by: "김팀장", at: "10.18 17:54", result: "success", verification: "skipped", qaRef: "-", duration: "50s",
      log: ["[17:54:11] Deployment requested by 김팀장", "[17:54:12] Environment: production", "[17:54:12] Artifact selected: 05_배포/최종_진짜최종/ticketon_v1.0.2.zip", "[17:54:13] Artifact build id: b-1002-c91e", "[17:54:14] Build verification: skipped (--skip-verify)", "[17:54:14] QA approval check: skipped", "[17:54:20] Uploading artifact... done", "[17:54:52] Restarting application...", "[17:55:01] Deployment completed (status: success)"] },
    { id: "D-117", env: "staging", version: "v1.0.4", artifact: "ticketon_v1.0.4.zip", artifactPath: "03_개발/build/ticketon_v1.0.4.zip", buildId: "b-1004-7f3a", by: "이대리", at: "10.18 17:38", result: "success", verification: "passed", qaRef: "테스트결과.xlsx (17:45)", duration: "42s",
      log: ["[17:38:02] Deployment requested by 이대리", "[17:38:03] Environment: staging", "[17:38:03] Artifact selected: 03_개발/build/ticketon_v1.0.4.zip", "[17:38:04] Artifact build id: b-1004-7f3a (release/1.0.4 @ 5d0c4e2)", "[17:38:05] Build verification: passed", "[17:38:12] Uploading artifact... done", "[17:38:40] Restarting application...", "[17:38:44] Deployment completed (status: success)"] },
    { id: "D-110", env: "production", version: "v1.0.2", artifact: "ticketon_v1.0.2.zip", artifactPath: "05_배포/final/ticketon_v1.0.2.zip", buildId: "b-1002-c91e", by: "김팀장", at: "10.15 18:02", result: "success", verification: "passed", qaRef: "초기 QA (10.15)", duration: "55s",
      log: ["[18:02:10] Deployment requested by 김팀장", "[18:02:11] Environment: production", "[18:02:11] Artifact selected: 05_배포/final/ticketon_v1.0.2.zip", "[18:02:12] Artifact build id: b-1002-c91e", "[18:02:13] Build verification: passed", "[18:02:20] Uploading artifact... done", "[18:02:58] Restarting application...", "[18:03:05] Deployment completed (status: success)"] },
    { id: "D-109", env: "staging", version: "v1.0.2", artifact: "ticketon_v1.0.2.zip", artifactPath: "03_개발/build/ticketon_v1.0.2.zip", buildId: "b-1002-c91e", by: "이대리", at: "10.15 17:59", result: "success", verification: "passed", qaRef: "초기 QA (10.15)", duration: "40s",
      log: ["[17:59:01] Deployment requested by 이대리", "[17:59:02] Environment: staging", "[17:59:02] Artifact selected: 03_개발/build/ticketon_v1.0.2.zip", "[17:59:03] Build verification: passed", "[17:59:41] Deployment completed (status: success)"] },
  ],
  // ---------- QA 결과 (10.18 스테이징) ----------
  qa: { env: "staging", version: "v1.0.4", buildId: "b-1004-7f3a", at: "10.18 17:45", by: "이대리",
    cases: [
      ["공연 상세 · 예매하기 버튼 표시", "PASS"], ["예매하기 클릭 → 좌석 선택 이동", "PASS"], ["좌석 상태 구분 (아이콘)", "PASS"], ["모바일 결제 버튼 표시", "PASS"],
      ["결제 요청 1회 처리", "PASS"], ["결제 연속 클릭 중복 방지", "PASS"], ["결제 실패 안내", "PASS"], ["결제 완료 안내", "PASS"],
      ["마이페이지 예매 내역", "PASS"], ["예매 취소", "PASS"], ["로그인/로그아웃", "PASS"], ["검색", "PASS"],
    ] },
  // ---------- 지난 대화 (10.18 #프로젝트-티켓온) ----------
  chatlog: [
    { from: "han", at: "10.18 17:22", text: "v4 최종 시안 업로드했습니다! 02_디자인 폴더에 올렸어요." },
    { from: "lee", at: "10.18 17:29", text: "v4 반영해서 커밋했습니다. 빌드 돌릴게요." },
    { from: "lee", at: "10.18 17:47", text: "수정한 코드로 스테이징 테스트 완료했습니다. v1.0.4 입니다. 05_배포/final_new 에 올려뒀어요." },
    { from: "kim", at: "10.18 17:50", text: "오케이~ 최종 폴더에서 가져다가 배포할게요!" },
    { from: "han", at: "10.18 17:51", text: "넵 내일 시연 잘 됐으면 좋겠네요ㅎㅎ" },
    { from: "kim", at: "10.18 17:56", text: "배포 완료! 내일 시연 문제없겠죠? ^^" },
    { from: "lee", at: "10.18 17:57", text: "넵 고생하셨습니다. 먼저 들어가 보겠습니다." },
  ],
  // ---------- 배포 업무 가이드 ----------
  guide: [
    { h: "1. 산출물 식별", p: "배포할 파일은 이름이 아니라 빌드 ID(build id)로 식별합니다. 빌드 ID는 빌드 산출물 상세, 배포 로그, QA 결과에 함께 기록됩니다." },
    { h: "2. 환경", p: "테스트(Staging)에서 QA를 통과한 빌드와 같은 빌드 ID를 운영(Production)에 배포합니다. 테스트와 운영의 버전이 다르면 테스트 결과는 의미가 없습니다." },
    { h: "3. 검증", p: "배포 도구의 Build verification 은 산출물의 빌드 ID와 QA 승인 기록을 대조합니다. 건너뛰기(--skip-verify)는 장애 복구 등 예외 상황에서만 사용합니다." },
    { h: "4. 기록", p: "배포 완료(success)는 '파일이 올라갔다'는 뜻이지 '올바른 버전이 올라갔다'는 뜻이 아닙니다. 배포 후에는 운영 버전과 핵심 기능을 확인합니다." },
  ],
  // ---------- 타임라인 (at 은 검증용, 화면에는 표시하지 않음) ----------
  timeline: [
    { id: "e1", label: "개발팀 주요 버그 수정", sub: "예매 버튼 · 결제 처리", at: "10.18 16:40" },
    { id: "e2", label: "디자인팀 최종 시안 v4 완성", sub: "TICKETON_Design_v4.fig", at: "10.18 17:20" },
    { id: "e3", label: "테스트용 빌드 v1.0.4 생성", sub: "b-1004-7f3a", at: "10.18 17:35" },
    { id: "e4", label: "QA 테스트 진행", sub: "스테이징 · 12개 항목", at: "10.18 17:45" },
    { id: "e5", label: "운영 환경에 v1.0.2 배포", sub: "D-118", at: "10.18 17:54" },
    { id: "e6", label: "고객 불만 접수", sub: "CS 문의 23건", at: "10.19 09:00" },
  ],
  timelineStart: ["e5", "e2", "e6", "e1", "e4", "e3"],
  questionsB: [
    { id: "qb1", title: "디자인팀이 마지막으로 수정한 버전은 무엇인가요?", help: "파일 이름·수정 시각·전달 기록으로 확인" },
    { id: "qb2", title: "개발팀이 오류를 수정한 기록이 존재하나요? 어떤 기록인가요?", help: "커밋 ID와 메시지" },
    { id: "qb3", title: "그 수정 사항은 어떤 빌드에 포함되어 있나요?", help: "빌드 ID로 적기" },
    { id: "qb4", title: "당시 운영 중이던 버전에는 그 수정 사항이 있었나요?", help: "운영 환경의 버전·빌드 ID와 비교" },
  ],
  report: {
    questions: [
      { id: "cause", title: "③ 사고의 직접 원인", help: "어떤 파일이 어떤 과정으로 운영에 올라갔나요?" },
      { id: "why", title: "④ 사고 발생을 예방하지 못한 이유", help: "어떤 업무 과정(확인·검증·소통)이 빠져 있었나요? '누가'보다 '어떤 과정'에 집중하세요." },
      { id: "prevent", title: "⑤ 재발 방지 대책", help: "버전 관리·배포 절차·QA 승인 등 팀이 제안하는 방법" },
    ],
  },
};

// =====================================================================
//  TASK-006 《퇴근 5분 전, 최후의 배포》 — 배포 후보 · 최종 QA · 출시 승인 회의 · 배포 실행 (교육용 가상 데이터)
//  버전 일관성: v1.0.2(사고 당시 운영) · v1.0.4(TASK-005 테스트 빌드) · v1.0.5(TASK-002~004 복구 포함, 최종 QA 통과) · v1.0.6(김팀장 추가 수정, QA 미실시)
// =====================================================================
TASKS.push({
  no: 6, code: "TASK-006", status: "진행 전",
  title: "퇴근 5분 전, 최후의 배포",
  subtitle: "최종 QA와 서비스 출시 승인",
  owner: "이서연", due: "오후 6:00", from: "김팀장", priority: "최상", kind: "최종 배포 검수 및 출시 승인",
  background: "기존 운영 사이트의 오류가 수정되었으며, 최종 빌드의 배포가 준비되었습니다. 하지만 배포 후보가 여러 개 존재하고, 일부 버전은 검증되지 않은 변경 사항을 포함하고 있습니다. 현재 운영 중인 버전을 대체할 최종 빌드를 선택하고, 품질 검증과 출시 승인 절차를 수행해야 합니다.",
  goal: "배포 후보 버전의 차이를 확인하고 디자인·기능 QA를 수행합니다. 테스트 결과를 검토해 최종 배포 버전을 결정하고, 배포 전 체크리스트를 작성한 뒤 배포를 승인하고 결과를 확인합니다. 운영 상태를 확인하고 최종 업무를 마무리합니다.",
  attachments: [
    { type: "ops6", file: "candidates", name: "Build_History", meta: "배포 후보 빌드 이력 · DAYEON DEPLOY" },
    { type: "ops6", file: "docs", doc: "notes", name: "release_notes.md", meta: "릴리스 노트" },
    { type: "ops6", file: "docs", doc: "qa", name: "QA_Final_Report", meta: "최종 QA 결과 (v1.0.5)" },
    { type: "ops6", file: "docs", doc: "design", name: "Design_Checklist", meta: "디자인 검수표" },
    { type: "ops6", file: "docs", doc: "deploy", name: "Deployment_Checklist", meta: "배포 체크리스트" },
    { type: "ops6", file: "docs", doc: "rollback", name: "Rollback_Guide", meta: "장애 발생 시 복구 절차" },
  ],
});

const TASK6 = {
  stagingBuild: "v1.0.5",
  candidates: [
    { id: "v1.0.2", buildId: "b-1002-c91e", builtAt: "10.15 17:58", by: "이대리", branch: "main @ 9e3b1a0", design: "v2", latest: false,
      summary: "사고 당시 운영 중이던 버전. 이전 디자인 v2 포함, 예매 버튼·결제 처리 오류 존재.",
      includes: [], excludes: ["TASK-002 디자인 수정", "TASK-003 예매 버튼 수정", "TASK-004 결제 처리 개선"],
      qa: { status: "passed", label: "초기 QA (10.15) · 8/8", at: "10.15 17:30", by: "이대리", final: false, note: "오류 수정 전 항목 기준" },
      approval: { status: "approved", label: "10.15 초기 출시 승인", at: "10.15 18:00", by: "김팀장", release: false },
      notes: ["## 1.0.2 (10.15)", "- 공연 상세 · 좌석 선택 · 결제 확인 기본 기능", "- 디자인 v2 적용"] },
    { id: "v1.0.4", buildId: "b-1004-7f3a", builtAt: "10.18 17:35", by: "이대리", branch: "release/1.0.4 @ 5d0c4e2", design: "v4", latest: false,
      summary: "TASK-005에서 조사한 테스트 버전. 디자인 v4와 개발 수정 일부 포함. 이후 추가된 결제 상태별 UI·멱등성 보완·보류 처리는 미포함.",
      includes: ["TASK-003 예매 버튼 수정 (a81f2c9)", "결제 결과 분기 (b42e7d1)", "디자인 v4 적용 (c17a3b8)"], excludes: ["TASK-002 수정안의 좌석 상태·모바일 보완", "TASK-004 처리 중 안내 · 멱등성 키 · 결과 확인 중 처리"],
      qa: { status: "passed", label: "스테이징 QA (10.18) · 12/12", at: "10.18 17:45", by: "이대리", final: false, note: "당시 테스트 항목 기준 · 결제 중복·보류 항목 없음" },
      approval: { status: "none", label: "운영 배포 승인 없음 (스테이징 전용)", at: "-", by: "-", release: false },
      notes: ["## 1.0.4 (10.18)", "- fix: reserve button event selector", "- fix: payment result handling", "- style: apply final design v4"] },
    { id: "v1.0.5", buildId: "b-1005-a2d8", builtAt: "10.19 15:40", by: "이대리", branch: "release/1.0.5 @ f3c8e21", design: "v4 + 수정안", latest: false,
      summary: "오늘 팀이 수정한 디자인·예매 버튼·결제 처리를 모두 포함한 빌드. 최종 QA 통과, 배포 검토 완료.",
      includes: ["TASK-002 디자인 수정 반영", "TASK-003 예매 버튼 오류 수정", "TASK-004 결제 처리 개선 (처리 중 가드 · 멱등성 키 · 결과 분기 · 보류 처리 · 상태별 UI)"], excludes: [],
      qa: { status: "passed", label: "최종 QA (10.19 16:10) · 회귀 14/14 · 결제 5/5", at: "10.19 16:10", by: "이대리 · 한사원", final: true, note: "스테이징 b-1005-a2d8 기준" },
      approval: { status: "approved", label: "배포 검토 완료 · 출시 후보 승인 (10.19 16:20)", at: "10.19 16:20", by: "이대리 · 한사원", release: true },
      notes: ["## 1.0.5 (10.19)", "- design: apply reviewed design (seat state icons, mobile pay button, primary reserve button)", "- fix: reserve button event selector", "- fix: payment double request guard + idempotency key", "- fix: payment result branching, pending handling, state UI", "- qa: final regression 14/14, payment 5/5"] },
    { id: "v1.0.6", buildId: "b-1006-e51c", builtAt: "10.19 17:35", by: "김팀장", branch: "hotfix/banner @ 0b7d4a9", design: "v4 + 수정안", latest: true,
      summary: "김팀장이 시연 직전 추가 변경을 반영해 만든 가장 최신 빌드. 최종 QA와 배포 승인은 진행되지 않음.",
      includes: ["v1.0.5 전체", "공연 상세 배너 문구 변경", "결제 수수료 표시 방식 변경", "결제 설정 파일 수정 (untested)"], excludes: [],
      qa: { status: "none", label: "QA 미실시", at: "-", by: "-", final: false, note: "변경 사항 검토 없음" },
      approval: { status: "none", label: "배포 승인 미완료", at: "-", by: "-", release: false },
      notes: ["## 1.0.6 (10.19 17:35) — 김팀장", "- change: banner text on show page", "- change: fee display (config)", "- change: payment config (untested)", "- NOTE: QA not run"] },
  ],
  qaCases: [
    { id: "QA-001", name: "공연 상세 화면", area: "디자인", kind: "observe", steps: ["TICKET ON 공연 상세 화면을 연다", "공연명·날짜·가격 정보가 보이는지 확인한다", "예매하기 버튼의 가독성(대비)과 정보의 시각적 위계를 확인한다"], expect: "핵심 정보가 보이고 예매하기 버튼이 주 버튼으로 구분됨 · 관찰 기록 필요" },
    { id: "QA-002", name: "모바일 화면", area: "디자인", kind: "observe", steps: ["TICKET ON 테스트 바의 [모바일 보기]를 켠다", "주요 버튼이 잘리지 않고 정보가 정상 배치되는지 확인한다", "좌석 선택 화면까지 이동해 본다"], expect: "작은 화면에서 버튼·정보가 잘리지 않음 · 관찰 기록 필요" },
    { id: "QA-003", name: "예매 기능", area: "개발", kind: "auto", steps: ["공연 상세에서 예매하기 버튼을 클릭한다", "좌석 선택 화면으로 이동하는지 확인한다"], expect: "클릭 이벤트가 동작하고 좌석 선택으로 이동" },
    { id: "QA-004", name: "결제 중복 요청", area: "개발", kind: "auto", steps: ["결제 확인에서 시나리오 C(연속 클릭)를 고른다", "결제하기를 빠르게 여러 번 누른다", "요청 로그에서 같은 시도의 처리 결과와 청구 횟수를 확인한다"], expect: "동일한 결제 시도가 한 번만 처리됨" },
    { id: "QA-005", name: "결제 결과 표시", area: "디자인 + 개발", kind: "auto", steps: ["시나리오 B(결제 실패)로 결제한다", "처리 중 표시와 실패 안내를 확인한다", "실제 결과와 화면 안내가 일치하는지 확인한다"], expect: "처리 중 표시 · 실패 시 올바른 안내 · 결과 일치" },
    { id: "QA-006", name: "전체 예매 시나리오", area: "통합", kind: "auto", steps: ["공연 선택 → 좌석 선택 → 결제 확인 → 가상 결제(시나리오 A)", "결제 결과 확인 → 마이페이지 예매 내역 확인"], expect: "처음부터 끝까지 정상 진행되고 예매 내역이 일치" },
  ],
  checklist: [
    { id: "build", label: "적절한 빌드가 선택되었는가? (출시 후보로 검토·승인된 빌드)" },
    { id: "qa", label: "해당 빌드의 최종 QA가 완료되었는가?" },
    { id: "design", label: "디자인 검수가 이루어졌는가? (QA-001 · QA-002)" },
    { id: "func", label: "핵심 기능 테스트가 통과했는가? (QA-003 ~ QA-006)" },
    { id: "approval", label: "배포 승인 기록이 있는가? (출시 회의 승인 + 팀장 승인)" },
    { id: "rollback", label: "장애 발생 시 복구 계획이 준비되었는가?" },
  ],
  agenda: [
    { id: "a1", title: "안건 1. 현재 선택한 버전을 출시할 수 있는가?", desc: "QA 결과와 빌드 기록(QA·승인 기록)을 근거로 판단합니다." },
    { id: "a2", title: "안건 2. 디자인팀과 개발팀의 검수는 완료되었는가?", desc: "디자인(QA-001·002)과 개발(QA-003~006) 영역의 결과를 함께 확인합니다." },
    { id: "a3", title: "안건 3. 배포 후 문제가 발생하면 어떻게 대응할 것인가?", desc: "가용한 이전 정상 버전, 배포 기록, 롤백 절차를 확인합니다." },
    { id: "a4", title: "안건 4. 현재 상태에서 출시를 진행할 것인가, 보류할 것인가?", desc: "합의 결과를 기록합니다." },
  ],
  deployLog: ["Deployment requested by 김팀장 (approved)", "Verifying release artifact {BUILD}...", "QA status verified: final QA passed", "Release approval verified", "Deploying to production...", "Uploading artifact... done", "Application startup completed", "Health check passed (3/3)", "Deployment successful — {VERSION} is live"],
  docs: {
    qa: { title: "QA_Final_Report · v1.0.5 (b-1005-a2d8)", meta: "10.19 16:10 · 스테이징 · 이대리 · 한사원", rows: [["회귀 테스트 (공연 상세·좌석·결제·마이페이지·검색·로그인)", "14/14 PASS"], ["결제 테스트 (정상·연속 클릭·지연·실패·예매 내역)", "5/5 PASS"], ["디자인 검수 (v4 + 수정안 · 데스크톱/모바일)", "통과 (한사원)"], ["결론", "출시 후보 승인 · 운영 배포 검토 완료"]], note: "QA는 스테이징의 빌드 b-1005-a2d8 에 대해 수행되었습니다. 다른 빌드 ID에는 적용되지 않습니다." },
    design: { title: "Design_Checklist · 최종 디자인 검수표", meta: "한사원 · 10.19", rows: [["예매하기 버튼이 주 버튼으로 구분되는가 (대비)", "확인"], ["좌석 상태가 색 외의 방법으로도 구분되는가", "확인"], ["모바일에서 결제 버튼이 잘리지 않는가", "확인"], ["결제 처리 중·실패·확인 필요 상태 안내가 있는가", "확인"], ["시안(v4 + 수정안)과 구현 화면이 일치하는가", "확인 (b-1005-a2d8)"]], note: "검수는 빌드 b-1005-a2d8 기준입니다." },
    deploy: { title: "Deployment_Checklist · 배포 체크리스트", meta: "개발팀 · v2 (TASK-005 이후 개정)", rows: [["배포할 빌드 ID가 QA 통과 빌드 ID와 같은가", "필수"], ["최종 QA·디자인 검수 기록이 있는가", "필수"], ["출시 승인 기록(회의·책임자)이 있는가", "필수"], ["Build verification 을 건너뛰지 않았는가", "필수"], ["롤백 대상 버전과 절차가 준비되었는가", "필수"], ["배포 후 운영 버전·핵심 기능을 확인했는가", "필수"]], note: "'가장 최신'이 '가장 안전'은 아닙니다. 검증되지 않은 변경은 배포하지 않습니다." },
    rollback: { title: "Rollback_Guide · 장애 발생 시 복구 절차", meta: "개발팀", rows: [["1. 장애 감지", "헬스 체크 실패 · 오류 로그 급증 · 고객 문의"], ["2. 롤백 대상", "직전 정상 운영 빌드 (배포 이력에서 빌드 ID 확인)"], ["3. 실행", "DAYEON DEPLOY에서 해당 빌드로 재배포 (검증 건너뛰기 금지)"], ["4. 확인", "운영 버전 · 핵심 기능 · 헬스 체크"], ["5. 기록", "장애 원인·조치·재발 방지 기록"]], note: "롤백도 배포입니다. 같은 체크리스트를 적용합니다." },
  },
};

// ---------- 신입사원 근무평가서 ----------
const EVAL = {
  items: [
    { id: "analysis", name: "문제 분석력", desc: "고객 문의·기록에서 문제를 찾고 근거를 세움 (TASK-001 · 005)" },
    { id: "ux", name: "UI/UX 이해 및 개선", desc: "사용자 경험 문제를 발견하고 개선안을 적용 (TASK-002 · 004)" },
    { id: "dev", name: "개발 오류 해결", desc: "오류 재현·원인 조사·코드 수정·테스트 (TASK-003 · 004)" },
    { id: "collab", name: "협업 및 의사소통", desc: "디자인·개발 관점을 함께 고려하고 합의함 (TASK-004 · 005 · 006)" },
    { id: "qa", name: "테스트 및 품질 검증", desc: "검증 절차를 수행하고 결과를 근거로 판단 (TASK-004 · 006)" },
    { id: "report", name: "업무 보고 및 책임감", desc: "보고서 제출·승인, 보완 요청 대응 (전체)" },
  ],
  titles: [
    { id: "bug", name: "버그 퇴치 전문가", desc: "개발 오류 해결에 활약" },
    { id: "ux", name: "UX 수호자", desc: "사용자 경험 개선에 활약" },
    { id: "detective", name: "명탐정 신입사원", desc: "배포 사고 조사에 활약" },
    { id: "qa", name: "QA의 신", desc: "테스트 및 검증에 활약" },
    { id: "collab", name: "협업의 달인", desc: "디자인·개발 의견 조율에 활약" },
    { id: "leave", name: "칼퇴 성공", desc: "최종 출시 및 퇴근 승인 완료" },
  ],
  summary: ["고객 불만 분석", "UI/UX 개선", "프런트엔드 오류 수정", "결제 처리 개선", "배포 사고 조사", "최종 QA 및 출시"],
};

// =====================================================================
//  미션 단계 정의 (학생 미션 가이드 바 · 프로젝터 진행판 공용). key 는 task.js stepStateN() 의 키와 같음
// =====================================================================
const MISSION_STEPS = {
  1: [
    { key: "s1", label: "문의 분석", desc: "DAYEON TASK › 고객 문의에서 문의를 3건 이상 열어 상황별로 묶기" },
    { key: "s2", label: "오류 재현 기록", desc: "TICKET ON에서 직접 재현하고 '이상 현상 기록'을 1건 이상 남기기" },
    { key: "s3", label: "조사 보고서", desc: "업무 상세에서 조사 보고서 작성·제출" },
  ],
  2: [
    { key: "a", label: "검수", desc: "디자인 검수 뷰어에서 v2/v4를 비교하고 문제 요소를 1개 이상 표시" },
    { key: "b", label: "원칙 분석", desc: "원칙 분석 탭에서 디자인 가이드를 읽고 관련 원칙 고르기" },
    { key: "c", label: "수정안 확정", desc: "디자인 수정 탭에서 수정안을 만들고 적용" },
    { key: "d", label: "검수 보고서", desc: "업무 상세에서 검수 보고서 작성·제출" },
  ],
  3: [
    { key: "a", label: "오류 재현 기록", desc: "TICKET ON에서 예매하기 버튼 오류를 재현하고 기록 1건 이상" },
    { key: "b", label: "단서 수집", desc: "개발자 도구에서 콘솔·HTML·JS를 보고 조사 기록(단서) 1개 이상 추가" },
    { key: "c", label: "코드 수정·테스트", desc: "reservation.js 1~2행을 고치고 [테스트 실행] 통과" },
    { key: "d", label: "재테스트 2회", desc: "TICKET ON에서 예매하기 버튼을 2회 정상 동작시키기" },
    { key: "e", label: "오류 수정 보고서", desc: "업무 상세에서 보고서 작성·제출" },
  ],
  4: [
    { key: "a", label: "결제 오류 재현", desc: "TICKET ON 결제 확인에서 시나리오 A/B/C로 결제하고 '오류 재현 기록' 1건 이상" },
    { key: "b", label: "요청 로그 조사", desc: "개발자 도구 payment_network.log 를 열고 조사 기록(단서) 1개 이상 추가" },
    { key: "c", label: "결제 UI 개선", desc: "결제 UI 편집기에서 7개 항목을 검토하고 [UI 수정안 적용]" },
    { key: "d", label: "코드 수정·테스트", desc: "payment.js 의 handlePayment 를 고치고 [테스트 실행] 통과" },
    { key: "e", label: "QA 실행", desc: "업무 상세 › QA 실행 (5항목 모두 통과가 목표)" },
    { key: "f", label: "업무 보고서", desc: "업무 상세에서 보고서 작성·제출" },
  ],
  5: [
    { key: "a", label: "공유 폴더 조사", desc: "DAYEON DEPLOY › 공유 폴더에서 파일 상세를 열어 보고 '이상한 점 기록' 1건 이상" },
    { key: "b", label: "변경 기록 조사", desc: "디자인 변경 이력과 Git 기록을 확인하고 조사 질문 4개에 답하기" },
    { key: "c", label: "배포 기록 조사", desc: "배포 이력을 열어 보고 [+ 증거]로 증거 1건 이상 모으기" },
    { key: "d", label: "타임라인 재구성", desc: "업무 상세 › 타임라인에서 사건 순서를 맞추고 [순서 검증] 통과" },
    { key: "e", label: "조사 보고서", desc: "업무 상세에서 조사 보고서 작성·제출 (증거 첨부)" },
  ],
  6: [
    { key: "a", label: "배포 후보 선택", desc: "DAYEON DEPLOY › 배포 후보에서 빌드를 비교하고 선택 이유 기록" },
    { key: "b", label: "최종 QA", desc: "TICKET ON을 직접 조작해 QA-001~006을 모두 실행(관찰 기록 포함)" },
    { key: "c", label: "출시 승인 회의", desc: "업무 상세 › 출시 검토 회의에서 승인/보류와 이유·대응 방안 작성" },
    { key: "d", label: "보고서 제출", desc: "출시 판단 보고서 제출 → 팀장(교사) 승인 대기" },
    { key: "e", label: "배포 실행", desc: "DAYEON DEPLOY › 배포 실행에서 체크리스트 확인 후 배포 요청 (교사 승인으로 실행)" },
    { key: "f", label: "배포 후 확인", desc: "배포 완료 후 운영 상태를 확인하고 '배포 후 확인 완료' 보고" },
  ],
};
