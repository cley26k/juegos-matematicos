import {levels,guests} from './levels.js';
export const pools=levels.map(l=>l.operations.map(o=>({...o,family:o.kind||o.formula})));
const add=(l,set,formula,allowed,why,family)=>pools[l].push({set,formula,allowed,why,family});
for(let k=2;k<=12;k++){
 add(0,'ℕ = {0, 1, 2, …}',`a ★ b = a + b + ${k}`,true,'Sumar naturales y un natural fijo siempre produce un único natural.','sum');
 add(0,'ℕ = {0, 1, 2, …}',`a ★ b = ${k}a + b`,true,'Multiplicar y sumar naturales conserva un resultado único dentro de ℕ.','weighted');
 add(0,'ℕ = {0, 1, 2, …}',`a ★ b = a + b − ${k}`,false,`Con a = b = 0, el resultado es −${k}: no pertenece a ℕ.`,'negative');
 add(0,'ℕ = {0, 1, 2, …}',`a ★ b = (a + b) / ${k}`,false,`Para a = 1 y b = 0 se obtiene 1/${k}, que no es natural.`,'fraction');
 for(const [l,set] of [[1,'ℤ'],[2,'ℚ'],[5,'ℝ']]){
  add(l,set,`a ★ b = a + b + ${k}`,true,`Es cerrada y asociativa. El neutro es −${k}; el inverso de a es −a − ${2*k}.`,'shift');
  add(l,set,`a ★ b = a + b − ${k}`,true,`Es cerrada y asociativa. El neutro es ${k}; el inverso de a es ${2*k} − a.`,'shift');
  add(l,set,`a ★ b = a − b + ${k}`,false,`No es asociativa: con a=b=c=0, (a★b)★c=${2*k}, pero a★(b★c)=0.`,'subtract');
  add(l,set,`a ★ b = ${k}a + b`,false,`No es asociativa: con a=1,b=c=0, (a★b)★c=${k*k}, pero a★(b★c)=${k}.`,'weighted');
 }
}
add(0,'ℕ = {0, 1, 2, …}','a ★ b = |a − b|',true,'La distancia entre dos naturales es un único natural, incluido 0.','distance');
add(0,'ℕ = {0, 1, 2, …}','a ★ b = mínimo(a, b)',true,'El menor de dos naturales sigue siendo un único natural.','min');
add(0,'ℕ = {0, 1, 2, …}','a ★ b = √(a + b)',false,'Con a = 2 y b = 0 se obtiene √2, que no es natural.','root');
for(let n=3;n<=13;n++){
 add(3,`ℤ${n} · restos módulo ${n}`,`a ★ b = (a + b) mod ${n}`,true,`Suma módulo ${n}: cerrada, asociativa, neutro 0 e inverso −a módulo ${n}.`,'mod-sum');
 add(3,`ℤ${n} · restos módulo ${n}`,`a ★ b = (a × b) mod ${n}`,false,'El 0 no tiene inverso multiplicativo. No forma un grupo.','mod-product');
 add(3,`ℤ${n} · restos módulo ${n}`,`a ★ b = (a − b) mod ${n}`,false,`La resta no es asociativa: (0−0)−1=${n-1}, pero 0−(0−1)=1 módulo ${n}.`,'mod-sub');
 add(3,`ℤ${n} · restos módulo ${n}`,`a ★ b = (a + b + 2) mod ${n}`,true,`Operación cerrada y asociativa. Neutro −2 e inverso −a−4, ambos módulo ${n}.`,'mod-shift');
}
for(const n of [3,4,5,6]){
 add(4,`S${n} · permutaciones de ${n} elementos`,'a ★ b = a ∘ b',true,'La composición es cerrada y asociativa, la identidad es neutra y cada permutación tiene inversa.','permutation');
 add(4,`S${n} · permutaciones de ${n} elementos`,'a ★ b = b',false,'No existe neutro de ambos lados: a ★ e siempre daría e, no a para todos.','projection');
 add(4,`M${n}(ℝ) · matrices reales ${n}×${n}`,'A ★ B = A + B',true,'La suma de matrices es cerrada y asociativa, con neutro O e inverso −A.','matrix-add');
 add(4,`M${n}(ℝ) · matrices reales ${n}×${n}`,'A ★ B = A × B',false,'La matriz cero no tiene inversa multiplicativa. No forma un grupo.','matrix-mul');
 add(4,`GL${n}(ℝ) · matrices invertibles`,'A ★ B = A × B',true,'El producto de invertibles es invertible y asociativo, con neutro I e inversa A⁻¹.','matrix-group');
 add(4,`M${n}(ℝ) · matrices reales ${n}×${n}`,'A ★ B = A − B',false,'No es asociativa: (O−O)−I = −I, mientras O−(O−I) = I.','matrix-sub');
}
export const signature=o=>`${o.set}|${o.formula}`;
// Keep every historical ID valid, but introduce modules with only small full sets.
pools[3].forEach(o=>{const n=Number(o.formula.match(/mod (\d+)$/)?.[1]);if(n>=3&&n<=6&&['mod-sum','mod-product'].includes(o.family)){o.beginner=true;o.set=`ℤ${n} = {${Array.from({length:n},(_,i)=>i).join(', ')}}`;o.why=o.allowed?`Al llegar a ${n}, vuelves a 0. Por ejemplo, ${n-1} + 1 da 0. La suma permite volver al inicio: 0 es neutro y cada número tiene un compañero que lo lleva a 0. Sí forma un grupo.`:`El conjunto incluye 0. Al multiplicarlo por cualquier número, siempre da 0: nunca llega al neutro 1. Por eso no tiene inverso y no forma un grupo.`}});
export function softenModularOrder(order,index){const kept=new Set(order.filter((id,i)=>i<index||pools[3][id].beginner));const available=shuffled(pools[3].map((o,id)=>({o,id})).filter(({o,id})=>o.beginner&&!kept.has(id)));return order.map((id,i)=>i<index||pools[3][id].beginner?id:available.pop().id)}
// Stable IDs preserve existing saved turns. Append-only pools remain reusable.
pools.forEach((pool,l)=>pool.forEach((o,i)=>o.id=`${l}:${i}`));
export function shuffled(values,rng=Math.random){const a=[...values];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
export function makeShift(l,previous=[],previousCast=[],rng=Math.random){
 const pool=pools[l],eligible=l===3?pool.filter(o=>o.beginner):pool,used=new Set(),families=new Set(),selection=[];
 // Balance admission without making its exact count predictable.
 const positives=2+Math.floor(rng()*3),wanted=shuffled([...Array(positives).fill(true),...Array(6-positives).fill(false)],rng);
 for(const yes of wanted){let options=eligible.filter(o=>o.allowed===yes&&!used.has(signature(o)));let fresh=options.filter(o=>!previous.includes(signature(o)));if(fresh.length)options=fresh;let diverse=options.filter(o=>!families.has(o.family));if(diverse.length)options=diverse;const chosen=options[Math.floor(rng()*options.length)];used.add(signature(chosen));families.add(chosen.family);selection.push(pool.indexOf(chosen))}
 const fresh=guests.map((_,i)=>i).filter(i=>!previousCast.includes(i));const cast=shuffled(fresh.length>=6?fresh:guests.map((_,i)=>i),rng).slice(0,6);
 return{order:selection,cast,dialogues:Array.from({length:6},()=>Math.floor(rng()*3))};
}
