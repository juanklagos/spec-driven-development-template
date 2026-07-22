# Tareas 017 - El menú de la documentación

## H1 — Un menú por idioma, sin mezcla

- [x] **T1a** Mapa número → nombre publicado, construido leyendo `docs/en/`, no escrito a mano.
- [x] **T1b** `sync-docs.mjs` escribe las guías españolas con ese nombre.
- [x] **T1c** Las dos reescrituras de enlaces (mismo idioma y cruzado) resuelven al nombre publicado.
- [x] **T1d** Aviso ruidoso si un número aparece en un idioma y no en el otro.
- [x] **T1e** Redirecciones de las URLs españolas anteriores (51; `09-release-checklist` ya
      compartía nombre y no necesita ninguna), generadas a partir de los nombres de archivo.
- [x] **T1f** `astro.config.mjs` las carga junto a la redirección de raíz que ya existe.

## H2 — El menú se entiende

- [x] **T2a** El reparto en siete grupos declarado una sola vez, en un módulo compartido.
- [x] **T2b** `sidebar` explícito con `label` + `translations.es` por grupo, sustituyendo al
      autogenerado.
- [x] **T2c** Solo «Empieza aquí» desplegado; el resto plegado.
- [x] **T2d** Comprobación que falla la construcción si una guía no está en exactamente un grupo.

## H3 — Verificado sobre el sitio construido

- [x] **T3a** `npm run build` en `site/` sin errores.
- [x] **T3b** Conteo en `dist`: 52 entradas en el menú español, 52 en el inglés, cero cruzadas.
- [x] **T3c** Ninguna URL española anterior devuelve 404.
- [x] **T3d** Barrido de enlaces internos entre guías en `dist`: ninguno apunta a ruta inexistente.

## Verificación de cierre

- [x] Los cuatro scripts SDD en 0 errores.
- [x] Bitácora diaria y entrada de historial de la spec.
- [x] `specs/INDEX.md` actualizado.
