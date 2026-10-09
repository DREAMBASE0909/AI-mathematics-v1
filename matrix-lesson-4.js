/* Lv.4: use matrix multiplication to move pixels without changing brightness. */
(() => {
  'use strict';
  const get = id => document.getElementById(id);
  const { grid, identity, flip, multiply, face, order } = MatrixImage;
  const A = [[255, 255, 255], [0, 0, 255], [0, 0, 255]];
  const I = identity(3), J = flip(3);
  const results = {
    same: multiply(A, I), horizontal: multiply(A, J),
    vertical: multiply(J, A), both: multiply(multiply(J, A), J)
  };
  const labels = order(3);
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const equal = (a, b) => a.flat().every((value, i) => value === b.flat()[i]);
  const shuffle = values => {
    const items = [...values];
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  };
  let data, record, storageKey, moving = false, introPart = 0;
  let animations = [];
  const fresh = () => ({
    step: 0, inspected: [], machine: identity(3), hint: 0,
    prediction: null, viewed: [], side: 'right', choice: null,
    choices: shuffle(['both', 'horizontal', 'vertical', 'same'])
  });
  const machineReady = () => equal(data.machine, J);
  function persist() {
    if (!data || !storageKey) return;
    record.flipLessonV1 = data;
    try { localStorage.setItem(storageKey, JSON.stringify(record)); } catch { /* Optional storage. */ }
  }
  function changed() { persist(); controller.refresh(); }
  function reaction(message) {
    get('flipStatus').textContent = message;
    controller.say(message);
  }
  function picture(values, name, id = '') {
    return `<section class="flip-card" ${id ? `id="${id}"` : ''}><h4>${name}</h4>${grid(values.flat(), values.length, true)}</section>`;
  }
  function lamps(values, editable = false) {
    return `<div class="flip-lamps" aria-label="0과 1로 된 기계">` + values.flat().map((v, i) => {
      const attributes = `class="${v ? 'is-on' : ''}" data-cell="${i}"`;
      return editable
        ? `<button type="button" ${attributes} aria-label="기계 ${labels[i]}" aria-pressed="${!!v}">${v}</button>`
        : `<span ${attributes}>${v}</span>`;
    }).join('') + '</div>';
  }
  const machineCard = (values, id = '', editable = false) =>
    `<section class="flip-card" ${id ? `id="${id}"` : ''}><h4>기계 ${editable ? '· 칸을 누르세요' : equal(values, I) ? 'I' : 'J'}</h4>${lamps(values, editable)}</section>`;
  const statusHTML = '<p id="flipStatus" class="flip-status" role="status"></p>';
  function mountIdentity(api) {
    const result = get('flipIdentityResult').querySelector('.px-grid');
    [...result.children].forEach((cell, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.style.cssText = cell.style.cssText;
      button.textContent = cell.textContent;
      button.setAttribute('aria-label', `결과 ${labels[index]} 계산 보기`);
      button.onclick = () => {
        const row = Math.floor(index / 3), col = index % 3;
        get('flipIdentityA').querySelectorAll('.px-grid span').forEach((node, i) =>
          node.classList.toggle('flip-selected', Math.floor(i / 3) === row));
        get('flipIdentityI').querySelectorAll('.flip-lamps span').forEach((node, i) =>
          node.classList.toggle('flip-selected', i % 3 === col));
        [...result.children].forEach((node, i) => node.classList.toggle('flip-selected', i === index));
        get('flipFormula').innerHTML = A[row].map((v, k) =>
          `<span class="${I[k][col] ? 'flip-kept' : 'flip-zero'}">${v}×${I[k][col]}</span>`).join(' + ')
          + ` = <strong>${results.same[row][col]}</strong>`;
        if (!data.inspected.includes(index)) data.inspected.push(index);
        get('flipCount').textContent = `${data.inspected.length}칸 확인 · 서로 다른 2칸 이상 눌러 보세요`;
        if (data.inspected.length >= 2) {
          reaction('0을 곱하면 사라지고 1을 곱하면 남아요. 그래서 기계의 1은 ‘이 자리를 골라 와!’라는 뜻이에요.');
        }
        changed();
      };
      cell.replaceWith(button);
    });
    get('flipCount').textContent = `${data.inspected.length}칸 확인 · 결과 칸을 눌러 보세요`;
  }
  function mountBuilder() {
    const board = get('flipBuilder');
    board.innerHTML = lamps(data.machine, true);
    function update() {
      board.querySelectorAll('button').forEach((button, i) => {
        const v = data.machine[Math.floor(i / 3)][i % 3];
        button.textContent = v;
        button.classList.toggle('is-on', !!v);
        button.setAttribute('aria-pressed', String(!!v));
      });
      get('flipSources').innerHTML = [0, 1, 2].map(c =>
        `<span>결과 ${c + 1}열<br>← 원본 ${data.machine.findIndex(row => row[c] === 1) + 1}열</span>`).join('');
      const result = multiply(A, data.machine);
      get('flipBuiltResult').innerHTML = grid(result.flat(), 3, true);
      if (machineReady()) {
        reaction('1을 대각선 반대 방향으로 놓으니 좌우가 뒤집혔어요. 이 기계를 J라고 부를게요.');
      } else if (equal(result, results.horizontal)) {
        reaction('그림은 맞았어요! 원본 1·2열의 모습이 같기 때문이에요. 가운데 열은 그대로 두고, 1열과 3열을 교환해 J를 완성해 주세요.');
      } else get('flipStatus').textContent = '';
      changed();
    }
    board.querySelectorAll('button').forEach((button, index) => {
      button.onclick = () => {
        const r = Math.floor(index / 3), c = index % 3;
        data.machine.forEach((row, i) => { row[c] = Number(i === r); });
        data.viewed = [];
        data.prediction = null;
        data.choice = null;
        update();
      };
    });
    get('flipHint').onclick = () => {
      const hints = ['결과 1열에는 원본 몇 번째 열이 와야 할까요?', '1열과 3열을 서로 바꿔 보세요. 가운데 열은 그대로예요.'];
      get('flipHintText').textContent = hints[Math.min(data.hint++, 1)];
      persist();
    };
    update();
  }
  function mountOrder(api) {
    moving = false;
    const comparison = get('flipComparison');
    comparison.innerHTML = picture(multiply(A, data.machine), 'A × J · 좌우 반전')
      + picture(multiply(data.machine, A), 'J × A · 상하 반전');
    const stage = get('flipMoveStage');
    stage.innerHTML = picture(A, '그림 A', 'flipMovingA')
      + '<b id="flipTimes">×</b>' + machineCard(data.machine, 'flipMovingJ')
      + '<b>=</b>' + picture(results.horizontal, '결과', 'flipMovingResult');
    const button = get('flipSwitch');
    function renderSide() {
      const left = data.side === 'left';
      stage.insertBefore(get(left ? 'flipMovingJ' : 'flipMovingA'), stage.firstChild);
      stage.insertBefore(get('flipTimes'), stage.children[1]);
      stage.insertBefore(get(left ? 'flipMovingA' : 'flipMovingJ'), stage.children[2]);
      const output = left ? multiply(data.machine, A) : multiply(A, data.machine);
      get('flipMovingResult').innerHTML = '<h4>' + (left ? '상하 반전' : '좌우 반전') + '</h4>' + grid(output.flat(), 3, true);
      get('flipOrderLabel').textContent = left ? 'J × A · 왼쪽 기계는 행을 가져와요' : 'A × J · 오른쪽 기계는 열을 가져와요';
      if (!data.viewed.includes(data.side)) data.viewed.push(data.side);
      if (data.viewed.length === 2) {
        reaction('같은 기계인데 오른쪽에 곱하면 좌우, 왼쪽에 곱하면 상하가 뒤집혀요. 행렬 곱셈은 순서를 바꾸면 결과가 달라요! 숫자 곱셈(2×3 = 3×2)과 다른 점이에요.');
      }
      changed();
    }
    function reveal() {
      get('flipOrderActivity').hidden = false;
      get('flipPredictionFeedback').textContent = data.prediction === 'vertical'
        ? '✓ 맞았어요! 왼쪽에 곱하면 상하가 뒤집혀요.'
        : '예상과 달랐나요? 왼쪽에 곱하면 상하가 뒤집혀요. 두 결과를 비교해 보세요.';
      renderSide();
    }
    get('flipPredictions').querySelectorAll('button').forEach(b => {
      b.onclick = () => {
        data.prediction = b.dataset.answer;
        get('flipPredictions').querySelectorAll('button').forEach(node => node.setAttribute('aria-pressed', String(node === b)));
        reveal();
      };
    });
    button.onclick = () => {
      if (moving) return;
      const cards = [get('flipMovingA'), get('flipMovingJ')];
      const before = cards.map(card => card.getBoundingClientRect());
      moving = true;
      button.disabled = true;
      data.side = data.side === 'right' ? 'left' : 'right';
      renderSide();
      const finish = () => { moving = false; button.disabled = false; changed(); };
      if (reduced()) finish();
      else {
        animations = cards.map((card, i) => {
          const after = card.getBoundingClientRect();
          return card.animate([
            { transform: `translate(${before[i].left - after.left}px,0)`, opacity: .6 },
            { transform: 'translate(0,0)', opacity: 1 }
          ], { duration: 650, easing: 'ease-in-out' });
        });
        api.schedule(finish, 650);
      }
    };
    if (data.prediction) reveal();
  }
  const choiceLabels = { both: 'J × A × J', horizontal: 'A × J', vertical: 'J × A', same: 'A × I' };
  function revealAnswer() {
    get('flipAnswerResult').innerHTML = picture(results[data.choice], choiceLabels[data.choice]);
    get('flipAnswerResult').hidden = false;
    const complete = data.choice === 'both';
    get('flipCelebration').hidden = !complete;
    get('flipQuizIntro').hidden = complete;
    if (complete) {
      get('flipGallery').innerHTML = Object.entries({ same: '원본', horizontal: '좌우', vertical: '상하', both: '180°' })
        .map(([id, name]) => picture(results[id], name)).join('');
      const faceRows = Array.from({ length: 7 }, (_, r) => face.slice(r * 7, r * 7 + 7));
      get('flipBonus').innerHTML = picture(multiply(flip(7), faceRows), '물구나무 드림이 · J₇ × 얼굴');
      get('flipAnswerResult').hidden = true;
    }
  }
  function mountQuiz(api) {
    data.choices.forEach(id => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'mt-button';
      button.textContent = choiceLabels[id];
      button.setAttribute('aria-pressed', String(data.choice === id));
      button.onclick = () => {
        data.choice = id;
        get('flipChoices').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
        const correct = api.answerChoice(id);
        revealAnswer();
        persist();
        if (correct) {
          api.say('양쪽으로 뒤집으면 180도 회전! AI는 이렇게 사진 한 장으로 여러 장을 만들어 공부해요.');
          api.showSpeech();
        }
      };
      get('flipChoices').append(button);
    });
    if (data.choice) revealAnswer();
  }
  const steps = [
    {
      title: '거울 셀카',
      speech: '셀카를 찍으면 좌우가 뒤집히죠? AI도 사진을 뒤집어서 공부해요. 고양이 사진 한 장을 뒤집으면, 고양이 사진이 두 장이 되거든요!',
      html: '<div class="flip-equation flip-intro">' + picture(A, '원본 ㄱ') + '<b>→</b>'
        + '<div class="flip-ghost">' + picture(results.horizontal, '거울에 비친 ㄱ') + '</div></div>'
        + '<p>Lv.3: 밝기 바꾸기 → Lv.4: 위치 바꾸기</p><p>사진을 변형해 학습 데이터를 늘리는 방법을 <strong>데이터 증강</strong>이라고 해요.</p>',
      onMount() { introPart = 0; },
      onDismiss(api) {
        if (introPart++ === 0) {
          api.say('Lv.3에서는 덧셈과 곱하기로 밝기를 바꿨어요. 그럼 그림의 위치는 어떻게 바꿀까요? 바로 행렬 곱셈이에요.');
          api.showSpeech();
        }
      }
    },
    {
      title: '아무것도 안 바꾸는 기계',
      speech: '이 기계는 대각선에만 1이 있어요. 곱해도 그림이 그대로예요. 숫자 1처럼요! 이런 기계를 ‘단위행렬’이라고 해요.',
      html: '<div class="flip-equation">' + picture(A, '그림 A', 'flipIdentityA') + '<b>×</b>'
        + machineCard(I, 'flipIdentityI') + '<b>=</b>' + picture(results.same, '결과 · 칸을 누르세요', 'flipIdentityResult')
        + '</div><p><strong>A × I = A</strong></p><p id="flipFormula" class="flip-formula">결과 칸을 누르면 행과 열의 계산을 볼 수 있어요.</p><p id="flipCount"></p>' + statusHTML,
      onMount: mountIdentity, isComplete: () => data.inspected.length >= 2
    },
    {
      title: '좌우 반전 기계 만들기',
      speech: '기계의 1 위치를 옮겨서 그림을 좌우로 뒤집어 보세요!',
      html: '<div id="flipSources"></div><div class="flip-equation">' + picture(A, '그림 A')
        + '<b>×</b><section class="flip-card"><h4>기계 · 열마다 하나 선택</h4><div id="flipBuilder"></div></section><b>=</b><section class="flip-card"><h4>결과</h4><div id="flipBuiltResult"></div></section></div>'
        + '<div class="flip-builder-footer">' + picture(results.horizontal, '목표 · 좌우 반전')
        + '<div><button type="button" id="flipHint" class="mt-button">힌트 보기</button><p id="flipHintText">가운데 열은 유지하고 양끝 열을 교환해요.</p></div></div>' + statusHTML,
      onMount: mountBuilder, isComplete: machineReady
    },
    {
      title: '순서를 바꾸면?',
      speech: '기계를 그림 왼쪽에 놓고 곱하면 어떻게 될까요? 먼저 예상해 보세요.',
      html: '<p>J × A는 어떻게 될까요?</p><div id="flipPredictions" class="flip-buttons">'
        + ['horizontal', 'vertical', 'same'].map((id, i) => `<button type="button" class="mt-button" data-answer="${id}">${['좌우 반전', '상하 반전', '그대로'][i]}</button>`).join('')
        + '</div><p id="flipPredictionFeedback" role="status"></p><div id="flipOrderActivity" hidden><div id="flipComparison"></div><div id="flipMoveStage" class="flip-equation"></div><p id="flipOrderLabel"></p><button type="button" id="flipSwitch" class="mt-button">기계 위치 바꾸기</button></div>' + statusHTML,
      onMount: mountOrder,
      isComplete: () => !!data.prediction && data.viewed.length === 2 && !moving
    },
    {
      title: 'ㄱ을 ㄴ으로',
      speech: '좌우와 상하를 모두 뒤집으려면 기계를 어디에 놓아야 할까요?',
      html: '<div class="flip-quiz-preview"><div id="flipQuizIntro"><p><strong>ㄱ을 ㄴ으로 바꾸려면 어떻게 곱해야 할까요?</strong></p><div class="flip-equation">'
        + picture(A, '원본 ㄱ') + '<b>→</b>' + picture(results.both, '목표 ㄴ') + '</div></div>'
        + '<div id="flipAnswerResult" hidden></div></div><div id="flipChoices" class="flip-buttons"></div>'
        + '<div id="flipCelebration" hidden><p><strong>사진 1장 → 학습 데이터 4장!</strong></p><div id="flipGallery"></div><div id="flipBonus"></div></div>',
      onMount: mountQuiz, isComplete: () => data.choice === 'both'
    }
  ];
  const root = get('learningDialog');
  const controller = StepLesson.create({
    root, className: 'matrix-tutorial', extraClass: 'matrix-level-four',
    headingId: 'flipStepTitle', title: '그림 뒤집기 기계', description: 'Lv.4 · 행렬 곱셈으로 그림 뒤집기',
    steps, requireAllSteps: true, closeOnComplete: true,
    finishLabel: ({ testing, cost = 0 }) => testing ? '체험 완료 →' : `연구 완료 · ${typeof cost === 'string' ? cost : cost.toLocaleString('ko-KR') + '원'} · 업그레이드`,
    quiz: {
      type: 'choice', step: 4, answer: 'both',
      hints: {
        horizontal: '좌우만 뒤집혀서 ┌이 돼요.',
        vertical: '상하만 뒤집혀서 ┘이 돼요.',
        same: '단위행렬은 아무것도 바꾸지 않아요.'
      },
      success: '양쪽으로 뒤집으면 180도 회전! 행렬 곱셈으로 학습 데이터를 늘렸어요.'
    },
    onStop() { animations.forEach(animation => animation.cancel()); animations = []; moving = false; },
    onStepChange(index) { data.step = index; persist(); }, onClose: persist,
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
    const saved = record.flipLessonV1;
    data = fresh();
    if (saved && typeof saved === 'object') {
      if (Array.isArray(saved.inspected)) data.inspected = [...new Set(saved.inspected.filter(i => Number.isInteger(i) && i >= 0 && i < 9))];
      const m = saved.machine;
      if (Array.isArray(m) && m.length === 3 && m.every(row => Array.isArray(row) && row.length === 3 && row.every(v => v === 0 || v === 1))
        && [0, 1, 2].every(c => m.reduce((sum, row) => sum + row[c], 0) === 1)) data.machine = m.map(row => [...row]);
      if (['horizontal', 'vertical', 'same'].includes(saved.prediction)) data.prediction = saved.prediction;
      if (Array.isArray(saved.viewed) && data.prediction && machineReady()) data.viewed = [...new Set(saved.viewed.filter(v => ['left', 'right'].includes(v)))];
      data.side = saved.side === 'left' ? 'left' : 'right';
      if (data.choices.includes(saved.choice)) data.choice = saved.choice;
      if (Array.isArray(saved.choices) && saved.choices.length === 4 && new Set(saved.choices).size === 4 && saved.choices.every(id => data.choices.includes(id))) data.choices = [...saved.choices];
      const incomplete = steps.findIndex(step => !(step.isComplete?.() ?? true));
      data.step = Math.min(Number.isInteger(saved.step) ? Math.max(0, saved.step) : 0, incomplete < 0 ? 4 : incomplete);
    }
    controller.start({ ...options, step: data.step, verified: data.choice === 'both' });
  }
  window.MatrixLessonFour = { start };
})();
