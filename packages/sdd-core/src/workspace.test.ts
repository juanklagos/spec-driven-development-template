// Spec 043. La guarda que decide dónde puede materializarse un proyecto
// destino, y dónde NO se aplica.
//
// Hasta esta spec la regla vivía dentro de `resolveSddRoot`, que es la puerta
// de 25 llamadas —`listSpecs`, `scoreSpec`, `generateStatus`, `getBoardView`,
// la bitácora, la cola…—, así que el propio template no podía leerse a sí
// mismo: crear una spec, puntuarla o regenerar `STATUS.md` fallaban con
// «Project root cannot be the template root itself».
//
// Estas pruebas fijan las dos mitades: lo que pasa a permitirse (leer y
// mantener el template) y lo que debe seguir prohibido (materializar un
// proyecto destino encima de él). La segunda mitad es la que importa: mover una
// regla es fácil, perderla por el camino también.

import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  ensureProjectRootAllowed,
  getFrameworkLayout,
  getFrameworkRoot,
  resolveSddRoot
} from "./workspace.js";

// En un checkout del monorepo, la raíz del framework ES la raíz del repo.
const templateRoot = getFrameworkRoot();

describe("ensureProjectRootAllowed — la política de proyecto destino", () => {
  it("corre sobre un checkout, que es donde estas reglas aplican", () => {
    expect(getFrameworkLayout()).toBe("repo");
  });

  it("rechaza la raíz del template", async () => {
    await expect(ensureProjectRootAllowed(templateRoot)).rejects.toThrow(
      /template root itself/i
    );
  });

  it("rechaza una ruta dentro del template que no cuelga de www/", async () => {
    await expect(ensureProjectRootAllowed(path.join(templateRoot, "docs"))).rejects.toThrow(
      /must live under/i
    );
    await expect(
      ensureProjectRootAllowed(path.join(templateRoot, "packages", "sdd-core"))
    ).rejects.toThrow(/must live under/i);
  });

  it("acepta un proyecto bajo www/ y uno completamente externo", async () => {
    await expect(
      ensureProjectRootAllowed(path.join(templateRoot, "www", "un-proyecto"))
    ).resolves.toBeUndefined();
    await expect(ensureProjectRootAllowed("/tmp/un-proyecto-externo")).resolves.toBeUndefined();
  });
});

describe("resolveSddRoot — resolver una raíz no es autorizar un proyecto", () => {
  it("resuelve la raíz del template, que es un proyecto SDD con sus propias specs", async () => {
    // Spec 043, R1. Antes lanzaba: la pregunta «¿dónde está la raíz SDD?»
    // llevaba dentro «¿puedo materializar aquí un proyecto destino?», y por eso
    // leer el tablero estaba tan prohibido como scaffoldear encima.
    await expect(resolveSddRoot(templateRoot)).resolves.toBe(templateRoot);
  });

  it("sigue sin inventarse una raíz donde no la hay", async () => {
    await expect(resolveSddRoot("/tmp")).rejects.toThrow(/Could not find an SDD root/i);
  });
});

describe("las tres operaciones que crean un proyecto destino siguen protegidas", () => {
  it("installSidecar rechaza la raíz del template", async () => {
    const { installSidecar } = await import("./index.js");
    await expect(
      installSidecar({ frameworkRoot: templateRoot, targetPath: templateRoot })
    ).rejects.toThrow(/template root itself/i);
  });

  it("el descubrimiento heredado rechaza la raíz del template", async () => {
    const { runLegacyDiscovery } = await import("./legacy.js");
    await expect(runLegacyDiscovery(templateRoot)).rejects.toThrow(/template root itself/i);
  });

  it("installSidecar rechaza una ruta dentro del template fuera de www/", async () => {
    const { installSidecar } = await import("./index.js");
    await expect(
      installSidecar({ frameworkRoot: templateRoot, targetPath: path.join(templateRoot, "docs") })
    ).rejects.toThrow(/must live under/i);
  });

  // `createWorkspace` no puede producir una ruta prohibida: siempre construye
  // `<workspacesRoot>/www/<slug>`. La llamada a la guarda que se le añadió deja
  // ese invariante escrito en vez de confiar en que nadie toque esa línea.
});

describe("lo que el template gana con esto", () => {
  it("puede listar sus propias specs", async () => {
    const { listSpecs } = await import("./workspace.js");
    const specs = await listSpecs(templateRoot);
    expect(specs.length).toBeGreaterThan(40);
    expect(specs.some((s) => s.id.startsWith("043-"))).toBe(true);
  });

  it("puede puntuar una de sus propias specs sin copiarla a ningún sitio", async () => {
    const { scoreSpec } = await import("./score.js");
    const [score] = await scoreSpec(templateRoot, "043-el-template-usa-sus-herramientas");
    expect(score.score).toBeGreaterThan(0);
    expect(score.specId).toBe("043-el-template-usa-sus-herramientas");
  });
});
