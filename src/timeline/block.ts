// The timeline block as the editor sees it: an optional title and the events in order.
import type { PortableTextBlockConfig } from "emdash";

export const TIMELINE_TYPE = "folioTimeline";

export const timelineBlock: PortableTextBlockConfig = {
	type: TIMELINE_TYPE,
	label: "Timeline",
	description: "Dated events in order",
	category: "Folio",
	fields: [
		{ type: "text_input", action_id: "title", label: "Title (optional)", placeholder: "How the sale grew" },
		{
			type: "repeater",
			action_id: "events",
			label: "Events, in the order to show",
			item_label: "Event",
			min_items: 2,
			fields: [
				{ type: "text_input", action_id: "date", label: "When", placeholder: "Nov 2025" },
				{ type: "text_input", action_id: "title", label: "What happened", placeholder: "Biggest Black Friday yet" },
				{ type: "text_input", action_id: "text", label: "More (optional)", multiline: true, placeholder: "Deals ran for ten days instead of four." },
			],
		},
	],
};
