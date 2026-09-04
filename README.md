# Afterglow ’84

Afterglow ’84 is a warm, restrained dark theme for Visual Studio Code. It follows afternoon light into a plum evening with apricot functions, coral control flow, sage strings, and lavender types. Its visual language borrows from vintage computers, cassette packaging, and golden-hour skies without turning the editor into neon signage.

This project is not published on the Visual Studio Marketplace.

## Design philosophy

- Keep large surfaces dark plum and reserve orange for focus, navigation, and small active states.
- Give syntax a stable hierarchy: coral control flow, gold callables, sage strings, pink numbers, lavender types, and warm neutral variables.
- Preserve the supplied palette instead of adding novelty colors. Semi-transparent overlays are palette colors with alpha.
- Favor comfortable long-session contrast over maximum saturation.

## Palette

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

## Install locally

To test the source folder directly:

1. Open this folder in VS Code.
2. Press `F5` and select **Run Afterglow ’84 Theme** if prompted.
3. In the Extension Development Host, run **Preferences: Color Theme** and choose **Afterglow ’84**.
4. Open files under `examples/` to inspect representative syntax.

## Build and install a VSIX

Install dependencies and validate:

```sh
npm install
npm run validate
npm run package
```

The manifest uses the Marketplace publisher ID `Retrocoder`. Confirm that this exact identifier belongs to your **Retro Coder** publisher account before publishing.

Install the generated archive with **Extensions: Install from VSIX...**, or run:

```sh
code --install-extension afterglow-84-0.1.0.vsix
```

Packaging does not publish the extension.

## Inspect token scopes

In the Extension Development Host, place the cursor on a token and run **Developer: Inspect Editor Tokens and Scopes**. The inspector shows the TextMate scope stack, semantic token, and winning theme rule. Use the preview files to check comments, control flow, callables, types, variables, constants, tags, attributes, and invalid syntax across grammars.

## Known limitations

- Semantic highlighting varies with the installed language extension and language-server state.
- Third-party grammars can use scopes not covered by the built-in-language-oriented rules.
- UI appearance varies slightly across VS Code versions, operating systems, and custom title-bar settings.
- A visual pass in an Extension Development Host is still required after changes; automated contrast and schema checks cannot judge every interaction state.

## Contributing

Open the relevant preview file, reproduce the token or UI state, and use the token inspector before changing a rule. Keep changes within the established palette where possible. Run `npm run validate` and rebuild the VSIX before sharing changes. Please do not add runtime code, telemetry, network access, or unrelated theme variants.

## License

Copyright (c) 2026 Abu Koushik. Released under the MIT License; see `LICENSE` in the extension root.

While doing work at 3am or 12am Turn  on Night Light, this because it will eventually blend with the color extention perfectly
