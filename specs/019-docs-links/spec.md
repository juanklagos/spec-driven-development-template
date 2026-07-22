# Especificación 019 - Los enlaces entre guías que el propio sincronizador rompe

## Estado de aprobación / Approval status

- Estado / Status: `Aprobado`
- Valores permitidos / Allowed values: `Pendiente` o `Aprobado` (`Pending` or `Approved`)
- Fecha de aprobación / Approval date: `2026-07-22`
- Aprobado por / Approved by: `Juan Carlos Alvarez Lagos`
- Evidencia de aprobación (enlace o cita corta) / Approval evidence (link or short quote): Chat 2026-07-22 — al reportar el defecto y preguntar si atacarlo, el autor respondió *«hazlo»*.

## Contexto

`site/scripts/sync-docs.mjs` existe, según su propia cabecera, para «reescribir los enlaces de modo
que nada dé 404 en el sitio». Hace lo contrario con los enlaces entre guías del mismo idioma.

El texto pasa por cuatro reescrituras en cadena, y **la última vuelve a capturar la salida de la
primera**. Un enlace `](./19-matriz-prompts-por-objetivo.md)` se convierte en
`](../19-prompt-matrix-by-goal/)` por la regla de guías —correcto— y acto seguido la regla general
de «cualquier otro enlace relativo» lo ve como un enlace relativo cualquiera y lo manda a
`github.com/…/blob/main/docs/19-prompt-matrix-by-goal/`, que no existe: ni lleva idioma, ni lleva
extensión, y esa carpeta no está en el repositorio.

Medido sobre el contenido sincronizado: **140 enlaces rotos en 54 archivos**, sobre 19 rutas
distintas. Los otros 70 enlaces a GitHub del mismo lote sí resuelven a un archivo real.

Dos precisiones honestas. La primera: **es anterior a la spec 017**; antes rompía igual y solo
cambiaba el slug del destino. La segunda: **la spec 017 declaró verificado que no quedaban enlaces
rotos, y esa verificación estaba incompleta** — comprobó únicamente los enlaces internos del sitio, y
estos apuntan fuera, así que el barrido no los miraba.

La regla cruzada entre idiomas se salva de milagro, no por diseño: su salida
`../../../en/guides/<slug>/` sí la captura la regla general, pero al resolverla desde `docs/<locale>/`
se sale del repositorio, y ahí la función devuelve el enlace intacto por una guarda pensada para otra
cosa.

## Objetivo

Que un enlace ya reescrito no vuelva a entrar en el molino, y que la verificación de enlaces cubra
también los que salen del sitio.

## Historia de usuario principal

Como alguien que lee una guía y pincha una referencia a otra guía, quiero llegar a esa guía, y no a
una página de GitHub que no existe.

## Escenarios de aceptación

1. Dado un enlace entre guías del mismo idioma, cuando el sitio está construido, entonces apunta a la
   otra guía dentro del sitio y no a GitHub.
2. Dado el contenido sincronizado, cuando se buscan enlaces a GitHub, entonces todos resuelven a un
   archivo que existe en el repositorio.
3. Dado el sitio construido, cuando se recorren **todos** los enlaces de todas las páginas —los
   relativos incluidos, no solo los absolutos—, entonces ninguno apunta a una página inexistente.
4. Dado un enlace a una imagen o a un archivo cualquiera del repositorio, cuando se sincroniza,
   entonces se sigue reescribiendo como hasta ahora.

## Requisitos funcionales

- **RF1** — Un enlace reescrito por una regla queda fuera del alcance de las reglas siguientes.
- **RF2** — Los enlaces entre guías del mismo idioma resuelven dentro del sitio.
- **RF3** — La comprobación de enlaces del sitio construido cubre los relativos y los que salen a
  GitHub, no solo los absolutos internos.

## Fuera de alcance

- Cambiar el contenido de las guías en `docs/`, que está bien: los enlaces de origen son correctos.
- La sección «Par de idioma / Language pair» que encabeza cada guía en español, que en el sitio se
  lee como ruido de repositorio. Es otro problema.
