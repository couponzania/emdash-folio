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
  version: "0.3.0",
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

### Review snapshot (`folioSnapshot`)

The verdict card right after a review's intro. Its fields also make the page's Review markup (`snapshotReview()`, used by the site's `blog-schema.ts`), so the card and the schema always agree.

| Field | Notes |
|---|---|
| What is reviewed | The name in the Review markup (`itemReviewed.name`). No name, no Review markup. |
| It is a | Store, brand or company (`Organization`), Product, or Software or app (`SoftwareApplication`). |
| Verdict | One sentence that names the item; it stands alone if a search result lifts it. Also the Review's `reviewBody`. |
| Overall score | Out of 10, one decimal. Blank: the average of the score rows. Outside 0 to 10: ignored. |
| Key stats | 3 or 4 value and label pairs. A row missing either half is skipped. |
| Score rows | 2 to 4 criteria with a score out of 10 ("9.7" or "9.7/10"). The bars are drawn from the score. |
| Skip it if | A real, specific disqualifier from the review. |
| Checked, note | "November 2026", and an optional note such as "30 day money back". |
| Main button, second link | Optional label and link pairs (`#anchor`, `/path` or `https://…`). Links to `/go/` redirects or other sites get `rel="sponsored nofollow noopener noreferrer"`. |

Review markup: `itemReviewed` (type and name), `reviewRating` (the overall score, best 10, worst 0) and `reviewBody`; the site adds the review's id, url, author, publisher and dates. Whether Google shows review stars is Google's call; don't promise them.

### Chart (`folioChart`)

Bar, line and donut charts from pasted data, drawn on the server by Folio itself (no chart library). Every chart carries its description for screen readers, a data table behind a "Data table" toggle, an optional note and a linked source.

| Field | Notes |
|---|---|
| Chart | **Bars** to compare or rank amounts (horizontal, so labels stay readable on phones; values from zero up), **Line** for change over time, **Donut** for parts of one whole (up to 6 slices, no negatives). |
| Title | Shown above the chart. |
| What it shows | Required. One sentence with the finding; screen readers read it as the chart. |
| Data | CSV, tab separated (pasted from a spreadsheet) or semicolon separated. The first row names the columns. Values may carry thousands separators, a leading currency sign or a trailing %. Up to 500 rows. |
| Column for the labels / along the bottom | The x column, matched without regard to case. On a line, numbers (years) are spaced by value, text evenly in row order. |
| Column of values | Must be numbers. Lines allow empty cells (a gap); bars and donuts don't. |
| Series column | Optional: up to 4 series for bars (grouped), 6 for lines. |
| Unit | `%`, a currency sign (`$`, `₹`, `€`, `£`, `¥`) or a word (`million`). |
| Note, source, source link | Under the chart. Every chart of real data should name its source and date. |

A chart that can't be drawn shows a short note saying why, and logs it. Layout comes from fixed formulas in `src/chart/rules.ts` (nice axis ticks, bar widths, line positions on a 1000 by 1000 plot, donut arcs), all tested.
