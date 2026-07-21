# History 011 - one-command-launcher

## 2026-07-21

- Spec creada tras la evaluación de la app de escritorio. El hallazgo que la motiva: el builder no viaja en el paquete npm (`files: ["dist"]`, `static.ts` "checkout-only by design"), así que hoy hay que clonar el repo — 752 KB de estáticos separan el estado actual de "un comando".
- Aprobada por el autor ("has lo mejor a corto y largo plazo"); consentimiento registrado. Implementación en espera de que aterricen los arreglos críticos (comparten archivos).
