# Afterglow ’84

Afterglow ’84 is a warm, restrained dark theme for Visual Studio Code. It follows afternoon light into a plum evening with apricot functions, coral control flow, sage strings, and lavender types. Its visual language borrows from vintage computers, cassette packaging, and golden-hour skies without turning the editor into neon signage.

## Design philosophy

- Keep large surfaces dark plum and reserve orange for focus, navigation, and small active states.
- Give syntax a stable hierarchy: coral control flow, gold callables, sage strings, pink numbers, lavender types, and warm neutral variables.
- Preserve the supplied palette instead of adding novelty colors. Semi-transparent overlays are palette colors with alpha.
- Favor comfortable long-session contrast over maximum saturation.

## Included themes

Afterglow ’84 now includes four coordinated color themes for different lighting conditions:

| Theme | Style | Best suited for |
| --- | --- | --- |
| **Afterglow ’84** | Balanced warm plum dark theme | Everyday coding and afternoon-to-evening use |
| **Afterglow ’84 — Night Drive** | Deeper, lower-brightness plum theme without a pure-black background | Late-night and dim-room coding |
| **Afterglow ’84 — Golden Hour** | Warm parchment light theme with darker sunset-inspired syntax colors | Bright rooms and daytime coding |
| **Afterglow ’84 — Retro Amber** | Near-black blue surfaces with amber focus, orange keywords, and lime strings | A restrained retro editor with warm accents |

The original three variants preserve the same syntax hierarchy while adjusting brightness and contrast for their backgrounds. Retro Amber uses its own syntax assignments, including lavender parameters and neutral variables and object properties.

### Retro Amber palette and contrast

| Role | Hex |
| --- | --- |
| Editor, sidebar, activity bar, panel | `#0D1017` |
| Default text, variables, object properties | `#BFBDB6` |
| Current line | `#161A24` |
| Selected Explorer row / subtle separators | `#181D26` |
| Active tab underline / focused input outline | `#E6B450` |
| Keywords / control flow | `#FF8F40` |
| Functions / methods | `#FFB454` |
| Strings | `#AAD94C` |
| Parameters / numbers / booleans | `#D2A6FF` |
| Regular-expression body | `#95E6CB` |
| Italic comments | `#5A6673` |
| Muted interface labels | `#5A6378` |

Against `#0D1017`, default text measures **10.12:1**, comments **3.25:1**, and muted labels **3.16:1**. Comments and muted labels intentionally fall below the earlier 4.5:1 target to retain the supplied reference colors. Validation prints these as **EXCEPTION**, never as passing 4.5:1 results. Muted labels on raised surfaces can have still lower contrast. The original three themes retain their existing contrast requirements; this is not a claim that every interface state is accessible.

Unshown states are design choices: coral `#F07178` errors, amber/orange warnings, lavender information, dark hover widgets, blue-gray `#273140` selections, and translucent lime/coral diffs. Terminal ANSI colors reuse the syntax palette with lighter bright shades; ANSI black remains a background-like color. These values are not claimed as exact screenshot matches.

The new palette follows the supplied sampled colors; the reference image was unavailable during implementation. A color theme cannot reproduce Explorer icons, PowerShell prompts, font rendering, or panel positions. No icon selection, font, prompt, layout, or bracket-colorization setting is changed. Supported bracket colors retain normal VS Code behavior.

Theme files are hand-authored; there is no theme generator. Workbench colors and semantic selectors follow the official [color-theme system](https://code.visualstudio.com/api/extension-guides/color-theme), [color reference](https://code.visualstudio.com/api/references/theme-color), and [semantic highlighting guide](https://code.visualstudio.com/api/language-extensions/semantic-highlight-guide).

## Palette

The following palette defines the original **Afterglow ’84** dark variant:

| Role | Hex |
| --- | --- |
| Editor background | `#211A24` |
| Editor foreground | `#F3DDC4` |
| Sidebar background | `#1A151D` |
| Activity bar background | `#171219` |
| Panel background | `#1D171F` |
| Input background | `#2A202D` |
| Current line | `#2B222F` |
| Selection | `#594052` |
| UI border | `#4A3947` |
| Cursor | `#FFB35C` |
| Primary accent | `#FF9A62` |
| Error | `#FF5F68` |
| Warning / functions | `#FFC56E` |
| Information / types | `#D6A7FF` |
| Success / strings | `#A8D89B` |
| Comments | `#A08799` |
| Keywords | `#FF7A70` |
| Numbers | `#E89AC7` |
| Variables | `#F0C9A5` |
| Operators | `#CAB6A4` |

Derived opaque shades are limited to `#120E14` (shadow), `#30253B` (information validation), `#3B2229` (error validation), `#3B3024` (warning validation), `#3A2B3A` and `#6A4B61` (interaction states), `#7B4653` (debug status), `#AD553E` and `#B05740` (accessible button states), and `#FFF4E5` (high-contrast text on selected controls). They were selected as close plum/orange/cream relatives for small UI states; translucent values append an alpha channel to palette colors. Button text measures `4.66:1` normally and `4.51:1` on hover.

## Language coverage

TextMate rules and semantic tokens cover common constructs in JavaScript, TypeScript, React/JSX/TSX, Python, C, C++, HTML, CSS, SCSS, JSON, YAML, Markdown, shell scripts, Java, Rust, and Go. Highlighting ultimately depends on the active language grammar and language server, so extensions may expose additional scopes or semantic tokens.

## Platform support

Afterglow ’84 is a declarative color-theme extension with no native binaries or runtime platform code. It is designed to work with supported versions of Visual Studio Code on:

- Windows 10 and Windows 11
- macOS on Intel MacBooks
- macOS on Apple Silicon MacBooks
- Linux

Useful shortcuts:

| Action | Windows / Linux | macOS |
| --- | --- | --- |
| Open Command Palette | `Ctrl+Shift+P` | `Cmd+Shift+P` |
| Open Extensions | `Ctrl+Shift+X` | `Cmd+Shift+X` |
| Start Extension Development Host | `F5` | `F5` or `fn+F5` |

On macOS, if the `code` command is unavailable, open the Command Palette and run **Shell Command: Install 'code' command in PATH**, then restart the terminal.

## File icons

This extension provides color themes only. It does not include or activate a file-icon theme or product-icon theme, and it does not change your existing icon settings. You can continue using any file-icon theme you prefer.

The image in `assets/icon.png` is only the extension’s Marketplace logo; it does not replace icons in the VS Code Explorer.

## Install locally

To test the source folder directly:

1. Open this folder in VS Code.
2. Press `F5` and select **Run Afterglow ’84 Theme** if prompted. On a MacBook, use `fn+F5` if the function keys control hardware features.
3. In the Extension Development Host, run **Preferences: Color Theme** and choose **Afterglow ’84**, **Afterglow ’84 — Night Drive**, **Afterglow ’84 — Golden Hour**, or **Afterglow ’84 — Retro Amber**.
4. Open files under `examples/` to inspect representative syntax.

## Build and install a VSIX

Install dependencies and validate:

```sh
npm install
npm run validate
npm run package
```

Run validator unit checks with `node --test scripts/validate-family.test.mjs`. Optionally run `node scripts/validate-vscode.mjs "<VS Code resources/app directory>"` to check color IDs against an installed workbench and tokenize the JavaScript preview with its bundled grammar. This requires a desktop VS Code installation containing `node_modules.asar`; it does not replace a graphical or language-server test.

The manifest uses the Marketplace publisher ID `Retrocoder`. Confirm that this exact identifier belongs to your **Retro Coder** publisher account before publishing.

Install the generated archive with **Extensions: Install from VSIX...**, or run:

```sh
code --install-extension afterglow-84-0.3.0.vsix
```

The same `.vsix` works across Windows, macOS, and Linux because the extension contains no platform-specific runtime code. Packaging does not publish the extension.

## Inspect token scopes

In the Extension Development Host, place the cursor on a token and run **Developer: Inspect Editor Tokens and Scopes**. The inspector shows the TextMate scope stack, semantic token, and winning theme rule. Use the preview files to check comments, control flow, callables, types, variables, constants, tags, attributes, and invalid syntax across grammars.

For Retro Amber, check `examples/preview.js`: `sunset` should be orange-gold, `hour`, `18`, and `true` lavender, `"Afterglow"` lime, and the regex body mint. Repeat with semantic highlighting enabled and disabled; variables and object keys should remain neutral. Check the thin amber underline below the active tab, focused input outline, Explorer selection, and bracket pairs. A graphical comparison and real macOS testing remain pending.

Without semantic highlighting, the built-in JavaScript grammar marks the `hour` declaration as a parameter but its later references as ordinary variables (neutral). The semantic `parameter` rule supplies lavender for identified references; a color theme alone cannot infer symbol identity from TextMate scopes.

## Known limitations

- Semantic highlighting varies with the installed language extension and language-server state.
- Third-party grammars can use scopes not covered by the built-in-language-oriented rules.
- UI appearance varies slightly across VS Code versions, operating systems, and custom title-bar settings.
- A visual pass in an Extension Development Host is still required after changes; automated contrast and schema checks cannot judge every interaction state.
- Platform-neutral validation does not replace a final visual check on real macOS hardware.

## Late-night recommendation

When working around midnight or 3 a.m., enable **Night Light** on Windows or supported Linux desktops, or **Night Shift** on macOS. The warmer display temperature blends naturally with the Afterglow ’84 palette and may feel more comfortable in a dark room.

## Contributing

Open the relevant preview file, reproduce the token or UI state, and use the token inspector before changing a rule. Keep changes within the established palette where possible. Run `npm run validate` and rebuild the VSIX before sharing changes. Please do not add runtime code, telemetry, network access, or unrelated theme variants.


Please do not commit to Main file directly open a new branch everytime to wish to contribute.


## License

Copyright (c) 2026 Abu Koushik. Released under the MIT License; see `LICENSE` in the extension root.
