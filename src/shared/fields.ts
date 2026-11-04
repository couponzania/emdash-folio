// Helpers for reading a block's saved fields, which arrive as unknown JSON.

/** A trimmed string, or "" for anything that isn't one. */
export const text = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

/** Only links to a place on the page, a path on the site, or an http(s) address; else "". */
export function safeHref(v: unknown): string {
	const href = text(v);
	return /^(#[\w-]+|\/(?!\/)\S*|https?:\/\/\S+)$/i.test(href) ? href : "";
}

/**
 * rel for a button that can lead to a shop: the host's /go/ redirects and links to other sites
 * are treated as paid links, as the host site marks its own offer links. Undefined otherwise.
 */
export function buttonRel(href: string): string | undefined {
	return /^(\/go\/|https?:\/\/)/i.test(href) ? "sponsored nofollow noopener noreferrer" : undefined;
}

/** A block field that holds a list of rows (a repeater), as plain objects. */
export function rowsOf(v: unknown): Array<Record<string, unknown>> {
	return Array.isArray(v) ? v.map((row) => (row ?? {}) as Record<string, unknown>) : [];
}
