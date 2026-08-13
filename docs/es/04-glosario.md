# Glosario

<!-- sdd:doc-type:start -->

<p class="sdd-doc-type"><strong>Referencia</strong> Datos para consultar mientras trabajas. No está pensada para leerse entera.</p>

<!-- sdd:doc-type:end -->

<a href="../README.md"><img src="https://img.shields.io/badge/⬅️_Volver_al_índice-2D3139?style=for-the-badge" alt="Volver al índice"></a>

---

## 🌍 Par de idioma / Language pair

- Español: **04-glosario.md**
- English: [../en/04-glossary.md](../en/04-glossary.md)

---

Si una palabra de la documentación te frena, está aquí. Ordenadas por lo que más se usa, no por alfabeto.

## Las cinco que más frenan

### Spec (especificación)

El documento donde escribes **qué** vas a construir y **cómo sabrás que está bien**, antes de escribir código. Es un archivo de texto, no un formulario ni una herramienta.

Cada spec vive en su propia carpeta numerada, `specs/001-checkout/`, con estos archivos dentro:

| Archivo | Qué contiene |
| :--- | :--- |
| `spec.md` | qué se construye y cómo se comprueba |
| `plan.md` | cómo se va a construir |
| `tasks.md` | la lista de tareas, con casillas |
| `history.md` | qué cambió en la spec y cuándo |
| `research.md` | qué se investigó y por qué se eligió esto |

Cuando la documentación dice «paquete de spec» o «bundle», se refiere a esa carpeta con sus archivos.

### Compuerta (gate)

La comprobación que decide si ya puedes escribir código. Es un script que ejecutas; no es una persona ni un permiso que alguien te da.

Se abre solo cuando se cumplen **tres** cosas para esa spec:

1. la spec está aprobada (lo dice una línea dentro de `spec.md`),
2. el plan concuerda con lo aprobado,
3. tu consentimiento está registrado (una línea en `.sdd/user-consent.log`).

Si falta una, la compuerta está cerrada y te dice cuál falta.

### Aprobación y consentimiento

Son dos actos distintos, y por eso hay dos pasos:

- **Aprobar** es decir «esta spec describe bien lo que quiero».
- **Consentir** es decir «empieza a implementarla ahora».

Puedes aprobar hoy y consentir la semana que viene. La compuerta exige las dos.

### Carpeta `spec/` (antes «sidecar»)

La forma de añadir este método a un proyecto **que ya tiene código**: se crea una sola carpeta nueva llamada `spec/` junto a lo que ya tienes, y nada más se mueve ni se renombra.

Es la opción normal para trabajo real. La alternativa —montar el proyecto entero dentro de esta plantilla, en `www/`— solo tiene sentido si empiezas de cero aquí dentro.

En la documentación antigua verás la palabra «sidecar». Significa exactamente esto.

### MCP (Model Context Protocol)

Un estándar que permite a tu herramienta de IA usar herramientas externas. Aquí sirve para que la IA **cree y modifique de verdad** los archivos de tu proyecto, en vez de solo describirte en el chat lo que habría que hacer.

En la práctica: registras este proyecto una vez en tu asistente y, a partir de ahí, tiene disponibles las acciones de SDD (crear una spec, comprobar la compuerta, escribir en la bitácora…).

## Las demás

### Workspace (espacio de trabajo)

La carpeta del proyecto sobre la que se está trabajando. Cuando un comando pide `--project-root` o la variable `SDD_PROJECT_ROOT`, está preguntando exactamente eso: dónde está tu proyecto.

### Bitácora

El registro de lo que pasó: decisiones, traspasos entre sesiones, notas del día. Sirve para que dentro de seis meses alguien —incluido tú— entienda por qué las cosas son como son.

### Traspaso (handoff)

Un archivo que deja el estado del trabajo por escrito para que otra persona, u otra sesión de IA, lo retome sin volver a preguntarlo todo.

### EARS

Una forma fija de escribir los criterios de aceptación para que no queden ambiguos:

> **CUANDO** [situación], **EL SISTEMA DEBERÁ** [resultado que se puede observar].

La gracia es que cada criterio escrito así se traduce casi solo en una prueba. Explicado a fondo en la [guía 12](./12-tdd-y-bdd-como-escribir-specs.md).

### Deriva (drift)

Que el código haya cambiado **después** de que aprobaste la spec. No es un error por sí solo: es un aviso de que lo escrito y lo construido puede que ya no coincidan.

### Tarea

Una acción concreta de `tasks.md`, con su casilla. Si no se puede marcar como hecha, no es una tarea: es un deseo.

### Contrato

Una regla verificable sobre cómo debe comportarse una parte del sistema.

### Investigación

Lo que averiguaste antes de decidir, y por qué elegiste una opción y no otra.

---

> [!TIP]
> Para empezar: [`QUICKSTART.md`](../../QUICKSTART.md) si eres técnico, o [`START_HERE_NON_TECH.md`](../../START_HERE_NON_TECH.md) si no lo eres.
