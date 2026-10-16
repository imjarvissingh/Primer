// @vitest-environment node
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const DOMAIN = path.resolve(__dirname, "../../../src/domain");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory()
      ? sourceFiles(full)
      : full.endsWith(".ts")
        ? [full]
        : [];
  });
}

const files = sourceFiles(DOMAIN).map((file) => ({
  module: path.relative(DOMAIN, file).split(path.sep)[0],
  file: path.relative(DOMAIN, file),
  text: readFileSync(file, "utf8"),
}));

const importsOf = (text: string) =>
  [...text.matchAll(/(?:from|import)\s+["']([^"']+)["']/g)].map((m) => m[1]);

/** Which domain modules each module may import. Dependencies only point "down". */
const ALLOWED: Record<string, string[]> = {
  shared: [],
  curriculum: ["shared"],
  math: ["curriculum", "shared"],
  assessment: ["curriculum", "math", "shared"],
  tutoring: ["curriculum", "math", "shared"],
  evidence: ["curriculum", "shared"],
};

describe("domain architecture", () => {
  it("contains only the planned modules", () => {
    expect([...new Set(files.map((f) => f.module))].sort()).toEqual(
      Object.keys(ALLOWED).sort(),
    );
  });

  it("imports only relative paths between domain modules (no React, Next, Node, or app code)", () => {
    for (const { file, text } of files) {
      for (const spec of importsOf(text)) {
        expect(spec.startsWith("."), `${file} imports "${spec}"`).toBe(true);
      }
    }
  });

  it("respects the module dependency direction, with no cycles", () => {
    for (const { module, file, text } of files) {
      for (const spec of importsOf(text)) {
        const target = path
          .relative(DOMAIN, path.resolve(DOMAIN, path.dirname(file), spec))
          .split(path.sep)[0];
        if (target === module) continue;
        expect(ALLOWED[module], `${file} imports ${target}`).toContain(target);
      }
    }
  });

  it("uses no network, storage, browser, randomness, clock, logging or environment APIs", () => {
    const banned = [
      /\bfetch\s*\(/,
      /XMLHttpRequest/,
      /\bWebSocket\b/,
      /\blocalStorage\b/,
      /\bsessionStorage\b/,
      /\bindexedDB\b/,
      /\bdocument\./,
      /\bwindow\./,
      /\bnavigator\./,
      /Math\.random/,
      /Date\.now/,
      /new Date\b/,
      /\bconsole\./,
      /process\.env/,
      /\bany\b\s*[>,)=;]|:\s*any\b/,
    ];
    for (const { file, text } of files) {
      const code = text
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/.*$/gm, "");
      for (const pattern of banned) {
        expect(pattern.test(code), `${file} matches ${pattern}`).toBe(false);
      }
    }
  });

  it("has no theme dependency: no theme imports, fields or identifiers in executable code", () => {
    for (const { file, text } of files) {
      const code = text
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/.*$/gm, "");
      expect(/theme|block-builder|space-construction/i.test(code), file).toBe(
        false,
      );
    }
  });
});
