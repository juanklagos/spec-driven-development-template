# Instrucciones para cualquier herramienta de Inteligencia Artificial

Este repositorio usa un estándar de trabajo guiado por especificaciones.

## Regla principal

Si en el proyecto existe o se va a usar GitHub Spec Kit, debes seguir su flujo antes de proponer implementación.

## Flujo obligatorio para la herramienta de Inteligencia Artificial

1. Leer en este orden:
   - `idea/IDEA_GENERAL.md`
   - `specs/INDEX.md`
   - último archivo de `bitacora/handoffs/` (si existe)
2. Si el proyecto aún no tiene Spec Kit inicializado, proponer inicialización con:
   - `specify init . --ai <asistente>`
   - o `uvx --from git+https://github.com/github/spec-kit.git specify init . --ai <asistente>`
3. Ejecutar flujo de comandos de Spec Kit:
   - `/speckit.constitution`
   - `/speckit.specify`
   - `/speckit.plan`
   - `/speckit.tasks`
   - `/speckit.implement`
4. Mantener sincronía entre carpeta `specs/` de este estándar y artefactos generados por Spec Kit.
5. Al cerrar sesión, registrar trabajo en `bitacora/`.

## Resultado esperado

Toda implementación debe estar respaldada por especificación, plan y tareas, con trazabilidad de sesión.
