// The steps block's rules: the steps in order, the total time, and the HowTo markup built from
// the same fields, so the page and its schema can't disagree.
import { rowsOf, text } from "../shared/fields.ts";

export const MAX_STEPS = 20;

export interface Step {
	name: string;
	text: string;
}

export interface StepsData {
	title: string;
	minutes: number | null;
	timeText: string;
	steps: Step[];
}

/** Whole minutes from 1 to 10,080 (a week); anything else is no time. */
export function parseMinutes(v: unknown): number | null {
	const m = /^\d+$/.exec(text(v));
	if (!m) return null;
	const n = Number(m[0]);
	return n >= 1 && n <= 10080 ? n : null;
}

/** "about 2 minutes", "about 1 hour 30 minutes". */
export function minutesText(n: number): string {
	const h = Math.floor(n / 60);
	const m = n % 60;
	const parts = [h > 0 && `${h} hour${h === 1 ? "" : "s"}`, m > 0 && `${m} minute${m === 1 ? "" : "s"}`].filter(Boolean);
	return `about ${parts.join(" ")}`;
}

/** ISO 8601 duration for schema.org: PT2M, PT1H30M. */
export function minutesIso(n: number): string {
	const h = Math.floor(n / 60);
	const m = n % 60;
	return `PT${h > 0 ? `${h}H` : ""}${m > 0 ? `${m}M` : ""}`;
}

/** A step needs a name or a text; a step with only text uses its text on the page. */
export function stepsData(node: Record<string, unknown>): StepsData {
	const steps = rowsOf(node.steps)
		.map((r) => ({ name: text(r.name), text: text(r.text) }))
		.filter((s) => s.name !== "" || s.text !== "")
		.slice(0, MAX_STEPS);
	const minutes = parseMinutes(node.minutes);
	return { title: text(node.title), minutes, timeText: minutes === null ? "" : minutesText(minutes), steps };
}

/**
 * The HowTo's own part of the markup (the site adds @id, url and so on), or null without a
 * title or with fewer than 2 steps.
 */
export function stepsHowTo(node: Record<string, unknown>) {
	const d = stepsData(node);
	if (d.title === "" || d.steps.length < 2) return null;
	return {
		"@type": "HowTo",
		name: d.title,
		...(d.minutes === null ? {} : { totalTime: minutesIso(d.minutes) }),
		step: d.steps.map((s, i) => ({
			"@type": "HowToStep",
			position: i + 1,
			name: s.name || s.text,
			text: s.text || s.name,
		})),
	};
}
