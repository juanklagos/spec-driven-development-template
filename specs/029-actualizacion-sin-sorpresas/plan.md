# Plan 029 - actualizar SDD sin sorpresas

## Resumen

Núcleo primero (comparar y clasificar, sin escribir), luego la operación de
actualización con su modo de diagnóstico, y al final las cuatro puertas —agente,
terminal, lienzo y andamiador— como transportes delgados sobre la misma función.
El orden importa: la clasificación es la pieza que decide qué se toca, así que se
prueba antes de que nadie pueda escribir con ella.

## Contexto técnico

- `.sdd/TEMPLATE_VERSION` ya existe y lo escribe `install-spec-sidecar.sh:192`
  (`template_version`, `profile`, `installed_at`, `source`). Es la fuente de la
  comparación; no hace falta inventar un marcador.
- La clasificación ya existe implícita en el instalador: `copy_framework_file`
  (`cp -f`) frente a `copy_if_absent`. La spec la vuelve explícita y consultable
  en vez de enterrada en el orden de las líneas de un bash.
- `sdd_install_sidecar` ya delega en el instalador vía `execFile` y ya es
  idempotente (verificado). `sdd_upgrade` no reimplementa nada: reusa esa vía
  añadiendo la fase de aviso.
- El payload del framework viaja en `packages/sdd-core/framework/`, así que la
  comparación puede leer el contenido de referencia sin clonar el template.
- El contrato de la spec 021 gobierna la bandera nueva: todo argumento
  desconocido y todo estado anómalo se dicen en voz alta, nunca 0 bytes.

## Fases de implementación

1. **Núcleo: comparar.** Función pura que lee `TEMPLATE_VERSION`, compara con la
   versión del paquete y devuelve las cuatro clases de archivo (al día, framework
   a refrescar, conservado idéntico, conservado divergente). Tests con fixtures:
   sidecar viejo, sidecar al día, sidecar sin marcador, archivo divergente.
2. **Núcleo: actualizar.** Operación que aplica lo del framework y respeta lo
   conservado salvo autorización explícita, más el modo de solo diagnóstico.
   Tests de las tres propiedades de la spec: preservación byte a byte, cero
   escrituras cuando está al día, idempotencia.
3. **MCP.** `sdd_upgrade` en `server.ts` + shapes en `schemas.ts`. Superficie
   35 → 36.
4. **Terminal.** Bandera en `cli.ts` bajo el contrato de la 021.
5. **Builder.** Desfase visible en la barra superior con la acción al lado,
   sobre un endpoint REST que delegue en la función de comparación.
6. **Andamiador.** `create-sdd-project` nombra el comando de actualización en vez
   de abortar a secas.
7. **`@latest`.** Fijar donde falte, empezando por el `.mcp.json` de este repo.
8. **Verificación.** Vitest en verde; smoke stdio con el contrato nuevo; smoke
   HTTP; E2E real: instalar un sidecar viejo, editarlo, actualizarlo y comprobar
   que lo del framework se repara y lo propio sobrevive.
9. **Docs.** Guía de actualización ES/EN enlazada desde QUICKSTART y los README.

## Dependencias

- Spec 021 (el binario nunca falla en silencio): su contrato gobierna R4, y esta
  spec cierra el hueco de `@latest` que aquella dio por rodeado.
- Spec 028 (superficie completa): el patrón de herramienta MCP y de endpoint REST
  se reutiliza tal cual.
- Spec 024 (núcleo con pruebas): las funciones nuevas siguen su convención.

## Hitos

- H1: la comparación responde correctamente sobre los cuatro fixtures (fase 1).
- H2: actualizar respeta las tres propiedades (fase 2).
- H3: las cuatro puertas llevan a la misma función (fases 3-6).
- H4: verificación y docs (fases 8-9).

## Riesgos

- **La clasificación se desincroniza del instalador.** Si mañana alguien añade un
  archivo al bash y no a la lista, la actualización lo ignora en silencio —
  exactamente el defecto que esta spec ataca. Mitigación: una única fuente de la
  clasificación, consumida por ambos, y un test que falle si el instalador copia
  un archivo que la clasificación no conoce.
- **El aviso se vuelve ruido.** Si la actualización pregunta por demasiados
  archivos, el usuario acepta todo sin leer y volvemos al punto de partida.
  Mitigación: preguntar solo por los que difieren de verdad del contenido de
  referencia, no por los que simplemente existen.
- **`TEMPLATE_VERSION` ausente o manipulado.** Sidecars instalados a mano o
  anteriores al marcador. Mitigación: tratar la ausencia como «desconocida» y
  degradar a diagnóstico, nunca asumir que está al día.
- **Comparar por versión no basta.** Un usuario puede tener la versión correcta y
  archivos del framework corruptos (la 021 ya vio uno manipulado sobrevivir a un
  reinstalado). Mitigación: la clasificación compara contenido, no solo el número.
