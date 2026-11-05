// Helpers for reading a block's saved fields, which arrive as unknown JSON.

/** A trimmed string, or "" for anything that isn't one. */
export const text = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

/** Only links to a place on the page, a path on the site, or an http(s) address; else "". */
export function safeHref(v: unknown): string {
	const href = text(v);
	return /^(#[\w-]+|\/(?!\/)\S*|https?:\/\/\S+)$/i.test(href) ? href : "";
}

/**
 * rel for a button whose link starts with one of the site's paid link prefixes (the
 * `paidLinks` option, e.g. ["/go/", "https://"]): marked as a paid link. Undefined otherwise.
 */
export function buttonRel(href: string, paidLinks: readonly string[]): string | undefined {
	const h = href.toLowerCase();
	return paidLinks.some((p) => p !== "" && h.startsWith(p.toLowerCase())) ? "sponsored nofollow noopener noreferrer" : undefined;
}

/** A block field that holds a list of rows (a repeater), as plain objects. */
export function rowsOf(v: unknown): Array<Record<string, unknown>> {
	return Array.isArray(v) ? v.map((row) => (row ?? {}) as Record<string, unknown>) : [];
}
