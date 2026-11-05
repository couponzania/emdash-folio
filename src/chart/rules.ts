// The chart block's rules: read the pasted data, check it against the chosen chart, and lay out
// lay out each kind: bars as HTML rows, a line as a stretched SVG plot with HTML labels, a donut
// as SVG arcs. All positions come from fixed formulas, so they can be tested.
import { safeHref, text } from "../shared/fields.ts";
import { parseGrid } from "../shared/grid.ts";

export const CHART_KINDS = ["bar", "line", "donut", "column", "stacked", "area", "compare"] as const;
export type ChartKind = (typeof CHART_KINDS)[number];

export const MAX_ROWS = 500;
export const MAX_DONUT_SLICES = 6;
export const MAX_BAR_SERIES = 4;
export const MAX_LINE_SERIES = 6;
export const MAX_X_LABELS = 8;

export type Cell = string | number | null;
export type ChartRow = Record<string, Cell>;

export interface ChartSpec {
	ok: true;
	kind: ChartKind;
	rows: ChartRow[];
	x: string;
	y: string;
	series?: string;
	title: string;
	alt: string;
	caption: string;
	source?: { name: string; href?: string };
	yUnit: string;
	/** Stacked bars only: "share" draws every bar as 100%; otherwise bars keep their totals. */
	stackMode: "total" | "share";
}

export interface ChartError {
	ok: false;
	reason: string;
}

/** A table pasted as CSV, from a spreadsheet (tabs) or with semicolons. The first row names the columns. */
export function parseTable(input: string): { columns: string[]; rows: Array<Record<string, string>> } {
	const filled = parseGrid(input);
	if (filled.length === 0) return { columns: [], rows: [] };
	const columns = filled[0];
	return { columns, rows: filled.slice(1).map((r) => Object.fromEntries(columns.map((c, i) => [c, r[i] ?? ""]))) };
}

/** A number as people paste it: "1,234.5", "$44.95", "₹20,000", "29.8%". Null for anything else. */
export function toNumber(input: string): number | null {
	const s = input.trim().replace(/^[$₹€£¥]\s*/, "").replace(/%$/, "").replace(/,/g, "").trim();
	return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : null;
}

export const fail = (reason: string): ChartError => ({ ok: false, reason });

/** Reads and checks the block's fields. Never throws: a problem comes back as a reason. */
export function chartSpec(node: Record<string, unknown>): ChartSpec | ChartError {
	const kind = text(node.kind) || "bar";
	if (!(CHART_KINDS as readonly string[]).includes(kind)) return fail(`Unknown chart type "${kind}".`);
	const alt = text(node.description);
	if (alt === "") return fail("The chart needs a description: one sentence saying what it shows.");

	const table = parseTable(typeof node.data === "string" ? node.data : "");
	if (table.rows.length === 0) return fail("The chart has no data rows.");
	if (table.rows.length > MAX_ROWS) return fail(`Too many rows: ${table.rows.length} (at most ${MAX_ROWS}).`);
	const column = (given: string) => table.columns.find((c) => c.toLowerCase() === given.toLowerCase());

	const xName = text(node.x);
	const yName = text(node.y);
	const seriesName = text(node.series);
	if (xName === "") return fail("Name the column along the x axis.");
	if (yName === "") return fail("Name the column of values.");
	const x = column(xName);
	if (!x) return fail(`No column named "${xName}" in the data.`);
	const y = column(yName);
	if (!y) return fail(`No column named "${yName}" in the data.`);
	const series = seriesName ? column(seriesName) : undefined;
	if (seriesName && !series) return fail(`No column named "${seriesName}" in the data.`);

	const overTime = kind === "line";
	const numericX = (overTime || kind === "area") && table.rows.every((r) => /^-?\d+(\.\d+)?$/.test(r[x]));
	const rows: ChartRow[] = [];
	for (const [i, r] of table.rows.entries()) {
		const raw = r[y];
		let value: number | null = null;
		if (raw === "") {
			if (!overTime) return fail(`Row ${i + 1}: ${y} is empty.`);
		} else {
			value = toNumber(raw);
			if (value === null) return fail(`Row ${i + 1}: "${raw}" in ${y} is not a number.`);
		}
		rows.push({ [x]: numericX ? Number(r[x]) : r[x], ...(series ? { [series]: r[series] } : {}), [y]: value });
	}

	const sourceName = text(node.sourceName);
	const sourceHref = safeHref(node.sourceLink);
	return {
		ok: true,
		kind: kind as ChartKind,
		rows,
		x,
		y,
		...(series ? { series } : {}),
		title: text(node.title),
		alt,
		caption: text(node.caption),
		...(sourceName ? { source: { name: sourceName, ...(sourceHref ? { href: sourceHref } : {}) } } : {}),
		yUnit: text(node.yUnit),
		stackMode: text(node.stackMode) === "share" ? "share" : "total",
	};
}

export interface DonutSlice {
	label: string;
	value: number;
	percent: string;
	slot: number;
	path: string;
}

export interface DonutModel {
	ok: true;
	total: number;
	slices: DonutSlice[];
	top: DonutSlice;
}

// The donut's fixed geometry in a 200 by 200 view box.
const CX = 100;
const CY = 100;
const R_OUT = 80;
const R_IN = 50;

const num = (n: number) => {
	const r = Math.round(n * 100) / 100;
	return String(Object.is(r, -0) ? 0 : r);
};

/** A point at `turn` (0 to 1, clockwise from 12 o'clock) on a circle of radius r. */
function at(turn: number, r: number): string {
	const a = turn * 2 * Math.PI;
	return `${num(CX + r * Math.sin(a))} ${num(CY - r * Math.cos(a))}`;
}

function arcPath(from: number, to: number): string {
	if (to - from >= 1) {
		// A full ring: two half circles out, two back in, filled even-odd.
		return `M ${at(0, R_OUT)} A ${R_OUT} ${R_OUT} 0 1 1 ${at(0.5, R_OUT)} A ${R_OUT} ${R_OUT} 0 1 1 ${at(0, R_OUT)} M ${at(0, R_IN)} A ${R_IN} ${R_IN} 0 1 0 ${at(0.5, R_IN)} A ${R_IN} ${R_IN} 0 1 0 ${at(0, R_IN)} Z`;
	}
	const large = to - from > 0.5 ? 1 : 0;
	return `M ${at(from, R_OUT)} A ${R_OUT} ${R_OUT} 0 ${large} 1 ${at(to, R_OUT)} L ${at(to, R_IN)} A ${R_IN} ${R_IN} 0 ${large} 0 ${at(from, R_IN)} Z`;
}

function percentText(share: number): string {
	const n = share >= 10 ? Math.round(share) : Math.round(share * 10) / 10;
	return `${n}%`;
}

/** A donut from a checked spec: one slice per row, in the author's order, palette slots 1 to 6. */
export function donutModel(spec: ChartSpec): DonutModel | ChartError {
	if (spec.rows.length > MAX_DONUT_SLICES) return fail("A donut reads badly past six slices; use a bar chart.");
	const values = spec.rows.map((r) => Number(r[spec.y] ?? 0));
	if (values.some((v) => v < 0)) return fail("A donut can't show negative values.");
	const total = values.reduce((s, v) => s + v, 0);
	if (total <= 0) return fail("The values add up to zero.");
	let start = 0;
	const slices = spec.rows.map((r, i) => {
		const turn = values[i] / total;
		const slice = { label: String(r[spec.x] ?? ""), value: values[i], percent: percentText(turn * 100), slot: i + 1, path: arcPath(start, start + turn) };
		start += turn;
		return slice;
	});
	const top = slices.reduce((a, b) => (b.value > a.value ? b : a));
	return { ok: true, total, slices, top };
}

export const CURRENCY = new Set(["$", "₹", "€", "£", "¥"]);

/** A value for display: thousands separators, at most two decimals, and the unit where people put it. */
export function formatValue(n: number, unit: string): string {
	const s = n.toLocaleString("en-US", { maximumFractionDigits: 2 });
	if (unit === "") return s;
	if (unit === "%") return `${s}%`;
	if (CURRENCY.has(unit)) return n < 0 ? `-${unit}${s.slice(1)}` : `${unit}${s}`;
	return `${s} ${unit}`;
}

export const round = (n: number, places = 2) => {
	const f = 10 ** places;
	const r = Math.round(n * f) / f;
	return Object.is(r, -0) ? 0 : r;
};

/** Axis ticks on round steps (1, 2, 2.5, 5 times a power of ten) from at or below min to at or above max. */
export function niceTicks(min: number, max: number): number[] {
	if (min === max) return [min, min + 1];
	const rough = (max - min) / 5;
	const mag = 10 ** Math.floor(Math.log10(rough));
	const norm = rough / mag;
	const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
	const lo = Math.floor(min / step + 1e-9) * step;
	const hi = Math.ceil(max / step - 1e-9) * step;
	const ticks: number[] = [];
	for (let i = 0; lo + i * step <= hi + step / 1e6; i++) ticks.push(round(lo + i * step, 10));
	return ticks;
}

export interface LegendItem {
	name: string;
	slot: number;
}

export interface BarModel {
	ok: true;
	legend: LegendItem[];
	rows: Array<{ label: string; bars: Array<{ series: string; slot: number; value: number; percent: number; text: string }> }>;
}

/** Horizontal bars: one row per category in the author's order, a bar per series inside it. */
export function barModel(spec: ChartSpec): BarModel | ChartError {
	if (spec.rows.some((r) => Number(r[spec.y]) < 0)) return fail("Bars here start at zero; for values below zero use a line chart.");
	const names = spec.series ? [...new Set(spec.rows.map((r) => String(r[spec.series as string])))] : [];
	if (names.length > MAX_BAR_SERIES) return fail(`Too many series for bars: ${names.length} (at most ${MAX_BAR_SERIES}).`);
	const slot = (name: string) => (spec.series ? names.indexOf(name) + 1 : 1);
	const max = Math.max(0, ...spec.rows.map((r) => Number(r[spec.y])));
	const rows: BarModel["rows"] = [];
	for (const r of spec.rows) {
		const label = String(r[spec.x]);
		const series = spec.series ? String(r[spec.series]) : "";
		const value = Number(r[spec.y]);
		let row = rows.find((x) => x.label === label);
		if (!row) {
			row = { label, bars: [] };
			rows.push(row);
		}
		row.bars.push({ series, slot: slot(series), value, percent: max > 0 ? round((value / max) * 100) : 0, text: formatValue(value, spec.yUnit) });
	}
	return { ok: true, legend: names.map((name, i) => ({ name, slot: i + 1 })), rows };
}

/** The gap, in percent of the plot's width, a phone needs between two x labels. */
export const PHONE_LABEL_GAP = 25;

/** Marks labels a phone can't fit: keep the first, then each one far enough from the last kept; the last always stays. */
export function phoneLabels(labels: Array<{ label: string; percent: number }>): Array<{ label: string; percent: number; minor: boolean }> {
	const out = labels.map((l) => ({ ...l, minor: true }));
	let kept = -Infinity;
	out.forEach((l, i) => {
		if (i === 0 || l.percent - kept >= PHONE_LABEL_GAP) {
			l.minor = false;
			kept = l.percent;
		}
	});
	const last = out[out.length - 1];
	if (last && last.minor) {
		last.minor = false;
		const before = out.slice(1, -1).reverse().find((l) => !l.minor);
		if (before && last.percent - before.percent < PHONE_LABEL_GAP) before.minor = true;
	}
	return out;
}

export interface LineModel {
	ok: true;
	legend: LegendItem[];
	/** A word unit ("billion") named once above the axis; "" when ticks carry the unit themselves. */
	unitNote: string;
	yTicks: Array<{ value: number; label: string; percent: number }>;
	/** `minor` labels sit too close to a kept neighbour for a phone; the renderer hides them there. */
	xLabels: Array<{ label: string; percent: number; minor: boolean }>;
	series: Array<{ name: string; slot: number; segments: string[]; points: Array<{ left: number; top: number; text: string; label: string }> }>;
}

/**
 * A line chart on a 1000 by 1000 plot that the page stretches to its box (so text never scales):
 * `segments` are polyline points in plot units, split at gaps; tick, label and point positions
 * are percentages for HTML placed over it. Numbers on x are spread by value, text evenly.
 */
export function lineModel(spec: ChartSpec): LineModel | ChartError {
	const xs: Cell[] = [...new Set(spec.rows.map((r) => r[spec.x]))];
	if (xs.length < 2) return fail("A line needs at least two points along the x axis.");
	const names = spec.series ? [...new Set(spec.rows.map((r) => String(r[spec.series as string])))] : [""];
	if (names.length > MAX_LINE_SERIES) return fail(`Too many lines: ${names.length} (at most ${MAX_LINE_SERIES}).`);

	const numeric = xs.every((x) => typeof x === "number");
	const [xMin, xMax] = numeric ? [Math.min(...(xs as number[])), Math.max(...(xs as number[]))] : [0, xs.length - 1];
	const pos = (x: Cell) => (numeric ? ((x as number) - xMin) / (xMax - xMin) : xs.indexOf(x) / (xs.length - 1));

	const values = spec.rows.map((r) => r[spec.y]).filter((v): v is number => typeof v === "number");
	if (values.length === 0) return fail("The chart has no values to draw.");
	const ticks = niceTicks(Math.min(0, ...values), Math.max(...values));
	const yLo = ticks[0];
	const yHi = ticks[ticks.length - 1];
	const down = (v: number) => (yHi - v) / (yHi - yLo);

	const step = xs.length > MAX_X_LABELS ? Math.ceil((xs.length - 1) / (MAX_X_LABELS - 1)) : 1;
	const picked = xs.filter((_, i) => i % step === 0);
	if (picked[picked.length - 1] !== xs[xs.length - 1]) picked[picked.length - 1] = xs[xs.length - 1];

	const wordUnit = spec.yUnit !== "" && spec.yUnit !== "%" && !CURRENCY.has(spec.yUnit);
	return {
		ok: true,
		legend: spec.series ? names.map((name, i) => ({ name, slot: i + 1 })) : [],
		unitNote: wordUnit ? spec.yUnit : "",
		yTicks: ticks.map((value) => ({ value, label: formatValue(value, wordUnit ? "" : spec.yUnit), percent: round(down(value) * 100) })),
		xLabels: phoneLabels(picked.map((x) => ({ label: String(x), percent: round(pos(x) * 100) }))),
		series: names.map((name, i) => {
			const rows = spec.rows.filter((r) => !spec.series || String(r[spec.series]) === name);
			const segments: string[] = [];
			let current: string[] = [];
			const points: LineModel["series"][number]["points"] = [];
			for (const r of rows) {
				const v = r[spec.y];
				if (typeof v !== "number") {
					if (current.length) segments.push(current.join(" "));
					current = [];
					continue;
				}
				const p = pos(r[spec.x]);
				current.push(`${round(p * 1000)},${round(down(v) * 1000)}`);
				points.push({ left: round(p * 100), top: round(down(v) * 100), text: formatValue(v, spec.yUnit), label: String(r[spec.x]) });
			}
			if (current.length) segments.push(current.join(" "));
			return { name, slot: i + 1, segments, points };
		}),
	};
}
