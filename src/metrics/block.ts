// The metric cards block as the editor sees it: 2 to 4 cards and the source.
import type { PortableTextBlockConfig } from "emdash";

export const METRICS_TYPE = "folioMetrics";

export const metricsBlock: PortableTextBlockConfig = {
	type: METRICS_TYPE,
	label: "Metric cards",
	description: "2 to 4 headline numbers with their source",
	category: "Folio",
	fields: [
		{
			type: "repeater",
			action_id: "cards",
			label: "Cards",
			item_label: "Card",
			min_items: 2,
			fields: [
				{ type: "text_input", action_id: "value", label: "Number", placeholder: "88%" },
				{ type: "text_input", action_id: "label", label: "What it is", placeholder: "Shoppers who used a coupon" },
				{ type: "text_input", action_id: "context", label: "Context (optional)", placeholder: "in the last year" },
			],
		},
		{ type: "text_input", action_id: "sourceName", label: "Source", placeholder: "Survey of 2,000 shoppers, 2026" },
		{ type: "text_input", action_id: "sourceLink", label: "Source link (optional)", placeholder: "https://…" },
	],
};
