// Folio's plugin descriptor, for a site's astro.config.mjs:
//
//   import { folioPlugin } from "emdash-folio/plugin";
//   emdash({ plugins: [folioPlugin({ paidLinks: ["/go/"] })] })
//
// Plain JavaScript on purpose: the Astro config runs in Node, which does not strip types from
// files inside node_modules. Types are in plugin.d.ts.

export const FOLIO_PLUGIN_ID = "folio";
export const FOLIO_VERSION = "0.5.0";

/**
 * The EmDash plugin descriptor for Folio (native format).
 * @param {import("./plugin.d.ts").FolioOptions} [options]
 * @returns {import("./plugin.d.ts").FolioDescriptor}
 */
export function folioPlugin(options = {}) {
	return {
		id: FOLIO_PLUGIN_ID,
		version: FOLIO_VERSION,
		format: "native",
		entrypoint: "emdash-folio",
		componentsEntry: "emdash-folio/blocks",
		options: normalizeOptions(options),
	};
}

/**
 * Options as plain JSON (EmDash serialises them into the build): only string prefixes kept.
 * @param {unknown} options
 * @returns {{ paidLinks: string[] }}
 */
export function normalizeOptions(options) {
	const raw = options && typeof options === "object" ? /** @type {Record<string, unknown>} */ (options).paidLinks : undefined;
	const paidLinks = Array.isArray(raw) ? raw.filter((p) => typeof p === "string" && p.trim() !== "").map((p) => p.trim()) : [];
	return { paidLinks };
}

export default folioPlugin;
