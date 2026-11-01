import * as T from 'three';
import { FBXLoader } from './vendor/loaders/FBXLoader.js';
import { GLTFLoader } from './vendor/loaders/GLTFLoader.js';
import { clone } from './vendor/utils/SkeletonUtils.js';
import {identityTextures} from './identity.js';
import {storyFrames as makeStoryFrames} from './storyboards.js';
import {buildWorlds,atmospheres} from './worlds.js';
import { mergeGeometries } from './vendor/utils/BufferGeometryUtils.js';

const clamp=T.MathUtils.clamp,lerp=T.MathUtils.lerp;
export class ClubScene {
 constructor(canvas,onReady){
  this.canvas=canvas;this.onReady=onReady;this.mode='menu';this.paused=false;this.time=0;this.customers=[];this.current=-1;this.holding=false;this.cardYaw=0;this.cardPitch=0;this.yaw=0;this.pitch=0;this.drag=null;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  this.scene=new T.Scene();this.scene.background=new T.Color('#14152c');this.scene.fog=new T.FogExp2('#19172f',.031);
  this.camera=new T.PerspectiveCamera(52,1,.035,110);this.camera.position.set(3.7,2.3,6.5);this.camera.lookAt(-.3,1.5,-2);this.scene.add(this.camera);
  this.renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.2;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;
  this.ray=new T.Raycaster();this.mouse=new T.Vector2();this.makeWorld();this.makeHands();this.resize();window.addEventListener('resize',()=>this.resize());
  canvas.addEventListener('pointerdown',e=>{if(this.mode!=='play'||this.paused)return;this.drag={x:e.clientX,y:e.clientY,travel:0};canvas.setPointerCapture(e.pointerId)});
  canvas.addEventListener('pointermove',e=>{if(!this.drag)return;const dx=e.clientX-this.drag.x,dy=e.clientY-this.drag.y;this.drag.travel+=Math.abs(dx)+Math.abs(dy);this.drag.x=e.clientX;this.drag.y=e.clientY;if(this.holding){this.cardYaw+=dx*.009;this.cardPitch=clamp(this.cardPitch+dy*.005,-.5,.5)}else{this.yaw=clamp(this.yaw-dx*.003,-.68,.68);this.pitch=clamp(this.pitch-dy*.0025,-.25,.25)}});
  canvas.addEventListener('pointerup',e=>{const tap=this.drag&&this.drag.travel<8;this.drag=null;if(tap&&!this.holding){const r=canvas.getBoundingClientRect();this.mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);this.ray.setFromCamera(this.mouse,this.camera);if(this.offered?.visible&&this.ray.intersectObject(this.offered,true).length)this.onPick?.()}});
  canvas.addEventListener('pointercancel',()=>this.drag=null);this.last=performance.now();this.animate();
 }
 material(color,roughness=.7,metalness=0){return new T.MeshStandardMaterial({color,roughness,metalness})}
 box(w,h,d,x,y,z,mat,parent=this.scene){const o=new T.Mesh(new T.BoxGeometry(w,h,d),typeof mat==='string'?this.material(mat):mat);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
 cylinder(r,h,x,y,z,mat,parent=this.scene){const o=new T.Mesh(new T.CylinderGeometry(r,r,h,16),mat);o.position.set(x,y,z);o.castShadow=true;parent.add(o);return o}
 tube(points,r,mat){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));const o=new T.Mesh(new T.TubeGeometry(curve,24,r,8,false),mat);this.scene.add(o);return o}
 neon(color){return new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:3,roughness:.35})}
 glow(x,y,z,color,size=3){const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d'),g=ctx.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,color);g.addColorStop(.22,color+'65');g.addColorStop(1,color+'00');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;const o=new T.Sprite(new T.SpriteMaterial({map,transparent:true,blending:T.AdditiveBlending,depthWrite:false,opacity:.27}));o.position.set(x,y,z);o.scale.set(size,size,1);this.scene.add(o);return o}
 text(text,width,height,color='#ffd3dd',background='#23172c',font=90){const c=document.createElement('canvas');c.width=1024;c.height=Math.round(1024*height/width);const ctx=c.getContext('2d');ctx.fillStyle=background;ctx.fillRect(0,0,c.width,c.height);ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`600 ${font}px sans-serif`;ctx.shadowColor=color;ctx.shadowBlur=15;ctx.fillStyle=color;ctx.fillText(text,512,c.height/2,980);const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;const material=new T.MeshBasicMaterial({map,side:T.DoubleSide});return new T.Mesh(new T.PlaneGeometry(width,height),material)}
 makeWorld(){
  const brick=this.material('#352639'),trim=this.material('#68516c',.6,.3),asphalt=this.material('#171c2c',.31,.35),walk=this.material('#394050',.63),pink=this.neon('#ff528f'),cyan=this.neon('#57ddde'),gold=this.material('#cc9273',.3,.65);
  this.scene.add(new T.HemisphereLight('#b6c9ff','#765161',2.0));const key=this.sun=new T.DirectionalLight('#bbc9ff',2);key.position.set(5,10,3);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-12;key.shadow.camera.right=12;key.shadow.camera.top=12;key.shadow.camera.bottom=-12;key.shadow.bias=-.001;this.scene.add(key);
  const front=this.frontLight=new T.PointLight('#ffe7cc',24,10,2);front.position.set(0,3.4,3.5);this.scene.add(front);
  this.pinkLight=new T.PointLight('#ff478a',34,12,2);this.pinkLight.position.set(-2.5,2.7,1);this.scene.add(this.pinkLight);const streetLight=this.streetLight=new T.PointLight('#5fe7ff',40,16,2);streetLight.position.set(4,4.5,-6);this.scene.add(streetLight);
  this.box(70,.16,100,12,-.25,-20,asphalt);this.box(7,.28,75,-.1,-.09,-20,walk);this.box(.18,.3,75,3.45,-.04,-20,this.material('#93909a'));
  for(let z=8;z>-65;z-=5)this.box(.12,.008,2,7.3,-.155,z,this.material('#c5ba99'));
  for(let z=7;z>-44;z-=1.4)this.box(6.8,.005,.015,0,.055,z,this.material('#1c2030'));
  for(let x=-2.8;x<3.4;x+=1.7)this.box(.015,.005,58,x,.055,-18,this.material('#232332'));
  // Club wall lies alongside the player: its entrance is the destination of admitted guests.
  this.box(.6,6,24,-3.8,3,-12,brick);this.box(.6,6,6,-3.8,3,5,brick);this.box(.65,2.6,2,-3.8,4.7,1,brick);
  // Open vestibule: guests must not walk through a wall or a closed door.
  this.box(.2,3.6,3,-7,1.8,1,this.material('#2d1544'));this.box(3.3,.12,2,-5.1,-.01,1,trim);this.box(3.3,3.6,.2,-5.1,1.8,-.1,brick);this.box(3.3,3.6,.2,-5.1,1.8,2.1,brick);this.box(3.3,.2,2.4,-5.1,3.7,1,trim);
  this.box(.16,3.7,.09,-3.45,1.87,0,pink);this.box(.16,3.7,.09,-3.45,1.87,2,pink);this.box(.16,.09,2.08,-3.45,3.72,1,pink);
  const doorLight=this.doorLight=new T.PointLight('#bf58ff',28,9,2);doorLight.position.set(-4.2,2,1);this.scene.add(doorLight);this.glow(-3.5,2,1,'#ed68dc',4);
  const sign=this.text('U M B R A L',3.1,.78,'#ffc6dd','#291324',102);sign.position.set(-3.42,4.36,1);sign.rotation.y=Math.PI/2;this.scene.add(sign);
  const overhead=this.box(2,.22,4,-2.65,4.85,1,trim);this.box(.08,.06,3.7,-1.64,4.69,1,pink);
  // A projecting street sign is readable from the doorway.
  const blade=this.text('U',.85,1.45,'#ff9cc5','#271327',550);blade.position.set(-2.2,3.6,-3.1);this.scene.add(blade);this.box(1.4,.06,.1,-2.9,4.25,-3.16,gold);
  const small=this.text('CLUB · 23:00 — 06:00',1.7,.27,'#d6c5ba','#302334',90);small.rotation.y=Math.PI/2;small.position.set(-3.44,1.8,3.0);this.scene.add(small);
  for(let z=-1;z>-23;z-=2.4){const post=this.cylinder(.045,1.02,1.55,.58,z,gold);this.cylinder(.16,.07,1.55,.13,z,gold);const top=new T.Mesh(new T.SphereGeometry(.08,16,10),gold);top.position.set(1.55,1.1,z);this.scene.add(top);if(z>-21)this.tube([[1.55,1.07,z],[1.55,.85,z-1.2],[1.55,1.07,z-2.4]],.035,this.material('#8a294f',.85));}
  for(let z=-5;z>-43;z-=10){this.cylinder(.055,4.5,3,2.3,z,trim);this.box(.7,.09,.35,2.8,4.6,z,trim);this.box(.55,.025,.23,2.8,4.53,z,cyan);this.glow(2.8,4.5,z,'#85f0ff',1.9);}
  // Architectural details and muted windows supply depth without a grid backdrop.
  for(let z=-4;z>-24;z-=4){this.box(.04,2,1.3,-3.46,2.1,z,this.material('#171629',.25,.25));this.box(.06,.07,1.45,-3.4,3.15,z,trim);this.box(.06,.07,1.45,-3.4,1.05,z,trim);}
  const poster=this.text('TONIGHT / AFTER HOURS',1.2,1.7,'#f6bf91','#5b2945',72);poster.rotation.y=Math.PI/2;poster.position.set(-3.43,2,-1.9);this.scene.add(poster);
  for(const z of[-4.8,5]){this.cylinder(.36,.55,-2.8,.32,z,this.material('#292734'));for(let i=0;i<7;i++){const leaf=new T.Mesh(new T.ConeGeometry(.25,.95,7),this.material(i%2?'#506b67':'#3c5a50'));leaf.position.set(-2.8+Math.sin(i)*.16,.97,z+Math.cos(i)*.16);leaf.rotation.z=Math.sin(i)*.35;this.scene.add(leaf)}}
  // Neon puddles are understated transparent geometry lying on the road.
  for(let i=0;i<8;i++){const o=new T.Mesh(new T.CircleGeometry(1,40),new T.MeshBasicMaterial({color:i%2?'#3f81a3':'#a14674',transparent:true,opacity:.12,depthWrite:false}));o.rotation.x=-Math.PI/2;o.scale.set(.35+i%3*.2,1.4+i%2,1);o.position.set(4.5+i%3,-.16,-i*4);this.scene.add(o)}
  const stars=new Float32Array(450);for(let i=0;i<150;i++){stars[i*3]=(Math.sin(i*127.1)*.5)*100;stars[i*3+1]=14+Math.abs(Math.sin(i*311.7))*28;stars[i*3+2]=-18-Math.abs(Math.cos(i*71.9))*55}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(stars,3));this.scene.add(new T.Points(geo,new T.PointsMaterial({color:'#c8bddd',size:.055,transparent:true,opacity:.6})));
 }
 makeHands(){
  this.held=new T.Group();this.camera.add(this.held);this.held.position.set(.03,-.6,-.68);this.held.visible=false;
  const sleeve=this.material('#242538',.9),skin=this.material('#ba856b',.6);
  for(const side of [-1,1]){
   const first=this.held.children.length;
   const arm=new T.Mesh(new T.CylinderGeometry(.039,.057,.26,20),sleeve);arm.position.set(side*.265,-.31,.025);arm.rotation.z=side*.18;this.held.add(arm);
   const wrist=new T.Mesh(new T.CapsuleGeometry(.027,.045,5,12),skin);wrist.position.set(side*.244,-.174,.022);wrist.rotation.z=side*.2;this.held.add(wrist);
   const palm=new T.Mesh(new T.SphereGeometry(1,20,14),skin);palm.scale.set(.035,.052,.018);palm.position.set(side*.247,-.132,.021);palm.rotation.z=side*.25;this.held.add(palm);
   for(let f=0;f<4;f++){const x=side*(.229+f*.010),y=-.14-f*.003;const curve=new T.CatmullRomCurve3([new T.Vector3(x,y,-.015),new T.Vector3(x,y+.037,-.01),new T.Vector3(x-side*.006,y+.043,.008),new T.Vector3(x-side*.008,y+.021,.017)]);const finger=new T.Mesh(new T.TubeGeometry(curve,12,.0065,8,false),skin);this.held.add(finger)}
   const thumb=new T.Mesh(new T.CapsuleGeometry(.01,.034,5,12),skin);thumb.position.set(side*.22,-.128,.017);thumb.rotation.z=-side*.45;this.held.add(thumb);
   this.held.children.slice(first).forEach(m=>{m.position.x+=side*.01;m.position.y-=.025});
  }
  this.cardPivot=new T.Group();this.held.add(this.cardPivot);const edge=new T.MeshStandardMaterial({color:'#d8c9bf',roughness:.35});this.card=new T.Mesh(new T.BoxGeometry(.47,.295,.004),[edge,edge,edge,edge,new T.MeshBasicMaterial({color:'#fff4e6',toneMapped:false}),new T.MeshBasicMaterial({color:'#291829',toneMapped:false})]);this.cardPivot.add(this.card);
  const fill=new T.PointLight('#ffe5d0',.25,1.5,1);fill.position.set(0,.2,.3);this.held.add(fill);
  this.offered=new T.Mesh(new T.BoxGeometry(.19,.12,.008),new T.MeshStandardMaterial({color:'#ffe4d1',emissive:'#805d47',emissiveIntensity:.18,roughness:.5}));this.offered.visible=false;this.scene.add(this.offered);
 }
 async load(guests,onProgress){
  const manager=new T.LoadingManager();manager.setURLModifier(url=>/\.(png|jpg)$/i.test(url)&&!url.includes('assets/')?'./assets/characters/skaterFemaleA.png':url);
  const fbx=new FBXLoader(manager);onProgress('Conociendo a los invitados…');const [base,idle,run]=await Promise.all([fbx.loadAsync('./assets/characters/base.fbx'),fbx.loadAsync('./assets/characters/idle.fbx'),fbx.loadAsync('./assets/characters/run.fbx')]);
  this.clips={idle:idle.animations.find(a=>/Idle$/i.test(a.name)),walk:run.animations.find(a=>/Run$/i.test(a.name))};if(!this.clips.idle||!this.clips.walk)throw Error('Faltan las animaciones Idle/Run.');
  const texLoader=new T.TextureLoader();this.textures=await Promise.all(guests.map(g=>texLoader.loadAsync(`./assets/characters/${g.skin}.png`)));
  this.customers=guests.map((guest,i)=>{const model=clone(base);const bounds=new T.Box3().setFromObject(model),size=bounds.getSize(new T.Vector3());const scale=(guest.height||1.78)/size.y;model.scale.multiplyScalar(scale);model.position.y=-bounds.min.y*scale;model.position.x=-(bounds.min.x+bounds.max.x)*.5*scale;model.position.z=-(bounds.min.z+bounds.max.z)*.5*scale;this.textures[i].colorSpace=T.SRGBColorSpace;this.textures[i].anisotropy=4;model.traverse(o=>{if(o.isMesh){o.material=new T.MeshStandardMaterial({map:this.textures[i],roughness:.8});o.castShadow=true;o.receiveShadow=true}});const group=new T.Group();group.add(model);this.scene.add(group);const mixer=new T.AnimationMixer(model),idleAction=mixer.clipAction(this.clips.idle),walkAction=mixer.clipAction(this.clips.walk);idleAction.play();walkAction.timeScale=.52;const item={group,model,mixer,idle:idleAction,walk:walkAction,moving:false,target:new T.Vector3(),speed:1.55,guest};return item});
  onProgress('Preparando la calle…');const gltf=new GLTFLoader();const buildings=await Promise.all(['building-a','building-e','building-k','building-skyscraper-a'].map(n=>gltf.loadAsync(`./assets/city/${n}.glb`)));
  for(let i=0;i<12;i++){const model=buildings[i%4].scene.clone(true),box=new T.Box3().setFromObject(model),size=box.getSize(new T.Vector3());const scale=(i%4===3?17:7.5)/size.y;model.scale.setScalar(scale);model.position.set(i%2?14:-10,-box.min.y*scale,-10-Math.floor(i/2)*10);model.rotation.y=i%2?-Math.PI/2:Math.PI/2;model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.material=o.material.clone();o.material.color.multiplyScalar(.65)}});this.scene.add(model)}
  // Lit shop windows on the opposite pavement.
  for(let i=0;i<8;i++){const sign=this.text(i%2?'LATE NIGHT':'CAFÉ',2.7,.48,i%2?'#8bcddd':'#ffc097','#20243b',110);sign.position.set(9.7,2.8,-8-i*8);sign.rotation.y=-Math.PI/2;this.scene.add(sign)}
  this.optimizeStatic();const shared=new Set([this.camera,this.offered,...this.customers.map(c=>c.group)]);this.cityObjects=this.scene.children.filter(o=>!o.isLight&&!shared.has(o));onProgress('Abriendo seis mundos…');this.worlds=await buildWorlds(this,buildings);this.makePortraits();this.roster=[...this.customers];this.setGuests([0,1,2,3,4,5]);this.setWorld(0);this.resetQueue(0);this.canvas.dataset.assets='ready';this.canvas.dataset.characterCount=String(this.customers.length);this.onReady();
 }
 setGuests(ids){this.roster.forEach(c=>c.group.visible=false);this.customers=ids.map(id=>this.roster[id]);}
 storyFrames(){return makeStoryFrames(this)}
 setWorld(index){this.worldIndex=index;this.cityObjects?.forEach(o=>o.visible=index===0);this.worlds?.forEach((o,i)=>o.visible=i+1===index);this.scene.background.set(atmospheres[index]);this.scene.fog.color.set(atmospheres[index]);this.scene.fog.density=index===4?.007:.024;this.pinkLight.color.set(['#ff478a','#e4c28b','#69cbd7','#b5c4ff','#72f9e2','#ffd2a4'][index]);this.sun.color.set(['#bbc9ff','#d7e4c3','#b7d3e8','#d7dfff','#83b7dc','#ffcb93'][index]);this.frontLight.color.set(index===4?'#c0e3f4':'#ffe7cc');this.streetLight.visible=this.doorLight.visible=index===0;this.renderer.toneMappingExposure=index===5?1.35:1.15;this.canvas.dataset.world=String(index+1)}
 optimizeStatic(){
  this.scene.updateMatrixWorld(true);const groups=new Map(),skip=new Set([this.camera,this.offered,...this.customers.map(c=>c.group)]);
  for(const root of [...this.scene.children]){if(skip.has(root))continue;root.traverse(mesh=>{if(!mesh.isMesh||Array.isArray(mesh.material)||mesh.material.transparent)return;const m=mesh.material;const k=[m.type,m.color?.getHex(),m.emissive?.getHex(),m.emissiveIntensity,m.roughness,m.metalness,m.map?.uuid,Object.keys(mesh.geometry.attributes).sort().join(','),!!mesh.geometry.index].join('|');if(!groups.has(k))groups.set(k,[]);groups.get(k).push(mesh)})}
  for(const list of groups.values()){if(list.length<2)continue;const geos=list.map(m=>m.geometry.clone().applyMatrix4(m.matrixWorld));const merged=mergeGeometries(geos,false);geos.forEach(g=>g.dispose());if(!merged)continue;const mesh=new T.Mesh(merged,list[0].material);mesh.castShadow=mesh.receiveShadow=true;this.scene.add(mesh);list.forEach(o=>o.removeFromParent())}
 }
 resetQueue(index){this.current=index;this.holding=false;this.offered.visible=false;this.yaw=this.pitch=this.cardPitch=this.cardYaw=0;this.customers.forEach((c,i)=>{c.exit=false;c.exitDone=null;c.speed=1.55;c.group.visible=i>=index;c.group.position.set(.12+Math.sin(i)*.12,0,-2-(i-index)*2.2);c.target.copy(c.group.position);c.group.rotation.y=0;c.moving=false;c.walk.stop();c.idle.reset().setEffectiveWeight(1).play()});}
 setMenu(){this.mode='menu';this.holding=false;this.offered.visible=false;this.held.visible=false;this.current=-1;this.customers.forEach((c,i)=>{c.exit=false;c.exitDone=null;c.group.rotation.y=0;c.group.visible=true;c.group.position.set(i%2?.8:-.4,0,-1-i*1.9);c.target.copy(c.group.position);c.moving=false;c.walk.stop();c.idle.reset().setEffectiveWeight(1).play()})}
 begin(index,ready){this.mode='play';this.current=index;this.holding=false;this.cardYaw=this.cardPitch=this.yaw=this.pitch=0;this.offered.visible=false;this.arrival=ready;this.arrived=false;this.customers.forEach((c,i)=>{if(i<index){c.group.visible=false;return}c.group.visible=true;c.target.set(i===index?0:.2,0,i===index?.4:-2-(i-index-1)*2.2);this.move(c)});}
 move(c){if(!c.moving){c.idle.fadeOut(.25);c.walk.reset().fadeIn(.25).play();c.moving=true}}
 makePortraits(){
  this.portraits=this.customers.map(c=>{
   const scene=new T.Scene();scene.background=new T.Color(c.guest.accent);const model=clone(c.model);scene.add(model);const mixer=new T.AnimationMixer(model);mixer.clipAction(this.clips.idle).play();mixer.update(.25);scene.add(new T.HemisphereLight('#ffffff','#9d8798',2.5));const light=new T.DirectionalLight('#fff3e5',3);light.position.set(-2,4,4);scene.add(light);
   const camera=new T.PerspectiveCamera(31,292/359,.1,10);camera.position.set(0,1.49,1.48);camera.lookAt(0,1.43,0);
   const target=new T.WebGLRenderTarget(292,359),pixels=new Uint8Array(292*359*4);target.texture.colorSpace=T.SRGBColorSpace;this.renderer.setRenderTarget(target);this.renderer.render(scene,camera);this.renderer.readRenderTargetPixels(target,0,0,292,359,pixels);this.renderer.setRenderTarget(null);const canvas=document.createElement('canvas');canvas.width=292;canvas.height=359;const ctx=canvas.getContext('2d'),data=ctx.createImageData(292,359);for(let y=0;y<359;y++)data.data.set(pixels.subarray((358-y)*292*4,(359-y)*292*4),y*292*4);ctx.putImageData(data,0,0);target.dispose();return canvas;
  });
 }
 setCard(op,guest,index){const [front,back]=identityTextures(op,guest,index,this.worldIndex||0,this.portraits?.[guest.id]);this.card.material[4].map?.dispose();this.card.material[5].map?.dispose();this.card.material[4].map=front;this.card.material[5].map=back;this.card.material[4].color.set('#fff');this.card.material[5].color.set('#fff');this.card.material[4].needsUpdate=this.card.material[5].needsUpdate=true;}
 take(){this.holding=true;this.offered.visible=false;this.held.visible=true;this.held.position.y=-.35;this.cardYaw=this.cardPitch=0;this.canvas.dataset.card='held'}
 flip(){this.cardYaw+=Math.PI}
 depart(admit,done){this.holding=false;this.offered.visible=false;this.canvas.dataset.card='returned';const c=this.customers[this.current];c.exit=true;c.exitAdmit=admit;c.exitDone=done;c.target.set(admit?-5.8:2.8,0,admit?1:5);c.speed=1.8;this.move(c)}
 resize(){const w=innerWidth,h=innerHeight;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.handScale=Math.min(1,(w/h)/1.25);this.held?.scale.setScalar(this.handScale)}
 animate(){requestAnimationFrame(()=>this.animate());const now=performance.now(),dt=Math.min((now-this.last)/1000,.05);this.last=now;if(this.paused){this.renderer.render(this.scene,this.camera);return}this.time+=dt;
  if(this.mode==='menu'){const p=new T.Vector3(3.5+Math.sin(this.time*.11)*.35,2.15,6.2);this.camera.position.lerp(p,1-Math.exp(-dt*4));this.camera.lookAt(-.4,1.7,-2.2)}else{this.camera.position.lerp(new T.Vector3(0,1.65,3.3),1-Math.exp(-dt*6));const bob=this.reduced?0:Math.sin(this.time*.8)*.005;this.camera.rotation.set(this.pitch-.045+bob,this.yaw,0,'YXZ')}
  for(const c of this.customers){if(!c.group.visible)continue;c.mixer?.update(dt);if(c.moving){const delta=c.target.clone().sub(c.group.position),distance=delta.length();if(distance>.035){const step=Math.min(distance,c.speed*dt);delta.normalize();c.group.position.addScaledVector(delta,step);const desired=Math.atan2(delta.x,delta.z);c.group.rotation.y+=Math.atan2(Math.sin(desired-c.group.rotation.y),Math.cos(desired-c.group.rotation.y))*Math.min(1,dt*7)}else{c.group.position.copy(c.target);c.moving=false;c.walk.fadeOut(.25);c.idle.reset().fadeIn(.25).play();if(c.exit){c.exit=false;c.group.visible=false;c.exitDone?.();c.exitDone=null}else{c.group.rotation.y=0}}}}
  const current=this.customers[this.current];if(this.mode==='play'&&current&&!current.moving&&!this.arrived){this.arrived=true;this.offered.visible=true;this.arrival?.()}
  if(this.offered.visible&&current){const arm=current.model.getObjectByName('RightArm'),forearm=current.model.getObjectByName('RightForeArm'),hand=current.model.getObjectByName('RightHand');if(arm)arm.rotation.x-=.65;if(forearm)forearm.rotation.x-=.75;if(hand){current.group.updateMatrixWorld(true);hand.getWorldPosition(this.offered.position);this.offered.position.add(new T.Vector3(.015,.035,.04))}else this.offered.position.set(.32,1.01,.94);this.offered.rotation.set(-.16,0,.12+Math.sin(this.time)*.02)}
  this.held.position.y=lerp(this.held.position.y,this.holding?(innerHeight<600?-.015:-.045):-.8,.13);this.held.position.x=lerp(this.held.position.x,this.holding?.025:.1,.1);this.held.rotation.z=this.reduced?0:Math.sin(this.time*.9)*.005;this.cardPivot.rotation.y=lerp(this.cardPivot.rotation.y,this.cardYaw,.14);this.cardPivot.rotation.x=lerp(this.cardPivot.rotation.x,this.cardPitch-.035,.14);if(!this.holding&&this.held.position.y<-.78)this.held.visible=false;this.pinkLight.intensity=34+(this.reduced?0:Math.sin(this.time*1.2)*2);this.renderer.render(this.scene,this.camera);
 }
}
