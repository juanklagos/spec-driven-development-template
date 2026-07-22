# Start Here (Non-Technical) / Empieza aquí (No técnico)

If you are not technical, use this page only.
Si no eres técnico, usa solo esta página.

You do not need to choose where anything goes. The prompt below tells the AI to
set that up for you, and the setup command prints the exact next steps for the
choice it made.

No tienes que decidir dónde va nada. El prompt de abajo le dice a la IA que lo
prepare por ti, y el comando de instalación imprime los pasos exactos según lo
que haya elegido.

## 1) Copy this prompt / Copia este prompt

```text
EN:
Using https://github.com/juanklagos/spec-driven-development-template, guide me step by step with SDD for my project.
My project is: [describe your project in plain language].

If my project is new, scaffold it for me with `npx @juanklagos/create-sdd-project`.
If my project already exists, install the compact `spec/` sidecar into it and do not move my code.

Explain every step in plain language, and tell me which files you created or changed.
No code before an approved spec and a consistent plan — ask for my explicit approval first.

ES:
Usando https://github.com/juanklagos/spec-driven-development-template, guíame paso a paso con SDD para mi proyecto.
Mi proyecto es: [explica tu proyecto en lenguaje simple].

Si mi proyecto es nuevo, créalo con `npx @juanklagos/create-sdd-project`.
Si mi proyecto ya existe, instálale el sidecar compacto `spec/` y no muevas mi código.

Explícame cada paso en lenguaje simple, y dime qué archivos creaste o cambiaste.
No hay código sin spec aprobada y plan consistente — pídeme aprobación explícita antes.
```

## 2) Tell the AI your idea / Dile a la IA tu idea

Use this simple format:
Usa este formato simple:

```text
Project type / Tipo: [app web, app móvil, e-commerce, SaaS, etc.]
Who it is for / Para quién: [usuarios]
Problem / Problema: [qué duele hoy]
Expected result / Resultado esperado: [qué quieres lograr]
```

## 3) Ask for this minimum result / Pide este resultado mínimo

- one clear idea / una idea clara
- first complete spec / primera spec completa
- validation report / reporte de validación
- one exact next step / un próximo paso exacto

## 4) Do not skip this rule / No omitas esta regla

- EN: No code before approved `spec.md` and consistent `plan.md`.
- ES: No hay código sin `spec.md` aprobada y `plan.md` consistente.
- EN: Ask the AI to request your explicit approval right before execution/implementation.
- ES: Pídele a la IA que solicite tu aprobación explícita justo antes de ejecutar/implementar.

Two separate things, on purpose. **Approving** says the spec is ready.
**Consenting** says you authorise starting to build it. The gate asks for both.

Dos cosas distintas, a propósito. **Aprobar** dice que la spec está lista.
**Consentir** dice que autorizas empezar a construirla. La compuerta pide las dos.

## 5) See your specs as a board / Mira tus specs como un tablero

You do not have to read markdown files. There is a visual canvas:

No tienes que leer archivos markdown. Hay un lienzo visual:

```bash
npx -p @juanklagos/sdd-mcp sdd-mcp-http
```

It opens at `http://127.0.0.1:3334/builder`. Cards are your specs, and you can
approve one from there. Needs version 2.2.0 or newer — if you see "503", the package is older than that:
add `@latest` to the package name above.

Se abre en `http://127.0.0.1:3334/builder`. Las tarjetas son tus specs, y puedes
aprobar una desde ahí. Necesita la versión 2.2.0 o posterior — si ves «503», tu
copia es anterior: añade `@latest` al nombre del paquete de arriba.

## 6) If you get stuck / Si te atoras

Say this:

```text
EN: Explain this in simpler language and ask me one short question at a time.
ES: Explícame esto en lenguaje más simple y hazme una pregunta corta por vez.
```

## Next / Siguiente

- Visual guide to the board / Guía visual del tablero:
  - [EN](./docs/en/51-sdd-builder-visual-guide.md)
  - [ES](./docs/es/51-guia-visual-sdd-builder.md)
- Detailed AI guide / Guía IA detallada: [AI_START_HERE.md](./AI_START_HERE.md)
- Full quickstart / Quickstart completo: [QUICKSTART.md](./QUICKSTART.md)
- Beginner path / Ruta principiante:
  - [EN](./docs/en/13-quick-guide-non-programmers.md)
  - [ES](./docs/es/13-guia-rapida-no-programadores.md)
