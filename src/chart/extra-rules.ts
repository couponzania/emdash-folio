// Layout rules for the chart kinds added in 0.7: scatter, histogram, heatmap, funnel, waterfall
// and bars plus a line. Same approach as rules.ts and more-rules.ts: fixed formulas, percentages
// for HTML and 1000 by 1000 units for SVG, all tested.
import { isWordUnit, seriesNames, zeroTicks } from "./more-rules.ts";
import type { Tick } from "./more-rules.ts";
import type { ChartError, ChartSpec, LegendItem } from "./rules.ts";
import { fail, formatValue, MAX_LINE_SERIES, niceTicks, phoneLabels, round } from "./rules.ts";

export const MAX_HEAT_COLUMNS = 12;
export const MAX_HEAT_ROWS = 20;
export const MAX_FUNNEL_STAGES = 8;
export const MAX_WATERFALL_STEPS = 12;
export const MAX_COMBO_GROUPS = 12;

/** Ticks over [min, max] on round steps, positioned from the top (y) or from the left (x). */
function axis(min: number, max: number, unit: string, fromLeft: boolean): { ticks: Tick[]; lo: number; hi: number } {
	const values = niceTicks(min, max);
	const lo = values[0];
	const hi = values[values.length - 1];
	const label = isWordUnit(unit) ? "" : unit;
	const at = (v: number) => round(((fromLeft ? v - lo : hi - v) / (hi - lo)) * 100);
	return { lo, hi, ticks: values.map((value) => ({ value, label: formatValue(value, label), percent: at(value) })) };
}

export interface ScatterModel {
	ok: true;
	legend: LegendItem[];
	unitNote: string;
	yTicks: Tick[];
	xTicks: Array<Tick & { minor: boolean }>;
	points: Array<{ left: number; top: number; slot: number; text: string }>;
}

/** A scatter: one dot per row at (x, y), both axes on round steps; a series column colours them. */
export function scatterModel(spec: ChartSpec): ScatterModel | ChartError {
	const names = seriesNames(spec);
	if (names.length > MAX_LINE_SERIES) return fail(`Too many groups: ${names.length} (at most ${MAX_LINE_SERIES}).`);
	const xs = spec.rows.map((r) => Number(r[spec.x]));
	const ys = spec.rows.map((r) => Number(r[spec.y]));
	if (spec.rows.length < 3) return fail("A scatter needs at least three points.");
	const xa = axis(Math.min(...xs), Math.max(...xs), spec.xUnit, true);
	const ya = axis(Math.min(...ys), Math.max(...ys), spec.yUnit, false);
	const xLabels = phoneLabels(xa.ticks.map((t) => ({ label: t.label, percent: t.percent })));
	return {
		ok: true,
		legend: names.map((name, i) => ({ name, slot: i + 1 })),
		unitNote: isWordUnit(spec.yUnit) ? spec.yUnit : "",
		yTicks: ya.ticks,
		xTicks: xa.ticks.map((t, i) => ({ ...t, minor: xLabels[i].minor })),
		points: spec.rows.map((r, i) => {
			const name = spec.series ? String(r[spec.series]) : "";
			return {
				left: round(((xs[i] - xa.lo) / (xa.hi - xa.lo)) * 100),
				top: round(((ya.hi - ys[i]) / (ya.hi - ya.lo)) * 100),
				slot: spec.series ? names.indexOf(name) + 1 : 1,
				text: `${name ? `${name}: ` : ""}${formatValue(xs[i], spec.xUnit)}, ${formatValue(ys[i], spec.yUnit)}`,
			};
		}),
	};
}

/** The round step nearest `rough` (by ratio): 1, 2, 2.5 or 5 times a power of ten. */
export function niceStep(rough: number): number {
	const mag = 10 ** Math.floor(Math.log10(rough));
	const options = [0.5, 1, 2, 2.5, 5, 10].map((f) => f * mag);
	return options.reduce((best, s) => (Math.abs(Math.log(s / rough)) < Math.abs(Math.log(best / rough)) ? s : best));
}

export interface HistogramModel {
	ok: true;
	yTicks: Tick[];
	/** Bin edges along the bottom, in percent of the width. */
	edges: Array<{ label: string; percent: number; minor: boolean }>;
	bins: Array<{ from: number; to: number; count: number; percent: number; text: string }>;
}

/**
 * A histogram of one column: values counted into equal, round bins (the bins field, or Sturges'
 * rule, 4 to 20). Each bin holds from its lower edge up to, not including, the next; the last
 * bin includes its upper edge.
 */
export function histogramModel(spec: ChartSpec): HistogramModel | ChartError {
	const values = spec.rows.map((r) => Number(r[spec.y]));
	if (values.length < 5) return fail("A histogram needs at least five values.");
	const min = Math.min(...values);
	const max = Math.max(...values);
	if (min === max) return fail("Every value is the same; a histogram needs a spread.");
	const wanted = spec.bins ?? Math.min(20, Math.max(4, Math.ceil(Math.log2(values.length) + 1)));
	const step = niceStep((max - min) / wanted);
	const lo = round(Math.floor(min / step + 1e-9) * step, 10);
	// The maximum may sit exactly on the last edge; it belongs to the last bin (inclusive).
	const count = Math.max(1, Math.ceil((max - lo) / step - 1e-9));
	const bins = Array.from({ length: count }, (_, i) => ({ from: round(lo + i * step, 10), to: round(lo + (i + 1) * step, 10), count: 0 }));
	for (const v of values) {
		const i = Math.min(count - 1, Math.floor((v - lo) / step + 1e-9));
		bins[i].count++;
	}
	const most = Math.max(...bins.map((b) => b.count));
	const { ticks, hi } = zeroTicks(most, "");
	const edges = phoneLabels(
		Array.from({ length: count + 1 }, (_, i) => ({ label: formatValue(round(lo + i * step, 10), spec.yUnit), percent: round((i / count) * 100) })),
	);
	return {
		ok: true,
		yTicks: ticks,
		edges,
		bins: bins.map((b) => ({ ...b, percent: round((b.count / hi) * 100), text: String(b.count) })),
	};
}

export interface HeatmapModel {
	ok: true;
	columns: string[];
	rows: Array<{ label: string; cells: Array<{ value: number | null; text: string; level: number }> }>;
	min: string;
	max: string;
}

/**
 * A heatmap: the x column across the top, the series column down the side, each cell shaded by
 * its value from the lowest (level 0) to the highest (level 1). Empty cells stay blank.
 */
export function heatmapModel(spec: ChartSpec): HeatmapModel | ChartError {
	if (!spec.series) return fail("A heatmap needs a series column for its rows.");
	const columns = [...new Set(spec.rows.map((r) => String(r[spec.x])))];
	const names = seriesNames(spec);
	if (columns.length > MAX_HEAT_COLUMNS) return fail(`Too many columns: ${columns.length} (at most ${MAX_HEAT_COLUMNS}).`);
	if (names.length > MAX_HEAT_ROWS) return fail(`Too many rows: ${names.length} (at most ${MAX_HEAT_ROWS}).`);
	const values = spec.rows.map((r) => r[spec.y]).filter((v): v is number => typeof v === "number");
	if (values.length === 0) return fail("The heatmap has no values.");
	const min = Math.min(...values);
	const max = Math.max(...values);
	const level = (v: number) => (max === min ? 1 : round((v - min) / (max - min), 3));
	return {
		ok: true,
		columns,
		min: formatValue(min, spec.yUnit),
		max: formatValue(max, spec.yUnit),
		rows: names.map((name) => ({
			label: name,
			cells: columns.map((c) => {
				const v = spec.rows.find((r) => String(r[spec.x]) === c && String(r[spec.series as string]) === name)?.[spec.y];
				return typeof v === "number" ? { value: v, text: formatValue(v, spec.yUnit), level: level(v) } : { value: null, text: "", level: 0 };
			}),
		})),
	};
}

export interface FunnelModel {
	ok: true;
	stages: Array<{ label: string; value: number; text: string; width: number; ofStart: string; ofPrevious: string }>;
}

/** A funnel: stages in the author's order, each bar centred and as wide as its share of the start. */
export function funnelModel(spec: ChartSpec): FunnelModel | ChartError {
	if (spec.series) return fail("A funnel shows one series.");
	if (spec.rows.length < 2) return fail("A funnel needs at least two stages.");
	if (spec.rows.length > MAX_FUNNEL_STAGES) return fail(`Too many stages: ${spec.rows.length} (at most ${MAX_FUNNEL_STAGES}).`);
	const values = spec.rows.map((r) => Number(r[spec.y]));
	if (values.some((v) => v < 0)) return fail("A funnel can't show negative values.");
	const first = values[0];
	if (first <= 0) return fail("The first stage must be above zero.");
	const most = Math.max(...values);
	const pct = (a: number, b: number) => (b > 0 ? `${round((a / b) * 100, 1)}%` : "");
	return {
		ok: true,
		stages: spec.rows.map((r, i) => ({
			label: String(r[spec.x]),
			value: values[i],
			text: formatValue(values[i], spec.yUnit),
			width: round((values[i] / most) * 100),
			ofStart: i === 0 ? "" : pct(values[i], first),
			ofPrevious: i === 0 ? "" : pct(values[i], values[i - 1]),
		})),
	};
}

export interface WaterfallModel {
	ok: true;
	unitNote: string;
	yTicks: Tick[];
	/** bottom and height in percent of the plot; kind picks the colour. */
	steps: Array<{ label: string; kind: "up" | "down" | "total"; bottom: number; height: number; text: string }>;
}

/**
 * A waterfall: each row is a change (the first is usually the starting amount), drawn as a bar
 * floating from the running total before it; a closing bar shows the final total.
 */
export function waterfallModel(spec: ChartSpec): WaterfallModel | ChartError {
	if (spec.series) return fail("A waterfall shows one series of changes.");
	if (spec.rows.length > MAX_WATERFALL_STEPS) return fail(`Too many steps: ${spec.rows.length} (at most ${MAX_WATERFALL_STEPS}).`);
	const changes = spec.rows.map((r) => Number(r[spec.y]));
	const levels = [0];
	for (const c of changes) levels.push(round(levels[levels.length - 1] + c, 10));
	const total = levels[levels.length - 1];
	const { ticks, lo, hi } = axis(Math.min(0, ...levels), Math.max(0, ...levels), spec.yUnit, false);
	const up = (v: number) => round(((v - lo) / (hi - lo)) * 100);
	const signed = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${formatValue(Math.abs(v), spec.yUnit)}`;
	const steps: WaterfallModel["steps"] = spec.rows.map((r, i) => {
		const a = levels[i];
		const b = levels[i + 1];
		return { label: String(r[spec.x]), kind: changes[i] >= 0 ? "up" : "down", bottom: up(Math.min(a, b)), height: round(up(Math.max(a, b)) - up(Math.min(a, b))), text: i === 0 ? formatValue(changes[0], spec.yUnit) : signed(changes[i]) };
	});
	steps.push({ label: spec.totalLabel, kind: "total", bottom: up(Math.min(0, total)), height: round(up(Math.max(0, total)) - up(Math.min(0, total))), text: formatValue(total, spec.yUnit) });
	return { ok: true, unitNote: isWordUnit(spec.yUnit) ? spec.yUnit : "", yTicks: ticks, steps };
}

export interface ComboModel {
	ok: true;
	legend: LegendItem[];
	yTicks: Tick[];
	y2Ticks: Tick[];
	groups: Array<{ label: string; bar: { percent: number; text: string }; point: { left: number; top: number; text: string } }>;
	/** The line through the group centres, in plot units. */
	line: string;
}

/**
 * Bars plus a line: the value column as columns on the left axis (from zero), the second column
 * as a line on its own right axis. Use when the two measures have different units.
 */
export function comboModel(spec: ChartSpec): ComboModel | ChartError {
	if (spec.series) return fail("Bars plus a line show one series each; drop the series column.");
	if (!spec.y2) return fail("Bars plus a line need the line's column too.");
	if (spec.rows.length > MAX_COMBO_GROUPS) return fail(`Too many groups: ${spec.rows.length} (at most ${MAX_COMBO_GROUPS}).`);
	const bars = spec.rows.map((r) => Number(r[spec.y]));
	if (bars.some((v) => v < 0)) return fail("The bars start at zero; values below zero belong in the line.");
	const lineVals = spec.rows.map((r) => Number(r[spec.y2 as string]));
	const left = zeroTicks(Math.max(...bars), spec.yUnit);
	const right = axis(Math.min(0, ...lineVals), Math.max(...lineVals), spec.y2Unit, false);
	const n = spec.rows.length;
	const centre = (i: number) => (i + 0.5) / n;
	const top = (v: number) => (right.hi - v) / (right.hi - right.lo);
	return {
		ok: true,
		legend: [
			{ name: spec.y, slot: 1 },
			{ name: spec.y2, slot: 2 },
		],
		yTicks: left.ticks,
		y2Ticks: right.ticks,
		groups: spec.rows.map((r, i) => ({
			label: String(r[spec.x]),
			bar: { percent: round((bars[i] / left.hi) * 100), text: formatValue(bars[i], spec.yUnit) },
			point: { left: round(centre(i) * 100), top: round(top(lineVals[i]) * 100), text: formatValue(lineVals[i], spec.y2Unit) },
		})),
		line: spec.rows.map((_, i) => `${round(centre(i) * 1000)},${round(top(lineVals[i]) * 1000)}`).join(" "),
	};
}
