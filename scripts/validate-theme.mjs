import { access, readFile, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const requiredFiles = [
  ".vscode/launch.json",
  "assets/icon.svg",
  "assets/icon.png",
  "examples/preview.ts",
  "examples/preview.py",
  "examples/preview.cpp",
  "examples/preview.html",
  "examples/preview.css",
  "examples/preview.json",
  "examples/preview.md",
  "themes/afterglow-84-color-theme.json",
  ".gitignore",
  ".vscodeignore",
  "CHANGELOG.md",
  "LICENSE",
  "package.json",
  "README.md"
];

const failures = [];
const checks = [];
const check = (condition, message) => {
  (condition ? checks : failures).push(message);
};
const parseJson = async (path) => {
  try {
    return JSON.parse(await readFile(resolve(root, path), "utf8"));
  } catch (error) {
    failures.push(`${path} parses as JSON (${error.message})`);
    return null;
  }
};

for (const file of requiredFiles) {
  try {
    await access(resolve(root, file));
    checks.push(`required file exists: ${file}`);
  } catch {
    failures.push(`required file exists: ${file}`);
  }
}

const manifest = await parseJson("package.json");
const themeContribution = manifest?.contributes?.themes?.[0];
const themePath = themeContribution?.path;
const theme = typeof themePath === "string" ? await parseJson(themePath) : null;
await parseJson(".vscode/launch.json");
await parseJson("examples/preview.json");

if (manifest) {
  const expected = {
    name: "afterglow-84",
    displayName: "Afterglow ’84",
    version: "0.1.0",
    description: "A warm retro VS Code theme inspired by afternoon sunlight, vintage computers, and plum-colored sunsets.",
    license: "MIT"
  };
  for (const [key, value] of Object.entries(expected)) {
    check(manifest[key] === value, `manifest ${key} is ${JSON.stringify(value)}`);
  }
  check(manifest.author?.name === "Abu Koushik", "manifest author is Abu Koushik");
  check(manifest.engines?.vscode, "manifest declares engines.vscode");
  check(manifest.categories?.includes("Themes"), "manifest category includes Themes");
  check(!("main" in manifest), "manifest has no runtime main entry");
  check(!("activationEvents" in manifest), "manifest has no activation events");
  check(themeContribution?.label === "Afterglow ’84", "theme label is Afterglow ’84");
  check(themeContribution?.uiTheme === "vs-dark", "theme UI type is vs-dark");
  check(typeof themePath === "string", "manifest has a theme path");
  check(typeof manifest.icon === "string", "manifest has an icon path");
  if (themePath) check(resolve(root, themePath).startsWith(root), "theme path stays inside project");
  if (manifest.icon) check(resolve(root, manifest.icon).startsWith(root), "icon path stays inside project");
}

const hexPattern = /^#[0-9A-Fa-f]{3,4}(?:[0-9A-Fa-f]{3,4})?$/;
const visitColors = (value, path = "theme") => {
  if (typeof value === "string" && value.startsWith("#")) {
    check(hexPattern.test(value), `valid hex color at ${path}: ${value}`);
  } else if (Array.isArray(value)) {
    value.forEach((item, index) => visitColors(item, `${path}[${index}]`));
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) visitColors(item, `${path}.${key}`);
  }
};

if (theme) {
  visitColors(theme);
  check(theme.name === "Afterglow ’84", "theme name is Afterglow ’84");
  check(theme.type === "dark", "theme type is dark");
  check(theme.semanticHighlighting === true, "semantic highlighting is enabled");
  const requiredColors = {
    "editor.background": "#211A24",
    "editor.foreground": "#F3DDC4",
    "sideBar.background": "#1A151D",
    "activityBar.background": "#171219",
    "panel.background": "#1D171F",
    "input.background": "#2A202D",
    "editor.lineHighlightBackground": "#2B222F",
    "editor.selectionBackground": "#594052",
    "editorCursor.foreground": "#FFB35C",
    "focusBorder": "#FF9A62",
    "editorError.foreground": "#FF5F68",
    "editorWarning.foreground": "#FFC56E",
    "editorInfo.foreground": "#D6A7FF"
  };
  for (const [key, value] of Object.entries(requiredColors)) {
    check(theme.colors?.[key] === value, `required workbench color ${key} is ${value}`);
  }
  const semantic = theme.semanticTokenColors ?? {};
  for (const category of ["comment", "string", "keyword", "number", "regexp", "operator", "namespace", "type", "class", "enum", "interface", "parameter", "variable", "property", "decorator", "function", "method"]) {
    check(category in semantic, `semantic syntax category exists: ${category}`);
  }
  const allScopes = theme.tokenColors?.flatMap((rule) => Array.isArray(rule.scope) ? rule.scope : [rule.scope]).filter(Boolean) ?? [];
  for (const prefix of ["comment", "string", "constant.numeric", "keyword", "entity.name.function", "entity.name.type", "variable", "keyword.operator", "entity.name.tag", "entity.other.attribute-name", "invalid"]) {
    check(allScopes.some((scope) => scope === prefix || scope.startsWith(`${prefix}.`)), `TextMate syntax category exists: ${prefix}`);
  }
}

const rgb = (hex) => [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16));
const luminance = (hex) => rgb(hex).map((value) => value / 255).map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
const contrast = (foreground, background) => {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
};
const contrastCheck = (foreground, background, minimum, label) => {
  const ratio = contrast(foreground, background);
  check(ratio >= minimum, `${label} contrast ${ratio.toFixed(2)}:1 meets ${minimum}:1`);
};

contrastCheck("#F3DDC4", "#211A24", 4.5, "editor foreground/background");
contrastCheck("#A08799", "#211A24", 4.5, "comment/background");
contrastCheck("#FFF4E5", "#AD553E", 4.5, "button foreground/background");
contrastCheck("#FFF4E5", "#B05740", 4.5, "button hover foreground/background");
contrastCheck("#211A24", "#FF9A62", 4.5, "activity badge foreground/background");
contrastCheck("#F3DDC4", "#594052", 4.5, "selected-list foreground/background");

try {
  const png = await readFile(resolve(root, "assets/icon.png"));
  const signature = png.subarray(0, 8).toString("hex") === "89504e470d0a1a0a";
  const width = signature ? png.readUInt32BE(16) : 0;
  const height = signature ? png.readUInt32BE(20) : 0;
  check(signature, "icon is a PNG file");
  check(width === 256 && height === 256, `icon dimensions are 256x256 (found ${width}x${height})`);
  check((await stat(resolve(root, "assets/icon.png"))).size > 0, "icon PNG is non-empty");
} catch (error) {
  failures.push(`icon PNG can be inspected (${error.message})`);
}

if (failures.length) {
  console.error(`Validation failed: ${failures.length} check(s)`);
  for (const message of failures) console.error(`  ✗ ${message}`);
  process.exitCode = 1;
} else {
  console.log(`Validation passed: ${checks.length} checks`);
  for (const message of checks.filter((item) => item.includes("contrast"))) console.log(`  ✓ ${message}`);
}
