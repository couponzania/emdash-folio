// The metric cards block's rules: up to four cards that have both a number and a label, and a
// source that is shown only with a name.
import { rowsOf, safeHref, text } from "../shared/fields.ts";

export const MAX_METRICS = 4;

export interface Metric {
	value: string;
	label: string;
	context: string;
}

export interface MetricsData {
	cards: Metric[];
	source?: { name: string; href?: string };
}

export function metricsData(node: Record<string, unknown>): MetricsData {
	const cards = rowsOf(node.cards)
		.map((r) => ({ value: text(r.value), label: text(r.label), context: text(r.context) }))
		.filter((c) => c.value !== "" && c.label !== "")
		.slice(0, MAX_METRICS);
	const name = text(node.sourceName);
	const href = safeHref(node.sourceLink);
	return { cards, ...(name ? { source: { name, ...(href ? { href } : {}) } } : {}) };
}
