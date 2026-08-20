# Plan 036 - Revisión de specs por IA, y un asistente que no se bloquea

## Resumen

Dos frentes que comparten la misma tubería. El primero quita una guardia que
sobra en el asistente y la sustituye por adición real. El segundo añade un
tipo de petición a la cola que ya existe y, sobre todo, le abre una segunda
puerta: pegar la respuesta de cualquier IA.

Nada de esto inventa un camino de escritura nuevo. Toda escritura sigue
saliendo por donde ya salía: `POST /api/spec`, `PUT sections`, `PUT /api/board`
y el diff que la persona acepta.

## Contexto técnico

- La cola vive en `packages/sdd-core/src/requests.ts` (fichero JSON por
  workspace + `agent-presence.json`) y se expone por HTTP en
  `packages/sdd-mcp/src/api.ts` y por MCP en `server.ts`.
- El builder no importa `sdd-core`: los tipos de la cola están duplicados a
  propósito en `builder/src/requests.ts`, igual que el lint EARS. Añadir un
  tipo de petición obliga a tocar los dos lados y a mantenerlos en sintonía.
- `applyBoardPlan` hace hoy: comprobar vacío → crear specs → construir un
  lienzo entero → `PUT /api/board` → recargar. El `PUT` reemplaza el lienzo
  completo; ahí está el motivo real de la guardia.

## Restricciones de diseño (SOLID, aplicado a este código)

No es un adorno: cada letra se traduce aquí a una decisión concreta y a una
prueba que la sostiene.

- **SRP** — Tres responsabilidades hoy mezcladas en `applyBoardPlan` se
  separan: *colocar* (geometría), *fusionar* (unión de lienzos) y *escribir*
  (llamadas a la API). La geometría sale a un módulo propio y puro; hoy es la
  única parte sin prueba posible porque vive dentro de una función que hace
  red.
- **OCP** — Añadir un tipo de petición no debe obligar a editar un `switch` en
  cada capa. Los tipos de la cola se declaran en un registro (tipo → esquema →
  render), y `review-spec` entra como una entrada más. La prueba: añadir un
  tipo ficticio no rompe ninguna capa existente.
- **LSP** — Los dos caminos de revisión (cola y pegado) devuelven el mismo
  tipo `Review`. Quien lo consume no puede distinguir de cuál vino, y T8 lo
  verifica comparando ambas salidas sobre la misma respuesta.
- **ISP** — El panel de revisión no recibe el store entero. Recibe lo que usa:
  la spec, una fuente de revisión y un callback de acción. Nada de
  `useBuilderStore((s) => s)`.
- **DIP** — El panel depende de un puerto `ReviewSource` (pedir, estado,
  resultado), no de `fetch` ni del store. Dos implementaciones: cola y pegado.
  Eso es lo que permite probar el panel sin servidor y lo que dejaría entrar
  una tercera fuente mañana sin tocarlo.

Además, dos reglas de la casa que esta spec no negocia: el analizador es puro
y total (devuelve `null`, nunca lanza), y los tipos duplicados entre núcleo y
builder se mantienen en sintonía con prueba cruzada, como ya se hace con el
lint EARS.

## Fases de implementación

1. **Asistente que añade** — `applyBoardPlan` acepta `{ mode }`. En `append`
   no exige vacío, parte del lienzo actual, desplaza el bloque nuevo por
   debajo de la caja envolvente de lo existente y hace `PUT` con la unión.
   `applyTemplate` sigue llamando en modo `replace-empty`: la galería no
   cambia de comportamiento.
2. **Dos acciones en el asistente** — «proponer una spec» y «proponer board
   completo», visibles siempre. La primera reutiliza `createStructured` cuando
   hay agente y la generación local cuando no; la segunda es la de hoy sin la
   guardia. Fuera el aviso ámbar `assistant.hasSpecs`.
3. **`review-spec` en el núcleo** — nuevo valor del tipo de petición, con su
   esquema y su descripción en las herramientas MCP. `sdd_next_request` y
   `sdd_respond_request` no cambian de forma: una revisión es una petición más.
4. **Analizador de revisiones** — `builder/src/review.ts`, puro y tolerante
   (acepta JSON pelado o entre vallas de código, como ya hace
   `parseStructuredDraft`). Valida que cada hallazgo ancle a una de las 7
   secciones; descarta los que no.
5. **Panel de revisión** — en `SpecDrawer`, con los dos caminos según
   presencia: cola cuando hay agente, prompt copiable + campo de pegado cuando
   no. Misma máquina de estados que `AiAssistButton` (pendiente, en curso,
   estancada, recibida, rechazada).
6. **Atajo hallazgo → sección** — el hallazgo abre el `AiAssistButton` de su
   sección con la instrucción precargada. No escribe: solo precarga.
7. **Contrato de superficies** — `ai-surfaces.test.ts` se amplía para declarar
   el panel de revisión y seguir prohibiendo IA en aprobación y consentimiento.

## Dependencias

- Spec 031 (cola de peticiones) — construida y en producción.
- Spec 032 (conectar agente) — el panel de conectar es el que enseña a poner
  un agente a atender; el camino de pegado es su alternativa, no su sustituto.

## Hitos

- H1: el asistente crea specs en un workspace poblado sin tocar lo existente.
- H2: una revisión llega por la cola y se pinta anclada por secciones.
- H3: la misma revisión, pegada a mano desde una IA sin MCP, se pinta igual.

## Riesgos

- **El `PUT` de lienzo es un reemplazo total.** Si la fusión se calcula mal,
  se pierden nodos. Mitigación: la prueba de fusión va antes que el cambio, y
  compara el lienzo previo nodo a nodo.
- **Dos copias del tipo de petición** (núcleo y builder). Mitigación: la misma
  disciplina que el lint EARS, con la prueba que ya cruza ambos lados.
- **Una revisión larga invita a aceptar a ciegas.** Mitigación: no hay «aplicar
  todo»; cada hallazgo pasa por el diff de su sección.
- **La IA de pegado puede devolver cualquier cosa.** Mitigación: analizador
  tolerante pero estricto en el ancla, y error legible con opción de repetir.
