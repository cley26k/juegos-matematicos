// Exact rational arithmetic. Samples do not certify properties of infinite sets.
const gcd=(a,b)=>b===0n?(a<0n?-a:a):gcd(b,a%b);
export function rational(n,d=1n){n=BigInt(n);d=BigInt(d);if(!d)throw Error('La división entre cero no está definida.');if(d<0n){n=-n;d=-d}const g=gcd(n,d);return{n:n/g,d:d/g}}
export function parseValue(value){const s=value.trim().replace(',','.');if(!/^-?\d{1,6}(?:\/\d{1,6}|\.\d{1,6})?$/.test(s))throw Error('Escribe un entero, decimal o fracción (por ejemplo 1/2), de hasta 6 cifras.');if(s.includes('/')){const[n,d]=s.split('/');return rational(n,d)}if(s.includes('.')){const[p,q]=s.split('.');return rational(BigInt(p+q),10n**BigInt(q.length))}return rational(s)}
const add=(a,b)=>rational(a.n*b.d+b.n*a.d,a.d*b.d),mul=(a,b)=>rational(a.n*b.n,a.d*b.d),neg=a=>rational(-a.n,a.d);
const belongs=(v,set)=>set==='N'?v.d===1n&&v.n>=0n:set==='Z'?v.d===1n:set==='Q*'?v.n!==0n:true;
export const format=v=>v.d===1n?String(v.n):`${v.n}/${v.d}`;
export function sample(op,aText,bText){const a=parseValue(aText),b=parseValue(bText);if(!belongs(a,op.domain)||!belongs(b,op.domain))throw Error(`Ambos valores deben pertenecer a ${op.set}.`);let out;switch(op.kind){case'add':out=add(a,b);break;case'sub':out=add(a,neg(b));break;case'mul':out=mul(a,b);break;case'div':out=mul(a,rational(b.d,b.n));break;case'shift':out=add(add(a,b),rational(1));break;case'amb':return `${format(add(a,b))} o ${format(add(a,neg(b)))}: la regla no elige una única salida.`;case'max':out=a.n*b.d>=b.n*a.d?a:b;break;default:throw Error('Regla desconocida.')}return `${format(out)} ${belongs(out,op.domain)?`pertenece a ${op.set}. Este ejemplo no prueba todos los casos.`:`no pertenece a ${op.set}. Este par basta para rechazarla.`}`}
const operation=(kind,domain,formula,allowed,why)=>({kind,domain,set:{N:'ℕ = {0, 1, 2, …}',Z:'ℤ',Q:'ℚ','Q*':'ℚ sin el 0'}[domain],formula,allowed,why});
export const levels=[
{title:'La primera puerta',subtitle:'Números naturales',rule:'Esta noche solo pasan las reglas que dan un único número natural para cualquier par de naturales.',detail:'Usamos ℕ = {0, 1, 2, …}. Una operación binaria asigna a cada par un único resultado dentro del conjunto. Un par que falle basta para rechazar; varios ejemplos correctos no demuestran todos los casos.',operations:[
operation('add','N','a ★ b = a + b',true,'La suma de dos naturales siempre da un único natural. Puede entrar.'),
operation('sub','N','a ★ b = a − b',false,'2 − 5 = −3. El resultado sale de los naturales: no pasa.'),
operation('mul','N','a ★ b = a × b',true,'Multiplicar dos naturales siempre produce un único natural.'),
operation('div','N','a ★ b = a ÷ b',false,'1 ÷ 2 no es natural. Además, no se puede dividir entre 0.'),
operation('amb','N','a ★ b = a + b  ó  a − b',false,'Para 3 y 1 ofrece 4 o 2. Una operación debe elegir un único resultado.'),
operation('max','N','a ★ b = máximo(a, b)',true,'El mayor de dos naturales es siempre un único natural.')]},
{title:'La lista de los enteros',subtitle:'Grupos en ℤ',rule:'Hoy entran grupos: la operación debe quedarse en los enteros, ser asociativa, tener neutro y dar un inverso a cada número.',detail:'Un grupo necesita cerradura, asociatividad, un neutro de ambos lados e inversos para todos. En la suma de enteros, 0 es neutro y −a es el inverso de a. No hace falta conmutatividad.',operations:[
operation('add','Z','a ★ b = a + b',true,'La suma es cerrada y asociativa; 0 es neutro y −a es el inverso de cada entero a.'),
operation('mul','Z','a ★ b = a × b',false,'El producto es cerrado y asociativo, con neutro 1. Pero 2 no tiene inverso entero: necesitaría 1/2.'),
operation('shift','Z','a ★ b = a + b + 1',true,'Es cerrada y asociativa. El neutro es −1 y el inverso de a es −a − 2; ambos son enteros.'),
operation('sub','Z','a ★ b = a − b',false,'Es cerrada, pero no asociativa: (5 − 3) − 1 = 1 y 5 − (3 − 1) = 3. Tampoco tiene neutro de ambos lados.'),
operation('max','Z','a ★ b = máximo(a, b)',false,'Es cerrada y asociativa, pero no hay un menor entero que sirva de neutro para todos.'),
operation('add','Z','a ★ b = a + b',true,'Cada entero tiene su opuesto. Cerradura, asociatividad, neutro 0 e inversos: sí es un grupo.')]},
{title:'Después de medianoche',subtitle:'Grupos en ℚ',rule:'Sigue la regla de los grupos. Mira bien el conjunto del carnet: algunos invitados han dejado el cero fuera.',detail:'En ℚ la suma es un grupo. El producto solo es un grupo al quitar el 0: cada racional no nulo a tiene inverso 1/a. El conjunto forma parte de la operación; cambiarlo puede cambiar la respuesta.',operations:[
operation('mul','Q','a ★ b = a × b',false,'El producto tiene neutro 1, pero 0 no tiene inverso. ℚ con el producto no es grupo.'),
operation('mul','Q*','a ★ b = a × b',true,'Sin 0, el producto es cerrado y asociativo, tiene neutro 1 e inverso 1/a para cada racional no nulo.'),
operation('add','Q*','a ★ b = a + b',false,'1 + (−1) = 0 y el carnet excluye al 0. Falla la cerradura.'),
operation('add','Q','a ★ b = a + b',true,'La suma es cerrada y asociativa en ℚ. El neutro es 0 y cada racional a tiene inverso −a.'),
operation('div','Q*','a ★ b = a ÷ b',false,'Es cerrada sin el 0, pero no asociativa: (8 ÷ 4) ÷ 2 = 1 y 8 ÷ (4 ÷ 2) = 4.'),
operation('shift','Q','a ★ b = a + b + 1',true,'Es cerrada y asociativa en ℚ, con neutro −1 e inverso −a − 2. Sí forma un grupo.')]}];
const special=(set,formula,allowed,why)=>({set,formula,allowed,why});
levels.push(
 {title:'Bajo las luces del norte',subtitle:'Módulos · primeros pasos',rule:'Un reloj pequeño: al llegar al número del módulo, vuelves al cero. Esta noche solo hay suma y producto, siempre con el 0 incluido.',detail:'Piensa en mod 4 como 0 → 1 → 2 → 3 → 0. Para 3 + 2 avanza dos pasos: 3 → 0 → 1. En este turno, la suma pasa: 0 es neutro y siempre puedes volver a 0. El producto no pasa: 0 por cualquier número da 0, nunca el neutro 1. Esta ayuda vale para los conjuntos completos de estos carnets, no para cualquier conjunto modular.',operations:[
 special('ℤ₅ = {0, 1, 2, 3, 4}','a ★ b = (a + b) mod 5',true,'La suma módulo 5 es asociativa y cerrada. El neutro es 0 y el inverso de a es −a módulo 5.'),
 special('ℤ₅ = {0, 1, 2, 3, 4}','a ★ b = (a × b) mod 5',false,'El 0 no tiene inverso multiplicativo. No forma un grupo.'),
 special('{1, 2, 3, 4} módulo 5','a ★ b = (a × b) mod 5',true,'El neutro es 1. Los inversos son 1↔1, 2↔3 y 4↔4; el producto es cerrado y asociativo.'),
 special('{1, 2, 3} módulo 4','a ★ b = (a × b) mod 4',false,'2 × 2 = 0 módulo 4. El resultado está fuera del conjunto: falla la cerradura.'),
 special('ℤ₄ = {0, 1, 2, 3}','a ★ b = (a − b) mod 4',false,'No es asociativa: (0−0)−1 = 3, pero 0−(0−1) = 1, módulo 4.'),
 special('ℤ₄ = {0, 1, 2, 3}','a ★ b = (a + b) mod 4',true,'La suma módulo 4 forma un grupo: neutro 0, inversos 0↔0, 1↔3 y 2↔2.') ]},
 {title:'Invitados de otra órbita',subtitle:'Matrices y permutaciones',rule:'La puerta sigue reservada para grupos. Ahora llegan matrices y permutaciones; no necesitan ser conmutativas.',detail:'En S₃, componer significa aplicar primero b y después a. Todas las permutaciones tienen inversa. M₂(ℝ) son todas las matrices reales 2×2; GL₂(ℝ) solo las invertibles. I es la identidad y O la matriz cero.',operations:[
 special('S₃ · permutaciones de {1,2,3}','a ★ b = a ∘ b',true,'Componer permutaciones es cerrado y asociativo. La identidad es neutra y cada permutación se deshace con su inversa.'),
 special('M₂(ℝ) · matrices reales 2×2','A ★ B = A + B',true,'La suma es cerrada y asociativa. O es neutra y −A es la inversa de A bajo la suma.'),
 special('M₂(ℝ) · matrices reales 2×2','A ★ B = A × B',false,'La matriz cero no tiene inversa multiplicativa. Todas las matrices con el producto no forman un grupo.'),
 special('GL₂(ℝ) · matrices invertibles','A ★ B = A × B',true,'El producto de invertibles es invertible y asociativo. I es neutra y cada A tiene inversa A⁻¹. No hace falta conmutatividad.'),
 special('S₃ · permutaciones de {1,2,3}','a ★ b = a',false,'No existe neutro de ambos lados: e ★ b siempre da e, no b para todas las permutaciones.'),
 special('M₂(ℝ) · matrices reales 2×2','A ★ B = A − B',false,'La resta no es asociativa: (O−O)−I = −I, pero O−(O−I) = I.') ]},
 {title:'La última terraza',subtitle:'El turno final',rule:'Solo grupos. Esta noche se mezclan los conjuntos: revisa cada identificación antes de decidir.',detail:'Comprueba conjunto y operación juntos. Hacen falta cerradura, asociatividad, neutro de ambos lados e inversos para todos. Una sola condición que falle basta para negar la entrada.',operations:[
 operation('add','N','a ★ b = a + b',false,'En ℕ con la suma, 0 es neutro, pero 1 no tiene inverso: necesitaría −1. No es un grupo.'),
 operation('shift','Z','a ★ b = a + b + 1',true,'En ℤ es un grupo: operación cerrada y asociativa, neutro −1 e inverso −a−2.'),
 special('ℝ sin el 0','a ★ b = a × b',true,'El producto de reales no nulos es cerrado y asociativo, tiene neutro 1 e inverso 1/a.'),
 special('ℝ','a ★ b = a × b',false,'El real 0 no tiene inverso multiplicativo. No es un grupo.'),
 special('ℤ₆ = {0, 1, 2, 3, 4, 5}','a ★ b = (a + b) mod 6',true,'La suma módulo 6 forma un grupo: el neutro es 0 y cada resto tiene su opuesto módulo 6.'),
 operation('sub','Q','a ★ b = a − b',false,'La resta no es asociativa y carece de neutro de ambos lados. Ser cerrada no basta.') ]}
);
export const guests=[
{name:'Luna',skin:'skaterFemaleA',accent:'#a8e9d3',line:'La tabla se queda fuera. Yo entro, ¿no?',yes:'¡Nos vemos en la pista!',no:'Bueno… otra vuelta a la manzana.'},
{name:'Don Dante',skin:'criminalMaleA',accent:'#ffc08c',line:'Estoy en la lista. Casi seguro.',yes:'Sabía que nos íbamos a entender.',no:'La lista debe de ser la de mañana.'},
{name:'NOVA–7',skin:'cyborgFemaleA',accent:'#a0dfff',line:'Batería al 98 %. Ganas de bailar al 100.',yes:'Activando modo fiesta.',no:'Recalculando planes de esta noche.'},
{name:'Rocco',skin:'skaterMaleA',accent:'#ff999d',line:'Prometo no pedir la misma canción cinco veces.',yes:'¡Esta noche va a ser legendaria!',no:'Vale. Pero el DJ me conoce.'},
{name:'Vera',skin:'humanFemaleA',accent:'#d0b0ff',line:'Solo vengo por la última canción.',yes:'Siempre hay una canción más.',no:'Me guardas el abrigo para la próxima.'},
{name:'Zeta',skin:'zombieMaleA',accent:'#bfd491',line:'No he dormido desde el jueves. ¿Se nota?',yes:'¡Por fin algo de vida nocturna!',no:'Me vendrá bien una siesta.'}];
guests.push(
 {name:'Elías',skin:'humanMaleA',accent:'#e2b98d',line:'Traje mi saxofón. El solo va por mi cuenta.',yes:'Esta noche tiene swing.',no:'Tocaré en la esquina.'},
 {name:'Mora',skin:'zombieFemaleA',accent:'#b7c77e',line:'No es maquillaje. Es una semana muy larga.',yes:'Necesitaba sentirme viva.',no:'Volveré. Siempre vuelvo.'},
 {name:'Ada',skin:'survivorFemaleA',accent:'#e4af88',line:'Crucé media ciudad para escuchar este set.',yes:'El viaje valió la pena.',no:'Habrá otra puerta.'},
 {name:'Bruno',skin:'survivorMaleB',accent:'#9ebad4',line:'Perdí el último tren. Espero no perderme la fiesta.',yes:'Hasta el primer tren, entonces.',no:'Otra noche en la estación.'},
 {name:'Ceniza',skin:'zombieA',accent:'#b9baa5',line:'La invitación sobrevivió. Yo, más o menos.',yes:'Ni el apocalipsis cancela esta noche.',no:'Eso sí que duele.'},
 {name:'Óxido',skin:'zombieC',accent:'#d3ac7f',line:'¿Todavía aceptan carnets un poco… antiguos?',yes:'Sigo en circulación.',no:'Toca renovar el documento.'}
);
const extraLines=[
 ['Dijeron que aquí el amanecer llega tarde.','Hoy no vine a quedarme en la fila.'],
 ['Mi apellido debería abrir alguna puerta.','Traje mi mejor traje. Otra vez.'],
 ['Mis sensores detectan un bajo irresistible.','Mi actualización incluye pasos de baile.'],
 ['El ensayo terminó. Ahora empieza lo bueno.','Si entro, prometo no subir al escenario.'],
 ['La luz de este sitio sale increíble en las fotos.','No voy a fotografiarte sin permiso.'],
 ['Anoche soñé con esta puerta. Creo.','El café ya no me hace efecto.'],
 ['El DJ me debe una improvisación.','Las notas también necesitan salir de noche.'],
 ['El espejo y yo ya no nos hablamos.','Solo bailo si la canción lo merece.'],
 ['No me rindo ante una fila.','Hoy dejé la mochila en casa.'],
 ['¿La pista cierra antes que el metro?','Al menos aquí parece hacer calor.'],
 ['El fin del mundo puede esperar.','¿Tienen guardarropa para chaquetas quemadas?'],
 ['Antes esto era un almacén. Yo estaba.','Este carnet tiene más historias que yo.']
];
guests.forEach((g,i)=>{g.id=i;g.lines=[g.line,...extraLines[i]];g.height=[1.78,1.86,1.73,1.82,1.69,1.8,1.89,1.7,1.75,1.92,1.83,1.72][i]});
