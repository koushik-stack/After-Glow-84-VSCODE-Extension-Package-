// Optional VS Code Extension Development Host test entry point.
// Run with --extensionDevelopmentPath=<project> --extensionTestsPath=<this file>.
// This test code is excluded from the declarative theme VSIX.
const vscode = require('vscode');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');

exports.run = async () => {
  await vscode.extensions.getExtension('vscode.json-language-features').activate();
  const schema = vscode.Uri.parse('vscode://schemas/color-theme');
  const themePath = path.resolve(__dirname, '../themes/afterglow-84-midnight-mocha-color-theme.json');
  const content = await fs.readFile(themePath, 'utf8');
  const theme = JSON.parse(content);
  // Restricted Mode omits Git from the live registry. Validate those IDs against
  // the installed Git extension's declarations; validate every remaining property
  // against the live core schema without changing workspace trust.
  const git = JSON.parse(await fs.readFile(path.join(vscode.env.appRoot, 'extensions/git/package.json'), 'utf8'));
  const gitIds = new Set(git.contributes.colors.map(color => color.id));
  const coreTheme = structuredClone(theme);
  let gitColors = 0;
  for (const [key, value] of Object.entries(theme.colors)) {
    if (!key.startsWith('gitDecoration.')) continue;
    assert.ok(gitIds.has(key), `installed Git color contribution: ${key}`);
    assert.match(value, /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i, `Git color value: ${key}`);
    delete coreTheme.colors[key];
    gitColors++;
  }
  const coreContent = JSON.stringify(coreTheme, null, 2);
  const validate = value => vscode.commands.executeCommand('json.validate', schema, value);
  const diagnostics = await validate(coreContent);
  assert.ok(Array.isArray(diagnostics), 'installed JSON language service returned diagnostics');
  assert.deepEqual(diagnostics.map(diagnostic => `${diagnostic.message} (${coreContent.split(/\r?\n/)[diagnostic.range.start.line]?.trim()})`), [], 'Midnight Mocha matches installed VS Code color-theme schema');
  // Prove that the schema was resolved, not silently skipped by the service.
  for (const [label, mutate] of [
    ['unknown workbench ID', theme => { theme.colors['midnight.invalidColorId'] = '#123456'; }],
    ['malformed workbench color', theme => { theme.colors['editor.background'] = 'coffee'; }],
    ['invalid semantic style', theme => { theme.semanticTokenColors.comment.italic = 'yes'; }],
    ['invalid TextMate color', theme => { theme.tokenColors[0].settings.foreground = '#XYZ'; }]
  ]) {
    const invalid = structuredClone(coreTheme);
    mutate(invalid);
    const errors = await validate(JSON.stringify(invalid));
    assert.ok(errors.length > 0, `schema rejects ${label}`);
  }
  const result = {vscode: vscode.version, theme: theme.name, diagnostics: diagnostics.length, gitColors, negativeProbes: 4};
  console.log(`PASS: installed color-theme schema, ${JSON.stringify(result)}`);
  return result;
};
