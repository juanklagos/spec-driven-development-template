# Tareas 012 - Veredicto de compuerta

Orden vinculante: T1 va primera. El veredicto se calcula sobre lo que devuelve el extractor.

## H1 — Cerrar el fallo abierto

- [x] **T1a** Prueba primero: extender la prueba de deriva de `scripts/test-mcp-integration.mjs`
      para comparar la **extracción** de bash y de TypeScript sobre una tabla adversaria (varios
      pares de comillas invertidas, comentario final, negaciones, espacios raros). Debe fallar contra
      el código actual.
- [x] **T1b** Hacer perezoso el `sed` de `scripts/check-sdd-gate.sh:118` y de
      `scripts/validate-sdd.sh:151`. T1a pasa a verde.
- [x] **T1c** Replicar el arreglo en la copia del sidecar y comprobar que un sidecar recién instalado
      lo lleva.

## H2 — Veredicto y postura en las cuatro superficies

- [x] **T2a** `verdict: "open" | "closed" | "blocked"` en `GateResult` y en `GateSummary`
      (`packages/sdd-core/src/index.ts`), incluido el literal del retorno temprano de workspaces sin
      specs.
- [x] **T2b** Aserción en pruebas: `ok === false` implica `verdict === "blocked"`, y exactamente uno
      de los tres valores aplica siempre.
- [x] **T2c** Añadir `verdict` al esquema de salida de las tools MCP afectadas. Recordatorio: el
      esquema rechaza propiedades no declaradas, y esto ya rompió una vez con `tone`.
- [x] **T2d** Línea de veredicto y línea de postura en `check-sdd-gate.sh`, antes del resumen,
      insuprimibles. La línea de resumen no cambia de formato.
- [x] **T2e** Bucle de argumentos real en `check-sdd-gate.sh` y `--require-open` con salida 2 cuando
      el veredicto sea `closed`. Hoy `./scripts/check-sdd-gate.sh --require-open` falla con «not an
      SDD workspace» porque parsea por posición. Replicar en el sidecar.
- [ ] **T2f** Actualizar `.claude/commands/sdd/gate.md:9` y `.github/prompts/sdd-gate.prompt.md:8`.
- [ ] **T2g** Chip y tarjeta de tres estados con etiqueta de postura: cuatro claves de i18n en cada
      idioma en `builder/src/i18n.ts` y `packages/sdd-mcp/src/dashboard.ts`, que se reflejan entre sí.
      Estilos para el estado «cerrada pero no bloqueada».

## H3 — Fallos, herencia y ámbito de archivos

- [x] **T3a** `specId` en el esquema de entrada de `sdd_record_user_consent`
      (`packages/sdd-mcp/src/server.ts:171-192`) y pasarlo al tercer argumento que `recordUserConsent`
      ya acepta. Hoy todo consentimiento registrado por la interfaz MCP degrada a línea heredada.
- [x] **T3b** Rango de revisiones real en `scripts/validate-sdd.sh:127` y `:131`. Añadir
      `fetch-depth: 0` en `.github/workflows/validate.yml:14`. Verificar que la comprobación se
      dispara de verdad en un PR.
- [ ] **T3c** Aviso de compuerta cuando el workspace todavía contiene las specs de ejemplo del
      template.
- [ ] **T3d** Documentar `reset-template.sh --confirm` como primer paso para quien llega por «Use
      this template» o `degit`, en QUICKSTART y en ambos READMEs.
- [ ] **T3e** Sección `## Ámbito de archivos / File scope` en `specs/_template/spec.md`. Solo el
      encabezado: nada de prosa dentro de un archivo de plantilla, que sobrevive al `cp`.
- [ ] **T3f** Parser junto a `extractApprovalStatus` en `workspace.ts`, siembra en `new-spec.sh` y en
      el builder, exposición en `sdd_spec_coverage`. No gobierna nada.

## H4 — Documentación y activos

- [ ] **T4a** Reescribir las afirmaciones que dicen que algo se comprueba por máquina cuando no:
      `README.md`/`README.es.md`, ambos `site/src/content/docs/*/index.mdx`, `docs/{en,es}/50`,
      `docs/{en,es}/41`, `docs/{en,es}/42`, y las cadenas de «implementación permitida» del builder y
      el dashboard. Editar `scripts/generate-llms-txt.sh:18`, no `llms.txt`.
- [ ] **T4b** No tocar las 47 apariciones de la frase de hard stop. Enuncian la regla como instrucción
      a un agente, lo cual es cierto, y `check-sdd-policy.sh:112-116` verifica su redacción exacta.
- [ ] **T4c** Fixtures: constructor de workspace de layout completo junto al de sidecar; casos de cero
      specs, spec sin aprobar, aprobada y consentida, y una secuencia andamiador→compuerta que debe
      salir verde.
- [ ] **T4d** Regenerar `demo.gif` (`demo.tape:25` mete la salida de la compuerta en la portada del
      README) y refrescar las capturas de la guía 51.
- [ ] **T4e** Registro de decisión en `bitacora/decisiones/`, dejando explícito que el detector de
      código se aplazó a la 013 y por qué.

## Verificación de cierre

- [ ] Los cuatro scripts SDD en 0 errores.
- [ ] `npm run mcp:test` y `npm run mcp:pack:smoke` en verde.
- [ ] El escenario original reproducido: workspace sin specs aprobadas, ninguna superficie afirma que
      se puede implementar.
- [ ] Build del sitio y typecheck del builder en verde.
