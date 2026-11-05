// Folio: article blocks for EmDash. A native plugin (register it with folioPlugin() from
// "emdash-folio/plugin") that adds editor blocks with fields to rich text, rendered on the
// server by the components in blocks.ts.
//
// Independence rule: nothing in this package imports from a host site. Styles use --folio-*
// variables, which a site can set (or map to its own tokens).
import { definePlugin } from "emdash";

import { calloutBlock } from "./callout/block.ts";
import { chartBlock } from "./chart/block.ts";
import { audienceBlock } from "./choose/audience-block.ts";
import { chooseBlock } from "./choose/block.ts";
import { metricsBlock } from "./metrics/block.ts";
import { FOLIO_PLUGIN_ID, FOLIO_VERSION } from "./plugin.js";
import { prosConsBlock } from "./pros-cons/block.ts";
import { snapshotBlock } from "./review-snapshot/block.ts";
import { saleCalendarBlock } from "./sale-calendar/block.ts";
import { setFolioOptions } from "./shared/options.ts";
import { stepsBlock } from "./steps/block.ts";
import { tableBlock } from "./table/block.ts";
import { timelineBlock } from "./timeline/block.ts";
import { tldrBlock } from "./tldr/block.ts";
import { verdictBlock } from "./verdict/block.ts";

export { FOLIO_PLUGIN_ID, FOLIO_VERSION };

/** Called by EmDash with the descriptor's options when the site starts. */
export function createPlugin(options: unknown = {}) {
	setFolioOptions(options);
	return definePlugin({
		id: FOLIO_PLUGIN_ID,
		version: FOLIO_VERSION,
		admin: {
			portableTextBlocks: [
				tldrBlock,
				stepsBlock,
				calloutBlock,
				metricsBlock,
				chartBlock,
				tableBlock,
				timelineBlock,
				prosConsBlock,
				verdictBlock,
				chooseBlock,
				audienceBlock,
				snapshotBlock,
				saleCalendarBlock,
			],
		},
	});
}

export default createPlugin;
