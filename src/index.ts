// Folio: CouponZania's article blocks for EmDash. A native plugin (listed under
// emdash({ plugins }) in astro.config.mjs) that adds editor blocks with fields to rich text,
// rendered on the server by the components in blocks.ts.
//
// Independence rule: nothing in this package imports from the site's src/. The site may
// import from Folio, never the other way round. Styles use --folio-* variables that fall back
// to the site's --cz-* tokens.
import { definePlugin } from "emdash";

import { snapshotBlock } from "./review-snapshot/block.ts";
import { saleCalendarBlock } from "./sale-calendar/block.ts";

export const FOLIO_PLUGIN_ID = "folio";
export const FOLIO_VERSION = "0.2.0";

export function createPlugin() {
	return definePlugin({
		id: FOLIO_PLUGIN_ID,
		version: FOLIO_VERSION,
		admin: {
			portableTextBlocks: [saleCalendarBlock, snapshotBlock],
		},
	});
}

export default createPlugin;
