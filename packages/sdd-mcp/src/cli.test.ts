// Spec 021. The argument parser is the one place that decides what the binary
// does; every silent-failure case in the report is one of these intents.

import { describe, expect, it } from "vitest";

import { helpText, parseCliArgs, unknownArgMessage } from "./cli.js";

describe("parseCliArgs", () => {
  it("no arguments → stdio (unchanged default)", () => {
    expect(parseCliArgs([])).toEqual({ kind: "stdio" });
  });

  it("--http → http", () => {
    expect(parseCliArgs(["--http"])).toEqual({ kind: "http" });
  });

  it("--help / -h → help, winning over other flags", () => {
    expect(parseCliArgs(["--help"])).toEqual({ kind: "help" });
    expect(parseCliArgs(["-h"])).toEqual({ kind: "help" });
    expect(parseCliArgs(["--http", "--help"])).toEqual({ kind: "help" });
  });

  it("--version / -V → version", () => {
    expect(parseCliArgs(["--version"])).toEqual({ kind: "version" });
    expect(parseCliArgs(["-V"])).toEqual({ kind: "version" });
  });

  it("an unknown flag → unknown, naming the argument (the original bug)", () => {
    expect(parseCliArgs(["--htp"])).toEqual({ kind: "unknown", arg: "--htp" });
    expect(parseCliArgs(["nonsense"])).toEqual({ kind: "unknown", arg: "nonsense" });
  });

  it("an unknown flag next to --http is still unknown, never run", () => {
    expect(parseCliArgs(["--http", "--boom"])).toEqual({ kind: "unknown", arg: "--boom" });
  });
});

describe("messages", () => {
  it("help lists --http, --version and the startup env vars", () => {
    const text = helpText("9.9.9");
    for (const token of ["--http", "--version", "SDD_PROJECT_ROOT", "SDD_MCP_HTTP_PORT", "9.9.9"]) {
      expect(text).toContain(token);
    }
  });

  it("the unknown-arg message names the argument and the running version", () => {
    const msg = unknownArgMessage("--htp", "2.2.1");
    expect(msg).toContain("--htp");
    expect(msg).toContain("2.2.1");
    expect(msg).toMatch(/@latest/); // how to move forward
  });
});
