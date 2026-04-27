import {
	AutoTocSettings,
	Bullet,
	DEFAULT_AUTO_TOC_SETTINGS,
	DEFAULT_RENDERING_SETTINGS,
	PathOverride,
	RenderingSettings,
} from "./core/types";

const VALID_BULLETS = new Set<string>(["-", "*", "+"]);

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

function normalizeRendering(raw: unknown): RenderingSettings {
	if (typeof raw !== "object" || raw === null) {
		return { ...DEFAULT_RENDERING_SETTINGS };
	}

	const input = raw as Record<string, unknown>;
	const rawDepth = input.depth;
	const rawBullet = input.bullet;

	const depth = clamp(
		typeof rawDepth === "number"
			? rawDepth
			: typeof rawDepth === "string"
				? Number(rawDepth)
				: DEFAULT_RENDERING_SETTINGS.depth,
		1,
		6,
	);

	const bullet = typeof rawBullet === "string" && VALID_BULLETS.has(rawBullet)
		? (rawBullet as Bullet)
		: DEFAULT_RENDERING_SETTINGS.bullet;

	return { depth, bullet };
}

export function normalizeSettings(partial: Partial<AutoTocSettings>): AutoTocSettings {
	const autoUpdate = typeof partial.autoUpdate === "boolean"
		? partial.autoUpdate
		: DEFAULT_AUTO_TOC_SETTINGS.autoUpdate;

	const updateDelay = typeof partial.updateDelay === "number"
		? Math.max(1000, partial.updateDelay)
		: DEFAULT_AUTO_TOC_SETTINGS.updateDelay;

	const folderOverridesEnabled = typeof partial.folderOverridesEnabled === "boolean"
		? partial.folderOverridesEnabled
		: DEFAULT_AUTO_TOC_SETTINGS.folderOverridesEnabled;

	const fileOverridesEnabled = typeof partial.fileOverridesEnabled === "boolean"
		? partial.fileOverridesEnabled
		: DEFAULT_AUTO_TOC_SETTINGS.fileOverridesEnabled;

	return {
		autoUpdate,
		updateDelay,
		rendering: normalizeRendering(partial.rendering),
		folderOverridesEnabled,
		folderOverrides: normalizeOverrides(partial.folderOverrides),
		fileOverridesEnabled,
		fileOverrides: normalizeOverrides(partial.fileOverrides),
	};
}

function normalizeOverrides(raw: unknown): PathOverride[] {
	if (!Array.isArray(raw)) {
		return [];
	}

	return raw
		.map(normalizeOverride)
		.filter((override): override is PathOverride => override !== null);
}

function normalizeOverride(raw: unknown): PathOverride | null {
	if (typeof raw !== "object" || raw === null) {
		return null;
	}

	const input = raw as Record<string, unknown>;
	if (typeof input.path !== "string" || input.path.trim().length === 0) {
		return null;
	}

	return {
		path: input.path.trim().replace(/\\/g, "/"),
		rendering: normalizePartialRendering(input.rendering),
	};
}

function normalizePartialRendering(raw: unknown): Partial<RenderingSettings> {
	if (typeof raw !== "object" || raw === null) {
		return {};
	}

	const input = raw as Record<string, unknown>;
	const rendering: Partial<RenderingSettings> = {};

	if (input.depth !== undefined) {
		rendering.depth = normalizeRendering({ depth: input.depth }).depth;
	}

	if (typeof input.bullet === "string" && VALID_BULLETS.has(input.bullet)) {
		rendering.bullet = input.bullet as Bullet;
	}

	return rendering;
}
