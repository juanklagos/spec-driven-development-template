# Guía de actualización

## Propósito

Poner al día un proyecto que ya usa SDD, sabiendo de antemano qué se toca y qué
es tuyo. Antes de la spec 029 no existía un camino de actualización: existía el
efecto secundario de reinstalar, sin nombre y sin aviso previo.

## La regla, en una frase

**Lo del framework se repara; lo tuyo no se toca sin que lo pidas.**

## Mira antes de tocar

```bash
npx @juanklagos/sdd-mcp@latest upgrade --project-root . --dry-run
```

No escribe un solo byte. Te dice qué versión tienes instalada, cuál trae el
servidor, qué archivos repararía y —lo importante— cuáles son tuyos y difieren
de la versión nueva.

## Aplicar

```bash
npx @juanklagos/sdd-mcp@latest upgrade --project-root .
```

Repara los archivos del framework, recrea los que falten, deja los tuyos
intactos y mueve `.sdd/TEMPLATE_VERSION`. Si ya estás al día, no escribe nada y
te lo dice.

## Qué es "del framework" y qué es "tuyo"

| Grupo | Archivos | Qué hace la actualización |
| :--- | :--- | :--- |
| **Del framework** | `scripts/check-sdd-gate.sh`, `check-sdd-policy.sh`, `validate-sdd.sh`, `confirm-user-consent.sh`, `new-spec.sh`, `scripts/lib/*` | Los repara siempre, sin preguntar |
| **Tuyos** | `sdd.policy.yaml`, `specs/_template/*`, `template-context/*`, plantillas de `bitacora/`, `AGENTS.md` y compañía | No los escribe nunca sin `--apply` |

Los del framework son la maquinaria que hace cumplir las reglas: una copia vieja
—o manipulada— es una compuerta rota. Se verificó en la spec 021 que un
`exit 0  # TAMPERED` sobrevivía a un reinstalado byte a byte.

## Adoptar la versión nueva de un archivo tuyo

Cuando la actualización te dice que `sdd.policy.yaml` difiere, tienes tres
salidas: dejarlo como está (por defecto), mirar la diferencia tú mismo, o
adoptar la versión nueva **perdiendo tus cambios en ese archivo**:

```bash
npx @juanklagos/sdd-mcp@latest upgrade --project-root . --apply sdd.policy.yaml
```

Acepta varios separados por comas.

## Desde el agente

Si tienes el MCP conectado (ver [guía 51](./51-guia-visual-sdd-builder.md)):

- `sdd_check_version` — la comparación, sin escribir nada.
- `sdd_upgrade` — con `dryRun: true` primero, y `applyPreserved: ["..."]` para
  los archivos tuyos que decidas adoptar.

## Desde el lienzo

Si el proyecto está atrasado, el builder muestra una franja con las dos
versiones y el comando exacto. Solo avisa: actualizar lo ejecutas tú.

## Por qué el número de versión no basta

`upToDate` compara **contenido**, no solo el número del marcador. Un proyecto
puede decir `template_version=2.4.0` y tener la compuerta manipulada; para esta
herramienta eso no está al día.

## Si el andamiador te frena

`npx @juanklagos/create-sdd-project@latest .` sobre un proyecto que ya tiene
`spec/` no sobrescribe nada: te nombra el comando de actualización. Ese es el
camino.
