/* Lv.1: read coefficients by variable, including an absent variable's zero. */
(() => {
  'use strict';
  const answer=[2,3,1,0];
  const correct=values=>Array.isArray(values)&&values.length===4&&values.every((v,i)=>String(v).trim()!==''&&Number(v)===answer[i]);
  window.MatrixLevelOne={correct,mount({host,shell,state,onChange,onReady}) {
    if(!Array.isArray(state.coefficients)||state.coefficients.length!==4)state.coefficients=['','','',''];
    state.hint=Math.min(2,Math.max(0,Number(state.hint)||0));
    host.innerHTML=`<div class="coefficient-workspace"><section class="coefficient-order"><span class="coefficient-caption">의뢰서 · 001</span><h3>두 식을 정리해 주세요</h3><div class="coefficient-equations"><div>3y + 2x = 12</div><div>x = 4</div></div></section><span class="coefficient-arrow" aria-hidden="true">→</span><section class="coefficient-board" aria-label="계수 정리판"><h3>계수 정리판</h3><div class="coefficient-grid"><span class="coefficient-column">x</span><span class="coefficient-column">y</span><span class="coefficient-column">상수</span>${[0,1].map(r=>`${[0,1].map(c=>`<input type="text" inputmode="numeric" autocomplete="off" spellcheck="false" maxlength="6" placeholder="?" aria-label="${r+1}번째 식 ${c===0?'x':'y'} 계수" data-coefficient="${r*2+c}">`).join('')}<output class="coefficient-constant" aria-label="${r+1}번째 식 상수 ${r===0?12:4}">${r===0?12:4}</output>`).join('')}<small class="coefficient-group-label">x · y 계수</small><small>상수</small></div><span class="coefficient-ready" aria-live="polite"></span></section></div>`;
    const inputs=[...host.querySelectorAll('input')],board=host.querySelector('.coefficient-board');
    let wasReady=correct(state.coefficients);
    const messages=[['의뢰가 식으로 들어왔어요','계수만 뽑아서 정리판에 올려 주세요.'],['열을 나누는 기준을 다시 볼까요?','식에 적힌 순서가 기준은 아니에요.'],['변수를 기준으로 정리해요','두 번째 식에 y는 몇 개 있나요?']];
    const speak=ready=>{const line=ready?['공장이 식을 읽을 수 있게 됐어요','이제 의뢰가 식으로 와도 바로 처리할 수 있어요.']:messages[state.hint];shell.say(...line);};
    const hint=document.createElement('button');hint.type='button';hint.className='ml-chip';hint.textContent='힌트 보기';
    shell.root.querySelector('#mlSceneControls').append(hint);
    hint.onclick=()=>{state.hint=Math.min(2,state.hint+1);speak(correct(state.coefficients));hint.textContent=state.hint===2?'힌트 다시 보기':'다음 힌트';onChange();};
    function refresh(){
      const ready=correct(state.coefficients),filled=state.coefficients.filter(v=>String(v).trim()!=='').length;
      inputs.forEach((input,i)=>input.classList.toggle('is-filled',String(state.coefficients[i]).trim()!==''));
      board.classList.toggle('is-complete',ready);hint.disabled=ready;
      host.querySelector('.coefficient-ready').textContent=ready?'✓ 네 칸 모두 확인했어요':'';
      if(ready&&!wasReady){board.classList.remove('coefficient-flash');void board.offsetWidth;board.classList.add('coefficient-flash');}
      wasReady=ready;speak(ready);
      onReady(ready,ready?'✓ 계수 정리 완료':filled===4?'아직 식과 맞지 않는 칸이 있어요. x와 y의 열을 확인해 주세요.':`${filled} / 4칸 입력 · 비어 있는 칸까지 모두 채워 주세요.`);
      onChange();
    }
    inputs.forEach((input,i)=>{
      input.value=String(state.coefficients[i]);
      input.oninput=()=>{state.coefficients[i]=input.value;refresh();};
      input.onkeydown=e=>{if(e.key!=='Enter'||e.isComposing)return;e.preventDefault();if(correct(state.coefficients)){shell.root.querySelector('#mlFinish').focus();return;}const empty=inputs.find(n=>!n.value.trim());(empty||inputs[(i+1)%4]).focus();};
    });
    refresh();
    return {focus:()=>inputs[0].focus()};
  }};
})();
