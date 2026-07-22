# Plan 019 - Los enlaces entre guías

## Resumen

El problema no es ninguna de las cuatro reglas por separado: es que se aplican en cadena sobre el
mismo texto y la última no distingue lo que ya está hecho. Se arregla apartando cada enlace en cuanto
queda resuelto, y devolviéndolo al final.

## Contexto técnico

**Por qué no basta con reordenar.** Poner la regla general la primera no sirve: capturaría los
enlaces `./NN-guia.md` antes de que la regla de guías los vea, y el destrozo sería el mismo al revés.
Y afinar la regla general para que ignore lo que *parece* un enlace ya reescrito es adivinar por la
forma, que es justo lo que falla hoy.

**Apartar y devolver.** Cada regla que resuelve un enlace guarda el resultado en una lista y deja en
el texto un marcador que ninguna regla posterior puede capturar: un índice entre caracteres nulos
(`U+0000`), que no aparece en el markdown de origen y que las reglas restantes no pueden ver porque
exigen que el destino empiece por `./` o `../`. Al terminar todas las reescrituras, los marcadores se
sustituyen por lo guardado. El orden de las reglas deja de importar, que es la propiedad que faltaba.

**La regla cruzada también se aparta**, aunque hoy sobreviva. Sobrevive por una guarda pensada para
otra cosa —su ruta se sale del repositorio al resolverla—, no porque esté protegida. Dejarla
dependiendo de esa casualidad es dejar una trampa puesta.

## Fases de implementación

1. El mecanismo de apartar y devolver en `sync-docs.mjs`, aplicado a las dos reglas de guías.
2. Verificación de enlaces a GitHub: todos deben resolver a un archivo real del repositorio.
3. Verificación sobre el sitio construido que recorre **todos** los enlaces, relativos incluidos.

## Dependencias

- Ninguna. La geometría de la spec 018 y los grupos de la 017 no se tocan.

## Hitos

- **H1** — los enlaces entre guías llegan a la guía.
- **H2** — la verificación deja de tener el punto ciego que dejó pasar esto.

## Riesgos

- **Un marcador que sobreviva al final.** Sería peor que el defecto actual: texto ilegible en la
  página. Mitigación: comprobación explícita de que no queda ningún carácter nulo en la salida.
- **Reescribir de menos.** Mitigación: contar los enlaces a GitHub que sí resuelven antes y después;
  los 70 correctos de hoy deben seguir ahí.
