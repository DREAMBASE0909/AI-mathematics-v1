# 행렬 공장 학습 구조

현재 확정된 Lv.1은 6단계 튜토리얼이다. 옛 2×2 계수 정리판과 연립방정식 풀이 시뮬레이터는 사용하지 않는다.

## 파일 역할

| 파일 | 역할 |
|---|---|
| `index.html` | 게임 상태·공장 구매/가동·수익·업그레이드·저장. 학습창의 기본 HTML과 완료 콜백 |
| `step-lesson.js` | 단계 렌더링, 화면 터치/Enter/Space 진행, 이전 이동, 드림이 대사 표시/해제, 정답 확인, 타이머 정리 |
| `matrix-lesson.js` | Lv.1 단계 데이터, 정답 `[0, -2]`, 두 힌트, 행렬 변환 애니메이션, 공통 진행기에 연결하는 `MatrixLesson` |
| `matrix-lesson.css` | Lv.1과 기본 학습 요소의 스타일. 화면 높이 안에서 유지되는 본문과 전체 화면 드림이 연출 |
| `learning-shell.js` | Lv.2~5용 본문 슬롯·드림이·완료 조건/콜백을 제공하는 `LearningShell.create` |
| `matrix-lab.js` | Lv.1 진입 분기와 Lv.2~5 활동·활동 저장·연구 완료 콜백 |
| `matrix-lab.css` | Lv.2~5 활동과 기존 드림이 대화창 스타일 |
| `tests/viewport.html` | 세 화면 크기를 재현하는 수동 검증 페이지. 메모리 저장소만 쓰며 실제 학생 기록에 접근하지 않음 |

스크립트 로드 순서: 게임 코드 → `learning-shell.js` → `step-lesson.js` → `matrix-lesson.js` → `matrix-lab.js`.
외부 라이브러리와 빌드 도구는 없다.

## 호출 흐름

### 첫 구매

`confirmPlacement()` → `openLearning(uid)` → `MatrixLesson.start({canSubmit, onComplete})`

- `canSubmit`은 구매한 공장이 여전히 학습 대기 상태인지 검사한다.
- 5단계에서 두 칸을 검증한 뒤 6단계로 넘어간다.
- 마지막 완료 버튼 → `activateLearnedFactory(item)`.
- 기존과 같이 `unlocked` 추가 → 같은 종류 공장 전체 `active` → `save()` → `renderBoard()` → 학습창 닫기.
- 다른 세 공장은 기존 자리표시·숨긴 정답·완료 버튼 흐름을 그대로 사용한다.

### 자유 테스트와 레벨 탭

`#testMatrixLab` → `MatrixLab.start(1, {test:true})` → 정상 Lv.1 분기 → `MatrixLesson.start({test:true})`.

- `#mlTabs`와 `#mtTestLevels` 모두 같은 `MatrixLab.start` 진입점을 호출한다.
- Lv.1은 확정된 튜토리얼, Lv.2~5는 기존 활동을 연다.
- `previousMatrixStart`, 함수 덮어쓰기, capture 클릭 가로채기는 없다.
- Lv.1 테스트 완료는 창만 닫는다. Lv.2~5 테스트 완료는 기존 완료 문구를 표시한다.
- 테스트는 공장 가동·해금·연구 비용 차감을 호출하지 않는다. 가동 중인 공장의 정상 자동 수익은 계속된다.

### 업그레이드

`openUpgrade(uid)` → `MatrixLab.start(level, {cost, onComplete})` → 활동 조건 충족 → `completeUpgrade(true)`.
연구 기록이 있는 공장의 비용만 결제하는 기존 경로는 변경하지 않았다.

## 보존한 동작

- 열 순서와 모든 단계 제목·대사·본문 HTML, 오답 힌트와 정답은 원문 그대로다.
- `0`, `-2`, 유니코드 마이너스 `−2`를 기존과 동일하게 처리한다. 공백·문자는 오답이다.
- 화면 터치는 1~4단계를 진행한다. 입력칸·버튼·텍스트 선택·스크롤 제스처는 건너뛴다.
- 드림이 레이어를 닫는 터치는 다음 단계로 전파되지 않는다.
- 이전 버튼과 대사 다시 보기를 유지한다. 재진입 시 1단계부터 시작한다.
- 3단계: 대사 해제 후 150ms → 글자 그룹 310ms 간격 → 숫자 이동 후 1000ms → 결과 표시까지 650ms.
- CSS 숫자 이동 950ms, 글자 페이드 300ms, 괄호 표시 600ms, 저장 표기 표시 500ms를 유지한다.
- `prefers-reduced-motion`에서는 기존처럼 바로 결과를 보여 준다.
- 닫기·이전 이동·다시 열기 시 타이머를 취소한다.

## 저장 호환성

`ai-company-math-v1`과 `ai-matrix-lab-v1-{test|play}-{level}` 키를 그대로 사용한다.

`coefficients`, `hint`, `slots`, `selected`, `equationRow`, `equationCol`, `equationChanged`, `equationFocus`, `solverSeen`, `scene`, `row`, `col`은 현재 활동에 필요 없지만 기존 Lv.2~5 저장 객체에도 존재한다. `legacyDefaults()`에 저장 형식 호환용으로 보존했다. 실행·채점 로직은 이 필드를 사용하지 않는다. `slots` 배열 검사도 기존 저장 로더의 유효성 기준이므로 유지했다.

`fresh()`의 직렬화 결과가 정리 전과 바이트 단위로 같은지 확인했다. 저장 데이터를 삭제하거나 마이그레이션하지 않는다. 기존 `MatrixLab.clear()` 초기화 범위도 같다.

## 다른 공장에 단계형 학습을 붙이는 방법

1. 별도 콘텐츠 파일에 `steps` 배열을 만든다. 각 단계는 `title`, `speech`, `html`을 가진다.
2. 확인 문제의 단계 번호·입력 요소 ID·정답·힌트·성공 문구를 `quiz`에 모은다.
3. 학습창과 각 UI 요소를 `StepLesson.create({root, elements, className, headingId, title, description, steps, quiz})`에 전달한다.
4. 애니메이션 단계는 `waitForAnimation: true`와 `onDismiss(controller)`를 제공한다. 타이머는 `controller.schedule`로 예약하고 끝나면 `allowNext()`를 호출한다. `onStop`에서 콘텐츠별 실행 플래그를 초기화한다.
5. 게임 쪽에서 `start({test, canSubmit, onComplete})`를 호출한다. 저장·공장 가동·비용 차감은 공통 진행기 안에 넣지 않는다.

현재 공통 진행기는 “설명 단계 → 확인 문제 한 단계 → 연결/완료 단계” 흐름을 지원한다. 여러 문제나 다른 완료 방식이 필요하면 명시적인 확장으로 추가한다. 이번 작업에는 다른 공장 콘텐츠를 추가하지 않았다.

## 화면 높이

대화창은 `min(940px, 96dvh)`, 좁은 화면에서는 `100dvh`이다. 제목·탭·진행 영역은 유지하고 본문이 남은 높이를 사용한다. `#learningQuestion`의 390/420px 고정 높이는 없다. 충분히 작은 화면이나 확대 접근성을 위한 본문 스크롤 fallback만 둔다.

1366×768, 1280×720, 390×844의 6단계 모두 대화창/본문의 가로·세로 넘침을 확인했다. 단계가 바뀌어도 대화창 높이는 각각 737.27px, 691.19px, 844px로 일정하다. 5단계 행렬과 진행 버튼은 모두 화면 안에 있다. Lv.1 전용 CSS의 `!important`는 0개다. 공통 `[hidden]` 및 기존 동작 줄이기 규칙은 유지한다.

## 삭제한 코드

- `matrix-level-one.js`: 모든 Lv.1 요청이 확정 튜토리얼로 연결되어 사용하지 않던 계수 정리판.
- `matrix-solver.js`: `open`/`mount` 호출이 없고 `stop` 호출만 남았던 풀이 도구.
- `arrange`, `MatrixLevelOne.correct` 검사, `MatrixSolver.stop`, 사용하지 않는 `matrixBracket`.
- 옛 정리판·풀이 도구·중간 표·이전 단계 UI 관련 CSS와 스크립트 태그.

## 검증 (2026-10-09)

- 첫 구매: 1~6단계, 3단계 애니메이션, 오답 힌트 두 종류, `0`/`−2` 입력, 완료 후 가동 및 초당 30원 확인.
- 자유 테스트: 양쪽 레벨 탭에서 Lv.1~5 화면 확인. Lv.1·Lv.2 테스트 완료 후 자금 0원·공장 0대 유지.
- 업그레이드: Lv.2 연구에서 픽셀과 숫자로 목표 완성 → 40,000원 차감 → Lv.2, 초당 200원 확인.
- 화면: 3개 크기 × 6단계, 총 18개 조합에서 본문 가로/세로 넘침 0px. 드림이 대사와 안내도 화면 안에 들어옴.
- 게임의 오류·미처리 Promise rejection·리소스 오류 0건. 브라우저 확장 프로그램의 metadata 전송 오류는 별도 환경 로그로 분류했다.
- 모든 JS 문법 검사 통과. 6단계 제목·대사·HTML의 정확한 원문 일치 및 저장 기본 객체 일치 확인.
- 같은 브랜치에 동시에 추가된 빈 땅 장식과 빨간 지출 표시 수정도 보존했다.

실기기 Safari 및 실제 소프트 키보드 동작은 별도 기기에서 확인해야 한다. 이번 화면 검증은 Chromium의 실제 iframe viewport 크기로 수행했다.

## 정리 전후 크기

동시에 반영된 게임 장식·지출 표시 변경까지 포함한 최신 브랜치(`67fed67`)와 비교했다.

| 항목 | 정리 전 | 정리 후 |
|---|---:|---:|
| `index.html` | 121,787 bytes | 89,890 bytes |
| 감소량 | — | 31,897 bytes (약 26.2%) |
| Lv.1 전용 CSS `!important` | 중복 덮어쓰기 포함 | 0 |

추가 회귀 확인: 자연어 공장 첫 구매는 기존 `(학습 요소)` 화면과 완료 버튼을 유지하며, 완료 후 초당 400원으로 정상 가동됐다.

## Lv.2 픽셀 레슨

`matrix-lesson-2.js`는 확대, 행·열 주소, 밝기, 7×7 그림판, 선택형 퀴즈의 단계 데이터를 정의한다. `matrix-lesson-2.css`는 이 레슨에만 적용된다. `MatrixLab.start(2, options)`는 `MatrixLessonTwo.start(options)`로 연결하고 기존 연구 비용 및 완료 콜백을 그대로 전달한다. Lv.3~5는 기존 LearningShell을 사용한다.

공통 `StepLesson`의 단계는 `onMount(controller)`와 `isComplete()`를 선택적으로 제공한다. 활동 상태가 바뀌면 `controller.refresh()`로 진행 가능 여부를 갱신한다. `quiz.type: 'choice'`는 `controller.answerChoice(value)`로 채점하며, 기존 숫자 입력 퀴즈는 변경 없이 유지한다. `requireAllSteps`는 마지막 완료 시 앞 단계의 조건도 검사한다. 같은 대화창의 이벤트는 현재 활성 컨트롤러만 처리한다.

Lv.2는 기존 `ai-matrix-lab-v1-{test|play}-2` 키에 `imageLessonV2` 필드를 추가한다. 이전 `pixels`, `pixelEdit`, `numberEdit`와 알 수 없는 필드는 보존한다. 새 필드가 없거나 잘못된 경우 안전한 초기값으로 시작한다. 그림판 가장자리는 저장값과 무관하게 고정한다. 테스트와 연구 저장은 분리되며 테스트 완료는 게임의 비용·공장 변경 콜백을 호출하지 않는다.

확인 퀴즈의 반대각선 행렬은 전치해도 같다. 반대 방향 대각선 보기는 전치라고 부르지 않고 위치 읽기 오류를 확인하는 보기로 사용한다.
