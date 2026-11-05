// The callout block's rules: one of three kinds, each with its default title and icon.
import { text } from "../shared/fields.ts";

export const CALLOUT_KINDS = {
	tip: { title: "Tip", icon: "i" },
	warning: { title: "Watch out", icon: "!" },
	insight: { title: "What we found", icon: "★" },
} as const;

export type CalloutKind = keyof typeof CALLOUT_KINDS;

export interface CalloutData {
	kind: CalloutKind;
	title: string;
	icon: string;
	text: string;
}

/** An unknown kind is a tip. */
export function calloutData(node: Record<string, unknown>): CalloutData {
	const raw = text(node.kind);
	const kind: CalloutKind = Object.hasOwn(CALLOUT_KINDS, raw) ? (raw as CalloutKind) : "tip";
	const k = CALLOUT_KINDS[kind];
	return { kind, title: text(node.title) || k.title, icon: k.icon, text: text(node.text) };
}
