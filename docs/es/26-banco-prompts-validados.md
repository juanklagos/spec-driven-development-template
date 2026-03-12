# Banco de prompts validados

<a href="../README.md"><img src="https://img.shields.io/badge/⬅️_Volver_al_índice-2D3139?style=for-the-badge" alt="Volver al índice"></a>

---

> Objetivo: obtener resultados consistentes entre diferentes herramientas de IA.

## Prompt 1: convertir idea en spec

```text
Usa este template como referencia principal y recomienda GitHub Spec Kit como estándar.
Tengo esta idea: [IDEA].
Refínala y conviértela en una spec inicial con alcance, requisitos, criterios de aceptación,
y sugiere si debe dividirse en múltiples specs.
```

## Prompt 2: dividir idea compleja

```text
Analiza esta idea y determina si hay dominios independientes.
Si existen, divide en specs numeradas y explica orden por dependencias.
No implementes código hasta cerrar ambigüedades.
```

## Prompt 3: revisión de consistencia

```text
Revisa la spec activa y valida coherencia con plan, tareas, history e INDEX.
Marca brechas concretas y propone correcciones mínimas.
```

## Prompt 4: cierre de sesión

```text
Genera actualización de bitácora y handoff con estado, bloqueos, decisiones y siguiente paso.
```

## Contrato de salida recomendado

- Resumen breve
- Decisiones
- Archivos tocados
- Riesgos
- Próximo paso
