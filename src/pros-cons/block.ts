// The pros and cons block as the editor sees it: two lists, one item per line.
import type { PortableTextBlockConfig } from "emdash";

export const PROS_CONS_TYPE = "folioProsCons";

export const prosConsBlock: PortableTextBlockConfig = {
	type: PROS_CONS_TYPE,
	label: "Pros and cons",
	description: "What's good and what's not, side by side",
	category: "Folio",
	fields: [
		{ type: "text_input", action_id: "pros", label: "Pros, one per line", multiline: true, placeholder: "Fastest page loads in our test\nFree site moves" },
		{ type: "text_input", action_id: "cons", label: "Cons, one per line", multiline: true, placeholder: "No monthly plan on the cheapest tier" },
		{ type: "text_input", action_id: "prosTitle", label: "Pros heading (optional)", placeholder: "What's good" },
		{ type: "text_input", action_id: "consTitle", label: "Cons heading (optional)", placeholder: "What's not" },
	],
};
