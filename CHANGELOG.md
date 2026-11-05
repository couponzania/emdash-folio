# Changelog

Every change to Folio gets an entry and a version bump (semver), released as a `v{version}` tag. The version lives in `package.json` and `FOLIO_VERSION` in `src/plugin.js`; a test fails if they or this file disagree.

## 0.4.0 (2026-11-05)

- Folio moves to its own repository (`couponzania/emdash-folio`, MIT licence) with its own tests, type check and CI. History from the site's `emdash/packages/folio` is kept.
- **`folioPlugin(options)`** (`emdash-folio/plugin`): the plugin descriptor, so a site registers Folio by package name (`entrypoint: "emdash-folio"`, `componentsEntry: "emdash-folio/blocks"`) instead of file paths. Plain JavaScript, so the Astro config can import it from `node_modules`.
- **`paidLinks` option** (breaking): which link prefixes count as paid links. A snapshot button under one gets `rel="sponsored nofollow noopener noreferrer"`. Default: none (before, `/go/` and every other site were always paid). To keep the old behaviour, pass `paidLinks: ["/go/", "http://", "https://"]`.
- New entry `emdash-folio/review-snapshot` (`SNAPSHOT_TYPE`, `snapshotReview()`, `snapshotData()`, `parseScore()`) for building Review markup, and `emdash-folio/styles.css`.
- The default `--folio-*` variables sit under `:where(.folio)`, so a site overrides one with a plain `.folio { … }` rule. Nothing looks different.
- The snapshot button link placeholder no longer names a site path.

## 0.3.0 (2026-11-05)

- **Chart** block (`folioChart`): bar, line and donut charts from pasted data (CSV, tabs from a spreadsheet, or semicolons), drawn on the server with Folio's own code, no chart library. Bars are HTML rows (labels never shrink on phones); a line is an SVG plot stretched to its box with HTML axis labels and points over it; a donut is SVG arcs from fixed geometry with the largest share in the centre. Every chart has its description for screen readers, a data table, an optional note and a linked source. A chart that can't be drawn shows why (missing column, a value that isn't a number, a negative bar, more than six slices).
- Series colours: the brand blue, then Okabe and Ito's colour-blind-safe palette (`--folio-series-1` to `-6`).

## 0.2.0 (2026-11-05)

- **Review snapshot** block (`folioSnapshot`): the verdict card at the top of a review, with what is reviewed and its type, the verdict, an overall score out of 10 (or the average of the score rows when left blank), key stats, score rows with bars, "Skip it if", the checked date with a note, and up to two links. Server rendered; stacks on phones.
- `snapshotReview()` builds the Review markup's own part from the same fields, so the schema can't disagree with the card. The site's `blog-schema.ts` now uses it, and no longer guesses a Review from `shr-verdict` markup and the post title.
- Buttons to `/go/` redirects or other sites get `rel="sponsored nofollow noopener noreferrer"`, as the site's own offer links do.
- Shared field helpers (`src/shared/fields.ts`) for text, safe links and repeater rows; the sale calendar uses them too.

## 0.1.0 (2026-11-05)

- First version: the package, its plugin registration, and the **Sale calendar** block (`folioSaleCalendar`). It replaces the WordPress `[czania_sale_calendar]` shortcode, which stopped running when the site moved to EmDash, with the same rules: next dates and status (Live now, Expected, Not announced) worked out on the server for the site's calendar day. Plain English windows ("16 Jul to 31 Jul", "around 25 Dec", "not regular: …") alongside the old formats.
