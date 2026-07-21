#!/usr/bin/env bash
# Attribution emitted into a scaffolded project.
#
# The scaffolders used to `cp -R legal/` into the target, which handed the user
# this project's CLA, trademark policy and enforcement policy as if they were
# their own. What a downstream project actually needs is the opposite: a record
# of the third-party code it received and under what terms.
#
# Never write a file named LICENSE into the target — that is the user's own
# license slot, and overwriting it would relicense their project for them.

SDD_ATTRIBUTION_NOTICE_FILE="THIRD-PARTY-NOTICES.md"

# sdd_write_attribution <target_dir> [root_dir]
# Writes THIRD-PARTY-NOTICES.md, and copies TEMPLATE-OUTPUT.md when available.
sdd_write_attribution() {
  local target="$1"
  local root="${2:-}"

  [ -d "$target" ] || return 0

  cat > "$target/$SDD_ATTRIBUTION_NOTICE_FILE" <<'NOTICE_EOF'
# Third-party notices / Avisos de terceros

## English

Part of this project was scaffolded from **Spec-Driven Development Template**.

- Source: https://github.com/juanklagos/spec-driven-development-template
- License: MIT
- Copyright (c) 2026 Juan Carlos Alvarez Lagos

The MIT License permission notice below covers the scaffolded files that came
from that project — the scripts, templates, guides and configuration it placed
here. It does not cover the code you write, and it places no restriction on how
you license your own project.

The specifications, plans, task lists, decision records and logbook entries you
write using its templates are yours. The author does not assert copyright in
them and requires no attribution for them.

## Español

Parte de este proyecto se generó a partir de **Spec-Driven Development Template**.

- Origen: https://github.com/juanklagos/spec-driven-development-template
- Licencia: MIT
- Copyright (c) 2026 Juan Carlos Alvarez Lagos

El aviso de permiso MIT de abajo cubre los archivos generados que vinieron de
ese proyecto: los scripts, plantillas, guías y configuración que dejó aquí. No
cubre el código que tú escribas, y no impone ninguna restricción sobre cómo
licencies tu propio proyecto.

Las especificaciones, planes, listas de tareas, registros de decisión y entradas
de bitácora que escribas con sus plantillas son tuyos. El autor no reclama
derechos de autor sobre ellos ni exige atribución.

## MIT License

Copyright (c) 2026 Juan Carlos Alvarez Lagos

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
NOTICE_EOF

  if [ -n "$root" ] && [ -f "$root/TEMPLATE-OUTPUT.md" ] && [ ! -f "$target/TEMPLATE-OUTPUT.md" ]; then
    cp "$root/TEMPLATE-OUTPUT.md" "$target/TEMPLATE-OUTPUT.md"
  fi
}
