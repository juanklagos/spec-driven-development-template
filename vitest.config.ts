import path from "node:path";
import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

const here = path.dirname(fileURLToPath(import.meta.url));

// Descubrimiento de pruebas de la raíz. La CI ejecuta `test:unit` desde aquí a
// propósito (.github/workflows/mcp.yml), así que esta configuración tiene que
// entender también el código de `builder/`, que no es un workspace de la raíz
// y trae su propio node_modules.
//
// `exclude`: sin él, vitest recorre TODO el árbol con sus valores por defecto,
// incluidos los worktrees de agentes bajo `.claude/`. Como un worktree es una
// copia completa del repositorio, cada archivo de prueba se contaba dos veces,
// y los de allí fallaban al no resolver sus dependencias. Un worktree es una
// copia de trabajo, no código de este paquete. Nota: `exclude` REEMPLAZA los
// valores por defecto, no los amplía; de ahí el spread de `configDefaults`.
//
// `alias`: `builder/vite.config.ts` define `@` -> `builder/src`. Ese archivo no
// se lee al ejecutar desde la raíz, así que el alias se declara aquí o las
// pruebas del builder que lo usan no resuelven sus imports.
export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, "**/.claude/**"]
  },
  resolve: {
    alias: {
      "@": path.resolve(here, "builder/src")
    }
  }
});
