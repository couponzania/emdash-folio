export interface FolioOptions {
	/**
	 * Link prefixes that lead to a paid or affiliate destination, e.g. ["/go/", "https://"].
	 * A Folio button whose link starts with one gets rel="sponsored nofollow noopener noreferrer".
	 * Default: none.
	 */
	paidLinks?: string[];
}

export interface FolioDescriptor {
	id: string;
	version: string;
	format: "native";
	entrypoint: string;
	componentsEntry: string;
	options: { paidLinks: string[] };
}

export declare const FOLIO_PLUGIN_ID: string;
export declare const FOLIO_VERSION: string;
export declare function folioPlugin(options?: FolioOptions): FolioDescriptor;
export declare function normalizeOptions(options: unknown): { paidLinks: string[] };
export default folioPlugin;
