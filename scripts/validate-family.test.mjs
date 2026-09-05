import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { hexPattern, contrast, safeProjectPath, exactFile } from "./validate-family.mjs";

test("hex validation accepts supported alpha forms and rejects malformed colors", () => {
  for (const value of ["#abc", "#abcd", "#abcdef", "#abcdef80"]) assert.ok(hexPattern.test(value));
  for (const value of ["#1234567", "#12345", "#xyz", "red", "#123456789"]) assert.ok(!hexPattern.test(value));
});
test("contrast composites alpha over the actual background", () => {
  assert.equal(contrast("#000", "#fff"), 21);
  assert.equal(contrast("#0000", "#fff"), 1);
  assert.equal(contrast("#000", "#fff0", "#000"), 1);
  assert.ok(contrast("#0008", "#fff") > 4.4);
});
test("path checks reject traversal, prefix siblings, absolute and Windows paths", () => {
  const root = resolve("theme-project");
  assert.ok(safeProjectPath(root, "./themes/night.json"));
  for (const path of ["../theme-project-other/file", "../file", "/tmp/file", "C:/file", "C:file", "themes\\file", ""]) assert.ok(!safeProjectPath(root, path), path);
});
test("exact file checks enforce capitalization even on Windows", async () => {
  const root = fileURLToPath(new URL("../", import.meta.url));
  assert.ok(await exactFile(root, "package.json"));
  assert.ok(!await exactFile(root, "PACKAGE.json"));
  assert.ok(!await exactFile(root, "missing.json"));
});
