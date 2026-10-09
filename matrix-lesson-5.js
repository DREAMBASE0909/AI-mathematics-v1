/* Lv.5: color pixels, batch grayscale conversion, and channel filters. */
(() => {
  'use strict';
  const get = id => document.getElementById(id);
  const { colorFace, colorGrid, multiply, identity, flip } = MatrixImage;
  const { lamps, machineCard, bindMachine, bindZoom } = MatrixControls;
  const channels = ['R', 'G', 'B'];
  const axes = { rows: channels, columns: channels, showLabels: true };
  const average = [[1 / 3], [1 / 3], [1 / 3]];
  const sample = [[90, 150, 60]];
  const photo = [[240, 0, 0], [240, 240, 0], [0, 210, 0], [90, 150, 210], [255, 255, 255], [0, 0, 0]];
  const gray = pixels => multiply(pixels, average).map(([v]) => [v, v, v]);
  const photoGray = gray(photo);
  const machines = {
    J: flip(3), I: identity(3),
    RG: [[0, 1, 0], [1, 0, 0], [0, 0, 1]],
    GB: [[1, 0, 0], [0, 0, 1], [0, 1, 0]]
  };
  const machineNames = { J: 'J · R↔B', I: 'I · 그대로', RG: 'R↔G', GB: 'G↔B' };
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const shuffled = values => {
    const items = [...values];
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  };
  let data, record, key, busy = false;
  let animations = [];
  const fresh = () => ({
    step: 0, rgb: [0, 0, 0], zoomDone: false, grayDone: false, answer: '',
    stacked: false, calculated: false, selected: null, machine: identity(3),
    hint: 0, choice: null, choices: shuffled(Object.keys(machines))
  });
  const yellow = () => data.rgb[0] >= 200 && data.rgb[1] >= 200 && data.rgb[2] <= 60;
  const pink = () => multiply([[0, 255, 255]], data.machine)[0]
    .every((v, i) => v === [255, 0, 255][i]);
  function persist() {
    if (!data || !key) return;
    record.filterLessonV1 = data;
    try { localStorage.setItem(key, JSON.stringify(record)); } catch { /* Optional storage. */ }
  }
  function changed() { persist(); controller.refresh(); }
  function say(message, narrate = true) {
    get('cfStatus').textContent = message;
    if (narrate) controller.say(message);
  }
  const status = '<p id="cfStatus" class="cf-status" role="status"></p>';
  const why = content => `<details class="cf-why"><summary>왜 그럴까?</summary><div>${content}</div></details>`;
  const card = (pixels, title, cols = 7) => `<section class="cf-card"><h4>${title}</h4>${colorGrid(pixels, cols)}</section>`;
  function mountColor(api) {
    get('cfZoomImage').innerHTML = colorGrid(colorFace, 7, true);
    bindZoom({ image: get('cfZoomImage'), button: get('cfZoom'), complete: data.zoomDone,
      controller: api, onComplete() { data.zoomDone = true; changed(); } });
    function render(narrate = false) {
      get('cfMix').style.background = `rgb(${data.rgb.join(',')})`;
      get('cfMixValue').textContent = `[${data.rgb.join(', ')}]`;
      channels.forEach((c, i) => { get('cfValue' + c).textContent = data.rgb[i]; });
      say(yellow() ? '빨강과 초록 빛을 섞으면 노랑이 돼요! 화면 속 모든 색은 이 숫자 3개로 만들어요.' : '노랑을 만들어 보세요. 빨강과 초록 빛을 올려 볼까요?', narrate);
    }
    channels.forEach((c, i) => {
      const slider = get('cf' + c);
      slider.value = data.rgb[i];
      slider.oninput = () => { data.rgb[i] = Number(slider.value); render(true); changed(); };
    });
    render();
  }
  function mountGray() {
    const value = Math.round(multiply(sample, average)[0][0]);
    const output = get('cfGrayPixel');
    const input = get('cfGrayAnswer');
    input.value = data.answer;
    function show() {
      output.style.background = data.grayDone ? `rgb(${value},${value},${value})` : `rgb(${sample[0].join(',')})`;
      get('cfGrayLabel').textContent = data.grayDone ? `회색 [${value}, ${value}, ${value}]` : '[90, 150, 60]';
    }
    function finish() {
      data.grayDone = true;
      show();
      say('컬러를 흑백으로 바꾸는 것도 행렬 계산이었어요!');
      changed();
    }
    const check = () => {
      data.answer = input.value;
      if (input.value.trim() !== '' && Number(input.value.trim()) === value) {
        input.removeAttribute('aria-invalid');
        finish();
      } else {
        input.setAttribute('aria-invalid', 'true');
        get('cfStatus').textContent = '(90 + 150 + 60) ÷ 3을 계산해 보세요.';
        persist();
      }
    };
    input.onkeydown = event => {
      if (event.key === 'Enter') { event.preventDefault(); event.stopPropagation(); check(); }
    };
    get('cfGrayCheck').onclick = check;
    get('cfGrayDemo').onclick = finish;
    show();
  }
  function fly(element, from, to, duration) {
    if (reduced()) return;
    animations.push(element.animate([
      { transform: `translate(${from.left - to.left}px,${from.top - to.top}px) scale(.65)`, opacity: .3 },
      { transform: 'translate(0,0) scale(1)', opacity: 1 }
    ], { duration, easing: 'ease-in-out' }));
  }
  function mountBatch(api) {
    busy = false;
    get('cfPhoto').innerHTML = colorGrid(photo, 3);
    get('cfRows').innerHTML = photo.map((p, i) => `<div class="cf-row" data-row="${i}"><b>${i + 1}</b><i style="background:rgb(${p.join(',')})"></i><span>[${p.join(', ')}]</span></div>`).join('');
    get('cfColumn').innerHTML = multiply(photo, average).map(([v], i) => `<span data-result="${i}">${Math.round(v)}</span>`).join('');
    get('cfBatchOutput').innerHTML = colorGrid(photoGray, 3);
    const resultCells = [];
    get('cfBatchOutput').querySelectorAll('.color-grid > span').forEach((cell, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.style.cssText = cell.style.cssText;
      button.textContent = Math.round(photoGray[i][0]);
      button.setAttribute('aria-label', `결과 ${i + 1}번 픽셀 ${Math.round(photoGray[i][0])}`);
      button.onclick = () => {
        if (!data.calculated || busy) return;
        data.selected = i;
        highlight();
        say('픽셀이 몇 개든 표로 쌓으면 곱셈 한 번이면 끝! 이걸 ‘일괄 계산’이라고 해요.');
        changed();
      };
      cell.replaceWith(button);
      resultCells.push(button);
    });
    function highlight() {
      get('cfRows').querySelectorAll('.cf-row').forEach((row, i) => row.classList.toggle('cf-selected', data.selected === i));
      resultCells.forEach((cell, i) => {
        cell.classList.toggle('cf-selected', data.selected === i);
        cell.setAttribute('aria-pressed', String(data.selected === i));
      });
    }
    function draw() {
      get('cfRows').querySelectorAll('.cf-row').forEach(row => { row.style.visibility = data.stacked ? 'visible' : 'hidden'; });
      get('cfColumn').hidden = !data.calculated;
      get('cfBatchOutput').hidden = !data.calculated;
      get('cfBatchFace').hidden = !data.calculated;
      get('cfBatchFace').innerHTML = card(colorFace, '컬러') + '<b>→</b>' + card(gray(colorFace), '49픽셀 흑백');
      get('cfStack').disabled = data.stacked || busy;
      get('cfCompute').disabled = !data.stacked || busy;
      resultCells.forEach(cell => { cell.disabled = busy; });
      highlight();
    }
    get('cfStack').onclick = () => {
      busy = true;
      draw();
      const rows = [...get('cfRows').children];
      const cells = [...get('cfPhoto').querySelectorAll('span')];
      function stack(index) {
        if (index === rows.length) {
          data.stacked = true; busy = false; draw(); changed(); return;
        }
        rows[index].style.visibility = 'visible';
        fly(rows[index], cells[index].getBoundingClientRect(), rows[index].getBoundingClientRect(), 260);
        if (reduced()) stack(index + 1);
        else api.schedule(() => stack(index + 1), 220);
      }
      stack(0);
    };
    get('cfCompute').onclick = () => {
      if (busy || !data.stacked) return;
      busy = true;
      data.calculated = false;
      data.selected = null;
      draw();
      get('cfColumn').hidden = false;
      function fold() {
        get('cfBatchOutput').hidden = false;
        const column = [...get('cfColumn').children];
        resultCells.forEach((cell, i) => fly(cell, column[i].getBoundingClientRect(), cell.getBoundingClientRect(), 650));
        const finish = () => {
          data.calculated = true; busy = false; draw();
          say('한꺼번에 흑백으로 바꿨어요. 결과 칸 하나를 눌러 원본 픽셀의 행을 찾아보세요.');
          changed();
        };
        if (reduced()) finish();
        else api.schedule(finish, 650);
      }
      if (reduced()) fold();
      else api.schedule(fold, 350);
      changed();
    };
    draw();
  }
  function mountMachine() {
    get('cfMachine').innerHTML = lamps(data.machine, { ...axes, editable: true });
    function draw(narrate = false) {
      const output = multiply(colorFace, data.machine);
      get('cfFiltered').innerHTML = colorGrid(output, 7);
      get('cfSources').innerHTML = channels.map((c, i) => `<span>결과 ${c} ← 원본 ${channels[data.machine.findIndex(row => row[i] === 1)]}</span>`).join('');
      get('cfEyeColor').textContent = `눈 색 [${multiply([[0, 255, 255]], data.machine)[0].join(', ')}]`;
      say(pink() ? '사진 앱의 필터도 이렇게 색을 섞는 행렬이에요.' : '드림이 눈을 분홍 [255, 0, 255]으로 바꿔 보세요.', narrate);
      changed();
    }
    bindMachine(get('cfMachine'), data.machine, () => { data.choice = null; draw(true); });
    get('cfHint').onclick = () => {
      const hints = ['분홍은 빨강과 파랑이 255, 초록이 0이에요. 지금 눈은 빨강이 0이에요.', 'R과 G를 서로 바꿔 보세요.'];
      get('cfHintText').textContent = hints[Math.min(data.hint++, 1)];
      persist();
    };
    draw();
  }
  function showQuizResults() {
    const correct = data.choice === 'J';
    get('cfQuizResults').innerHTML = correct
      ? data.choices.map(id => card(multiply(colorFace, machines[id]), machineNames[id])).join('')
      : card(multiply(colorFace, machines[data.choice]), '이 기계의 결과');
    get('cfQuizResults').hidden = false;
    get('cfQuizEnding').hidden = !correct;
  }
  function mountQuiz(api) {
    data.choices.forEach((id, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', `기계 보기 ${i + 1}`);
      button.setAttribute('aria-pressed', String(data.choice === id));
      button.innerHTML = lamps(machines[id], axes);
      button.onclick = () => {
        data.choice = id;
        get('cfChoices').querySelectorAll(':scope > button').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
        const correct = api.answerChoice(id);
        showQuizResults();
        persist();
        if (correct) {
          api.say('사진 앱은 수백만 픽셀을 이렇게 한 번에 계산해요. AI도 엄청난 양의 데이터를 행렬로 쌓아서 한꺼번에 처리해요. GPU는 이런 계산을 빠르게 처리하는 데 쓰인답니다.');
          api.showSpeech();
        }
      };
      get('cfChoices').append(button);
    });
    if (data.choice) showQuizResults();
  }
  const steps = [
    {
      title: '컬러 픽셀은 숫자 3개',
      speech: '흑백 사진은 칸마다 숫자 1개였죠? 컬러 사진은 칸마다 빨강·초록·파랑, 숫자 3개예요.',
      html: '<div class="cf-color-layout"><section><div class="cf-zoom-area"><div id="cfZoomImage"></div></div><button type="button" id="cfZoom" class="mt-button">확대</button></section><section><p><strong>노랑을 만들어 보세요</strong></p>'
        + channels.map(c => `<label class="cf-slider">${c}<input id="cf${c}" type="range" min="0" max="255" value="0" aria-label="${c} 밝기"><output id="cfValue${c}">0</output></label>`).join('')
        + '<div class="cf-mix-row"><div id="cfMix"></div><output id="cfMixValue"></output></div><div class="cf-swatches">'
        + [[255, 0, 0], [0, 255, 0], [0, 0, 255]].map((p, i) => `<span><i style="background:rgb(${p.join(',')})"></i>${['빨강', '초록', '파랑'][i]}<small>[${p.join(',')}]</small></span>`).join('')
        + '</div></section></div>' + status,
      onMount: mountColor, isComplete: yellow
    },
    {
      title: '흑백으로 바꾸기',
      speech: '세 숫자가 같으면 회색이 돼요. 이 색을 흑백으로 바꾸면 밝기는 얼마일까요? 직접 바꿔 보거나 평균을 구해 보세요.',
      html: '<div class="cf-gray-layout"><section><div id="cfGrayPixel"></div><p id="cfGrayLabel"></p></section><section><p>R, G, B의 평균을 밝기로 써요.</p><button type="button" id="cfGrayDemo" class="mt-button">흑백으로 바꿔 보기</button><p>직접 계산해 보고 싶다면</p><label>밝기 <input id="cfGrayAnswer" inputmode="numeric" aria-label="흑백 밝기"></label> <button type="button" id="cfGrayCheck" class="mt-button">확인</button></section></div>' + status
        + why('<p>평균도 행 × 열 계산이에요.</p><p>[90 150 60] × [⅓, ⅓, ⅓]ᵀ = 30 + 50 + 20 = 100</p><p>Lv.4에서 본 ‘짝지어 곱하고 더하기’와 같아요.</p>')
        + '<p class="cf-note">실제 사진 앱은 사람 눈이 초록에 더 민감해서 초록을 조금 더 크게 계산해요.</p>',
      onMount: mountGray, isComplete: () => data.grayDone
    },
    {
      title: '한꺼번에 계산하기',
      speech: '픽셀을 하나씩 계산하면 너무 오래 걸려요. 한 줄씩 쌓아서 한 번에 계산해 볼까요?',
      html: '<div class="cf-batch-layout"><section><h4>6픽셀 컬러 사진</h4><div id="cfPhoto"></div><div class="cf-batch-buttons"><button type="button" id="cfStack" class="mt-button">픽셀 쌓기</button><button type="button" id="cfCompute" class="mt-button">한 번에 계산</button></div><div id="cfBatchOutput" hidden></div></section><div class="cf-batch-equation"><section><h4>픽셀 · [R, G, B]</h4><div id="cfRows"></div></section><b>×</b><section><h4>흑백 기계</h4><div class="cf-average">⅓<br>⅓<br>⅓</div></section><b>=</b><section><h4>결과</h4><div id="cfColumn" hidden></div></section></div></div><div id="cfBatchFace" hidden></div>' + status
        + why('<p>6×3 × 3×1 = 6×1. 결과의 한 행이 픽셀 하나예요.</p><p>49×3 × 3×1 = 49×1. 픽셀 49개도 곱셈 한 번!</p>'),
      onMount: mountBatch, isComplete: () => data.calculated && data.selected !== null && !busy
    },
    {
      title: '색 바꾸는 기계',
      speech: 'Lv.4의 뒤집기 기계 기억나요? 그림 오른쪽에 곱하면 열이 바뀌었죠. 여기서는 열이 R, G, B라서 색이 바뀌어요!',
      html: '<div id="cfSources"></div><div class="cf-machine-equation">' + card(colorFace, '컬러 드림이')
        + '<b>×</b><section><h4>기계 · 열마다 하나 선택</h4><div id="cfMachine"></div></section><b>=</b><section class="cf-card"><h4>결과 드림이</h4><div id="cfFiltered"></div></section></div><p id="cfEyeColor"></p><div class="cf-hints"><button type="button" id="cfHint" class="mt-button">힌트 보기</button><span id="cfHintText"></span></div>' + status,
      onMount: mountMachine, isComplete: pink
    },
    {
      title: '노랑 눈 만들기',
      speech: '드림이의 하늘색 눈을 노랑으로 바꾸는 기계는 무엇일까요?',
      html: '<p>드림이 눈(하늘색)을 노랑으로 바꾸는 기계는? <span class="cf-target">목표 <i></i> [255, 255, 0]</span></p><div id="cfChoices"></div><div id="cfQuizResults" hidden></div><p id="cfQuizEnding" hidden>J는 Lv.4의 좌우 반전 기계예요!<br>[R, G, B]를 [B, G, R]로 뒤집었어요.</p>',
      onMount: mountQuiz, isComplete: () => data.choice === 'J'
    }
  ];
  const root = get('learningDialog');
  const controller = StepLesson.create({
    root, className: 'matrix-tutorial', extraClass: 'matrix-level-five',
    headingId: 'cfStepTitle', title: '드림이의 사진 필터', description: 'Lv.5 · 여러 입력의 일괄 계산',
    steps, requireAllSteps: true, closeOnComplete: true,
    finishLabel: ({ testing, cost = 0 }) => testing ? '체험 완료 →'
      : `연구 완료 · ${typeof cost === 'string' ? cost : cost.toLocaleString('ko-KR') + '원'} · 업그레이드`,
    quiz: {
      type: 'choice', step: 4, answer: 'J',
      hints: { I: '단위행렬은 아무것도 바꾸지 않아요.', RG: '이건 4단계에서 만든 분홍 기계예요.', GB: '지금 눈은 G와 B가 둘 다 255라서, 바꿔도 그대로예요.' },
      success: '정답! 색의 순서를 바꾸는 행렬로 노랑 눈을 만들었어요.'
    },
    onStop() { animations.forEach(animation => animation.cancel()); animations = []; busy = false; },
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
    key = `ai-matrix-lab-v1-${options.test ? 'test' : 'play'}-5`;
    try { record = JSON.parse(localStorage.getItem(key)) || {}; } catch { record = {}; }
    if (typeof record !== 'object' || Array.isArray(record)) record = {};
    const saved = record.filterLessonV1;
    data = fresh();
    if (saved && typeof saved === 'object') {
      if (Array.isArray(saved.rgb) && saved.rgb.length === 3 && saved.rgb.every(v => Number.isInteger(v) && v >= 0 && v <= 255)) data.rgb = [...saved.rgb];
      for (const name of ['zoomDone', 'grayDone', 'stacked']) data[name] = saved[name] === true;
      data.answer = typeof saved.answer === 'string' ? saved.answer.slice(0, 20) : '';
      data.calculated = data.stacked && saved.calculated === true;
      if (data.calculated && Number.isInteger(saved.selected) && saved.selected >= 0 && saved.selected < 6) data.selected = saved.selected;
      const m = saved.machine;
      if (Array.isArray(m) && m.length === 3 && m.every(row => Array.isArray(row) && row.length === 3 && row.every(v => v === 0 || v === 1))
        && [0, 1, 2].every(c => m.reduce((sum, row) => sum + row[c], 0) === 1)) data.machine = m.map(row => [...row]);
      if (Object.hasOwn(machines, saved.choice)) data.choice = saved.choice;
      if (Array.isArray(saved.choices) && saved.choices.length === 4 && new Set(saved.choices).size === 4 && saved.choices.every(id => Object.hasOwn(machines, id))) data.choices = [...saved.choices];
      const incomplete = steps.findIndex(step => !step.isComplete());
      data.step = Math.min(Number.isInteger(saved.step) ? Math.max(0, saved.step) : 0, incomplete < 0 ? 4 : incomplete);
    }
    controller.start({ ...options, step: data.step, verified: data.choice === 'J' });
  }
  window.MatrixLessonFive = { start };
})();
