import { getIgnoredRanges, isInRanges } from "./ignored-ranges";
import { Heading, RenderingSettings, TocCalloutRange } from "./types";

const ATX_HEADING_PATTERN = /^\s*(#{1,6})\s+(.+?)\s*#*\s*$/;

export function extractHeadings(markdown: string, tocCallouts: TocCalloutRange[]): Heading[] {
	const ignoredRanges = getIgnoredRanges(markdown, tocCallouts);
	const headings: Heading[] = [];
	const lines = markdown.matchAll(/.*(?:\n|$)/g);

	for (const match of lines) {
		const rawLine = match[0];
		if (rawLine === "") {
			break;
		}

		const line = rawLine.endsWith("\n") ? rawLine.slice(0, -1) : rawLine;
		if (/^\s*>/.test(line) || isInRanges(match.index, ignoredRanges)) {
			continue;
		}

		const headingMatch = line.match(ATX_HEADING_PATTERN);
		const marker = headingMatch?.[1];
		const text = headingMatch?.[2];
		if (!marker || !text) {
			continue;
		}

		headings.push({
			depth: marker.length,
			text: text.trim(),
			offset: match.index,
		});
	}

	return headings;
}

export function selectHeadingsForCallout<THeading extends Heading>(
	headings: readonly THeading[],
	callout: TocCalloutRange,
	settings: RenderingSettings,
): THeading[] {
	if (callout.mode === "master") {
		return headings.filter((heading) => heading.depth <= settings.depth);
	}

	const ownerHeading = [...headings].reverse().find((heading) => heading.offset < callout.start);
	if (!ownerHeading) {
		return headings.filter((heading) => heading.depth <= settings.depth);
	}

	const maxDepth = Math.min(6, ownerHeading.depth + settings.depth);
	const scopedHeadings: THeading[] = [];

	for (const heading of headings) {
		if (heading.offset <= callout.start) {
			continue;
		}

		if (heading.depth <= ownerHeading.depth) {
			break;
		}

		if (heading.depth <= maxDepth) {
			scopedHeadings.push(heading);
		}
	}

	return scopedHeadings;
}
