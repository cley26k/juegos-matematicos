import * as T from 'three';
import {mergeGeometries} from './vendor/utils/BufferGeometryUtils.js';
export function finishWorld(c,g,w){
 const mat=(color,r=.7,m=0)=>c.material(color,r,m),box=(a,b,d,x,y,z,m)=>c.box(a,b,d,x,y,z,m,g),cyl=(r,h,x,y,z,m)=>c.cylinder(r,h,x,y,z,m,g);
 const colors=['#40324b','#345447','#465265','#758499','#303e58','#705361'],walls=mat(colors[w]),timber=mat(w===3?'#554344':'#57453c'),stone=mat(w===1?'#c1b69d':'#adb0b7'),brass=mat('#ba9968',.35,.6),warm=c.neon(w===4?'#72cfeb':'#e8bb7c');
 const sign=(s,width,height,x,y,z,color='#ffe1ae',rotation=0)=>{const o=c.text(s,width,height,color,'#202731',105);o.position.set(x,y,z);o.rotation.y=rotation;g.add(o);return o};
 const lamp=(x,y,z)=>{cyl(.05,y-.2,x,(y-.2)/2,z,brass);box(.34,.06,.34,x,y-.2,z,brass);box(.25,.32,.25,x,y,z,warm);for(const dx of[-.15,.15])for(const dz of[-.15,.15])box(.035,.4,.035,x+dx,y,z+dz,brass);box(.46,.08,.46,x,y+.25,z,brass)};
 // A real venue shell, an open doorway and a visible interior, not a free-standing portal.
 box(.35,4.5,19,-3.65,2.25,-9.5,walls);box(.35,4.5,6,-3.65,2.25,5,walls);box(.35,1.25,2,-3.65,3.9,1,walls);
 box(.3,4.5,24,-10.1,2.25,-7,walls);box(6.7,4.5,.25,-6.8,2.25,-19,walls);box(6.7,4.5,.25,-6.8,2.25,5,walls);box(6.7,.2,24,-6.8,-.11,-7,timber);box(6.7,.25,24,-6.8,4.5,-7,timber);
 box(.09,3.45,.12,-3.43,1.73,-.03,brass);box(.09,3.45,.12,-3.43,1.73,2.03,brass);box(.09,.12,2.18,-3.43,3.43,1,brass);
 box(1.65,.12,3,-2.9,3.75,1,timber);box(.07,.08,3,-2.05,3.67,1,warm);
 for(let i=0;i<3;i++){box(.9,.012,.9,-6-i*1.3,-.002,1,mat(i%2?'#4b5970':'#908575'));cyl(.025,1.9,-8,3.45,-2+i*2,brass);cyl(.35,.09,-8,2.5,-2+i*2,warm)}
 box(.5,1.1,4,-9.3,.58,0,timber);box(.8,.1,4.2,-9.15,1.17,0,stone);for(let i=0;i<4;i++){cyl(.12,.25,-9.05,1.35,-1.4+i*.9,brass)}
 sign(['UMBRAL','EL INVERNADERO','CASA DEL PUERTO','REFUGIO AURORA','SALA DE TRÁNSITO','SALÓN DEL AMANECER'][w],3.2,.46,-3.44,4.04,1,'#f2c894',Math.PI/2);
 for(let z=-4;z>-19;z-=4){box(.08,1.5,2,-3.43,2.3,z,mat('#15242b',.18,.4));box(.12,.07,2.2,-3.37,3.08,z,brass);box(.12,.07,2.2,-3.37,1.5,z,brass);box(.1,1.5,.055,-3.34,2.3,z,brass)}
 lamp(-2.6,2.7,3.3);lamp(2.7,2.7,3.3);
 box(1.15,.07,.12,-2.94,3.78,-2.8,brass);box(.07,.35,.07,-2.4,3.6,-2.8,brass);
 if(w===1){
  // A conservatory, planted borders and a fountain terminate the garden walk.
  for(let z=-2;z>-26;z-=3){box(1.7,.5,2.6,3.45,.2,z,stone);box(1.5,.12,2.4,3.45,.48,z,mat('#263d2c'));for(let i=0;i<3;i++){const shrub=new T.Mesh(new T.IcosahedronGeometry(.55,1),mat(i%2?'#597d51':'#355e44'));shrub.position.set(3.1+i*.4,.8,z);g.add(shrub)}lamp(4.6,2,z)}
  for(let z=-3;z>-20;z-=3){box(.15,.15,7,-6.7,4.9,z,brass);const roof=box(7,.08,2.7,-6.7,5,z,mat('#46655d',.18,.35));roof.rotation.z=.08}
  cyl(2.8,.5,0,.15,-24,stone);cyl(2.45,.07,0,.43,-24,mat('#4e938e',.16,.55));cyl(.35,1.8,0,1.15,-24,stone);cyl(1.05,.12,0,1.9,-24,stone);cyl(.85,.06,0,1.99,-24,mat('#74aaa0',.2,.2));
  box(16,1.6,.4,1,.8,-31,walls);for(let x=-3;x<8;x+=2)lamp(x,2.6,-30);sign('EL JARDÍN · IDA Y VUELTA',4,.6,0,3.2,-29);
 }else if(w===2){
  // Lighthouse, working harbor, warehouse facade and dock hardware establish the shore.
  for(let z=0;z>-28;z-=7){cyl(.23,.55,2.8,.2,z,timber);const ring=new T.Mesh(new T.TorusGeometry(.19,.055,8,16),brass);ring.position.set(2.8,.53,z);ring.rotation.x=Math.PI/2;g.add(ring);box(.8,.8,.8,-2.6,.4,z-2,timber);box(.88,.08,.88,-2.6,.83,z-2,brass)}
  cyl(3,.7,12,-.3,-32,stone);cyl(1.3,8,12,3.6,-32,stone);cyl(1.34,.7,12,4.5,-32,mat('#a05048'));cyl(1.5,1.4,12,8.2,-32,warm);cyl(2,.18,12,9,-32,timber);const roof=new T.Mesh(new T.ConeGeometry(2.1,1.5,16),mat('#74434a'));roof.position.set(12,9.7,-32);g.add(roof);
  box(44,1,8,0,-.3,-37,stone);for(let i=0;i<7;i++){box(4,3+i%3,5,-15+i*5,1.1,-40,mat(i%2?'#425a68':'#786254'));box(4.3,.25,5.3,-15+i*5,2.8+(i%3)/2,-40,timber)}
  for(let i=0;i<40;i++)box(1+i%3,.008,.025,5+(i%7)*3,-.505,-i*.85,mat('#467286',.3,.35));
  sign('ADUANA · MUELLE 03',2.6,.6,-3.42,2.5,-2,'#c0e9ee',Math.PI/2);
 }else if(w===3){
  // Timber mountain lodge, snow caps, chimney and a clock tower.
  for(let y=.3;y<4.3;y+=.38){if(y<1.35||y>3.25)box(.1,.22,18,-3.49,y,-9.5,timber);else for(const z of[-2,-6,-10,-14,-18])box(.1,.22,1.75,-3.49,y,z,timber)}
  box(7,.32,24.5,-6.8,4.78,-7,mat('#dde7ed'));box(.65,2,.65,-8.4,5.5,-1.6,stone);box(.9,.2,.9,-8.4,6.5,-1.6,stone);
  for(let z=-3;z>-23;z-=4){box(1.3,.32,2.5,3.6,.12,z,mat('#dae2eb'));lamp(3.3,2.6,z)}
  box(3,6,3,0,3,-26,timber);box(3.4,.3,3.4,0,6.1,-26,mat('#e2e8f0'));const cap=new T.Mesh(new T.ConeGeometry(2.5,2,4),mat('#bdcedf'));cap.position.set(0,7.2,-26);cap.rotation.y=Math.PI/4;g.add(cap);
  sign('12',1.5,1.5,0,4.7,-24.46,'#ffdfad');sign('REFUGIO · ABIERTO',2.4,.5,-3.42,2.4,-2,'#ffdfad',Math.PI/2);
 }else if(w===4){
  // Pressure corridor, bulkheads, sealed deck edges and observation windows.
  for(let z=-4;z>-32;z-=5){for(const x of[-3.4,3.4]){box(.25,4.8,.45,x,2.4,z,stone);box(.08,3.6,.08,x+(x<0?.18:-.18),2.1,z+.24,warm)}box(7.2,.25,.5,0,4.8,z,stone);box(6.4,.07,.14,0,4.63,z,warm)}
  for(let z=-6;z>-27;z-=5){box(.13,1.1,4.5,3.5,.55,z,walls);box(.06,.07,4.5,3.43,3.9,z,stone);box(.03,2.8,4.3,3.5,2.5,z,new T.MeshStandardMaterial({color:'#6ba8b7',transparent:true,opacity:.07,roughness:.2,depthWrite:false}))}
  box(20,.4,1,0,.1,-37,walls);sign('CONTROL ORBITAL',4,.6,0,4.1,-31,'#b9f2ff');
  box(6.8,.035,29,0,4.85,-17,new T.MeshStandardMaterial({color:'#72a8c3',transparent:true,opacity:.09,roughness:.2,depthWrite:false}));
  box(.7,1.2,1.8,-2.4,.6,-3,walls);const console=sign('01 · 02 · 03',1.5,.8,-2.35,1.6,-2.07,'#75eed8');console.rotation.x=-.15;
 }else if(w===5){
  // Rooftop perimeter has a parapet, restaurant seating, pergola and planters.
  for(let z=3;z>-34;z-=3){box(.35,.6,3,8.9,.3,z,stone);box(.08,.08,3,8.9,1.25,z,brass);cyl(.04,1.25,8.9,.625,z,brass)}box(18,.7,.4,0,.35,-35,stone);
  for(let z=-2;z>-25;z-=6){cyl(.1,.85,5.6,.42,z,brass);cyl(.8,.1,5.6,.9,z,stone);for(const dx of[-1.2,1.2]){box(.6,.15,.6,5.6+dx,.5,z,timber);box(.6,.7,.1,5.6+dx,.8,z-.28,timber);for(const dz of[-.2,.2])cyl(.025,.5,5.6+dx,.25,z+dz,brass)}cyl(.055,.18,5.6,1.05,z,warm)}
  for(let z=0;z>-26;z-=5){cyl(.065,3.8,7.7,1.9,z,brass);box(4.5,.1,.15,5.5,3.8,z,timber)}
  for(let x=3.4;x<8;x+=.45)box(.1,.1,26,x,3.85,-12,timber);
  const sun=new T.Mesh(new T.SphereGeometry(3,24,16),new T.MeshBasicMaterial({color:'#f5c48d',fog:false}));sun.position.set(22,5,-65);g.add(sun);
 }
 g.userData.finished=true;
}
export function batchWorld(g){
 g.updateMatrixWorld(true);const groups=new Map();g.traverse(o=>{if(!o.isMesh||Array.isArray(o.material)||o.material.transparent)return;const m=o.material,k=[m.type,m.color?.getHex(),m.emissive?.getHex(),m.emissiveIntensity,m.roughness,m.metalness,m.map?.uuid,m.fog,Object.keys(o.geometry.attributes).sort().join(','),!!o.geometry.index].join('|');if(!groups.has(k))groups.set(k,[]);groups.get(k).push(o)});
 for(const list of groups.values()){if(list.length<2)continue;const geometries=list.map(o=>o.geometry.clone().applyMatrix4(o.matrixWorld));const merged=mergeGeometries(geometries,false);geometries.forEach(o=>o.dispose());if(!merged)continue;const mesh=new T.Mesh(merged,list[0].material);mesh.castShadow=mesh.receiveShadow=true;g.add(mesh);list.forEach(o=>o.removeFromParent())}
}
