/* Matrix Lv.2: content, pixel activities, and backward-compatible progress. */
(() => {
  'use strict';
  const get = id => document.getElementById(id);
  const { face, grid } = MatrixImage;
  const shades = [0, 85, 170, 255];
  const edge = i => i < 7 || i >= 42 || i % 7 === 0 || i % 7 === 6;
  const correct = Array.from({ length: 25 }, (_, i) => i === 12 ? 128
    : Math.floor(i / 5) + i % 5 === 4 ? 255 : 0);
  const choices = [correct, correct.map(v => v === 128 ? v : 255 - v),
    correct.map((_, i) => i === 12 ? 128 : Math.floor(i / 5) === i % 5 ? 255 : 0),
    correct.map(v => v === 128 ? 255 : v)];
  let record = {}, data, storageKey;
  const fresh = () => ({ step: 0, zoomDone: false, address: 0, brightness: 0,
    touched: false, paint: face.map((v, i) => edge(i) ? v : 255),
    brush: 0, paintChecked: false, choice: null });

  function persist() {
    if (!data || !storageKey) return;
    record.imageLessonV2 = data;
    try { localStorage.setItem(storageKey, JSON.stringify(record)); } catch { /* Optional storage. */ }
  }
  function changed() { persist(); controller.refresh(); }
  function status(message) { get('pxStatus').textContent = message; }
  function mountZoom(api) {
    get('pxZoomImage').innerHTML = grid(face, 7, true);
    MatrixControls.bindZoom({
      image: get('pxZoomImage'), button: get('pxZoom'), complete: data.zoomDone,
      controller: api,
      onComplete() {
        data.zoomDone = true;
        changed();
        status('칸 하나마다 밝기를 나타내는 숫자가 있어요.');
      }
    });
  }

  function mountAddress() {
    const host = get('pxAddress');
    host.innerHTML = '<span></span>' + Array.from({ length: 6 }, (_, i) => `<b>${i + 1}</b>`).join('');
    for (let r = 1; r <= 6; r++) {
      host.insertAdjacentHTML('beforeend', `<b>${r}</b>`);
      for (let c = 1; c <= 6; c++) {
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('aria-label', `${r}행 ${c}열`);
        button.onclick = () => {
          if (data.address === 2) return;
          const target = data.address === 0 ? [2, 5] : [5, 2];
          if (r !== target[0] || c !== target[1]) {
            status('행은 가로줄이에요. 위에서부터 세어요.');
            return;
          }
          button.textContent = '✓';
          data.address++;
          prompt();
          status(data.address === 2 ? '두 위치를 모두 찾았어요!' : '맞았어요. 이번에는 행과 열을 바꿔 볼까요?');
          changed();
        };
        host.append(button);
      }
    }
    function prompt() {
      get('pxAddressTask').textContent = ['① 2행 5열 칸을 눌러 보세요', '② 5행 2열 칸을 눌러 보세요', '✓ 두 문제 완료'][data.address];
    }
    prompt();
  }
  function mountBrightness() {
    get('pxSwatches').innerHTML = shades.map(v => `<div>${grid([v], 1)}<span>${v}</span></div>`).join('');
    const slider = get('pxBrightness');
    slider.value = data.brightness;
    function draw() {
      const v = data.brightness;
      get('pxSample').style.background = `rgb(${v},${v},${v})`;
      get('pxValue').textContent = v;
      status(data.touched && v >= 118 && v <= 138 ? '✓ 128에 가까운 회색을 만들었어요.' : '슬라이더를 움직여 128에 가까운 회색을 만들어 보세요.');
    }
    slider.oninput = () => { data.brightness = Number(slider.value); data.touched = true; draw(); changed(); };
    draw();
  }
  function mountPaint(api) {
    get('pxReference').innerHTML = grid(face, 7);
    get('pxNumbers').innerHTML = grid(data.paint, 7, true);
    const board = get('pxPaint');
    let showErrors = false;
    const cells = [], numbers = get('pxNumbers').querySelectorAll('span');
    const mismatch = () => data.paint.reduce((n, v, i) => n + (v !== face[i]), 0);
    function updateCell(i) {
      const v = data.paint[i];
      cells[i].style.background = `rgb(${v},${v},${v})`;
      cells[i].setAttribute('aria-label', `${Math.floor(i / 7) + 1}행 ${i % 7 + 1}열 밝기 ${v}${edge(i) ? ' 고정' : ''}`);
      cells[i].classList.toggle('px-wrong', showErrors && v !== face[i]);
      numbers[i].textContent = v;
      numbers[i].style.background = `rgb(${v},${v},${v})`;
      numbers[i].style.color = v < 140 ? '#fff' : '#182730';
    }
    function paint(i) {
      if (edge(i)) return;
      data.paint[i] = data.brush;
      data.paintChecked = false;
      updateCell(i);
      status('그림과 숫자가 함께 바뀌어요. 다 그렸으면 확인해 주세요.');
      changed();
    }
    data.paint.forEach((_, i) => {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.dataset.pixel = i;
      cell.disabled = edge(i);
      cells.push(cell);
      board.append(cell);
      updateCell(i);
    });
    MatrixPaint.bind(board, { size: 7, paint });
    shades.forEach(v => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = v;
      button.style.setProperty('--shade', `rgb(${v},${v},${v})`);
      button.setAttribute('aria-label', `밝기 ${v} 붓`);
      button.setAttribute('aria-pressed', String(data.brush === v));
      button.onclick = () => {
        data.brush = v;
        get('pxBrushes').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
        persist();
      };
      get('pxBrushes').append(button);
    });
    get('pxCheck').onclick = () => {
      const count = mismatch();
      data.paintChecked = count === 0;
      get('pxReveal').disabled = count === 0;
      status(count ? `${count}칸이 달라요. 그림을 다시 살펴보세요.` : '✓ 49개의 숫자로 그림 한 장을 저장했어요.');
      changed();
      if (!count) { api.say('방금 49개의 숫자로 그림 한 장을 저장했어요.'); api.showSpeech(); }
    };
    get('pxReveal').onclick = () => { showErrors = true; cells.forEach((_, i) => updateCell(i)); };
  }
  function mountQuiz(api) {
    get('pxQuizMatrix').innerHTML = grid(correct, 5, true);
    choices.forEach((values, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', `보기 ${i + 1}`);
      button.innerHTML = `<b>${i + 1}</b>` + grid(values, 5);
      button.setAttribute('aria-pressed', String(data.choice === i));
      button.onclick = () => {
        data.choice = i;
        get('pxChoices').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
        api.answerChoice(i);
        persist();
      };
      get('pxChoices').append(button);
    });
  }
  const steps = [
    { title: '확대해 보기', speech: '컴퓨터 눈에는 그림이 아니라 숫자 격자만 보여요. 칸 하나를 픽셀이라고 불러요.',
      html: '<div class="px-zoom"><div id="pxZoomImage"></div></div><button type="button" id="pxZoom" class="mt-button">확대</button><p id="pxStatus" role="status"></p>',
      onMount: mountZoom, isComplete: () => data.zoomDone },
    { title: '픽셀의 주소', speech: 'Lv.1에서 본 행과 열이 그림에서는 픽셀의 위치가 돼요.',
      html: '<p id="pxAddressTask"></p><div id="pxAddress" aria-label="6행 6열 픽셀 격자"></div><p id="pxStatus" role="status"></p>',
      onMount: mountAddress, isComplete: () => data.address === 2 },
    { title: '숫자는 밝기', speech: '0은 가장 어두운 검정, 255는 가장 밝은 흰색이에요. 컴퓨터는 밝기를 0부터 255까지 256단계로 저장해요.',
      html: '<p>128에 가까운 회색을 만들어 보세요</p><div id="pxSample"></div><label class="px-slider">밝기 <input id="pxBrightness" type="range" min="0" max="255" step="1"><output id="pxValue"></output></label><div id="pxSwatches"></div><p id="pxStatus" role="status"></p>',
      onMount: mountBrightness, isComplete: () => data.touched && data.brightness >= 118 && data.brightness <= 138 },
    { title: '똑같이 그려 보세요', speech: '왼쪽 그림과 똑같이 그려 보세요. 아래 숫자가 같이 바뀌는 것도 보세요!',
      html: '<div class="px-paint-layout"><section><h4>예시 그림</h4><div id="pxReference"></div><h4>밝기 붓</h4><div id="pxBrushes"></div><div class="px-checks"><button type="button" id="pxCheck" class="mt-button">확인</button><button type="button" id="pxReveal" class="mt-button" disabled>틀린 칸 보기</button></div><p id="pxStatus" role="status"></p></section><section><h4>내 그림 · 안쪽을 칠해요</h4><div id="pxPaint" class="px-grid" style="--n:7" aria-label="학생 그림판"></div><h4>숫자 행렬</h4><div id="pxNumbers"></div></section></div>',
      onMount: mountPaint, isComplete: () => data.paintChecked && data.paint.every((v, i) => v === face[i]) },
    { title: '숫자만 보고 맞혀 보세요', speech: '이번엔 반대로, 숫자만 보고 그림을 떠올려 볼까요?',
      html: '<p>숫자 행렬과 같은 그림을 골라 주세요.</p><div class="px-quiz"><div id="pxQuizMatrix"></div><div id="pxChoices"></div></div>',
      onMount: mountQuiz, isComplete: () => data.choice === 0 }
  ];
  const root = get('learningDialog');
  const controller = StepLesson.create({
    root, className: 'matrix-tutorial', extraClass: 'matrix-level-two',
    headingId: 'pxStepTitle', title: '컴퓨터 눈에는 숫자만 보여요',
    description: 'Lv.2 · 흑백 이미지의 행렬 표현', steps,
    requireAllSteps: true, closeOnComplete: true,
    finishLabel: ({ testing, cost = 0 }) => testing ? '체험 완료 →' : `연구 완료 · ${typeof cost === 'string' ? cost : cost.toLocaleString('ko-KR') + '원'} · 업그레이드`,
    quiz: { type: 'choice', step: 4, answer: 0,
      hints: { 1: '0은 검정, 255는 흰색이에요. 밝기가 뒤바뀌지 않았는지 확인해 보세요.',
        2: '행은 위에서 아래로, 열은 왼쪽에서 오른쪽으로 세어요. 첫 행의 흰 칸은 어느 열인가요?',
        3: '가운데 숫자는 128이에요. 255인 흰색과 다른 중간 밝기의 회색이에요.' },
      success: '정답이에요! 위치와 밝기 숫자로 그림을 읽었어요.' },
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
    storageKey = `ai-matrix-lab-v1-${options.test ? 'test' : 'play'}-2`;
    try { record = JSON.parse(localStorage.getItem(storageKey)) || {}; } catch { record = {}; }
    if (typeof record !== 'object' || Array.isArray(record)) record = {};
    const saved = record.imageLessonV2;
    data = fresh();
    if (saved && typeof saved === 'object') {
      data.zoomDone = saved.zoomDone === true;
      data.address = [0, 1, 2].includes(saved.address) ? saved.address : 0;
      data.brightness = Number.isInteger(saved.brightness) && saved.brightness >= 0 && saved.brightness <= 255 ? saved.brightness : 0;
      data.touched = saved.touched === true;
      if (Array.isArray(saved.paint) && saved.paint.length === 49 && saved.paint.every(v => shades.includes(v))) {
        data.paint = saved.paint.map((v, i) => edge(i) ? face[i] : v);
      }
      data.paintChecked = saved.paintChecked === true && data.paint.every((v, i) => v === face[i]);
      data.brush = shades.includes(saved.brush) ? saved.brush : 0;
      data.choice = [0, 1, 2, 3].includes(saved.choice) ? saved.choice : null;
      const firstIncomplete = steps.findIndex(step => !step.isComplete());
      data.step = Math.min(Number.isInteger(saved.step) ? Math.max(0, saved.step) : 0, firstIncomplete < 0 ? 4 : firstIncomplete);
    }
    controller.start({ ...options, step: data.step, verified: data.choice === 0 });
  }
  window.MatrixLessonTwo = { start };
})();
