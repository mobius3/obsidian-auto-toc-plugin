import { parseFrontmatterRendering } from "./frontmatter";
import { AutoTocSettings, PathOverride, RenderingSettings } from "./types";

export function resolveEffectiveSettings(
	settings: AutoTocSettings,
	vaultRelativePath: string,
	markdown = "",
): RenderingSettings {
	const normalizedPath = normalizePath(vaultRelativePath);
	const folderOverride = settings.folderOverridesEnabled
		? findLongestFolderMatch(settings.folderOverrides, normalizedPath)
		: undefined;
	const fileOverride = settings.fileOverridesEnabled
		? settings.fileOverrides.find((override) => normalizePath(override.path) === normalizedPath)
		: undefined;
	const frontmatterOverride = parseFrontmatterRendering(markdown);

	return {
		...settings.rendering,
		...folderOverride?.rendering,
		...fileOverride?.rendering,
		...frontmatterOverride,
	};
}

function findLongestFolderMatch(
	overrides: PathOverride[],
	filePath: string,
): PathOverride | undefined {
	let best: PathOverride | undefined;

	for (const override of overrides) {
		const prefix = normalizeFolderPrefix(override.path);
		if (filePath.startsWith(prefix) && (!best || prefix.length > normalizeFolderPrefix(best.path).length)) {
			best = override;
		}
	}

	return best;
}

function normalizePath(path: string): string {
	return path.replace(/\\/g, "/").replace(/^\/+/, "");
}

function normalizeFolderPrefix(path: string): string {
	const normalized = normalizePath(path).replace(/\/+$/, "");
	return normalized.length === 0 ? "" : `${normalized}/`;
}
