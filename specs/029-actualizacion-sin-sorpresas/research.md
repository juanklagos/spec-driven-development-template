# Research 029 - actualizar SDD sin sorpresas

## Preguntas que había que responder antes de escribir la spec

### ¿Existe hoy alguna forma de actualizar un proyecto?

Sí, pero sin nombre. Medido el 2026-08-08 contra npm 2.3.0:

- `npx @juanklagos/create-sdd-project@latest .` sobre un sidecar existente aborta:
  `spec already exists — aborting to avoid overwriting`. No propone alternativa.
- `sdd_install_sidecar` sobre ese mismo proyecto **sí** actualiza. Probado sobre un
  sidecar 2.2.1 con `exit 0  # MANIPULADO` inyectado en `check-sdd-gate.sh`, más
  contenido propio (`idea/IDEA_GENERAL.md` editado, `specs/001-mi-feature/`,
  `bitacora/decisiones/2026-01-01-mia.md`):

| Comprobación | Resultado |
|---|---|
| Script manipulado | reparado (0 ocurrencias) |
| `.sdd/TEMPLATE_VERSION` | 2.2.1 → 2.3.0 |
| `idea/IDEA_GENERAL.md` | intacto |
| spec del usuario | intacta |
| decisión del usuario | intacta |

Conclusión: la mecánica ya es correcta. Lo que falta es nombre, aviso previo y
descubribilidad — no una reescritura del instalador.

### ¿Qué se actualiza y qué no?

`install-spec-sidecar.sh` usa dos ayudantes con intenciones opuestas, documentados
en el propio bash (`scripts/install-spec-sidecar.sh:68-84`):

- `copy_framework_file` → `cp -f`. Son «nuestros»: el gate, los validadores y el
  resolutor de raíz. El comentario justifica el `-f` con un caso real: un
  `exit 0  # TAMPERED` en `check-sdd-gate.sh` sobrevivió a un reinstalado
  byte a byte antes de este cambio.
- `copy_if_absent` → solo si no existe. Son del usuario: política, plantillas de
  spec, sistema operativo de agentes, plantillas de bitácora.

La segunda decisión es correcta y se conserva. El hallazgo es su coste, hasta hoy
invisible.

### ¿Ese coste es real o teórico?

Real. `git log --since` sobre la fecha de la v1.5.1:

| Archivo | Cambios | Llega a proyectos existentes |
|---|---|---|
| `templates/sidecar/sdd.policy.yaml` | 2 | nunca |
| `specs/_template/spec.md` | 2 | nunca |
| `.../AGENT_OPERATING_SYSTEM.md` | 1 | nunca |
| `bitacora/templates/DECISION_TEMPLATE.md` | 1 | nunca |

Un proyecto instalado en la 1.5.1 valida hoy contra una política de seis releases
atrás y crea specs con una plantilla vieja, sin un solo aviso.

### ¿El desajuste de versión del servidor seguía abierto?

Sí, y dentro de este mismo repositorio. La spec 021 lo dio por rodeado porque
«todos los comandos publicados fijan `@latest`». El `.mcp.json` de este template
no lo fija: `"args": ["-y", "@juanklagos/sdd-mcp"]`.

Medido con `tools/list` por stdio contra la 2.3.0 publicada:

| Invocación | Herramientas |
|---|---|
| `npx -y @juanklagos/sdd-mcp` | 21 |
| `npx -y @juanklagos/sdd-mcp@latest` | 35 |

Cachés de npx presentes en la máquina del propietario: 2.2.0 y 2.2.1. Ninguna
2.3.0 tras invocar sin `@latest`. Además, un servidor HTTP vivo (PID 49839)
servía 21 herramientas desde la caché de 2.2.1, consumido por `~/www/larepolla`
vía `http://127.0.0.1:3334/mcp`.

### ¿Hace falta un marcador de versión nuevo?

No. `install-spec-sidecar.sh:192` ya escribe `.sdd/TEMPLATE_VERSION` con
`template_version`, `profile`, `installed_at` y `source`. Lo que falta no es el
dato: es que alguien lo lea y lo compare.

## Alternativas consideradas y descartadas

- **Sobrescribir todo con respaldo `.bak`.** Un solo comando, pero convierte una
  edición deliberada de la política en un archivo que hay que ir a rescatar.
  Descartada por el propietario a favor de avisar y dejar decidir (chat 2026-08-08).
- **Solo detectar y reportar, sin escribir nunca.** Mínimo riesgo, pero deja al
  usuario el trabajo manual que esta spec existe para quitarle.
- **Actualización automática al arrancar el servidor.** Rápida, pero escribe en el
  proyecto del usuario sin que lo pida: contradice el aviso previo que es el corazón
  de la spec.
- **Un solo punto de entrada.** Se consideró exponer solo la herramienta MCP. El
  propietario pidió las cuatro puertas (agente, terminal, lienzo, andamiador)
  porque el usuario que se queda atrás no siempre tiene agente delante.

## Fuentes

- `scripts/install-spec-sidecar.sh:68-84` (clasificación), `:192` (marcador)
- `specs/021-silent-version-mismatch/spec.md` (contrato de no fallar en silencio)
- `bitacora/decisiones/2026-07-23-mcp-score-port-y-sidecar-execfile.md`
- Mediciones de esta sesión contra npm 2.3.0 y el entorno del propietario
