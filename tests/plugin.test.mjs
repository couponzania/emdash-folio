import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";

import { FOLIO_PLUGIN_ID, FOLIO_VERSION, folioPlugin, normalizeOptions } from "../src/plugin.js";
import { folioOptions, setFolioOptions } from "../src/shared/options.ts";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test("version: package.json, FOLIO_VERSION and the changelog agree", () => {
	assert.equal(FOLIO_VERSION, pkg.version);
	assert.match(readFileSync(new URL("../CHANGELOG.md", import.meta.url), "utf8"), new RegExp(`^## ${pkg.version.replaceAll(".", "\\.")} `, "m"));
});

test("folioPlugin: a native descriptor that points at the package's own entries", () => {
	const d = folioPlugin({ paidLinks: ["/go/"] });
	assert.deepEqual(d, {
		id: FOLIO_PLUGIN_ID,
		version: pkg.version,
		format: "native",
		entrypoint: "emdash-folio",
		componentsEntry: "emdash-folio/blocks",
		options: { paidLinks: ["/go/"] },
	});
	assert.ok(pkg.exports["."] && pkg.exports["./blocks"], "the descriptor's entries are exported");
	assert.deepEqual(folioPlugin().options, { paidLinks: [] });
});

test("normalizeOptions: keeps only non-empty string prefixes, trimmed", () => {
	assert.deepEqual(normalizeOptions({ paidLinks: [" /go/ ", "", 3, null, "https://"] }), { paidLinks: ["/go/", "https://"] });
	assert.deepEqual(normalizeOptions(null), { paidLinks: [] });
	assert.deepEqual(normalizeOptions({ paidLinks: "/go/" }), { paidLinks: [] });
});

test("site options: none until createPlugin sets them, then what the descriptor passed", async () => {
	setFolioOptions(undefined);
	assert.deepEqual(folioOptions(), { paidLinks: [] });
	setFolioOptions({ paidLinks: ["/go/"] });
	assert.deepEqual(folioOptions(), { paidLinks: ["/go/"] });
	setFolioOptions({});
});

test("styles: only --folio-* variables, no host site's token names", () => {
	const dir = new URL("../src/styles/", import.meta.url);
	for (const f of readdirSync(dir).filter((n) => n.endsWith(".css"))) {
		const css = readFileSync(new URL(f, dir), "utf8");
		const foreign = [...css.matchAll(/var\(\s*(--[a-z0-9-]+)/gi)].map((m) => m[1]).filter((v) => !v.startsWith("--folio-"));
		assert.deepEqual(foreign, [], `${f} reads ${foreign.join(", ")}`);
	}
});
