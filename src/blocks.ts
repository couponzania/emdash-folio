// Folio's site renderers (the plugin descriptor's componentsEntry). EmDash merges these into
// every <PortableText>; the export name is required by EmDash.
import Callout from "./callout/Callout.astro";
import { CALLOUT_TYPE } from "./callout/block.ts";
import Chart from "./chart/Chart.astro";
import { CHART_TYPE } from "./chart/block.ts";
import Audience from "./choose/Audience.astro";
import { AUDIENCE_TYPE } from "./choose/audience-block.ts";
import Choose from "./choose/Choose.astro";
import { CHOOSE_TYPE } from "./choose/block.ts";
import Metrics from "./metrics/Metrics.astro";
import { METRICS_TYPE } from "./metrics/block.ts";
import ProsCons from "./pros-cons/ProsCons.astro";
import { PROS_CONS_TYPE } from "./pros-cons/block.ts";
import Snapshot from "./review-snapshot/Snapshot.astro";
import { SNAPSHOT_TYPE } from "./review-snapshot/block.ts";
import SaleCalendar from "./sale-calendar/SaleCalendar.astro";
import { SALE_CALENDAR_TYPE } from "./sale-calendar/block.ts";
import Steps from "./steps/Steps.astro";
import { STEPS_TYPE } from "./steps/block.ts";
import Table from "./table/Table.astro";
import { TABLE_TYPE } from "./table/block.ts";
import Timeline from "./timeline/Timeline.astro";
import { TIMELINE_TYPE } from "./timeline/block.ts";
import Tldr from "./tldr/Tldr.astro";
import { TLDR_TYPE } from "./tldr/block.ts";
import Verdict from "./verdict/Verdict.astro";
import { VERDICT_TYPE } from "./verdict/block.ts";

export const blockComponents = {
	[SALE_CALENDAR_TYPE]: SaleCalendar,
	[SNAPSHOT_TYPE]: Snapshot,
	[CHART_TYPE]: Chart,
	[TLDR_TYPE]: Tldr,
	[STEPS_TYPE]: Steps,
	[CALLOUT_TYPE]: Callout,
	[METRICS_TYPE]: Metrics,
	[TIMELINE_TYPE]: Timeline,
	[TABLE_TYPE]: Table,
	[PROS_CONS_TYPE]: ProsCons,
	[VERDICT_TYPE]: Verdict,
	[CHOOSE_TYPE]: Choose,
	[AUDIENCE_TYPE]: Audience,
};
