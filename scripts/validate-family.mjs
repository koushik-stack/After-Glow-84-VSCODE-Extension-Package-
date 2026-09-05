import { readFile, readdir, realpath } from "node:fs/promises";
import { resolve, relative, isAbsolute, sep } from "node:path";

export const hexPattern = /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i;
export function safeProjectPath(root, path) {
  if (typeof path !== "string" || !path || path.includes("\\") || /^[a-z]:|^\//i.test(path)) return false;
  const rel = relative(root, resolve(root, path));
  return rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel);
}
export async function exactFile(root, path) {
  if (!safeProjectPath(root, path)) return false;
  let current = root;
  try {
    for (const part of path.replace(/^\.\//, "").split("/")) {
      if (!(await readdir(current)).includes(part)) return false;
      current = resolve(current, part);
    }
    const rel = relative(await realpath(root), await realpath(current));
    return rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel);
  } catch { return false; }
}
function rgba(hex) {
  if (!hexPattern.test(hex)) return [NaN, NaN, NaN, NaN];
  let digits = hex.slice(1);
  if (digits.length <= 4) digits = [...digits].map(c => c + c).join("");
  return [0, 2, 4, 6].map((n) => n === 6 ? (parseInt(digits.slice(n) || "ff", 16) / 255) : parseInt(digits.slice(n, n + 2), 16));
}
function composite(front, back) { return front.slice(0, 3).map((v, i) => v * front[3] + back[i] * (1 - front[3])); }
function luminance(rgb) { return rgb.map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0); }
export function contrast(foreground, background, base = background) {
  const bg = composite(rgba(background), rgba(base));
  const fg = composite(rgba(foreground), bg);
  const values = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (values[0] + .05) / (values[1] + .05);
}
const foreground = value => typeof value === "string" ? value : value?.foreground;
const syntax = ["comment", "string", "keyword", "number", "regexp", "operator", "namespace", "type", "typeParameter", "class", "enum", "interface", "struct", "parameter", "variable", "property", "decorator", "function", "method", "enumMember"];
const scopes = ["comment", "string", "constant.numeric", "keyword", "entity.name.function", "entity.name.type", "variable", "keyword.operator", "entity.name.tag", "entity.other.attribute-name", "invalid"];

export async function validateFamily(root, manifest, check) {
  if (!manifest) return;
  const json = async path => JSON.parse(await readFile(resolve(root, path), "utf8"));
  const expected = [
    ["Afterglow ’84", "vs-dark", "dark", "afterglow-84-color-theme.json"],
    ["Afterglow ’84 — Night Drive", "vs-dark", "dark", "afterglow-84-night-drive-color-theme.json"],
    ["Afterglow ’84 — Golden Hour", "vs", "light", "afterglow-84-golden-hour-color-theme.json"]
  ];
  check(Object.keys(manifest.contributes || {}).length === 1 && Array.isArray(manifest.contributes?.themes), "only color themes are contributed; no icon themes, commands, or settings");
  for (const key of ["main", "browser", "activationEvents", "dependencies", "os", "cpu", "telemetry", "enabledApiProposals"]) check(!(key in manifest), `no runtime/platform restriction: ${key}`);
  check(manifest.contributes?.themes?.length === 3, "exactly three theme picker contributions");
  const lock = await json("package-lock.json");
  check(/^\d+\.\d+\.\d+$/.test(manifest.version) && lock.version === manifest.version && lock.packages?.[""]?.version === manifest.version, "manifest and lock versions match");
  check(await exactFile(root, manifest.icon), "logo path exists with exact capitalization");
  for (const path of [".gitignore", ".vscodeignore"]) check((await readFile(resolve(root, path), "utf8")).split(/\r?\n/).includes(".DS_Store"), `${path} excludes .DS_Store`);
  const launch = await json(".vscode/launch.json");
  check(launch.configurations?.every(c => c.args?.includes("--extensionDevelopmentPath=${workspaceFolder}")), "launch uses workspaceFolder");
  for (const [name, command] of Object.entries(manifest.scripts || {})) check(!/\\|[a-z]:[\\/]|powershell|where\.exe|\bbash\b|\bzsh\b/i.test(command), `portable npm script: ${name}`);
  for (const directory of ["themes", "examples", "scripts", ".vscode"]) {
    for (const file of await readdir(resolve(root, directory))) {
      const path = `${directory}/${file}`;
      check(await exactFile(root, path), `exact project file: ${path}`);
      if (directory !== "scripts") check(!/(?:^|["\s])[a-z]:[\\/]|\\\\[^\s"\\]+\\/im.test(await readFile(resolve(root, path), "utf8")), `no machine-specific path: ${path}`);
    }
  }
  let baseline;
  for (const [label, ui, type, file] of expected) {
    const startFailures = [];
    const local = (ok, message) => { check(ok, `${label}: ${message}`); if (!ok) startFailures.push(message); };
    const entry = manifest.contributes?.themes?.find(t => t.label === label);
    local(entry?.uiTheme === ui && entry?.path === `./themes/${file}`, "manifest label, UI type and path");
    if (!entry || !await exactFile(root, entry.path)) { local(false, "theme file exists with exact capitalization and safe path"); continue; }
    let theme;
    try { theme = await json(entry.path); } catch (error) { local(false, `JSON parsing: ${error.message}`); continue; }
    local(theme.name === label && theme.type === type && theme.semanticHighlighting === true, "name, dark/light type and semantic highlighting");
    // Schema checks for the declarative subset used here; workbench IDs are checked separately against VS Code.
    local(Object.keys(theme).every(k => ["$schema", "name", "type", "semanticHighlighting", "colors", "tokenColors", "semanticTokenColors"].includes(k)), "theme root schema");
    const colors = theme.colors || {}, semantic = theme.semanticTokenColors || {};
    local(typeof colors === "object" && !Array.isArray(colors), "workbench colors schema");
    for (const [key, value] of Object.entries(colors)) local(typeof value === "string" && hexPattern.test(value), `workbench hex: ${key}`);
    const required = baseline || Object.keys(colors);
    for (const key of required) local(key in colors, `required workbench color: ${key}`);
    baseline ??= Object.keys(colors);
    for (const key of ["editor.background", "editor.foreground", "menu.background", "terminal.background", "editorError.foreground", "editorWarning.foreground", "editorInfo.foreground"]) local(hexPattern.test(colors[key]), `required surface: ${key}`);
    local(Array.isArray(theme.tokenColors), "TextMate array schema");
    const allScopes = [];
    for (const rule of theme.tokenColors || []) {
      const ruleScopes = typeof rule.scope === "string" ? [rule.scope] : rule.scope;
      local(Array.isArray(ruleScopes) && ruleScopes.every(s => typeof s === "string" && s.length > 0), `TextMate scopes: ${rule.name}`);
      allScopes.push(...(ruleScopes || []));
      local(hexPattern.test(rule.settings?.foreground) && Object.keys(rule.settings || {}).every(k => ["foreground", "background", "fontStyle"].includes(k)), `TextMate settings schema: ${rule.name}`);
      if (rule.settings?.background) local(hexPattern.test(rule.settings.background), `TextMate background: ${rule.name}`);
      if (rule.settings?.fontStyle !== undefined) local(typeof rule.settings.fontStyle === "string" && rule.settings.fontStyle.split(/\s+/).every(s => ["", "italic", "bold", "underline", "strikethrough"].includes(s)), `font style: ${rule.name}`);
    }
    for (const prefix of scopes) local(allScopes.some(s => s === prefix || s.startsWith(`${prefix}.`)), `syntax category: ${prefix}`);
    for (const key of syntax) local(key in semantic, `semantic category: ${key}`);
    for (const [selector, value] of Object.entries(semantic)) {
      local(/^(?:\*|[\w-]+)(?:\.[\w-]+)*(?::[\w-]+)?$/.test(selector), `semantic selector: ${selector}`);
      local(hexPattern.test(foreground(value)), `semantic color: ${selector}`);
      if (typeof value === "object" && value) for (const [key, setting] of Object.entries(value)) local(key === "foreground" || (["bold", "italic", "underline", "strikethrough"].includes(key) && typeof setting === "boolean"), `semantic style: ${selector}.${key}`);
    }
    const bg = colors["editor.background"];
    const measure = (fg, background, name, minimum = 4.5, base = bg) => { const ratio = contrast(fg, background, base); local(ratio >= minimum, `${name} contrast ${ratio.toFixed(2)}:1 meets ${minimum}:1`); return ratio; };
    const main = measure(colors["editor.foreground"], bg, "editor");
    const comment = measure(foreground(semantic.comment), bg, "comment");
    for (const [selector, value] of Object.entries(semantic)) measure(foreground(value), bg, `syntax ${selector}`);
    for (const rule of theme.tokenColors || []) measure(rule.settings?.foreground, bg, `TextMate ${rule.name}`);
    for (const key of ["editor.selectionBackground", "editor.inactiveSelectionBackground", "editor.findMatchBackground", "editor.findMatchHighlightBackground", "editor.wordHighlightBackground", "editor.wordHighlightStrongBackground", "diffEditor.insertedTextBackground", "diffEditor.removedTextBackground"]) measure(colors["editor.foreground"], colors[key], key);
    for (const prefix of ["button", "button.secondary", "activityBarBadge", "list.activeSelection", "menu", "menu.selection", "input", "dropdown", "quickInput", "editorHoverWidget", "notifications", "terminal", "statusBar.debugging"]) measure(colors[`${prefix}.foreground`] || colors[`${prefix}Foreground`], colors[`${prefix}.background`] || colors[`${prefix}Background`], prefix);
    measure(colors["button.foreground"], colors["button.hoverBackground"], "button hover");
    measure(colors["terminal.foreground"], colors["terminal.selectionBackground"], "terminal selection", 4.5, colors["terminal.background"]);
    for (const kind of ["Error", "Warning", "Info", "Hint"]) measure(colors[`editor${kind}.foreground`], bg, kind);
    for (const kind of ["error", "warning", "info"]) measure(colors[`inputValidation.${kind}Border`], colors[`inputValidation.${kind}Background`], `${kind} validation`, 3);
    for (const key of Object.keys(colors).filter(k => k.startsWith("terminal.ansi"))) {
      // ANSI black conventionally doubles as a background in dark terminal applications.
      if (type === "dark" && key === "terminal.ansiBlack") continue;
      measure(colors[key], colors["terminal.background"], key, type === "dark" && key === "terminal.ansiBrightBlack" ? 3 : 4.5);
    }
    for (const kind of ["added", "modified", "deleted", "conflicting"]) measure(colors[`gitDecoration.${kind}ResourceForeground`], colors["sideBar.background"], `Git ${kind}`);
    console.log(`${label}: ${startFailures.length ? "FAIL" : "PASS"}; editor ${main.toFixed(2)}:1; comments ${comment.toFixed(2)}:1; ${Object.keys(colors).length} UI colors`);
  }
}
