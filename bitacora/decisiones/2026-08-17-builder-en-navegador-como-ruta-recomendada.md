# El builder en el navegador pasa a ser la ruta recomendada

**Fecha:** 2026-08-17
**Estado:** aceptada

## Contexto

La página `/download/` se llamaba «Descargar SDD Desk» y estaba escrita como
página de descarga: el título, la entrada del menú y la estructura vendían la
app de escritorio, y el builder en el navegador aparecía como una tarjeta más
dentro de un «cuál te conviene».

Esa jerarquía no coincidía con la realidad de las dos rutas.

## Alternativas

1. **Dejarlo como estaba**, con las dos rutas presentadas como equivalentes.
2. **Recomendar el navegador y dejar la descarga como alternativa.** Elegida.
3. Retirar la app de escritorio. Descartada: resuelve un caso real —quien no
   tiene Node instalado o no quiere dejar una terminal abierta.

## Razones

- `npx @juanklagos/sdd-mcp@latest --http` trae la versión publicada en el
  momento; el binario hay que descargarlo y volver a descargarlo para
  actualizar.
- La app no está firmada, por la decisión ya registrada de no pagar el
  certificado anual de Apple. Eso obliga a que la página dedique dos secciones
  —«Por qué aparece ese aviso» y «Abrirla la primera vez»— a sortear una
  advertencia del sistema. La ruta de navegador no muestra ningún aviso porque
  no hay archivo que autorizar.
- Publicar un binario por sistema operativo añade un paso de empaquetado entre
  una corrección y el usuario. La ruta `npx` no lo tiene. El fallo de
  empaquetado de la versión 0.1.1 (bundle sin sello de firma válido, documentado
  en la propia página) es el precedente.

## Qué cambió

- `site/src/content/docs/{es,en}/download.mdx`: título «Abrir el builder» /
  «Open the builder»; el comando encabeza la página y SDD Desk queda bajo «Si
  prefieres una ventana propia».
- `site/src/guides.mjs`: la etiqueta del menú. **El slug sigue siendo
  `download`** para no romper enlaces ya publicados.
- Las dos portadas: la sección de la app de escritorio ahora enseña el comando.

## Cuándo revisarla

- Si el proyecto obtiene certificado de firma (Windows tiene vía gratuita para
  licencias aprobadas por OSI y está pendiente de solicitar): desaparece el
  motivo principal, y conviene volver a presentarlas como equivalentes.
- Si aparece evidencia de que la mayoría de usuarios llega sin Node instalado,
  el requisito de la ruta recomendada pesaría más que sus ventajas.
