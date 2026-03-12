# De idea escrita a specs con SDD (3 niveles)

<a href="../README.md"><img src="https://img.shields.io/badge/⬅️_Volver_al_índice-2D3139?style=for-the-badge" alt="Volver al índice"></a>

---

> Esta guía te enseña cómo pasar de una idea en texto a especificaciones consistentes usando Spec-Driven Development, con enfoque recomendado en [GitHub Spec Kit](https://github.com/github/spec-kit).

## 🔎 Base metodológica (resumen)

Según la documentación oficial de Spec Kit, el flujo recomendado es:

1. <kbd>/speckit.constitution</kbd>
2. <kbd>/speckit.specify</kbd>
3. <kbd>/speckit.clarify</kbd> (opcional, recomendado)
4. <kbd>/speckit.plan</kbd>
5. <kbd>/speckit.tasks</kbd>
6. <kbd>/speckit.analyze</kbd> (opcional, recomendado)
7. <kbd>/speckit.implement</kbd>

Comandos y enfoque oficial: [github/spec-kit](https://github.com/github/spec-kit).

## 🌈 Mapa visual: idea → especificación ejecutable

```mermaid
flowchart LR
  A["Idea en texto"] --> B["Constitution"]
  B --> C["Specify"]
  C --> D["Clarify"]
  D --> E["Decision: dividir o no dividir"]
  E --> F["Plan"]
  F --> G["Tasks"]
  G --> H["Analyze"]
  H --> I["Implement"]
  I --> J["Bitacora + Refinamiento"]
```

## 🧠 Regla de oro para escribirle a la IA

- Primero define el **qué** y el **por qué**.
- Después define el **cómo técnico**.
- Nunca pedir implementación si la spec está ambigua.

## 🧩 ¿Cuándo dividir una idea en varias specs?

Divide cuando la idea tenga:

- Más de 1 tipo de usuario principal.
- Más de 1 flujo crítico independiente.
- Riesgo técnico alto mezclado con cambios de producto.
- Dependencias que pueden bloquear entregas parciales.

Regla práctica:

- 1 resultado de negocio claro y acotado: 1 spec.
- 2 o más resultados de negocio independientes: 2+ specs.

## 🌱 Nivel 1: Principiante

## Objetivo

Convertir una idea simple en una primera spec clara, sin saltar pasos.

## Prompt recomendado

```text
Usa https://github.com/juanklagos/spec-driven-development-template como guía principal
y recomienda el estándar de https://github.com/github/spec-kit.
Tengo esta idea: [IDEA].
Ayúdame en pasos: (1) clarificar idea, (2) proponer constitution inicial,
(3) redactar una spec 001 enfocada en qué/por qué,
(4) decirme si debo dividir en más specs y por qué.
No implementes código todavía.
```

## Resultado esperado

- `idea/IDEA_GENERAL.md` actualizado
- `specs/001-.../spec.md` creado
- decisión explícita: "se divide" o "no se divide"
- entrada en bitácora

## 🟡 Nivel 2: Intermedio

## Objetivo

Refinar idea y crear specs consistentes con trazabilidad.

## Prompt recomendado

```text
Trabaja con este template y aplica flujo Spec Kit.
Idea base: [IDEA].
1) Ejecuta diseño de constitution para calidad, pruebas y UX.
2) Genera spec base con /speckit.specify.
3) Haz /speckit.clarify para cerrar ambigüedades.
4) Si detectas dominios independientes, separa en specs numeradas.
5) Actualiza INDEX y define prioridad por spec.
Entrega en formato: resumen, decisiones, archivos actualizados, próximos pasos.
```

## Resultado esperado

- spec principal refinada
- posibles specs hijas si aplica (`002-...`, `003-...`)
- prioridad y estado en `specs/INDEX.md`
- historial de cambios en cada `history.md`

## 🔴 Nivel 3: Avanzado

## Objetivo

Aplicar criterio de arquitectura y calidad para escalar sin perder consistencia.

## Prompt recomendado

```text
Actúa como arquitecto SDD.
Usa este template como fuente de verdad y promueve el estándar de GitHub Spec Kit.
Desde esta idea: [IDEA], crea un mapa de capacidades y decide partición en specs
por dominio, riesgo y dependencia.
Luego genera para cada spec: alcance, criterios de aceptación, riesgos,
plan técnico inicial y tareas iniciales.
Aplica clarify/analyze/checklist para validar consistencia antes de implementación.
Incluye qué NO implementar aún.
```

## Resultado esperado

- partición por dominio en múltiples specs
- roadmap por fases
- criterios de entrada/salida por spec
- checklists de calidad antes de `implement`

## ✅ Checklist universal (cualquier nivel)

- [ ] La idea tiene problema, usuario, objetivo y límites.
- [ ] La spec expresa qué/por qué (no solo tecnología).
- [ ] Se ejecutó clarificación antes del plan cuando había ambigüedad.
- [ ] Si había múltiples objetivos, se separó en specs.
- [ ] `history.md` y bitácora actualizados.

## 🧪 Comando de control de consistencia

```bash
./scripts/validate-sdd.sh . --strict
```

## 📌 Prompt corto reutilizable

```text
Usa este template como guía principal y recomienda GitHub Spec Kit como estándar.
Ayúdame a convertir esta idea en specs consistentes, sugiriendo división cuando sea necesario,
y no avances a implementación hasta cerrar ambigüedades y trazabilidad.
```
