# Decisiones de arquitectura

<a href="../README.md"><img src="https://img.shields.io/badge/⬅️_Volver_al_índice-2D3139?style=for-the-badge" alt="Volver al índice"></a>

---

> Las decisiones de arquitectura que cruzan specs deben registrarse centralmente para que cualquier miembro del equipo (o IA) entienda el "por qué" detrás del sistema.

## 📐 ¿Qué califica como decisión de arquitectura?

No toda elección necesita un registro formal. Usa esta guía:

| Regístrala | No hace falta |
|---|---|
| Elegir tecnología de base de datos | Nombrar una variable |
| Decidir estrategia de autenticación | Elegir un color CSS |
| Seleccionar plataforma de despliegue | Elegir entre for/while |
| Definir enfoque de versionado de API | Agregar una función utilitaria |
| Dependencias cruzadas entre specs | Cambios dentro del alcance de una sola spec |

**Regla práctica:** Si cambiar esta decisión después requeriría modificar múltiples specs o refactoreo significativo, regístrala.

## 📝 Template de Registro de Decisión (ADR-lite)

Usa este formato para cada decisión. Guárdalas en `bitacora/decisiones/` con nombres como `001-estrategia-auth.md`.

```markdown
# ADR-001: [Título de la Decisión]

## Status
Aceptada | Propuesta | Sustituida por ADR-XXX

## Contexto
¿Qué problema enfrentamos? ¿Qué fuerzas están en juego?

## Opciones Evaluadas
1. **Opción A:** [Descripción] — Pros: ... / Contras: ...
2. **Opción B:** [Descripción] — Pros: ... / Contras: ...
3. **Opción C:** [Descripción] — Pros: ... / Contras: ...

## Decisión
Elegimos **Opción X** porque [justificación].

## Consecuencias
- Positivas: [qué mejora]
- Negativas: [qué trade-offs aceptamos]
- Specs afectadas: [listar números de spec]

## Fecha
YYYY-MM-DD
```

## 📚 Ejemplos de decisiones

### ADR-001: Estrategia de autenticación
- **Contexto:** Necesitamos auth client-side para SPA + API
- **Opciones:** JWT en localStorage vs. httpOnly cookie vs. OAuth2 code flow
- **Decisión:** httpOnly cookie con CSRF token
- **Impacto:** Seguridad client-side mejorada, requiere middleware CSRF en todos los endpoints con estado
- **Specs afectadas:** 001-auth, 003-api-security

### ADR-002: Tecnología de base de datos
- **Contexto:** Almacenamiento persistente para datos y configuraciones de usuario
- **Opciones:** PostgreSQL vs. MongoDB vs. SQLite
- **Decisión:** PostgreSQL con Prisma ORM
- **Impacto:** Soporte relacional fuerte, equipo ya familiarizado; requiere hosting de servidor DB
- **Specs afectadas:** 001-data-model, 002-user-profiles, 004-reporting

### ADR-003: Monorepo vs. multi-repo
- **Contexto:** Frontend y backend necesitan compartir types y contratos de API
- **Opciones:** Monorepo (Turborepo) vs. repos separados con paquete npm compartido
- **Decisión:** Monorepo con Turborepo
- **Impacto:** Tipos compartidos más fáciles, un solo pipeline CI; setup inicial algo más complejo
- **Specs afectadas:** Todas

## 🔗 Integración con el flujo SDD

- **Cuándo crear:** Antes de implementar, idealmente durante la escritura de `plan.md`
- **Dónde guardar:** `bitacora/decisiones/NNN-titulo.md`
- **Cómo referenciar:** En `spec.md` o `plan.md`, enlaza al ADR: "Ver ADR-002 para elección de base de datos"
- **Cuándo actualizar:** Si una decisión se revierte o reemplaza, actualiza el status y crea un nuevo ADR
