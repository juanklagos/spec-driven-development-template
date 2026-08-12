# Actualizar repara lo del framework y nunca escribe lo del usuario

- Fecha: 2026-08-12
- Spec: 029-actualizacion-sin-sorpresas
- Estado: adoptada

## Qué se decidió

1. La clasificación de archivos del sidecar (framework vs. conservado) deja de
   estar implícita en el orden de las líneas de `install-spec-sidecar.sh` y
   pasa a `packages/sdd-core/src/sidecar-files.ts`, con una prueba que falla si
   el instalador copia un archivo que la clasificación no conoce.
2. `upgradeSidecar` repara sin preguntar lo que es del framework y **nunca**
   escribe un archivo conservado que no venga nombrado en `applyPreserved`.
3. `upToDate` compara **contenido**, no solo el número del marcador.
4. El desfase se declara por las cuatro puertas (agente, terminal, lienzo,
   andamiador), pero **ninguna actualiza sola**: la spec pide aviso, no
   autonomía.

## Por qué

- Fuente: `specs/029-actualizacion-sin-sorpresas/spec.md`, sección "Contexto
  (medido, no supuesto)". D3 midió que un tercio del sidecar no se actualiza
  nunca y sí cambia; D2 midió que la vía correcta existía pero se llamaba
  «install» y nadie la presentaba como actualización.
- La comparación por contenido nace de la spec 021, donde un
  `exit 0  # TAMPERED` en `check-sdd-gate.sh` sobrevivió a un reinstalado byte
  a byte: un número de versión correcto con una compuerta rota no está al día.
- La clasificación explícita ataca el riesgo que el propio plan nombró: si
  alguien añade un archivo al bash y no a la lista, la actualización lo
  ignoraría en silencio — exactamente el defecto que esta spec elimina.

## Alternativas rechazadas

- **Actualizar todo, incluidos los archivos del usuario**: convertiría
  `sdd.policy.yaml` y las plantillas de spec en territorio del framework y
  borraría trabajo real sin preguntar.
- **Conservar todo, incluidos los scripts de la compuerta**: es el estado
  anterior, y deja compuertas viejas o manipuladas vivas para siempre.
- **Actualización automática al detectar desfase**: rechazada explícitamente
  por la spec ("aviso, no autonomía"). El builder avisa y muestra el comando;
  ejecutarlo es de la persona.
- **Que el bash importe la clasificación de TypeScript**: acoplamiento caro
  para un instalador que debe seguir funcionando sin Node. En su lugar, una
  prueba que compara ambos y falla si divergen.

## Cuándo revisitarla

- Si un archivo cambia de grupo (algo del usuario pasa a ser del framework o
  al revés): hay que moverlo en `sidecar-files.ts` y en el instalador a la vez,
  y la prueba lo exige.
- Si aparecen migraciones de contenido (reescribir specs del usuario a un
  formato nuevo), hoy fuera de alcance.
- Si el instalador deja de ser bash.
