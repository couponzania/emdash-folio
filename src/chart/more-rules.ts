// Layout rules for the chart kinds added in 0.6: vertical columns, stacked bars, stacked area and
// a ranked before and after comparison. Like rules.ts, every position comes from fixed formulas
// (percentages for HTML, 1000 by 1000 plot units for SVG), so it can be tested.
import type { Cell, ChartError, ChartSpec, LegendItem } from "./rules.ts";
import { CURRENCY, fail, formatValue, niceTicks, phoneLabels, round } from "./rules.ts";

export const MAX_COLUMNS = 12;
export const MAX_STACK_SERIES = 6;
export const MAX_AREA_SERIES = 4;

export type Tick = { value: number; label: string; percent: number };

export const seriesNames = (spec: ChartSpec) => (spec.series ? [...new Set(spec.rows.map((r) => String(r[spec.series as string])))] : []);
export const isWordUnit = (unit: string) => unit !== "" && unit !== "%" && !CURRENCY.has(unit);

/** Ticks from zero up, positioned from the top (0% is the highest tick). */
export function zeroTicks(max: number, unit: string): { ticks: Tick[]; hi: number } {
	const values = niceTicks(0, max > 0 ? max : 1);
	const hi = values[values.length - 1];
	const label = isWordUnit(unit) ? "" : unit;
	return { hi, ticks: values.map((value) => ({ value, label: formatValue(value, label), percent: round(((hi - value) / hi) * 100) })) };
}

export interface ColumnModel {
	ok: true;
	unitNote: string;
	yTicks: Tick[];
	columns: Array<{ label: string; value: number; percent: number; text: string }>;
	/** With a series column: one group per label, a column per series side by side. */
	legend: LegendItem[];
	groups: Array<{ label: string; bars: Array<{ series: string; slot: number; percent: number; text: string }> }>;
}

export const MAX_COLUMN_SERIES = 4;

/**
 * Vertical columns from zero, in the author's order. One series gives one column per row; a
 * series column groups them (up to 4 side by side per label).
 */
export function columnModel(spec: ChartSpec): ColumnModel | ChartError {
	const values = spec.rows.map((r) => Number(r[spec.y]));
	if (values.some((v) => v < 0)) return fail("Columns start at zero; for values below zero use a line chart.");
	const names = seriesNames(spec);
	if (names.length > MAX_COLUMN_SERIES) return fail(`Too many series for columns: ${names.length} (at most ${MAX_COLUMN_SERIES}).`);
	const labels = [...new Set(spec.rows.map((r) => String(r[spec.x])))];
	const count = spec.series ? labels.length : spec.rows.length;
	if (count > MAX_COLUMNS) return fail(`Too many columns: ${count} (at most ${MAX_COLUMNS}); use a line chart.`);
	const { ticks, hi } = zeroTicks(Math.max(...values), spec.yUnit);
	const pct = (v: number) => round((v / hi) * 100);
	return {
		ok: true,
		unitNote: isWordUnit(spec.yUnit) ? spec.yUnit : "",
		yTicks: ticks,
		columns: spec.series ? [] : spec.rows.map((r, i) => ({ label: String(r[spec.x]), value: values[i], percent: pct(values[i]), text: formatValue(values[i], spec.yUnit) })),
		legend: names.map((name, i) => ({ name, slot: i + 1 })),
		groups: spec.series
			? labels.map((label) => ({
					label,
					bars: names.flatMap((name, j) => {
						const hit = spec.rows.find((r) => String(r[spec.x]) === label && String(r[spec.series as string]) === name);
						if (!hit) return [];
						const v = Number(hit[spec.y]);
						return [{ series: name, slot: j + 1, percent: pct(v), text: formatValue(v, spec.yUnit) }];
					}),
				}))
			: [],
	};
}

export interface StackModel {
	ok: true;
	share: boolean;
	legend: LegendItem[];
	rows: Array<{
		label: string;
		/** Bar length in percent of the longest total (always 100 when share). */
		percent: number;
		total: string;
		segments: Array<{ series: string; slot: number; value: number; width: number; text: string }>;
	}>;
}

/**
 * Stacked horizontal bars: a row per label, a segment per series in legend order. Segment widths
 * are percentages of their own bar, so the bar length alone carries the total.
 */
export function stackModel(spec: ChartSpec): StackModel | ChartError {
	if (!spec.series) return fail("Stacked bars need a series column: the parts of each bar.");
	const names = seriesNames(spec);
	if (names.length < 2) return fail("Stacked bars need at least two series.");
	if (names.length > MAX_STACK_SERIES) return fail(`Too many series to stack: ${names.length} (at most ${MAX_STACK_SERIES}).`);
	if (spec.rows.some((r) => Number(r[spec.y]) < 0)) return fail("Stacked bars can't show negative values.");
	const share = spec.stackMode === "share";
	const labels = [...new Set(spec.rows.map((r) => String(r[spec.x])))];
	const valueOf = (label: string, name: string) =>
		spec.rows.filter((r) => String(r[spec.x]) === label && String(r[spec.series as string]) === name).reduce((s, r) => s + Number(r[spec.y]), 0);
	const totals = labels.map((l) => names.reduce((s, n) => s + valueOf(l, n), 0));
	const most = Math.max(...totals);
	if (most <= 0) return fail("The values add up to zero.");
	return {
		ok: true,
		share,
		legend: names.map((name, i) => ({ name, slot: i + 1 })),
		rows: labels.map((label, i) => ({
			label,
			percent: share ? 100 : round((totals[i] / most) * 100),
			total: share ? "" : formatValue(totals[i], spec.yUnit),
			segments: names.map((name, j) => {
				const value = valueOf(label, name);
				const width = totals[i] > 0 ? round((value / totals[i]) * 100) : 0;
				return { series: name, slot: j + 1, value, width, text: share ? `${round(width, 1)}%` : formatValue(value, spec.yUnit) };
			}),
		})),
	};
}

export interface AreaModel {
	ok: true;
	legend: LegendItem[];
	unitNote: string;
	yTicks: Tick[];
	xLabels: Array<{ label: string; percent: number; minor: boolean }>;
	/** Bottom series first. `polygon` fills the band, `line` is its top edge, both in plot units. */
	layers: Array<{ name: string; slot: number; polygon: string; line: string }>;
}

/**
 * An area chart: one filled area from zero, or with a series column the areas stacked in legend
 * order (the top edge is the total). Every series needs a value at every point along the bottom.
 */
export function areaModel(spec: ChartSpec): AreaModel | ChartError {
	const xs: Cell[] = [...new Set(spec.rows.map((r) => r[spec.x]))];
	if (xs.length < 2) return fail("An area needs at least two points along the x axis.");
	const names = spec.series ? seriesNames(spec) : [""];
	if (names.length > MAX_AREA_SERIES) return fail(`Too many areas to stack: ${names.length} (at most ${MAX_AREA_SERIES}).`);
	const grid: number[][] = [];
	for (const name of names) {
		const row: number[] = [];
		for (const x of xs) {
			const hit = spec.rows.find((r) => r[spec.x] === x && (!spec.series || String(r[spec.series]) === name));
			const v = hit?.[spec.y];
			if (typeof v !== "number") return fail(`${name || spec.y} has no value for ${String(x)}; areas can't have gaps.`);
			if (v < 0) return fail("Areas start at zero; for values below zero use a line chart.");
			row.push(v);
		}
		grid.push(row);
	}
	const numeric = xs.every((x) => typeof x === "number");
	const [xMin, xMax] = numeric ? [Math.min(...(xs as number[])), Math.max(...(xs as number[]))] : [0, xs.length - 1];
	const pos = (x: Cell, i: number) => (numeric ? ((x as number) - xMin) / (xMax - xMin) : i / (xs.length - 1));
	const tops = xs.map((_, i) => grid.reduce((s, row) => s + row[i], 0));
	const { ticks, hi } = zeroTicks(Math.max(...tops), spec.yUnit);
	const y = (v: number) => round(((hi - v) / hi) * 1000);
	const px = xs.map((x, i) => round(pos(x, i) * 1000));

	const below = xs.map(() => 0);
	const layers = names.map((name, k) => {
		const top = xs.map((_, i) => below[i] + grid[k][i]);
		const upper = px.map((x, i) => `${x},${y(top[i])}`);
		const lower = px.map((x, i) => `${x},${y(below[i])}`).reverse();
		top.forEach((v, i) => (below[i] = v));
		return { name, slot: k + 1, polygon: [...upper, ...lower].join(" "), line: upper.join(" ") };
	});
	return {
		ok: true,
		legend: spec.series ? names.map((name, i) => ({ name, slot: i + 1 })) : [],
		unitNote: isWordUnit(spec.yUnit) ? spec.yUnit : "",
		yTicks: ticks,
		xLabels: phoneLabels(xs.map((x, i) => ({ label: String(x), percent: round(pos(x, i) * 100) }))),
		layers,
	};
}

export interface CompareModel {
	ok: true;
	/** The earlier series is drawn grey (palette slot 6), the later in the brand colour (slot 1). */
	legend: LegendItem[];
	rows: Array<{ label: string; from: { value: number; at: number; text: string }; to: { value: number; at: number; text: string }; change: number }>;
}

/**
 * A ranked comparison: two values per label (the series column's two values, in the order they
 * first appear), drawn as dots joined by a bar on a shared scale, rows sorted by the change.
 */
export function compareModel(spec: ChartSpec): CompareModel | ChartError {
	if (!spec.series) return fail("A comparison needs a series column with the two things compared, e.g. 2025 and 2026.");
	const names = seriesNames(spec);
	if (names.length !== 2) return fail(`A comparison needs exactly two series; the data has ${names.length}.`);
	const labels = [...new Set(spec.rows.map((r) => String(r[spec.x])))];
	const pairs: Array<{ label: string; a: number; b: number }> = [];
	for (const label of labels) {
		const get = (name: string) => spec.rows.find((r) => String(r[spec.x]) === label && String(r[spec.series as string]) === name)?.[spec.y];
		const a = get(names[0]);
		const b = get(names[1]);
		if (typeof a !== "number" || typeof b !== "number") return fail(`${label} needs a value for both ${names[0]} and ${names[1]}.`);
		pairs.push({ label, a, b });
	}
	const all = pairs.flatMap((p) => [p.a, p.b]);
	const ticks = niceTicks(Math.min(0, ...all), Math.max(...all));
	const lo = ticks[0];
	const hi = ticks[ticks.length - 1];
	const at = (v: number) => round(((v - lo) / (hi - lo)) * 100);
	const point = (value: number) => ({ value, at: at(value), text: formatValue(value, spec.yUnit) });
	return {
		ok: true,
		legend: [
			{ name: names[0], slot: 6 },
			{ name: names[1], slot: 1 },
		],
		rows: pairs
			.map((p) => ({ label: p.label, from: point(p.a), to: point(p.b), change: round(p.b - p.a, 10) }))
			.sort((x, y) => y.change - x.change),
	};
}
