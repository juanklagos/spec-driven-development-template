# Checklists de calidad por etapa

<a href="../README.md"><img src="https://img.shields.io/badge/⬅️_Volver_al_índice-2D3139?style=for-the-badge" alt="Volver al índice"></a>

---

## 🗣️ Prompt amigable (copiar y pegar)

Usa esto cuando no eres técnico y quieres que la IA haga la integración + guía completa:

```text
Usando https://github.com/juanklagos/spec-driven-development-template, crea todo lo necesario para llevar a cabo mi proyecto de principio a fin.
Mi proyecto es: [explica tu proyecto en lenguaje simple].

Si mi proyecto es nuevo, inicialízalo con este template y GitHub Spec Kit.
Si mi proyecto ya existe, adáptalo a idea/specs/bitacora sin romper el comportamiento actual.
Guíame paso a paso según mi nivel (principiante/intermedio/avanzado), con lenguaje claro.
No omitas especificación, plan, tareas, traza de refinamiento, bitácora y validación.
```


> Usa estas checklists en cada compuerta de etapa. Cópialas en la descripción de tu PR o en el log de sesión.

## ✅ Etapa 1: Antes de implementar / Compuerta pre-código

**Preparación de especificación:**
- [ ] `idea/IDEA_GENERAL.md` está lleno con contenido real (no solo placeholders)
- [ ] Spec activa existe en `specs/` y está registrada en `specs/INDEX.md`
- [ ] `spec.md` tiene requisitos claros y criterios de aceptación
- [ ] `plan.md` describe el enfoque técnico y es consistente con `spec.md`
- [ ] `tasks.md` tiene una checklist priorizada de acciones concretas
- [ ] `research.md` documenta investigación técnica o alternativas consideradas

**Evaluación de riesgos:**
- [ ] Los ítems fuera de alcance están explícitamente listados en `spec.md`
- [ ] Los riesgos conocidos están documentados (deuda técnica, dependencias, incógnitas)
- [ ] Si se separó de una idea más grande: cada nueva spec tiene límites claros

**Preparación IA (si aplica):**
- [ ] La IA ha recibido `IDEA_GENERAL.md` + `spec.md` activa como contexto
- [ ] El modo de la IA está clarificado: `template maintenance` o `project execution`

## ✅ Etapa 2: Antes de abrir un Pull Request

**Alineación de código:**
- [ ] Todos los cambios están dentro del alcance definido en `spec.md`
- [ ] No hay features no documentados ni adiciones "de paso"
- [ ] Tests TDD/BDD relevantes están escritos o actualizados

**Alineación de documentación:**
- [ ] `history.md` registra qué cambió y por qué
- [ ] `tasks.md` refleja el progreso actual (ítems completados marcados)
- [ ] `specs/INDEX.md` tiene status preciso (Draft → In Progress → Ready)

**Continuidad de sesión:**
- [ ] Entrada en log diario en `bitacora/diaria/` (si aplica)
- [ ] Entrada de handoff preparada en `bitacora/handoffs/`
- [ ] Decisiones documentadas en `bitacora/decisiones/` (si se tomaron)

## ✅ Etapa 3: Antes de release / despliegue

**Completitud:**
- [ ] Todos los criterios de aceptación en `spec.md` están cumplidos
- [ ] `./scripts/validate-sdd.sh . --strict` pasa con 0 errores
- [ ] `./scripts/score-spec.sh --all` muestra scores de calidad aceptables

**Evidencia y trazabilidad:**
- [ ] Evidencia de tests registrada en `quality/evidence/`
- [ ] Checklist de release completada (ver [09-release-checklist](./09-release-checklist.md))
- [ ] Riesgos residuales comunicados a stakeholders
- [ ] `specs/INDEX.md` actualizado con status final

**Comunicación:**
- [ ] Entrada final de handoff resume el release
- [ ] `PROJECT_LOG.md` tiene una entrada de sesión para el release
- [ ] Próximos pasos claramente definidos (aunque sea "ninguno — spec completa")

## 🔄 Checklist diaria rápida (< 2 minutos)

Úsala al inicio de cada sesión de trabajo:

- [ ] Lee la última entrada en `bitacora/handoffs/`
- [ ] Revisa `specs/INDEX.md` para la spec activa
- [ ] Abre `tasks.md` e identifica el siguiente ítem sin marcar
- [ ] Comienza a trabajar
