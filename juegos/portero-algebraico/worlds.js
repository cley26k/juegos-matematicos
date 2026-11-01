import * as T from 'three';
import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';
import {finishWorld,batchWorld} from './finishes.js';
export const atmospheres=['#14152c','#193a36','#182d48','#34385e','#080c24','#61506b'];
export async function buildWorlds(c,buildings){
 const loader=new GLTFLoader();const assets=await Promise.all(['nature/tree_oak','nature/tree_pineRoundA','space/craft_cargoA','space/gate_complex'].map(p=>loader.loadAsync(`./assets/${p}.glb`)));
 const worlds=[];const addModel=(source,g,x,z,height,rotation=0)=>{const o=source.clone(true),bounds=new T.Box3().setFromObject(o),scale=height/bounds.getSize(new T.Vector3()).y;o.scale.setScalar(scale);o.position.set(x,-bounds.min.y*scale,z);o.rotation.y=rotation;o.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true}});g.add(o);return o};
 for(let w=1;w<6;w++){
  const g=new T.Group();g.name=`world-${w}`;g.visible=false;c.scene.add(g);worlds.push(g);
  const palette=['','#597c61','#5b4647','#c3cfdb','#394763','#a48b88'],accent=['','#e4c28b','#69cbd7','#b5c4ff','#72f9e2','#ffd2a4'];
  const ground=c.material(palette[w]),metal=c.material('#414450',.4,.65),light=c.neon(accent[w]);
  c.box(7,.22,42,0,-.12,-14,ground,g);
  // Every destination keeps the same doorway and safe queue layout.
  // The venue owns its doorway; a second frame here used to intersect its trim.
  const sign=c.text(['','JARDÍN SECRETO','MUELLE 03','A U R O R A','Ó R B I T A','ÚLTIMA TERRAZA'][w],2.6,.6,accent[w],'#222c38',110);sign.position.set(-1.95,3.4,-2.8);g.add(sign);
  for(let z=-1;z>-16;z-=3){c.cylinder(.045,.95,1.6,.5,z,metal,g);c.cylinder(.12,.06,1.6,.05,z,metal,g);c.box(.04,.04,2.9,1.6,.92,z-1.5,light,g)}
  if(w===1){
   c.box(70,.3,80,0,-.35,-20,c.material('#284a3c'),g);
   for(let i=0;i<12;i++)addModel(assets[0].scene,g,7.5+i%3*2.8,-4-i*3.2,3.5+i%3*.6);
   for(let z=-3;z>-20;z-=4){for(const x of[-2.7,2.7])c.cylinder(.055,4,x,2,z,metal,g);c.box(5.4,.035,.035,0,3.9,z,metal,g);for(let x=-2;x<=2;x++){const y=3.5-Math.sin(x+2)*.15;const lantern=new T.Mesh(new T.SphereGeometry(.13,12,8),light);lantern.position.set(x,y,z);g.add(lantern);c.cylinder(.012,3.9-y,x,(3.9+y)/2,z,metal,g)}}
  }else if(w===2){
   c.box(140,.15,120,0,-.6,-30,c.material('#204961',.2,.65),g);
   for(let z=5;z>-35;z-=.7)c.box(6.8,.008,.028,0,-.003,z,c.material('#312b32'),g);
   for(let z=2;z>-32;z-=5){const x=3.2;c.cylinder(.13,1.6,x,.3,z,ground,g);c.cylinder(.17,.1,x,1.1,z,light,g)}
   for(let i=0;i<3;i++){const x=6+i%2*3,z=-7-i*7;const hull=new T.Shape();hull.moveTo(-.9,-1.9);hull.lineTo(.9,-1.9);hull.lineTo(1.05,.8);hull.quadraticCurveTo(0,3,-1.05,.8);hull.closePath();const boat=new T.Mesh(new T.ExtrudeGeometry(hull,{depth:.55,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.14,bevelThickness:.15}),c.material(i%2?'#9b5d51':'#d1c7ad'));boat.rotation.x=-Math.PI/2;boat.position.set(x,-.3,z);g.add(boat);c.box(1.1,.65,1.3,x,.7,z-.3,c.material('#d9d1ba'),g);c.box(1.2,.09,1.4,x,1.06,z-.3,metal,g);c.box(1,.25,.02,x,.84,z+.36,c.material('#274350'),g);c.cylinder(.04,3.3,x,1.9,z+.7,metal,g)}
  }else if(w===3){
   c.box(100,.3,100,0,-.35,-30,c.material('#adbbd0'),g);
   for(let i=0;i<14;i++)addModel(assets[1].scene,g,6.5+i%3*2.4,-4-i*3.1,3+i%4*.6);
   for(let i=0;i<7;i++){const m=new T.Mesh(new T.ConeGeometry(9,16+i%3*4,5),c.material(i%2?'#c9d5e0':'#8d9bab'));m.position.set(-28+i*10,4,-49);g.add(m)}
   for(let band=0;band<3;band++){const points=[],indices=[],colors=[];for(let i=0;i<=64;i++){const x=-43+i*1.35,y=12+Math.sin(i*.12+band)*2+band*2;points.push(x,y,-48-band*3,x,y+4+Math.sin(i*.25),-48-band*3);const color=new T.Color(band%2?'#847cd8':'#56c9a6');colors.push(color.r*.15,color.g*.15,color.b*.15,color.r,color.g,color.b);if(i<64){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2)}}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(points,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setIndex(indices);g.add(new T.Mesh(geo,new T.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.3,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending,fog:false})))}
  }else if(w===4){
   c.box(22,.7,48,0,-.55,-15,metal,g);addModel(assets[2].scene,g,8,-13,4,-.5);addModel(assets[3].scene,g,0,-33,6);
   for(let z=2;z>-35;z-=3){c.box(.05,.025,1.5,-2.7,.015,z,light,g);c.box(.05,.025,1.5,2.7,.015,z,light,g)}
   const planet=new T.Mesh(new T.SphereGeometry(10,48,32),c.material('#706999',.85));planet.position.set(-20,17,-50);g.add(planet);const ring=new T.Mesh(new T.TorusGeometry(15,.5,8,80),c.material('#cba88d'));ring.position.copy(planet.position);ring.rotation.x=1.2;g.add(ring);
   const positions=[];for(let i=0;i<400;i++)positions.push(Math.sin(i*31)*70,8+Math.abs(Math.cos(i*91))*50,-20-Math.abs(Math.sin(i*43))*60);const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.add(new T.Points(geo,new T.PointsMaterial({color:'#fff4da',size:.08})));
  }else{
   c.box(19,.5,43,0,-.26,-14,ground,g);
   for(let i=0;i<16;i++){const b=addModel(buildings[i%4].scene,g,(i%2?1:-1)*(12+i%3*4),-8-Math.floor(i/2)*7,9+i%5*3);b.position.y-=12}
   for(let z=-5;z>-29;z-=6){c.cylinder(.5,.5,8,.25,z,c.material('#785a62'),g);const tree=addModel(assets[0].scene,g,8,z,1.8);tree.position.y+=.5}
  }
  finishWorld(c,g,w);batchWorld(g);
 }
 return worlds;
}
