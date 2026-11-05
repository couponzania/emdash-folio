// The pros and cons block's rules: both lists with their headings. Shown only with both lists,
// because a list of pros alone reads as an advert.
import { lines, text } from "../shared/fields.ts";

export const MAX_ITEMS = 10;

export interface ProsConsData {
	prosTitle: string;
	consTitle: string;
	pros: string[];
	cons: string[];
	show: boolean;
}

export function prosConsData(node: Record<string, unknown>): ProsConsData {
	const pros = lines(node.pros, MAX_ITEMS);
	const cons = lines(node.cons, MAX_ITEMS);
	return {
		prosTitle: text(node.prosTitle) || "What's good",
		consTitle: text(node.consTitle) || "What's not",
		pros,
		cons,
		show: pros.length > 0 && cons.length > 0,
	};
}
