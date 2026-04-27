import { findTocCallouts } from "./callouts";
import { extractHeadings, selectHeadingsForCallout } from "./headings";
import { renderTocBody } from "./render";
import {
	DEFAULT_RENDERING_SETTINGS,
	RenderingSettings,
	TocCalloutRange,
	UpdateResult,
} from "./types";

export function updateMarkdown(
	markdown: string,
	baseSettings: RenderingSettings = DEFAULT_RENDERING_SETTINGS,
): UpdateResult {
	const callouts = findTocCallouts(markdown);
	if (callouts.length === 0) {
		return {
			changed: false,
			markdown,
			count: 0,
			found: 0,
		};
	}

	const headings = extractHeadings(markdown, callouts);
	let nextMarkdown = markdown;
	let changedCount = 0;

	for (const callout of [...callouts].reverse()) {
		const settings = resolveSettings(baseSettings, callout);
		const selectedHeadings = selectHeadingsForCallout(headings, callout, settings);
		const renderedBody = renderTocBody(selectedHeadings, settings);
		const indentedBody = renderedBody
			? renderedBody.split("\n").map((line) => `${callout.indent}${line}`).join("\n")
			: "";
		const replacement = withTrailingSeparator(
			indentedBody ? `${callout.firstLine}\n${indentedBody}` : callout.firstLine,
			markdown.slice(callout.end),
		);
		const existing = markdown.slice(callout.start, callout.end);

		if (existing !== replacement) {
			changedCount++;
			nextMarkdown = `${nextMarkdown.slice(0, callout.start)}${replacement}${nextMarkdown.slice(callout.end)}`;
		}
	}

	return {
		changed: nextMarkdown !== markdown,
		markdown: nextMarkdown,
		count: changedCount,
		found: callouts.length,
	};
}

function withTrailingSeparator(replacement: string, followingMarkdown: string): string {
	if (followingMarkdown.length === 0 || followingMarkdown.startsWith("\n\n")) {
		return replacement;
	}

	if (followingMarkdown.startsWith("\n")) {
		return `${replacement}\n`;
	}

	return `${replacement}\n\n`;
}

function resolveSettings(
	baseSettings: RenderingSettings,
	callout: TocCalloutRange,
): RenderingSettings {
	return {
		...baseSettings,
		...callout.query,
	};
}
