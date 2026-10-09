# 행렬 공장 Lv.1 — 계수 정리

- 전체 학습 컴포넌트: `matrix-level-one.js`의 `MatrixLevelOne.mount`.
- 공통 껍데기: `learning-shell.js`의 `LearningShell.create({id,prefix,title})`. 본문 슬롯 `body`, 말풍선 `say`, 완료 조건·콜백 `setCompletion(check,callback)`, 상태 갱신 `refresh`를 제공한다. 완료 버튼 클릭 시 조건을 다시 검사한다.
- 연결: `index.html`의 `openLearning(uid)` → `MatrixLab.start(1,{onComplete})` → `matrix-lab.js`의 `arrange()` → `MatrixLevelOne.mount`. 기존 최초 구매 콜백을 그대로 호출하므로 해금, 공장 가동, 저장 처리는 유지된다.
- 로드 순서: learning-shell.js → matrix-level-one.js → matrix-lab.js. 스타일은 matrix-lab.css의 coefficient 관련 규칙.
- Lv.2~5도 공통 껍데기를 사용하며 기존 활동과 완료 조건을 유지한다. 다른 공장은 향후 별도 id와 prefix로 껍데기를 만들 수 있다.
- 저장된 구 Lv.1의 scene/solverSeen은 새 완료 조건에 사용하지 않는다. coefficients 네 칸을 새로 채워야 한다. 이미 가동한 공장의 해금 기록은 유지된다.

## 완료 처리 영향

행렬 최초 구매는 네 칸이 모두 정답이어야 완료된다. 비어 있는 값은 0으로 간주하지 않는다. 정답을 지우면 완료 버튼이 다시 비활성화된다. 정답 도달 시 정리판이 한 번 반짝인다(동작 줄이기 설정에서는 생략).

다른 공장의 기존 버튼 완료 처리와 이미 연구한 업그레이드의 비용 결제 경로는 수정하지 않았다. 행렬 Lv.2~5는 기존 조건을 통과해야 완료할 수 있다. 테스트 완료는 게임 자금이나 공장 해금을 바꾸지 않는다.

## 확인

입력 순서 오류 [3,2,1,0], 빈칸, 공백, 문자 입력은 실패한다. [2,3,1,0]만 수치상 정답으로 인정한다. 브라우저에서 두 단계 힌트, 빈칸/오답 차단, Enter 완료, 최초 구매 학습 후 공장 가동과 초당 30원 표시를 확인했다.
