// The "who it's for" block as the editor sees it: who it suits and, always, who it doesn't.
import type { PortableTextBlockConfig } from "emdash";

export const AUDIENCE_TYPE = "folioAudience";

export const audienceBlock: PortableTextBlockConfig = {
	type: AUDIENCE_TYPE,
	label: "Who it's for",
	description: "Who it suits and who it doesn't; both lists are required",
	category: "Folio",
	fields: [
		{ type: "text_input", action_id: "forList", label: "Good for, one per line", multiline: true, placeholder: "Small business sites" },
		{ type: "text_input", action_id: "notList", label: "Not for, one per line (required)", multiline: true, placeholder: "Developers who want root access" },
		{ type: "text_input", action_id: "forTitle", label: "First heading (optional)", placeholder: "Good for" },
		{ type: "text_input", action_id: "notTitle", label: "Second heading (optional)", placeholder: "Not for" },
	],
};
