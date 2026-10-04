// Optional integration check using an installed VS Code resources/app directory.
// No dependencies are installed or distributed by this check.
import { readFile, readdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { contrast } from './validate-family.mjs';

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
for (const variant of ['retro-amber', 'dark-roast', 'mocha-retro']) {
const roast = variant !== 'retro-amber';
const mocha = variant === 'mocha-retro';
const theme = JSON.parse(await readFile(resolve(root, `themes/afterglow-84-${variant}-color-theme.json`), 'utf8'));
const registry = new tm.Registry({
  theme: { settings: [{ settings: { foreground: theme.colors['editor.foreground'], background: theme.colors['editor.background'] } }, ...theme.tokenColors] },
  onigLib: Promise.resolve({ createOnigScanner: sources => new onig.OnigScanner(sources), createOnigString: text => new onig.OnigString(text) }),
  loadGrammar: async scope => scope === 'source.js' ? tm.parseRawGrammar((await read('extensions/javascript/syntaxes/JavaScript.tmLanguage.json')).toString(), 'JavaScript.json') : null
});
const grammar = await registry.loadGrammar('source.js');
const preview = (await readFile(resolve(root, 'examples/preview.js'), 'utf8')).split(/\r?\n/);
const expected = mocha
  ? { sunset: '#DFB374', hour: '#DFCCB0', '18': '#D6A086', Afterglow: '#B5BE8A', true: '#D6A086', golden: '#A9B59B', palette: '#DFCCB0', name: '#DFCCB0', glow: '#DFCCB0' }
  : roast
  ? { sunset: '#E6B673', hour: '#DEC7A6', '18': '#D7A184', Afterglow: '#B8BF8A', true: '#D7A184', golden: '#A7BAA0', palette: '#DEC7A6', name: '#DEC7A6', glow: '#DEC7A6' }
  : { sunset: '#FFB454', hour: '#D2A6FF', '18': '#D2A6FF', Afterglow: '#AAD94C', true: '#D2A6FF', golden: '#95E6CB', palette: '#BFBDB6', name: '#BFBDB6', glow: '#BFBDB6' };
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
      const target = !roast && word === 'hour' && !scopes.some(s => s.startsWith('variable.parameter')) ? '#BFBDB6' : expected[word];
      assert.equal(color, target, `${word}: ${scopes.join(' ')}`);
      seen.add(word);
      console.log(`JavaScript TextMate ${word}: ${color}`);
    }
  }
  state = result.ruleStack;
}
assert.deepEqual([...seen].sort(), Object.keys(expected).sort(), 'all preview targets checked');
for (const [selector, color] of Object.entries(mocha ? { function: '#DFB374', method: '#DFB374', parameter: '#DFCCB0', number: '#D6A086', string: '#B5BE8A', regexp: '#A9B59B', variable: '#DFCCB0', property: '#DFCCB0', 'variable.readonly': '#DFCCB0', 'property.readonly': '#DFCCB0' } : roast ? { function: '#E6B673', method: '#E6B673', parameter: '#DEC7A6', number: '#D7A184', string: '#B8BF8A', regexp: '#A7BAA0', variable: '#DEC7A6', property: '#DEC7A6', 'variable.readonly': '#DEC7A6', 'property.readonly': '#DEC7A6' } : { function: '#FFB454', method: '#FFB454', parameter: '#D2A6FF', number: '#D2A6FF', string: '#AAD94C', regexp: '#95E6CB', variable: '#BFBDB6', property: '#BFBDB6', 'variable.readonly': '#BFBDB6', 'property.readonly': '#BFBDB6' })) assert.equal(theme.semanticTokenColors[selector], color, selector);
console.log('PASS: installed JavaScript grammar and semantic assignments (not a graphical or language-server test)');
}

// Load the installed grammar graph, including embedded languages, with no added dependencies.
const grammars = new Map(), languages = new Map();
for (const directory of await readdir(resolve(app, 'extensions'))) {
  let extension;
  try { extension = JSON.parse((await read(`extensions/${directory}/package.json`)).toString()); }
  catch (error) { if (error.code === 'ENOENT') continue; throw error; }
  for (const grammar of extension.contributes?.grammars || []) {
    grammars.set(grammar.scopeName, resolve(app, 'extensions', directory, grammar.path));
    if (grammar.language) languages.set(grammar.language, grammar.scopeName);
  }
}
for (const variant of ['mocha-retro', 'midnight-mocha']) {
const mocha = JSON.parse(await readFile(resolve(root, `themes/afterglow-84-${variant}-color-theme.json`), 'utf8'));
const label = mocha.name;
const registry = new tm.Registry({
  theme: { settings: [{ settings: { foreground: mocha.colors['editor.foreground'], background: mocha.colors['editor.background'] } }, ...mocha.tokenColors] },
  onigLib: Promise.resolve({ createOnigScanner: sources => new onig.OnigScanner(sources), createOnigString: text => new onig.OnigString(text) }),
  loadGrammar: async scope => {
    const path = grammars.get(scope);
    return path ? tm.parseRawGrammar(await readFile(path, 'utf8'), path) : null;
  }
});
const previews = {
  javascript:'preview.js', typescript:'preview.ts', javascriptreact:'preview.jsx', typescriptreact:'preview.tsx',
  python:'preview.py', c:'preview.c', cpp:'preview.cpp', java:'Preview.java', rust:'preview.rs', go:'preview.go',
  html:'preview.html', css:'preview.css', scss:'preview.scss', json:'preview.json', yaml:'preview.yaml',
  markdown:'preview.md', shellscript:'preview.sh'
};
let tokenCount = 0;
for (const [language, file] of Object.entries(previews)) {
  const grammar = await registry.loadGrammar(languages.get(language));
  assert.ok(grammar, `${language} installed grammar`);
  let state = tm.INITIAL;
  for (const line of (await readFile(resolve(root, 'examples', file), 'utf8')).split(/\r?\n/)) {
    const result = grammar.tokenizeLine2(line, state);
    for (let i = 0; i < result.tokens.length; i += 2) {
      const metadata = result.tokens[i + 1], color = registry.getColorMap()[(metadata >>> 15) & 0x1ff];
      assert.ok(contrast(color, mocha.colors['editor.background']) >= 4.5, `${language} ${line}: ${color} text contrast`);
      if (language !== 'markdown') assert.equal((metadata >>> 11) & 2, 0, `${language}: normal-weight source text`);
      tokenCount++;
    }
    state = result.ruleStack;
  }
  console.log(`${label}: ${language} preview tokenized; readable, regular source text`);
}

// Precise precedence regressions: built-in roles, arguments, decorators, keys and emphasis.
const cases = [
  // The JS grammar classifies Math as an object variable; semantic class/namespace tokens use brass.
  ['javascript', 'const result = Math.max(1, options.amount);', [['Math','#DFCCB0'],['max','#DFB374'],['1','#D6A086'],['options','#DFCCB0'],['amount','#DFCCB0']]],
  ['javascript', 'const answer = Number.isFinite(config.value);', [['Number','#DFCCB0'],['isFinite','#DFB374'],['config','#DFCCB0'],['value','#DFCCB0']]],
  ['typescript', 'function brew(portion: number) { return portion + 1; }', [['brew','#DFB374'],['portion','#DFCCB0'],['return','#D99A79'],['1','#D6A086']]],
  ['python', '@dataclass(frozen=True)', [['dataclass','#D99A79'],['frozen','#DFCCB0'],['True','#D6A086']]],
  ['python', 'print(len(cups)) # warm coffee', [['print','#DFB374'],['len','#DFB374'],['# warm coffee','#AD9785',1]]],
  ['rust', 'println!("coffee");', [['println','#DFB374'],['coffee','#B5BE8A']]],
  ['json', '{"coffee": true, "count": 3}', [['coffee','#DFCCB0'],['true','#D6A086'],['3','#D6A086']]],
  ['yaml', 'coffee: true', [['coffee','#DFCCB0'],['true','#D6A086']]],
  ['css', '.coffee { color: red; }', [['coffee','#D6C28E'],['color','#DFCCB0']]],
  ['html', '<button title="coffee">Brew</button>', [['button','#D99A79'],['title','#DFB374'],['coffee','#B5BE8A']]],
  ['markdown', '**bold** *italic* ***both***', [['bold','#DFB374',2],['italic','#D6A086',1],['both','#DFB374',3]]]
];
let targets = 0;
const precedenceFailures = [];
// The original Mocha Retro expectations remain unchanged. Midnight Mocha keeps
// Night Drive's pink-brown regex/decorator roles and cream variables/parameters.
const midnightPalette = {
  '#DFCCB0':'#E8D5BF', '#DFB374':'#E6B86A', '#D6A086':'#D4A291',
  '#B5BE8A':'#B2BD8A', '#D99A79':'#D98B73', '#AD9785':'#A28F7D', '#D6C28E':'#D5BB91'
};
for (const [language, line, expectations] of cases) {
  const grammar = await registry.loadGrammar(languages.get(language));
  const result = grammar.tokenizeLine2(line, tm.INITIAL), scoped = grammar.tokenizeLine(line, tm.INITIAL);
  for (const [word, mochaExpected, style] of expectations) {
    const expected = variant === 'midnight-mocha'
      ? language === 'python' && word === 'dataclass' ? '#D4A291' : midnightPalette[mochaExpected]
      : mochaExpected;
    const index = line.indexOf(word);
    assert.ok(index >= 0, `${word} fixture exists`);
    let metadata;
    for (let i = 0; i < result.tokens.length; i += 2) if (result.tokens[i] <= index && (result.tokens[i + 2] ?? line.length) > index) metadata = result.tokens[i + 1];
    const actual = registry.getColorMap()[(metadata >>> 15) & 0x1ff];
    const scopes = scoped.tokens.find(token => token.startIndex <= index && token.endIndex > index)?.scopes;
    if (actual !== expected) precedenceFailures.push(`${language} ${word}: ${actual} expected ${expected}; ${scopes?.join(' ')}`);
    if (style !== undefined && ((metadata >>> 11) & 0xf) !== style) precedenceFailures.push(`${language} ${word} style: ${(metadata >>> 11) & 0xf} expected ${style}`);
    targets++;
  }
}
assert.deepEqual(precedenceFailures, [], `${label} installed-grammar precedence`);
console.log(`PASS: ${label} ${Object.keys(previews).length} installed preview grammars (${tokenCount} token spans) and ${targets} precedence targets. Language-server/GUI checks are separate.`);
}
