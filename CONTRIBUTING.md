# Contributing to Rustboom Login Helper

Thank you for taking the time to contribute. This is a small, focused project — contributions that keep it simple and auditable are most valued.

---

## Table of contents

- [Getting started](#getting-started)
- [Project structure](#project-structure)
- [Making changes](#making-changes)
- [Testing your changes](#testing-your-changes)
- [Submitting a pull request](#submitting-a-pull-request)
- [Reporting a bug](#reporting-a-bug)
- [Suggesting a feature](#suggesting-a-feature)

---

## Getting started

**Requirements:** [Node.js](https://nodejs.org/) 20+, [pnpm](https://pnpm.io/)

```bash
git clone https://github.com/RustBoom/rustboom-extension.git
cd rustboom-extension
pnpm build   # produces dist-chrome/ and dist-firefox/
```

No packages are installed — there are no runtime or build dependencies.

---

## Project structure

```
background.js          All extension logic (~100 lines)
rules.json             Single declarativeNetRequest rule
manifest.chrome.json   Chrome/Edge MV3 manifest
manifest.firefox.json  Firefox MV3 manifest
build.js               Build script (Node, no bundler)
icons/                 PNG icons: 16, 32, 48, 128 px
```

The entire network-interception logic lives in `background.js`. If you are auditing what the extension does, that file plus `rules.json` is everything.

---

## Making changes

### `background.js`

This is the core file. The two listener sections are intentionally kept separate and sequential — please preserve that clarity. Add comments for anything non-obvious.

### `rules.json`

Contains a single `declarativeNetRequest` rule. Any change here should be accompanied by an explanation of why the existing rule is insufficient.

### Manifests

Keep `manifest.chrome.json` and `manifest.firefox.json` in sync. The only intended differences are:
- `background.service_worker` (Chrome) vs `background.scripts` (Firefox)
- `browser_specific_settings.gecko` block (Firefox only)
- `minimum_chrome_version` (Chrome only)

### `build.js`

Plain Node ESM. No bundler, no transpilation. If you add a new file that must be distributed, add it to `SHARED_FILES` (or handle it explicitly like `icons/`).

---

## Testing your changes

There is no automated test suite — the extension's correctness depends on live network behavior with Facepunch's auth endpoint.

### Load unpacked in Chrome

```bash
pnpm build:chrome
```

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select `dist-chrome/`
4. After making a code change, click the **↺ reload** button on the extension card

### Load temporarily in Firefox

```bash
pnpm build:firefox
```

1. Open `about:debugging#/runtime/this-firefox`
2. **Load Temporary Add-on** → select `dist-firefox/manifest.json`
3. After a code change, click **Reload** on the add-on card

### End-to-end test

1. Open a fresh private/incognito window with the extension installed.
2. Go to `https://www.rustboom.gg` and click **Login with Steam**.
3. You should land on `/vending-machines?paired=1` without any Facepunch alert.
4. Check the service-worker console (Chrome: extension card → "service worker") for `[rustboom-ext]` log lines confirming both the capture and the forward steps ran.

**Negative test:** disable the extension and repeat — the Facepunch alert must reappear, confirming the extension is the only change.

---

## Submitting a pull request

1. Fork the repo and create a branch from `main`:
   ```bash
   git checkout -b fix/describe-your-change
   ```
2. Make your changes and test them (see above).
3. Keep the diff small and focused. One logical change per PR.
4. Update `README.md` if you change user-visible behavior or permissions.
5. Open a PR against `main`. In the description:
   - Explain **what** changed and **why**
   - Describe how you tested it (browser versions, steps followed)

PRs that add new host permissions or broaden the manifest's access scope will require a detailed justification.

---

## Reporting a bug

Open a [GitHub issue](https://github.com/RustBoom/rustboom-extension/issues) and include:

- Browser name and version
- Extension version (visible on `chrome://extensions` or `about:addons`)
- Steps to reproduce
- What you expected vs. what happened
- The service-worker console output (Chrome: extension card → "service worker"; Firefox: add-on card → "Inspect")

---

## Suggesting a feature

Open a [GitHub issue](https://github.com/RustBoom/rustboom-extension/issues) with the `enhancement` label. Please describe:

- The problem you are trying to solve
- Your proposed solution
- Any alternatives you considered

Note that the project intentionally stays minimal. Features that expand permissions or add complexity will need a strong justification.

---

## Code style

- Plain ES2022+ with no transpilation step
- 2-space indentation
- Prefer `const` over `let`; avoid `var`
- Descriptive variable names over terseness
- Comments on anything that is not immediately obvious

---

## License

By contributing you agree that your contributions will be licensed under the [MIT License](LICENSE).
