// Spec 042 (R6). ¿Puede un atajo de un solo carácter crear un nodo ahora mismo?
//
// Antes esto era una lista blanca de banderas del store —paleta, tour, galería,
// asistente— y los dos modales que llegaron después (conectar agente,
// implementar) nunca se añadieron. Ninguno de los dos tiene un `<input>`, así
// que Radix dejaba el foco en un botón, el guardia de INPUT/TEXTAREA no
// aplicaba, y la tecla llegaba al handler global: aparecía un marco DETRÁS del
// diálogo, adoptaba las tarjetas que quedaban debajo —la pertenencia es
// geométrica, spec 041— y 500 ms después estaba en disco.
//
// La pregunta ahora es estructural y el fallo por defecto es el seguro: si hay
// un diálogo abierto, no se crea nada. Un diálogo nuevo que olvide declararse
// bloquea los atajos; nunca al revés.

/**
 * El único elemento con `role="dialog"` que NO bloquea: el cajón de la spec,
 * que es un panel (`modal={false}`, sin trampa de foco, con el lienzo vivo
 * detrás). Se declara en `SpecDrawer.tsx` con `data-shortcuts="allow"`.
 */
const OPEN_DIALOG_SELECTOR = '[role="dialog"]:not([data-shortcuts="allow"])';

/** Campos donde una tecla es texto, no un atajo. */
function isTextEntry(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  if (!element) return false;
  return (
    element.tagName === "INPUT" || element.tagName === "TEXTAREA" || element.isContentEditable
  );
}

/**
 * True cuando la tecla NO debe crear nada: hay un diálogo abierto, o se está
 * escribiendo en un campo.
 */
export function shortcutsBlocked(doc: Document, target: EventTarget | null = null): boolean {
  if (isTextEntry(target)) return true;
  return doc.querySelector(OPEN_DIALOG_SELECTOR) !== null;
}
