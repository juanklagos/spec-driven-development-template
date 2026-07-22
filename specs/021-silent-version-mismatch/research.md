# Investigación 021 - El binario del lienzo no puede volver a fallar en silencio

Todo lo de aquí se midió ejecutando el paquete publicado desde el registro, en la carpeta
real del autor (`/Users/juanklagos/www/larepolla`), no leyendo el checkout.

## Hallazgos

- **El síntoma reportado.** `npx @juanklagos/sdd-mcp --http` en `larepolla`: **0 bytes de
  salida, exit 0**, nada escuchando en 3334. Reproducido tres veces.
- **La causa.** npx reutilizó su caché para la spec sin versión. La entrada
  `~/.npm/_npx/24a5525279ad76b1/node_modules/@juanklagos/sdd-mcp` contiene la **2.2.0**,
  y su `dist/index.js` no contiene la cadena `http` ni una vez: es el `main()` anterior a
  la spec 020, solo stdio. El registro sirve 2.2.1 como `latest`.
- **La confirmación.** `npx @juanklagos/sdd-mcp@2.2.1 --http` en esa misma carpeta imprime
  las tres URLs, `/builder` responde **200** con el HTML del builder, y `/api/board`
  devuelve `{"projectRoot":"/Users/juanklagos/www/larepolla", ... "specs":[]}`.
  `@latest` se comporta igual. El sidecar del autor está sano: lo instaló
  `create-sdd-project` **2.2.1**.
- **El silencio no es de la 2.2.0.** Contra la **2.2.1**, la última publicada:
  `--htp < /dev/null` → 0 bytes, exit 0. `--help < /dev/null` → 0 bytes, exit 0.
  Cualquier argumento que no sea `--http` cae al transporte stdio.
- **Con stdin abierto no muere: se cuelga.** Los mismos comandos sin `< /dev/null`
  siguieron vivos hasta que se les mató a mano (se dejó uno más de dos minutos). Es el
  caso normal cuando el que lanza el comando es un agente o un script.
- **Puerto ocupado.** Con un servidor ya escuchando, el segundo `--http` imprime
  `[sdd-mcp] uncaught exception (server keeps running): Error: listen EADDRINUSE`,
  y **el proceso muere con exit 0**. Las dos mitades de esa línea son falsas: ni sigue
  corriendo, ni el 0 es honesto. El manejador está en `packages/sdd-mcp/src/http.ts:107`
  (y su gemelo de `unhandledRejection` en `:110`).

## Decisiones derivadas de los hallazgos

- **La caché de npx no se combate, se rodea.** No la controlamos. Todos los comandos
  publicados fijan `@latest`; ya aplicado como documentación, sin spec, porque no es
  código. Coste aceptado: `@latest` consulta el registro en cada arranque, así que pide
  red y es algo más lento que la caché. Se prefiere eso a un fallo mudo.
- **El arreglo de producto es el silencio, no el desajuste de versión.** Una versión vieja
  en caché volverá a pasar —es la naturaleza de npx— y la única defensa que sobrevive a
  eso es que el programa diga qué bandera recibió y qué versión es. Por eso el mensaje de
  bandera desconocida tiene que nombrar la versión: es el dato que cierra el diagnóstico.
- **El manejador de `uncaughtException` no se retira, se acota.** Su promesa («server
  keeps running») es cierta después de que el servidor escuche y falsa antes. El fallo de
  `listen` se trata en su propio sitio, con `server.on("error")`, y el manejador genérico
  se queda para lo que fue escrito.
- **No se afirma por qué npx reutilizó la caché.** Se observó que lo hace con la spec sin
  versión y que `@latest` y `@2.2.1` no lo hacen. No se investigó el algoritmo de npm y no
  se afirma ninguna causa. La spec 020 ya declaró descartada la caché para *otra*
  intermitencia (la del bin `-p`); eso no se contradice: son dos síntomas distintos.
