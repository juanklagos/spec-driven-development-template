# Historial 034 - Rediseño de la documentación

- 2026-08-13 — Creación. Origen: el propietario probó un rediseño generado,
  no le convenció, pidió buscar inspiración y luego implementarlo "con la
  dialéctica". De ahí que `research.md` resuelva cada decisión enfrentando la
  posición contraria: la tipografía, las tarjetas, qué enseñar en la portada,
  la cabecera de tipo y el alcance. Referencias miradas en vivo: Stripe (sin
  tarjetas, jerarquía tipográfica), iA (los autores de la fuente reservan la
  mono para escritura y código) y Biome (mismo framework, enseña el producto
  en vez de describirlo).

- 2026-08-13 — Aprobada e implementada, T1-T7. Las cinco decisiones se
  resolvieron enfrentando su contraria (ver `research.md`); dos síntesis
  merecen registro porque contradicen lo que parecía obvio:
  **D1** — la antítesis pedía añadir una sans para titulares, como hacen los
  autores de la propia fuente en ia.net. Se descartó la familia nueva y se
  atacó la causa medida: la medida de línea. 68 caracteres, interlineado 1.75
  y jerarquía por tamaño, peso y una línea sobre cada `h2`. Si tras usarlo
  sigue cansando, se reevalúa con datos.
  **D4** — la cabecera de tipo pasa de cita de markdown a `<p>` con clase. Se
  comprobó que degrada legible sin CSS en el paquete npm, así que no se
  sacrifica portabilidad por jerarquía.
  Verificado por medición en vez de a ojo, porque el panel del navegador dejó
  de componer: dos puertas en dos columnas (472px cada una), cuatro tipos en
  cuatro (212px), **cero elementos `.card` en la portada**, cuerpo a 530px
  (68ch), interlineado 28px, la cabecera con su acento verde en claro y en
  oscuro desde sus propios tokens. Sin recursos externos nuevos y sin tocar
  los tokens compartidos con el builder. Enlaces: cero rotos en las tres
  superficies.
- 2026-08-20 — Evidencia de aprobación reescrita: registra qué se aprobó y contra qué fuente, sin transcribir el chat. No cambia qué se aprobó, quién ni cuándo (spec 037).
