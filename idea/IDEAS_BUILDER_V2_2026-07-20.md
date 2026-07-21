# Ideas Builder v2 — 2026-07-20

> Backlog de ideas para el SDD Builder (spec 006+). Al aprobarse una, se convierte en spec numerada.
> Eje: fácil para vibe coders + potencia avanzada. Inspiración validada: Relume (generar→refinar), Traycer (dependencias), Kiro (specs ejecutables), tldraw computer (canvas+IA).

## A. Facilidad (público vibe coding)

1. **✨ Asistente IA "Descríbeme tu proyecto"** — escribes una frase; el agente (vía las tools MCP existentes `sdd_board_*`) genera las tarjetas idea→épicas→specs conectadas; tú las acomodas y apruebas. El "Relume de las specs" completo. [esfuerzo: medio]
2. **Plantillas visuales de arranque** — galería: App web, API, E-commerce, SaaS... precarga un board típico con épicas/specs conectadas (reusa los playbooks de la guía 27). [bajo]
3. **Semáforo del gate en el canvas** — chip vivo verde/rojo del gate + botón "Validar ahora"; errores mostrados como badges rojos sobre la tarjeta afectada. [bajo]
4. **Editor guiado de spec.md en el drawer** — formulario: historia de usuario, escenarios, criterios EARS con autocompletado ("CUANDO... EL SISTEMA DEBERÁ..."), fuera de alcance. Escribe secciones sin markdown crudo. [medio]
5. **Botón "Aprobar spec"** — un clic con confirmación escribe la sección de aprobación (estado/fecha/aprobador); el gate real lo refleja. [bajo]
6. **Tour de bienvenida** — 5 globos la primera vez (paleta→crear→conectar→tareas→gate) + enlace al curso/tutor. [bajo]
7. **Undo/redo + atajos** (Cmd+Z, duplicar tarjeta). [medio]
8. **Selector de workspace en la TopBar** — workspaces recientes, cambiar sin reiniciar el server. [medio]
9. **Vista Kanban alternativa** — toggle lienzo ↔ columnas por estado (Borrador/Aprobada/Hecha); mismas fuentes .md. [medio]
10. **Exportar board a PNG/SVG** — para compartir o pegar en el README del proyecto. [bajo]

## B. Avanzado

11. **Épicas como grupos reales** — subflows de React Flow: la Épica contiene specs, colapsa/expande; jerarquía en canvas. [medio]
12. **Dependencias con semántica** — edges tipados (depende de/bloquea); el gate avisa si implementas una spec cuya dependencia no está aprobada. Extiende check-sdd-gate. [medio-alto]
13. **Timeline por tarjeta** — history.md + git log de la spec como línea de tiempo en el drawer. [medio]
14. **"Implementar con agente" desde la tarjeta** — botón que precarga el prompt de /sdd:gate + spec activa para Claude Code (deep link o copy). Dibujas → apruebas → el agente construye: el círculo completo. [medio]
15. **MCP App embebida** (Fase 3 planeada, post 2026-07-28). [alto]
16. **Presencia multi-jugador ligera** — quién mira el board + locks suaves por tarjeta (el SSE ya existe). [medio-alto]
17. **Lint EARS en vivo** — validador de criterios en el drawer con sugerencias; puente a specs ejecutables (backlog guía 50). [medio]
18. **Import/export JSON Canvas y Mermaid** — abrir boards de Obsidian Canvas; exportar el grafo a Mermaid para docs. [bajo-medio]
19. **Panel de métricas** — progreso global (specs aprobadas, tareas, última validación) integrando el dashboard al builder. [bajo]
20. **Tasks → issues de GitHub por tarjeta** — botón "Crear issues" (gh); cierra el pendiente de la guía 50 dentro del builder. [medio]

## Paquetes sugeridos

- **v2 "Fácil" (spec 007)**: 3+5+6+10 (quick wins) + 2 (plantillas) + 4 (editor guiado).
- **v3 "IA" (spec 008)**: 1 (asistente) + 14 (implementar con agente) + 17 (lint EARS).
- **v4 "Equipos" (spec 009)**: 9 (kanban) + 12 (dependencias semánticas) + 20 (issues) + 16 (presencia).
- Fase 3 MCP App corre en paralelo cuando la spec MCP asiente.
