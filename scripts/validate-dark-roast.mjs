import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {contrast} from './validate-family.mjs';
const theme=JSON.parse(await readFile(new URL('../themes/afterglow-84-dark-roast-color-theme.json',import.meta.url),'utf8'));
const c=theme.colors;
const pairs=[
 ['editor.foreground','editor.background'],['descriptionForeground','editor.background'],
 ['input.placeholderForeground','input.background'],['editorInlayHint.foreground','editorInlayHint.background'],
 ['editor.selectionForeground','editor.selectionBackground'],['editor.foreground','editor.inactiveSelectionBackground'],
 ['button.foreground','button.background'],['button.foreground','button.hoverBackground'],
 ['button.secondaryForeground','button.secondaryBackground'],['button.secondaryForeground','button.secondaryHoverBackground'],
 ['tab.inactiveForeground','tab.inactiveBackground'],['tab.unfocusedInactiveForeground','tab.inactiveBackground'],
 ['tab.hoverForeground','tab.hoverBackground'],['commandCenter.inactiveForeground','commandCenter.background'],
 ['editorSuggestWidget.selectedForeground','editorSuggestWidget.selectedBackground'],
 ['quickInputList.focusForeground','quickInputList.focusBackground'],['peekViewTitleDescription.foreground','peekViewTitle.background']
];
for(const [fg,bg] of pairs){const ratio=contrast(c[fg],c[bg],c['editor.background']);assert.ok(ratio>=4.5,`${fg} on ${bg}: ${ratio}`);console.log(`${fg} on ${bg}: ${ratio.toFixed(2)}:1`);}
for(const bg of ['editor.background','editor.lineHighlightBackground','editorHoverWidget.background'])assert.ok(contrast(theme.semanticTokenColors.comment.foreground,c[bg])>=4.5,`comments on ${bg}`);
for(const key of ['editor.wordHighlightBackground','editor.wordHighlightStrongBackground','editor.findMatchBackground','editor.findMatchHighlightBackground','editorBracketMatch.background','editor.selectionHighlightBackground','editor.findRangeHighlightBackground','editor.hoverHighlightBackground']){
 for(const base of ['editor.background','editor.lineHighlightBackground'])assert.ok(contrast('#AA9279',c[key],c[base])>=4.5,`comments on ${key} over ${base}`);
}
for(const kind of ['inserted','removed']) {
 // Stack the line tint beneath the text tint before measuring comments.
 const rgb=c['editor.background'].slice(1).match(/../g).map(v=>parseInt(v,16));
 const line=c[`diffEditor.${kind}LineBackground`].slice(1).match(/../g).map(v=>parseInt(v,16));
 const bg='#'+rgb.map((v,i)=>Math.round(line[i]*line[3]/255+v*(1-line[3]/255)).toString(16).padStart(2,'0')).join('');
 assert.ok(contrast('#AA9279',c[`diffEditor.${kind}TextBackground`],bg)>=4.5,`comments on stacked ${kind} diff`);
}
for(const key of ['editor.background','editorGutter.background','editorGroup.emptyBackground'])assert.equal(c[key],'#241A14');
assert.equal(c['tab.activeBorder'],'#D6A15D');assert.equal(c['tab.activeBorderTop'],'#00000000');
assert.equal(theme.semanticTokenColors['*.defaultLibrary'],undefined);
assert.ok(!theme.tokenColors.flatMap(r=>r.scope).includes('meta.function-call'));
assert.equal(theme.tokenColors.find(r=>r.name==='Base text').settings.fontStyle,'');
assert.equal(theme.semanticTokenColors.comment.italic,true);
console.log(`Disabled foreground (informational, exempt): ${contrast(c.disabledForeground,c['input.background']).toFixed(2)}:1. VS Code applies its own disabled button opacity; no unsupported button.disabled color ID is added.`);
console.log('PASS: Dark Roast actual-state contrast and palette guards');
