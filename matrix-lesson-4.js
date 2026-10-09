/* Pattern classifier: lesson content and activity state, no game-state mutations. */
(() => {
  'use strict';
  const get = id => document.getElementById(id);
  const { patterns, order, grid, weightMap, format, dot } = MatrixImage;
  const names = { left: '왼쪽 세로선', right: '오른쪽 세로선', top: '위쪽 가로선', white: '전부 흰색' };
  const initialWeights = [2, -1, 2, -1];
  const finalWeights = [3, -1, 3, -1];
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const picture = id => grid(patterns[id].map(v => v * 255), 2);
  let data, record, storageKey, busy = false, folded = false;
  function shuffled() {
    const ids = Object.keys(patterns);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    return ids;
  }
  const fresh = () => ({ step: 0, filled: 0, flattened: false, score: '', scoreCorrect: false,
    pattern: null, weights: [0, 0, 0, 0], hint: 0, choice: null, revealed: false, order: shuffled() });
  function persist() {
    if (!data || !storageKey) return;
    record.imageLessonV4 = data;
    try { localStorage.setItem(storageKey, JSON.stringify(record)); } catch { /* Optional storage. */ }
  }
  function changed() { persist(); controller.refresh(); }
  function status(text) { get('wlStatus').textContent = text; }
  const statusHTML = '<p id="wlStatus" role="status"></p>';
  function row(values, className = '') {
    return `<div class="wl-row ${className}">` + values.map((v, i) => `<span data-pair="${i}">${format(v)}</span>`).join('') + '</div>';
  }
  function mountFlatten(api) {
    busy = false;
    const host = get('wlPixels');
    patterns.left.forEach((v, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = v * 255;
      button.style.background = v ? '#fff' : '#121b21';
      button.style.color = v ? '#20382a' : '#fff';
      button.setAttribute('aria-label', `${order[i]} 값 ${v * 255}`);
      button.disabled = i < data.filled;
      button.onclick = () => {
        if (busy) return;
        if (i !== data.filled) { status('책 읽듯이 왼쪽 위부터 한 줄씩 읽어요.'); return; }
        busy = true;
        const target = get('wlFlat').children[i];
        const finish = () => {
          button.disabled = true;
          target.textContent = v * 255;
          data.filled++;
          busy = false;
          if (data.filled === 4) normalize();
          else { status(`${data.filled} / 4칸 · 다음 칸을 눌러 주세요.`); changed(); }
        };
        if (reduced()) { finish(); return; }
        const from = button.getBoundingClientRect(), to = target.getBoundingClientRect();
        button.animate([
          { transform: 'translate(0, 0)', zIndex: 2 },
          { transform: `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(${to.width / from.width})`, zIndex: 2 }
        ], { duration: 420, easing: 'ease-in-out' });
        api.schedule(finish, 420);
      };
      host.append(button);
    });
    function normalize() {
      busy = true;
      status('[255, 0, 255, 0] → [1, 0, 1, 0]');
      const finish = () => {
        [...get('wlFlat').children].forEach((cell, i) => { cell.textContent = patterns.left[i]; });
        get('wlFlat').classList.add('wl-normalized');
        get('wlHandwriting').hidden = false;
        data.flattened = true;
        busy = false;
        changed();
        api.say('계산을 쉽게 하려고 0~255를 0~1로 바꿨어요. 255는 1, 0은 0이에요.');
        api.showSpeech();
      };
      if (reduced()) finish();
      else api.schedule(finish, 550);
    }
    [...get('wlFlat').children].forEach((cell, i) => {
      cell.textContent = i < data.filled ? patterns.left[i] * (data.flattened ? 1 : 255) : '?';
    });
    get('wlHandwriting').hidden = !data.flattened;
    // A closed animation resumes from the last fully committed cell.
    if (data.filled === 4 && !data.flattened) { data.filled = 0; mountReset(); }
    function mountReset() {
      host.querySelectorAll('button').forEach(button => { button.disabled = false; });
      [...get('wlFlat').children].forEach(cell => { cell.textContent = '?'; });
    }
  }
  function mountProduct() {
    const input = get('wlScore');
    input.value = data.score;
    get('wlDimensions').hidden = !data.scoreCorrect;
    function check() {
      data.score = input.value.trim().replaceAll('−', '-');
      data.scoreCorrect = data.score !== '' && Number(data.score) === 4;
      input.setAttribute('aria-invalid', String(!data.scoreCorrect));
      get('wlDimensions').hidden = !data.scoreCorrect;
      status(data.scoreCorrect ? '✓ 1×2 + 0×(−1) + 1×2 + 0×(−1) = 4'
        : '0을 곱한 칸은 0이 돼요. 1을 곱한 칸만 더해 보세요.');
      changed();
    }
    input.oninput = () => {
      data.score = input.value;
      data.scoreCorrect = false;
      get('wlDimensions').hidden = true;
      changed();
    };
    input.onkeydown = event => {
      if (event.key === 'Enter') { event.preventDefault(); event.stopPropagation(); check(); }
    };
    get('wlCheck').onclick = check;
  }
  function mountFold() {
    folded = false;
    get('wlFoldMap').innerHTML = weightMap(initialWeights);
    ['left', 'top', 'right'].forEach(id => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', names[id]);
      button.setAttribute('aria-pressed', String(data.pattern === id));
      button.innerHTML = picture(id) + `<span>${names[id]}</span>`;
      button.onclick = () => {
        data.pattern = id;
        get('wlPatternChoices').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
        status(id === 'left' ? '✓ 왼쪽 세로선의 점수가 가장 높아요.' : '파란 칸(양수)에 흰색이 많을수록 점수가 올라가요.');
        changed();
      };
      get('wlPatternChoices').append(button);
    });
  }
  function fold(api) {
    if (folded) return;
    const map = get('wlFoldMap').firstElementChild;
    const cells = [...map.children];
    const before = cells.map(cell => cell.getBoundingClientRect());
    map.classList.add('wl-folded');
    if (!reduced()) cells.forEach((cell, i) => {
      const after = cell.getBoundingClientRect();
      cell.animate([{ transform: `translate(${before[i].left - after.left}px, ${before[i].top - after.top}px)` },
        { transform: 'translate(0, 0)' }], { duration: 650, easing: 'ease-in-out' });
    });
    folded = true;
    api.refresh();
  }
  function readyWeights() { return dot(patterns.left, data.weights) > 0 && dot(patterns.top, data.weights) < 0; }
  function mountTuning(api) {
    let wasReady = readyWeights();
    function refresh() {
      get('wlLiveMap').innerHTML = weightMap(data.weights);
      for (const id of ['left', 'top']) {
        const score = dot(patterns[id], data.weights);
        get(`wl${id}Score`).textContent = `${format(score)} → ${score > 0 ? '세로선' : score < 0 ? '가로선' : '보류'}`;
        get(`wl${id}Formula`).textContent = patterns[id].map((v, i) => `${v}×(${format(data.weights[i])})`).join(' + ') + ` = ${format(score)}`;
      }
      const ready = readyWeights();
      status(ready ? '✓ 두 무늬를 구분했어요!' : '양수 = 세로선 · 음수 = 가로선 · 0 = 보류');
      changed();
      if (ready && !wasReady) {
        api.say('두 무늬를 구분했어요! 가중치를 바꾸니 판단이 바뀌었죠?');
        api.showSpeech();
      }
      wasReady = ready;
    }
    data.weights.forEach((v, i) => {
      const label = document.createElement('label');
      label.innerHTML = `${order[i]} <output>${format(v)}</output><input type="range" min="-3" max="3" step="1" value="${v}" aria-label="${order[i]} 가중치">`;
      label.querySelector('input').oninput = event => {
        data.weights[i] = Number(event.target.value);
        label.querySelector('output').textContent = format(data.weights[i]);
        refresh();
      };
      get('wlSliders').append(label);
    });
    for (const id of ['left', 'top']) get(`wl${id}Image`).innerHTML = picture(id);
    get('wlHint').onclick = () => {
      data.hint = Math.min(2, data.hint + 1);
      get('wlHintText').textContent = data.hint === 1 ? '세로선에만 흰색인 칸은 어디일까요?' : '왼쪽 아래는 양수, 오른쪽 위는 음수로 바꿔 보세요.';
      persist();
    };
    refresh();
  }
  function mountQuiz(api) {
    get('wlQuizMap').innerHTML = weightMap(finalWeights);
    data.order.forEach(id => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.pattern = id;
      button.setAttribute('aria-label', names[id]);
      button.setAttribute('aria-pressed', String(data.choice === id));
      button.innerHTML = picture(id) + `<span>${names[id]}</span><strong class="wl-revealed" ${data.revealed ? '' : 'hidden'}>점수 ${format(dot(patterns[id], finalWeights))}</strong>`;
      button.onclick = () => {
        data.choice = id;
        get('wlQuizChoices').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
        if (api.answerChoice(id)) {
          data.revealed = true;
          get('wlQuizChoices').querySelectorAll('.wl-revealed').forEach(node => { node.hidden = false; });
          api.say('지금은 여러분이 가중치를 맞췄지만, 컴퓨터가 스스로 가중치를 찾아가는 게 바로 ‘학습’이에요. 경사하강법 공장에서 만나요!');
          api.showSpeech();
        }
        persist();
      };
      get('wlQuizChoices').append(button);
    });
  }
  const pairColors = ['#1975bd', '#c04b36', '#268557', '#8b58a8'];
  const pairLines = pairColors.map((color, i) => `<path d="M ${42 + i * 42} 64 C ${42 + i * 42} ${108 + i * 12}, 240 ${52 + i * 34}, 274 ${52 + i * 34}" stroke="${color}" stroke-dasharray="${i ? `${i * 3} 3` : 'none'}"/>`).join('');
  const steps = [
    {
      title: '한 줄로 펼치기',
      speech: '신경망은 그림을 한 줄로 펼친 숫자로 받아요. 같이 펼쳐 볼까요?',
      html: '<div class="wl-flatten"><div id="wlPixels" aria-label="펼칠 2행 2열 이미지"></div><b>→</b><div id="wlFlat" class="wl-row"><span>?</span><span>?</span><span>?</span><span>?</span></div></div>'
        + '<p>왼쪽 위부터 한 줄씩, 네 칸을 차례로 눌러 주세요.</p>'
        + '<div id="wlHandwriting" hidden><svg width="44" height="44" viewBox="0 0 28 28" role="img" aria-label="28행 28열 손글씨 사진 예시"><defs><pattern id="wlMiniGrid" width="1" height="1" patternUnits="userSpaceOnUse"><path d="M1 0H0V1" fill="none" stroke="#c9d2c4" stroke-width=".1"/></pattern></defs><rect width="28" height="28" fill="url(#wlMiniGrid)"/><path d="M6 6H22L12 23" fill="none" stroke="#344c39" stroke-width="3"/></svg><span>28×28 손글씨 사진 = 숫자 784개를 한 줄로!</span></div>' + statusHTML,
      onMount: mountFlatten, isComplete: () => data.flattened && !busy,
      pendingText: '네 칸을 순서대로 펼쳐 주세요'
    },
    {
      title: '곱하고 더하기 · 행 × 열',
      speech: 'Lv.1에서 본 [2, 3] · [x, y] = 2x + 3y 기억나요? 그게 바로 행렬 곱셈이에요. 행과 열을 짝지어 곱하고 모두 더해요.',
      html: '<div class="wl-product"><svg viewBox="0 0 360 200" aria-hidden="true">' + pairLines + '</svg>'
        + row(patterns.left, 'wl-input-row') + '<b class="wl-times">×</b>' + row(initialWeights, 'wl-weight-column') + '<b class="wl-equals">= ?</b></div>'
        + '<p class="wl-formula">1×2 + 0×(−1) + 1×2 + 0×(−1) = ?</p>'
        + '<div class="wl-answer"><label>점수 <input id="wlScore" inputmode="text" aria-label="계산한 점수" autocomplete="off"></label><button id="wlCheck" type="button" class="mt-button">점수 확인</button></div>'
        + '<p id="wlDimensions" hidden>1×4 행렬 × 4×1 행렬 = 1×1 (숫자 하나)</p>' + statusHTML,
      onMount: mountProduct, isComplete: () => data.scoreCorrect
    },
    {
      title: '가중치도 그림이다',
      speech: '가중치 지도를 보면 판별기가 어디를 중요하게 보는지 알 수 있어요. 파랑은 ‘여기가 밝으면 좋아’, 빨강은 ‘여기가 밝으면 싫어’예요.',
      html: '<div id="wlFoldMap"></div><p>양수는 파랑 · 음수는 빨강 · 0은 회색</p><p>이 판별기는 어떤 무늬에 가장 높은 점수를 줄까요?</p><div id="wlPatternChoices" class="wl-choices"></div>' + statusHTML,
      onMount: mountFold, onDismiss: fold, isComplete: () => data.pattern === 'left' && folded
    },
    {
      title: '판별기 조정',
      speech: '가중치를 바꿔서 왼쪽 세로선에는 양수, 위쪽 가로선에는 음수 점수를 주는 판별기를 만들어 보세요.',
      html: '<div class="wl-tuning"><div id="wlSliders"></div><div id="wlLiveMap"></div></div><div class="wl-tests">'
        + ['left', 'top'].map(id => `<section><div id="wl${id}Image"></div><div><strong>${names[id]}</strong><p id="wl${id}Score"></p><p id="wl${id}Formula" class="wl-formula"></p></div></section>`).join('')
        + '</div><div class="wl-hints"><button id="wlHint" type="button" class="mt-button">힌트 보기</button><span id="wlHintText"></span></div>' + statusHTML,
      onMount: mountTuning, isComplete: readyWeights
    },
    {
      title: '점수 예측',
      speech: '이 가중치 지도에서는 어떤 그림의 점수가 가장 높을까요? 흰 칸의 개수뿐 아니라 위치도 살펴보세요.',
      html: '<div class="wl-quiz-heading"><div id="wlQuizMap"></div><p>점수가 가장 높은 그림은?<br>양수는 파랑 · 음수는 빨강</p></div><div id="wlQuizChoices" class="wl-choices"></div>',
      onMount: mountQuiz, isComplete: () => data.choice === 'left'
    }
  ];
  const root = get('learningDialog');
  const controller = StepLesson.create({
    root, className: 'matrix-tutorial', extraClass: 'matrix-level-four',
    headingId: 'wlStepTitle', title: '드림이의 무늬 판별기',
    description: 'Lv.4 · 신경망의 입력과 가중치 계산', steps,
    requireAllSteps: true, closeOnComplete: true,
    finishLabel: ({ testing, cost = 0 }) => testing ? '체험 완료 →' : `연구 완료 · ${cost.toLocaleString('ko-KR')}원으로 업그레이드`,
    quiz: {
      type: 'choice', step: 4, answer: 'left',
      hints: {
        white: '흰 칸이 많다고 점수가 높은 건 아니에요. 빨간 칸(음수)이 점수를 깎아요.',
        top: '오른쪽 위 칸은 −1이라 점수가 줄어요.',
        right: '같은 세로선이어도 위치가 다르면 점수가 달라요.'
      },
      success: '정답이에요! 네 그림의 점수를 비교해 보세요.'
    },
    onStop() { busy = false; },
    onStepChange(index) { data.step = index; persist(); }, onClose: persist,
    elements: {
      card: root.querySelector('.card'), top: root.querySelector('.dialog-top'),
      title: get('learningTitle'), description: get('learningDescription'),
      question: get('learningQuestion'), guide: get('mtGuide'), speech: get('mtSpeech'),
      form: get('learningForm'), feedback: get('learningFeedback'),
      submit: get('learningForm').querySelector('button'), legacyLabel: get('learningForm').querySelector('label'),
      legacyAnswer: get('learningAnswer'), navigation: get('mtNav'), tabs: get('mtTestLevels'),
      previous: get('mtPrev'), replay: get('mtReplay'), tapHint: get('mtTapHint')
    }
  });
  function start(options = {}) {
    storageKey = `ai-matrix-lab-v1-${options.test ? 'test' : 'play'}-4`;
    try { record = JSON.parse(localStorage.getItem(storageKey)) || {}; } catch { record = {}; }
    if (!record || typeof record !== 'object' || Array.isArray(record)) record = {};
    const saved = record.imageLessonV4;
    data = fresh();
    folded = true;
    if (saved && typeof saved === 'object') {
      data.filled = Number.isInteger(saved.filled) && saved.filled >= 0 && saved.filled <= 4 ? saved.filled : 0;
      data.flattened = saved.flattened === true && data.filled === 4;
      if (data.filled === 4 && !data.flattened) data.filled = 0;
      data.score = typeof saved.score === 'string' ? saved.score.slice(0, 20) : '';
      data.scoreCorrect = saved.scoreCorrect === true && data.score.trim() !== '' && Number(data.score.replaceAll('−', '-')) === 4;
      data.pattern = ['left', 'top', 'right'].includes(saved.pattern) ? saved.pattern : null;
      if (Array.isArray(saved.weights) && saved.weights.length === 4 && saved.weights.every(v => Number.isInteger(v) && v >= -3 && v <= 3)) data.weights = [...saved.weights];
      data.hint = [0, 1, 2].includes(saved.hint) ? saved.hint : 0;
      if (Object.hasOwn(patterns, saved.choice)) data.choice = saved.choice;
      data.revealed = saved.revealed === true;
      if (Array.isArray(saved.order) && saved.order.length === 4 && new Set(saved.order).size === 4 && saved.order.every(id => Object.hasOwn(patterns, id))) data.order = [...saved.order];
      const incomplete = steps.findIndex(step => !step.isComplete());
      data.step = Math.min(Number.isInteger(saved.step) ? Math.max(0, saved.step) : 0, incomplete < 0 ? 4 : incomplete);
    }
    controller.start({ ...options, step: data.step, verified: data.choice === 'left' });
  }
  window.MatrixLessonFour = { start };
})();
