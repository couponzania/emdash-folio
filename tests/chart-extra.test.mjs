import assert from "node:assert/strict";
import { test } from "node:test";

import { comboModel, funnelModel, heatmapModel, histogramModel, niceStep, scatterModel, waterfallModel } from "../src/chart/extra-rules.ts";
import { chartSpec } from "../src/chart/rules.ts";

const spec = (over) => {
	const s = chartSpec({ _type: "folioChart", _key: "k", description: "What it shows.", ...over });
	assert.equal(s.ok, true, s.reason);
	return s;
};

test("chartSpec: histogram needs no label column; combo needs the line column; scatter needs numbers in x", () => {
	assert.equal(spec({ kind: "histogram", data: "Price\n1\n2", y: "price" }).x, "Price");
	assert.match(chartSpec({ kind: "combo", description: "d", data: "a,b\nx,1", x: "a", y: "b" }).reason, /line's column/);
	assert.match(chartSpec({ kind: "combo", description: "d", data: "a,b\nx,1", x: "a", y: "b", y2: "c" }).reason, /No column named "c"/);
	assert.match(chartSpec({ kind: "combo", description: "d", data: "a,b,c\nx,1,z", x: "a", y: "b", y2: "c" }).reason, /"z" in c is not a number/);
	assert.match(chartSpec({ kind: "scatter", description: "d", data: "a,b\nx,1", x: "a", y: "b" }).reason, /numbers in a/);
	assert.equal(spec({ kind: "scatter", data: "Price\tRate\n$1,000\t5", x: "price", y: "rate" }).rows[0].Price, 1000);
	assert.equal(spec({ kind: "histogram", data: "v\n1", y: "v", bins: "8" }).bins, 8);
	assert.equal(spec({ kind: "histogram", data: "v\n1", y: "v", bins: "99" }).bins, null);
	assert.equal(spec({ kind: "waterfall", data: "a,b\nx,1", x: "a", y: "b" }).totalLabel, "Total");
});

test("scatterModel: both axes on round steps, dots by value, series colour them", () => {
	const m = scatterModel(spec({ kind: "scatter", data: "Price,Rate,Kind\n10,5,A\n20,10,B\n40,20,A", x: "price", y: "rate", series: "kind", xUnit: "$", yUnit: "%" }));
	assert.equal(m.ok, true);
	assert.deepEqual(
		m.xTicks.map((t) => [t.label, t.percent]),
		[
			["$10", 0],
			["$20", 33.33],
			["$30", 66.67],
			["$40", 100],
		],
	);
	assert.deepEqual(m.points[0], { left: 0, top: 100, slot: 1, text: "A: $10, 5%" });
	assert.deepEqual(m.points[2], { left: 100, top: 0, slot: 1, text: "A: $40, 20%" });
	assert.equal(m.points[1].slot, 2);
	assert.match(scatterModel(spec({ kind: "scatter", data: "a,b\n1,2\n2,3", x: "a", y: "b" })).reason, /three points/);
});

test("niceStep: round steps", () => {
	assert.deepEqual([0.7, 1.5, 2.2, 4, 7, 12.4, 23].map(niceStep), [0.5, 2, 2, 5, 5, 10, 25]);
});

test("histogramModel: equal round bins, the maximum in the last bin, counts as heights", () => {
	const data = "v\n" + [1, 2, 2, 3, 3, 3, 4, 4, 9, 10].join("\n");
	const m = histogramModel(spec({ kind: "histogram", data, y: "v", bins: "5" }));
	assert.equal(m.ok, true);
	assert.deepEqual(
		m.bins.map((b) => [b.from, b.to, b.count]),
		[
			[0, 2, 1],
			[2, 4, 5],
			[4, 6, 2],
			[6, 8, 0],
			[8, 10, 2],
		],
	);
	assert.equal(m.bins.reduce((s, b) => s + b.count, 0), 10, "every value counted once");
	assert.deepEqual(
		m.edges.map((e) => e.label),
		["0", "2", "4", "6", "8", "10"],
	);
	assert.match(histogramModel(spec({ kind: "histogram", data: "v\n1\n2", y: "v" })).reason, /five values/);
	assert.match(histogramModel(spec({ kind: "histogram", data: "v\n3\n3\n3\n3\n3", y: "v" })).reason, /same/);
});

test("histogramModel: Sturges' rule when no bins are given", () => {
	const data = "v\n" + Array.from({ length: 100 }, (_, i) => i).join("\n");
	const m = histogramModel(spec({ kind: "histogram", data, y: "v" }));
	assert.equal(m.bins.length, 10, "8 bins wanted: a width of 12.4 rounds to the nearest round step, 10");
	assert.equal(m.bins[9].count, 10);
});

test("heatmapModel: columns across, series down, levels from lowest to highest, gaps blank", () => {
	const m = heatmapModel(spec({ kind: "heatmap", data: "Day,Hour,Visits\nMon,9am,10\nMon,1pm,30\nTue,9am,20\nTue,1pm,", x: "hour", y: "visits", series: "day" }));
	assert.equal(m.ok, true);
	assert.deepEqual(m.columns, ["9am", "1pm"]);
	assert.deepEqual(
		m.rows.map((r) => [r.label, r.cells.map((c) => c.level)]),
		[
			["Mon", [0, 1]],
			["Tue", [0.5, 0]],
		],
	);
	assert.deepEqual(m.rows[1].cells[1], { value: null, text: "", level: 0 });
	assert.deepEqual([m.min, m.max], ["10", "30"]);
	assert.match(heatmapModel(spec({ kind: "heatmap", data: "a,b\nx,1", x: "a", y: "b" })).reason, /series column/);
});

test("funnelModel: centred widths from the largest, shares of the start and of the stage before", () => {
	const m = funnelModel(spec({ kind: "funnel", data: "Stage,People\nVisited,1000\nCopied a code,400\nBought,100", x: "stage", y: "people" }));
	assert.deepEqual(
		m.stages.map((s) => [s.label, s.width, s.ofStart, s.ofPrevious]),
		[
			["Visited", 100, "", ""],
			["Copied a code", 40, "40%", "40%"],
			["Bought", 10, "10%", "25%"],
		],
	);
	assert.equal(m.stages[0].text, "1,000");
	assert.match(funnelModel(spec({ kind: "funnel", data: "a,b\nx,0\ny,0", x: "a", y: "b" })).reason, /above zero/);
	assert.match(funnelModel(spec({ kind: "funnel", data: "a,b\nx,1", x: "a", y: "b" })).reason, /two stages/);
});

test("waterfallModel: bars float from the running total; a closing total bar", () => {
	const m = waterfallModel(spec({ kind: "waterfall", data: "Step,Change\nList price,100\nCoupon,-20\nShipping,10\nCashless offer,-15", x: "step", y: "change", yUnit: "$", totalLabel: "You pay" }));
	assert.equal(m.ok, true);
	assert.deepEqual(
		m.yTicks.map((t) => t.value),
		[0, 20, 40, 60, 80, 100],
	);
	assert.deepEqual(
		m.steps.map((s) => [s.label, s.kind, s.bottom, s.height, s.text]),
		[
			["List price", "up", 0, 100, "$100"],
			["Coupon", "down", 80, 20, "−$20"],
			["Shipping", "up", 80, 10, "+$10"],
			["Cashless offer", "down", 75, 15, "−$15"],
			["You pay", "total", 0, 75, "$75"],
		],
	);
});

test("waterfallModel: a total below zero hangs from the zero line", () => {
	const m = waterfallModel(spec({ kind: "waterfall", data: "a,b\nx,10\ny,-30", x: "a", y: "b" }));
	const total = m.steps[m.steps.length - 1];
	const zeroAt = m.yTicks.find((t) => t.value === 0);
	assert.equal(total.bottom + total.height, Math.round((100 - zeroAt.percent) * 100) / 100);
});

test("comboModel: columns on the left axis, a line on its own right axis through the centres", () => {
	const m = comboModel(spec({ kind: "combo", data: "Month,Orders,Rate\nJan,100,10\nFeb,200,20", x: "month", y: "orders", y2: "rate", y2Unit: "%" }));
	assert.equal(m.ok, true);
	assert.deepEqual(m.legend, [
		{ name: "Orders", slot: 1 },
		{ name: "Rate", slot: 2 },
	]);
	assert.deepEqual(
		m.groups.map((g) => [g.label, g.bar.percent, g.point.left, g.point.top, g.point.text]),
		[
			["Jan", 50, 25, 50, "10%"],
			["Feb", 100, 75, 0, "20%"],
		],
	);
	assert.equal(m.line, "250,500 750,0");
	assert.equal(m.y2Ticks[0].label, "0%");
	assert.match(comboModel(spec({ kind: "combo", data: "a,b,c\nx,-1,1", x: "a", y: "b", y2: "c" })).reason, /zero/);
});
