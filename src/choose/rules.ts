// The "choose A or B" and "who it's for" blocks' rules: two cards, each a heading and a list.
// Both blocks need both cards; one card alone isn't a choice (or hides who it's not for).
import { lines, text } from "../shared/fields.ts";

export const MAX_REASONS = 8;

export interface PairCard {
	title: string;
	items: string[];
}

export interface PairData {
	first: PairCard;
	second: PairCard;
	show: boolean;
}

const pair = (first: PairCard, second: PairCard): PairData => ({
	first,
	second,
	show: first.items.length > 0 && second.items.length > 0,
});

export function chooseData(node: Record<string, unknown>): PairData {
	const a = text(node.aName);
	const b = text(node.bName);
	return pair(
		{ title: a ? `Choose ${a} if` : "", items: lines(node.aReasons, MAX_REASONS) },
		{ title: b ? `Choose ${b} if` : "", items: lines(node.bReasons, MAX_REASONS) },
	);
}

export function audienceData(node: Record<string, unknown>): PairData {
	return pair(
		{ title: text(node.forTitle) || "Good for", items: lines(node.forList, MAX_REASONS) },
		{ title: text(node.notTitle) || "Not for", items: lines(node.notList, MAX_REASONS) },
	);
}
