/* Matrix Lv.3 content. Upgrade payments stay in the game completion callback. */
(() => {
  'use strict';
  const get = id => document.getElementById(id);
  const { face: original, dark, grid, clip } = MatrixImage;
  const choices = [
    { id: 'restore', label: '2.5A', values: dark.map(v => v * 2.5) },
    { id: 'add', label: 'A + 153', values: dark.map(v => v + 153) },
    { id: 'double', label: '2A', values: dark.map(v => v * 2) },
    { id: 'invert', label: 'B − A', values: dark.map(v => 255 - v) }
  ];
  let data, record, storageKey;
  function shuffledIds() {
    const ids = choices.map(choice => choice.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    return ids;
  }
  const fresh = () => ({ step: 0, numbers: false, amount: 0, factor: 1,
    sawClip: false, sawScale: false, prediction: '', predicted: false,
    inverted: false, choice: null, order: shuffledIds() });
  function persist() {
    if (!data || !storageKey) return;
    record.imageLessonV3 = data;
    try { localStorage.setItem(storageKey, JSON.stringify(record)); } catch { /* Storage is optional. */ }
  }
  function changed() { persist(); controller.refresh(); }
  function image(host, values, numbers = false) {
    const target = get(host);
    target.innerHTML = grid(values.map(clip), 7, numbers);
    let count = 0;
    target.querySelectorAll('span').forEach((cell, i) => {
      if (values[i] < 0 || values[i] > 255) {
        count++;
        cell.classList.add('im-clipped');
        cell.setAttribute('aria-label', `${Math.floor(i / 7) + 1}행 ${i % 7 + 1}열: ${values[i]}에서 ${clip(values[i])}로 잘림`);
      }
    });
    return count;
  }
  const picture = (id, label) => `<figure><figcaption>${label}</figcaption><div id="${id}"></div></figure>`;
  const status = () => '<p id="imStatus" role="status"></p>';
  const difference = '<div class="im-difference"><strong>눈 − 화면의 밝기 차이</strong>'
    + '<div><span>잘리기 전</span><meter id="imRawBar" min="0" max="306"></meter><output id="imRawValue"></output></div>'
    + '<div><span>실제 그림</span><meter id="imShownBar" min="0" max="306"></meter><output id="imShownValue"></output></div></div>';
  function updateDifference(raw) {
    const before = Math.max(...raw) - Math.min(...raw);
    const after = Math.max(...raw.map(clip)) - Math.min(...raw.map(clip));
    get('imRawBar').value = before;
    get('imShownBar').value = after;
    get('imRawValue').textContent = before;
    get('imShownValue').textContent = after;
  }
  function mountArrival() {
    image('imArrival', dark, data.numbers);
    image('imMatrix', dark, true);
    const button = get('imToggle');
    button.setAttribute('aria-pressed', String(data.numbers));
    button.onclick = () => {
      data.numbers = !data.numbers;
      button.setAttribute('aria-pressed', String(data.numbers));
      image('imArrival', dark, data.numbers);
      persist();
    };
  }
  function mountOperation(api, addition) {
    image('imA', dark, true);
    const slider = get('imSlider');
    slider.value = addition ? data.amount : data.factor;
    function draw(interacted) {
      const value = Number(slider.value);
      const raw = dark.map(v => addition ? v + value : v * value);
      if (addition) {
        data.amount = value;
        image('imB', Array(49).fill(value), true);
      } else data.factor = value;
      get('imValue').textContent = value;
      const count = image('imResult', raw, true);
      updateDifference(raw);
      get('imStatus').textContent = count
        ? `${count}칸이 255로 잘렸어요. 점선 테두리를 보세요.${addition && value >= 190 ? ' 눈과 틀이 모두 흰색이 됐어요.' : ''}`
        : addition ? '모든 칸에 같은 수를 더하면 잘리기 전 밝기 차이는 102로 같아요.'
          : value === 2.5 ? '✓ 원본과 같아졌어요. 검정 0은 그대로, 가장 밝은 칸은 255예요.'
            : `검정 0 × ${value} = 0 · 가장 밝은 칸 102 × ${value} = ${102 * value}`;
      if (!interacted) return;
      const firstPass = addition ? !data.sawClip && value >= 160 : !data.sawScale && value >= 2;
      if (addition && value >= 160) data.sawClip = true;
      if (!addition && value >= 2) data.sawScale = true;
      changed();
      if (firstPass) {
        api.say(addition
          ? '255를 넘은 칸은 더 밝아질 수 없어서 255로 잘려요. 검정 화면도 회색이 됐어요. 잘리기 전 차이는 102로 같지만, 잘린 뒤에는 줄어들어요.'
          : '곱하기는 0을 그대로 두고 밝은 칸만 더 밝게 해요. 그래서 차이가 커져요.');
        api.showSpeech();
      }
    }
    slider.oninput = () => draw(true);
    draw(false);
  }
  function mountInvert() {
    image('imOriginal', original, true);
    const input = get('imPrediction');
    const invert = get('imInvert');
    input.value = data.prediction;
    invert.disabled = !data.predicted;
    function reveal() {
      image('imInverted', original.map(v => 255 - v), true);
      get('imStatus').textContent = '✓ 입: 255 − 85 = 170 · 밝은 곳과 어두운 곳이 뒤집혔어요.';
    }
    if (data.inverted) reveal();
    function check() {
      data.prediction = input.value.trim();
      data.predicted = data.prediction !== '' && Number(data.prediction) === 170;
      input.setAttribute('aria-invalid', String(!data.predicted));
      invert.disabled = !data.predicted;
      get('imStatus').textContent = data.predicted ? '맞았어요! 반전하기를 눌러 결과를 확인해 보세요.' : '255에서 85를 빼 보세요.';
      changed();
    }
    input.oninput = () => {
      data.prediction = input.value;
      data.predicted = false;
      data.inverted = false;
      invert.disabled = true;
      get('imInverted').textContent = '?';
      changed();
    };
    input.onkeydown = event => {
      if (event.key === 'Enter') { event.preventDefault(); event.stopPropagation(); check(); }
    };
    get('imCheck').onclick = check;
    invert.onclick = () => {
      if (!data.predicted) return;
      data.inverted = true;
      reveal();
      changed();
    };
  }
  function mountQuiz(api) {
    image('imQuizOriginal', original);
    data.order.forEach(id => {
      const choice = choices.find(item => item.id === id);
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', choice.label);
      button.setAttribute('aria-pressed', String(data.choice === id));
      button.innerHTML = `<strong>${choice.label}</strong>` + grid(choice.values.map(clip), 7);
      button.onclick = () => {
        data.choice = id;
        get('imChoices').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
        const correct = api.answerChoice(id);
        persist();
        if (correct) {
          api.say('곱하기로 0은 그대로 두고 나머지만 원래 밝기로 돌려놨어요. 고마워요!');
          api.showSpeech();
        }
      };
      get('imChoices').append(button);
    });
  }
  const steps = [
    {
      title: '어두운 사진 도착',
      speech: 'Lv.2에서 그린 제 얼굴이 공장 카메라에서 너무 어둡게 찍혔어요! 숫자를 보니 가장 밝은 칸도 102밖에 안 돼요.',
      html: '<div class="im-equation im-arrival">' + picture('imArrival', '어두운 사진 A')
        + picture('imMatrix', 'A의 숫자 행렬') + '</div>'
        + '<button id="imToggle" type="button" class="mt-button">숫자 보기</button>',
      onMount: mountArrival
    },
    {
      title: '모든 칸에 더하기 · A + B',
      speech: '행렬 덧셈은 같은 자리 숫자끼리 더해요. 모든 칸에 같은 값을 더하면 사진 전체가 밝아져요.',
      html: '<div class="im-equation">' + picture('imA', 'A') + '<b>+</b>' + picture('imB', 'B · 모든 칸이 c')
        + '<b>=</b>' + picture('imResult', '결과') + '</div>'
        + '<label class="im-slider">더할 수 c <input id="imSlider" type="range" min="0" max="200" step="10"><output id="imValue"></output></label>'
        + difference + status(),
      onMount: api => mountOperation(api, true),
      isComplete: () => data.sawClip,
      pendingText: 'c를 160 이상으로 올려 잘린 칸을 찾아보세요'
    },
    {
      title: '모든 칸에 곱하기 · kA',
      speech: '실수배는 모든 칸에 같은 수를 곱해요.',
      html: '<div class="im-equation">' + picture('imA', 'A') + '<b>× k =</b>' + picture('imResult', '결과') + '</div>'
        + '<label class="im-slider">곱할 수 k <input id="imSlider" type="range" min="1" max="3" step="0.5"><output id="imValue"></output></label>'
        + difference + status(),
      onMount: api => mountOperation(api, false),
      isComplete: () => data.sawScale,
      pendingText: 'k를 2 이상으로 올려 밝기 차이를 비교해 보세요'
    },
    {
      title: '반전 사진 · B − O',
      speech: '필름 사진처럼 밝은 곳은 어둡게, 어두운 곳은 밝게! 행렬 뺄셈으로 만들 수 있어요.',
      html: '<p>B는 모든 칸이 255인 행렬이에요. 이번에는 원본 O를 빼요.</p>'
        + '<div class="im-equation">' + picture('imOriginal', '원본 O') + '<b>→</b>' + picture('imInverted', '255 − O') + '</div>'
        + '<label class="im-prediction">원래 85였던 입은 반전하면 몇이 될까요? <input id="imPrediction" inputmode="numeric" autocomplete="off" aria-label="반전한 입의 밝기"></label>'
        + '<div class="im-actions"><button type="button" id="imCheck" class="mt-button">예측 확인</button><button type="button" id="imInvert" class="mt-button" disabled>반전하기</button></div>' + status(),
      onMount: mountInvert,
      isComplete: () => data.predicted && data.inverted,
      pendingText: '예측을 맞히고 반전 결과를 확인해 보세요'
    },
    {
      title: '복원 미션',
      speech: '원래 사진과 똑같이 되살린 결과를 고르세요.',
      html: '<div class="im-quiz-original">' + picture('imQuizOriginal', '원본 O')
        + '<p>A는 어두운 사진,<br>B는 모든 칸이 255인 행렬이에요.</p></div><div id="imChoices"></div>',
      onMount: mountQuiz, isComplete: () => data.choice === 'restore'
    }
  ];
  const root = get('learningDialog');
  const controller = StepLesson.create({
    root, className: 'matrix-tutorial', extraClass: 'matrix-level-three',
    headingId: 'imStepTitle', title: '어두운 사진을 되살려라',
    description: 'Lv.3 · 행렬 연산으로 이미지 값 변경', steps,
    requireAllSteps: true, closeOnComplete: true,
    finishLabel: ({ testing, cost = 0 }) => testing ? '체험 완료 →' : `연구 완료 · ${cost.toLocaleString('ko-KR')}원으로 업그레이드`,
    quiz: {
      type: 'choice', step: 4, answer: 'restore',
      hints: {
        add: '더하기는 검정(0)까지 밝게 만들어서 화면이 회색이 돼요.',
        double: '조금 모자라요. 가장 밝은 칸이 204예요.',
        invert: '이건 밝기를 뒤집는 계산이에요.'
      },
      success: '정답이에요! 2.5A는 원본 O와 모든 칸이 같아요.'
    },
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
    storageKey = `ai-matrix-lab-v1-${options.test ? 'test' : 'play'}-3`;
    try { record = JSON.parse(localStorage.getItem(storageKey)) || {}; } catch { record = {}; }
    if (typeof record !== 'object' || Array.isArray(record)) record = {};
    const saved = record.imageLessonV3;
    data = fresh();
    if (saved && typeof saved === 'object') {
      for (const key of ['numbers', 'sawClip', 'sawScale']) data[key] = saved[key] === true;
      if (Number.isInteger(saved.amount) && saved.amount >= 0 && saved.amount <= 200 && saved.amount % 10 === 0) data.amount = saved.amount;
      if ([1, 1.5, 2, 2.5, 3].includes(saved.factor)) data.factor = saved.factor;
      data.prediction = typeof saved.prediction === 'string' ? saved.prediction.slice(0, 20) : '';
      data.predicted = saved.predicted === true && data.prediction.trim() !== '' && Number(data.prediction) === 170;
      data.inverted = data.predicted && saved.inverted === true;
      if (choices.some(choice => choice.id === saved.choice)) data.choice = saved.choice;
      if (Array.isArray(saved.order) && saved.order.length === 4 && new Set(saved.order).size === 4
          && saved.order.every(id => choices.some(choice => choice.id === id))) data.order = saved.order;
      const firstIncomplete = steps.findIndex(step => step.isComplete && !step.isComplete());
      data.step = Math.min(Number.isInteger(saved.step) ? Math.max(0, saved.step) : 0, firstIncomplete < 0 ? 4 : firstIncomplete);
    }
    controller.start({ ...options, step: data.step, verified: data.choice === 'restore' });
  }
  window.MatrixLessonThree = { start };
})();
