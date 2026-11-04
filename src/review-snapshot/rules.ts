// The review snapshot block's rules: the verdict card at the top of a review, and the Review
// markup built from the same fields, so the page and its schema can't disagree.
import { rowsOf, safeHref, text } from "../shared/fields.ts";

export const ITEM_TYPES = ["Organization", "Product", "SoftwareApplication"] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

export interface SnapshotLink {
	label: string;
	href: string;
}

export interface SnapshotData {
	itemName: string;
	itemType: ItemType;
	verdict: string;
	score: number | null;
	scoreText: string;
	stats: Array<{ value: string; label: string }>;
	scores: Array<{ label: string; score: number; text: string; percent: number }>;
	skip: string;
	checked: string;
	note: string;
	cta: SnapshotLink | null;
	more: SnapshotLink | null;
}

/** A score on the 0 to 10 scale ("8.7", 8.7 or "8.7/10"), to one decimal; null if it isn't one. */
export function parseScore(v: unknown): number | null {
	const raw = typeof v === "number" ? String(v) : text(v).replace(/\s*\/\s*10$/, "");
	if (!/^\d+(\.\d+)?$/.test(raw)) return null;
	const n = Math.round(Number(raw) * 10) / 10;
	return n >= 0 && n <= 10 ? n : null;
}

const scoreText = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

function link(label: unknown, href: unknown): SnapshotLink | null {
	const l = text(label);
	const h = safeHref(href);
	return l !== "" && h !== "" ? { label: l, href: h } : null;
}

/** The block's fields, cleaned: incomplete rows and unsafe links are left out. */
export function snapshotData(node: Record<string, unknown>): SnapshotData {
	const scores = rowsOf(node.scores).flatMap((row) => {
		const label = text(row.label);
		const score = parseScore(row.score);
		return label !== "" && score !== null ? [{ label, score, text: scoreText(score), percent: Math.round(score * 10) }] : [];
	});
	const average = scores.length ? Math.round((scores.reduce((s, r) => s + r.score, 0) / scores.length) * 10) / 10 : null;
	const score = parseScore(node.score) ?? average;
	const type = text(node.itemType);
	return {
		itemName: text(node.itemName),
		itemType: (ITEM_TYPES as readonly string[]).includes(type) ? (type as ItemType) : "Organization",
		verdict: text(node.verdict),
		score,
		scoreText: score === null ? "" : scoreText(score),
		stats: rowsOf(node.stats).flatMap((row) => {
			const value = text(row.value);
			const label = text(row.label);
			return value !== "" && label !== "" ? [{ value, label }] : [];
		}),
		scores,
		skip: text(node.skip),
		checked: text(node.checked),
		note: text(node.note),
		cta: link(node.ctaLabel, node.ctaLink),
		more: link(node.moreLabel, node.moreLink),
	};
}

/**
 * The Review markup's own part, from the block's fields. The site adds the review's @id, url,
 * author, publisher and dates. Null when there's no reviewed item's name or no score.
 */
export function snapshotReview(node: Record<string, unknown>) {
	const d = snapshotData(node);
	if (d.itemName === "" || d.score === null) return null;
	return {
		itemReviewed: { "@type": d.itemType, name: d.itemName },
		reviewRating: { "@type": "Rating", ratingValue: d.score, bestRating: 10, worstRating: 0 },
		...(d.verdict ? { reviewBody: d.verdict } : {}),
	};
}
