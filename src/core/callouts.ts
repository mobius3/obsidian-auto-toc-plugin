import { Bullet, RenderingSettings, TocCalloutRange, TocMode } from "./types";

const TOC_MARKER_PATTERN = /^(\s*)>\s*\[!([^\]\s]+)\]([+-])?(?:\s.*)?$/;

export function findTocCallouts(markdown: string): TocCalloutRange[] {
	const lines = splitLinesWithOffsets(markdown);
	const callouts: TocCalloutRange[] = [];

	for (let index = 0; index < lines.length; index++) {
		const line = lines[index];
		if (!line) {
			continue;
		}

		const parsed = parseTocMarker(line.text);
		if (!parsed) {
			continue;
		}

		let bodyEndLine = index + 1;
		while (bodyEndLine < lines.length && /^\s*>/.test(lines[bodyEndLine]?.text ?? "")) {
			bodyEndLine++;
		}

		const bodyStart = lines[index + 1]?.start ?? line.end;
		const bodyEnd = lines[bodyEndLine - 1]?.end ?? line.end;
		const adjustedBodyEnd = bodyEndLine > index + 1 ? trimTrailingNewline(markdown, bodyEnd) : bodyStart;

		callouts.push({
			start: line.start,
			end: adjustedBodyEnd,
			firstLine: line.text,
			bodyStart,
			bodyEnd: adjustedBodyEnd,
			indent: parsed.indent,
			mode: parsed.mode,
			query: parsed.query,
		});
	}

	return callouts;
}

interface Line {
	text: string;
	start: number;
	end: number;
}

function splitLinesWithOffsets(markdown: string): Line[] {
	const lines: Line[] = [];
	const pattern = /.*(?:\n|$)/g;
	let match: RegExpExecArray | null;

	while ((match = pattern.exec(markdown)) !== null) {
		const rawLine = match[0];
		if (rawLine === "") {
			break;
		}

		const start = match.index;
		const end = start + rawLine.length;
		lines.push({
			text: rawLine.endsWith("\n") ? rawLine.slice(0, -1) : rawLine,
			start,
			end,
		});

		if (end === markdown.length) {
			break;
		}
	}

	return lines;
}

function trimTrailingNewline(markdown: string, offset: number): number {
	return markdown[offset - 1] === "\n" ? offset - 1 : offset;
}

interface ParsedMarker {
	indent: string;
	mode: TocMode;
	query: Partial<RenderingSettings>;
}

function parseTocMarker(line: string): ParsedMarker | null {
	const match = line.match(TOC_MARKER_PATTERN);
	if (!match) {
		return null;
	}

	const indent = match[1] ?? "";
	const marker = match[2];
	if (!marker) {
		return null;
	}

	const [baseAndMode = "", queryString] = marker.split("?", 2);
	const [base, hash] = baseAndMode.split("#", 2);
	if (base !== "toc") {
		return null;
	}

	return {
		indent,
		mode: hash === "master" ? "master" : "local",
		query: parseQuery(queryString),
	};
}

function parseQuery(queryString: string | undefined): Partial<RenderingSettings> {
	if (!queryString) {
		return {};
	}

	const query: Partial<RenderingSettings> = {};

	for (const pair of queryString.split("&")) {
		const [key, value] = pair.split("=", 2);
		if (key === "depth") {
			const depth = Number(value);
			if (Number.isInteger(depth) && depth >= 1 && depth <= 6) {
				query.depth = depth;
			}
		}

		if (key === "bullet" && isBullet(value)) {
			query.bullet = value;
		}
	}

	return query;
}

function isBullet(value: string | undefined): value is Bullet {
	return value === "-" || value === "*" || value === "+";
}
