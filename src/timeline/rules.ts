// The timeline block's rules: events in the order typed (dates are shown as written, never
// guessed or re-sorted); an event needs a date and what happened.
import { rowsOf, text } from "../shared/fields.ts";

export const MAX_EVENTS = 30;

export interface TimelineEvent {
	date: string;
	title: string;
	text: string;
}

export interface TimelineData {
	title: string;
	events: TimelineEvent[];
}

export function timelineData(node: Record<string, unknown>): TimelineData {
	const events = rowsOf(node.events)
		.map((r) => ({ date: text(r.date), title: text(r.title), text: text(r.text) }))
		.filter((e) => e.date !== "" && e.title !== "")
		.slice(0, MAX_EVENTS);
	return { title: text(node.title), events };
}
