# Changelog

All notable changes to Afterglow ’84 are documented here.

## 0.6.0

- Added Afterglow ’84 — Midnight Mocha as a seventh dark theme based on Night Drive, with walnut-brown surfaces, cream text, restrained caramel/copper accents and 498 explicit interface colors.
- Preserved all six existing themes and their selectable names; retained Night Drive's syntax categories and language coverage with consistent TextMate and semantic roles, explicit JSON/YAML keys and named callables.
- Kept the supplied syntax palette and adjusted the editor selection to `#36271F` for 4.61:1 selected-comment contrast. Normal text and comments measure 12.61:1 and 5.80:1; popup comments measure 5.30:1. Reduced stacked diff tint and honored schema-required transparency.
- Added Midnight Mocha state/contrast guards to the existing validation workflow; extended installed-grammar checks to its 17 preview languages and 34 precedence targets, and added full installed-editor schema validation with negative probes.
- Inspected Windows VS Code 1.136.1 code previews, selected comments, command palette, settings/buttons, synthetic diagnostic hover and diff views. Documented remaining live language-service, terminal, debug, macOS and Linux checks.
- Appended the new description, palette, ANSI colors and validation instructions to the README; synchronized manifest and lockfile at 0.6.0.
- Added GitHub Actions validation and packaging on Linux, Windows and macOS for pull requests, main-branch pushes and version tags. All platform checks gate release publication.
- Added GitHub Releases-only publication from the exact tagged commit, with one verified VSIX asset, SHA-256 in the notes, minimal GITHUB_TOKEN permissions, reproducible packaging and safe rerun/draft recovery checks.

## 0.5.0

- Added Afterglow ’84 — Mocha Retro as a sixth theme, with soft coffee-brown surfaces, cream text, caramel focus, copper keywords, olive strings and 476 explicit interface colors.
- Preserved all five existing theme files, extension identity and logo; retained a declarative extension with no runtime or new dependencies.
- Covered empty-editor/welcome, menus, terminal ANSI, settings, notebooks, diagnostics, diffs and debugging surfaces; added consistent TextMate and semantic rules with normal source weight and Markdown emphasis.
- Verified main/comment contrast of 10.77:1 and 5.66:1. Darkened only the active editor selection from #58402E to #412F22 after graphical testing showed selected comments at 3.45:1: normal dark themes do not apply the high-contrast selection foreground. Selected comments now measure 4.56:1.
- Reduced matching-selection and stacked diff overlay opacities to retain 4.5:1 text contrast; added 871 Mocha state, palette and precedence checks without weakening existing validation or adding contrast exceptions.
- Extended installed-grammar validation to all 17 preview languages and 34 targeted precedence cases; inspected actual TypeScript language-service output and Windows Development Host rendering.
- Added genuine Mocha Retro editor and empty-editor screenshots, palette/ANSI tables, selection instructions and explicit remaining platform/visual checks.
- Incremented the minor version from 0.4.0 to 0.5.0 and synchronized the lockfile.

## 0.4.0

- Added Afterglow ’84 — Dark Roast with espresso-brown surfaces, parchment text, caramel focus, copper keywords, and 330 explicit interface colors.
- Preserved all four existing theme files and registrations, extension identity, and logo.
- Added TextMate and semantic highlighting with narrowed selectors, explicit brown empty-editor coverage, and all 16 terminal ANSI slots.
- Added Dark Roast contrast guards and installed-grammar validation; selected text uses parchment to keep comments readable on the active selection.
- Documented the palette, terminal-only additions, selection instructions, and measured contrast without introducing low-contrast exceptions.
- Added real Windows Development Host screenshots of Dark Roast's code and empty-editor views; documented the scope and remaining visual checks.
- Reduced search and diff overlay opacity to preserve comment contrast, including stacked diff backgrounds.

## 0.3.1

- Added user-supplied interface screenshots for all four themes to the Marketplace description.
- Bundled the original JPEG images under assets/screenshots, with versioned Microsoft-hosted image URLs.
- Preserved all theme palettes and syntax rules.

## 0.3.0

- Added exactly one color theme, Afterglow ’84 — Retro Amber, with near-black blue surfaces and the supplied amber, orange, lime, lavender, and mint syntax palette.
- Preserved all three existing themes, labels, extension identity, logo, and macOS instructions.
- Added explicit Retro Amber-only contrast exceptions for sampled dim comments (3.25:1) and muted labels (3.16:1); other variants retain their existing requirements.
- Documented derived interaction and terminal colors, token-preview expectations, and pending graphical/reference and macOS checks.

## 0.2.0

- Added Night Drive, a deep plum nighttime theme, and Golden Hour, a warm parchment light theme.
- Preserved the original palette and syntax rules; added explicit menu colors and the remaining bracket-pair guides to all variants.
- Registered three color-theme choices without icon-theme contributions; retained the extension logo and Marketplace identity.
- Extended validation with actual-color contrast, alpha compositing, structural schema checks, exact-case safe paths, and platform-neutral manifest checks.
- Added language previews and Windows, macOS, and Linux installation and manual visual-test instructions.
- Switched packaging to the installed local vsce tool and excluded macOS metadata from distribution.

## 0.1.0

- Added the initial Afterglow ’84 dark color theme.
- Added workbench, editor, terminal, Git, diff, notification, debug, and accessibility-focused states.
- Added TextMate and semantic token styling for the documented language set.
- Added an original pixel-sunset extension icon and local validation tooling.
