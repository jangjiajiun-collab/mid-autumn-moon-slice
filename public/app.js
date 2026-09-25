import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';

const card = document.querySelector('#card');
const canvas = document.querySelector('#webgl');
const start = document.querySelector('#start');
const again = document.querySelector('#again');
const mooncake = document.querySelector('#mooncake');
const slash = document.querySelector('#slash');
const flash = document.querySelector('#flash');
const ending = document.querySelector('#ending');
const prompt = document.querySelector('#prompt');
const hint = document.querySelector('#hint');
const childVideo = document.querySelector('#childVideo');
let armed = false, cut = false, pointer = null;

const renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:false, powerPreference:'low-power'});
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
const scene = new THREE.Scene(); const camera = new THREE.OrthographicCamera(-1,1,1,-1,0,1);
const count = 360, positions = new Float32Array(count*3), colors = new Float32Array(count*3), speeds=[];
for(let i=0;i<count;i++){ const a=Math.random()*Math.PI*2,r=.12+Math.random()*1.1; positions.set([Math.cos(a)*r,(Math.random()-.45)*1.7,0],i*3); colors.set([.2+Math.random()*.2,.65+Math.random()*.35,1],i*3); speeds.push(.001+Math.random()*.004); }
const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.BufferAttribute(positions,3)); geo.setAttribute('color',new THREE.BufferAttribute(colors,3));
const particles=new THREE.Points(geo,new THREE.PointsMaterial({size:.014,vertexColors:true,transparent:true,opacity:.72,blending:THREE.AdditiveBlending,depthWrite:false})); scene.add(particles);
function resize(){ const {clientWidth:w,clientHeight:h}=card; renderer.setSize(w,h,false); camera.left=-w/h;camera.right=w/h;camera.updateProjectionMatrix(); } addEventListener('resize',resize);resize();
function tick(t){ const a=geo.attributes.position.array; for(let i=0;i<count;i++){a[i*3+1]+=speeds[i]*(armed?1:.32); if(a[i*3+1]>1.15)a[i*3+1]=-1.1;}geo.attributes.position.needsUpdate=true;particles.rotation.z=t*.00008;renderer.render(scene,camera);requestAnimationFrame(tick);}requestAnimationFrame(tick);
function playChild(){ childVideo.currentTime=0; childVideo.play().catch(()=>{}); }
function arm(){ if(armed)return; armed=true; playChild(); start.classList.add('hide'); prompt.textContent='月餅來了'; hint.textContent='滑動，釋放月光一閃'; }
function reset(){ cut=false; armed=true; playChild(); ending.classList.remove('show'); ending.setAttribute('aria-hidden','true'); mooncake.style.opacity='1'; mooncake.style.transform='translate(-50%,-50%) scale(1)'; card.classList.remove('impact','shake'); prompt.textContent='再來一刀'; hint.textContent='滑動，釋放月光一閃'; }
function perform(){ if(!armed||cut)return;cut=true;prompt.textContent='月光一閃';hint.textContent='';slash.classList.remove('fire');flash.classList.remove('fire');void slash.offsetWidth;slash.classList.add('fire');flash.classList.add('fire');card.classList.add('shake');
  setTimeout(()=>{mooncake.style.opacity='0';},10);
  setTimeout(()=>{card.classList.add('impact');},260);
  setTimeout(()=>{prompt.textContent='蛋黃爆裂';},620);
  setTimeout(()=>{ending.classList.add('show');ending.setAttribute('aria-hidden','false');},1550);
}
// Pointer motion works for both touch and mouse; a short sweep is intentionally forgiving on iPhone.
card.addEventListener('pointerdown',e=>{ if(!armed)arm(); pointer={x:e.clientX,y:e.clientY}; card.setPointerCapture?.(e.pointerId); });
card.addEventListener('pointermove',e=>{ if(pointer&&!cut&&Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y)>42)perform(); });
card.addEventListener('pointerup',()=>pointer=null); start.addEventListener('click',arm); again.addEventListener('click',reset);
