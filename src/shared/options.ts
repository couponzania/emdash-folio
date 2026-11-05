// The site's Folio options, set once by createPlugin() when EmDash starts the plugin, read by
// the block components when they render. Kept on globalThis under a registered symbol so a
// second copy of this module (two bundles of one package) still sees the same options.
import { normalizeOptions } from "../plugin.js";

export interface ResolvedFolioOptions {
	paidLinks: string[];
}

const KEY = Symbol.for("emdash-folio.options");
type Holder = { [KEY]?: ResolvedFolioOptions };

export function setFolioOptions(options: unknown): void {
	(globalThis as Holder)[KEY] = normalizeOptions(options);
}

export function folioOptions(): ResolvedFolioOptions {
	return (globalThis as Holder)[KEY] ?? { paidLinks: [] };
}
