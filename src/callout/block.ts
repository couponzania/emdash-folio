// The callout block as the editor sees it: a kind, an optional title and the text.
import type { PortableTextBlockConfig } from "emdash";

export const CALLOUT_TYPE = "folioCallout";

export const calloutBlock: PortableTextBlockConfig = {
	type: CALLOUT_TYPE,
	label: "Callout",
	description: "A tip, a warning or a standout finding, set apart from the text",
	category: "Folio",
	fields: [
		{
			type: "select",
			action_id: "kind",
			label: "Kind",
			options: [
				{ label: "Tip: non obvious advice", value: "tip" },
				{ label: "Warning: a real risk", value: "warning" },
				{ label: "Insight: a standout finding", value: "insight" },
			],
		},
		{ type: "text_input", action_id: "title", label: "Title (optional)", placeholder: "Tip" },
		{ type: "text_input", action_id: "text", label: "Text", multiline: true, placeholder: "Sign in before you add items." },
	],
};
