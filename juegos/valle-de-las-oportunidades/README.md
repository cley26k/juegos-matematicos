# Valle de las Oportunidades

Videojuego educativo de simulación rural (agricultura, pesca, minería, comercio, empleos, construcción y banco) para 3.º de secundaria (República Dominicana). Trabaja inecuaciones lineales, sistemas de inecuaciones con una variable, intervalos, conjuntos solución e interés simple, integrados en la economía del juego.

## Cómo jugar

- **Sin instalar nada:** abre `index.html` con doble clic (Chrome, Edge o Firefox).
- **Servidor local (opcional):** `node tools/serve.js` y abre http://localhost:8765
- **GitHub Pages:** sube la carpeta a un repositorio y activa Pages en la rama principal. No hay paso de compilación.

Controles: WASD o flechas (Mayús para correr), Espacio o clic izquierdo para usar herramientas, E o clic derecho para hablar, 1–0 o la rueda para la barra rápida, I inventario, M mapa, J diario, N libreta, Esc pausa. En pantallas táctiles aparecen una palanca y los botones Usar y Hablar.

## Conectar la base de datos (opcional)

Sin conexión, todo se guarda en el navegador de cada equipo. Con Supabase (gratuito) el docente ve los resultados de toda la clase en un solo lugar y los estudiantes pueden continuar su partida en otra computadora.

1. Crea una cuenta y un proyecto en supabase.com.
2. En **SQL Editor**, pega el contenido de `supabase/setup.sql` y pulsa **Run**.
3. En **Project Settings → API**, copia la **Project URL** y la clave **anon public**.
4. En el juego: **Panel docente → Conexión**, pega ambos datos, pulsa **Guardar y probar conexión** y crea tu clase (código + clave docente).
5. Para que todos los equipos queden conectados sin configurarlos uno por uno, pega la URL y la clave en `js/config.js` y publica el juego en GitHub Pages. El enlace `…/?clase=TUCODIGO` abre el juego ya unido a tu clase.

Privacidad: las tablas no son accesibles directamente; todo pasa por funciones que exigen el código de clase, la clave docente o la clave personal del estudiante. Los estudiantes solo se identifican con un código anónimo.

Para probar sin Supabase: `node tools/mock-supabase.js` y usa `http://localhost:8766` como dirección.

## Pruebas

```
node tests/math.test.js
```
169 comprobaciones: motor algebraico, diagnóstico de errores y validación matemática de las 17 misiones (valores límite, desigualdades estrictas, coeficientes negativos, sistemas incompatibles, dominio entero o real).

## Arquitectura (JavaScript sin dependencias, Canvas 2D)

| Archivo | Módulo |
|---|---|
| `js/math.js` | Motor matemático: resolución paso a paso, inversión del signo, intervalos, intersecciones, dominios enteros y reales, diagnóstico de 9 tipos de error |
| `js/missions.js` | 17 misiones con todos sus campos pedagógicos; la solución se recalcula y se verifica en las pruebas |
| `js/art.js` | Pixel art procedural original: baldosas, árboles, cultivos, personajes de 4 direcciones, retratos, iconos y edificios |
| `js/data.js` | Objetos, recursos, cultivos, peces, recetas, proyectos, empleos, personajes y libros |
| `js/art2.js` | Mobiliario de interiores, decoración del pueblo y baldosas de interior |
| `js/interiors.js` | Distribución de los interiores y decoración de la casa |
| `js/events.js` | Eventos diarios, correo, regalos, objetos perdidos y amistad |
| `js/gallery.js` | Galería profunda con vista lateral |
| `js/art3.js`, `js/buildings.js`, `js/crops.js` | Personajes 16×32, edificios y cultivos detallados |
| `js/extras.js`, `js/miniquests.js` | Vecinos de ambiente, miniaventuras e interacción con objetos |
| `js/trees.js` | Árboles grandes |
| `js/hd.js` | Canal de arte en alta densidad (×2) |
| `js/world.js` | Mapa del valle, casa, mina por niveles, colisiones y rutas A* |
| `js/game.js` | Bucle, jugador, herramientas, agricultura, tiempo, clima, personajes con horarios, animales, iluminación y guardado |
| `js/ui.js` | HUD, diálogos, inventario, tiendas, banco, empleos, fabricación, construcción, mapa, diario, estadísticas y ajustes |
| `js/notebook.js` | Documentos de misión (niveles 1-2), libreta (niveles 3-4), laboratorio libre y minijuego de pesca |
| `js/analytics.js` | Registro local anónimo, panel docente y exportación CSV/JSON |
| `js/audio.js` | Música chiptune sintetizada (merengue, bachata, ambiente) y efectos |
| `js/main.js` | Pantalla de inicio, creación de personaje, introducción y modo aula |

## Implementado

- Títulos de ventanas, reloj, día y dinero en letra pixel (el texto largo usa una letra legible); sonidos ambientales según lugar y hora (pájaros, pueblo, olas, grillos, goteo en la mina); consejos contextuales que aparecen una sola vez; economía reequilibrada (cultivos más rentables, salarios moderados).
- Personajes de 16×32 con proporciones más altas, sombreado por partes, manos, cuello, ropa con pliegues y versión infantil.
- Edificios con tablas en relieve, tejas escalonadas con degradado, sombra del alero, ventanas con cortinas y reflejo, letreros colgantes, cimientos irregulares y humo en las chimeneas.
- Cultivos con silueta propia (ají en arbusto, tomate con tutor, maíz con mazorcas, habichuela en espaldera, auyama rastrera, yuca con hojas palmeadas) y tierra arada que se une entre casillas.
- Vecinos de ambiente sin misiones: Nico y Yari jugando en la plaza, el perro Canelo, Don Chepe pescando en el puente, Doña Rosa barriendo, Felipe leyendo en el banco y Junior vendiendo frío-frío en la playa.
- Presentaciones en primera persona al preguntar «¿Quién eres?».
- Documentos de misión como hoja en tablilla con pinza, foto tipo polaroid, letra manuscrita y sello de cera; libreta de espiral con papel cuadriculado.
- Arte en alta densidad (×2): el mundo se dibuja a doble resolución interna (32 píxeles reales por casilla). Todo el arte se reconstruye con Scale2x (curvas y diagonales suaves), textura fina y contornos de 1 píxel; los personajes reciben detalle propio (ojos con blanco, iris y brillo, cejas, labios, mejillas, mechones, pliegues de ropa y sombra en los zapatos). El suelo en alta resolución se calcula una vez y se reutiliza mientras el terreno no cambie.
- Arquitectura dominicana variada: casitas de madera con galería y mecedoras, casas de bloques con techo plano, tinaco y rejas, casas coloniales de dos plantas con balcón y arcos, y colmado con frente abierto. Todas más altas que los personajes.
- Árboles grandes (48×72) que se vuelven semitransparentes cuando pasas por detrás.
- Miniaventuras de los vecinos de ambiente (pelota perdida, carnada para Don Chepe, guayabas para Doña Rosa, libro de Felipe, conchas de Yari y la cuenta del frío-frío de Junior) en el diario.
- Objetos con los que interactuar: sentarse en los bancos, pedir un deseo en la fuente (+5 % en ventas ese día), beber o llenar la regadera en el pozo y patear la pelota con los niños.
- Noche de bachata cada 7 días en la plaza (18:00–22:00): todos los vecinos bailan, faroles de colores, música de fiesta y amistad extra.
- Cabras con leche diaria y queso de hoja fabricado en el taller.
- Música: temas de granja de mañana y de tarde, pueblo, noche, casa, mina, galería (goteo) y fiesta con percusión adicional.
- Textos dentro del mundo en pixel art; foco de teclado dentro de las ventanas y retorno del foco al cerrarlas.
- Galería profunda con vista lateral desde la mina (nivel 2 en adelante): gravedad, saltos, escaleras, minado por bloques con grietas, cuarzo luminoso y un cofre antiguo diario.
- Vida social: correo con regalos, ofertas diarias del mercado, pronóstico de lluvia, consejos de la biblioteca, objetos perdidos que devolver, regalos a los vecinos (cada uno con favoritos) y corazones de amistad en el diario.
- Personajes con más detalle: parpadeo, respiración, brillo en ojos y pelo, cuello, botones y cinturón.
- Interiores recorribles de los 9 negocios (mercado, semillas, banco, centro comunitario, carpintería, herrería, biblioteca, almacén y taller), cada uno con mobiliario propio, iluminación y su dueño atendiendo detrás del mostrador en horario laboral; casa del jugador decorada.
- Mundo explorable de 112×84 baldosas: finca, casa (interior), bosque, río con puentes, lago, playa y muelle, mina de 6 niveles, plaza, mercado, banco, carpintería, herrería, tienda de semillas, taller familiar, tablón de empleos, almacén, biblioteca, centro comunitario y casas de los vecinos.
- Sensación de juego: temblor de cámara al talar y picar, recursos que vuelan hacia el jugador, polvo al caminar, respiración de los personajes quietos, asistencia en esquinas y puertas, banderines en la plaza.
- Cámara suave, colisiones, interacción por proximidad o clic, ciclo de día y noche con luces (faroles, ventanas, antorchas, luciérnagas), lluvia y días nublados, agua animada, vegetación que se mece y partículas.
- Recolección con herramientas, energía, durabilidad, regeneración de recursos y aviso de inventario lleno (los objetos quedan en el suelo).
- 7 herramientas con 3 niveles (mejoras y reparación en la herrería).
- Agricultura: preparar, sembrar, regar, crecimiento diario, cosecha, 6 cultivos dominicanos, aspersores y lluvia; gallinero, gallinas, comedero y huevos.
- Pesca en mar, lago y río con especies por lugar y hora, carnada y minijuego propio.
- Economía: precios que cambian cada día (fijos dentro del día), compra y venta, cajón de envío, salarios, proyectos de obra, fabricación con recetas, estadísticas de ingresos, costos y beneficio neto.
- Banco: simulador de préstamos con gráfica del monto, préstamos opcionales, cuenta de ahorro con interés simple.
- Tablón de empleos con 8 trabajos, tabla y gráfica comparativa con el punto de corte.
- Construcción en cuadrícula con vista previa (dentro de la casa y en la finca) y recogida con el martillo.
- 10 personajes con retrato, sprite animado, horario, diálogos y misiones.
- 17 misiones en 7 capítulos con los cuatro signos, paréntesis, variables en ambos miembros, coeficientes negativos, sistemas compatibles e incompatibles, intervalos abiertos, cerrados y mixtos, dominio entero y real.
- Cuatro niveles pedagógicos: decisión en el mundo con proyección en vivo, inecuaciones construidas por el estudiante, intervalo en la recta numérica, selección del conjunto solución completo y comprobación de valores.
- Retroalimentación progresiva: consecuencia en el mundo, pregunta del personaje, recta numérica, pasos algebraicos.
- Laboratorio libre en la libreta (hasta 3 inecuaciones, intersección y valores de prueba) y biblioteca con explicaciones.
- Modo historia con guardado en 3 ranuras y autoguardado; modo aula configurable (tiempo, dificultad, contenidos, misiones, recursos y pistas).
- Panel docente guiado: PIN propio la primera vez, asistente de clase en 5 pasos (duración, temas con planes rápidos, nivel de ayuda, recursos y resumen), resultados con semáforo por estudiante, dificultades frecuentes con sugerencias de qué hacer en clase, conexión paso a paso y exportación para Excel.
- Base de datos opcional (Supabase): registros de toda la clase, configuración enviada a los equipos de los estudiantes y partidas en la nube con clave personal.
- Panel docente con PIN: resumen del grupo, detalle por estudiante, evolución, distribución de errores (matemáticos y de manejo del juego por separado), historial y exportación CSV/JSON con identificadores anónimos. Nada se envía a internet.
- Accesibilidad: tamaño de texto, alto contraste, reducción de animaciones, zoom, teclas configurables, controles táctiles.

## Pendiente (no implementado todavía)

- Muebles adicionales (techos, paredes y pisos personalizables).
- Pruebas con estudiantes reales para ajustar ritmo y dificultad.
- Más tipos de eventos narrativos (hoy hay 6) y celebraciones de temporada.
- Persistencia de los registros en un servidor (decisión de diseño: hoy todo es local).
