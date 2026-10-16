// @vitest-environment node
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SRC = path.resolve(__dirname, "../../src");

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory()
      ? files(full)
      : /\.(ts|tsx)$/.test(name)
        ? [full]
        : [];
  });
}
const all = files(SRC).map((f) => ({
  rel: path.relative(SRC, f).split(path.sep).join("/"),
  text: readFileSync(f, "utf8"),
}));

/** Import specifiers that are NOT type-only. */
function runtimeImports(text: string): string[] {
  return [
    ...text.matchAll(
      /^[ \t]*import\s+(?!type\b)[^;]*?from\s+["']([^"']+)["']/gm,
    ),
    ...text.matchAll(/^\s*import\s+["']([^"']+)["']/gm),
  ].map((m) => m[1]);
}

describe("client/server boundary", () => {
  const serverSide = (rel: string) =>
    rel.startsWith("server/") || rel.startsWith("app/api/");

  it("only server code (src/server, API routes) imports the domain or server modules at runtime", () => {
    for (const { rel, text } of all) {
      if (serverSide(rel) || rel.startsWith("domain/")) continue;
      for (const spec of runtimeImports(text)) {
        expect(
          spec.startsWith("@/domain") || spec.startsWith("@/server"),
          `${rel} imports ${spec}`,
        ).toBe(false);
      }
    }
  });

  it("marks every src/server module server-only", () => {
    const server = all.filter((f) => f.rel.startsWith("server/"));
    expect(server.length).toBeGreaterThan(0);
    for (const { rel, text } of server) {
      expect(text, rel).toMatch(/import "server-only";/);
    }
  });

  it("keeps the shared protocol free of runtime imports", () => {
    const proto = all.find((f) => f.rel === "lib/practice-protocol.ts");
    expect(runtimeImports(proto?.text ?? "")).toEqual([]);
  });

  it("never lets a client component reference the answer-bearing banks or fields", () => {
    for (const { rel, text } of all) {
      if (serverSide(rel) || rel.startsWith("domain/")) continue;
      expect(text, rel).not.toMatch(
        /GUIDED_PRACTICE_BANK|BASELINE_BANK|INDEPENDENT_BANK|DELAYED_BANK|expectedAnswer|ValidatedProblem/,
      );
    }
  });
});
