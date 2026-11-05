// The steps block as the editor sees it: a title, the total time and one row per step.
import type { PortableTextBlockConfig } from "emdash";

export const STEPS_TYPE = "folioSteps";

export const stepsBlock: PortableTextBlockConfig = {
	type: STEPS_TYPE,
	label: "Steps",
	description: "A numbered process; also gives the page its HowTo markup",
	category: "Folio",
	fields: [
		{ type: "text_input", action_id: "title", label: "What the steps do", placeholder: "How to apply a coupon code" },
		{ type: "text_input", action_id: "minutes", label: "Total time in minutes (optional)", placeholder: "2" },
		{
			type: "repeater",
			action_id: "steps",
			label: "Steps, in order",
			item_label: "Step",
			min_items: 2,
			fields: [
				{ type: "text_input", action_id: "name", label: "Step", placeholder: "Copy the code" },
				{ type: "text_input", action_id: "text", label: "What to do", multiline: true, placeholder: "Open the offer and tap Copy." },
			],
		},
	],
};
