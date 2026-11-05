// Public entry "emdash-folio/review-snapshot": for a site that builds its page's Review markup
// from the snapshot block's fields.
export { SNAPSHOT_TYPE } from "./block.ts";
export { parseScore, snapshotData, snapshotReview } from "./rules.ts";
export type { ItemType, SnapshotData, SnapshotLink } from "./rules.ts";
