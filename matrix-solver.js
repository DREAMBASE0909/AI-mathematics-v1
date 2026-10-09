/* Exact rational row operations, shared by the animation and verification. */
(function(scope){
'use strict';
const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
const q=(n,d=1)=>{if(!d)throw Error('Zero denominator');if(n===0)return [0,1];const g=gcd(n,d)||1;return [n/g*(d<0?-1:1),Math.abs(d)/g];};
const add=(a,b)=>q(a[0]*b[1]+b[0]*a[1],a[1]*b[1]);
const mul=(a,b)=>q(a[0]*b[0],a[1]*b[1]);
const neg=a=>[-a[0],a[1]], inv=a=>q(a[1],a[0]);
const text=a=>String(a[0]).replace('-','−')+(a[1]===1?'':'/'+a[1]);
const clone=m=>m.map(r=>r.map(v=>[...v]));
function solve(input){
 let m=input.map(r=>r.map(v=>q(v)));const initial=clone(m),steps=[];
 const op=(kind,target,source,factor,pivot)=>{const before=clone(m);if(kind==='swap')[m[target],m[source]]=[m[source],m[target]];else if(kind==='scale')m[target]=m[target].map(v=>mul(v,factor));else m[target]=m[target].map((v,c)=>add(v,mul(m[source][c],factor)));steps.push({kind,target,source,factor,pivot,before,after:clone(m)});};
 for(let c=0;c<3;c++){const pivot=m.findIndex((r,i)=>i>=c&&r[c][0]!==0);if(pivot<0)throw Error('This lesson requires a unique solution');if(pivot!==c)op('swap',c,pivot,q(1),c);if(m[c][c][0]!==m[c][c][1])op('scale',c,null,inv(m[c][c]),c);for(let r=0;r<3;r++)if(r!==c&&m[r][c][0]!==0)op('add',r,c,neg(m[r][c]),c);}
 return {initial,steps,result:m,solution:m.map(r=>r[3])};
}
const api={solve,text,add,mul};if(typeof module!=='undefined'&&module.exports){module.exports=api;return;}
scope.MatrixArithmetic=api;
const dialog=document.createElement('dialog');dialog.id='matrixSolver';dialog.setAttribute('aria-labelledby','msTitle');document.body.append(dialog);
let lesson,at=0,timer=null,token=0,running=false,busy=false,done,finished=false,returnTo,phase='';
const id=s=>document.getElementById(s);
const frac=v=>v[1]===1?text(v):`<span class="ms-fraction"><span>${String(v[0]).replace('-','−')}</span><span>${v[1]}</span></span>`;
const rowName=r=>`R${r+1}`;
function operation(s){if(s.kind==='swap')return `${rowName(s.target)} ↔ ${rowName(s.source)}`;if(s.kind==='scale')return `${rowName(s.target)} ← (${text(s.factor)}) × ${rowName(s.target)}`;return `${rowName(s.target)} ← ${rowName(s.target)} ${s.factor[0]<0?'−':'+'} (${text(q(Math.abs(s.factor[0]),s.factor[1]))}) × ${rowName(s.source)}`;}
function reason(s){const variable=['x','y','z'][s.pivot];if(s.kind==='scale')return `${s.target+1}행 전체에 ${text(s.factor)}을 곱해 ${variable}의 계수를 1로 만듭니다.`;if(s.kind==='swap')return '계수가 0이 아닌 행을 위로 옮깁니다.';return `${s.source+1}행의 배수를 ${s.target+1}행에 더해 ${variable}의 계수를 0으로 만듭니다.`;}
function equation(row){let terms=[];row.slice(0,3).forEach((v,i)=>{if(!v[0])return;const abs=q(Math.abs(v[0]),v[1]);terms.push((terms.length?(v[0]<0?' − ':' + '):(v[0]<0?'−':''))+(abs[0]===abs[1]?'':text(abs))+['x','y','z'][i]);});return (terms.join('')||'0')+' = '+text(row[3]);}
function matrix(m,step,animate=false){return `<div class="ms-labels"><span>x</span><span>y</span><span>z</span><span>상수</span></div><div class="ms-augmented" role="group" aria-label="첨가 행렬">${m.map((r,i)=>r.map((v,c)=>`<span data-r="${i}" data-c="${c}" class="${c===3?'ms-rhs ':''}${step&&i===step.target?'ms-target ':''}${step&&i===step.source?'ms-source ':''}${animate&&i===step?.target?'ms-result ':''}">${frac(v)}</span>`).join('')).join('')}</div>`;}
function cancel(){token++;clearTimeout(timer);timer=null;busy=false;running=false;}
function render(){
 const last=at===lesson.steps.length,step=lesson.steps[at],current=last?lesson.result:(step.before);
 dialog.innerHTML=`<div class="ms-top"><div><span class="ms-eyebrow">COMPUTER SOLVES · 행 연산</span><h2 id="msTitle">행렬로 방정식 풀기</h2></div><button id="msClose" class="ml-chip">닫기 ✕</button></div><p class="ms-intro">계수 옆에 오른쪽 상수를 붙인 <strong>첨가 행렬</strong>입니다. 컴퓨터가 행 전체를 같은 규칙으로 바꾸어 미지수를 하나씩 남깁니다.</p><div class="ms-controls"><button id="msPrev" class="ml-chip" ${at===0?'disabled':''}>이전 단계</button><button id="msPlay" class="ml-chip">${last?'풀이 완료':running?'일시정지':'자동 재생 ▶'}</button><button id="msNext" class="ml-chip" ${last?'disabled':''}>한 단계 보기 →</button><button id="msReset" class="ml-chip">처음부터</button><label>속도 <select id="msSpeed"><option value="900">천천히</option><option value="450">보통</option><option value="180">빠르게</option></select></label><span>${at} / ${lesson.steps.length}단계</span></div><div class="ms-operation"><strong id="msOperation">${last?'왼쪽을 단위행렬로 만들었습니다':operation(step)}</strong><p id="msReason">${last?'각 행에 미지수가 하나씩 남았습니다. 오른쪽 열에서 해를 읽을 수 있습니다.':reason(step)}</p><p id="msPhase" role="status">${last?'풀이 완료':'주황색은 바꿀 행, 파란색은 가져올 행입니다. R은 행(row)을 뜻합니다.'}</p></div><div class="ms-two"><section class="ms-panel"><h3>행렬에서 보기 <span>주황: 바꿀 행 · 파랑: 가져올 행</span></h3><div id="msMatrix">${matrix(current,step)}</div></section><section class="ms-panel"><h3>같은 내용을 방정식으로</h3><div id="msEquations">${current.map((r,i)=>`<div data-eqrow="${i}" class="ms-eq ${step&&i===step.target?'ms-target ':''}${step&&i===step.source?'ms-source':''}">${equation(r)}</div>`).join('')}</div><p>상수까지 함께 연산하므로 원래 식의 해를 유지합니다.</p></section></div><section class="ms-panel ms-calculation"><h3>컴퓨터의 계산 과정</h3><div id="msCells">${last?`<div class="ms-answer">${lesson.solution.map((v,i)=>`${['x','y','z'][i]} = ${text(v)}`).join('　 · 　')}</div><p>원래 식에 대입해도 성립합니다: ${lesson.initial.map(r=>text(r.slice(0,3).reduce((s,v,i)=>add(s,mul(v,lesson.solution[i])),q(0)))+' = '+text(r[3])).join(' / ')}</p>`:'<p>재생하면 x 계수 → y 계수 → z 계수 → 상수 순서로 계산을 보여 줍니다.</p>'}</div></section><p class="ms-note">행 전체에 0이 아닌 수를 곱하거나, 다른 행의 배수를 더하면 해는 바뀌지 않습니다. 앞에서 계수 한 칸만 수정해 식 자체를 바꾼 활동과 구분해 보세요. 이 방법을 가우스–조르당 소거법이라고 합니다.</p>`;
 id('msSpeed').value=phase||'450';id('msSpeed').onchange=e=>{phase=e.target.value;};
 id('msClose').onclick=()=>dialog.close();id('msPrev').onclick=()=>{cancel();at=Math.max(0,at-1);render();};id('msReset').onclick=()=>{cancel();at=0;render();};
 id('msNext').onclick=()=>{if(!busy)advance();};id('msPlay').disabled=last;id('msPlay').onclick=()=>{if(running||busy){cancel();render();}else{running=true;id('msPlay').textContent='일시정지';advance();}};
 if(last&&!finished){finished=true;done?.();}
}
function advance(){if(busy||at>=lesson.steps.length)return;busy=true;const mine=++token,s=lesson.steps[at];id('msNext').disabled=true;id('msPrev').disabled=true;id('msPlay').textContent='일시정지';id('msCells').innerHTML='';
 const wait=fn=>{timer=setTimeout(()=>{if(mine!==token||!dialog.open)return;fn();},Number(id('msSpeed').value));};
 let c=0;id('msPhase').textContent='① 연산할 행을 선택합니다';
 const tick=()=>{
 if(c<4){id('msPhase').textContent=`② ${['x 계수','y 계수','z 계수','오른쪽 상수'][c]}를 계산합니다`;
 dialog.querySelectorAll('.ms-current').forEach(n=>n.classList.remove('ms-current'));
 dialog.querySelectorAll(`#msMatrix [data-c="${c}"]`).forEach(n=>{if(Number(n.dataset.r)===s.target||Number(n.dataset.r)===s.source&&s.source!==null)n.classList.add('ms-current');});
 const box=document.createElement('div');box.className='ms-cell-calculation';let calc=s.kind==='swap'?`${text(s.before[s.source][c])} (행 교환)`:s.kind==='scale'?`(${text(s.before[s.target][c])}) × (${text(s.factor)})`:`(${text(s.before[s.target][c])}) + (${text(s.factor)}) × (${text(s.before[s.source][c])})`;
 box.innerHTML=`<small>${['x 계수','y 계수','z 계수','상수'][c]}</small><span>${calc} = <b>${text(s.after[s.target][c])}</b></span>`;id('msCells').append(box);c++;wait(tick);
 }else{ id('msMatrix').innerHTML=matrix(s.after,s,true);id('msEquations').innerHTML=s.after.map((r,i)=>`<div class="ms-eq ${i===s.target?'ms-target ms-result':''}">${equation(r)}</div>`).join('');id('msPhase').textContent='③ 계산한 행으로 바꿉니다. 상수도 함께 바뀌었는지 보세요.';wait(()=>{at++;busy=false;render();if(running&&at<lesson.steps.length)wait(advance);else running=false;});}
 };wait(tick);
}
function open(input,onDone){cancel();returnTo=document.activeElement;lesson=solve(input);at=0;done=onDone;finished=false;render();dialog.showModal();id('msPlay').focus();}
dialog.addEventListener('close',()=>{cancel();if(returnTo?.isConnected)returnTo.focus();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&dialog.open){cancel();render();}});
scope.MatrixSolver={open};
})(typeof window!=='undefined'?window:globalThis);
