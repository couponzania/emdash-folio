import assert from "node:assert/strict";
import { test } from "node:test";

import { calloutData } from "../src/callout/rules.ts";
import { metricsData } from "../src/metrics/rules.ts";
import { lines } from "../src/shared/fields.ts";
import { parseGrid } from "../src/shared/grid.ts";
import { timelineData } from "../src/timeline/rules.ts";
import { tldrData } from "../src/tldr/rules.ts";
import { verdictData } from "../src/verdict/rules.ts";

test("lines: one item per line, blanks and typed bullets dropped, capped", () => {
	assert.deepEqual(lines("- one\n\n• two\r\n3. three\n  * four  "), ["one", "two", "three", "four"]);
	assert.deepEqual(lines("a\nb\nc", 2), ["a", "b"]);
	assert.deepEqual(lines(undefined), []);
	assert.deepEqual(lines("-5% off is real"), ["-5% off is real"], "a dash with no space is content, not a bullet");
});

test("parseGrid: cells in order, with tabs, semicolons, quotes and blank lines", () => {
	assert.deepEqual(parseGrid("a,b\n1,2\n"), [["a", "b"], ["1", "2"]]);
	assert.deepEqual(parseGrid("a\tb\r\n\r\n1\t2"), [["a", "b"], ["1", "2"]]);
	assert.deepEqual(parseGrid("a;b\n1;2"), [["a", "b"], ["1", "2"]]);
	assert.deepEqual(parseGrid('n,v\n"Chat, email",1'), [["n", "v"], ["Chat, email", "1"]]);
	assert.deepEqual(parseGrid("  \n"), []);
});

test("tldrData: default title, points capped at six", () => {
	assert.deepEqual(tldrData({ points: "a\nb" }), { title: "The short version", points: ["a", "b"] });
	assert.equal(tldrData({ title: "In short", points: "1\n2\n3\n4\n5\n6\n7" }).points.length, 6);
	assert.equal(tldrData({ title: " Key points " }).title, "Key points");
});

test("calloutData: three kinds with default titles; unknown kinds are tips", () => {
	assert.deepEqual(calloutData({ kind: "warning", text: "Careful" }), { kind: "warning", title: "Watch out", icon: "!", text: "Careful" });
	assert.equal(calloutData({ kind: "insight", text: "x" }).title, "What we found");
	assert.equal(calloutData({ kind: "<script>", text: "x" }).kind, "tip");
	assert.equal(calloutData({ kind: "toString", text: "x" }).kind, "tip", "inherited object keys are not kinds");
	assert.equal(calloutData({ kind: "tip", title: "Pro tip", text: "x" }).title, "Pro tip");
});

test("metricsData: cards need a number and a label; at most four; source only with a name", () => {
	const d = metricsData({
		cards: [
			{ value: "88%", label: "Used a coupon", context: "last year" },
			{ value: "", label: "No number" },
			{ value: "5", label: "" },
			{ value: "1", label: "a" },
			{ value: "2", label: "b" },
			{ value: "3", label: "c" },
			{ value: "4", label: "d" },
		],
		sourceName: "Survey",
		sourceLink: "javascript:alert(1)",
	});
	assert.equal(d.cards.length, 4);
	assert.deepEqual(d.cards[0], { value: "88%", label: "Used a coupon", context: "last year" });
	assert.deepEqual(d.source, { name: "Survey" }, "an unsafe link is dropped, the name kept");
	assert.equal(metricsData({ cards: [], sourceLink: "https://x.com" }).source, undefined);
	assert.deepEqual(metricsData({ sourceName: "S", sourceLink: "https://x.com/a" }).source, { name: "S", href: "https://x.com/a" });
});

test("timelineData: kept in the order typed; an event needs a date and a title", () => {
	const d = timelineData({
		events: [
			{ date: "Nov 2025", title: "Later first", text: "" },
			{ date: "Jul 2025", title: "Earlier" },
			{ date: "", title: "No date" },
			{ date: "2024", title: "" },
		],
	});
	assert.deepEqual(
		d.events.map((e) => e.title),
		["Later first", "Earlier"],
	);
	assert.equal(d.title, "");
});

test("verdictData: label defaults; the rest as typed", () => {
	assert.deepEqual(verdictData({ pick: " A ", why: "b", catch: "c" }), { kicker: "Our verdict", pick: "A", why: "b", catch: "c" });
	assert.equal(verdictData({ kicker: "Our pick" }).kicker, "Our pick");
	assert.equal(verdictData({}).pick, "");
});
