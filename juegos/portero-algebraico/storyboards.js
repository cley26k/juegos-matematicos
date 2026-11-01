import * as T from 'three';
export function capture(c,scene,camera){
 const w=870,h=600,target=new T.WebGLRenderTarget(w,h);target.texture.colorSpace=T.SRGBColorSpace;const pixels=new Uint8Array(w*h*4);c.renderer.setRenderTarget(target);c.renderer.render(scene,camera);c.renderer.readRenderTargetPixels(target,0,0,w,h,pixels);c.renderer.setRenderTarget(null);const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d'),data=ctx.createImageData(w,h);for(let y=0;y<h;y++)data.data.set(pixels.subarray((h-1-y)*w*4,(h-y)*w*4),y*w*4);ctx.putImageData(data,0,0);target.dispose();return canvas.toDataURL('image/jpeg',.9);
}
function tableau(c,world,part){
 const scene=new T.Scene();scene.background=new T.Color(['#20172e','#143a32','#163144','#272d4f','#10283f','#493749'][world]);const root=new T.Group();scene.add(root);scene.add(new T.HemisphereLight('#f0eaff','#6a5366',2.3));const key=new T.DirectionalLight('#fff0cd',3);key.position.set(-3,5,5);scene.add(key);
 const mat=color=>new T.MeshStandardMaterial({color,roughness:.65}),gold=mat('#d7af63'),dark=mat('#242538'),mint=mat('#9edcc0'),red=mat('#e57f91'),paper=mat('#eee1c5');
 const box=(w,h,d,x,y,z,m)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);root.add(o);return o};
 const label=(text,w,h,x,y,z,color='#ffe7b8',bg='#202738')=>{const font=Math.min(900,1600/[...text].length,1024*h/w*.74);const o=c.text(text,w,h,color,bg,font);o.material.toneMapped=false;o.position.set(x,y,z);root.add(o);return o};
 const disk=(r,depth,x,y,z,m)=>{const o=new T.Mesh(new T.CylinderGeometry(r,r,depth,48),m);o.rotation.x=Math.PI/2;o.position.set(x,y,z);root.add(o);return o};
 const token=(text,x,y,color=gold,size=.8)=>{disk(size/2,.12,x,y,.12,color);label(text,size*.76,size*.63,x,y,.195,'#202437','#e2c480',220)};
 const card=(text,x,y,color=paper,w=.94,h=1.15)=>{box(w,h,.09,x,y,.1,color);label(text,w*.87,h*.65,x,y,.153,'#232337',color===red?'#e57f91':color===mint?'#9edcc0':'#eee1c5',160)};
 box(6,.22,3,0,-1.6,-.1,mat(world===4?'#314359':'#574138'));box(6.2,.07,3.1,0,-1.46,-.1,gold);
 if(world===0){
  if(part===1){label('LOS NÚMEROS PARA CONTAR',4.9,.52,0,1.65,0);[0,1,2,3].forEach((n,i)=>{card(String(n),-1.8+i*1.2,.3);for(let j=0;j<n;j++)disk(.09,.08,-2.03+i*1.2+j*.22,-.5,.1,gold)});label('ℕ = {0, 1, 2, 3, …}',4.7,.48,0,-1.05,.2)}
  else{label('¿EL RESULTADO SIGUE EN ℕ?',5,.5,0,1.65,0);card('2 + 3 = 5',-1.32,.32,mint,2.3,1.2);card('2 − 5 = −3',1.32,.32,red,2.3,1.2);label('DENTRO',2,.4,-1.32,-.64,.2,'#a8ead3');label('FUERA',2,.4,1.32,-.64,.2,'#ffadbb')}
 }else if(world===1){
  if(part===1){label('DOS CAMINOS OPUESTOS',4.9,.52,0,1.65,0);box(.1,1.9,.1,0,-.3,0,gold);box(3.6,.07,.1,0,.6,0,gold);for(const x of[-1.6,1.6]){box(.03,.75,.03,x,.22,0,gold);disk(.56,.1,x,-.22,0,paper)}card('−3',-1.6,-.2,red,.95,.75);card('+3',1.6,-.2,mint,.95,.75);label('ℤ: … −2, −1, 0, 1, 2 …',5,.45,0,-1.13,.2)}
  else{label('VOLVER AL PUNTO DE PARTIDA',5,.5,0,1.65,0);card('−3',-1.85,.35,red);label('+',.6,.7,-.93,.35,.2);token('+3',0,.35,mint,1.25);label('=',.6,.7,.93,.35,.2);card('0',1.85,.35,mint);label('−3 + 3 = 0 · EL NEUTRO',5,.45,0,-.98,.2)}
 }else if(world===2){
  if(part===1){label('UNA MONEDA, DOS MITADES',5,.5,0,1.65,0);for(const side of[-1,1]){const geo=new T.CylinderGeometry(.95,.95,.13,48,1,false,side<0?0:Math.PI,Math.PI);const o=new T.Mesh(geo,gold);o.rotation.x=Math.PI/2;o.position.set(-side*.1,.1,.1);root.add(o)}label('1/2',.75,.45,-.51,.12,.2,'#292638','#dfbd76',210);label('1/2',.75,.45,.51,.12,.2,'#292638','#dfbd76',210);label('ℚ · FRACCIONES p/q, CON q ≠ 0',5.2,.43,0,-1.04,.2)}
  else{label('EL PASAJERO SIN REGRESO',5,.5,0,1.65,0);card('2',-1.8,.34,mint,.85,1);label('×',.5,.5,-1.05,.34,.2);card('1/2',-.25,.34,mint,1.05,1);label('= 1',.9,.6,.85,.34,.2);card('0',2,.34,red,.75,1);label('INVERSOS',2.7,.4,-.7,-.7,.2,'#abe9cc');label('SIN INVERSO',1.5,.38,1.85,-.7,.2,'#ffadbb')}
 }else if(world===3){
  if(part===1){label('UN RELOJ DE CUATRO POSICIONES',5.5,.5,0,1.65,0);disk(1.2,.15,0,0,0,gold);disk(1.1,.17,0,0,.02,dark);for(let n=0;n<4;n++){const a=n*Math.PI/2;label(String(n),.4,.4,Math.sin(a)*.83,Math.cos(a)*.83,.13,'#ffe3a5','#242538')}const hand=box(.045,.65,.05,.32,0,.18,mint);hand.rotation.z=-Math.PI/2;label('3 → 0 → 1',2,.45,1.9,.1,.2);label('3 + 2 = 1  (mod 4)',4.5,.4,0,-1.2,.2)}
  else{label('CADA PASO NECESITA VUELTA',5.3,.5,0,1.65,0);card('+',-1.6,.35,mint);card('×',1.6,.35,red);label('3 + 1 → 0',2.2,.45,-1.5,-.55,.2);label('0 × a → 0',2.2,.45,1.5,-.55,.2);label('SÍ HAY INVERSOS',2.7,.35,-1.5,-1.1,.2);label('0 NUNCA LLEGA A 1',2.8,.35,1.5,-1.1,.2)}
 }else if(world===4){
  if(part===1){label('TABLAS Y CAMBIOS DE POSICIÓN',5.3,.5,0,1.65,0);box(2,1.6,.13,-1.48,.13,0,dark);for(let i=0;i<4;i++)card(i===0||i===3?'1':'0',-1.91+(i%2)*.85,.57-Math.floor(i/2)*.85,paper,.71,.7);['A','B','C'].forEach((s,i)=>card(s,.35+i*.85,.15,i===0?gold:i===1?mint:red,.7,.9));label('MATRIZ',2,.4,-1.48,-1,.2);label('PERMUTACIÓN',2.8,.4,1.2,-1,.2)}
  else{label('CAMBIAR… Y PODER DESHACER',5.3,.5,0,1.65,0);['ABC','BCA','ABC'].forEach((s,i)=>card(s,-1.85+i*1.85,.2,i===1?gold:mint,1.35,1));label('→',.5,.6,-.92,.2,.2);label('→',.5,.6,.92,.2,.2);label('OPERACIÓN',2,.4,-.9,-.8,.2);label('INVERSA',2,.4,1.25,-.8,.2)}
 }else{
  if(part===1){label('CUATRO CONJUNTOS, UNA CIUDAD',5.4,.5,0,1.65,0);['0','−2','1/2','√2'].forEach((s,i)=>{card(s,-1.85+i*1.23,.2,i%2?mint:paper,.98,1.1);label(['ℕ','ℤ','ℚ','ℝ'][i],.75,.38,-1.85+i*1.23,-.7,.2)});label('ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ',4.4,.38,0,-1.13,.24)}
  else{label('MISMA FÓRMULA. OTRA FRONTERA.',5.4,.5,0,1.65,0);card('a × b',-1.4,.35,red,2.2,1.1);card('a × b',1.4,.35,mint,2.2,1.1);label('ℝ',1.9,.45,-1.4,-.55,.2);label('ℝ SIN 0',2.1,.45,1.4,-.55,.2);label('NO ES GRUPO',2.3,.37,-1.4,-1.12,.2,'#ffa3b4');label('SÍ ES GRUPO',2.3,.37,1.4,-1.12,.2,'#a8eacb')}
 }
 const camera=new T.PerspectiveCamera(44,1.45,.1,30);camera.position.set(0,.28,6.9);camera.lookAt(0,.1,0);const result=capture(c,scene,camera);const geometries=new Set(),materials=new Set();scene.traverse(o=>{if(o.isMesh){geometries.add(o.geometry);materials.add(o.material)}});geometries.forEach(o=>o.dispose());materials.forEach(o=>{o.map?.dispose();o.dispose()});return result;
}
export function storyFrames(c){
 c.held.visible=c.offered.visible=false;c.customers.forEach(o=>o.mixer.update(.01));const camera=new T.PerspectiveCamera(54,1.45,.1,110);camera.position.set(.8,3.6,7);camera.lookAt(-1.3,1.8,-6);
 return[capture(c,c.scene,camera),tableau(c,c.worldIndex,1),tableau(c,c.worldIndex,2)];
}
