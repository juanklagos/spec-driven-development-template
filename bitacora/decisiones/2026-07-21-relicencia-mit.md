# Decisión clave - Relicenciar a MIT y mover la propiedad del nombre a las cuentas / Key decision - Relicense to MIT

## Date / Fecha

2026-07-21

Supersede a [`2026-03-12-polyform-noncommercial-source-available.md`](2026-03-12-polyform-noncommercial-source-available.md).

## Context / Contexto

El propietario pidió, textualmente, que el proyecto «se pueda utilizar en la empresa y cualquiera la
pueda utilizar en cualquier modo», incluido dentro de proyectos open source, «sin olvidar que el
repositorio es mío». La licencia vigente hacía imposibles las tres primeras condiciones:

1. **`legal/COMMERCIAL_LICENSE.md:33`** listaba «uso interno empresarial ligado a operaciones
   comerciales» entre los usos que exigían autorización escrita del autor. Ningún empleado de ninguna
   empresa podía usar esto en su trabajo.
2. **PolyForm no es legible por máquina.** `gh api repos/juanklagos/spec-driven-development-template`
   devolvía `spdx_id: NOASSERTION`, `name: "Other"`. Para cualquier escáner corporativo el repo no
   figuraba como restrictivo sino como **sin licencia**, que es un bloqueo más duro. El proyecto
   pagaba el costo de una licencia restrictiva sin recibir su beneficio.
3. **La restricción no comercial viola la cláusula de no discriminación por campo de uso de OSI**, así
   que ningún proyecto open source podía incorporar un solo archivo. `legal/CLA.md:10` lo decía sin
   rodeos: *"this project is not open source under OSI terms"*.

El registro que se supersede ya listaba estos disparadores en su sección «Cuándo revisar»
(`2026-03-12-...md:54-60`): un canal de distribución que exija licencia OSI, y que el objetivo pase de
control a adopción. Ambos se cumplieron. Ese mismo registro admite en su línea 7 que **el motivo
original de adoptar PolyForm nunca se escribió**, así que no hay razonamiento documentado que revocar.

El costo de relicenciar era mínimo y sólo podía subir: `git log` da 145 commits de un único autor, más
5 de `github-actions[bot]`. Cero contribuidores externos, cero PRs mergeados, cero trailers
`Co-authored-by`. Un solo titular del copyright significa que no hace falta el consentimiento de nadie.

## Decision / Decisión

**Licencia MIT para todo el repositorio.** Un único `LICENSE` en la raíz, copiado sin modificar a los
tres paquetes publicables, con `Copyright (c) 2026 Juan Carlos Alvarez Lagos`. Un solo identificador
SPDX en todo el árbol.

Tres piezas de apoyo:

- **`TEMPLATE-OUTPUT.md`** — un compromiso de no reclamar, no una segunda licencia: lo que el usuario
  escribe rellenando las plantillas es suyo, sin atribución. Se eligió un compromiso y no CC0 o MIT-0
  porque un segundo identificador en el tarball hace que los escáneres tipo ScanCode reporten
  desacuerdo entre lo declarado y lo detectado, que es justo lo que este cambio viene a eliminar.
- **`legal/TRADEMARK_POLICY.md` reescrito.** La versión anterior reclamaba la frase «Spec-Driven
  Development Template», que es genérica y no registrable, y prohibía usar el nombre del proyecto como
  marca propia sin conceder nunca el permiso de fork-y-renombrado. La nueva renuncia expresamente a la
  frase genérica, permite expresamente hacer fork, renombrar, vender y hospedar, y limita lo que se
  reclama a lo que de verdad identifica al autor.
- **`legal/COMMERCIAL_LICENSE.md` eliminado**, sustituido por `legal/COMMERCIAL_SUPPORT.md`: no hay
  nada que comprar; el soporte de pago es un servicio opcional, no un permiso.

**Dónde queda la propiedad después**, en orden de solidez real: el scope `@juanklagos` de npm (lo hace
cumplir el registro, no un tribunal), el namespace `io.github.juanklagos` del MCP Registry, la línea de
copyright que MIT obliga a conservar en cada copia, y el nombre personal. La licencia deja de ser el
instrumento de propiedad; las cuentas y el nombre pasan a serlo.

## Alternatives considered / Alternativas consideradas

| Alternativa | Por qué se rechazó |
| :--- | :--- |
| **Apache-2.0** | Su §4(b) exige marcar cada archivo modificado con un aviso de cambio. En un template cuyo propósito entero es que el usuario modifique todos los archivos, eso es patológico. Además es incompatible con GPLv2 por admisión de la propia ASF, y su concesión de patentes sólo transfiere patentes que el autor posea, que son cero. Google y FINOS clasifican MIT y Apache-2.0 en el mismo nivel de aprobación automática, así que no había ventaja de adopción que compensara. |
| **Capa CC0 o MIT-0 sólo para `templates/`** | Incoherente si MIT sigue siendo el suelo (no se puede renunciar y retener a la vez sobre los mismos bytes) y contaminante si es alternativa (`MIT OR CC0-1.0` mete un segundo identificador en el tarball). CC0 tampoco está aprobada por OSI, y su renuncia a derechos morales es inoperante en Colombia (Art. 30 Ley 23/1982, inalienables). El compromiso de no reclamar es ejecutable donde la renuncia no lo es y es invisible para los escáneres. |
| **Seguir en PolyForm y ablandar sólo el discurso** | Contradice directamente el requisito del propietario. No resuelve el `NOASSERTION` ni el bloqueo a proyectos open source. |
| **Dejar de mantener el CLA y pasar sólo a DCO** | El CLA reescrito conserva la opción de relicenciar en el futuro sin localizar a cada contribuyente. Se conserva, ahora con licencia de patentes explícita y con la cláusula de titularidad retenida que le faltaba, y se le añade DCO. |

## Consequences / Consecuencias

**Lo que se gana:** cualquiera puede usarlo en su empresa, en su CI, en un producto de pago o en un
proyecto open source, sin pedir permiso. GitHub pasa a detectar la licencia. Los paquetes de npm
entregan por fin un `LICENSE` dentro del tarball — los tres publicados en 1.7.0 no llevaban ninguno.

**Lo que se cede, y es real:** cualquiera puede hacer un fork, renombrarlo y venderlo. Eso es una
consecuencia buscada del requisito «cualquiera la pueda utilizar en cualquier modo», no un efecto
colateral. Lo que impide que un fork se haga pasar por el original no es la licencia sino el scope de
npm y el namespace MCP, que nadie más puede reclamar.

**Irreversibilidad:** las versiones ya publicadas bajo MIT quedan bajo MIT para siempre. El autor
conserva la facultad de licenciar versiones futuras de otro modo, pero no puede retirar la concesión
ya hecha.

## Pendiente antes de publicar / Open before publishing

- **Cadena de titularidad.** `AUTHORS.md` declaraba, antes de este cambio, «CTO @ Praxis Studio SAS
  (2022 — Present)», y los 150 commits caen dentro de esa ventana. El Art. 20 de la Ley 23/1982
  colombiana, reformado por el Art. 28 de la Ley 1450/2011, presume —salvo pacto escrito en
  contrario— que los derechos patrimoniales de la obra creada bajo contrato laboral se transfieren al
  empleador en lo necesario para su actividad habitual. La presunción es rebatible con un documento.
  Se retiró la mención del repositorio por decisión del propietario; **eso no resuelve el fondo, sólo
  quita la evidencia del repo**. Conseguir el instrumento escrito antes de `npm publish`, que es el
  único paso de este plan que no se puede corregir después.
- Barrido de versión a 2.0.0 y republicación de los tres paquetes.
- Atribución en los andamiadores: `init-project.sh:157` copia `legal/` entero dentro del proyecto del
  usuario, y `build-framework-payload.mjs:53` lo mete en el payload de npm. Debe sustituirse por un
  `THIRD-PARTY-NOTICES.md`.
- Un chequeo en CI que impida que la superficie de licencia vuelva a divergir.

## Cuándo revisar esta decisión / When to revisit

- Si el objetivo pasa de adopción a vender el template en sí. MIT sería entonces la licencia
  equivocada, y lo honesto sería volver a source-available y dejar de afirmar que sirve en empresas.
- Si aparece un fork con tracción que compita directamente. La respuesta no será la licencia sino la
  marca: ese es el momento de adoptar un nombre propio y distintivo en vez del genérico actual.
- Si llegan contribuciones externas relevantes y el CLA se vuelve fricción real en lugar de trámite.
- Si el documento de cadena de titularidad no se consigue: entonces esta decisión debe reabrirse antes
  de publicar, no después.
