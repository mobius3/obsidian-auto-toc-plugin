import { Range, TocCalloutRange } from "./types";

export function getIgnoredRanges(markdown: string, tocCallouts: TocCalloutRange[]): Range[] {
	return [
		...getFrontmatterRanges(markdown),
		...getFencedCodeRanges(markdown),
		...tocCallouts,
	];
}

export function isInRanges(offset: number, ranges: Range[]): boolean {
	return ranges.some((range) => offset >= range.start && offset < range.end);
}

function getFrontmatterRanges(markdown: string): Range[] {
	if (!markdown.startsWith("---\n")) {
		return [];
	}

	const end = markdown.indexOf("\n---", 4);
	if (end < 0) {
		return [];
	}

	const afterClosingLine = markdown.indexOf("\n", end + 1);
	return [
		{
			start: 0,
			end: afterClosingLine < 0 ? markdown.length : afterClosingLine + 1,
		},
	];
}

function getFencedCodeRanges(markdown: string): Range[] {
	const ranges: Range[] = [];
	const lines = markdown.matchAll(/.*(?:\n|$)/g);
	let inFence = false;
	let fenceStart = 0;

	for (const match of lines) {
		const rawLine = match[0];
		if (rawLine === "") {
			break;
		}

		const line = rawLine.endsWith("\n") ? rawLine.slice(0, -1) : rawLine;
		if (/^\s*(```|~~~)/.test(line)) {
			if (inFence) {
				ranges.push({ start: fenceStart, end: match.index + rawLine.length });
				inFence = false;
			} else {
				fenceStart = match.index;
				inFence = true;
			}
		}
	}

	if (inFence) {
		ranges.push({ start: fenceStart, end: markdown.length });
	}

	return ranges;
}
