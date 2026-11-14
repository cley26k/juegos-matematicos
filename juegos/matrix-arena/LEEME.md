# Matrix Arena · Valle Matricia

Juego pixel 3D para aprender matrices: inversa por Gauss-Jordan con diagnóstico de errores paso a paso, laboratorio de determinantes y transformaciones, casos de detective, Coliseo de transformaciones, duelos en línea, tutoriales y pruebas. Incluye el panel docente («Oficina del Alcalde») con informe por estudiante, exportación a Excel/CSV/JSON y un laboratorio estadístico.

- `index.html`: el juego completo (Three.js r128 desde cdnjs).
- `red.js`: conexión con Supabase (aulas, guardado en la nube, multijugador y descargas).
- `supabase-config.js`: URL y clave pública de tu proyecto Supabase.
- `supabase/esquema.sql`: tablas y permisos de la base de datos.

Sin configurar Supabase el juego funciona igual, pero sin conexión: el progreso se guarda solo en el navegador y no hay multijugador ni informe de la clase.

## Conectar la base de datos (una sola vez)

1. Crea un proyecto en [supabase.com](https://supabase.com) (el plan gratuito basta).
2. **SQL Editor → New query**: pega todo `supabase/esquema.sql` y pulsa **Run**.
3. **Authentication → Sign In / Providers**: activa **Allow anonymous sign-ins** (así entran los estudiantes sin correo) y deja activado **Email** (para la cuenta docente).
4. **Authentication → URL Configuration**: en *Site URL* pon `https://cley26k.github.io/juegos-matematicos/juegos/matrix-arena/`.
5. **Project Settings → API**: copia la *Project URL* y la clave *publishable* (o *anon*) en `supabase-config.js`. Nunca pongas la clave *secret* ni la *service_role*.
6. Publica los cambios (commit y push a `main`).

## Usarlo en clase

1. Entra al juego, pestaña **Soy docente → Crear cuenta docente** (confirma el correo si Supabase lo pide).
2. Crea un aula: el juego te da un **código de 6 caracteres**.
3. Los estudiantes abren el juego, eligen **Soy estudiante** y escriben el código y un apodo (sin nombre completo).
4. En el valle, el Ayuntamiento y el Observatorio solo se abren para la cuenta docente. Allí está el informe de los ciudadanos y la exportación.

## Privacidad

- Los estudiantes no dan correo ni contraseña: usan una sesión anónima del navegador y un apodo.
- Con las reglas de `esquema.sql`, cada estudiante solo puede leer y borrar sus propios datos; el docente solo ve los estudiantes de sus aulas; un usuario anónimo no puede crear aulas.
- Desde su perfil, cada estudiante puede borrar todos sus datos, también los de la nube.
- La presencia en el multijugador (posición, apodo, colores) la ven los demás jugadores del mismo código de aula.
