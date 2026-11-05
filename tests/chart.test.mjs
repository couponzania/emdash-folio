import assert from "node:assert/strict";
import { test } from "node:test";

import { barModel, chartSpec, donutModel, formatValue, lineModel, niceTicks, parseTable, toNumber } from "../src/chart/rules.ts";

const node = (over = {}) => ({
	_type: "folioChart",
	_key: "k",
	kind: "bar",
	title: "Prime members by year",
	description: "Prime members grew from 150 million in 2020 to 250 million in 2025.",
	data: "Year,Members\n2020,150\n2022,200\n2025,250",
	x: "year",
	y: "members",
	...over,
});

test("parseTable: commas, tabs from a spreadsheet, semicolons and quoted cells", () => {
	assert.deepEqual(parseTable("a,b\n1,2\n"), { columns: ["a", "b"], rows: [{ a: "1", b: "2" }] });
	assert.deepEqual(parseTable("Name\tValue\r\nX\t1,234\r\n"), { columns: ["Name", "Value"], rows: [{ Name: "X", Value: "1,234" }] });
	assert.deepEqual(parseTable("a;b\n1;2"), { columns: ["a", "b"], rows: [{ a: "1", b: "2" }] });
	assert.deepEqual(parseTable('Brand,Revenue\n"Amazon, Inc.","1,234"\n"Say ""hi""",5'), {
		columns: ["Brand", "Revenue"],
		rows: [
			{ Brand: "Amazon, Inc.", Revenue: "1,234" },
			{ Brand: 'Say "hi"', Revenue: "5" },
		],
	});
	assert.deepEqual(parseTable("   \n  "), { columns: [], rows: [] });
});

test("toNumber: thousands separators, a leading currency sign and a trailing % are read; words are not", () => {
	assert.equal(toNumber("1,234.5"), 1234.5);
	assert.equal(toNumber("$44.95"), 44.95);
	assert.equal(toNumber("₹20,000"), 20000);
	assert.equal(toNumber("29.8%"), 29.8);
	assert.equal(toNumber("-3"), -3);
	assert.equal(toNumber(""), null);
	assert.equal(toNumber("n/a"), null);
	assert.equal(toNumber("12abc"), null);
});

test("chartSpec: a bar chart with columns matched without regard to case", () => {
	const s = chartSpec(node());
	assert.equal(s.ok, true);
	assert.equal(s.kind, "bar");
	assert.equal(s.x, "Year");
	assert.equal(s.y, "Members");
	assert.deepEqual(s.rows, [
		{ Year: "2020", Members: 150 },
		{ Year: "2022", Members: 200 },
		{ Year: "2025", Members: 250 },
	]);
});

test("chartSpec: line charts keep years as numbers and allow gaps", () => {
	const s = chartSpec(node({ kind: "line", data: "Year,Members\n2020,150\n2021,\n2022,200" }));
	assert.equal(s.ok, true);
	assert.deepEqual(s.rows, [
		{ Year: 2020, Members: 150 },
		{ Year: 2021, Members: null },
		{ Year: 2022, Members: 200 },
	]);
});

test("chartSpec: a series column splits rows into series", () => {
	const s = chartSpec(node({ data: "Year,Market,Share\n2025,India,30\n2025,US,20", y: "share", series: "market" }));
	assert.equal(s.ok, true);
	assert.equal(s.series, "Market");
	assert.deepEqual(s.rows[0], { Year: "2025", Market: "India", Share: 30 });
});

test("chartSpec: says why a chart can't be drawn", () => {
	assert.equal(chartSpec(node({ description: " " })).reason, "The chart needs a description: one sentence saying what it shows.");
	assert.equal(chartSpec(node({ kind: "pie" })).reason, 'Unknown chart type "pie".');
	assert.equal(chartSpec(node({ data: "" })).reason, "The chart has no data rows.");
	assert.equal(chartSpec(node({ x: "month" })).reason, 'No column named "month" in the data.');
	assert.equal(chartSpec(node({ data: "Year,Members\n2020,lots" })).reason, 'Row 1: "lots" in Members is not a number.');
	assert.equal(chartSpec(node({ data: "Year,Members\n2020," })).reason, "Row 1: Members is empty.");
	assert.equal(chartSpec(node({ series: "region" })).reason, 'No column named "region" in the data.');
});

test("donutModel: shares of a whole, largest share for the centre, arcs from fixed geometry", () => {
	const s = chartSpec(node({ kind: "donut", data: "Device,Share\nMobile,75\nDesktop,25", x: "device", y: "share" }));
	assert.equal(s.ok, true);
	const d = donutModel(s);
	assert.equal(d.ok, true);
	assert.equal(d.total, 100);
	assert.deepEqual(
		d.slices.map((x) => [x.label, x.value, x.percent, x.slot]),
		[
			["Mobile", 75, "75%", 1],
			["Desktop", 25, "25%", 2],
		],
	);
	assert.equal(d.top.label, "Mobile");
	// 75% starts at 12 o'clock and runs clockwise to 9 o'clock: outer radius 80, inner 50, centre 100,100.
	assert.equal(d.slices[0].path, "M 100 20 A 80 80 0 1 1 20 100 L 50 100 A 50 50 0 1 0 100 50 Z");
	assert.equal(d.slices[1].path, "M 20 100 A 80 80 0 0 1 100 20 L 100 50 A 50 50 0 0 0 50 100 Z");
});

test("donutModel: one slice is a full ring; refuses negatives, an empty total and more than six slices", () => {
	const one = donutModel(chartSpec(node({ kind: "donut", data: "A,B\nAll,5", x: "a", y: "b" })));
	assert.equal(one.slices[0].percent, "100%");
	assert.match(one.slices[0].path, /^M 100 20 A 80 80 0 1 1 100 180 A 80 80 0 1 1 100 20 /);
	assert.equal(donutModel(chartSpec(node({ kind: "donut", data: "A,B\nx,-1\ny,2", x: "a", y: "b" }))).reason, "A donut can't show negative values.");
	assert.equal(donutModel(chartSpec(node({ kind: "donut", data: "A,B\nx,0", x: "a", y: "b" }))).reason, "The values add up to zero.");
	const seven = "A,B\n" + [1, 2, 3, 4, 5, 6, 7].map((n) => `s${n},${n}`).join("\n");
	assert.equal(donutModel(chartSpec(node({ kind: "donut", data: seven, x: "a", y: "b" }))).reason, "A donut reads badly past six slices; use a bar chart.");
});

test("donutModel: shares under 10% keep one decimal", () => {
	const d = donutModel(chartSpec(node({ kind: "donut", data: "A,B\nx,95.4\ny,4.6", x: "a", y: "b" })));
	assert.deepEqual(
		d.slices.map((s) => s.percent),
		["95%", "4.6%"],
	);
});

test("chartSpec: unknown chart types are refused", () => {
	assert.equal(chartSpec(node({ kind: "pie3d" })).reason, 'Unknown chart type "pie3d".');
});

test("formatValue: units as people write them", () => {
	assert.equal(formatValue(1234.5, ""), "1,234.5");
	assert.equal(formatValue(29.8, "%"), "29.8%");
	assert.equal(formatValue(44.95, "$"), "$44.95");
	assert.equal(formatValue(20000, "₹"), "₹20,000");
	assert.equal(formatValue(250, "million"), "250 million");
	assert.equal(formatValue(0.123456, ""), "0.12");
});

test("niceTicks: round steps from zero that cover the data", () => {
	assert.deepEqual(niceTicks(0, 250), [0, 50, 100, 150, 200, 250]);
	assert.deepEqual(niceTicks(0, 87), [0, 20, 40, 60, 80, 100]);
	assert.deepEqual(niceTicks(-12, 30), [-20, -10, 0, 10, 20, 30]);
	assert.deepEqual(niceTicks(0, 0), [0, 1]);
	assert.deepEqual(niceTicks(0, 4.6), [0, 1, 2, 3, 4, 5]);
});

test("barModel: one bar per row, widths against the largest value, values formatted", () => {
	const m = barModel(chartSpec(node({ data: "Store,Clicks\nAmazon,500\nMyntra,250\nAjio,0", x: "store", y: "clicks" })));
	assert.equal(m.ok, true);
	assert.deepEqual(m.legend, []);
	assert.deepEqual(
		m.rows.map((r) => [r.label, r.bars.map((b) => [b.percent, b.text, b.slot])]),
		[
			["Amazon", [[100, "500", 1]]],
			["Myntra", [[50, "250", 1]]],
			["Ajio", [[0, "0", 1]]],
		],
	);
});

test("barModel: a series column groups bars per category, with a legend in first-seen order", () => {
	const m = barModel(chartSpec(node({ data: "Year,Market,Share\n2024,India,30\n2024,US,20\n2025,India,40", x: "year", y: "share", series: "market", yUnit: "%" })));
	assert.deepEqual(m.legend, [
		{ name: "India", slot: 1 },
		{ name: "US", slot: 2 },
	]);
	assert.deepEqual(
		m.rows.map((r) => [r.label, r.bars.map((b) => `${b.series}:${b.text}:${b.percent}`)]),
		[
			["2024", ["India:30%:75", "US:20%:50"]],
			["2025", ["India:40%:100"]],
		],
	);
});

test("barModel: refuses negative values and more than four series", () => {
	assert.equal(barModel(chartSpec(node({ data: "A,B\nx,-1", x: "a", y: "b" }))).reason, "Bars here start at zero; for values below zero use a line chart.");
	const five = "A,S,B\n" + ["a", "b", "c", "d", "e"].map((s) => `x,${s},1`).join("\n");
	assert.equal(barModel(chartSpec(node({ data: five, x: "a", y: "b", series: "s" }))).reason, "Too many series for bars: 5 (at most 4).");
});

test("lineModel: positions on a 1000 by 1000 plot, y from nice ticks, gaps split the line", () => {
	const m = lineModel(chartSpec(node({ kind: "line", data: "Year,Members\n2020,150\n2021,\n2022,200\n2025,250", x: "year", y: "members" })));
	assert.equal(m.ok, true);
	assert.deepEqual(
		m.yTicks.map((t) => [t.label, t.percent]),
		[
			["0", 100],
			["50", 80],
			["100", 60],
			["150", 40],
			["200", 20],
			["250", 0],
		],
	);
	// Years are numbers, so 2020 to 2025 spread by value: 2022 sits at 40%.
	assert.deepEqual(
		m.xLabels.map((l) => [l.label, l.percent]),
		[
			["2020", 0],
			["2021", 20],
			["2022", 40],
			["2025", 100],
		],
	);
	const s = m.series[0];
	assert.deepEqual(s.segments, ["0,400", "400,200 1000,0"]);
	assert.deepEqual(
		s.points.map((p) => [p.left, p.top, p.text]),
		[
			[0, 40, "150"],
			[40, 20, "200"],
			[100, 0, "250"],
		],
	);
});

test("lineModel: text on the x axis is spaced evenly in row order, one line per series", () => {
	const m = lineModel(chartSpec(node({ kind: "line", data: "Month,Store,Orders\nJan,A,1\nFeb,A,2\nMar,A,3\nJan,B,3\nFeb,B,2\nMar,B,1", x: "month", y: "orders", series: "store" })));
	assert.deepEqual(m.xLabels.map((l) => [l.label, l.percent]), [
		["Jan", 0],
		["Feb", 50],
		["Mar", 100],
	]);
	assert.deepEqual(
		m.series.map((s) => [s.name, s.slot, s.segments]),
		[
			["A", 1, ["0,666.67 500,333.33 1000,0"]],
			["B", 2, ["0,0 500,333.33 1000,666.67"]],
		],
	);
});

test("lineModel: needs two points along x, and labels thin out past eight", () => {
	assert.equal(lineModel(chartSpec(node({ kind: "line", data: "Y,V\n2020,1", x: "y", y: "v" }))).reason, "A line needs at least two points along the x axis.");
	const many = "Y,V\n" + Array.from({ length: 20 }, (_, i) => `${2000 + i},${i}`).join("\n");
	const m = lineModel(chartSpec(node({ kind: "line", data: many, x: "y", y: "v" })));
	assert.ok(m.xLabels.length <= 8);
	assert.equal(m.xLabels[0].label, "2000");
	assert.equal(m.xLabels.at(-1).label, "2019");
});

test("lineModel: x labels closer than 25% to the last kept one are minor (hidden on phones); ends always kept", () => {
	const m = lineModel(chartSpec(node({ kind: "line", data: "Year,Size\n2024,1\n2025,2\n2026,3\n2027,4\n2030,5\n2033,6\n2035,7", x: "year", y: "size" })));
	assert.deepEqual(
		m.xLabels.map((l) => [l.label, l.minor]),
		[
			["2024", false],
			["2025", true],
			["2026", true],
			["2027", false],
			["2030", false],
			["2033", true],
			["2035", false],
		],
	);
	const tight = lineModel(chartSpec(node({ kind: "line", data: "Year,Size\n2020,1\n2029,2\n2030,3", x: "year", y: "size" })));
	assert.deepEqual(
		tight.xLabels.map((l) => [l.label, l.minor]),
		[
			["2020", false],
			["2029", true],
			["2030", false],
		],
	);
});

test("lineModel: a word unit is named once above the axis, ticks are plain numbers", () => {
	const m = lineModel(chartSpec(node({ kind: "line", data: "Year,Size\n2024,8.87\n2035,57.1", x: "year", y: "size", yUnit: "billion" })));
	assert.equal(m.unitNote, "billion");
	assert.deepEqual(
		m.yTicks.map((t) => t.label),
		["0", "20", "40", "60"],
	);
	assert.equal(m.series[0].points[0].text, "8.87 billion");
	const pct = lineModel(chartSpec(node({ kind: "line", data: "Year,Rate\n2024,24.1\n2025,29.7", x: "year", y: "rate", yUnit: "%" })));
	assert.equal(pct.unitNote, "");
	assert.equal(pct.yTicks.at(-1).label, "30%");
});
