import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { contrast } from './validate-family.mjs';

const theme = JSON.parse(await readFile(new URL('../themes/afterglow-84-mocha-retro-color-theme.json', import.meta.url), 'utf8'));
const c = theme.colors, s = theme.semanticTokenColors;
const failures = [];
let checks = 0;
const check = (condition, description) => { checks++; if (!condition) failures.push(description); };
const color = value => typeof value === 'string' ? value : value.foreground;
const measure = (foreground, background, description, base = c['editor.background']) => {
  const ratio = contrast(foreground, background, base);
  check(ratio >= 4.5, `${description}: ${ratio.toFixed(3)}:1 < 4.5:1`);
  return ratio;
};
const pairs = {
  'editor.background': ['editor.foreground','descriptionForeground','editorLineNumber.foreground','editorCodeLens.foreground','breadcrumb.foreground'],
  'editor.selectionBackground': ['editor.foreground'],
  'editor.inactiveSelectionBackground': ['editor.foreground'],
  'editorGroup.emptyBackground': ['foreground','descriptionForeground'],
  'sideBar.background': ['sideBar.foreground','sideBarTitle.foreground','gitDecoration.ignoredResourceForeground'],
  'sideBarSectionHeader.background': ['sideBarSectionHeader.foreground','descriptionForeground'],
  'activityBar.background': ['activityBar.foreground','activityBar.inactiveForeground'],
  'activityBarTop.background': ['activityBarTop.foreground','activityBarTop.inactiveForeground'],
  'activityBarBadge.background': ['activityBarBadge.foreground'],
  'titleBar.activeBackground': ['titleBar.activeForeground'],
  'titleBar.inactiveBackground': ['titleBar.inactiveForeground'],
  'tab.activeBackground': ['tab.activeForeground','tab.unfocusedActiveForeground'],
  'tab.inactiveBackground': ['tab.inactiveForeground','tab.unfocusedInactiveForeground'],
  'tab.hoverBackground': ['tab.hoverForeground'],
  'tab.unfocusedHoverBackground': ['tab.unfocusedHoverForeground'],
  'panel.background': ['foreground','panelTitle.activeForeground','panelTitle.inactiveForeground'],
  'panelSectionHeader.background': ['panelSectionHeader.foreground'],
  'commandCenter.background': ['commandCenter.foreground','commandCenter.inactiveForeground'],
  'commandCenter.activeBackground': ['commandCenter.activeForeground'],
  'statusBar.background': ['statusBar.foreground'],
  'statusBar.debuggingBackground': ['statusBar.debuggingForeground'],
  'statusBar.noFolderBackground': ['statusBar.noFolderForeground'],
  'statusBarItem.activeBackground': ['statusBar.foreground'],
  'statusBarItem.hoverBackground': ['statusBarItem.hoverForeground'],
  'statusBarItem.prominentBackground': ['statusBarItem.prominentForeground'],
  'statusBarItem.prominentHoverBackground': ['statusBarItem.prominentHoverForeground'],
  'statusBarItem.remoteBackground': ['statusBarItem.remoteForeground'],
  'statusBarItem.errorBackground': ['statusBarItem.errorForeground'],
  'statusBarItem.warningBackground': ['statusBarItem.warningForeground'],
  'input.background': ['input.foreground','input.placeholderForeground'],
  'inputOption.activeBackground': ['inputOption.activeForeground'],
  'inputOption.hoverBackground': ['input.foreground'],
  'inputValidation.errorBackground': ['inputValidation.errorForeground','errorForeground'],
  'inputValidation.warningBackground': ['inputValidation.warningForeground'],
  'inputValidation.infoBackground': ['inputValidation.infoForeground'],
  'dropdown.background': ['dropdown.foreground'],
  'dropdown.listBackground': ['dropdown.foreground'],
  'button.background': ['button.foreground'],
  'button.hoverBackground': ['button.foreground'],
  'button.secondaryBackground': ['button.secondaryForeground'],
  'button.secondaryHoverBackground': ['button.secondaryForeground'],
  'checkbox.background': ['checkbox.foreground'],
  'checkbox.selectBackground': ['checkbox.foreground'],
  'radio.activeBackground': ['radio.activeForeground'],
  'radio.inactiveBackground': ['radio.inactiveForeground'],
  'radio.inactiveHoverBackground': ['radio.inactiveForeground'],
  'menu.background': ['menu.foreground','descriptionForeground'],
  'menu.selectionBackground': ['menu.selectionForeground'],
  'menubar.selectionBackground': ['menubar.selectionForeground'],
  'quickInput.background': ['quickInput.foreground','descriptionForeground','pickerGroup.foreground'],
  'quickInputList.focusBackground': ['quickInputList.focusForeground','descriptionForeground'],
  'list.activeSelectionBackground': ['list.activeSelectionForeground','list.focusHighlightForeground','descriptionForeground'],
  'list.inactiveSelectionBackground': ['list.inactiveSelectionForeground','descriptionForeground'],
  'list.focusBackground': ['list.focusForeground','list.focusHighlightForeground','descriptionForeground'],
  'list.hoverBackground': ['list.hoverForeground','list.errorForeground','list.warningForeground','descriptionForeground'],
  'editorActionList.background': ['editorActionList.foreground'],
  'editorActionList.focusBackground': ['editorActionList.focusForeground'],
  'editorWidget.background': ['editorWidget.foreground'],
  'editorHoverWidget.background': ['editorHoverWidget.foreground','descriptionForeground'],
  'editorHoverWidget.statusBarBackground': ['editorHoverWidget.foreground','descriptionForeground'],
  'editorSuggestWidget.background': ['editorSuggestWidget.foreground','editorSuggestWidget.highlightForeground','editorSuggestWidgetStatus.foreground','descriptionForeground'],
  'editorSuggestWidget.selectedBackground': ['editorSuggestWidget.selectedForeground','editorSuggestWidget.focusHighlightForeground','descriptionForeground'],
  'editorInlayHint.background': ['editorInlayHint.foreground'],
  'editorInlayHint.typeBackground': ['editorInlayHint.typeForeground'],
  'editorInlayHint.parameterBackground': ['editorInlayHint.parameterForeground'],
  'peekViewResult.background': ['peekViewResult.fileForeground','peekViewResult.lineForeground'],
  'peekViewResult.selectionBackground': ['peekViewResult.selectionForeground'],
  'peekViewTitle.background': ['peekViewTitleLabel.foreground','peekViewTitleDescription.foreground'],
  'terminal.background': ['terminal.foreground'],
  'terminal.selectionBackground': ['terminal.selectionForeground'],
  'terminal.inactiveSelectionBackground': ['terminal.selectionForeground'],
  'notifications.background': ['notifications.foreground','descriptionForeground'],
  'notificationCenterHeader.background': ['notificationCenterHeader.foreground'],
  'badge.background': ['badge.foreground'],
  'keybindingLabel.background': ['keybindingLabel.foreground'],
  'welcomePage.background': ['foreground','descriptionForeground','textLink.foreground'],
  'welcomePage.tileBackground': ['foreground','descriptionForeground','textLink.foreground'],
  'welcomePage.tileHoverBackground': ['foreground','descriptionForeground','textLink.activeForeground'],
  'settings.focusedRowBackground': ['foreground','descriptionForeground','settings.headerForeground'],
  'settings.rowHoverBackground': ['foreground','descriptionForeground'],
  'settings.textInputBackground': ['settings.textInputForeground','input.placeholderForeground'],
  'settings.numberInputBackground': ['settings.numberInputForeground'],
  'settings.dropdownBackground': ['settings.dropdownForeground'],
  'settings.checkboxBackground': ['settings.checkboxForeground'],
  'notebook.outputContainerBackgroundColor': ['foreground','descriptionForeground'],
  'notebook.selectedCellBackground': ['foreground','descriptionForeground'],
  'diffEditor.unchangedRegionBackground': ['diffEditor.unchangedRegionForeground'],
  'debugView.stateLabelBackground': ['debugView.stateLabelForeground'],
  'debugExceptionWidget.background': ['foreground','debugTokenExpression.error']
};
for (const [background, foregrounds] of Object.entries(pairs)) {
  for (const foreground of foregrounds) measure(c[foreground], c[background], `${foreground} on ${background}`);
}

// Check every syntax foreground on the actual code-bearing surfaces, including comments.
const syntaxColors = new Set([...Object.values(s).map(color), ...theme.tokenColors.map(rule => rule.settings.foreground)]);
for (const background of ['editor.background','editor.lineHighlightBackground','editor.selectionBackground','editor.inactiveSelectionBackground','editorHoverWidget.background','peekViewEditor.background','notebook.cellEditorBackground','editorStickyScrollHover.background']) {
  for (const foreground of syntaxColors) measure(foreground, c[background], `${foreground} syntax on ${background}`);
}
const overlays = ['editor.wordHighlightBackground','editor.wordHighlightStrongBackground','editor.wordHighlightTextBackground','editor.findMatchBackground','editor.findMatchHighlightBackground','editorBracketMatch.background','editor.selectionHighlightBackground','editor.findRangeHighlightBackground','editor.hoverHighlightBackground','editorUnicodeHighlight.background','editor.rangeHighlightBackground','editor.foldBackground','editor.stackFrameHighlightBackground','editor.focusedStackFrameHighlightBackground'];
for (const overlay of overlays) {
  for (const base of ['editor.background','editor.lineHighlightBackground']) {
    for (const foreground of syntaxColors) measure(foreground, c[overlay], `${foreground} on ${overlay} over ${base}`, c[base]);
  }
}
function compositeHex(front, back) {
  const rgb = value => value.slice(1).match(/../g).map(v => parseInt(v, 16));
  const f = rgb(front), b = rgb(back), alpha = (f[3] ?? 255) / 255;
  return '#' + b.slice(0, 3).map((v, i) => Math.round(f[i] * alpha + v * (1 - alpha)).toString(16).padStart(2, '0')).join('');
}
for (const kind of ['inserted','removed']) {
  for (const base of ['editor.background','editor.lineHighlightBackground']) {
    const line = compositeHex(c[`diffEditor.${kind}LineBackground`], c[base]);
    for (const foreground of syntaxColors) measure(foreground, c[`diffEditor.${kind}TextBackground`], `${foreground} on stacked ${kind} diff over ${base}`, line);
  }
}
for (const kind of ['current','incoming','common']) {
  for (const foreground of syntaxColors) {
    measure(foreground, c[`merge.${kind}HeaderBackground`], `merge ${kind} header`);
    measure(foreground, c[`merge.${kind}ContentBackground`], `merge ${kind} content`);
  }
}
measure(color(s.comment), c['peekViewEditor.matchHighlightBackground'], 'comments on peek matches', c['peekViewEditor.background']);
measure(c['peekViewResult.lineForeground'], c['peekViewResult.matchHighlightBackground'], 'peek result match', c['peekViewResult.background']);
for (const kind of ['added','modified','deleted','renamed','untracked','ignored','conflicting']) {
  for (const base of ['sideBar.background','list.hoverBackground','list.inactiveSelectionBackground']) measure(c[`gitDecoration.${kind}ResourceForeground`], c[base], `Git ${kind} on ${base}`);
  // VS Code uses the selected row foreground on focused selected resources.
}
const ansi = Object.entries(c).filter(([key]) => key.startsWith('terminal.ansi'));
check(ansi.length === 16 && new Set(ansi.map(([, value]) => value)).size === 16, '16 distinct ANSI slots');
for (const [key, foreground] of ansi) {
  // ANSI black is conventionally a background; all other slots meet ordinary-text contrast here.
  if (key !== 'terminal.ansiBlack') measure(foreground, c['terminal.background'], key);
}

const palette = {
  '#2A211C': ['editor.background','editorGutter.background','editorGroup.emptyBackground','tab.activeBackground','welcomePage.background','notebook.editorBackground'],
  '#201814': ['sideBar.background','titleBar.activeBackground','titleBar.inactiveBackground','tab.inactiveBackground'],
  '#1B1511': ['activityBar.background'],
  '#241C17': ['panel.background','terminal.background','statusBar.background','statusBar.debuggingBackground'],
  '#33271F': ['editor.lineHighlightBackground','list.hoverBackground'],
  '#382B23': ['input.background','menu.background','dropdown.background','editorWidget.background','editorHoverWidget.background'],
  '#58402E': ['selection.background','list.activeSelectionBackground'],
  // A dark theme keeps syntax colors when selected: the supplied #58402E needs darkening.
  '#412F22': ['editor.selectionBackground'], '#3C2E24': ['editor.inactiveSelectionBackground'],
  '#544032': ['sideBar.border','panel.border','tab.border'],
  '#E6D3B5': ['editor.foreground'], '#C7B299': ['descriptionForeground'],
  '#D3A16A': ['focusBorder','tab.activeBorder','activityBar.activeBorder'], '#EDC68C': ['editorCursor.foreground']
};
for (const [expected, keys] of Object.entries(palette)) for (const key of keys) check(c[key] === expected, `${key} preserves palette ${expected}`);
for (const [selector, expected] of Object.entries({comment:'#AD9785',keyword:'#D99A79',function:'#DFB374',method:'#DFB374',string:'#B5BE8A',number:'#D6A086',type:'#D6C28E',class:'#D6C28E',variable:'#DFCCB0',parameter:'#DFCCB0',property:'#DFCCB0','variable.readonly':'#DFCCB0','property.readonly':'#DFCCB0',operator:'#C4AD91',regexp:'#A9B59B',decorator:'#D99A79',enumMember:'#D6A086'})) check(color(s[selector]) === expected, `${selector} hierarchy`);
for (const key of Object.keys(c).filter(key => /background$/i.test(key) && !key.startsWith('terminal.ansi'))) {
  const hex = c[key].slice(1);
  if (hex.length !== 6 || ['button.background','button.hoverBackground','activityBarBadge.background','progressBar.background'].includes(key)) continue;
  const [r,g,b] = hex.match(/../g).map(v => parseInt(v, 16));
  // Accent marks are allowed; large ordinary surfaces should never fall back to charcoal/plum.
  if (!/Gutter|Guide|Slider|Overview|CommandDecoration/.test(key)) check(r > g && g > b && r <= 88, `brown surface ${key}: ${c[key]}`);
}
const scopes = theme.tokenColors.flatMap(rule => rule.scope);
for (const broad of ['meta.function-call','meta.function','meta.parameter','meta.annotation']) check(!scopes.includes(broad), `no broad expression selector ${broad}`);
check(!('*.defaultLibrary' in s), 'built-in symbols retain function/type/variable semantic roles');
check(theme.tokenColors.find(rule => rule.name === 'Base text').settings.fontStyle === '', 'normal base text');
check(s.comment.italic === true && s.comment.bold === false, 'italic normal-weight semantic comments');
check(theme.tokenColors.find(rule => rule.name === 'Comments').settings.fontStyle === 'italic', 'italic TextMate comments');
for (const name of ['Markup bold','Markup italic','Markup bold italic']) check(theme.tokenColors.some(rule => rule.name === name && rule.settings.fontStyle), `${name} preserved`);
check(c['tab.activeBorderTop'].endsWith('00'), 'single thin bottom tab indicator');
check(!('editor.selectionForeground' in c), 'no reliance on high-contrast-only selection foreground');
check(contrast(c['editor.foreground'], c['editor.background']).toFixed(2) === '10.77', 'main text reference contrast');
check(contrast(color(s.comment), c['editor.background']).toFixed(2) === '5.66', 'comment reference contrast');
console.log(`Mocha Retro: editor ${contrast(c['editor.foreground'], c['editor.background']).toFixed(2)}:1; comments ${contrast(color(s.comment), c['editor.background']).toFixed(2)}:1; raised comments ${contrast(color(s.comment), c['input.background']).toFixed(2)}:1; selected comments ${contrast(color(s.comment), c['editor.selectionBackground']).toFixed(2)}:1`);
console.log(`Buttons: normal ${contrast(c['button.foreground'], c['button.background']).toFixed(2)}:1; hover ${contrast(c['button.foreground'], c['button.hoverBackground']).toFixed(2)}:1`);
// The installed VS Code button CSS uses group opacity .4 for generic disabled buttons.
// Composite BOTH text and fill onto the enclosing surface, not text onto the faded fill.
for (const base of ['editor.background','input.background']) {
  const disabledText = compositeHex(c['button.foreground'] + '66', c[base]);
  const disabledFill = compositeHex(c['button.background'] + '66', c[base]);
  console.log(`Disabled primary button at 40% opacity over ${base}: ${contrast(disabledText, disabledFill).toFixed(2)}:1 (informational, exempt)`);
}
console.log(`Informational only: disabled labels ${contrast(c.disabledForeground, c['input.background']).toFixed(2)}:1; decorative separator ${contrast(c['panel.border'], c['panel.background']).toFixed(2)}:1. Disabled controls and decorative borders are not ordinary text; VS Code owns disabled-button opacity.`);
assert.deepEqual(failures, [], 'Mocha Retro contrast, palette and precedence failures');
console.log(`PASS: ${checks} Mocha Retro state, overlay, palette and precedence checks (no contrast exceptions)`);
