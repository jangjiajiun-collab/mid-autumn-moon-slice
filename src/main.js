import './style.css';

const card=document.querySelector('#card');
const video=document.querySelector('#childVideo');
const intro=document.querySelector('#intro');
const ending=document.querySelector('#ending');
const start=document.querySelector('#start');
const again=document.querySelector('#again');
const status=document.querySelector('#status');
const notice=document.querySelector('#notice');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const scene=document.querySelector('#scene');
const wash=document.querySelector('.impact-wash');
const filmStart=2.72,filmImpact=3.54;
const filmEnd=5.20;
let phase='idle',startedAt=0,impactAt=-1,pausedAt=0,effects=null,webglFailed=false;
let pointer=null,requestedByKeyboard=false,videoUnavailable=false,run=0,endHeld=false;

const phaseCopy={idle:['01','月下，蓄勢','滑動開啟祝福'],charge:['02','聚起月光','準備出招'],strike:['03','一刀，分月','月餅已斬開'],moon:['04','刀氣入月','把祝福送到月亮上'],settle:['05','月色，復圓','願此刻，皆團圓'],ending:['06','心意，已送達','中秋快樂']};
function setPhase(next){phase=next;card.dataset.phase=next;const [n,label,footer]=phaseCopy[next];document.querySelector('#chapterNumber').textContent=n;document.querySelector('#chapterLabel').textContent=label;document.querySelector('#phaseLabel').textContent=footer;}
function announce(text){status.textContent=text;}
function showNotice(text){notice.textContent=text;notice.hidden=false;}

// UI remains usable if WebGL, a GPU context, or the optional visual module fails.
import('./effects.js').then(({createEffects})=>{
  try {effects=createEffects(document.querySelector('#webgl'),reduced);}catch(error){webglFailed=true;console.warn('WebGL unavailable, using the film greeting.',error);}
}).catch(error=>{webglFailed=true;console.warn('Visual effects unavailable.',error);});
document.querySelector('#webgl').addEventListener('webglcontextlost',e=>{e.preventDefault();webglFailed=true;effects=null;});

video.muted=true;video.defaultMuted=true;
video.addEventListener('loadedmetadata',()=>{
  if(phase==='idle') video.currentTime=3.10;
});
video.addEventListener('error',()=>{videoUnavailable=true;showNotice('影片暫時無法載入；你仍可滑動送出中秋祝福。');});
video.addEventListener('loadeddata',()=>{videoUnavailable=false;});

async function begin(event){
  if(phase!=='idle')return;
  const thisRun=++run;
  requestedByKeyboard=event?.type==='click'&&event.detail===0;
  notice.hidden=true;ending.hidden=true;intro.inert=true;intro.setAttribute('aria-hidden','true');
  setPhase('charge');startedAt=performance.now();impactAt=-1;endHeld=false;
  announce('小劍士聚起月光，準備斬開月餅。');
  try{
    video.playbackRate=reduced?1:.85;
    if(video.readyState>=1)video.currentTime=filmStart;
    else video.addEventListener('loadedmetadata',()=>{if(thisRun===run&&phase==='charge')video.currentTime=filmStart;},{once:true});
    // Call play directly from the user's gesture for iOS Safari.
    await video.play();
  }catch(error){
    if(thisRun!==run)return;
    videoUnavailable=true;
    showNotice('影片未能播放。這次先用定格畫面送出祝福，稍後可再試一次。');
  }
}
function impact(now){
  if(impactAt>=0)return;
  impactAt=now;setPhase('strike');video.pause();
  announce('月餅被劈成兩半，金色蛋黃與碎屑散開。');
}
function finish(){
  setPhase('ending');video.playbackRate=1;
  ending.hidden=false;intro.inert=true;
  announce('中秋節快樂，月圓人團圓。可以再斬一次。');
  if(requestedByKeyboard)again.focus({preventScroll:true});
}
function reset(){
  ++run;impactAt=-1;startedAt=0;pointer=null;pausedAt=0;endHeld=false;video.pause();video.playbackRate=1;
  if(video.readyState>=1)video.currentTime=3.1;
  ending.hidden=true;intro.inert=false;intro.removeAttribute('aria-hidden');notice.hidden=true;
  scene.style.transform='';wash.style.opacity=0;
  setPhase('idle');announce('準備好了。滑動或點擊，再斬一次。');if(requestedByKeyboard)start.focus({preventScroll:true});
}
start.addEventListener('click',begin);again.addEventListener('click',reset);
card.addEventListener('pointerdown',e=>{
  if(phase!=='idle'||e.target.closest('button')||(e.pointerType==='mouse'&&e.button!==0))return;
  pointer={x:e.clientX,y:e.clientY,id:e.pointerId};card.setPointerCapture(e.pointerId);
});
card.addEventListener('pointermove',e=>{if(pointer&&Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y)>38){pointer=null;begin(e);}});
for(const type of ['pointerup','pointercancel','lostpointercapture'])card.addEventListener(type,()=>pointer=null);

let last=0;
function frame(now){
  requestAnimationFrame(frame);
  if(document.hidden||now-last<1000/(reduced?24:45))return;
  last=now;
  const elapsed=startedAt?(now-startedAt)/1000:0;
  if(phase==='charge'&&((video.currentTime>=filmImpact&&elapsed>.35)||elapsed>6||(videoUnavailable&&elapsed>1.1)))impact(now);
  const age=impactAt<0?-1:(now-impactAt)/1000;
  if(age>=0&&phase!=='ending'){
    if(!endHeld&&video.currentTime>=filmEnd){endHeld=true;video.pause();video.currentTime=filmEnd;}
    if(age>.13&&!endHeld&&video.paused&&!video.ended&&!videoUnavailable){video.playbackRate=age<.95?.18:1;video.play().catch(()=>{});}
    if(age>.95&&video.playbackRate!==1)video.playbackRate=1;
    if(age>.75&&phase==='strike')setPhase('moon');
    if(age>2.7&&phase==='moon')setPhase('settle');
    if(age>4.9)finish();
    const strength=reduced?0:Math.max(0,1-age/.5)*6;
    scene.style.transform=strength?`translate(${Math.sin(now*.07)*strength}px,${Math.cos(now*.09)*strength*.65}px)`:'';
    wash.style.opacity=reduced?'0':String(Math.max(0,1-age/.22)*.34);
  }
  if(effects&&!webglFailed)effects.render(now,phase,elapsed,age);
}
requestAnimationFrame(frame);
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){pausedAt=performance.now();video.pause();}
  else if(pausedAt){const gap=performance.now()-pausedAt;if(startedAt)startedAt+=gap;if(impactAt>=0)impactAt+=gap;pausedAt=0;if(!['idle','ending'].includes(phase))video.play().catch(()=>{});}
});
video.addEventListener('ended',()=>video.pause());
