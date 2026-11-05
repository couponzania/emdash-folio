// The "choose A or B" block as the editor sees it: a name and reasons for each side.
import type { PortableTextBlockConfig } from "emdash";

export const CHOOSE_TYPE = "folioChoose";

export const chooseBlock: PortableTextBlockConfig = {
	type: CHOOSE_TYPE,
	label: "Choose A or B",
	description: "Who should pick each option, side by side",
	category: "Folio",
	fields: [
		{ type: "text_input", action_id: "aName", label: "First option", placeholder: "Store A" },
		{ type: "text_input", action_id: "aReasons", label: "Choose it if, one per line", multiline: true, placeholder: "You order small items often" },
		{ type: "text_input", action_id: "bName", label: "Second option", placeholder: "Store B" },
		{ type: "text_input", action_id: "bReasons", label: "Choose it if, one per line", multiline: true, placeholder: "You buy one big item a year" },
	],
};
