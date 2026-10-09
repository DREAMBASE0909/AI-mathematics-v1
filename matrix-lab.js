/* Entry points retained for upgrades, free testing, and save resets. */
(() => {
  'use strict';
  // Retained by request for a separate cleanup. No lesson now opens this shell.
  const shell = LearningShell.create();
  const root = shell.root;
  document.getElementById('mlClose').onclick = () => root.close();
  function start(level, options = {}) {
    if (root.open) root.close();
    const lessons = [MatrixLesson, MatrixLessonTwo, MatrixLessonThree, MatrixLessonFour, MatrixLessonFive];
    if (level === 1) lessons[0].start({ test: true });
    else lessons[level - 1]?.start(options);
  }
  function clear() {
    for (let level = 1; level <= 5; level++) {
      for (const mode of ['test', 'play']) {
        try { localStorage.removeItem(`ai-matrix-lab-v1-${mode}-${level}`); } catch { /* Optional storage. */ }
      }
    }
  }
  window.MatrixLab = { start, clear };
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'ml-chip';
  button.id = 'testMatrixLab';
  button.textContent = '행렬 학습 테스트';
  button.onclick = () => start(1, { test: true });
  document.querySelector('.test-tools').prepend(button);
})();
