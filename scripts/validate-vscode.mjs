// Optional integration check using an installed VS Code resources/app directory.
// No dependencies are installed or distributed by this check.
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const app = process.argv[2];
assert.ok(app, 'Usage: node scripts/validate-vscode.mjs <VS Code resources/app>');
const read = path => readFile(resolve(app, path));
const manifest = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const bundle = (await read('out/vs/workbench/workbench.desktop.main.js')).toString() + (await read('extensions/git/package.json')).toString();
for (const entry of manifest.contributes.themes) {
  const theme = JSON.parse(await readFile(resolve(root, entry.path), 'utf8'));
  const unknown = Object.keys(theme.colors).filter(key => !bundle.includes(`"${key}"`) && !bundle.includes(`'${key}'`));
  assert.deepEqual(unknown, [], `${entry.label}: unrecognized installed workbench color IDs`);
  console.log(`${entry.label}: ${Object.keys(theme.colors).length} color IDs found in installed VS Code workbench`);
}

// Read bundled CommonJS tokenizers directly from Electron's ASAR without extracting files.
const archive = await read('node_modules.asar');
const header = JSON.parse(archive.subarray(16, 16 + archive.readUInt32LE(12)).toString());
function bundledModule(name) {
  const entry = header.files[name].files.release.files['main.js'];
  const offset = 8 + archive.readUInt32LE(4) + Number(entry.offset);
  const module = { exports: {} };
  new Function('require', 'module', 'exports', archive.subarray(offset, offset + entry.size).toString())(createRequire(import.meta.url), module, module.exports);
  return module.exports;
}
const tm = bundledModule('vscode-textmate');
const onig = bundledModule('vscode-oniguruma');
const wasm = await read('node_modules.asar.unpacked/vscode-oniguruma/release/onig.wasm');
await onig.loadWASM(wasm.buffer.slice(wasm.byteOffset, wasm.byteOffset + wasm.byteLength));
const theme = JSON.parse(await readFile(resolve(root, 'themes/afterglow-84-retro-amber-color-theme.json'), 'utf8'));
const registry = new tm.Registry({
  theme: { settings: [{ settings: { foreground: theme.colors['editor.foreground'], background: theme.colors['editor.background'] } }, ...theme.tokenColors] },
  onigLib: Promise.resolve({ createOnigScanner: sources => new onig.OnigScanner(sources), createOnigString: text => new onig.OnigString(text) }),
  loadGrammar: async scope => scope === 'source.js' ? tm.parseRawGrammar((await read('extensions/javascript/syntaxes/JavaScript.tmLanguage.json')).toString(), 'JavaScript.json') : null
});
const grammar = await registry.loadGrammar('source.js');
const preview = (await readFile(resolve(root, 'examples/preview.js'), 'utf8')).split(/\r?\n/);
const expected = { sunset: '#FFB454', hour: '#D2A6FF', '18': '#D2A6FF', Afterglow: '#AAD94C', true: '#D2A6FF', golden: '#95E6CB', palette: '#BFBDB6', name: '#BFBDB6', glow: '#BFBDB6' };
const seen = new Set();
let state = tm.INITIAL;
for (const line of preview) {
  const result = grammar.tokenizeLine2(line, state);
  const scoped = grammar.tokenizeLine(line, state);
  for (let i = 0; i < result.tokens.length; i += 2) {
    const start = result.tokens[i], end = result.tokens[i + 2] ?? line.length;
    const text = line.slice(start, end);
    const color = registry.getColorMap()[(result.tokens[i + 1] >>> 15) & 0x1ff];
    for (const match of text.matchAll(/\b(sunset|hour|18|Afterglow|true|golden|palette|name|glow)\b/g)) {
      const word = match[0];
      const scopes = scoped.tokens.find(t => t.startIndex <= start + match.index && t.endIndex > start + match.index)?.scopes || [];
      if (scopes.some(s => s.startsWith('string')) && !['Afterglow', 'golden'].includes(word)) continue;
      if (word === 'golden' && !scopes.some(s => s.startsWith('string.regexp'))) continue;
      // TextMate cannot distinguish a parameter reference from a local variable.
      // The JavaScript language service supplies semantic 'parameter' for references.
      const target = word === 'hour' && !scopes.some(s => s.startsWith('variable.parameter')) ? '#BFBDB6' : expected[word];
      assert.equal(color, target, `${word}: ${scopes.join(' ')}`);
      seen.add(word);
      console.log(`JavaScript TextMate ${word}: ${color}`);
    }
  }
  state = result.ruleStack;
}
assert.deepEqual([...seen].sort(), Object.keys(expected).sort(), 'all preview targets checked');
for (const [selector, color] of Object.entries({ function: '#FFB454', method: '#FFB454', parameter: '#D2A6FF', number: '#D2A6FF', string: '#AAD94C', regexp: '#95E6CB', variable: '#BFBDB6', property: '#BFBDB6', 'variable.readonly': '#BFBDB6', 'property.readonly': '#BFBDB6' })) assert.equal(theme.semanticTokenColors[selector], color, selector);
console.log('PASS: installed JavaScript grammar and semantic assignments (not a graphical or language-server test)');
