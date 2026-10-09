/* Lv.4: receipts → stencils → a conveyor sorter → mathematical names. */
(() => {
  'use strict';
  const get = id => document.getElementById(id);
  const { parts, grid, weightMap, order, format, dot } = MatrixImage;
  const labels = order(3);
  const names = { V: '세로 막대', H: '가로 막대', Vtop: '위가 끊긴 세로', Vbot: '아래가 끊긴 세로', Hleft: '왼쪽이 끊긴 가로', Hright: '오른쪽이 끊긴 가로' };
  const stencil = [1,2,1, 0,3,0, 1,2,1];
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const picture = id => grid(parts[id].map(v => v * 255), 3);
  const sum = (id, board = data.board) => dot(parts[id], board);
  const basicReady = () => sum('V') > 0 && sum('H') < 0;
  const correctPart = id => id.startsWith('V') ? sum(id) > 0 : sum(id) < 0;
  const allReady = () => Object.keys(parts).every(correctPart);
  const parse = value => Number(value.trim().replaceAll(',', '').replaceAll('−', '-'));
  const shuffled = values => {
    const result = [...values];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };
  let data, record, storageKey, running = false, naming = false;
  const fresh = () => ({ step: 0, receipt: '', receiptOK: false, overlaySeen: false,
    total: '', totalOK: false, board: Array(9).fill(0), brush: 1,
    paintHint: 0, trialHint: 0, trialDone: false, results: [],
    trialOrder: shuffled(Object.keys(parts)), named: false, choice: null,
    choices: shuffled(['weights', 'image', 'score', 'position']) });
  function persist() {
    if (!data || !storageKey) return;
    record.sorterLessonV1 = data;
    try { localStorage.setItem(storageKey, JSON.stringify(record)); } catch { /* Optional storage. */ }
  }
  function changed() { persist(); controller.refresh(); }
  function reaction(message) {
    get('sortReaction').textContent = '드림이 · ' + message;
    controller.say(message);
  }
  const statusHTML = '<p id="sortStatus" role="status"></p>';
  const reactionHTML = '<p id="sortReaction" class="sort-reaction" aria-live="polite"></p>';
  const receiptHTML = '<table class="sort-receipt"><caption>매점 영수증</caption><thead><tr><th>상품</th><th>가격</th><th>개수</th></tr></thead><tbody><tr><td>빵</td><td>1,500원</td><td>2개</td></tr><tr><td>우유</td><td>1,200원</td><td>0개</td></tr><tr><td>과자</td><td>1,000원</td><td>1개</td></tr></tbody><tfoot><tr><th>합계</th><td colspan="2">4,000원</td></tr></tfoot></table>';
  function bindAnswer(inputId, buttonId, field, expected, wrong, onCorrect) {
    const input = get(inputId);
    input.value = data[field];
    const check = () => {
      data[field] = input.value;
      const good = input.value.trim() !== '' && parse(input.value) === expected;
      data[field + 'OK'] = good;
      input.setAttribute('aria-invalid', String(!good));
      get('sortStatus').textContent = good ? '✓ 맞았어요!' : wrong;
      if (good) onCorrect();
      changed();
    };
    input.oninput = () => {
      data[field] = input.value;
      data[field + 'OK'] = false;
      changed();
    };
    input.onkeydown = event => {
      if (event.key === 'Enter') { event.preventDefault(); event.stopPropagation(); check(); }
    };
    get(buttonId).onclick = check;
  }
  function mountReceipt(api) {
    bindAnswer('sortReceiptAnswer', 'sortReceiptCheck', 'receipt', 4000,
      '가격 × 개수를 줄마다 구해서 모두 더해 보세요. 0개인 우유는 0원이에요.', () => {
        api.say('곱하고 모두 더하기. 이 계산 하나로 AI 분류기를 만들 수 있어요.');
        api.showSpeech();
      });
  }
  function mountOverlay(api) {
    running = false;
    get('sortPart').innerHTML = picture('V');
    get('sortStencil').innerHTML = weightMap(stencil, 3);
    const input = get('sortTotal'), check = get('sortTotalCheck');
    function horizontal() {
      get('sortHorizontal').hidden = false;
      get('sortHorizontal').innerHTML = '<div class="sort-horizontal-stack">' + picture('H')
        + '<div class="sort-horizontal-overlay">' + weightMap(stencil, 3) + '</div></div>'
        + '<span>가로 막대: 0 + 3 + 0 = <strong>3점</strong></span>';
      get('sortHorizontal').querySelectorAll('.mi-weights span').forEach((cell, i) => cell.classList.toggle('sort-muted', !parts.H[i]));
    }
    function finishOverlay() {
      data.overlaySeen = true;
      running = false;
      input.disabled = check.disabled = false;
      get('sortTerms').textContent = '2 + 3 + 2 = ?';
      changed();
    }
    function overlay() {
      if (running || data.overlaySeen) return;
      running = true;
      get('sortOverlap').disabled = true;
      get('sortOverlay').innerHTML = weightMap(stencil, 3);
      const cells = get('sortOverlay').querySelectorAll('span');
      cells.forEach((cell, i) => cell.classList.toggle('sort-muted', !parts.V[i]));
      const source = get('sortStencil').getBoundingClientRect(), target = get('sortOverlay').getBoundingClientRect();
      function highlight(index) {
        const active = [1, 4, 7];
        if (index === active.length) { finishOverlay(); return; }
        cells[active[index]].classList.add('sort-lit');
        get('sortTerms').textContent = active.slice(0, index + 1).map(i => stencil[i]).join(' + ');
        api.schedule(() => highlight(index + 1), 330);
      }
      if (reduced()) { cells.forEach((cell, i) => cell.classList.toggle('sort-lit', !!parts.V[i])); finishOverlay(); }
      else {
        get('sortOverlay').animate([{ transform: `translate(${source.left - target.left}px, ${source.top - target.top}px)`, opacity: .4 },
          { transform: 'translate(0,0)', opacity: .88 }], { duration: 450, easing: 'ease-in-out' });
        api.schedule(() => highlight(0), 450);
      }
    }
    get('sortOverlap').onclick = overlay;
    const drag = get('sortStencil');
    let start = null;
    drag.onpointerdown = event => {
      if (data.overlaySeen || running) return;
      event.preventDefault();
      start = { x: event.clientX, y: event.clientY };
      drag.setPointerCapture(event.pointerId);
    };
    drag.onpointermove = event => {
      if (start) drag.style.transform = `translate(${event.clientX - start.x}px,${event.clientY - start.y}px)`;
    };
    drag.onpointerup = event => {
      if (!start) return;
      const target = get('sortPart').getBoundingClientRect();
      const inside = event.clientX >= target.left && event.clientX <= target.right && event.clientY >= target.top && event.clientY <= target.bottom;
      start = null;
      drag.style.transform = '';
      if (inside) overlay();
    };
    drag.onpointercancel = drag.onlostpointercapture = () => { start = null; drag.style.transform = ''; };
    input.disabled = check.disabled = !data.overlaySeen;
    if (data.overlaySeen) {
      get('sortOverlay').innerHTML = weightMap(stencil, 3);
      get('sortOverlay').querySelectorAll('span').forEach((cell, i) => cell.classList.toggle('sort-muted', !parts.V[i]));
      get('sortOverlap').disabled = true;
      get('sortTerms').textContent = '2 + 3 + 2 = ?';
    }
    bindAnswer('sortTotal', 'sortTotalCheck', 'total', 7,
      '흰 칸 아래의 2, 3, 2를 모두 더해 보세요.', () => {
        horizontal();
        api.say('같은 점수판이라도 그림에 따라 점수가 달라졌죠? 이 점수판을 잘 칠하면 분류기가 돼요.');
        api.showSpeech();
      });
    if (data.totalOK) horizontal();
  }
  function editor(api, trial) {
    running = false;
    const board = get('sortBoard');
    let previousReady = basicReady();
    const cells = [];
    function renderCells() {
      const map = document.createElement('div');
      map.innerHTML = weightMap(data.board, 3);
      [...map.querySelectorAll('span')].forEach((span, i) => {
        cells[i].style.cssText = span.style.cssText;
        cells[i].textContent = data.board[i] > 0 ? '+1' : format(data.board[i]);
        cells[i].setAttribute('aria-label', `${labels[i]} 점수 ${format(data.board[i])}`);
      });
    }
    function scores() {
      for (const id of ['V', 'H']) {
        const value = sum(id);
        get(`sortScore${id}`).textContent = format(value) + '점';
        get(`sortBar${id}`).value = value;
      }
    }
    function paint(index) {
      if (running) return;
      data.board[index] = data.brush;
      data.trialDone = false;
      data.results = [];
      renderCells();
      if (trial) {
        get('sortResults').replaceChildren();
        get('sortReaction').textContent = '';
        get('sortBoxes').querySelectorAll('small').forEach(node => { node.textContent = '0개'; });
        get('sortStatus').textContent = '점수판을 바꿨어요. 다시 가동해 보세요.';
      } else {
        scores();
        const ready = basicReady();
        if (ready && !previousReady) reaction('빨강은 ‘여기가 흰색이면 감점’이에요. 이제 두 막대가 갈렸어요!');
        else if (data.board.some(v => v > 0) && !data.board.includes(-1) && sum('H') >= 0) {
          reaction('가로 막대도 점수를 받네요. 가로 막대에만 있는 칸에 빨강을 칠해 보면 어떨까요?');
        }
        else if (!ready) reaction('세로 막대는 0보다 크게, 가로 막대는 0보다 작게 만들어 보세요.');
        previousReady = ready;
      }
      changed();
    }
    data.board.forEach((_, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.pixel = i;
      cells.push(button);
      board.append(button);
    });
    MatrixPaint.bind(board, { size: 3, paint, canPaint: () => !running });
    for (const [value, name] of [[1, '파랑 +1'], [-1, '빨강 −1'], [0, '지우개 0']]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = name;
      button.dataset.brush = value;
      button.setAttribute('aria-pressed', String(data.brush === value));
      button.onclick = () => {
        data.brush = value;
        get('sortBrushes').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
        persist();
      };
      get('sortBrushes').append(button);
    }
    const hintKey = trial ? 'trialHint' : 'paintHint';
    const hints = trial
      ? ['세로·가로 막대가 함께 가진 칸을 찾아보세요.', '가운데 칸을 지우개(0)로 바꿔 보세요.']
      : ['세로 막대에만 있는 칸은 어디일까요?', '가운데 열 위·아래는 파랑, 가운데 행 왼쪽·오른쪽은 빨강을 칠해 보세요.'];
    get('sortHint').onclick = () => {
      data[hintKey] = Math.min(2, data[hintKey] + 1);
      get('sortHintText').textContent = hints[data[hintKey] - 1];
      persist();
    };
    renderCells();
    if (!trial) {
      for (const id of ['V', 'H']) get(`sortImage${id}`).innerHTML = picture(id);
      scores();
    }
    return () => {
      cells.forEach(cell => { cell.disabled = running; });
      get('sortBrushes').querySelectorAll('button').forEach(button => { button.disabled = running; });
    };
  }
  function showResults() {
    const counts = { V: 0, H: 0, wait: 0 };
    get('sortResults').innerHTML = data.results.map(id => {
      const score = sum(id), destination = score > 0 ? 'V' : score < 0 ? 'H' : 'wait';
      counts[destination]++;
      return `<div class="${correctPart(id) ? '' : 'sort-error'}">${picture(id)}<span>${names[id]}<br><strong>${format(score)}점 · ${destination === 'wait' ? '보류' : destination === 'V' ? '세로' : '가로'} ${correctPart(id) ? '✓' : '✕'}</strong></span></div>`;
    }).join('');
    for (const [id, count] of Object.entries(counts)) get(`sortBox${id}`).querySelector('small').textContent = `${count}개`;
  }
  function mountTrial(api) {
    const disableEditor = editor(api, true);
    showResults();
    get('sortRun').onclick = () => {
      if (running) return;
      running = true;
      data.trialDone = false;
      data.results = [];
      data.trialOrder = shuffled(Object.keys(parts));
      get('sortRun').disabled = true;
      disableEditor();
      showResults();
      changed();
      function finish() {
        running = false;
        data.trialDone = allReady();
        get('sortRun').disabled = false;
        disableEditor();
        get('sortPassenger').replaceChildren();
        const wrong = data.results.filter(id => !correctPart(id));
        get('sortStatus').textContent = wrong.length ? `${6 - wrong.length} / 6개 성공 · 빨간 표시를 확인하고 점수판을 고쳐 주세요.` : '✓ 6 / 6개 성공';
        if (!wrong.length) reaction('6개 모두 맞게 분류했어요! 구별에 도움이 안 되는 칸은 0으로 두는 것도 중요해요.');
        else if (sum('Hleft') === 0 && sum('Hright') === 0) reaction('끊긴 가로 막대가 0점이에요. 세로 막대와 가로 막대가 둘 다 가진 칸이 있는데, 그 칸은 구별에 도움이 될까요?');
        else reaction('틀리거나 보류된 부품의 흰 칸을 살펴보세요. 점수판을 고쳐 다시 가동해 볼까요?');
        changed();
      }
      function run(index) {
        if (index === 6) { finish(); return; }
        const id = data.trialOrder[index];
        const passenger = get('sortPassenger');
        passenger.innerHTML = picture(id) + `<span>${names[id]}</span>`;
        const score = sum(id), box = get(score > 0 ? 'sortBoxV' : score < 0 ? 'sortBoxH' : 'sortBoxwait');
        passenger.classList.toggle('sort-error', !correctPart(id));
        if (reduced()) {
          data.results.push(id);
          showResults();
          run(index + 1);
          return;
        }
        const a = passenger.getBoundingClientRect(), b = box.getBoundingClientRect();
        passenger.animate([{ transform: 'translateX(-65px)', opacity: 0 }, { transform: 'translate(0,0)', opacity: 1, offset: .35 },
          { transform: `translate(${b.left + b.width / 2 - a.left - a.width / 2}px,${b.top - a.top}px) scale(.4)`, opacity: .4 }], { duration: 480, easing: 'ease-in-out' });
        api.schedule(() => { data.results.push(id); showResults(); run(index + 1); }, 480);
      }
      run(0);
    };
  }
  function mountNames(api) {
    naming = false;
    get('sortNameImage').innerHTML = grid(parts.V, 3, true);
    get('sortNameImage').querySelectorAll('span').forEach((cell, i) => {
      cell.style.background = parts.V[i] ? '#fff' : '#18222b';
      cell.style.color = parts.V[i] ? '#18222b' : '#fff';
    });
    get('sortNameBoard').innerHTML = weightMap(data.board, 3);
    const answers = { weights: '점수판(가중치)', image: '부품 그림', score: '분류 점수', position: '픽셀 위치' };
    data.choices.forEach(id => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = answers[id];
      button.disabled = true;
      button.setAttribute('aria-pressed', String(data.choice === id));
      button.onclick = () => {
        data.choice = id;
        get('sortChoices').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
        if (api.answerChoice(id)) {
          api.say('지금은 여러분이 점수판을 칠했지만, AI는 수많은 예시를 보며 스스로 점수판을 고쳐 가요. 그게 ‘학습’이에요. 경사하강법 공장에서 만나요!');
          api.showSpeech();
        }
        persist();
      };
      get('sortChoices').append(button);
    });
  }
  function animateNames(api) {
    if (naming) return;
    naming = true;
    const cells = [...get('sortNameImage').querySelectorAll('span'), ...get('sortNameBoard').querySelectorAll('span')];
    const before = cells.map(cell => cell.getBoundingClientRect());
    get('sortMatrices').classList.add('sort-unfolded');
    if (!reduced()) cells.forEach((cell, i) => {
      const after = cell.getBoundingClientRect();
      cell.animate([{ transform: `translate(${before[i].left - after.left}px,${before[i].top - after.top}px)` }, { transform: 'translate(0,0)' }], { duration: 650, easing: 'ease-in-out' });
    });
    const names = ['상품 → 픽셀 위치', '개수 → 픽셀 값', '가격 → 점수판', '합계 → 분류 점수'];
    function rename(index) {
      if (index === 4) {
        data.named = true;
        get('sortNamingText').hidden = false;
        get('sortChoices').querySelectorAll('button').forEach(button => { button.disabled = false; });
        changed();
        return;
      }
      get('sortLabels').children[index].textContent = names[index];
      if (reduced()) rename(index + 1);
      else api.schedule(() => rename(index + 1), 180);
    }
    if (reduced()) rename(0);
    else api.schedule(() => rename(0), 650);
  }
  const paintHTML = '<div id="sortBrushes" class="sort-brushes"></div><div id="sortBoard" class="sort-board" aria-label="점수판 칠하기"></div>';
  const hintHTML = '<div class="sort-hints"><button id="sortHint" type="button" class="mt-button">힌트 보기</button><span id="sortHintText"></span></div>';
  const steps = [
    { title: '매점 영수증', speech: '분류기를 만들기 전에 몸풀기! 매점 영수증 계산해 볼까요?',
      html: receiptHTML.replace('4,000원', '?') + '<div class="sort-answer"><label>합계 <input id="sortReceiptAnswer" aria-label="영수증 합계" inputmode="decimal" autocomplete="off"> 원</label><button id="sortReceiptCheck" type="button" class="mt-button">확인</button></div>' + statusHTML,
      onMount: mountReceipt, isComplete: () => data.receiptOK },
    { title: '점수판 겹치기', speech: '점수판을 그림 위에 겹치면, 흰 칸 아래 점수만 더해져요. 영수증에서 0개인 물건은 0원인 것과 같아요.',
      html: '<div class="sort-overlay-layout"><section><h4>세로 막대 부품</h4><div class="sort-stack"><div id="sortPart"></div><div id="sortOverlay"></div></div></section><section><h4>점수판 · 왼쪽으로 끌어 보세요</h4><div id="sortStencil"></div><button id="sortOverlap" type="button" class="mt-button">겹치기</button></section></div><p id="sortTerms">흰 칸 아래의 점수를 찾아보세요.</p><p>검은 칸(0)은 곱하면 0이라 무시돼요.</p><div class="sort-answer"><label>세로 막대 총점 <input id="sortTotal" aria-label="세로 막대 총점" inputmode="numeric" autocomplete="off"></label><button id="sortTotalCheck" type="button" class="mt-button">확인</button></div><div id="sortHorizontal" hidden></div>' + statusHTML,
      onMount: mountOverlay, isComplete: () => data.overlaySeen && data.totalOK },
    { title: '점수판 칠하기', speech: '컨베이어에 세로 막대와 가로 막대가 섞여 들어와요. 점수판을 칠해서 둘을 구분해 주세요.',
      html: '<p><strong>목표: 세로 막대는 0보다 크게, 가로 막대는 0보다 작게</strong></p><div class="sort-paint-layout"><section>' + paintHTML + '</section><div class="sort-scores">'
        + ['V', 'H'].map(id => `<section><div id="sortImage${id}"></div><div><strong>${names[id]}</strong><output id="sortScore${id}"></output><meter id="sortBar${id}" min="-3" max="3" value="0"></meter></div></section>`).join('')
        + '</div></div>' + hintHTML + reactionHTML,
      onMount: api => editor(api, false), isComplete: basicReady },
    { title: '컨베이어 시험', speech: '이번에는 조금 끊긴 부품도 들어와요. 여섯 개 모두 맞는 상자로 보내 보세요. 점수판은 여기서도 고칠 수 있어요.',
      html: '<div class="sort-trial-layout"><section>' + paintHTML + '<button id="sortRun" type="button" class="mt-button">가동</button></section><section class="sort-machine"><div id="sortBelt"><span>부품 투입 →</span><div id="sortPassenger"></div></div><div id="sortBoxes"><div id="sortBoxV">세로 상자<small>0개</small></div><div id="sortBoxH">가로 상자<small>0개</small></div><div id="sortBoxwait">보류<small>0개</small></div></div><div id="sortResults"></div></section></div>' + hintHTML + statusHTML + reactionHTML,
      onMount: mountTrial, isComplete: () => data.trialDone && allReady() && !running },
    { title: '이 계산의 이름은?', speech: '우리가 만든 분류기를 영수증과 나란히 놓아 볼까요? 같은 계산에 이름을 붙여 볼게요.',
      html: '<div class="sort-names-layout"><section>' + receiptHTML + '<div id="sortLabels"><span>상품</span><span>개수</span><span>가격</span><span>합계</span></div></section><div id="sortMatrices"><div id="sortNameImage"></div><b>×</b><div id="sortNameBoard"></div></div><div id="sortNamingText" hidden><p>가로 한 줄 × 세로 한 줄을 짝지어 곱하고 모두 더하는 계산, 이것이 <strong>행렬 곱셈</strong>이에요. 신경망에서는 점수판을 <strong>가중치</strong>라고 불러요.</p><small>실제 사진은 0~255지만, 계산을 쉽게 하려고 0~1로 바꿔서 써요.</small></div></div><p><strong>영수증의 ‘가격표’는 AI 분류기에서 무엇일까요?</strong></p><div id="sortChoices"></div>',
      onMount: mountNames, onDismiss: animateNames, isComplete: () => data.named && data.choice === 'weights' }
  ];
  const root = get('learningDialog');
  const controller = StepLesson.create({
    root, className: 'matrix-tutorial', extraClass: 'matrix-level-four',
    headingId: 'sortStepTitle', title: '드림이의 부품 분류기', description: 'Lv.4 · 점수판으로 부품 구분하기',
    steps, requireAllSteps: true, closeOnComplete: true,
    finishLabel: ({ testing, cost = 0 }) => testing ? '체험 완료 →' : `연구 완료 · ${cost.toLocaleString('ko-KR')}원으로 업그레이드`,
    quiz: { type: 'choice', step: 4, answer: 'weights',
      hints: { image: '그림은 ‘개수’처럼 매번 바뀌는 쪽이에요.', score: '점수는 ‘합계’처럼 계산 결과예요.', position: '픽셀 위치는 ‘상품 이름’에 해당해요.' },
      success: '정답이에요! 영수증의 가격표가 분류기의 점수판, 즉 가중치에 해당해요.' },
    onStop() { running = false; }, onStepChange(index) { data.step = index; persist(); }, onClose: persist,
    elements: {
      card: root.querySelector('.card'), top: root.querySelector('.dialog-top'),
      title: get('learningTitle'), description: get('learningDescription'), question: get('learningQuestion'),
      guide: get('mtGuide'), speech: get('mtSpeech'), form: get('learningForm'), feedback: get('learningFeedback'),
      submit: get('learningForm').querySelector('button'), legacyLabel: get('learningForm').querySelector('label'),
      legacyAnswer: get('learningAnswer'), navigation: get('mtNav'), tabs: get('mtTestLevels'),
      previous: get('mtPrev'), replay: get('mtReplay'), tapHint: get('mtTapHint')
    }
  });
  function start(options = {}) {
    storageKey = `ai-matrix-lab-v1-${options.test ? 'test' : 'play'}-4`;
    try { record = JSON.parse(localStorage.getItem(storageKey)) || {}; } catch { record = {}; }
    if (typeof record !== 'object' || Array.isArray(record)) record = {};
    const saved = record.sorterLessonV1;
    data = fresh();
    if (saved && typeof saved === 'object') {
      for (const field of ['receipt', 'total']) {
        data[field] = typeof saved[field] === 'string' ? saved[field].slice(0, 24) : '';
        data[field + 'OK'] = saved[field + 'OK'] === true && data[field].trim() !== '' && parse(data[field]) === (field === 'receipt' ? 4000 : 7);
      }
      data.overlaySeen = saved.overlaySeen === true;
      if (Array.isArray(saved.board) && saved.board.length === 9 && saved.board.every(v => [-1,0,1].includes(v))) data.board = [...saved.board];
      if ([-1,0,1].includes(saved.brush)) data.brush = saved.brush;
      for (const field of ['paintHint', 'trialHint']) if ([0,1,2].includes(saved[field])) data[field] = saved[field];
      if (Array.isArray(saved.results) && saved.results.length <= 6 && new Set(saved.results).size === saved.results.length && saved.results.every(id => Object.hasOwn(parts, id))) data.results = [...saved.results];
      data.trialDone = saved.trialDone === true && data.results.length === 6 && allReady();
      data.named = saved.named === true;
      if (data.choices.includes(saved.choice)) data.choice = saved.choice;
      for (const field of ['choices', 'trialOrder']) {
        const allowed = data[field];
        if (Array.isArray(saved[field]) && saved[field].length === allowed.length && new Set(saved[field]).size === allowed.length && saved[field].every(id => allowed.includes(id))) data[field] = [...saved[field]];
      }
      const incomplete = steps.findIndex(step => !step.isComplete());
      data.step = Math.min(Number.isInteger(saved.step) ? Math.max(0, saved.step) : 0, incomplete < 0 ? 4 : incomplete);
    }
    controller.start({ ...options, step: data.step, verified: data.choice === 'weights' });
  }
  window.MatrixLessonFour = { start };
})();
