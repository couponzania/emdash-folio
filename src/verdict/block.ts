// The verdict block as the editor sees it: the pick, why, and the catch.
import type { PortableTextBlockConfig } from "emdash";

export const VERDICT_TYPE = "folioVerdict";

export const verdictBlock: PortableTextBlockConfig = {
	type: VERDICT_TYPE,
	label: "Verdict",
	description: "A stated position in a comparison or best list (reviews use the review snapshot)",
	category: "Folio",
	fields: [
		{ type: "text_input", action_id: "pick", label: "Our pick, in one sentence", placeholder: "Pick Store A for everyday orders." },
		{ type: "text_input", action_id: "why", label: "Why", multiline: true, placeholder: "It had working codes on more days and free returns." },
		{ type: "text_input", action_id: "catch", label: "The catch (optional)", multiline: true, placeholder: "Store B wins on big ticket electronics during its sales." },
		{ type: "text_input", action_id: "kicker", label: "Label (optional)", placeholder: "Our verdict" },
	],
};
