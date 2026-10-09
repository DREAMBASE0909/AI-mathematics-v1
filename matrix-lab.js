/* Matrix activities: arithmetic is automatic; progress follows student actions. */
(() => {
  'use strict';
  const titles = ['계수 정리', '숫자로 그리는 그림', '어두운 사진 복원', '무늬 판별기 조정', '한꺼번에 처리하기'];
  const goals = [
    '행렬 공장 Lv.1 · 목표 1분 30초',
    '픽셀과 행렬을 오가며 배송 상자의 + 표시를 완성해 보세요.',
    '더하기와 곱하기를 비교하고, 무늬를 살려 사진을 밝혀 보세요.',
    '중요하게 볼 픽셀을 바꿔 가로선과 세로선을 구분해 보세요.',
    '입력 이미지를 행으로 묶고, 각 이미지의 판별 점수가 어디에 나오는지 찾아보세요.'
  ];
  const shell=LearningShell.create();
  const root=shell.root;
  const el = id => document.getElementById(id);
  let level = 1, testing = false, data, complete, opener, cost = 0;
  const key = () => `ai-matrix-lab-v1-${testing ? 'test' : 'play'}-${level}`;
  const fresh = () => ({coefficients:['','','',''],hint:0,slots:Array(6).fill(null),selected:null,equationRow:false,equationCol:false,equationChanged:false,equationFocus:null,solverSeen:false,scene:0,row:false,col:false,pixels:Array(9).fill(0),pixelEdit:false,numberEdit:false,amount:0,mode:'add',seenAdd:false,seenMultiply:false,clipped:false,weights:[0,0,0,0],sample:0,checked:[],order:[],focusRow:null,focusCol:null,matched:[],ran:false});
  const persist = () => {try {localStorage.setItem(key(),JSON.stringify(data));el('mlSave').textContent=testing?'테스트에서는 자금·공장·연구 기록이 바뀌지 않습니다.':'조작한 내용은 자동 저장됩니다.';} catch {el('mlSave').textContent='이 브라우저에서는 활동을 저장할 수 없습니다.';}};
  function start(l, options={}) {
    opener=document.activeElement; level=l; testing=options.test===true; complete=options.onComplete; cost=options.cost||0;
    data=fresh();try {const saved=JSON.parse(localStorage.getItem(key()));if(saved&&Array.isArray(saved.slots)&&saved.slots.length===6&&Array.isArray(saved.pixels)&&saved.pixels.length===9&&Array.isArray(saved.weights)&&saved.weights.length===4)data={...data,...saved};}catch{}
    el('mlBadge').textContent=`${testing?'자유 테스트 · ':''}Lv.${level} / 5`;
    el('mlTitle').textContent=titles[level-1];el('mlGoal').textContent=goals[level-1];
    el('mlTabs').hidden=!testing;el('mlTabs').innerHTML=titles.map((t,i)=>`<button data-level="${i+1}" aria-current="${level===i+1?'step':'false'}">Lv.${i+1}</button>`).join('');
    el('mlTabs').querySelectorAll('button').forEach(b=>b.onclick=()=>start(Number(b.dataset.level),{test:true}));
    draw();if(!root.open)root.showModal();if(level===1)el('mlBody').querySelector('input')?.focus();else el('mlClose').focus();
  }
  const button=(label,fn,cls='ml-chip')=>{const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=label;b.onclick=fn;return b;};
  const panel=(title,content)=>`<section class="ml-panel"><h3>${title}</h3>${content}</section>`;
  let activityReady=false;
  function update(ready, message) {activityReady=ready;el('mlStatus').textContent=message;el('mlStatus').className=ready?'ml-success':'';el('mlFinish').disabled=!ready;el('mlFinish').textContent=level===1?(testing?'완료하고 가동하기 → (테스트)':'완료하고 가동하기 →'):testing?'체험 완료':`연구 완료 · ${cost.toLocaleString('ko-KR')}원으로 업그레이드`;persist();}
  function draw(){activityReady=false;window.MatrixSolver?.stop();el('mlSceneControls').replaceChildren();el('mlDreamText').textContent=goals[level-1];root.classList.toggle('ml-coefficient-mode',level===1);root.classList.remove('ml-story-mode');el('mlBody').innerHTML='';[arrange,pixels,brightness,weights,batch][level-1]();}
  function arrange(){MatrixLevelOne.mount({host:el('mlBody'),shell,state:data,onChange:persist,onReady:update});}
  const target=[0,1,0,1,1,1,0,1,0];
  function grid(values,interactive,label,onClick){const div=document.createElement('div');div.className='ml-pixels';div.setAttribute('role','group');div.setAttribute('aria-label',label);values.forEach((v,i)=>{const b=document.createElement(interactive?'button':'span');b.className='ml-pixel';b.style.background=`rgb(${v*255},${v*255},${v*255})`;b.setAttribute('aria-label',`${Math.floor(i/3)+1}행 ${i%3+1}열 ${v?'흰색':'검정'}`);if(interactive){b.type='button';b.setAttribute('aria-pressed',String(!!v));b.onclick=()=>onClick(i);}div.append(b);});return div;}
  function pixels(){
    el('mlBody').innerHTML=`<div class="ml-three">${panel('목표 · 배송 표시','<div id="mlTarget"></div><p>0 = 검정 / 1 = 흰색</p>')}${panel('01 · 픽셀 칠하기','<div id="mlPaint"></div><p>칸을 누르면 색이 바뀝니다.</p>')}${panel('02 · 숫자로 수정하기','<div id="mlNumbers" class="ml-numbers ml-notation"></div><p>숫자를 누르면 0 ↔ 1로 바뀝니다.</p>')}</div><p class="ml-note">그림의 위치와 행렬의 위치가 같습니다. 픽셀과 숫자 양쪽에서 한 번 이상 바꿔 목표를 완성하세요.</p>`;
    el('mlTarget').append(grid(target,false,'목표 더하기 표시'));
    el('mlPaint').append(grid(data.pixels,true,'직접 그리는 이미지',i=>{data.pixels[i]=1-data.pixels[i];data.pixelEdit=true;draw();}));
    data.pixels.forEach((v,i)=>{const b=button(String(v),()=>{data.pixels[i]=1-v;data.numberEdit=true;draw();});b.setAttribute('aria-label',`${Math.floor(i/3)+1}행 ${i%3+1}열 값 ${v} 변경`);el('mlNumbers').append(b);});
    const same=data.pixels.every((v,i)=>v===target[i]);update(same&&data.pixelEdit&&data.numberEdit,same?(data.pixelEdit&&data.numberEdit?'완성! 픽셀 하나가 행렬의 숫자 하나에 대응합니다.':'픽셀 화면과 숫자 화면에서 모두 값을 바꿔 보세요.'):'픽셀과 숫자 양쪽을 사용해 목표 표시를 완성하세요.');
  }
  const dark=[20,60,20,60,100,60,20,60,20];
  function brightness(){
    el('mlBody').innerHTML=`<div class="ml-two">${panel('원본 · 어두운 사진','<div id="mlDark" class="ml-tones"></div><p>밝기 범위: 0(검정) ~ 255(흰색)</p>')}${panel('조정한 사진','<div id="mlBright" class="ml-tones"></div><p id="mlBrightnessInfo"></p>')}</div><section class="ml-panel"><div class="ml-chips"><button class="ml-chip" id="mlAdd">일정한 값 더하기</button><button class="ml-chip" id="mlMultiply">일정한 배수 곱하기</button></div><label class="ml-slider" for="mlAmount"><span id="mlAmountLabel"></span><input id="mlAmount" type="range" min="0" max="250" step="10"><output id="mlAmountValue"></output></label><p id="mlFormula" class="ml-formula"></p><div id="mlBrightChecks" class="ml-checks"></div></section>`;
    const tone=(host,vs)=>{host.replaceChildren();vs.forEach(v=>{const s=document.createElement('span');s.style.background=`rgb(${v},${v},${v})`;s.style.color=v>140?'#182730':'#fff';s.textContent=String(v);host.append(s);});};tone(el('mlDark'),dark);
    const updateBright=()=>{const multiply=data.mode==='multiply',raw=dark.map(v=>multiply?v*data.amount:v+data.amount),vs=raw.map(v=>Math.min(255,Math.round(v)));tone(el('mlBright'),vs);const clipped=raw.some(v=>v>255);if(clipped)data.clipped=true;
      el('mlAmountLabel').textContent=multiply?'곱할 배수':'더할 밝기';el('mlAmountValue').textContent=data.amount+(multiply?'배':'');el('mlFormula').textContent=multiply?`중앙 픽셀: 100 × ${data.amount} = ${Math.round(raw[4])}${raw[4]>255?' → 255로 제한':''}`:`중앙 픽셀: 100 + ${data.amount} = ${raw[4]}${raw[4]>255?' → 255로 제한':''}`;
      el('mlBrightnessInfo').textContent=clipped?'255를 넘는 값은 모두 흰색이 됩니다. 밝은 부분의 차이가 사라질 수 있어요.':`중앙 밝기 ${vs[4]} / 목표 180~240 · 중앙과 모서리 차이 ${vs[4]-vs[0]} / 목표 100 이상`;
      el('mlBrightChecks').textContent=`${data.seenAdd?'✓':'○'} 더하기 실험　${data.seenMultiply?'✓':'○'} 곱하기 실험　${data.clipped?'✓':'○'} 밝기 범위 초과 관찰`;
      const ready=data.seenAdd&&data.seenMultiply&&data.clipped&&!clipped&&vs[4]>=180&&vs[4]<=240&&vs[4]-vs[0]>=100;
      update(ready,ready?'복원 완료! 곱하기는 픽셀 사이의 밝기 차이도 바꿉니다.':'두 방식을 시험하고 밝기 한계를 넘겨 보세요. 마지막에는 중앙 밝기 180~240, 중앙과 모서리 밝기 차이 100 이상으로 복원하세요.');
    };
    const setMode=mode=>{data.mode=mode;data.amount=mode==='add'?0:1;draw();};el('mlAdd').onclick=()=>setMode('add');el('mlMultiply').onclick=()=>setMode('multiply');el('mlAdd').setAttribute('aria-pressed',String(data.mode==='add'));el('mlMultiply').setAttribute('aria-pressed',String(data.mode==='multiply'));
    const slider=el('mlAmount');if(data.mode==='multiply'){slider.max='4';slider.min='1';slider.step='0.1';}slider.value=String(data.amount);slider.oninput=()=>{data.amount=Number(slider.value);if(data.mode==='add'&&data.amount>0)data.seenAdd=true;if(data.mode==='multiply'&&data.amount>1)data.seenMultiply=true;updateBright();};updateBright();
  }
  const samples=[[1,0,1,0],[1,1,0,0]],sampleNames=['세로선','가로선'];
  const dot=(a,b)=>a.reduce((sum,v,i)=>sum+v*b[i],0);
  function weights(){
    el('mlBody').innerHTML=`<div class="ml-two">${panel('입력 · 2 × 2 이미지','<div id="mlSamples" class="ml-chips"></div><div id="mlInput" class="ml-four"></div><p>이 활동에서는 검정 0, 흰색 1로 표현합니다.</p>')}${panel('세로선 판별기의 가중치','<div id="mlWeights" class="ml-weight-grid"></div><p>흰 픽셀에 양수 가중치를 주면 점수가 올라가고, 음수를 주면 내려갑니다.</p>')}</div><section class="ml-panel"><h3 id="mlPrediction"></h3><p id="mlWeightFormula" class="ml-formula"></p><div class="ml-meter"><div id="mlScoreBar"></div></div><p>점수가 0보다 크면 세로선, 작으면 가로선, 0이면 보류합니다.</p><button id="mlCheckSamples" class="ml-chip">두 이미지로 검사하기</button><p id="mlWeightResult" role="status"></p></section><p class="ml-note">사람이 가중치를 조정하고, 판별기는 입력 × 가중치의 합을 계산합니다. 자동으로 가중치를 학습하는 단계는 아닙니다.</p>`;
    samples.forEach((_,i)=>{const b=button(sampleNames[i],()=>{data.sample=i;draw();});b.setAttribute('aria-pressed',String(data.sample===i));el('mlSamples').append(b);});
    samples[data.sample].forEach(v=>{const s=document.createElement('span');s.style.background=v?'#fff':'#203139';s.style.color=v?'#203139':'#fff';s.textContent=String(v);el('mlInput').append(s);});
    const refresh=()=>{const input=samples[data.sample],score=dot(input,data.weights);el('mlPrediction').textContent=`${sampleNames[data.sample]} 입력 → ${score>0?'세로선':score<0?'가로선':'판정 보류'} (점수 ${score})`;el('mlWeightFormula').textContent=input.map((v,i)=>`${v} × (${data.weights[i]})`).join(' + ')+` = ${score}`;el('mlScoreBar').style.width=`${50+score/12*50}%`;persist();};
    data.weights.forEach((v,i)=>{const label=document.createElement('label');label.innerHTML=`${Math.floor(i/2)+1}행 ${i%2+1}열 <output>${v}</output><input aria-label="${Math.floor(i/2)+1}행 ${i%2+1}열 가중치" type="range" min="-3" max="3" step="1" value="${v}">`;label.querySelector('input').oninput=e=>{data.weights[i]=Number(e.target.value);label.querySelector('output').textContent=e.target.value;data.checked=[];el('mlWeightResult').textContent='값이 바뀌었습니다. 두 이미지로 다시 검사하세요.';update(false,'가중치를 조절한 뒤 두 이미지를 검사하세요.');refresh();};el('mlWeights').append(label);});
    el('mlCheckSamples').onclick=()=>{data.checked=samples.map((s,i)=>i===0?dot(s,data.weights)>0:dot(s,data.weights)<0);el('mlWeightResult').textContent=data.checked.map((ok,i)=>`${sampleNames[i]}: ${ok?'통과':'다시 조정'}`).join(' / ');update(data.checked.every(Boolean),data.checked.every(Boolean)?'두 무늬를 구분했습니다. 어떤 위치의 가중치가 차이를 만들었나요?':'세로선에만 흰색인 왼쪽 아래는 양수, 가로선에만 흰색인 오른쪽 위는 음수로 바꿔 보세요.');};refresh();update(data.checked.length===2&&data.checked.every(Boolean),'세로선에는 양수 점수, 가로선에는 음수 점수가 나오도록 조절하고 검사하세요.');
  }
  const batchInputs=[[1,0,1,0],[1,1,0,0],[1,0,1,0]],batchWeights=[[1,1],[-1,1],[1,-1],[-1,-1]];
  const outputs=batchInputs.map(row=>[0,1].map(c=>row.reduce((s,v,i)=>s+v*batchWeights[i][c],0)));
  function batch(){
    el('mlBody').innerHTML=`<section class="ml-panel"><h3>01 · 이미지를 행으로 쌓기</h3><p>A → B → C 순서로 눌러 입력 행렬 X를 만드세요. 각 이미지는 왼쪽 위부터 행 순서로 펼칩니다.</p><div id="mlBatchCards" class="ml-chips"></div><p id="mlBatchHint" role="status"></p></section><div class="ml-three">${panel('입력 X · 3 × 4','<div id="mlX" class="ml-matrix"></div>')}${panel('가중치 W · 4 × 2','<div class="ml-chips" id="mlColumns"></div><div id="mlW" class="ml-matrix"></div>')}${panel('출력 XW · 3 × 2','<div id="mlY" class="ml-matrix"></div>')}</div><section class="ml-panel"><button class="ml-chip" id="mlRunBatch">개별 계산과 일괄 계산 비교</button><p id="mlBatchCompare" class="ml-formula"></p><p>입력의 행과 가중치의 열을 선택한 뒤, 대응하는 출력 칸을 누르세요. 각 이미지에서 한 칸씩 연결해 보세요.</p><p id="mlBatchFeedback" role="status"></p></section><p class="ml-note">출력의 행은 이미지, 열은 판별 점수에 대응합니다. 행렬곱은 여러 곱과 합을 묶어 표현합니다.</p>`;
    batchInputs.forEach((s,i)=>{const b=button(`${'ABC'[i]} · ${i===1?'가로선':'세로선'} [${s.join(', ')}]`,()=>{if(i!==data.order.length){el('mlBatchHint').textContent='A → B → C 순서로 쌓아 보세요.';return;}data.order.push(i);draw();});b.disabled=data.order.includes(i);el('mlBatchCards').append(b);});
    for(let r=0;r<3;r++){const b=button(data.order.includes(r)?`${'ABC'[r]}　${batchInputs[r].join('　')}`:'빈 행',()=>{if(!data.order.includes(r))return;data.focusRow=r;draw();});b.disabled=!data.ran;b.setAttribute('aria-pressed',String(data.focusRow===r));el('mlX').append(b);}
    for(let c=0;c<2;c++){const b=button(c?'가로 점수 열':'세로 점수 열',()=>{data.focusCol=c;draw();});b.disabled=!data.ran;b.setAttribute('aria-pressed',String(data.focusCol===c));el('mlColumns').append(b);}
    batchWeights.forEach(row=>{const div=document.createElement('div');div.className='ml-matrix-row';row.forEach((v,c)=>{const span=document.createElement('span');span.textContent=v;span.classList.toggle('ml-highlight',c===data.focusCol);div.append(span);});el('mlW').append(div);});
    outputs.forEach((row,r)=>{const div=document.createElement('div');div.className='ml-matrix-row';row.forEach((v,c)=>{const b=button(data.ran?String(v):'?',()=>{if(data.focusRow===null||data.focusCol===null){el('mlBatchFeedback').textContent='입력의 행과 가중치의 열을 먼저 선택하세요.';return;}if(data.focusRow!==r||data.focusCol!==c){el('mlBatchFeedback').textContent='선택한 이미지의 행과 점수의 열이 만나는 칸을 찾아보세요.';return;}if(!data.matched.includes(r))data.matched.push(r);el('mlBatchFeedback').textContent=`${'ABC'[r]} 이미지 × ${c?'가로':'세로'} 점수 가중치 → ${v}`;update(data.matched.length===3,`이미지 ${data.matched.length} / 3개의 출력 위치 확인${data.matched.length===3?' · 모든 연결을 완성했습니다!':''}`);});b.disabled=!data.ran;b.setAttribute('aria-label',`${'ABC'[r]} 이미지 ${c?'가로':'세로'} 점수 ${data.ran?v:'미계산'}`);div.append(b);});el('mlY').append(div);});
    el('mlRunBatch').disabled=data.order.length!==3;el('mlRunBatch').onclick=()=>{data.ran=true;draw();};el('mlBatchCompare').textContent=data.ran?'개별: A [2, 0] · B [0, 2] · C [2, 0] = 행렬곱의 각 행 ✓':'이미지 3개를 먼저 쌓아 주세요.';
    update(data.matched.length===3,data.ran?`이미지 ${data.matched.length} / 3개의 출력 위치 확인`:`입력 ${data.order.length} / 3개 배치`);
  }
  shell.setCompletion(()=>activityReady&&(level!==1||MatrixLevelOne.correct(data?.coefficients)),()=>{if(testing){el('mlStatus').textContent='체험 완료! 위의 다른 레벨을 누르거나 닫아 게임으로 돌아가세요.';return;}const result=complete?.();if(result===false){el('mlStatus').textContent='업그레이드할 자금이나 공장 상태를 확인해 주세요. 활동 내용은 저장되어 있습니다.';return;}root.close();});
  el('mlClose').onclick=()=>root.close();root.addEventListener('close',()=>{window.MatrixSolver?.stop();persist();if(opener?.isConnected)opener.focus();});
  el('mlRestart').onclick=()=>{data=fresh();draw();};
  window.MatrixLab={start,clear:()=>{for(let l=1;l<=5;l++)for(const m of ['test','play'])try{localStorage.removeItem(`ai-matrix-lab-v1-${m}-${l}`);}catch{}}};
  const testButton=button('행렬 학습 테스트',()=>start(1,{test:true}));testButton.id='testMatrixLab';document.querySelector('.test-tools').prepend(testButton);
})();
