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
