# Manual de usuario

Guía para quien administra la liga. No hace falta saber de programación.

---

## Los tres roles

| Rol               | Qué puede hacer                                                                                                                                |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Administrador** | Todo: crear divisiones, temporadas, equipos, jornadas, partidos, capturar y corregir resultados, y cambiar la configuración.                   |
| **Encargado**     | Solo lo suyo: editar su equipo, dar de alta y baja jugadores de su plantilla, y capturar los resultados de los partidos donde juega su equipo. |
| **Público**       | Ve posiciones y resultados sin necesidad de cuenta.                                                                                            |

---

## Entrar

Necesitas tres datos: la **liga** (un identificador corto, por ejemplo `demo`), tu **correo** y tu **contraseña**.

Si te equivocas varias veces seguidas el sistema te frena unos minutos. Es a propósito: evita que alguien adivine contraseñas.

---

## Montar una liga desde cero

El orden importa. Cada paso depende del anterior.

### 1. Crear una división

**Temporadas → Nueva división**

Una división agrupa competencias del mismo tipo: _Primera Varonil_, _Segunda Varonil_, _Femenil_.
El campo _orden_ define en qué posición aparece en las listas.

### 2. Crear una temporada

**Temporadas → botón "+ Temporada"** dentro de la división.

Una temporada es un torneo con fecha de inicio y fin, por ejemplo _Apertura 2026_.
Se crea con puntuación 3-1-0 y desempate por diferencia de goles, goles a favor y enfrentamiento directo.

Marca **activa** para que aparezca en la vista pública. Al terminar el torneo, desmárcala en lugar de borrarla: así conservas el historial.

### 3. Registrar los equipos

**Equipos → Nuevo equipo**

Elige primero la temporada en el selector de arriba. Cada equipo puede tener un **encargado** asignado, que será quien administre su plantilla.

Para asignar un encargado, esa persona debe existir antes como usuario con rol _Encargado_.

### 4. Cargar las plantillas

**Equipos → Ver plantilla → Agregar jugador**

Cada jugador lleva nombre, dorsal y posición. **El dorsal no se puede repetir dentro del mismo equipo**: el sistema lo rechaza.

Desde esa misma pantalla se sube el **escudo** del equipo (PNG, JPG o WEBP, hasta 1 MB). Si no subes ninguno, se muestran las iniciales.

### 5. Generar el calendario

**Jornadas → Generar calendario**

El sistema arma el rol completo solo: cada equipo activo juega contra todos los demás una vez. Con 6 equipos salen 5 jornadas de 3 partidos.

Configuras:

- Fecha de la primera jornada
- Días entre jornada y jornada (7 = semanal)
- Hora del primer partido y horas entre partidos
- Las canchas disponibles, separadas por coma
- **Ida y vuelta**: duplica las jornadas invirtiendo quién es local

> El sistema no borra un calendario donde ya haya resultados capturados. Si necesitas rehacerlo, primero hay que quitar esos marcadores.

También puedes crear jornadas y partidos uno por uno si tu liga no usa rol corrido.

---

## Día de partidos

### Capturar un resultado

**Jornadas → clic en la jornada → botón "Capturar"** junto al partido.

Metes los goles de cada equipo y guardas. El partido queda **FINALIZADO** y **la tabla de posiciones se actualiza sola**.

Queda registrado quién capturó y a qué hora. Eso se ve en Inicio, en _Capturas recientes_.

### Corregir un resultado

Mismo lugar, el botón ahora dice **Corregir**.

- El **administrador** puede corregir siempre, sin límite.
- El **encargado** solo dentro del plazo configurado (48 horas por defecto), contado **desde la hora del partido**, no desde la captura.

Si el plazo venció, el sistema le dice al encargado que acuda al administrador.

### Borrar un marcador

Solo administrador. El botón de silbato regresa el partido a _Programado_ y lo saca de la tabla.

---

## Pantalla de inicio

- **Alerta ámbar**: partidos que ya se jugaron y siguen sin marcador. El pendiente más común.
- **Próxima jornada**: qué se juega, a qué hora y en qué cancha.
- **Top 5**: cómo va la tabla sin salir de ahí.
- **Capturas recientes**: quién capturó qué y cuándo. Es lo que usas cuando alguien reclama un marcador.

---

## Vista pública

En **Inicio** hay un botón que abre el enlace público de tu liga: `/publico/tu-liga`.

Cualquiera con ese enlace ve posiciones y resultados **sin cuenta ni contraseña**. Es el que se comparte en el grupo de WhatsApp de la liga. Está pensado para el celular.

Solo muestra las temporadas marcadas como _activas_. Nunca expone correos ni datos de los usuarios.

---

## Ajustes

**Configuración** (solo administrador):

| Ajuste                         | Para qué sirve                                             |
| ------------------------------ | ---------------------------------------------------------- |
| Nombre de la liga              | Aparece en la vista pública                                |
| Los encargados pueden capturar | Si lo apagas, solo tú capturas resultados                  |
| Horas para corregir            | Plazo del encargado. **0 = solo el administrador corrige** |
| Contacto                       | Referencia del organizador                                 |

El identificador público no se puede cambiar: rompería los enlaces ya repartidos.

---

## Preguntas frecuentes

**Se me fue un marcador mal y ya pasó el plazo.**
El administrador puede corregirlo en cualquier momento.

**Un equipo se salió a mitad del torneo.**
Cámbiale el estatus a _Inactivo_ en lugar de borrarlo. Así conservas los partidos que ya jugó.

**Quiero borrar una temporada con partidos jugados.**
El sistema no lo permite, a propósito. Márcala como no activa: desaparece de la vista pública y el historial queda intacto.

**¿Puedo llevar varias ligas en el mismo sistema?**
Sí. Cada liga está completamente aislada de las demás, incluidos usuarios y datos.

**¿Cómo doy de alta a un encargado?**
Hoy se crea desde el API. Es una de las cosas pendientes de llevar a la interfaz.
