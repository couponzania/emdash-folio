import assert from "node:assert/strict";
import { test } from "node:test";

import { areaModel, columnModel, compareModel, MAX_COLUMNS, stackModel } from "../src/chart/more-rules.ts";
import { chartSpec } from "../src/chart/rules.ts";

const spec = (over) => {
	const s = chartSpec({ _type: "folioChart", _key: "k", description: "What it shows.", ...over });
	assert.equal(s.ok, true, s.reason);
	return s;
};

test("chartSpec: knows the new kinds and the stack mode", () => {
	for (const kind of ["column", "stacked", "area", "compare"]) assert.equal(spec({ kind, data: "a,b\nx,1", x: "a", y: "b" }).kind, kind);
	assert.equal(spec({ kind: "stacked", data: "a,b\nx,1", x: "a", y: "b", stackMode: "share" }).stackMode, "share");
	assert.equal(spec({ kind: "stacked", data: "a,b\nx,1", x: "a", y: "b", stackMode: "nonsense" }).stackMode, "total");
	assert.equal(spec({ kind: "area", data: "Year,v\n2024,1\n2026,2", x: "year", y: "v" }).rows[0].Year, 2024, "area years are numbers, like a line");
});

test("columnModel: heights from zero on nice ticks, values as text", () => {
	const m = columnModel(spec({ kind: "column", data: "Year,Users\n2021,120\n2025,190", x: "year", y: "users" }));
	assert.equal(m.ok, true);
	assert.deepEqual(
		m.yTicks.map((t) => [t.value, t.percent]),
		[
			[0, 100],
			[50, 75],
			[100, 50],
			[150, 25],
			[200, 0],
		],
	);
	assert.deepEqual(
		m.columns.map((c) => [c.label, c.percent, c.text]),
		[
			["2021", 60],
			["2025", 95],
		].map(([l, p]) => [l, p, l === "2021" ? "120" : "190"]),
	);
	const word = columnModel(spec({ kind: "column", data: "Y,v\n1,5", x: "y", y: "v", yUnit: "million" }));
	assert.equal(word.unitNote, "million");
	assert.equal(word.columns[0].text, "5 million");
});

test("columnModel: a series column groups columns side by side, in legend order", () => {
	const m = columnModel(spec({ kind: "column", data: "Year,Store,Orders\n2024,A,40\n2024,B,20\n2025,A,50\n2025,B,30", x: "year", y: "orders", series: "store" }));
	assert.equal(m.ok, true);
	assert.deepEqual(m.columns, []);
	assert.deepEqual(
		m.legend.map((l) => l.name),
		["A", "B"],
	);
	assert.deepEqual(
		m.groups.map((g) => [g.label, g.bars.map((b) => [b.slot, b.percent])]),
		[
			[
				"2024",
				[
					[1, 80],
					[2, 40],
				],
			],
			[
				"2025",
				[
					[1, 100],
					[2, 60],
				],
			],
		],
	);
	const five = "a,s,v\n" + "pqrst".split("").map((s) => `x,${s},1`).join("\n");
	assert.match(columnModel(spec({ kind: "column", data: five, x: "a", y: "v", series: "s" })).reason, /at most 4/);
});

test("columnModel: refuses negatives and too many columns", () => {
	assert.match(columnModel(spec({ kind: "column", data: "a,v\nx,-1", x: "a", y: "v" })).reason, /zero/);
	const many = ["a,v", ...Array.from({ length: MAX_COLUMNS + 1 }, (_, i) => `r${i},1`)].join("\n");
	assert.match(columnModel(spec({ kind: "column", data: many, x: "a", y: "v" })).reason, /13/);
});

const stackData = "Age,Channel,Share\n18 to 29,Search,40\n18 to 29,Email,15\n18 to 29,Social,45\n45+,Search,30\n45+,Email,20";

test("stackModel totals: bar length by total, segments as parts of their bar, missing parts are zero", () => {
	const m = stackModel(spec({ kind: "stacked", data: stackData, x: "age", y: "share", series: "channel" }));
	assert.equal(m.ok, true);
	assert.deepEqual(
		m.legend.map((l) => l.name),
		["Search", "Email", "Social"],
	);
	const [young, old] = m.rows;
	assert.equal(young.percent, 100);
	assert.equal(old.percent, 50);
	assert.equal(young.total, "100");
	assert.deepEqual(
		young.segments.map((s) => s.width),
		[40, 15, 45],
	);
	assert.deepEqual(
		old.segments.map((s) => [s.series, s.width]),
		[
			["Search", 60],
			["Email", 40],
			["Social", 0],
		],
	);
});

test("stackModel shares: every bar 100%, no total, segment text as a share", () => {
	const m = stackModel(spec({ kind: "stacked", data: stackData, x: "age", y: "share", series: "channel", stackMode: "share" }));
	assert.deepEqual(
		m.rows.map((r) => [r.percent, r.total]),
		[
			[100, ""],
			[100, ""],
		],
	);
	assert.equal(m.rows[1].segments[0].text, "60%");
});

test("stackModel: says why it can't stack", () => {
	assert.match(stackModel(spec({ kind: "stacked", data: "a,v\nx,1", x: "a", y: "v" })).reason, /series column/);
	assert.match(stackModel(spec({ kind: "stacked", data: "a,s,v\nx,p,1", x: "a", y: "v", series: "s" })).reason, /two series/);
	assert.match(stackModel(spec({ kind: "stacked", data: "a,s,v\nx,p,1\nx,q,-1", x: "a", y: "v", series: "s" })).reason, /negative/);
	assert.match(stackModel(spec({ kind: "stacked", data: "a,s,v\nx,p,0\nx,q,0", x: "a", y: "v", series: "s" })).reason, /zero/);
});

test("areaModel: one area from zero, polygon closes along the bottom", () => {
	const m = areaModel(spec({ kind: "area", data: "Year,v\n2024,6\n2030,15", x: "year", y: "v" }));
	assert.equal(m.ok, true);
	assert.deepEqual(
		m.yTicks.map((t) => t.value),
		[0, 5, 10, 15],
	);
	assert.equal(m.layers.length, 1);
	assert.equal(m.layers[0].line, "0,600 1000,0");
	assert.equal(m.layers[0].polygon, "0,600 1000,0 1000,1000 0,1000");
	assert.deepEqual(
		m.xLabels.map((l) => [l.label, l.percent]),
		[
			["2024", 0],
			["2030", 100],
		],
	);
});

test("areaModel: series stack in legend order; the top edge is the total", () => {
	const m = areaModel(spec({ kind: "area", data: "Y,S,v\n1,a,2\n1,b,3\n2,a,4\n2,b,6", x: "y", y: "v", series: "s" }));
	assert.deepEqual(
		m.yTicks.map((t) => t.value),
		[0, 2, 4, 6, 8, 10],
	);
	assert.equal(m.layers[0].line, "0,800 1000,600");
	assert.equal(m.layers[1].line, "0,500 1000,0");
	assert.equal(m.layers[1].polygon, "0,500 1000,0 1000,600 0,800", "the upper band sits on the lower one");
});

test("areaModel: no gaps, no negatives, at most four areas", () => {
	assert.match(areaModel(spec({ kind: "area", data: "Y,S,v\n1,a,2\n2,a,4\n2,b,6", x: "y", y: "v", series: "s" })).reason, /b has no value for 1/);
	assert.match(areaModel(spec({ kind: "area", data: "Y,v\n1,-2\n2,4", x: "y", y: "v" })).reason, /zero/);
	assert.match(areaModel(spec({ kind: "area", data: "Y,v\n1,2", x: "y", y: "v" })).reason, /two points/);
	const five = ["Y,S,v", ..."abcde".split("").flatMap((s) => [`1,${s},1`, `2,${s},1`])].join("\n");
	assert.match(areaModel(spec({ kind: "area", data: five, x: "y", y: "v", series: "s" })).reason, /5/);
});

const compareData = "Category,Year,Rate\nTravel,2025,18\nTravel,2026,41\nFashion,2025,30\nFashion,2026,44\nElectronics,2025,22\nElectronics,2026,29";

test("compareModel: two series on one scale, earlier grey, sorted by the change", () => {
	const m = compareModel(spec({ kind: "compare", data: compareData, x: "category", y: "rate", series: "year", yUnit: "%" }));
	assert.equal(m.ok, true);
	assert.deepEqual(m.legend, [
		{ name: "2025", slot: 6 },
		{ name: "2026", slot: 1 },
	]);
	assert.deepEqual(
		m.rows.map((r) => [r.label, r.change]),
		[
			["Travel", 23],
			["Fashion", 14],
			["Electronics", 7],
		],
	);
	assert.deepEqual(m.rows[0].from, { value: 18, at: 36, text: "18%" }, "scale 0 to 50");
	assert.equal(m.rows[0].to.at, 82);
});

test("compareModel: needs exactly two series and both values per row", () => {
	assert.match(compareModel(spec({ kind: "compare", data: "a,v\nx,1", x: "a", y: "v" })).reason, /series column/);
	assert.match(compareModel(spec({ kind: "compare", data: "a,s,v\nx,p,1\nx,q,2\nx,r,3", x: "a", y: "v", series: "s" })).reason, /exactly two.*3/);
	assert.match(compareModel(spec({ kind: "compare", data: "a,s,v\nx,p,1\nx,q,2\ny,p,3", x: "a", y: "v", series: "s" })).reason, /y needs a value for both p and q/);
});
