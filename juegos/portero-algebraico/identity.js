import * as T from 'three';
export const worldNames=['Distrito Neón','Jardín Secreto','Muelle 03','Aurora','Estación Órbita','La Última Terraza'];
const profiles=[['Luna Vega','12 / 08 / 1998','DJ / SKATER','LV-0842'],['Dante Bellini','24 / 03 / 1987','SOCIO FUNDADOR','DB-0016'],['Nova Siete','07 / 07 / 1999','VISITANTE ORBITAL','N7-0098'],['Rocco Rivera','16 / 11 / 2000','MÚSICO','RR-0411'],['Vera Sol','21 / 06 / 1995','FOTÓGRAFA','VS-0702'],['Zeta Nocturno','31 / 10 / 1991','TURNO DE NOCHE','ZN-1313']];
export function identityTextures(op,guest,index,world,photo){
 const c=document.createElement('canvas');c.width=1400;c.height=878;const x=c.getContext('2d'),p=profiles[guest.id];
 x.fillStyle='#eee8dc';x.fillRect(0,0,1400,878);x.strokeStyle='#c7b9b044';x.lineWidth=2;for(let i=0;i<35;i++){x.beginPath();x.ellipse(920,470,100+i*18,200+i*6,i*.06,0,Math.PI*2);x.stroke()}
 x.fillStyle='#282236';x.fillRect(0,0,1400,118);x.fillStyle='#fff4e3';x.font='700 48px sans-serif';x.fillText('UMBRAL',60,77);x.font='23px sans-serif';x.textAlign='right';x.fillText(worldNames[world].toUpperCase()+' / ACCESO PERSONAL',1340,72);x.textAlign='left';
 x.fillStyle='#c4b4b9';x.fillRect(59,159,304,371);if(photo)x.drawImage(photo,65,165,292,359);x.fillStyle='#2b2639';x.font='700 18px monospace';x.fillText(p[3],68,564);
 x.fillStyle='#756375';x.font='21px sans-serif';x.fillText('NOMBRE Y APELLIDOS',411,177);x.fillStyle='#292334';x.font='700 58px sans-serif';x.fillText(p[0],408,249,910);
 x.fillStyle='#766777';x.font='20px sans-serif';x.fillText('NACIMIENTO',412,307);x.fillText('Nº DE SOCIO',850,307);x.fillStyle='#352f40';x.font='29px monospace';x.fillText(p[1],412,351);x.fillText(p[3]+'-'+(world+1),850,351);
 x.fillStyle='#766777';x.font='20px sans-serif';x.fillText('CONJUNTO DECLARADO',412,416);x.fillStyle='#282235';x.font='43px serif';x.fillText(op.set,412,475,884);
 x.fillStyle=guest.accent;x.fillRect(412,507,456,53);x.fillStyle='#29333a';x.font='700 22px sans-serif';x.fillText(p[2],431,541);
 x.fillStyle='#cec4bb';x.fillRect(58,596,1284,2);x.fillStyle='#756375';x.font='21px sans-serif';x.fillText('OPERACIÓN REGISTRADA',60,644);x.fillStyle='#251e30';x.font='600 '+(op.formula.length>26?42:54)+'px sans-serif';x.fillText(op.formula,60,717,1260);
 x.fillStyle='#716675';x.font='italic 21px serif';x.fillText(guest.name+' / firma del titular',64,816);x.font='16px monospace';x.fillText('NO TRANSFERIBLE · VERIFICAR EN PUERTA',610,818);
 // Decorative security foil and barcode identify this fictional club pass.
 const g=x.createLinearGradient(1220,470,1340,565);g.addColorStop(0,'#92d6bd');g.addColorStop(.5,'#b3bbdb');g.addColorStop(1,'#d7bb81');x.fillStyle=g;x.beginPath();x.arc(1280,525,45,0,Math.PI*2);x.fill();x.fillStyle='#635b71';x.font='700 38px serif';x.fillText('U',1265,537);for(let i=0;i<40;i++)x.fillRect(1100+i*5,774,(i%3)+1,52);
 const b=document.createElement('canvas');b.width=1400;b.height=878;const y=b.getContext('2d');y.fillStyle='#292335';y.fillRect(0,0,1400,878);y.fillStyle='#11101a';y.fillRect(0,130,1400,165);y.fillStyle=guest.accent;y.textAlign='center';y.font='700 120px sans-serif';y.fillText('UMBRAL',700,477);y.font='27px sans-serif';y.fillStyle='#dacdda';y.fillText(worldNames[world].toUpperCase(),700,545);y.font='24px monospace';y.fillText(p[3],700,646);y.font='italic 26px serif';y.fillText('La noche está al otro lado.',700,733);
 return[c,b].map(canvas=>{const t=new T.CanvasTexture(canvas);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;return t});
}
profiles.push(['Elías Ríos','14 / 02 / 1989','SAXOFONISTA','ER-0714'],['Mora Alba','09 / 11 / 1996','NOCTÁMBULA','MA-0327'],['Ada Cruz','28 / 05 / 1997','EXPLORADORA URBANA','AC-0264'],['Bruno Vidal','03 / 09 / 1988','VIAJERO','BV-0495'],['Ceniza Gris','17 / 04 / 1994','SUPERVIVIENTE','CG-0813'],['Óxido Ferrer','22 / 01 / 1985','COLECCIONISTA','OF-0612']);
