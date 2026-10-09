/* Shared step-based lesson controller. Content and animation hooks live elsewhere. */
(() => {
  'use strict';

  function create(config) {
    const { root, elements: ui, steps, quiz } = config;
    let stepIndex = 0;
    let testing = false;
    let verified = false;
    let canAdvance = true;
    let opener = null;
    let options = {};
    let timer = null;
    let tapStart = null;
    let tapMoved = false;
    const interactive = 'button,input,select,textarea,a,label,form,[data-lesson-speech]';

    function stop() {
      clearTimeout(timer);
      timer = null;
      config.onStop?.();
    }

    function schedule(callback, delay) {
      clearTimeout(timer);
      timer = setTimeout(callback, delay);
    }

    function setSpeechInert(inert) {
      for (const child of ui.card.children) {
        if (child !== ui.guide) child.inert = inert;
      }
      ui.top.inert = inert;
    }

    function showSpeech() {
      ui.guide.hidden = false;
      setSpeechInert(true);
      queueMicrotask(() => {
        if (root.open && !ui.guide.hidden) ui.guide.focus({ preventScroll: true });
      });
    }

    function focusStep() {
      const target = stepIndex === quiz.step
        ? document.getElementById(quiz.inputs[0])
        : stepIndex === steps.length - 1
          ? ui.submit
          : ui.question.querySelector('h3');
      target.focus({ preventScroll: true });
    }

    function dismissSpeech() {
      ui.guide.hidden = true;
      setSpeechInert(false);
      steps[stepIndex].onDismiss?.(api);
      focusStep();
    }

    function render() {
      stop();
      const step = steps[stepIndex];
      ui.question.dataset.step = String(stepIndex);
      ui.question.innerHTML = `<div class="mt-progress">${stepIndex + 1} / ${steps.length}</div>`
        + `<h3 id="${config.headingId}" tabindex="-1">${step.title}</h3>` + step.html;
      ui.speech.textContent = step.speech;
      ui.feedback.textContent = '';
      ui.form.hidden = stepIndex < quiz.step;
      ui.legacyLabel.hidden = true;
      ui.legacyAnswer.hidden = true;
      ui.legacyAnswer.required = false;
      ui.submit.textContent = stepIndex === quiz.step
        ? '정답 확인 →'
        : testing ? '체험 완료 →' : '완료하고 가동하기 →';
      ui.previous.hidden = false;
      ui.previous.disabled = stepIndex === 0;
      ui.tapHint.hidden = stepIndex >= quiz.step;
      ui.tapHint.textContent = step.waitForAnimation
        ? '숫자의 움직임을 지켜보세요'
        : '화면을 터치하면 다음으로 ▸';
      canAdvance = !step.waitForAnimation;
      showSpeech();
    }

    function start(startOptions = {}) {
      stop();
      options = startOptions;
      opener = document.activeElement;
      stepIndex = 0;
      testing = options.test === true;
      verified = false;
      root.classList.add(config.className);
      ui.title.textContent = config.title;
      ui.description.textContent = config.description;
      ui.legacyAnswer.value = '';
      ui.guide.hidden = false;
      ui.navigation.hidden = false;
      ui.tabs.hidden = !testing;
      render();
      if (!root.open) root.showModal();
      ui.question.querySelector('h3').focus();
    }

    function next() {
      if (stepIndex >= quiz.step || !canAdvance) return;
      stepIndex++;
      render();
      focusStep();
    }

    function previous() {
      if (stepIndex === 0) return;
      stepIndex--;
      render();
      ui.question.querySelector('h3').focus();
    }

    function submit(event) {
      if (!root.classList.contains(config.className)) return;
      event.preventDefault();
      if (options.canSubmit && !options.canSubmit()) return;
      if (stepIndex === quiz.step) {
        const inputs = quiz.inputs.map(id => document.getElementById(id));
        const bad = inputs.findIndex((input, index) => {
          const value = input.value.trim().replace('−', '-');
          return value === '' || !Number.isFinite(Number(value))
            || Number(value) !== quiz.answers[index];
        });
        if (bad !== -1) {
          ui.feedback.textContent = quiz.hints[bad];
          inputs[bad].setAttribute('aria-invalid', 'true');
          inputs[bad].focus();
          return;
        }
        verified = true;
        stepIndex++;
        render();
        ui.feedback.textContent = quiz.success;
        ui.question.querySelector('h3').focus();
        return;
      }
      if (stepIndex !== steps.length - 1 || !verified) return;
      if (testing) root.close();
      else options.onComplete?.();
    }

    function canTap(event) {
      return root.classList.contains(config.className)
        && ui.guide.hidden
        && !event.target.closest(interactive)
        && stepIndex < quiz.step && canAdvance;
    }

    function deactivate() {
      stop();
      ui.guide.hidden = true;
      setSpeechInert(false);
      root.classList.remove(config.className);
    }

    ui.previous.onclick = previous;
    ui.replay.onclick = showSpeech;
    ui.guide.dataset.lessonSpeech = '';
    ui.guide.setAttribute('role', 'button');
    ui.guide.tabIndex = 0;
    ui.guide.setAttribute('aria-label', '드림이 대사 닫고 학습 계속');
    ui.guide.setAttribute('aria-describedby', ui.speech.id);
    ui.guide.addEventListener('click', event => {
      event.stopPropagation();
      dismissSpeech();
    });
    ui.guide.addEventListener('keydown', event => {
      if (!['Enter', ' ', 'Escape'].includes(event.key)) return;
      event.preventDefault();
      event.stopPropagation();
      dismissSpeech();
    });
    ui.form.addEventListener('submit', submit);
    root.addEventListener('pointerdown', event => {
      tapStart = { x: event.clientX, y: event.clientY };
      tapMoved = false;
    });
    root.addEventListener('pointermove', event => {
      if (tapStart && Math.hypot(event.clientX - tapStart.x, event.clientY - tapStart.y) > 12) {
        tapMoved = true;
      }
    });
    root.addEventListener('pointercancel', () => { tapMoved = true; });
    root.addEventListener('click', event => {
      if (canTap(event) && !tapMoved && !window.getSelection()?.toString()) next();
      tapStart = null;
    });
    root.addEventListener('keydown', event => {
      if (['Enter', ' '].includes(event.key) && !event.repeat && canTap(event)) {
        event.preventDefault();
        next();
      }
    });
    root.addEventListener('close', () => {
      stop();
      ui.guide.hidden = true;
      setSpeechInert(false);
      if (opener?.isConnected) opener.focus();
      opener = null;
    });

    const api = {
      start, stop, deactivate, schedule,
      isCurrent(index) { return root.open && stepIndex === index; },
      allowNext() {
        canAdvance = true;
        ui.tapHint.textContent = '화면을 터치하면 다음으로 ▸';
      },
      say(message) { ui.speech.textContent = message; }
    };
    return api;
  }

  window.StepLesson = { create };
})();
