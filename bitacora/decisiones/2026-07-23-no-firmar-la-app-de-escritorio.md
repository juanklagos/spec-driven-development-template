# Decisión clave - No firmar SDD Desk, y reposicionarla / Key decision - Do not sign SDD Desk

## Date / Fecha

2026-07-23

Modifica el alcance de la spec `023-desk-electron`: su R8 pedía builds firmadas y notarizadas,
y su escenario de aceptación 7 pedía que el `.dmg` abriera sin diálogo. Ninguno de los dos se
va a cumplir.

## Context / Contexto

SDD Desk 0.1.2 se publicó sin firmar. El propietario la descargó de la propia página de
descarga, en un M1 Pro con macOS 26.5.2, y no pudo abrirla en dos intentos seguidos:

1. Primero por un defecto real de empaquetado — el bundle salió sin sello de firma válido y
   Apple Silicon lo reporta como *"está dañado y no puede abrirse"*. Arreglado en 0.1.2 con
   firmado ad-hoc (`desk/scripts/adhoc-sign.cjs`).
2. Después por el aviso de notarización, *"Apple no pudo verificar que no contenga software
   malicioso"*, cuyo botón por defecto es **Mover al basurero**. La documentación indicaba
   "clic derecho → Abrir", un atajo que Apple eliminó en Sequoia (macOS 15), así que en su
   máquina el camino documentado no existía.

Es decir: la persona que **construyó** la aplicación necesitó dos rondas de diagnóstico para
abrirla. Ese es el dato que fuerza esta decisión, no una estimación.

Hechos verificados en la sesión:

- **macOS no tiene vía gratuita.** Apple cobra 99 USD/año por el Developer ID, sin excepción
  para código abierto; es una carencia reconocida y solo existe como propuesta.
- **Una firma con timestamp seguro sobrevive al vencimiento del certificado**: pagar un año
  dejaría builds que abren sin aviso para siempre. Solo hace falta seguir pagando para firmar
  versiones nuevas.
- **Windows sí tiene vía gratuita**: SignPath Foundation exige licencia aprobada por OSI, y
  MIT —vigente desde `2026-07-21-relicencia-mit.md`— la cumple.
- **Linux no pide firma.**

## Decision / Decisión

**No pagar la membresía de Apple, y reposicionar SDD Desk en consecuencia.**

La app deja de presentarse como "la ruta fácil" y pasa a presentarse por lo que es: la opción
para quien no tiene problema en autorizar una app a mano una vez. El builder en el navegador
(`npx @juanklagos/sdd-mcp@latest --http`) queda como la ruta sin ninguna fricción, y compilar
desde el código como la tercera vía sin avisos.

La página de descarga abre con esa elección explícita **antes** de los botones, en vez de
enterrar la advertencia debajo de ellos.

## Alternatives considered / Alternativas consideradas

| Alternativa | Por qué no |
|---|---|
| **Pagar 99 USD/año** | Es la única forma de quitar el aviso, y con el timestamp seguro un solo año dejaría builds válidas para siempre. Descartada por decisión del propietario: no atar la herramienta a una cuota anual con un solo mantenedor. Queda dicho para que un lector futuro no busque un impedimento técnico que no existe |
| **Seguir presentándola como la ruta fácil** | Deshonesto y contraproducente. El aviso de macOS sugiere borrar el archivo; quien no sabe qué es un `.dmg` le hace caso. Prometer facilidad y entregar un diálogo alarmante gasta más confianza que no ofrecer la app |
| **Retirar la app** | Innecesario: funciona, y para quien sabe autorizarla resuelve el prerrequisito de Node de verdad. El problema era la promesa, no el producto |
| **Distribuir solo por Homebrew Cask** | Reduce fricción para quien ya usa Homebrew, que es exactamente el público que menos la necesita, y añade un tap que mantener |

## Consequences / Consecuencias

**Aceptadas**
- El escenario de aceptación 7 de la spec `023` **no se cumplirá**, y R8 queda fuera de alcance
  para macOS. Se registra en el `history.md` de la spec en vez de borrarse.
- SDD Desk no alcanza a fundadores ni PMs sin ayuda: para ellos la ruta sigue siendo el
  navegador, que necesita Node. El muro que la app venía a tirar sigue en pie para esa
  audiencia — solo que ahora está dicho en voz alta.
- Cada persona que descargue pasará una vez por Ajustes del Sistema → Privacidad y Seguridad.

**A favor**
- Cero costo recurrente y cero dependencia de una cuota anual para que la herramienta siga
  distribuible.
- La documentación ya no promete algo que el producto no entrega.
- Windows puede quedar sin aviso sin gastar nada, por la vía de SignPath.

## Cuándo revisar esta decisión / When to revisit

- **Si aparece evidencia de que gente real abandona en el aviso.** Hoy la muestra es de una
  persona (el propio autor), y fue suficiente para reposicionar; no lo es para justificar un
  gasto recurrente.
- Si el proyecto empieza a generar ingresos, o alguien patrocina la membresía: 99 USD una sola
  vez ya dejaría builds firmadas válidas indefinidamente, que es el escenario más barato de
  todos y merece revisarse antes que ninguno.
- Si Apple introduce notarización gratuita para proyectos open source.
- Si SignPath acepta la solicitud de Windows y la diferencia entre plataformas se vuelve
  incómoda de explicar.
