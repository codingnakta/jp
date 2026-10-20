// Firebase 웹 앱 설정 (jpjpjpjp-de221)
// 이 값들은 공개되어도 되는 식별자입니다. 접근 통제는 database.rules.json 의 보안 규칙이 담당합니다.
// 이 프로젝트는 모듈(import) 방식이 아니라 CDN compat SDK를 쓰므로 window.FIREBASE_CONFIG 로 둡니다. (애널리틱스는 사용하지 않음)
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyBd7UnqEkaaAHCDYHBIiQZ2JkFjDetzOIY",
  authDomain: "jpjpjpjp-de221.firebaseapp.com",
  databaseURL: "https://jpjpjpjp-de221-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "jpjpjpjp-de221",
  storageBucket: "jpjpjpjp-de221.firebasestorage.app",
  messagingSenderId: "158274200107",
  appId: "1:158274200107:web:0d7a45002fef67b212806e",
};

// 로컬 에뮬레이터로 테스트할 때만 주석 해제 (firebase emulators:start)
// window.FIREBASE_EMULATOR = { auth: "http://localhost:9099", database: { host: "localhost", port: 9000 } };
