# Grok Rate Limit Display

A userscript fork for displaying Grok rate limits directly on [grok.com](https://grok.com/).

This fork is based on [Grok Rate Limit Display](https://greasyfork.org/en/scripts/533963-grok-rate-limit-display), originally created by Blankspeaker and based on CursedAtom's Chrome extension work.

## Features

- Displays the current Grok quota in the input bar.
- Shows quota as `remaining/total`, for example `45/50`.
- Detects the selected Grok model instead of always falling back to Grok 3.
- Supports newer Grok model selector labels and localized UI labels.
- Fixes Auto mode showing `Unavailable` when Grok returns a single quota object.
- Adds a hover tooltip with:
  - Quota
  - Actual model code
  - Reset window/time
- Supports Grok's current `windowSizeSeconds` rate-limit field.

## Supported Models

The script includes model mappings for Grok's current web UI, including:

- Auto
- Fast
- Expert
- Heavy
- Grok 4
- Grok 4.2
- Grok 4.3 (beta)
- Grok 4.1
- Grok 4.1 Thinking
- Grok 3
- Grok 2
- Grok 2 Mini

Grok may change model names, model codes, or API responses at any time. If that happens, the script may need updates.

## Installation

Install with a userscript manager such as:

- [Tampermonkey](https://www.tampermonkey.net/)
- [Violentmonkey](https://violentmonkey.github.io/)

Then install the script from Greasy Fork:

[Grok Rate Limit Display](https://greasyfork.org/en/scripts/576845-grok-rate-limit-display)

## Usage

1. Open or refresh [grok.com](https://grok.com/).
2. The quota indicator appears near the model selector in the input bar.
3. Click the quota indicator to manually refresh rate-limit data.
4. Hover over the quota indicator to view:
   - Quota
   - Model code
   - Reset time/window

You must be logged in to Grok for the rate-limit endpoint to return account-specific quota information.

## Notes

This script reads the current page state and calls Grok's internal `/rest/rate-limits` endpoint with your existing logged-in session.

It does not send chat messages, modify conversations, or access unrelated websites.

Because it depends on Grok's web UI and internal API response format, it may break when Grok changes its frontend or rate-limit endpoint.

## Development

Run the syntax check:

```sh
node --check "Grok Rate Limit Display.user.js"
```

Run the local tests:

```sh
node test/getCurrentModelKey.test.js
```

## Attribution

Fork maintained by lqzone.

Original script:

- [Grok Rate Limit Display on Greasy Fork](https://greasyfork.org/en/scripts/533963-grok-rate-limit-display)
- Created by Blankspeaker
- Originally ported from CursedAtom's Chrome extension

## License

MIT
