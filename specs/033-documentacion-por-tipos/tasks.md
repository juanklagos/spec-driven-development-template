# Tareas 033 - Documentación por tipos

- [x] T1 (R2, R4): `GUIDE_TYPES` en `site/src/guides.mjs` con los cinco tipos y el orden de lectura + prueba que falle si una guía real no tiene tipo o un tipo apunta a una guía inexistente.
- [x] T2 (R1): `scripts/sync-doc-types.mjs` — inserta o actualiza el bloque de cabecera entre marcadores en las 108 guías, en ambos idiomas.
- [x] T3 (R1): prueba de idempotencia — ejecutar el generador dos veces deja el mismo contenido.
- [x] T4 (R3): `buildSidebar()` agrupa por tipo; el sitio compila.
- [x] T5 (R5): extraer de la guía 51 las acciones de ⌘K, las dos tablas de atajos y la tabla de clientes a una guía de referencia nueva; dejar enlaces en su sitio.
- [x] T6 (R5): registrar la guía nueva en `docs/README.md`, el menú y `llms.txt`.
- [x] T7 (R7): ampliar la guía 53 con los cuatro tipos, qué no va en cada uno y cómo elegir.
- [x] T8 (R6): comprobador de enlaces sobre `docs/`, el payload y el sitio construido; cero rotos.
- [x] T9: verificación final — smoke tests, `sdd_validate`, INDEX y bitácora.
