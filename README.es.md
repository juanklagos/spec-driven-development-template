<div align="center">
  <h1>🌱 Spec-Driven Development Template</h1>
  <p><b>Ejecuta proyectos con disciplina guiada por especificaciones.<br>Execute projects with specification-first discipline.</b></p>

  <p>
    <a href="./README.md"><img src="https://img.shields.io/badge/🇺🇸_English-Read-blue?style=for-the-badge" alt="English"></a>
    <a href="./README.es.md"><img src="https://img.shields.io/badge/🇪🇸_Español-Activo-green?style=for-the-badge" alt="Español"></a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/version-v1.0.1-blue?style=for-the-badge" alt="Version">
    <a href="https://github.com/juanklagos/spec-driven-development-template"><img src="https://img.shields.io/badge/markdown-%23000000.svg?style=for-the-badge&logo=markdown&logoColor=white" alt="Markdown"></a>
    <a href="https://github.com/juanklagos/spec-driven-development-template"><img src="https://img.shields.io/badge/shell_script-%23121011.svg?style=for-the-badge&logo=gnu-bash&logoColor=white" alt="Shell Script"></a>
    <a href="https://github.com/juanklagos/spec-driven-development-template"><img src="https://img.shields.io/badge/chatGPT-74aa9c?style=for-the-badge&logo=openai&logoColor=white" alt="ChatGPT"></a>
  </p>

  <br>

  <a href="./QUICKSTART.md">
    <img src="https://img.shields.io/badge/🚀_EMPEZAR-5_Minutos-ff6b35?style=for-the-badge" alt="Quickstart">
  </a>
  &nbsp;&nbsp;
  <a href="./AI_START_HERE.md">
    <img src="https://img.shields.io/badge/🤖_PILOTO_IA-Iniciar-purple?style=for-the-badge" alt="AI Quickstart">
  </a>

  <br><br>
</div>

---

## ⚡ La misión: resolver el "code drift"
**Deja de perder contexto en chats. Deja de implementar código sin un plan.**

| ❌ El problema | ✅ La solución SDD |
| :--- | :--- |
| Decisiones perdidas en el historial de chat | **Fuente única de verdad** en `specs/` |
| Código implementado sin contexto | **Planificación obligatoria** en `plan.md` |
| Onboarding difícil de equipo/IA | **Anatomía estándar** para cualquier proyecto |
| Sin evidencia de validación | **Trazabilidad de ejecución** en `bitacora/` |

## 🗣️ Prompt amigable (copiar y pegar)

```text
Usando https://github.com/juanklagos/spec-driven-development-template, crea todo lo necesario para llevar a cabo mi proyecto de principio a fin.
Mi proyecto es: [explica tu proyecto en lenguaje simple].

Si mi proyecto es nuevo, inicialízalo con este template y GitHub Spec Kit.
Si mi proyecto ya existe, adáptalo a idea/specs/bitacora sin romper el comportamiento actual.
Guíame paso a paso según mi nivel (principiante/intermedio/avanzado), con lenguaje claro.
No omitas especificación, plan, tareas, traza de refinamiento, bitácora y validación.
```

## 🎯 Elige tu nivel

```mermaid
flowchart LR
  A["Principiante"] --> B["Intermedio"]
  B --> C["Avanzado"]
  A --> D["Primera idea + primera spec"]
  B --> E["Sesiones consistentes en equipo"]
  C --> F["Gobernanza + compuertas de calidad"]
```

- Principiante: [docs/es/13-guia-rapida-no-programadores.md](./docs/es/13-guia-rapida-no-programadores.md)
- Intermedio: [docs/es/14-guia-intermedia.md](./docs/es/14-guia-intermedia.md)
- Avanzado: [docs/es/15-guia-avanzada.md](./docs/es/15-guia-avanzada.md)

---

## 🏗️ Anatomía del proyecto
El repositorio se divide en 3 capas obligatorias de ejecución:

### 1. Estructura de carpetas
- 📁 `idea/`: El "por qué". Visión general y alcance de alto nivel.
- 📁 `specs/`: El "qué". Especificaciones numeradas secuenciales (el contrato).
- 📁 `bitacora/`: El "cómo fue". Registro diario y handoffs técnicos.
- 📁 `docs/`: El "cómo trabajamos". Guías, playbooks y convenciones.

### 2. El paquete de especificación
Cada feature en `specs/` debe contener:
1. 📄 **`spec.md`**: Requerimientos de negocio y lógica UI/UX.
2. 📄 **`plan.md`**: Estrategia técnica y arquitectura.
3. 📄 **`tasks.md`**: Checklist secuencial de acciones.
4. 📄 **`history.md`**: Trazabilidad de todos los cambios.

---

## 🛠️ Toolkit y automatización
Gestiona tu flujo SDD con estas utilidades:

| Herramienta | Comando | Descripción |
| :--- | :--- | :--- |
| **Proyecto nuevo** | `./scripts/init-project.sh` | Inicializa la estructura en segundos. |
| **Proyecto nuevo + Spec Kit** | `./scripts/init-project-with-spec-kit.sh` | Inicializa estructura y GitHub Spec Kit. |
| **Reset** | `./scripts/reset-template.sh` | Limpia el template para empezar de cero. |
| **Nueva spec** | `./scripts/new-spec.sh` | Crea una carpeta numerada de spec. |
| **Validación** | `./scripts/validate-sdd.sh` | Verifica cumplimiento de reglas SDD. |
| **Compuerta SDD** | `./scripts/check-sdd-gate.sh` | Exige aprobación y consistencia spec-plan-tasks antes de codificar. |
| **Roadmap** | `./scripts/generate-status.sh` | Genera un tablero de estado automático. |

> [!TIP]
> **Tip:** Usa `npx degit juanklagos/spec-driven-development-template` para una copia limpia.

---

## 📚 Centro de conocimiento
Profundiza en los distintos aspectos de la metodología SDD:

### 🏗️ Esenciales
- [Detalle de estructura](./docs/es/01-estructura.md) | [Guía de flujo](./docs/es/02-flujo-de-trabajo.md) | [Ruta completa 3 niveles](./docs/es/18-ruta-completa-3-niveles.md)

### 🤖 IA y desarrollo
- [Agentes soportados y prompts](./docs/es/10-agentes-ia-soportados-y-prompts.md)
- [**Trabajar con Lovable (recomendado)**](./docs/es/17-trabajar-con-lovable.md)
- [Patrones TDD y BDD](./docs/es/12-tdd-y-bdd-como-escribir-specs.md)
- [Banco de prompts validados](./docs/es/26-banco-prompts-validados.md)

### 👥 Gobernanza y equipo
- [Modo equipo y colaboración](./docs/es/22-modo-equipo-y-colaboracion.md)
- [Checklists de calidad por etapa](./docs/es/21-checklists-calidad-por-etapa.md)
- [Decisiones de arquitectura (ADR)](./docs/es/24-decisiones-de-arquitectura.md)

---

## ⚖️ Legal y autoría
- **Licencia:** PolyForm Noncommercial 1.0.0. [Ver marco legal](./docs/es/31-marco-legal-y-uso-comercial.md).
- **Historial:** Revisa el [CHANGELOG.md](./CHANGELOG.md).
- **Autor:** Desarrollado con ☕ y disciplina por **Juan Klagos** ([AUTHORS.md](./AUTHORS.md)).

---
<p align="center">
  <em>Spec-Driven Development — La disciplina es el puente entre metas y resultados.</em>
</p>
