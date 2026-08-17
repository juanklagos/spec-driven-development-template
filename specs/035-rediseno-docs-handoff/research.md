# Investigación 035 - Rediseño de la documentación (handoff)

## Verificación del handoff (2026-08-17)

No se dio nada por bueno. Lo comprobado:

| Afirmación del handoff | Resultado |
| :--- | :--- |
| Conteos por tipo 6/21/17/5/6 | **cierto**, ejecutado contra `GUIDE_TYPES` |
| La salida del hero es literal del script | **cierto**, cotejada con `scripts/check-sdd-gate.sh` |
| El script emite en inglés salvo las dos líneas de cierre | **cierto** |
| La maqueta no hace peticiones externas | **cierto**, cero URLs externas |
| accent 0.627 como texto en claro da 3.3:1 | **cierto**: 3.30:1 sobre tarjeta |
| ámbar como texto da 2.9:1 | **cierto**: 2.93:1 sobre tarjeta |
| ámbar-texto da 4.9:1 | **conservador**: 6.68:1, mejor de lo que dice |
| botón primary 0.5 da 5.4:1 | **cierto**: 5.40:1 |

**Corrección a la primera lectura de esta revisión.** En el primer pase medí
esos pares contra el fondo de página y concluí que dos cifras del handoff
estaban mal. Estaban bien: los avisos y los títulos viven sobre
`--sdd-card`, no sobre `--sl-color-bg`, y medidos ahí dan exactamente lo que
el handoff decía. El fondo forma parte del par; medir contra otro es medir
otra cosa. Solo el ámbar-texto queda por encima de su estimación.

Método: conversión oklch → OKLab → sRGB lineal → sRGB con gamma → luminancia
relativa WCAG → ratio. Los fondos son los tokens reales del tema.

## Lo que el handoff acierta y la spec 034 no vio

El verde que la 034 puso en `.sdd-doc-type strong` es el de 3.09:1, a 11px y
en mayúsculas: el texto más pequeño del sitio, por debajo de AA. La revisión
de documentación anterior no midió contraste en ningún momento.

## Lo que el handoff no vio

**`ch` cambia de significado al cambiar de familia.** La unidad es el ancho
del glifo «0». En duoespaciada todos los glifos miden lo mismo, así que 68ch ≈
68 caracteres. En proporcional, la letra media es más estrecha que el «0», así
que 68ch se convierte en unos 80 caracteres: por encima del rango legible de
45-75 que motivaba el cambio. El handoff mantiene `68ch` y además observa que
«en sans caben más caracteres por línea», sin sacar la conclusión. Se
recalcula y se mide contando caracteres reales.

## La decisión tipográfica

La spec 034 rechazó la segunda familia y dejó por escrito la condición para
revisarla: «si tras usarlo sigue cansando, se reevalúa con datos». Se cumplió
—el propietario miró el sitio con la medida ya corregida y no le convenció—,
así que aquí no se vuelve a abrir el debate.

Lo que el handoff aporta y la 034 no consideró: no se trata de **sustituir**
Quattro sino de **repartir el trabajo**. Sans para hablar, Quattro para lo
ejecutable. Así el lector distingue «esto lo leo» de «esto lo copio» sin
pensarlo, y el carácter de herramienta de escritura se conserva donde
significa algo.

IBM Plex Sans: licencia OFL, se auto-hospeda igual que Quattro, y comparte
esqueleto con IBM Plex Mono, así que conviven sin chocar.
