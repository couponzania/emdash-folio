# Changelog

Every change to Folio gets an entry and a version bump (semver). Version lives in `package.json` and `FOLIO_VERSION` in `src/index.ts`; keep them equal.

## 0.2.0 (2026-11-05)

- **Review snapshot** block (`folioSnapshot`): the verdict card at the top of a review, with what is reviewed and its type, the verdict, an overall score out of 10 (or the average of the score rows when left blank), key stats, score rows with bars, "Skip it if", the checked date with a note, and up to two links. Server rendered; stacks on phones.
- `snapshotReview()` builds the Review markup's own part from the same fields, so the schema can't disagree with the card. The site's `blog-schema.ts` now uses it, and no longer guesses a Review from `shr-verdict` markup and the post title.
- Buttons to `/go/` redirects or other sites get `rel="sponsored nofollow noopener noreferrer"`, as the site's own offer links do.
- Shared field helpers (`src/shared/fields.ts`) for text, safe links and repeater rows; the sale calendar uses them too.

## 0.1.0 (2026-11-05)

- First version: the package, its plugin registration, and the **Sale calendar** block (`folioSaleCalendar`). It replaces the WordPress `[czania_sale_calendar]` shortcode, which stopped running when the site moved to EmDash, with the same rules: next dates and status (Live now, Expected, Not announced) worked out on the server for the site's calendar day. Plain English windows ("16 Jul to 31 Jul", "around 25 Dec", "not regular: …") alongside the old formats.
