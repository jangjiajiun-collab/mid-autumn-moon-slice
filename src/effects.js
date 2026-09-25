import * as THREE from 'three';

const clamp = THREE.MathUtils.clamp;
const ease = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const smooth = (a, b, x) => THREE.MathUtils.smoothstep(x, a, b);
const vertex = `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const moonFragment = `
  varying vec2 vUv; uniform float crack;
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
  void main(){
    vec2 p=(vUv-.5)*2.;float r=length(p);if(r>1.)discard;
    float n=noise(p*5.)*.5+noise(p*13.)*.26+noise(p*32.)*.14+noise(p*75.)*.06;
    float shade=sqrt(max(0.,1.-r*r));
    vec3 c=mix(vec3(.41,.39,.28),vec3(1.,.94,.71),n*.8+shade*.3+.23);
    c*=.89+.15*p.y;
    float cut=abs(p.y-p.x*.42-noise(p*18.)*.025);
    float line=(1.-smoothstep(.008,.024,cut))*crack;
    c+=vec3(.43,1.,1.)*line*1.8;
    float glow=exp(-cut*19.)*crack;c+=vec3(.03,.25,.35)*glow;
    gl_FragColor=vec4(c,smoothstep(1.,.987,r));
  }`;

function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const ctx = c.getContext('2d'); const g = ctx.createRadialGradient(32,32,0,32,32,32);
  g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.15,'rgba(255,255,255,.6)');g.addColorStop(.45,'rgba(255,255,255,.12)');g.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=g;ctx.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);
}

export function createEffects(canvas, reduced) {
  const renderer = new THREE.WebGLRenderer({canvas,alpha:true,antialias:false,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1,1.5));
  renderer.setClearColor(0,0);
  const scene = new THREE.Scene(); const camera = new THREE.OrthographicCamera(0,1,1,0,.1,3000);
  camera.position.z=1000;
  scene.add(new THREE.AmbientLight(0xc9def3,2.3));
  const light=new THREE.DirectionalLight(0xffe7a4,3.2);light.position.set(-120,250,500);scene.add(light);
  const tex=glowTexture();
  function glow(color,opacity){return new THREE.Sprite(new THREE.SpriteMaterial({map:tex,color,opacity,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));}
  const moon=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:moonFragment,uniforms:{crack:{value:0}},transparent:true,depthWrite:false}));
  const moonHalo=glow(0xedcf80,.33);scene.add(moonHalo,moon);
  const shock=new THREE.Mesh(new THREE.RingGeometry(.96,1,96),new THREE.MeshBasicMaterial({color:0xffd995,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(shock);

  const lanterns=[];
  for(let i=0;i<2;i++){
    const group=new THREE.Group();
    const body=new THREE.Mesh(new THREE.SphereGeometry(15,16,12),new THREE.MeshStandardMaterial({color:0x913c24,emissive:0xef762a,emissiveIntensity:.58,roughness:1}));
    body.scale.set(1,1.4,.75);group.add(body);
    for(const y of [-21,21]){const cap=new THREE.Mesh(new THREE.CylinderGeometry(12,12,3,18),new THREE.MeshStandardMaterial({color:0xd2aa65,metalness:.5,roughness:.5}));cap.position.y=y;group.add(cap);}
    const string=new THREE.Mesh(new THREE.CylinderGeometry(.4,.4,150,5),new THREE.MeshBasicMaterial({color:0x978e69}));string.position.y=96;group.add(string);
    const tassel=new THREE.Mesh(new THREE.CylinderGeometry(1,3,20,6),new THREE.MeshBasicMaterial({color:0xbd8336}));tassel.position.y=-34;group.add(tassel);
    const aura=glow(0xe88534,.4);aura.scale.set(110,110,1);aura.position.z=-10;group.add(aura);scene.add(group);lanterns.push(group);
  }

  const cake=new THREE.Group();scene.add(cake);const halves=[];
  const radius=46,depth=22;
  for(let side=0;side<2;side++){
    const group=new THREE.Group();const shape=new THREE.Shape();
    const start=side===0?Math.PI/2:-Math.PI/2;
    for(let j=0;j<=70;j++){const a=start+j/70*Math.PI;const r=radius+2.2*Math.cos(a*14);const x=Math.cos(a)*r,y=Math.sin(a)*r;j===0?shape.moveTo(x,y):shape.lineTo(x,y);}shape.closePath();
    const pastry=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:2,bevelThickness:2,bevelSegments:2,steps:1}),[new THREE.MeshStandardMaterial({color:0xc78a3a,roughness:.75,metalness:.12}),new THREE.MeshStandardMaterial({color:0x885020,roughness:1})]);
    group.add(pastry);
    // Each half has its own embossed rim, so the top stays attached when split.
    for(const r of [35,39]){
      const path=new THREE.EllipseCurve(0,0,r,r,start,start+Math.PI,false,0);
      const points=path.getPoints(44).map(p=>new THREE.Vector3(p.x,p.y,depth+3));
      group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),44,1.1,5,false),new THREE.MeshStandardMaterial({color:0xedb866,roughness:.75})));
    }
    for(let j=0;j<6;j++){
      const a=start+(j+.5)/6*Math.PI;
      const petal=new THREE.Mesh(new THREE.TorusGeometry(5,.9,4,10),new THREE.MeshStandardMaterial({color:0x935520,roughness:1}));
      petal.position.set(Math.cos(a)*24,Math.sin(a)*24,depth+2.7);petal.scale.y=.7;petal.rotation.z=a;group.add(petal);
    }
    const filling=new THREE.Mesh(new THREE.SphereGeometry(1,20,16),new THREE.MeshStandardMaterial({color:0x643716,roughness:1}));filling.position.set(side===0?.5:-.5,0,depth/2);filling.scale.set(1,42,9);group.add(filling);
    const yolk=new THREE.Mesh(new THREE.SphereGeometry(1,20,16),new THREE.MeshStandardMaterial({color:0xffad23,emissive:0xf28408,emissiveIntensity:.5,roughness:.65}));yolk.position.set(side===0?1.4:-1.4,0,depth/2);yolk.scale.set(1,19,8.5);group.add(yolk);
    cake.add(group);halves.push(group);
  }
  const cakeAura=glow(0xf9b43a,.2);cakeAura.scale.set(160,160,1);cakeAura.position.z=-30;cake.add(cakeAura);

  const ambientCount=reduced?36:100;
  const ambientPositions=new Float32Array(ambientCount*3);const seeds=Array.from({length:ambientCount},()=>[Math.random(),Math.random(),Math.random()]);
  const ambientGeo=new THREE.BufferGeometry();ambientGeo.setAttribute('position',new THREE.BufferAttribute(ambientPositions,3));
  const ambient=new THREE.Points(ambientGeo,new THREE.PointsMaterial({map:tex,color:0xeacb88,size:5,transparent:true,opacity:.6,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(ambient);

  const debrisCount=reduced?45:170;const debrisGeo=new THREE.IcosahedronGeometry(1,0);
  const crumbs=new THREE.InstancedMesh(debrisGeo,new THREE.MeshStandardMaterial({color:0xe9aa46,roughness:.85,transparent:true}),debrisCount);crumbs.frustumCulled=false;crumbs.visible=false;scene.add(crumbs);
  const bursts=Array.from({length:debrisCount},()=>{const a=Math.random()*Math.PI*2;const s=90+Math.random()*320;return {vx:Math.cos(a)*s,vy:Math.sin(a)*s*.7+60,vz:Math.random()*120,spin:Math.random()*6,size:1.4+Math.random()*3.6};});
  const dummy=new THREE.Object3D();
  const energyPositions=new Float32Array(130*3);const energyGeo=new THREE.BufferGeometry();energyGeo.setAttribute('position',new THREE.BufferAttribute(energyPositions,3));
  const energy=new THREE.Points(energyGeo,new THREE.PointsMaterial({map:tex,color:0x5fefff,size:9,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(energy);
  const slashGroup=new THREE.Group();scene.add(slashGroup);let ribbons=[];
  function ribbon(width,color,z){
    const pts=[];const indices=[];
    for(let i=0;i<=80;i++){const t=i/80;const x=(t-.5)*2;const y=.65*Math.sin(t*Math.PI);const thickness=Math.sin(t*Math.PI)*width;pts.push(x,y-thickness,0,x,y+thickness,0);if(i<80){const n=i*2;indices.push(n,n+1,n+2,n+1,n+3,n+2);}}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));g.setIndex(indices);g.computeVertexNormals();
    const mesh=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,blending:color===0x020916?THREE.NormalBlending:THREE.AdditiveBlending}));mesh.position.z=z;slashGroup.add(mesh);return mesh;
  }
  ribbons=[ribbon(.17,0x020916,210),ribbon(.09,0x0a577a,211),ribbon(.026,0x29ddf7,212),ribbon(.005,0xdfffff,213)];
  let w=1,h=1,mr=80;let cakeX=0,cakeY=0;
  function resize(){w=canvas.clientWidth;h=canvas.clientHeight;renderer.setSize(w,h,false);camera.left=0;camera.right=w;camera.top=h;camera.bottom=0;camera.updateProjectionMatrix();
    mr=w<700?w*.18:Math.min(w*.10,140);moon.scale.set(mr,mr,1);moon.position.set(w<700?w*.23:w*.79,h*.82,-10);moonHalo.position.copy(moon.position);moonHalo.position.z=-20;moonHalo.scale.set(mr*3.5,mr*3.5,1);
    lanterns.forEach((l,i)=>{l.position.set(w*(i===0?.09:.91),h*(i===0?.76:.83),10);l.scale.setScalar(w<700?.55:.85);});
    cakeX=w*(w<700?.27:.42);cakeY=h*.48;
  }
  const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
  function render(now,phase,elapsed,impactAge){
    const t=now/1000;
    for(let i=0;i<ambientCount;i++){const s=seeds[i];ambientPositions[i*3]=s[0]*w+Math.sin(t*.22+i)*12;ambientPositions[i*3+1]=((s[1]+(reduced?0:t*.007*(.3+s[2])))%1)*h;ambientPositions[i*3+2]=80;}
    ambientGeo.attributes.position.needsUpdate=true;
    lanterns.forEach((l,i)=>l.rotation.z=reduced?0:Math.sin(t*.7+i*2)*.045);
    const active=['charge','strike','moon','settle'].includes(phase);
    cake.visible=phase==='idle'||(active&&impactAge<3.4);
    const arrival=phase==='idle'?0:ease(elapsed*2);
    cake.position.set(THREE.MathUtils.lerp(w*.79,cakeX,arrival),THREE.MathUtils.lerp(h*.48,cakeY,arrival)+(reduced?0:Math.sin(t*1.5)*4),80);
    const scale=w<700?(phase==='idle'?.73:1.04):1.1;cake.scale.setScalar(scale);cake.rotation.set(.2,-.1,-.13);
    if(impactAge>=0){
      const slow=impactAge<.85?impactAge*.23:.1955+(impactAge-.85)*.8;
      halves.forEach((p,i)=>{const sign=i===0?-1:1;p.position.set(sign*(18+slow*82),-slow*slow*55,0);p.rotation.set(0,sign*Math.min(1.2,.9+slow*.28),sign*slow*.2);});
      cake.scale.multiplyScalar(1-smooth(2.5,3.4,impactAge));
      crumbs.visible=active;crumbs.material.opacity=1-smooth(2.3,4,impactAge);
      bursts.forEach((b,i)=>{dummy.position.set(cakeX+b.vx*slow,cakeY+b.vy*slow-80*slow*slow,140+b.vz*slow);dummy.rotation.set(b.spin*slow,b.spin*slow,slow);dummy.scale.setScalar(b.size*scale);dummy.updateMatrix();crumbs.setMatrixAt(i,dummy.matrix);});crumbs.instanceMatrix.needsUpdate=true;
    }else{halves.forEach(p=>{p.position.set(0,0,0);p.rotation.set(0,0,0);});crumbs.visible=false;}
    const charge=phase==='charge'?smooth(0,.6,elapsed):0;
    const burst=impactAge>=0?1-smooth(.7,2.2,impactAge):0;
    energy.material.opacity=charge*.75+burst*.9;
    for(let i=0;i<130;i++){const a=i/130*Math.PI*4+t*5;const r=impactAge>=0?(30+impactAge*240)*(i/130):45+i*.33;energyPositions[i*3]=cakeX+Math.cos(a)*r;energyPositions[i*3+1]=cakeY+Math.sin(a)*r*.55;energyPositions[i*3+2]=190;}energyGeo.attributes.position.needsUpdate=true;
    const slashOpacity=impactAge>=0?(1-smooth(.32,1.1,impactAge))*Math.min(1,impactAge*30+.3):0;
    ribbons.forEach((r,i)=>r.material.opacity=slashOpacity*(i===1?.65:1));
    slashGroup.position.set(cakeX+w*.05,cakeY-h*.04,0);slashGroup.scale.set(w*.7*(.8+Math.max(0,impactAge)*.3),h*.33,1);slashGroup.rotation.z=-.35;
    moon.material.uniforms.crack.value=impactAge<0?0:smooth(.5,.9,impactAge)*(1-smooth(2.3,3.6,impactAge));
    const waveAge=impactAge-.8;shock.material.opacity=waveAge>0?(1-smooth(0,1.5,waveAge))*.7:0;shock.position.copy(moon.position);shock.position.z=100;shock.scale.setScalar(mr+Math.max(0,waveAge)*Math.max(w,h)*.7);
    moonHalo.material.opacity=.32+moon.material.uniforms.crack.value*.26;
    renderer.render(scene,camera);
  }
  return {render,dispose(){observer.disconnect();scene.traverse(o=>{o.geometry?.dispose();const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>m?.dispose());});tex.dispose();renderer.dispose();},get calls(){return renderer.info.render.calls;}};
}
