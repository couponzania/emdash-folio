# Folio

Article blocks for EmDash. Each block is an editor block with fields (typed in the admin, never pasted HTML), rendered on the server as plain HTML, so readers, Google and AI crawlers all get the content without scripts.

Folio is CouponZania's own package, kept inside the site's repo at `emdash/packages/folio` so a change ships in one commit and one Deploy run. It is written to stand alone so it can move to its own repository later.

## Rules

- **One direction only.** The site imports from Folio; nothing in Folio imports from the site's `src/`. Folio may use EmDash's public API (`emdash`).
- **Styling through variables.** Every colour and size is a `--folio-*` variable that falls back to the site's `--cz-*` token, then to a plain value. Classes are `folio-*`. Light only.
- **Server rendered, no client script** unless a block truly needs one.
- **Schema from fields.** When a block carries structured data, it is built from the block's fields, never by reading HTML.
- **Tested.** Pure rules live in `rules.ts` files with tests in `tests/`; they run in the site's `npm test`, so a broken block stops the deploy.
- **Versioned.** Every change bumps the version and adds a `CHANGELOG.md` entry.

## Setup

Registered in `emdash/astro.config.mjs` as a native plugin:

```js
{
  id: "folio",
  version: "0.1.0",
  entrypoint: ".../packages/folio/src/index.ts",
  componentsEntry: ".../packages/folio/src/blocks.ts",
}
```

## Blocks

### Sale calendar (`folioSaleCalendar`)

A brand's sales in calendar order. Each row stores a recurring window; the next dates and status are worked out for the site's calendar day (EmDash's timezone setting) when the page renders, so the table rolls into next year by itself.

| Field | Notes |
|---|---|
| Sale name | Required; a row without one is skipped. |
| Usually runs | `16 Jul to 31 Jul` (a fixed window; may cross new year, `20 Dec to 5 Jan`), `around 25 Dec` (always Expected, never Live), or `not regular: {text}` (shown as is; next dates read Not announced). The old shortcode formats `07-16..07-31`, `~12-25` and `none: {text}` also work. Anything else is shown as text, never guessed. |
| Best for | One short phrase under the name. |
| Link | Optional: `#anchor`, `/path` or `https://…`. Anything else is dropped. |

Status: **Live now** inside a fixed window, **Expected** before it (or for an "around" day), **Not announced** with no regular window. 29 Feb becomes 28 Feb outside leap years. Pages are cached for up to a day, so a status can lag by that much.

Wide screens get a table; phones get one card per sale, with no sideways scroll.
