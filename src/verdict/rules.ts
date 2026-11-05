// The verdict block's rules: the pick is required; the label has a default.
import { text } from "../shared/fields.ts";

export interface VerdictData {
	kicker: string;
	pick: string;
	why: string;
	catch: string;
}

export function verdictData(node: Record<string, unknown>): VerdictData {
	return { kicker: text(node.kicker) || "Our verdict", pick: text(node.pick), why: text(node.why), catch: text(node.catch) };
}
