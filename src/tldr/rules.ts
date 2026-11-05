// The TL;DR block's rules: a title (with a default) and up to six points.
import { lines, text } from "../shared/fields.ts";

export const MAX_TLDR_POINTS = 6;

export interface TldrData {
	title: string;
	points: string[];
}

export function tldrData(node: Record<string, unknown>): TldrData {
	return { title: text(node.title) || "The short version", points: lines(node.points, MAX_TLDR_POINTS) };
}
