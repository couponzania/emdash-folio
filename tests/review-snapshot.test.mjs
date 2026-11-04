import assert from "node:assert/strict";
import { test } from "node:test";

import { parseScore, snapshotData, snapshotReview } from "../src/review-snapshot/rules.ts";

const node = (over = {}) => ({
	_type: "folioSnapshot",
	_key: "k1",
	itemName: "ScalaHosting",
	itemType: "Organization",
	verdict: "ScalaHosting is the best performance per dollar VPS host for WooCommerce stores.",
	score: "8.7",
	stats: [
		{ value: "$44.95", label: "per month" },
		{ value: "28ms", label: "avg TTFB" },
		{ value: "", label: "dropped, no value" },
	],
	scores: [
		{ label: "Raw performance", score: 9.8 },
		{ label: "Renewal pricing", score: "7.2/10" },
		{ label: "Broken", score: "eleven" },
	],
	skip: "you run a personal blog with no revenue.",
	checked: "September 2026",
	note: "30 day money back",
	ctaLabel: "Check Current Price",
	ctaLink: "/go/scala-hosting",
	moreLabel: "See all plans",
	moreLink: "javascript:alert(1)",
	...over,
});

test("parseScore: numbers and 'n/10' text on a 0 to 10 scale, one decimal, else null", () => {
	assert.equal(parseScore(8.74), 8.7);
	assert.equal(parseScore("9"), 9);
	assert.equal(parseScore(" 7.2/10 "), 7.2);
	assert.equal(parseScore("0"), 0);
	assert.equal(parseScore("10.5"), null);
	assert.equal(parseScore("-1"), null);
	assert.equal(parseScore("eleven"), null);
	assert.equal(parseScore(""), null);
	assert.equal(parseScore(undefined), null);
});

test("snapshotData: keeps complete stats and scores, drops unsafe links", () => {
	const d = snapshotData(node());
	assert.equal(d.verdict, "ScalaHosting is the best performance per dollar VPS host for WooCommerce stores.");
	assert.equal(d.score, 8.7);
	assert.equal(d.scoreText, "8.7");
	assert.deepEqual(d.stats, [
		{ value: "$44.95", label: "per month" },
		{ value: "28ms", label: "avg TTFB" },
	]);
	assert.deepEqual(d.scores, [
		{ label: "Raw performance", score: 9.8, text: "9.8", percent: 98 },
		{ label: "Renewal pricing", score: 7.2, text: "7.2", percent: 72 },
	]);
	assert.deepEqual(d.cta, { label: "Check Current Price", href: "/go/scala-hosting" });
	assert.equal(d.more, null);
	assert.equal(d.checked, "September 2026");
});

test("snapshotData: with no overall score, the score rows' average stands in", () => {
	assert.equal(snapshotData(node({ score: "" })).score, 8.5);
	assert.equal(snapshotData(node({ score: "", scores: [] })).score, null);
});

test("snapshotData: whole scores print without a decimal", () => {
	const d = snapshotData(node({ score: 9, scores: [{ label: "Pricing", score: "9" }] }));
	assert.equal(d.scoreText, "9");
	assert.equal(d.scores[0].text, "9");
});

test("snapshotData: an unknown item type falls back to Organization", () => {
	assert.equal(snapshotData(node({ itemType: "Hotel" })).itemType, "Organization");
	assert.equal(snapshotData(node({ itemType: "SoftwareApplication" })).itemType, "SoftwareApplication");
});

test("snapshotReview: Review markup from the block's own fields", () => {
	assert.deepEqual(snapshotReview(node()), {
		itemReviewed: { "@type": "Organization", name: "ScalaHosting" },
		reviewRating: { "@type": "Rating", ratingValue: 8.7, bestRating: 10, worstRating: 0 },
		reviewBody: "ScalaHosting is the best performance per dollar VPS host for WooCommerce stores.",
	});
});

test("snapshotReview: nothing without a reviewed item's name or a score", () => {
	assert.equal(snapshotReview(node({ itemName: " " })), null);
	assert.equal(snapshotReview(node({ score: "", scores: [] })), null);
});

test("buttonRel: /go/ redirects and other sites are paid links; page anchors and paths are not", async () => {
	const { buttonRel } = await import("../src/shared/fields.ts");
	assert.equal(buttonRel("/go/scala-hosting"), "sponsored nofollow noopener noreferrer");
	assert.equal(buttonRel("https://example.com"), "sponsored nofollow noopener noreferrer");
	assert.equal(buttonRel("/stores/scalahosting.com"), undefined);
	assert.equal(buttonRel("#pricing"), undefined);
});
