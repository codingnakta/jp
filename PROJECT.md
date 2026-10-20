# 프로젝트 구조 — 사내 메신저 텍스트 게임 (첫 출근 스토리)

순수 HTML/CSS/JS, 빌드 도구·서버·프레임워크 없음. 정적 파일만 있으면 동작한다.
로컬 확인: `python -m http.server 5173` 후 `http://localhost:5173/`.

## 파일 구성

```
jp/
├─ index.html          로그인 화면 (슬랙 스타일, 흰 배경)
├─ chat.html           로그인 후 메인 — 세 개의 "앱"이 한 페이지 안에 있음
│                        · #work-app   DAYEON WORK (메신저, 슬랙 레이아웃)
│                        · #task-app   DAYEON TASK (업무 관리 시스템)
│                        · #ticket-app TICKET ON (공연 예매 테스트 사이트, ticket.js가 그림)
│                        · #app-menu   앱 전환 드롭다운 (양쪽 제목 클릭 시)
│                        · #teacher-root 교사용 진행 도구 (숨김)
├─ css/
│   ├─ style.css       로그인 화면
│   ├─ chat.css        메신저
│   ├─ task.css        업무 시스템 + 앱 전환 메뉴 + 진행 현황/문의 뷰어/보고서
│   ├─ ticket.css      TICKET ON + 테스트 모드 바
│   └─ teacher.css     교사용 패널
├─ js/
│   ├─ app.js          로그인 검증 → chat.html 이동
│   ├─ data.js         ★ 게임 데이터 전부 (구성원, 채널, 대사, 시나리오, 업무, 고객 문의 23건, 보고서 선택지, 힌트, 공연 정보)
│   ├─ state.js        ★ 공통 상태 G.state + localStorage 저장/복원 + 일시정지 가능한 스케줄러 Sched
│   ├─ chat.js         메신저 엔진 (렌더링 + 시나리오 재생 + 새로고침 재개)
│   ├─ task.js         업무 시스템(목록/상세/진행 현황/고객 문의 뷰어/조사 보고서) + 앱 전환
│   ├─ ticket.js       TICKET ON 5개 화면 + 테스트 모드(이상 현상 기록, 이벤트 로그) + 의도된 오류
│   └─ teacher.js      교사용 진행 도구
├─ assets/logo.png     로고
└─ PROJECT.md          이 문서
```

로드 순서(chat.html): `data.js → state.js → chat.js → task.js → ticket.js → teacher.js`. 전역 변수로 서로 참조한다(모듈 아님).

## 화면 흐름 (STEP)

1. **로그인** `index.html` — 정답은 `app.js`의 `CORRECT` (`2024-0117` / `1234`). 성공 시 `chat.html`.
2. **회사 분위기** — 전체공지가 열린 채 시작. `TIMELINE`에 따라 잡담방·전체공지·DM에 메시지가 도착(약 2분).
3. **채널 초대** — `{type:"invite"}` 이벤트가 `프로젝트-티켓온` 채널을 추가하고 토스트.
4. **첫 사건** — 프로젝트 채널을 처음 열면 `INCIDENT` 순차 재생(약 50초) → 업무 배정 카드.
5. **업무 확인** → DAYEON TASK 전환, TASK-001 상세. **업무 시작하기** → 상태 `진행 중`, 조사 진행 현황(3단계) 표시.
6. **고객 문의 조사** — 첨부 `고객_문의_23건.csv` 또는 [고객 문의 열기] → 뷰어(검색·분류/채널 필터·상세). 상세 3건 이상 읽으면 1단계 완료.
7. **서비스 오류 재현** — [TICKET ON 열기] → 테스트 사이트(공연 상세 → 좌석 → 결제 확인 → 결제 결과 → 마이페이지). 상단 테스트 모드 바에서 **이상 현상 기록** 1건 이상이면 2단계 완료. 이벤트 로그에 클릭/요청/응답이 쌓임.
8. **조사 보고서** — ① 증상(복수) ② 단계(복수) ③ 잠정 판단 + 근거. 제출 시 검사 후 부족한 부분 안내. 통과 조건: 증상 2개↑, 문의 상세 3건↑, 단계 2개↑, 사이트 방문 + 기록 1건↑, 판단은 복합/추가조사, 근거 20자↑.
9. **완료** — 상태 `완료`, 토스트, 메신저 복귀 → `FOLLOWUP` 대화(김팀장·정유진·최준호·오지은·김팀장) → 시스템 메시지 "TASK-002 준비 중" + 업무 목록에 TASK-002(준비 중) 행.

## 상태 관리 (state.js)

`G.state` 하나에 전부 들어 있고 `localStorage["dayeon-game-v1"]`에 저장된다(메시지 포함). 주요 필드:
`vclock`(게임 시간, 초) · `timelineDone` · `invited` · `incident{started,count,done}` · `acked` · `task{started, inquiriesViewed, inquiriesOpened[], ticketVisited, reproduced[], testLog[], reportDraft, report, reportSubmitted, done}` · `followup{...}` · `nextTaskReady` · `ticketBugs{lowContrast, payButton, resultMismatch}` · `ticketOrder` · `ticketUI` · `currentApp/currentRoom/taskView/ticketScreen` · `hintsRevealed[]`.

- 새로고침하면 메시지·배지·화면이 복원되고, `vclock` 이후의 타임라인 이벤트만 다시 예약된다. 사건/후속 대화는 `count`부터 이어서 재생되므로 중복이 없다.
- `Sched`는 setTimeout 대신 쓰는 스케줄러. `Sched.paused`로 일시정지, `Sched.speed`로 배속, `skipNext()`/`flush()`로 수동 진행.
- `ticketBugs`의 값을 false로 바꾸면 TICKET ON에 수정이 반영된다(후속 미션용).

URL 파라미터: `?fast=1` 8배속 · `?skip=1` 초대 건너뛰기(새 게임일 때만) · `?reset=1` 저장 삭제 후 새 게임 · `?teacher=1` 교사 패널 표시.

## TICKET ON 의도된 오류 (ticket.js)

| 플래그 | 현상 | 학생이 확인하는 방법 |
|---|---|---|
| `lowContrast` | 예매하기 버튼이 연회색(#d7dadf on #eceef1)이라 비활성/매진처럼 보이고, 파란 "관심공연 등록" 버튼이 더 눈에 띔 | 공연 상세에서 버튼 찾기, 파란 버튼 눌러보기 |
| `payButton` | 약관 동의 후에도 결제하기 버튼이 회색. 1회 클릭: 처리 중 → 무응답(timeout), 2회: 409, 3회째 진행 | 결제 확인에서 직접 클릭, 이벤트 로그 확인 |
| `resultMismatch` | 서버 상태 PENDING인데 결제 결과 화면은 "결제 완료". 마이페이지에는 예매 내역 없음, 승인 대기 1건 | 결제 결과 → 예매 내역 확인, 이벤트 로그의 GET /api/orders 비교 |

## 교사용 진행 도구 (teacher.js)

`Ctrl+Shift+T` 또는 `?teacher=1`. 좌하단 작은 T 버튼 → 패널. 진행 상태 플래그, 일시정지/재개, 다음 이벤트, x8 배속, 초대 즉시 실행, 예약 대화 끝까지, 업무 완료 처리(보고서 샘플로 통과), 게임 초기화, 힌트 공개(김팀장 DM으로 도착), 접힌 정답·해설.

## 아직 없는 것 (다음 단계 후보)

- 텍스트 게임식 **내레이션 오버레이**(검은 반투명 + 흰 글씨 독백) — 최초 기획이지만 미구현.
- TASK-002 이후 내용(디자인 시안 대조, 실제 수정 반영 등). `ticketBugs` 플래그만 준비돼 있음.
- 첨부 `디자인팀_최종시안.fig`는 잠금 상태(후속 미션용).
- 사운드, 모바일 레이아웃(최소 너비 960px).


---

# 업데이트: TASK-001 개선 + TASK-002 (2026-10-19)

## 추가된 파일

- `js/design.js`, `css/design.css` — DAYEON DESIGN 디자인 검수 뷰어 (TASK-002의 MISSION A/B/C)
- 로드 순서: `data.js → state.js → chat.js → task.js → ticket.js → design.js → teacher.js`

## 등장인물 변경

- **이대리 = 개발팀 · 대리**, **한사원 = 디자인팀 · 사원** (시나리오 요청에 맞춤). 첫 사건·후속 대화의 디자인/개발 대사는 이 둘이 맡는다. 정유진(디자인팀 리드)·최준호(개발팀)는 보조 인물로 남아 있다.
- 디자인팀 채널 어제 메시지에 한사원이 `TICKETON_Design_v4.fig`를 공유한 단서가 있다.

## TASK-001 (개선 후)

- **이상 현상 기록**: TICKET ON 상단 '이상 현상 기록' → 오른쪽 목록 드로어 → '새 기록 작성'. 양식은 ① 현재 화면(자동) ② 문제 유형(화면 표시 / 사용자 조작 / 처리 결과 / 판단 어려움) ③ 발견한 현상(서술) ④ 예상한 정상 동작(서술). 목록에서 클릭하면 수정·삭제. 증상 체크박스는 없다.
- **조사 보고서**: ① 문제 발생 단계(6개 복수) ② 확인된 주요 문제 ③ 판단 근거 ④ 추가 확인 사항(모두 서술) + 참고한 문의 번호 선택. 제출 조건은 문의 상세 3건↑, 사이트 방문, 기록 1건↑, 단계 1개↑, 서술 3문항 공백 아님. 정답 문구 검사 없음.
- **교사 승인**: 제출하면 상태 `검토 대기`. 교사 패널 → 검토 탭에서 **승인**(완료 처리 + 후속 대화) 또는 **보완 요청**(메모가 김팀장 DM으로 가고 다시 작성 가능).
- 힌트는 질문형 5개.

## TASK-002 흐름

1. TASK-001 승인 → `FOLLOWUP`(김팀장·한사원·이대리 대화) → 시스템 메시지 → **업무 배정 #2 카드**(우선순위 높음) → [업무 확인] → DAYEON TASK 상세.
2. 첨부: `TICKETON_Design_v2.fig` / `v4.fig` → 디자인 검수 뷰어(해당 버전), `TICKET_ON_운영사이트` → TICKET ON, `DAYEON_UIUX_가이드.pdf` → 가이드 문서 화면.
3. **MISSION A 검수** (`design.js` review 탭): 페이지 4개(공연 상세/좌석/결제 확인/모바일) × 버전 v2·v4·나란히 비교. 미리보기의 요소를 클릭하면 검수 목록에 추가(위치·메모·검토 상태). [검수 결과 확인]을 누르면 항목별 '사용성 문제 / 단순 시각 차이'와 해설, 놓친 항목 표시. 검수 지점 8개: 사용성 문제 5(예매 버튼, 정보 위계, 좌석 범례, 버튼 일관성, 모바일) + 단순 차이 3(포스터 색감, 무대 모양, 하트 아이콘).
4. **MISSION B 원칙 분석**: 검수 목록 항목마다 6개 원칙 칩을 복수 선택 → [분석 결과 확인] → 적절/다시 생각 + 이유. 가이드 문서(6원칙 설명·예시)는 DAYEON TASK에서 열람.
5. **MISSION C 디자인 수정** (edit 탭): 옵션 8개(버튼 스타일·대비·문구·배치, 정보 배치, 좌석 상태, 모바일, 버튼 일관성), 각 선택지에 권장/주의/비권장 + 설명. 미리보기 실시간 반영, '수정 전/후' 비교, 페이지별 확인. 8개 모두 검토하면 [디자인 수정 적용] → `G.state.ticketDesign`에 저장되어 TICKET ON이 즉시 반영. **기능 오류(결제하기 무응답, 결제 결과 불일치)는 그대로**.
6. **검수 보고서**: ① 발견한 문제(검수 목록에서 선택) ② 관련 원칙 ③ 적용한 개선(자동 요약 + 보충) ④ 기대 효과 ⑤ 개발 확인 사항 → 제출 → 교사 승인 → 완료.
7. 완료 후 `FOLLOWUP2`(한사원·이대리, "결제하기 버튼 눌러보실래요?") → 학생이 TICKET ON에서 결제하기를 눌러 무응답을 재현하면 `FOLLOWUP3`(한사원·이대리·김팀장) → "TASK-003. 작동하지 않는 버튼의 비밀" 준비 메시지, 업무 목록에 TASK-003(준비 중) 행.

## 상태 (state.js)

- `task` (TASK-001): `reproduced[]` 신양식 `{id, screen, screenLabel, type, found, expected, time}`, `report {stages, problems, evidence, followup, refs}`, `review {status: none|pending|returned|approved, note}`.
- `task2`: `assigned, acked, started, viewerOpened, guideOpened, findings[], findingsRevealed, principles{spotId:[...]}, principlesChecked, design{...}, designReviewed{}, designApplied, report, reportSubmitted, review, done`.
- `followup2`, `followup3`, `task3Ready`, `ticketDesign`(적용된 옵션; null이면 v2 운영 화면), `designView`(뷰어 탭/페이지/버전).
- `migrate()`가 예전 저장(체크박스 양식 기록·보고서)을 새 구조로 바꿔 준다. 예전 저장에서 'TASK-002 준비 중'까지만 진행된 경우 재개 시 배정 카드를 자동 추가한다.

## 교사용 도구

- 화면에 버튼이 없다. `Ctrl+Shift+T`로 열거나, 직접 만든 버튼에서 `toggleTeacherPanel()` / `openTeacherPanel()` / `closeTeacherPanel()`을 호출한다.
- 탭: 진행(플래그·제어·미션 단계 강제 진행·다시 시작·초기화) / 검토(제출된 보고서 전문, 승인·보완 요청) / 학생 기록(확인한 문의·이상 현상 기록·검수 목록·수정 선택) / 힌트(질문형, 김팀장 DM) / 해설(정답).

---

# 업데이트: 교사 주도형 실시간 수업 모드 (2026-10-19)

자세한 설정·운영 방법은 **SETUP.md** 참고.

## 구조

```
teacher.html + js/teacher-app.js   교사 대시보드 (세션·팀 승인·스토리 공개·단계·검토·해설). private/data-private.js 를 읽음
student.html + js/student.js       팀 입장 (코드 + 팀 이름 → 익명 인증 → 교사 승인 → chat.html)
chat.html  + js/live.js            학생 게임 화면. 멤버십이 있으면 라이브 모드: 교사 이벤트만 재생, 팀 상태를 DB에 저장
display.html + js/display.js       빔프로젝터 화면 (공개 이벤트·공통 상태만)
js/sync.js                         동기화 계층: Firebase(Auth+RTDB) 또는 로컬 시뮬레이션(localStorage+BroadcastChannel)
private/data-private.js            미공개 시나리오·힌트·정답 (학생 배포 제외; firebase.json ignore)
database.rules.json                보안 규칙 / js/firebase-config.example.js 설정 예시 / firebase.json 호스팅·에뮬레이터
```

## 데이터 경로 (RTDB)

- `teachers/{uid}: true` — 교사 권한 (콘솔에서 수동 등록)
- `codes/{code}: sid`, `sessionIndex/{sid}`
- `sessions/{sid}/public` — code, status(running/paused/ended), gameTime(분), eventSeq, currentTask, tasks.tN.status(LOCKED→ANNOUNCED→ACTIVE→REVIEW→DEBRIEF→COMPLETED), officialService.design
- `sessions/{sid}/events/{key}` — seq 순서의 공개 이벤트: message / system / invite / task / hint / answers / debrief / official / ending
- `sessions/{sid}/private` — nextIndex(다음 공개 항목), 공개한 힌트
- `sessions/{sid}/joinRequests/{uid}`, `teams/{teamId}{name,uid,online,lastSeen}`, `members/{uid}: teamId`
- `sessions/{sid}/teamData/{teamId}/state` (팀 쓰기) / `submissions/tN` (ACTIVE 단계에서만) / `review/tN` (교사만)

## 라이브 모드에서 달라지는 점

- `G.live` 가 있으면 솔로 자동 재생(TIMELINE/INCIDENT/FOLLOWUP)이 전혀 돌지 않고, `applyLiveEvent()` 가 교사 이벤트를 순서대로 적용한다. 재접속 시 이미 공개된 이벤트는 연출 없이 복원되고 `appliedSeq` 로 중복을 막는다.
- 게임 시각은 `public.gameTime` 을 따르고 `Sched` 는 멈춘다.
- [업무 시작하기]·보고서 제출은 해당 TASK 단계가 ACTIVE 일 때만. 제출은 DB 저장이 확인된 뒤에만 '검토 대기'로 바뀐다.
- 승인/보완 요청은 `teamData/{teamId}/review` 로 도착하며, 승인되어도 다음 스토리는 교사가 공개할 때까지 진행되지 않는다.
- 디자인 수정 적용은 팀 수정안 확정일 뿐이고, TICKET ON 은 `public.officialService.design` 을 따른다(교사가 v4 또는 특정 팀 수정안 반영).
- 정답/해설(`TASK2_ANSWERS`)은 학생 번들에 없고, 교사가 '해설 공개'를 누르면 `answers` 이벤트로 받아 `G.state.answers` 에 저장된다. `answerKey()`/`spotInfo()`/`choiceInfo()` 가 두 경우를 통일한다.
- 솔로 모드(세션 없이 chat.html)는 `private/data-private.js` 를 동적으로 불러와 예전처럼 자동 재생한다. 호스팅에 private/ 가 없으면 솔로 모드는 동작하지 않는다.

---

# 업데이트: TASK-003 작동하지 않는 버튼의 비밀 (2026-10-20)

## 추가된 파일
- `js/devtool.js`, `css/devtool.css` — DAYEON DEV TOOLS (파일 탐색기 / 코드 에디터 / 콘솔 / 조사 기록·테스트 현황)

## 스토리 변경
- TASK-002 완료 후 대화(`FOLLOWUP2`)가 "예매 버튼이 안 눌린다"로 바뀌고 TASK-003 배정 카드로 끝남.
- `FOLLOWUP3`: TASK-003 승인 후 "결제까지 테스트해 보자". `FOLLOWUP4`: 결제하기 두 번째 클릭(409 중복) 후 "결제 요청 중… 중복 감지 → TASK-004 결제 대참사 예고" (솔로: 자동, 수업: 교사 공개).

## 오류의 동작 방식 (ticket.js)
- `reserveBugActive()`: 디자인이 (공식) 반영되었거나 TASK-003이 배정된 뒤부터 예매하기 버튼의 click 리스너가 "등록되지 않은" 상태. CSS 비활성이 아니라 클릭해도 화면이 그대로이고 이벤트 로그에만 남는다.
- `reserveWorks()`: 솔로 → `task3.codeFixed` 또는 `task3.done`. 수업 → 교사가 `officialService.reserveFixed`를 켜면 모두, 그 전에는 각 팀의 `codeFixed`(팀 테스트 환경)만.
- 결제 오류(무응답/409/PENDING)는 그대로 → TASK-004.

## 개발자 도구 (devtool.js)
- 파일: `index.html`(공연 상세 일부, id=reserveBtn), `reservation.js`(1~2행만 편집 가능, 4행에서 오류), `console.log`(TypeError at reservation.js:4), 개발 매뉴얼.
- 코드는 실행하지 않는다. `parseCode()`가 `getElementById/querySelector(All)/getElementsByClassName`의 인자를 뽑아 `TASK3.dom` 가상 DOM에 대조해 null / 목록 / 다른 요소 / 정답 요소를 구분하고, 콘솔 결과와 테스트 통과 여부를 만든다. 통과하면 `codeFixed=true`가 되어 TICKET ON(팀 환경)의 예매 버튼이 바로 동작한다. 코드를 다시 바꾸면 통과가 해제된다.
- 코드 줄·콘솔 항목 클릭 → 조사 기록(`clues`). 수정 전/후 비교, 원래 코드로 되돌리기.

## 진행 상태 (task3)
`assigned, acked, started, reproductions[], reproAttempts, devtoolOpened, clues[], code, codeTested, testRuns, testResult, codeFixed, fixedCode, retest{count,passes}, reportDraft, report, reportSubmitted, review, done` + `followup4`, `task4Ready`, `devView`.

## 보고서 제출 조건
재현 기록 1건↑ · 개발자 도구 열람 · 코드 테스트 통과 · TICKET ON 재테스트 2회 · ①②③⑥ 작성 · 협업 토론 1개↑ → 교사 승인.

## 교사 대시보드
진행 가이드에 TASK-003 단계 8개 추가(배정 → 조사 시작 → 검토 → 해설 → 공식 수정 반영 → 종료 → 결제 테스트 대화 → 결제 중복 사건·TASK-004 예고). 학생 현황에 디버깅 열, 팀 답안에 재현 기록·단서·코드 수정·테스트 결과, 해설 탭에 TASK-003 정답. 시나리오 콘텐츠는 v2로 재등록 필요(자동 안내).
