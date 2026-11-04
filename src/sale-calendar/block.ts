// The sale calendar block as the editor sees it: one row per sale, in calendar order.
// The fields' action_ids are the keys saleCalendarRows() reads.
import type { PortableTextBlockConfig } from "emdash";

export const SALE_CALENDAR_TYPE = "folioSaleCalendar";

export const saleCalendarBlock: PortableTextBlockConfig = {
	type: SALE_CALENDAR_TYPE,
	label: "Sale calendar",
	description: "A brand's sales with their usual windows; next dates and status update by themselves every year",
	category: "Folio",
	fields: [
		{
			type: "repeater",
			action_id: "rows",
			label: "Sales, in calendar order",
			item_label: "Sale",
			min_items: 1,
			fields: [
				{ type: "text_input", action_id: "name", label: "Sale name", placeholder: "Black Friday Sale" },
				{
					type: "text_input",
					action_id: "when",
					label: "Usually runs",
					placeholder: "16 Jul to 31 Jul, or around 25 Dec, or not regular: Around Diwali (seen 2025)",
				},
				{ type: "text_input", action_id: "bestFor", label: "Best for", placeholder: "Student laptops" },
				{ type: "text_input", action_id: "link", label: "Link (optional)", placeholder: "#black-friday-sale" },
			],
		},
	],
};
