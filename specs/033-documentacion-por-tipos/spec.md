# Especificación 033 - Documentación por tipos

## Estado de aprobación / Approval status

- Estado / Status: `Aprobado`
- Valores permitidos / Allowed values: `Pendiente` o `Aprobado` (`Pending` or `Approved`)
- Fecha de aprobación / Approval date: `2026-08-13`
- Aprobado por / Approved by: `Juan Carlos Alvarez Lagos`
- Evidencia de aprobación (enlace o cita corta) / Approval evidence (link or short quote): Chat 2026-08-12: "por eso, ayudame a resolverlo" — instrucción de resolver el problema estructural de tipos de documentación

## Objetivo

Que cada documento diga qué es y sirva a una sola necesidad, para que el
lector sepa en cinco segundos si está en el sitio correcto y quien escribe
sepa dónde va lo nuevo.

## Historia de usuario principal

Como persona que llega a la documentación con una necesidad concreta —
aprender, hacer algo, consultar un dato o entender por qué — quiero que cada
guía declare a cuál de esas cuatro sirve, para no leerme un tutorial cuando
lo que busco es un dato ni una referencia cuando lo que necesito es que me
lleven de la mano.

La revisión de 2026-08-12 midió el problema: 54 guías que mezclan enseñar,
hacer y consultar en el mismo archivo. La guía 51 es a la vez tutorial de
primeros pasos, referencia de cada botón y explicación de por qué existe la
compuerta. Por eso crece sin parar y por eso se desactualiza: nadie sabe
dónde va cada cosa nueva.

## Contexto (medido, no supuesto)

- **54 guías** en `docs/en/` y `docs/es/` (00-53), emparejadas por número.
- El agrupamiento actual del sitio (`site/src/guides.mjs`, `GROUPS`) es por
  **tema** — «Empieza aquí», «Aprende SDD», «Builder visual y MCP»… — no por
  necesidad del lector. Una misma necesidad está repartida entre grupos.
- La guía 51 mezcla los cuatro tipos en 349 líneas: inicio rápido paso a
  paso (tutorial), cómo conectar un agente (cómo-hacer), la tabla de siete
  clientes y las dos tablas de atajos (referencia) y por qué el gate se
  dibuja abajo (explicación).
- Los números de guía son identificadores públicos: aparecen en el sidebar
  del sitio, en `llms.txt`, en `docs/README.md`, en enlaces cruzados entre
  guías y en las redirecciones heredadas (`buildLegacyRedirects`). Renombrar
  o renumerar rompe todo eso.
- Referencia externa: [Diátaxis](https://diataxis.fr/) — cuatro necesidades,
  cuatro formas; mezclarlas es la causa más común de documentación confusa.

## Escenarios de aceptación

1. Dado cualquier documento de `docs/`, cuando lo abro, entonces en las
   primeras líneas veo de qué tipo es, para quién es y qué tendré al
   terminar.
2. Dado el sitio publicado, cuando miro el menú lateral, entonces las guías
   están agrupadas por necesidad del lector, no por tema.
3. Dada la guía del builder, cuando busco un atajo de teclado o la tabla de
   clientes, entonces los encuentro en una referencia separada, y la guía de
   uso queda como un recorrido que se puede leer entero.
4. Dado cualquier enlace que funcionaba antes de este cambio — dentro del
   repositorio, en el sitio publicado o en el paquete npm — cuando lo sigo,
   entonces sigue llegando a su destino.
5. Dado que escribo una guía nueva, cuando consulto el estándar, entonces me
   dice a qué tipo pertenece lo que escribo y qué NO debe llevar dentro.

## Criterios de aceptación (formato EARS recomendado)

- R1 — CUANDO se abra cualquier archivo de `docs/en/` o `docs/es/`, EL
  DOCUMENTO DEBERÁ declarar en su cabecera su tipo (tutorial, cómo-hacer,
  referencia, explicación o proyecto), para quién es, y qué obtiene el lector
  al terminarlo.
- R2 — EL SISTEMA DEBERÁ mantener una única fuente de la clasificación
  tipo→guías, consumida a la vez por la cabecera de los documentos y por el
  menú del sitio, de modo que no puedan discrepar.
- R3 — CUANDO se construya el sitio, EL MENÚ DEBERÁ agrupar las guías por
  tipo de necesidad, con el orden de lectura dentro de cada grupo.
- R4 — EL SISTEMA NO DEBERÁ renombrar ni renumerar ninguna guía existente:
  los números son identificadores públicos.
- R5 — CUANDO se extraiga contenido de referencia de la guía 51 a una guía
  nueva, LA GUÍA 51 DEBERÁ enlazarla desde el punto donde ese contenido
  estaba, y la guía nueva DEBERÁ quedar registrada en el índice, el menú del
  sitio y `llms.txt`.
- R6 — DESPUÉS de cualquier cambio de esta spec, la comprobación de enlaces
  DEBERÁ dar cero rotos en `docs/`, en el paquete generado y en el sitio
  construido.
- R7 — LA GUÍA DE ESTILO (53) DEBERÁ describir los cuatro tipos, qué va y qué
  no va en cada uno, y cómo elegir el tipo antes de escribir.
- R8 — SI un documento no encaja en ninguno de los cuatro tipos por ser
  material del proyecto (roadmap, kit de prensa, auditorías, preparaciones de
  versión), ENTONCES DEBERÁ marcarse como material de proyecto y agruparse
  aparte, en vez de forzarlo dentro de un tipo.

## Requisitos

- Un módulo único de clasificación con el tipo de cada guía y el orden de
  lectura por tipo.
- Cabecera de tipo en las 108 guías (54 × 2 idiomas), generada, no escrita a
  mano.
- Menú del sitio agrupado por tipo.
- Extracción de la referencia del builder (atajos, acciones de ⌘K, tabla de
  clientes) de la 51 a una guía de referencia nueva.
- Guía 53 ampliada con los cuatro tipos y la regla de no mezclarlos.
- Comprobación de enlaces integrada en la verificación.

## Fuera de alcance / Out of scope

- Renombrar, renumerar o borrar guías existentes.
- Reescribir el contenido de las 54 guías: esta spec las **tipa** y mueve la
  referencia del builder; no reescribe el resto de su prosa.
- Cambiar la estructura de carpetas de `docs/`.
- Traducir contenido que hoy solo exista en un idioma (queda anotado, no
  resuelto aquí).
- Fusionar guías duplicadas o retirar las obsoletas (35, 39, 46): se anota
  como trabajo posterior.

## Propiedades de la spec

- Para toda guía, su tipo declarado en la cabecera DEBERÁ ser el mismo que el
  que usa el menú del sitio.
- Para todo enlace que existía antes del cambio, seguir existiendo después.

## Ámbito de archivos / File scope

- `site/src/guides.mjs` — clasificación y menú
- `scripts/` — generador de cabeceras y comprobador de enlaces
- `docs/en/`, `docs/es/` — cabeceras y la extracción de la 51
- `docs/README.md`, `llms.txt` — registro de la guía nueva

## Criterios de éxito

- Abrir cualquier guía y saber en cinco segundos si es lo que buscabas.
- La guía del builder se lee entera sin saltarse tablas de referencia.
- Quien escriba una guía nueva sabe dónde ponerla sin preguntar.
- Cero enlaces rotos en las tres superficies: repositorio, sitio y paquete.
