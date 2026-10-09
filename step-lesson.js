/* Shared step-based lesson controller. Content and animation hooks live elsewhere. */
(() => {
  'use strict';

  const owners = new WeakMap();

  function create(config) {
    const { root, elements: ui, steps, quiz } = config;
    const choiceQuiz = quiz.type === 'choice';
    const active = () => owners.get(root) === api;
    let stepIndex = 0;
    let testing = false;
    let verified = false;
    let canAdvance = true;
    let opener = null;
    let options = {};
    let timer = null;
    let tapStart = null;
    let tapMoved = false;
    const interactive = 'button,input,select,textarea,a,label,form,details,summary,[data-lesson-speech]';

    function stop() {
      clearTimeout(timer);
      timer = null;
      steps[stepIndex].onLeave?.();
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
      const target = stepIndex === quiz.step && !choiceQuiz
        ? document.getElementById(quiz.inputs[0])
        : stepIndex === steps.length - 1
          ? (ui.submit.disabled ? ui.question.querySelector('h3') : ui.submit)
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
      ui.submit.textContent = config.finishLabel
        ? config.finishLabel({ testing, ...options })
        : stepIndex === quiz.step
        ? '정답 확인 →'
        : testing ? '체험 완료 →' : '완료하고 가동하기 →';
      ui.previous.hidden = false;
      ui.previous.disabled = stepIndex === 0;
      ui.tapHint.hidden = stepIndex >= quiz.step;
      ui.tapHint.textContent = step.waitForAnimation
        ? '숫자의 움직임을 지켜보세요'
        : '화면을 터치하면 다음으로 ▸';
      canAdvance = !step.waitForAnimation;
      step.onMount?.(api);
      refresh();
      config.onStepChange?.(stepIndex);
      showSpeech();
    }

    function start(startOptions = {}) {
      if (owners.get(root) && !active()) owners.get(root).deactivate();
      stop();
      owners.set(root, api);
      options = startOptions;
      opener = document.activeElement;
      stepIndex = Number.isInteger(options.step)
        ? Math.max(0, Math.min(steps.length - 1, options.step)) : 0;
      testing = options.test === true;
      verified = choiceQuiz && options.verified === true;
      root.classList.add(config.className);
      if (config.extraClass) root.classList.add(config.extraClass);
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
      if (stepIndex >= quiz.step || !ready()) return;
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
      if (!active()) return;
      event.preventDefault();
      if (options.canSubmit && !options.canSubmit()) return;
      if (stepIndex === quiz.step && !choiceQuiz) {
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
      if (stepIndex !== steps.length - 1 || !verified || !allComplete()) return;
      if (testing) root.close();
      else {
        const result = options.onComplete?.();
        if (result === false) {
          ui.feedback.textContent = '업그레이드할 자금이나 공장 상태를 확인해 주세요. 활동 내용은 저장되어 있습니다.';
        } else if (config.closeOnComplete) root.close();
      }
    }

    function ready() {
      return canAdvance && (steps[stepIndex].isComplete?.() ?? true);
    }

    function allComplete() {
      return !config.requireAllSteps || steps.every(step => step.isComplete?.() ?? true);
    }

    function refresh() {
      if (choiceQuiz) ui.submit.disabled = !verified || !allComplete();
      else ui.submit.disabled = false;
      if (stepIndex < quiz.step && steps[stepIndex].isComplete) {
        ui.tapHint.textContent = ready()
          ? '화면을 터치하면 다음으로 ▸'
          : steps[stepIndex].pendingText || '활동을 마치면 다음으로 넘어갈 수 있어요';
      } else if (ready()) {
        ui.tapHint.textContent = '화면을 터치하면 다음으로 ▸';
      }
    }

    function answerChoice(value) {
      if (!active() || !choiceQuiz || stepIndex !== quiz.step) return false;
      const correct = value === quiz.answer;
      verified = correct;
      ui.feedback.textContent = correct ? quiz.success : quiz.hints[value] || quiz.hint;
      quiz.onAnswer?.(value, correct);
      refresh();
      return correct;
    }

    function canTap(event) {
      return active()
        && ui.guide.hidden
        && !event.target.closest(interactive)
        && stepIndex < quiz.step && ready();
    }

    function deactivate() {
      if (!active() && owners.has(root)) {
        owners.get(root).deactivate();
        return;
      }
      stop();
      config.onClose?.();
      ui.guide.hidden = true;
      setSpeechInert(false);
      root.classList.remove(config.className);
      if (config.extraClass) root.classList.remove(config.extraClass);
      owners.delete(root);
    }

    ui.previous.addEventListener('click', () => { if (active()) previous(); });
    ui.replay.addEventListener('click', () => { if (active()) showSpeech(); });
    ui.guide.dataset.lessonSpeech = '';
    ui.guide.setAttribute('role', 'button');
    ui.guide.tabIndex = 0;
    ui.guide.setAttribute('aria-label', '드림이 대사 닫고 학습 계속');
    ui.guide.setAttribute('aria-describedby', ui.speech.id);
    ui.guide.addEventListener('click', event => {
      if (!active()) return;
      event.stopPropagation();
      dismissSpeech();
    });
    ui.guide.addEventListener('keydown', event => {
      if (!active()) return;
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
      if (!active() || root.open) return;
      stop();
      config.onClose?.();
      ui.guide.hidden = true;
      setSpeechInert(false);
      if (opener?.isConnected) opener.focus();
      opener = null;
    });

    const api = {
      start, stop, deactivate, schedule, refresh, answerChoice, showSpeech,
      feedback(message) { ui.feedback.textContent = message; },
      isCurrent(index) { return active() && root.open && stepIndex === index; },
      allowNext() {
        canAdvance = true;
        refresh();
      },
      say(message) { ui.speech.textContent = message; }
    };
    return api;
  }

  window.StepLesson = { create };
})();
