import { Bullet, RenderingSettings } from "./types";

const VALID_BULLETS = new Set<string>(["-", "*", "+"]);

export function parseFrontmatterRendering(markdown: string): Partial<RenderingSettings> {
	const frontmatter = extractFrontmatter(markdown);
	if (frontmatter === null) {
		return {};
	}

	const values = readFrontmatterValues(frontmatter);
	const rendering: Partial<RenderingSettings> = {};

	const depth = parseDepth(values.get("auto-toc.depth") ?? values.get("autoToc.depth"));
	if (depth !== undefined) {
		rendering.depth = depth;
	}

	const bullet = parseBullet(values.get("auto-toc.bullet") ?? values.get("autoToc.bullet"));
	if (bullet !== undefined) {
		rendering.bullet = bullet;
	}

	return rendering;
}

function extractFrontmatter(markdown: string): string | null {
	if (!markdown.startsWith("---\n")) {
		return null;
	}

	const end = markdown.indexOf("\n---", 4);
	if (end < 0) {
		return null;
	}

	return markdown.slice(4, end);
}

function readFrontmatterValues(frontmatter: string): Map<string, string> {
	const values = new Map<string, string>();
	let parent: string | null = null;

	for (const line of frontmatter.split("\n")) {
		if (line.trim().length === 0 || line.trimStart().startsWith("#")) {
			continue;
		}

		const nested = /^([ \t]+)([^:]+):\s*(.*)$/.exec(line);
		if (nested && parent !== null) {
			const key = nested[2];
			const value = nested[3];
			if (key !== undefined && value !== undefined) {
				values.set(`${parent}.${key.trim()}`, cleanScalar(value));
			}
			continue;
		}

		const topLevel = /^([^:]+):\s*(.*)$/.exec(line);
		if (!topLevel) {
			parent = null;
			continue;
		}

		const rawKey = topLevel[1];
		const rawValue = topLevel[2];
		if (rawKey === undefined || rawValue === undefined) {
			parent = null;
			continue;
		}

		const key = rawKey.trim();
		const value = cleanScalar(rawValue);

		if (value.length === 0) {
			parent = key;
		} else {
			parent = null;
			values.set(key, value);
		}
	}

	return values;
}

function cleanScalar(value: string): string {
	const trimmed = value.trim();
	if (
		(trimmed.startsWith("\"") && trimmed.endsWith("\""))
		|| (trimmed.startsWith("'") && trimmed.endsWith("'"))
	) {
		return trimmed.slice(1, -1).trim();
	}
	return trimmed;
}

function parseDepth(value: string | undefined): number | undefined {
	if (value === undefined) {
		return undefined;
	}

	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed < 1 || parsed > 6) {
		return undefined;
	}

	return parsed;
}

function parseBullet(value: string | undefined): Bullet | undefined {
	if (value === undefined || !VALID_BULLETS.has(value)) {
		return undefined;
	}

	return value as Bullet;
}
