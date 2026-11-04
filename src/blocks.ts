// Folio's site renderers (the plugin descriptor's componentsEntry). EmDash merges these into
// every <PortableText>; the export name is required by EmDash.
import Chart from "./chart/Chart.astro";
import { CHART_TYPE } from "./chart/block.ts";
import Snapshot from "./review-snapshot/Snapshot.astro";
import { SNAPSHOT_TYPE } from "./review-snapshot/block.ts";
import SaleCalendar from "./sale-calendar/SaleCalendar.astro";
import { SALE_CALENDAR_TYPE } from "./sale-calendar/block.ts";

export const blockComponents = {
	[SALE_CALENDAR_TYPE]: SaleCalendar,
	[SNAPSHOT_TYPE]: Snapshot,
	[CHART_TYPE]: Chart,
};
