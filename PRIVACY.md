# Privacy Policy — RustBoom Login Helper

**Last updated: 2026-05-26**

## Overview

RustBoom Login Helper is a browser extension that completes the Steam login flow for [rustboom.gg](https://rustboom.gg). This policy describes what data the extension does and does not handle.

## Data Collection

This extension collects **no user data**. It does not collect, store, log, or transmit:

- Personally identifiable information (name, email, address, etc.)
- Authentication credentials (passwords, PINs, security questions)
- Financial or payment information
- Health information
- Personal communications
- Location data
- Browsing history
- User activity (clicks, keystrokes, mouse movements)
- Website content

## How the Extension Works

The extension operates entirely on `companion-rust.facepunch.com`. When you sign in with Steam on rustboom.gg:

1. It rewrites the `returnUrl` parameter on the Facepunch login request to a scheme that Facepunch accepts.
2. It reads the `Location` header from Facepunch's redirect response to extract the login token.
3. It navigates your browser tab to the rustboom.gg callback URL with the token appended.

The login token is handled transiently in memory during this process and is never stored, logged, or sent to any party other than rustboom.gg.

## Third Parties

This extension does not share any data with third parties. It has no analytics, telemetry, crash reporting, or advertising components.

## Remote Code

This extension does not load or execute any remote code. All logic is bundled locally in the extension package.

## Open Source

This extension is fully open source. You can review every line of code at:
[https://github.com/RustBoom/rustboom-extension](https://github.com/RustBoom/rustboom-extension)

## Contact

For questions or concerns, contact [support@rustboom.gg](mailto:support@rustboom.gg) or open an issue on [GitHub](https://github.com/RustBoom/rustboom-extension/issues).
