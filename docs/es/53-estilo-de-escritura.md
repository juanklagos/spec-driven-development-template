# Cómo se escribe la documentación de este proyecto

<!-- sdd:doc-type:start -->

<p class="sdd-doc-type"><strong>Referencia</strong> Datos para consultar mientras trabajas. No está pensada para leerse entera.</p>

<!-- sdd:doc-type:end -->

<a href="../README.md"><img src="https://img.shields.io/badge/⬅️_Volver_al_índice-2D3139?style=for-the-badge" alt="Volver al índice"></a>

---

## 🌍 Par de idioma / Language pair

- Español: **53-estilo-de-escritura.md**
- English: [../en/53-writing-style.md](../en/53-writing-style.md)

---

## Por qué existe esta guía

Una revisión de la documentación encontró el mismo problema una y otra vez: palabras que el lector no conoce, usadas antes de que nada las explique, y ocho nombres distintos para la misma pantalla. No se arregla con buena voluntad; se arregla con reglas.

Estas reglas no son inventadas. Son las que usan las plataformas cuya documentación funciona:

- [Guía de estilo para desarrolladores de Google](https://developers.google.com/style/highlights) — segunda persona, voz activa, presente, mayúscula solo al inicio de los títulos.
- [Guía de estilo de Microsoft](https://learn.microsoft.com/en-us/style-guide/top-10-tips-style-voice) — escribe como hablas, frases cortas, palabras de todos los días, poda cada palabra sobrante.
- [Diátaxis](https://diataxis.fr/) — tutorial, cómo-hacer, referencia y explicación son cuatro cosas distintas; mezclarlas es la causa más común de documentación confusa.

## Los cinco tipos de documento

Regla de [Diátaxis](https://diataxis.fr/): un documento sirve a **una** necesidad. Mezclarlas es la causa más común de documentación confusa, y es lo que le pasaba a este proyecto: la guía del builder era a la vez lección, recetario, referencia y ensayo, así que crecía sin criterio y nadie sabía dónde poner lo nuevo.

Antes de escribir, elige el tipo. La cabecera de cada guía lo declara sola, generada desde `site/src/guides.mjs`.

| Tipo | El lector quiere | Qué lleva | Qué NO lleva |
| :--- | :--- | :--- | :--- |
| **Tutorial** | «enséñame haciendo» | una lección de principio a fin, con un resultado concreto | referencia exhaustiva, alternativas, discusión |
| **Cómo hacer** | «ayúdame a lograr X» | los pasos de una tarea, dando por sabido lo básico | explicar conceptos desde cero |
| **Referencia** | «dime cómo es» | tablas y datos para consultar mientras trabajas | pasos guiados, opiniones |
| **Explicación** | «ayúdame a entender por qué» | contexto, razones, alternativas rechazadas | instrucciones |
| **Proyecto** | material del repositorio | roadmap, lanzamientos, auditorías | nada de esto es documentación de producto |

**Cómo elegir**: si el lector no sabe nada todavía, tutorial. Si sabe qué quiere y necesita los pasos, cómo hacer. Si ya está trabajando y necesita un dato, referencia. Si pregunta «¿por qué así?», explicación.

**La señal de que mezclaste**: tu guía tiene una tabla larga en medio de un recorrido paso a paso. Esa tabla es referencia y quiere vivir aparte; deja un enlace en su sitio.

Para cambiar el tipo de una guía, edítalo en `GUIDE_TYPES` y ejecuta `node scripts/sync-doc-types.mjs`. La cabecera y el menú del sitio salen de ahí, así que no pueden discrepar.

## Las reglas

### 1. Una palabra desconocida se explica la primera vez que aparece

Regla de Google: desarrolla el término y pon la sigla entre paréntesis.

- ✅ «un conector para que tu herramienta de IA ejecute el flujo (MCP, el Model Context Protocol)»
- ❌ «un servidor MCP»

Si la palabra ya tiene entrada en el [glosario](./04-glosario.md), enlázala en su primer uso dentro de cada documento. La primera vez en *cada* documento, no la primera vez en todo el repositorio: nadie lee las guías en orden.

### 2. Un concepto, un nombre

La lista de la que no se sale:

| Se dice | No se dice |
| :--- | :--- |
| el tablero | lienzo, canvas, board, grafo (salvo el conmutador de la interfaz) |
| la compuerta | gate, hard stop, semáforo |
| la carpeta `spec/` | sidecar |
| la spec | especificación, bundle, paquete |
| el panel de la spec | drawer, cajón |
| la bitácora | logbook, registro |
| el asistente de IA | agente (salvo cuando hablas del agente que atiende la cola) |

### 3. Frases cortas

Una idea por frase. Si tiene más de dos comas, pártela. Regla de Microsoft: léela en voz alta; si te quedas sin aire, es larga.

### 4. Segunda persona y voz activa

- ✅ «Ejecuta esto en tu terminal»
- ❌ «El comando debe ser ejecutado»

### 5. Di dónde se ejecuta cada comando

Un bloque de código sin contexto asume que el lector sabe dónde está. Nunca lo sabe.

- ✅ «Desde la carpeta principal de tu proyecto, en una terminal:»
- ❌ un bloque de código a secas

Y si la ruta cambia según cómo se instaló, dilo antes de mostrar el comando.

### 6. Nada de listas que se pudren

Si un número puede cambiar (cuántas herramientas, cuántas guías), no lo escribas en prosa ni lo enumeres a mano en varios sitios. Enlaza a la referencia que se genera sola. Este proyecto ya se equivocó dos veces con «21 herramientas» cuando había 39.

### 7. No prometas lo que no existe

Cada afirmación sobre la interfaz se comprueba contra el código antes de publicarse. Una guía que describe un botón que se quitó es peor que no tener guía: manda al lector a buscar algo que no está.

### 8. Sin ingenio que estorbe

La metáfora que no aclara, sobra. «Un bibliotecario público del repositorio» no dice nada; «deja que la IA lea este repositorio, nada más» sí.

## Antes de publicar

- [ ] ¿Cada término técnico está explicado o enlazado en su primer uso?
- [ ] ¿Usaste el nombre de la tabla, y solo ese?
- [ ] ¿Alguna frase pasa de dos comas?
- [ ] ¿Cada comando dice desde dónde se ejecuta?
- [ ] ¿Cada afirmación sobre la interfaz existe hoy en el código?
- [ ] ¿El español y el inglés dicen lo mismo?
