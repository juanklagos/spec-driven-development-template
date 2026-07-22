# Investigación 016 - La puerta de entrada

Barrido de 84 agentes (siete auditorías en paralelo, cada hallazgo verificado adversarialmente contra
HEAD). 76 candidatos, 71 confirmados, 48 defectos distintos. Los cinco de esta spec los reproduje a
mano antes de escribirla.

## Hallazgos

1. **`validate-sdd.sh` aborta con la idea vacía.** `grep` sin coincidencias devuelve 1; bajo
   `set -euo pipefail` eso mata el script. Reproducido: ocho líneas y ni resumen ni error. El archivo
   es byte-idéntico al que viaja en el paquete npm.
2. **Los andamiadores copian mi contenido.** Reproducido: dos menciones al template en la idea del
   usuario, 81 líneas ajenas en su bitácora global.
3. **La guardia de consentimiento heredado no cubre su propio caso.** La escribí ayer para un
   workspace con cero specs aprobadas. Una copia del template trae specs y consentimiento juntos, así
   que no hay huérfanos. Reproducido: `ABIERTA — 15 spec(s) aprobada(s) y consentida(s)`, cero avisos.
4. **`TEMPLATE_VERSION` queda fuera de git** por las reglas de ignorado que yo mismo escribí, y
   `init-project.sh` nunca lo escribe. La mitigación entera de la spec 013 es código muerto.
5. **El GIF de portada muestra el primer comando fallando**, y el release lo re-commitea.

## Decisiones derivadas de los hallazgos

1. **La señal de «esto no es tuyo» es temporal, no de contenido.** Comparar contra una lista de las
   specs del template sería frágil y habría que mantenerla. `installed_at` ya existe y no miente.
2. **Sin sello, silencio.** Un aviso que no puede distinguir prefiere callar: el repositorio del
   propio template no tiene sello y acusarse a sí mismo entrenaría a ignorar el aviso.
3. **La lección que vale más que los cinco arreglos:** diseñé la guardia de la 012 razonando sobre el
   caso, no reproduciéndolo. La escribí, la probé contra un escenario que yo mismo inventé, y pasó.
   El caso real —copiar el repositorio entero— nunca lo ejecuté. La cobertura de esta spec parte de
   una copia real, no de un sandbox construido a mano.
