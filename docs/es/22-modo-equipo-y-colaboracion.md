# Modo equipo y colaboración

<a href="../README.md"><img src="https://img.shields.io/badge/⬅️_Volver_al_índice-2D3139?style=for-the-badge" alt="Volver al índice"></a>

---

> SDD funciona para desarrolladores solos y equipos por igual. Esta guía explica cómo escalar de 1 a N contribuidores.

## 🎭 Roles recomendados

| Rol | Responsabilidad | Quién lo llena típicamente |
|---|---|---|
| **Spec Owner** | Mantiene `spec.md`, `plan.md`, `tasks.md` de su spec asignada | Desarrollador o líder de producto |
| **Revisor de Calidad** | Valida criterios de aceptación, revisa tests, verifica consistencia | Dev senior o QA |
| **Coordinador de Bitácora** | Asegura que se envíen handoffs y que `PROJECT_LOG.md` esté al día | Tech lead o scrum master |
| **Piloto IA** | Gestiona contexto de herramientas IA, alimenta specs a la IA, valida output | Quien esté manejando la sesión IA |

> [!TIP]
> En proyectos individuales, una persona llena todos los roles. La disciplina se mantiene igual.

## 📐 Convenciones de equipo

### Propiedad de specs
- **Un owner por spec activa.** Varias personas pueden contribuir, pero una es responsable.
- La propiedad se registra en `specs/INDEX.md` en la columna "Owner".
- Transfiere propiedad explícitamente: actualiza INDEX + crea entrada en `bitacora/handoffs/`.

### Estrategia de branches
- Nombre de branch: `spec/001-nombre-feature` o `sdd/001-nombre-feature`
- Cada branch mapea a exactamente una spec. Nunca mezcles specs en un branch.
- La descripción del PR debe referenciar la carpeta spec: `Implements specs/001-feature/`

### Handoffs de sesión
- Cuando dejes de trabajar, siempre crea un handoff en `bitacora/handoffs/`
- Incluye: qué hiciste, qué queda pendiente, bloqueos, y quién debería continuar
- Aunque vayas a continuar mañana — el contexto se degrada más rápido de lo que crees

### Resolución de conflictos
- Si dos personas modifican la misma spec, el Spec Owner resuelve conflictos
- Cambios de spec deben pasar por `history.md` — sin ediciones silenciosas
- Decisiones arquitectónicas que afectan múltiples specs van en `bitacora/decisiones/`

## 🔄 Flujo visual

```mermaid
flowchart LR
  A["💡 Idea"] --> B["📋 Spec Activa"]
  B --> C["⚙️ Implementación"]
  C --> D["✅ Validación"]
  D --> E["📝 Bitácora y Handoff"]
  E --> B
  
  style A fill:#f9f,stroke:#333
  style B fill:#bbf,stroke:#333
  style C fill:#bfb,stroke:#333
  style D fill:#fbf,stroke:#333
  style E fill:#ff9,stroke:#333
```

## 📋 Checklist de arranque para equipos

Al iniciar un proyecto de equipo con SDD:

1. [ ] Llenar `idea/IDEA_GENERAL.md` juntos (sesión de alineación)
2. [ ] Asignar Spec Owners para cada spec inicial
3. [ ] Definir cadencia de handoffs (fin de día, fin de sprint, etc.)
4. [ ] Acordar convención de nombres de branches
5. [ ] Ejecutar `./scripts/validate-sdd.sh . --strict` y corregir issues
6. [ ] Agendar sync semanal de 15 min: revisar INDEX, verificar bitácora, redistribuir specs

## 💬 Protocolo de comunicación

| Evento | Acción | Dónde registrar |
|---|---|---|
| Spec nueva creada | Notificar al equipo, actualizar INDEX | `specs/INDEX.md` + canal del equipo |
| Cambio de alcance | Discutir con el Spec Owner primero | `history.md` + `bitacora/decisiones/` |
| Bloqueo encontrado | Escalar inmediatamente, documentar | `bitacora/handoffs/` |
| Spec completada | Revisar y cerrar, actualizar INDEX | `specs/INDEX.md` status → `Done` |
