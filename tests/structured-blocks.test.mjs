import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { audienceData, chooseData } from "../src/choose/rules.ts";
import { prosConsData } from "../src/pros-cons/rules.ts";
import { minutesIso, minutesText, parseMinutes, stepsData, stepsHowTo } from "../src/steps/rules.ts";
import { MAX_TABLE_COLUMNS, tableModel } from "../src/table/rules.ts";

test("parseMinutes: whole minutes from 1 to a week only", () => {
	assert.equal(parseMinutes("2"), 2);
	assert.equal(parseMinutes(" 90 "), 90);
	for (const bad of ["0", "-3", "1.5", "2 min", "", "10081", null]) assert.equal(parseMinutes(bad), null, String(bad));
});

test("minutes as words and as ISO 8601", () => {
	assert.equal(minutesText(1), "about 1 minute");
	assert.equal(minutesText(2), "about 2 minutes");
	assert.equal(minutesText(60), "about 1 hour");
	assert.equal(minutesText(150), "about 2 hours 30 minutes");
	assert.equal(minutesIso(2), "PT2M");
	assert.equal(minutesIso(60), "PT1H");
	assert.equal(minutesIso(90), "PT1H30M");
});

test("stepsData: empty steps dropped, order kept, time text", () => {
	const d = stepsData({ title: "How to", minutes: "2", steps: [{ name: "Copy", text: "Tap copy" }, { name: "", text: "" }, { text: "Paste it" }] });
	assert.deepEqual(d.steps, [
		{ name: "Copy", text: "Tap copy" },
		{ name: "", text: "Paste it" },
	]);
	assert.equal(d.timeText, "about 2 minutes");
	assert.equal(stepsData({ steps: [] }).timeText, "");
});

test("stepsHowTo: HowTo from the same fields; none without a title or 2 steps", () => {
	const node = { title: "How to apply a coupon code", minutes: "2", steps: [{ name: "Copy the code", text: "Tap Copy." }, { text: "Paste at checkout." }] };
	assert.deepEqual(stepsHowTo(node), {
		"@type": "HowTo",
		name: "How to apply a coupon code",
		totalTime: "PT2M",
		step: [
			{ "@type": "HowToStep", position: 1, name: "Copy the code", text: "Tap Copy." },
			{ "@type": "HowToStep", position: 2, name: "Paste at checkout.", text: "Paste at checkout." },
		],
	});
	assert.equal("totalTime" in stepsHowTo({ ...node, minutes: "" }), false);
	assert.equal(stepsHowTo({ ...node, title: "" }), null);
	assert.equal(stepsHowTo({ ...node, steps: [{ name: "Only one" }] }), null);
});

test("tableModel: header, row names, cells padded, highlighted column by name", () => {
	const t = tableModel({ data: "Plan,Starter,Business\nPrice,$9,$29\nSites,1", pick: "business", caption: " Checked Nov 2026. " });
	assert.equal(t.ok, true);
	assert.deepEqual(t.head, ["Plan", "Starter", "Business"]);
	assert.deepEqual(t.rows, [
		{ name: "Price", cells: ["$9", "$29"] },
		{ name: "Sites", cells: ["1", ""] },
	]);
	assert.equal(t.pick, 2);
	assert.equal(t.caption, "Checked Nov 2026.");
	assert.equal(tableModel({ data: "Plan,A\nx,1", pick: "Plan" }).pick, -1, "the row names column is never the pick");
	assert.equal(tableModel({ data: "Plan,A\nx,1", pick: "Nope" }).pick, -1);
});

test("tableModel: says why a table can't be shown", () => {
	assert.match(tableModel({ data: "" }).reason, /header row/);
	assert.match(tableModel({ data: "Only\nx" }).reason, /2 columns/);
	const wide = Array.from({ length: MAX_TABLE_COLUMNS + 1 }, (_, i) => `c${i}`).join(",");
	assert.match(tableModel({ data: `${wide}\n${wide}` }).reason, /6 columns/);
	const tall = ["a,b", ...Array.from({ length: 51 }, () => "x,1")].join("\n");
	assert.match(tableModel({ data: tall }).reason, /51 rows/);
});

test("prosConsData: shown only with both lists; default headings", () => {
	const d = prosConsData({ pros: "Fast\nCheap", cons: "No phone support" });
	assert.equal(d.show, true);
	assert.equal(d.prosTitle, "What's good");
	assert.equal(d.consTitle, "What's not");
	assert.equal(prosConsData({ pros: "Fast" }).show, false);
	assert.equal(prosConsData({ pros: "a", cons: "b", prosTitle: "Liked" }).prosTitle, "Liked");
});

test("chooseData and audienceData: both cards required; headings from the names", () => {
	const c = chooseData({ aName: "Store A", aReasons: "Small orders", bName: "Store B", bReasons: "Big items" });
	assert.equal(c.show, true);
	assert.equal(c.first.title, "Choose Store A if");
	assert.deepEqual(c.second.items, ["Big items"]);
	assert.equal(chooseData({ aName: "A", aReasons: "x", bName: "B" }).show, false);
	assert.equal(chooseData({ aReasons: "x", bReasons: "y" }).first.title, "", "no name, no heading");

	const a = audienceData({ forList: "Small sites", notList: "Root access fans" });
	assert.equal(a.show, true);
	assert.deepEqual([a.first.title, a.second.title], ["Good for", "Not for"]);
	assert.equal(audienceData({ forList: "Small sites" }).show, false, "a 'not for' list is required");
});

test("every block is registered in the editor and has a renderer", () => {
	const index = readFileSync(new URL("../src/index.ts", import.meta.url), "utf8");
	const blocks = readFileSync(new URL("../src/blocks.ts", import.meta.url), "utf8");
	const names = ["tldr", "steps", "callout", "metrics", "chart", "table", "timeline", "prosCons", "verdict", "choose", "audience", "snapshot", "saleCalendar"];
	for (const n of names) assert.match(index, new RegExp(`\\b${n}Block,`), `${n} in portableTextBlocks`);
	for (const t of ["TLDR", "STEPS", "CALLOUT", "METRICS", "CHART", "TABLE", "TIMELINE", "PROS_CONS", "VERDICT", "CHOOSE", "AUDIENCE", "SNAPSHOT", "SALE_CALENDAR"])
		assert.match(blocks, new RegExp(`\\[${t}_TYPE\\]:`), `${t} has a component`);
});
