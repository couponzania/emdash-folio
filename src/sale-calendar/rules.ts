// The sale calendar block's rules: each row keeps a recurring window, and the next dates and
// status are worked out for "today" whenever the page renders, so the table rolls into the next
// year on its own. Ported from the WordPress [czania_sale_calendar] shortcode (removed with
// WordPress on 2026-10-30), with plain English windows added next to its old formats.
//
// A row's "Usually runs" (`when`) is one of:
//   16 Jul to 31 Jul         a fixed window (may cross new year: 20 Dec to 5 Jan)
//   around 25 Dec            around a day: always Expected, never Live
//   not regular: {text}      no recurring window yet; the text is shown as is
// Old formats still read: 07-16..07-31, ~12-25, none: {text}. Anything else is kept as text.

export interface Day {
	y: number;
	m: number;
	d: number;
}

export type Window = { type: "fixed"; sm: number; sd: number; em: number; ed: number } | { type: "around"; m: number; d: number } | { type: "none"; text: string };

export type Status = "live" | "expected" | "none";

export type Run = { status: "none" } | { status: "live" | "expected"; start: Day; end: Day };

export interface SaleCalendarRow {
	name: string;
	bestFor: string;
	href: string;
	usual: string;
	next: string;
	status: Status;
	statusLabel: string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const STATUS_LABELS: Record<Status, string> = { live: "Live now", expected: "Expected", none: "Not announced" };

const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const daysIn = (y: number, m: number) => [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1] ?? 0;

/** A real month and day in some year (a leap year, so 29 Feb counts). */
const validMonthDay = (m: number, d: number) => m >= 1 && m <= 12 && d >= 1 && d <= daysIn(2024, m);

function monthOf(name: string): number {
	const i = MONTHS.findIndex((mo) => mo.toLowerCase() === name.slice(0, 3).toLowerCase());
	// Accept "Jul" and "July", not "Julius".
	if (i < 0 || name.length > 9) return 0;
	return i + 1;
}

function asText(spec: string): Window {
	return { type: "none", text: spec };
}

/** Reads a row's "Usually runs" text. Never guesses: unreadable text stays text. */
export function parseWhen(input: string): Window {
	const spec = input.trim();
	let m: RegExpExecArray | null;

	if ((m = /^(\d{2})-(\d{2})\.\.(\d{2})-(\d{2})$/.exec(spec))) {
		const [sm, sd, em, ed] = m.slice(1).map(Number);
		return validMonthDay(sm, sd) && validMonthDay(em, ed) ? { type: "fixed", sm, sd, em, ed } : asText(spec);
	}
	if ((m = /^~(\d{2})-(\d{2})$/.exec(spec))) {
		const [mo, d] = m.slice(1).map(Number);
		return validMonthDay(mo, d) ? { type: "around", m: mo, d } : asText(spec);
	}
	if ((m = /^(\d{1,2})\s+([a-z]+)\.?\s+to\s+(\d{1,2})\s+([a-z]+)\.?$/i.exec(spec))) {
		const sd = Number(m[1]);
		const sm = monthOf(m[2]);
		const ed = Number(m[3]);
		const em = monthOf(m[4]);
		return validMonthDay(sm, sd) && validMonthDay(em, ed) ? { type: "fixed", sm, sd, em, ed } : asText(spec);
	}
	if ((m = /^around\s+(\d{1,2})\s+([a-z]+)\.?$/i.exec(spec))) {
		const d = Number(m[1]);
		const mo = monthOf(m[2]);
		return validMonthDay(mo, d) ? { type: "around", m: mo, d } : asText(spec);
	}
	if ((m = /^(?:none|not regular)\s*:?\s*([\s\S]*)$/i.exec(spec))) return asText(m[1].trim());
	return asText(spec);
}

/** A month and day in a given year; 29 Feb becomes 28 Feb outside leap years. */
function dateIn(y: number, m: number, d: number): Day {
	return { y, m, d: Math.min(d, daysIn(y, m)) };
}

const serial = (day: Day) => Date.UTC(day.y, day.m - 1, day.d) / 86_400_000;

/** The run that is going on today, or the next one. */
export function nextRun(window: Window, today: Day): Run {
	const now = serial(today);
	if (window.type === "around") {
		let on = dateIn(today.y, window.m, window.d);
		if (serial(on) < now) on = dateIn(today.y + 1, window.m, window.d);
		return { status: "expected", start: on, end: on };
	}
	if (window.type !== "fixed") return { status: "none" };

	const crosses = window.em < window.sm || (window.em === window.sm && window.ed < window.sd);
	// A window crossing new year may have started last year and still be running.
	for (const y of [today.y - 1, today.y, today.y + 1]) {
		const start = dateIn(y, window.sm, window.sd);
		const end = dateIn(crosses ? y + 1 : y, window.em, window.ed);
		if (serial(end) < now) continue;
		return { status: serial(start) <= now ? "live" : "expected", start, end };
	}
	return { status: "none" };
}

const md = (m: number, d: number) => `${d} ${MONTHS[m - 1]}`;
const mdy = (day: Day) => `${md(day.m, day.d)} ${day.y}`;

/** The "Usually runs" column. */
export function usualLabel(window: Window): string {
	if (window.type === "fixed") return `${md(window.sm, window.sd)} to ${md(window.em, window.ed)}`;
	if (window.type === "around") return `Around ${md(window.m, window.d)}`;
	return window.text !== "" ? window.text : "No fixed window yet";
}

/** The "Next dates" column. */
export function nextLabel(run: Run): string {
	if (run.status === "none") return "Not announced";
	const { start, end } = run;
	if (serial(start) === serial(end)) return `Around ${mdy(start)}`;
	return start.y === end.y ? `${md(start.m, start.d)} to ${mdy(end)}` : `${mdy(start)} to ${mdy(end)}`;
}

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** Only links to a place on the page, a path on the site, or an http(s) address. */
function safeHref(v: unknown): string {
	const href = text(v);
	return /^(#[\w-]+|\/(?!\/)\S*|https?:\/\/\S+)$/i.test(href) ? href : "";
}

/** The block's rows, worked out for today, in the order the author wrote them. */
export function saleCalendarRows(node: Record<string, unknown>, today: Day): SaleCalendarRow[] {
	if (!Array.isArray(node.rows)) return [];
	return node.rows.flatMap((raw) => {
		const row = (raw ?? {}) as Record<string, unknown>;
		const name = text(row.name);
		if (name === "") return [];
		const window = parseWhen(text(row.when));
		const run = nextRun(window, today);
		return [{ name, bestFor: text(row.bestFor), href: safeHref(row.link), usual: usualLabel(window), next: nextLabel(run), status: run.status, statusLabel: STATUS_LABELS[run.status] }];
	});
}

/** Today's calendar day in a timezone; an unknown timezone falls back to UTC. */
export function todayIn(timeZone: string, now: number = Date.now()): Day {
	let parts: Intl.DateTimeFormatPart[];
	try {
		parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
	} catch {
		parts = new Intl.DateTimeFormat("en-CA", { timeZone: "UTC", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
	}
	const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
	return { y: get("year"), m: get("month"), d: get("day") };
}
