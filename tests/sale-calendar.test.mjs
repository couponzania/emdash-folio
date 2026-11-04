import assert from "node:assert/strict";
import { test } from "node:test";

import { nextLabel, nextRun, parseWhen, saleCalendarRows, todayIn, usualLabel } from "../src/sale-calendar/rules.ts";

const day = (y, m, d) => ({ y, m, d });

test("parseWhen: plain English windows", () => {
	assert.deepEqual(parseWhen("16 Jul to 31 Jul"), { type: "fixed", sm: 7, sd: 16, em: 7, ed: 31 });
	assert.deepEqual(parseWhen("20 December to 5 January"), { type: "fixed", sm: 12, sd: 20, em: 1, ed: 5 });
	assert.deepEqual(parseWhen("around 25 Dec"), { type: "around", m: 12, d: 25 });
	assert.deepEqual(parseWhen("Around 26 Jan."), { type: "around", m: 1, d: 26 });
	assert.deepEqual(parseWhen("not regular: Around Diwali (seen 2020)"), { type: "none", text: "Around Diwali (seen 2020)" });
});

test("parseWhen: the old shortcode formats still read", () => {
	assert.deepEqual(parseWhen("07-16..07-31"), { type: "fixed", sm: 7, sd: 16, em: 7, ed: 31 });
	assert.deepEqual(parseWhen("~12-25"), { type: "around", m: 12, d: 25 });
	assert.deepEqual(parseWhen("none: Late Nov to early Dec (seen 2025)"), { type: "none", text: "Late Nov to early Dec (seen 2025)" });
});

test("parseWhen: anything it can't read is kept as text, never guessed", () => {
	assert.deepEqual(parseWhen("31 Feb to 3 Mar"), { type: "none", text: "31 Feb to 3 Mar" });
	assert.deepEqual(parseWhen("May"), { type: "none", text: "May" });
	assert.deepEqual(parseWhen(""), { type: "none", text: "" });
});

test("nextRun: a fixed window is expected before it, live inside it, and rolls to next year after it", () => {
	const w = parseWhen("16 Jul to 31 Jul");
	assert.deepEqual(nextRun(w, day(2026, 7, 1)), { status: "expected", start: day(2026, 7, 16), end: day(2026, 7, 31) });
	assert.deepEqual(nextRun(w, day(2026, 7, 16)), { status: "live", start: day(2026, 7, 16), end: day(2026, 7, 31) });
	assert.deepEqual(nextRun(w, day(2026, 7, 31)), { status: "live", start: day(2026, 7, 16), end: day(2026, 7, 31) });
	assert.deepEqual(nextRun(w, day(2026, 8, 1)), { status: "expected", start: day(2027, 7, 16), end: day(2027, 7, 31) });
});

test("nextRun: a window across new year is still live in January", () => {
	const w = parseWhen("20 Dec to 5 Jan");
	assert.deepEqual(nextRun(w, day(2027, 1, 3)), { status: "live", start: day(2026, 12, 20), end: day(2027, 1, 5) });
	assert.deepEqual(nextRun(w, day(2027, 1, 6)), { status: "expected", start: day(2027, 12, 20), end: day(2028, 1, 5) });
});

test("nextRun: around a day is always expected, never live", () => {
	const w = parseWhen("around 25 Dec");
	assert.deepEqual(nextRun(w, day(2026, 12, 25)), { status: "expected", start: day(2026, 12, 25), end: day(2026, 12, 25) });
	assert.deepEqual(nextRun(w, day(2026, 12, 26)), { status: "expected", start: day(2027, 12, 25), end: day(2027, 12, 25) });
});

test("nextRun: 29 Feb falls back to 28 Feb outside leap years", () => {
	assert.deepEqual(nextRun(parseWhen("around 29 Feb"), day(2027, 1, 1)).start, day(2027, 2, 28));
	assert.deepEqual(nextRun(parseWhen("around 29 Feb"), day(2028, 1, 1)).start, day(2028, 2, 29));
});

test("nextRun: no regular window means not announced", () => {
	assert.deepEqual(nextRun(parseWhen("not regular: Around Diwali"), day(2026, 1, 1)), { status: "none" });
});

test("labels read like the old table", () => {
	assert.equal(usualLabel(parseWhen("07-16..07-31")), "16 Jul to 31 Jul");
	assert.equal(usualLabel(parseWhen("~12-25")), "Around 25 Dec");
	assert.equal(usualLabel(parseWhen("none: Around Diwali (seen 2020)")), "Around Diwali (seen 2020)");
	assert.equal(usualLabel(parseWhen("none")), "No fixed window yet");
	assert.equal(nextLabel({ status: "none" }), "Not announced");
	assert.equal(nextLabel({ status: "expected", start: day(2026, 12, 25), end: day(2026, 12, 25) }), "Around 25 Dec 2026");
	assert.equal(nextLabel({ status: "live", start: day(2026, 7, 16), end: day(2026, 7, 31) }), "16 Jul to 31 Jul 2026");
	assert.equal(nextLabel({ status: "expected", start: day(2026, 12, 20), end: day(2027, 1, 5) }), "20 Dec 2026 to 5 Jan 2027");
});

test("saleCalendarRows: keeps the author's order, skips rows with no name, and only keeps safe links", () => {
	const node = {
		_type: "folioSaleCalendar",
		rows: [
			{ name: "Back to School", when: "16 Jul to 31 Jul", bestFor: "Student laptops", link: "#back-to-school-sale" },
			{ name: "", when: "around 1 Jan", bestFor: "x" },
			{ name: "Black Friday", when: "not regular: Late Nov (seen 2025)", bestFor: "Sitewide", link: "javascript:alert(1)" },
			{ name: "Christmas", when: "around 25 Dec", bestFor: "Cashback", link: "https://example.com/x" },
		],
	};
	const rows = saleCalendarRows(node, day(2026, 11, 5));
	assert.deepEqual(
		rows.map((r) => [r.name, r.href, r.usual, r.next, r.status, r.statusLabel]),
		[
			["Back to School", "#back-to-school-sale", "16 Jul to 31 Jul", "16 Jul to 31 Jul 2027", "expected", "Expected"],
			["Black Friday", "", "Late Nov (seen 2025)", "Not announced", "none", "Not announced"],
			["Christmas", "https://example.com/x", "Around 25 Dec", "Around 25 Dec 2026", "expected", "Expected"],
		],
	);
	assert.deepEqual(saleCalendarRows({ _type: "folioSaleCalendar" }, day(2026, 1, 1)), []);
});

test("todayIn: the calendar day in the site's timezone", () => {
	const at = Date.UTC(2026, 10, 4, 20, 0); // 4 Nov 20:00 UTC is 5 Nov 01:30 in Kolkata
	assert.deepEqual(todayIn("Asia/Kolkata", at), day(2026, 11, 5));
	assert.deepEqual(todayIn("UTC", at), day(2026, 11, 4));
	assert.deepEqual(todayIn("Not/AZone", at), day(2026, 11, 4));
});
