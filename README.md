# Folio

Article blocks for EmDash. Each block is an editor block with fields (typed in the admin, never pasted HTML), rendered on the server as plain HTML, so readers, Google and AI crawlers all get the content without scripts.

Built for and used on [couponzania.com](https://couponzania.com). MIT licensed.

## Install

Folio ships its TypeScript and Astro source (no build step); the site's Astro build compiles it. Install a release tag from GitHub:

```sh
npm install github:couponzania/emdash-folio#v0.4.0
```

Then register it in `astro.config.mjs`:

```js
import emdash from "emdash/astro";
import { folioPlugin } from "emdash-folio/plugin";

emdash({
  plugins: [
    folioPlugin({
      // Optional: link prefixes that are paid or affiliate links. Snapshot buttons under
      // one get rel="sponsored nofollow noopener noreferrer". Default: none.
      paidLinks: ["/go/"],
    }),
  ],
});
```

The blocks then appear in the editor's slash menu, and every `<PortableText>` renders them.

Requires `astro` 7.3 or later and `emdash` 1.4 or later (peer dependencies).

### Styling

Every colour, radius and shadow is a `--folio-*` variable (classes are `folio-*`). Defaults sit under `:where(.folio)`, so a site sets its own with a plain rule:

```css
.folio {
  --folio-accent: #0071e3;
  --folio-radius: 8px;
}
```

Each default first tries a `--cz-*` token (the names of the site Folio was built for), then a plain value. Light only.

### Review markup

A review page can build its Review JSON-LD from the snapshot block's fields, so the card and the schema always agree:

```ts
import { SNAPSHOT_TYPE, snapshotReview } from "emdash-folio/review-snapshot";

const node = body.find((b) => b._type === SNAPSHOT_TYPE);
const review = node ? snapshotReview(node) : null; // add @id, url, author, publisher, dates
```

## Rules for working on Folio

- **One direction only.** Nothing in Folio imports from a host site. Folio may use EmDash's public API (`emdash`).
- **Styling through variables**, as above.
- **Server rendered, no client script** unless a block truly needs one.
- **Schema from fields.** When a block carries structured data, it is built from the block's fields, never by reading HTML.
- **Tested.** Pure rules live in `rules.ts` files with tests in `tests/` (`npm test`, Node's own test runner). `npm run typecheck` runs `astro check`. CI runs both on every push and pull request.
- **Versioned.** Every change bumps the version (semver) in `package.json` and `FOLIO_VERSION` in `src/plugin.js`, adds a `CHANGELOG.md` entry, and is released as a `v{version}` tag. Sites pin a tag.

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
| Main button, second link | Optional label and link pairs (`#anchor`, `/path` or `https://…`). Links under a `paidLinks` prefix get `rel="sponsored nofollow noopener noreferrer"`. |

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
