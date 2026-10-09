/* Shared learning modal: body slot, guide, readiness predicate and completion callback. */
(() => {
  'use strict';
  window.LearningShell = {
    create({id='matrixLab', prefix='ml', title='공장 설계 · 학습'}={}) {
      const root=document.createElement('dialog');
      root.id=id;root.setAttribute('aria-labelledby',prefix+'Title');
      root.innerHTML=`<div class="ml-top"><span></span><button type="button" class="secondary" id="${prefix}Close">나중에 하기 ✕</button></div><div class="ml-heading"><span id="${prefix}Badge"></span><h2 id="${prefix}Title"></h2><p id="${prefix}Goal"></p></div><nav id="${prefix}Tabs" aria-label="학습 테스트 단계"></nav><div class="learning-eyebrow">LEARNING LAB</div><div id="${prefix}Body"></div><aside class="ml-dialogue" id="${prefix}Dialogue"><div class="ml-speech"><strong>드림이</strong><p id="${prefix}DreamText" aria-live="polite"></p><div class="ml-chips" id="${prefix}SceneControls"></div></div><div class="ml-dream-character" role="img" aria-label="드림이"><img src="assets/dreamy-sheet.png" alt="" aria-hidden="true" draggable="false"></div></aside><div class="ml-bottom"><p id="${prefix}Status" role="status" aria-live="polite"></p><button type="button" id="${prefix}Finish" class="primary" disabled></button><div class="ml-foot"><span id="${prefix}Save"></span><button type="button" class="secondary" id="${prefix}Restart">이 활동 다시 시작</button></div></div>`;
      root.querySelector('.ml-top>span').textContent=title;
      document.body.append(root);
      const get=name=>root.querySelector('#'+prefix+name);
      let isComplete=()=>false,onComplete=()=>false;
      get('Close').onclick=()=>root.close();
      get('Finish').onclick=()=>{if(!isComplete()){get('Finish').disabled=true;return;}onComplete();};
      return {root,body:get('Body'),
        setCompletion(check,callback){isComplete=check;onComplete=callback;get('Finish').disabled=!check();},
        refresh(){get('Finish').disabled=!isComplete();},
        say(heading,message){const strong=document.createElement('b');strong.textContent=heading;get('DreamText').replaceChildren(strong,document.createElement('br'),document.createTextNode(message));}
      };
    }
  };
})();
