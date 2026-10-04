import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { contrast } from './validate-family.mjs';

const theme = JSON.parse(await readFile(new URL('../themes/afterglow-84-midnight-mocha-color-theme.json', import.meta.url), 'utf8'));
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

// Night Drive's coverage and role hierarchy remain available in this variant.
const night = JSON.parse(await readFile(new URL('../themes/afterglow-84-night-drive-color-theme.json', import.meta.url), 'utf8'));
for (const key of Object.keys(night.colors)) check(key in c, `Night Drive UI coverage: ${key}`);
for (const rule of night.tokenColors) check(theme.tokenColors.some(candidate => candidate.name === rule.name), `Night Drive syntax category: ${rule.name}`);
for (const key of Object.keys(night.semanticTokenColors).filter(key => key !== '*.defaultLibrary')) check(key in s, `Night Drive semantic category: ${key}`);
const palette = {
  '#1C1512':['editor.background','editorGutter.background','editorGroup.emptyBackground','welcomePage.background','tab.activeBackground'],
  '#E8D5BF':['editor.foreground'], '#17110F':['sideBar.background','titleBar.activeBackground'],
  '#120D0B':['activityBar.background'], '#191210':['panel.background','terminal.background','statusBar.background'],
  '#271D18':['input.background','menu.background','quickInput.background','editorWidget.background','editorHoverWidget.background','editorSuggestWidget.background','notifications.background'],
  '#241B16':['editor.lineHighlightBackground'], '#4A3529':['selection.background','list.activeSelectionBackground','menu.selectionBackground'],
  // The requested #4A3529 gives comments only 3.69:1. Darken the code selection
  // instead of relying on editor.selectionForeground, which is for high contrast.
  '#36271F':['editor.selectionBackground'], '#4B382D':['sideBar.border','panel.border','input.border'],
  '#E8AC71':['focusBorder','editorCursor.foreground'], '#EB8A80':['editorError.foreground'],
  '#E6B86A':['editorWarning.foreground'], '#9EBDD0':['editorInfo.foreground']
};
for (const [expected, keys] of Object.entries(palette)) for (const key of keys) check(c[key] === expected, `${key} palette ${expected}`);
for (const [key, expected] of Object.entries({comment:'#A28F7D',keyword:'#D98B73',function:'#E6B86A',method:'#E6B86A',macro:'#E6B86A',string:'#B2BD8A',type:'#D5BB91',class:'#D5BB91',number:'#D4A291',enumMember:'#D4A291',regexp:'#D4A291',decorator:'#D4A291',variable:'#E8D5BF',parameter:'#E8D5BF',property:'#E8D5BF','variable.readonly':'#D4A291','property.readonly':'#D4A291',operator:'#C7B39C'})) check(color(s[key]) === expected, `semantic role ${key}`);
const scopes = theme.tokenColors.flatMap(rule => rule.scope);
for (const broad of ['meta.function-call','meta.parameter','meta.decorator']) check(!scopes.includes(broad), `no container coloring: ${broad}`);
check(!('*.defaultLibrary' in s), 'built-ins retain individual semantic roles');
check(!('editor.selectionForeground' in c), 'dark selections retain actual syntax foregrounds');
for (const key of ['editor.inactiveSelectionBackground','editorOverviewRuler.findMatchForeground']) check(c[key].length === 9 && !c[key].endsWith('FF'), `schema-required transparency: ${key}`);
check(theme.tokenColors.find(rule => rule.name === 'Comments').settings.fontStyle === 'italic' && s.comment.italic === true, 'consistent italic comments');
for (const [key, value] of Object.entries(c)) {
  if (!/background$/i.test(key) || value.length !== 7 || /Gutter|Guide|Slider|Overview|CommandDecoration|separator/.test(key)) continue;
  if (['button.background','button.hoverBackground','activityBarBadge.background','progressBar.background'].includes(key)) continue;
  const [r,g,b] = value.slice(1).match(/../g).map(v => parseInt(v,16));
  check(r > g && g > b && r <= 0x4a, `brown surface ${key}: ${value}`);
}
for (const surface of ['sideBar.background','input.background','list.activeSelectionBackground']) {
  check(contrast(c.focusBorder,c[surface]) >= 3, `focus indicator on ${surface}`);
}
for (const kind of ['info','warning','error','source']) measure(c[`debugConsole.${kind}Foreground`], c['panel.background'], `debug console ${kind}`);
for (const [key, value] of Object.entries(c).filter(([key]) => key.startsWith('debugTokenExpression.'))) measure(value, c['panel.background'], key);
for (const base of ['editor.background','editor.lineHighlightBackground']) {
  for (const foreground of syntaxColors) measure(foreground, c['searchEditor.findMatchBackground'], `search editor matches over ${base}`, c[base]);
}
for (const foreground of syntaxColors) {
  measure(foreground, c['textCodeBlock.background'], 'code in Markdown/hover blocks');
  measure(foreground, c['editorSuggestWidget.background'], 'syntax in suggestions');
}
console.log(`Midnight Mocha: editor ${contrast(c['editor.foreground'],c['editor.background']).toFixed(2)}:1; comments ${contrast(color(s.comment),c['editor.background']).toFixed(2)}:1; popup comments ${contrast(color(s.comment),c['editorHoverWidget.background']).toFixed(2)}:1; selected comments ${contrast(color(s.comment),c['editor.selectionBackground']).toFixed(2)}:1`);
console.log(`Buttons: normal ${contrast(c['button.foreground'],c['button.background']).toFixed(2)}:1; hover ${contrast(c['button.foreground'],c['button.hoverBackground']).toFixed(2)}:1`);
assert.deepEqual(failures, [], 'Midnight Mocha contrast, coverage and palette failures');
console.log(`PASS: ${checks} Midnight Mocha checks; no new contrast exceptions. ANSI black is a conventional terminal background; disabled-control opacity is owned by VS Code.`);
