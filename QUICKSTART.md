# Quickstart / Inicio rápido

Goal / Objetivo:
- EN: start SDD fast with the least friction.
- ES: iniciar SDD rápido con la menor fricción.

## Route A: Non-technical (recommended) / Ruta A: No técnica (recomendada)

1. Open [START_HERE_NON_TECH.md](./START_HERE_NON_TECH.md)
2. Copy the base prompt and share your project idea
3. Ask the AI to guide you step by step

## Route B: Technical / Ruta B: Técnica

### 1) Scaffold / Andamia

One command. It installs the compact `spec/` sidecar and leaves your code where it is.

Un comando. Instala el sidecar compacto `spec/` y deja tu código donde está.

```bash
npx @juanklagos/create-sdd-project my-project
cd my-project
```

EN: run it inside an existing project (`npx @juanklagos/create-sdd-project .`) and it adds
SDD without moving a single file of yours. It prints the exact next steps for what it did.

ES: ejecútalo dentro de un proyecto que ya existe (`npx @juanklagos/create-sdd-project .`)
y añade SDD sin mover ni uno de tus archivos. Al terminar imprime los pasos exactos.

> [!NOTE]
> No terminal? An AI agent can run this for you — it detects that nobody can answer a
> prompt, picks the sidecar defaults, and prints what it assumed.
>
> ¿Sin terminal? Una IA puede ejecutarlo por ti: detecta que nadie puede responder,
> toma los valores por defecto del sidecar, y dice qué asumió.

Then skip to step 4. Steps 2 and 3 are for the longer route.

Luego salta al paso 4. Los pasos 2 y 3 son para la ruta larga.

### 2) Longer route: work inside a clone of the template / Ruta larga: trabajar dentro de un clon del template

EN: only if you want the full teaching workspace — the 32 guides, the course, the examples —
in the same repository as your code. Most people do not need this.

ES: solo si quieres el espacio de enseñanza completo —las 32 guías, el curso, los ejemplos—
en el mismo repositorio que tu código. La mayoría no lo necesita.

```bash
npx degit juanklagos/spec-driven-development-template my-project
cd my-project
```

Alternative / Alternativa:

```bash
git clone https://github.com/juanklagos/spec-driven-development-template.git my-project
cd my-project
```

#### 2b) Clear the template's own work / Limpia el trabajo del propio template

Run this first, before anything else:

Ejecuta esto antes que nada:

```bash
./scripts/reset-template.sh --confirm
```

EN: a copy of this repository arrives carrying the template's own specs and its
recorded approvals. They are not yours, and until you clear them your gate is
reporting on somebody else's project. This removes the example specs and
archives the inherited consent log into `.sdd/inherited/`.

ES: una copia de este repositorio llega con las specs del propio template y sus
aprobaciones registradas. No son tuyas, y hasta que las borres tu compuerta está
informando sobre el proyecto de otra persona. Esto elimina las specs de ejemplo
y archiva el registro de consentimiento heredado en `.sdd/inherited/`.

The gate warns you if you skip it. / La compuerta te avisa si te lo saltas.

#### 2c) Create execution workspace / Crea espacio de ejecución

```bash
./scripts/create-www-project.sh my-project codex
cd www/my-project
```

Important / Importante:
- EN: `./www/...` is the recommended default workspace inside this template.
- ES: `./www/...` es el espacio recomendado por defecto dentro de este template.
- EN: You can also initialize an external target path when the runnable project should live elsewhere.
- ES: También puedes inicializar una ruta externa si el proyecto ejecutable debe vivir en otro lugar.

Default:
- EN: recommended scaffold (best default for project quality).
- ES: scaffold recomendado (mejor valor por defecto para calidad del proyecto).

Minimal only:

```bash
./scripts/create-www-project.sh my-project codex --minimal-template
cd www/my-project
```

Optional full packs:

```bash
./scripts/create-www-project.sh my-project codex --full-template
cd www/my-project
```

External target path (compact sidecar, recommended) / Ruta externa (sidecar compacto, recomendado):

```bash
./scripts/install-spec-sidecar.sh /absolute/path/to/project --profile=recommended
cd /absolute/path/to/project
```

Full standalone workspace only when explicitly needed / Workspace standalone completo solo cuando se necesite explícitamente:

```bash
./scripts/init-project.sh /absolute/path/to/project --profile=full
cd /absolute/path/to/project
```

### 3) Initialize Spec Kit (recommended) / Inicializa Spec Kit (recomendado)

```bash
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git
specify init . --ai codex
```

One-shot / Uso puntual:

```bash
uvx --from git+https://github.com/github/spec-kit.git specify init . --ai codex
```

> [!NOTE]
> Step 1 installed the compact sidecar, so SDD lives in `spec/` and its scripts in
> `spec/scripts/`. If you took the longer route with `--full-template`, drop the `spec/`
> prefix everywhere below — the scaffolder prints the right paths for your profile when
> it finishes.
>
> El paso 1 instaló el sidecar compacto, así que SDD vive en `spec/` y sus scripts en
> `spec/scripts/`. Si tomaste la ruta larga con `--full-template`, quita el prefijo `spec/`
> en todo lo de abajo — el andamiador imprime las rutas correctas para tu perfil al
> terminar.

### 4) Define idea / Define idea

Complete `spec/idea/IDEA_GENERAL.md` with:
- Project name / Nombre
- Problem / Problema
- Main goal / Objetivo principal
- MVP scope / Alcance MVP

### 5) Create first spec / Crea primera spec

```bash
./spec/scripts/new-spec.sh "my-feature" "Owner"
```

Fill:
- `spec/specs/001-.../spec.md`
- `spec/specs/001-.../plan.md`
- `spec/specs/001-.../tasks.md`
- `spec/specs/001-.../history.md`

### 6) Apply SDD gate / Aplica compuerta SDD

No code before:
- approved `spec.md`
- consistent `plan.md`
- explicit user consent recorded right before execution/implementation:

```bash
./spec/scripts/confirm-user-consent.sh --spec 001-my-feature "User approved implementation for spec 001-my-feature"
```

The `--spec` id must be the full folder name. A bare number is not auto-detected.
El id de `--spec` es el nombre completo de la carpeta. Un número suelto no se detecta.

### 7) Validate + close session / Valida + cierra sesión

```bash
./spec/scripts/validate-sdd.sh . --strict
./spec/scripts/check-sdd-policy.sh .
./spec/scripts/check-sdd-gate.sh .
```

Update:
- `spec/bitacora/global/PROJECT_LOG.md`
- `spec/bitacora/diaria/AAAA-MM-DD.md`
- `spec/bitacora/handoffs/` (if pending work)

## Next / Siguiente

- AI detailed starter / Inicio IA detallado: [AI_START_HERE.md](./AI_START_HERE.md)
- Command results reference / Referencia de resultados por comando: [EN](./docs/en/40-command-results-reference.md) | [ES](./docs/es/40-referencia-resultados-comandos.md)
- Beginner path / Ruta principiante: [EN](./docs/en/13-quick-guide-non-programmers.md) | [ES](./docs/es/13-guia-rapida-no-programadores.md)
- Prompt bank / Banco de prompts: [EN](./docs/en/26-validated-prompt-bank.md) | [ES](./docs/es/26-banco-prompts-validados.md)
