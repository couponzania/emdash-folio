# Changelog

Every change to Folio gets an entry and a version bump (semver). Version lives in `package.json` and `FOLIO_VERSION` in `src/index.ts`; keep them equal.

## 0.1.0 (2026-11-05)

- First version: the package, its plugin registration, and the **Sale calendar** block (`folioSaleCalendar`). It replaces the WordPress `[czania_sale_calendar]` shortcode, which stopped running when the site moved to EmDash, with the same rules: next dates and status (Live now, Expected, Not announced) worked out on the server for the site's calendar day. Plain English windows ("16 Jul to 31 Jul", "around 25 Dec", "not regular: …") alongside the old formats.
