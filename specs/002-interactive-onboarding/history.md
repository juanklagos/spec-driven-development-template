# History 002 - interactive-onboarding

## 2026-07-17

- Se crea la spec a partir del Nivel 1 de `idea/PROPUESTAS_2026-07-17.md` (síntesis de dos investigaciones: proyectos SDD similares y formatos/estándares 2026).
- El autor aprueba la spec y la ejecución en el chat de la sesión ("hazlo"); consentimiento registrado en `.sdd/user-consent.log`.
- Alcance fijado en R1-R7 (skill portable, comandos /sdd:*, soporte Copilot, llms.txt, devcontainer, demo VHS, README); Niveles 2 y 3 quedan explícitamente fuera de alcance.

## 2026-07-17 (cierre)

- Implementación completada: R1-R7 entregados (skill, comandos /sdd:*, espejo Copilot, llms.txt + generador, devcontainer + badge, demo.tape + workflow, sección de comandos en README EN/ES).
- Validación: 3 scripts SDD en 0 errores / 0 warnings; 0 enlaces relativos rotos en los 22 archivos tocados.
- Nota: el GIF de demo (`docs/assets/demo.gif`) se materializa en la primera corrida del workflow `demo-gif` en GitHub (workflow_dispatch o release); el embed en README se añade después de esa corrida.
- Estado en `specs/INDEX.md`: Done / Completada.

## 2026-07-17 (T12 completada)

- Primera corrida real del workflow falló (vhs-action@v2 no instala ffmpeg); arreglado en spec 003 con instalación directa de vhs.
- GIF regenerado en CI (run 29594585862) y embebido en README EN/ES. T12 cerrada.
