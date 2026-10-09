/* Matrix Lv.1 content and animation. Game state stays in index.html. */
(() => {
  'use strict';
  const get = id => document.getElementById(id);
  let animating = false;

  const steps = [
    {
      title: "주문서를 식으로",
      speech: "부품 A와 B의 무게를 각각 x, y라고 해 볼까요?",
      html: "<div class=\"mt-order\">부품 A 2개 + 부품 B 3개 = 13kg<br>부품 A 1개 + 부품 B 1개 = 5kg</div>"
        + "<p class=\"mt-caption\">x: 부품 A 한 개의 무게 · y: 부품 B 한 개의 무게 (kg)</p>"
        + "<div class=\"mt-equations\">2x + 3y = 13<br>x + y = 5</div>"
    },
    {
      title: "같은 변수끼리 줄 맞추기",
      speech: "같은 변수끼리 세로로 줄을 세워요. 이 세로줄이 행렬의 ‘열’이 돼요.",
      html: "<div class=\"mt-aligned\">"
        + "<span class=\"mt-x\">x항</span>"
        + "<span>"
        + "</span>"
        + "<span class=\"mt-y\">y항</span>"
        + "<span>"
        + "</span>"
        + "<span>상수</span>"
        + "<b class=\"mt-x\">2x</b>"
        + "<span>+</span>"
        + "<b class=\"mt-y\">3y</b>"
        + "<span>=</span>"
        + "<b>13</b>"
        + "<b class=\"mt-x\">x</b>"
        + "<span>+</span>"
        + "<b class=\"mt-y\">y</b>"
        + "<span>=</span>"
        + "<b>5</b>"
        + "</div>"
    },
    {
      title: "글자 대신 숫자 격자로",
      speech: "x, y 순서를 기억하면서 글자를 지우고, 남은 숫자들을 행렬 자리로 옮겨 볼게요.",
      waitForAnimation: true,
      onDismiss(controller) {
        if (!get('mtMorph').classList.contains('mt-formed') && !animating) {
          controller.schedule(() => animate(controller), 150);
        }
      },
      html: "<div id=\"mtMorph\" role=\"group\" aria-label=\"방정식에서 행렬로 바뀌는 과정\">"
        + "<b class=\"mt-number\" style=\"--from:24%;--to:23%;--row:0\">2</b>"
        + "<b class=\"mt-number\" style=\"--from:46%;--to:34%;--row:0\">3</b>"
        + "<b class=\"mt-number\" style=\"--from:78%;--to:79%;--row:0\">13</b>"
        + "<i class=\"mt-glyph\" data-fade=\"0\" style=\"left:30%;--row:0\">x</i>"
        + "<i class=\"mt-glyph\" data-fade=\"2\" style=\"left:38%;--row:0\">+</i>"
        + "<i class=\"mt-glyph\" data-fade=\"1\" style=\"left:52%;--row:0\">y</i>"
        + "<i class=\"mt-glyph\" data-fade=\"3\" style=\"left:65%;--row:0\">=</i>"
        + "<b class=\"mt-number\" style=\"--from:24%;--to:23%;--row:1\">1</b>"
        + "<b class=\"mt-number\" style=\"--from:46%;--to:34%;--row:1\">1</b>"
        + "<b class=\"mt-number\" style=\"--from:78%;--to:79%;--row:1\">5</b>"
        + "<i class=\"mt-glyph\" data-fade=\"0\" style=\"left:30%;--row:1\">x</i>"
        + "<i class=\"mt-glyph\" data-fade=\"2\" style=\"left:38%;--row:1\">+</i>"
        + "<i class=\"mt-glyph\" data-fade=\"1\" style=\"left:52%;--row:1\">y</i>"
        + "<i class=\"mt-glyph\" data-fade=\"3\" style=\"left:65%;--row:1\">=</i>"
        + "<span class=\"mt-outline mt-a\">"
        + "</span>"
        + "<span class=\"mt-outline mt-v\">"
        + "</span>"
        + "<span class=\"mt-outline mt-b\">"
        + "</span>"
        + "<span class=\"mt-new mt-vx\">x</span>"
        + "<span class=\"mt-new mt-vy\">y</span>"
        + "<span class=\"mt-new mt-times\">×</span>"
        + "<span class=\"mt-new mt-equals\">=</span>"
        + "</div>"
        + "<p id=\"mtTransformNote\" class=\"mt-caption\">생략된 계수 1도 표시했어요. 숫자의 움직임을 따라가 보세요.</p>"
        + "<div id=\"mtMatrixResult\" class=\"mt-storage\" aria-hidden=\"true\">"
        + "<pre>A = [[2, 3], [1, 1]]\nb = [13, 5]</pre>"
        + "<p>변수 순서를 정하면 계수 A와 상수 b를 숫자로 저장할 수 있어요. 변수가 늘어나도 같은 방식으로 표현해요.</p>"
        + "</div>"
    },
    {
      title: "바꿀 때 확인할 세 가지",
      speech: "생략된 1, 없는 변수의 0, 그리고 빼기 부호를 놓치지 마세요.",
      html: "<ul class=\"mt-rules\">"
        + "<li>"
        + "<strong>생략된 계수는 1</strong>"
        + "<span>x + y → [1, 1]</span>"
        + "</li>"
        + "<li>"
        + "<strong>없는 변수는 0</strong>"
        + "<span>x − z = 4 → [1, 0, −1] <small>(x, y, z 순서)</small>"
        + "</span>"
        + "</li>"
        + "<li>"
        + "<strong>빼기 부호도 숫자에 포함</strong>"
        + "<span>3x − 2y → [3, −2]</span>"
        + "</li>"
        + "</ul>"
    },
    {
      title: "세 방정식을 행렬로 바꿔 볼까요?",
      speech: "열의 순서는 x, y, z예요. 두 빈칸에 들어갈 계수를 채워서 세 방정식을 완성해 주세요.",
      html: "<div class=\"mt-final-system\">"
        + "<div>2x + 3y + z = 8</div>"
        + "<div>x − z = 1</div>"
        + "<div>3x − 2y + z = 5</div>"
        + "</div>"
        + "<p class=\"mt-caption\">왼쪽부터 x · y · z의 계수예요. 빈칸 두 개를 채워 주세요.</p>"
        + "<div class=\"mt-final-matrices\">"
        + "<div class=\"mt-bracket mt-final-a\" style=\"--cols:3\" role=\"group\" aria-label=\"계수 행렬 A\">"
        + "<span>2</span>"
        + "<span>3</span>"
        + "<span>1</span>"
        + "<span>1</span>"
        + "<input id=\"mtAnswerZero\" form=\"learningForm\" aria-label=\"둘째 식 y의 계수\" inputmode=\"text\" autocomplete=\"off\" placeholder=\"?\" required>"
        + "<span>−1</span>"
        + "<span>3</span>"
        + "<input id=\"mtAnswerNegative\" form=\"learningForm\" aria-label=\"셋째 식 y의 계수\" inputmode=\"text\" autocomplete=\"off\" placeholder=\"?\" required>"
        + "<span>1</span>"
        + "</div>"
        + "<b>×</b>"
        + "<div class=\"mt-bracket\" style=\"--cols:1\" aria-label=\"미지수 벡터\">"
        + "<span>x</span>"
        + "<span>y</span>"
        + "<span>z</span>"
        + "</div>"
        + "<b>=</b>"
        + "<div class=\"mt-bracket\" style=\"--cols:1\" aria-label=\"상수 벡터\">"
        + "<span>8</span>"
        + "<span>1</span>"
        + "<span>5</span>"
        + "</div>"
        + "</div>"
    },
    {
      title: "신경망 계산과 연결하기",
      speech: "행렬은 식을 저장할 때도, 여러 입력에 가중치를 곱하고 더할 때도 쓰여요.",
      html: "<div class=\"mt-equations\">[2, 3] · [x, y] = 2x + 3y</div>"
        + "<p>2와 3을 가중치, x와 y를 입력으로 보면 <strong>입력 × 가중치의 합</strong>이에요.</p>"
        + "<p>이 계산은 신경망 뉴런의 <strong>가중합</strong>과 같은 형태예요. 뉴런은 여기에 편향을 더하고 활성화 함수를 적용하기도 해요.</p>"
        + "<p class=\"mt-caption\">방정식 자체가 뉴런인 것은 아니에요.</p>"
    },
  ];
  const quiz = {
    step: 4,
    inputs: ['mtAnswerZero', 'mtAnswerNegative'],
    answers: [0, -2],
    hints: [
      '둘째 식에 y가 없으므로 y의 계수는 0이에요.',
      '셋째 식의 −2y에서 빼기 부호도 계수에 포함돼요.'
    ],
    success: '정답이에요! 둘째 식의 y 계수는 0, 셋째 식의 y 계수는 −2입니다.'
  };

  function showResult(controller) {
    get('mtMorph').classList.add('mt-formed', 'mt-revealed');
    get('mtMatrixResult').classList.add('mt-visible');
    get('mtMatrixResult').setAttribute('aria-hidden', 'false');
    get('mtTransformNote').textContent = '같은 숫자가 자리를 옮겼어요. 두 방정식과 같은 뜻이에요.';
    controller.allowNext();
    animating = false;
    controller.say('숫자들이 행렬로 모였어요. 왼쪽에는 계수, 오른쪽에는 상수가 남았고, x와 y는 하나의 묶음으로 표현해요.');
  }

  function animate(controller) {
    if (animating || !controller.isCurrent(2)) return;
    animating = true;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      get('mtMorph').querySelectorAll('.mt-glyph').forEach(node => node.classList.add('mt-faded'));
      showResult(controller);
      return;
    }
    let group = 0;
    const tick = () => {
      if (!controller.isCurrent(2)) return;
      if (group < 4) {
        get('mtMorph').querySelectorAll(`[data-fade="${group}"]`)
          .forEach(node => node.classList.add('mt-faded'));
        group++;
        controller.schedule(tick, 310);
      } else {
        get('mtMorph').classList.add('mt-formed');
        controller.schedule(() => {
          get('mtMorph').classList.add('mt-revealed');
          controller.schedule(() => showResult(controller), 650);
        }, 1000);
      }
    };
    tick();
  }

  const root = get('learningDialog');
  const controller = StepLesson.create({
    root,
    className: 'matrix-tutorial',
    headingId: 'mtStepTitle',
    title: '행렬 공장 설계',
    description: 'Lv.1 · 연립방정식을 숫자 격자로',
    steps,
    quiz,
    onStop() { animating = false; },
    elements: {
      card: root.querySelector('.card'),
      top: root.querySelector('.dialog-top'),
      title: get('learningTitle'),
      description: get('learningDescription'),
      question: get('learningQuestion'),
      guide: get('mtGuide'),
      speech: get('mtSpeech'),
      form: get('learningForm'),
      feedback: get('learningFeedback'),
      submit: get('learningForm').querySelector('button'),
      legacyLabel: get('learningForm').querySelector('label'),
      legacyAnswer: get('learningAnswer'),
      navigation: get('mtNav'),
      tabs: get('mtTestLevels'),
      previous: get('mtPrev'),
      replay: get('mtReplay'),
      tapHint: get('mtTapHint')
    }
  });

  for (let level = 1; level <= 5; level++) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mt-button';
    button.textContent = 'Lv.' + level;
    button.onclick = () => {
      MatrixLab.start(level, { test: true });
    };
    get('mtTestLevels').append(button);
  }

  window.MatrixLesson = {
    start: controller.start,
    deactivate: controller.deactivate
  };
})();
