import { describe, expect, it } from "vitest";

import { resolveEffectiveSettings } from "../../src/core/effective-settings";
import { AutoTocSettings, DEFAULT_AUTO_TOC_SETTINGS } from "../../src/core/types";

describe("resolveEffectiveSettings", () => {
	const base: AutoTocSettings = {
		...DEFAULT_AUTO_TOC_SETTINGS,
		rendering: { depth: 3, bullet: "-" },
	};

	it("returns vault rendering when no overrides match", () => {
		expect(resolveEffectiveSettings(base, "notes/project.md")).toEqual({
			depth: 3,
			bullet: "-",
		});
	});

	it("applies a matching folder override", () => {
		const settings: AutoTocSettings = {
			...base,
			folderOverrides: [{ path: "notes/", rendering: { depth: 2 } }],
		};

		expect(resolveEffectiveSettings(settings, "notes/project.md")).toEqual({
			depth: 2,
			bullet: "-",
		});
	});

	it("ignores folder overrides when disabled", () => {
		const settings: AutoTocSettings = {
			...base,
			folderOverridesEnabled: false,
			folderOverrides: [{ path: "notes/", rendering: { depth: 2 } }],
		};

		expect(resolveEffectiveSettings(settings, "notes/project.md")).toEqual({
			depth: 3,
			bullet: "-",
		});
	});

	it("uses the longest matching folder prefix", () => {
		const settings: AutoTocSettings = {
			...base,
			folderOverrides: [
				{ path: "notes/", rendering: { depth: 1 } },
				{ path: "notes/projects/", rendering: { depth: 2 } },
			],
		};

		expect(resolveEffectiveSettings(settings, "notes/projects/deep.md")).toEqual({
			depth: 2,
			bullet: "-",
		});
	});

	it("applies an exact file override over a folder override", () => {
		const settings: AutoTocSettings = {
			...base,
			folderOverrides: [{ path: "notes/", rendering: { depth: 1 } }],
			fileOverrides: [{ path: "notes/special.md", rendering: { depth: 5, bullet: "*" } }],
		};

		expect(resolveEffectiveSettings(settings, "notes/special.md")).toEqual({
			depth: 5,
			bullet: "*",
		});
	});

	it("ignores file overrides when disabled", () => {
		const settings: AutoTocSettings = {
			...base,
			fileOverridesEnabled: false,
			fileOverrides: [{ path: "notes/special.md", rendering: { depth: 5, bullet: "*" } }],
		};

		expect(resolveEffectiveSettings(settings, "notes/special.md")).toEqual({
			depth: 3,
			bullet: "-",
		});
	});

	it("merges partial overrides with vault defaults", () => {
		const settings: AutoTocSettings = {
			...base,
			folderOverrides: [{ path: "docs/", rendering: { bullet: "*" } }],
		};

		expect(resolveEffectiveSettings(settings, "docs/readme.md")).toEqual({
			depth: 3,
			bullet: "*",
		});
	});

	it("normalizes path separators to forward slashes", () => {
		const settings: AutoTocSettings = {
			...base,
			folderOverrides: [{ path: "notes/", rendering: { depth: 1 } }],
		};

		expect(resolveEffectiveSettings(settings, "notes\\project.md")).toEqual({
			depth: 1,
			bullet: "-",
		});
	});

	it("applies frontmatter over folder and file overrides", () => {
		const settings: AutoTocSettings = {
			...base,
			folderOverrides: [{ path: "notes/", rendering: { depth: 1, bullet: "+" } }],
			fileOverrides: [{ path: "notes/special.md", rendering: { depth: 5 } }],
		};

		const markdown = [
			"---",
			"auto-toc.depth: 2",
			"auto-toc.bullet: \"*\"",
			"---",
			"",
			"# Note",
		].join("\n");

		expect(resolveEffectiveSettings(settings, "notes/special.md", markdown)).toEqual({
			depth: 2,
			bullet: "*",
		});
	});

	it("merges partial frontmatter over lower-precedence settings", () => {
		const settings: AutoTocSettings = {
			...base,
			fileOverrides: [{ path: "notes/special.md", rendering: { depth: 5, bullet: "+" } }],
		};

		const markdown = [
			"---",
			"auto-toc.bullet: \"*\"",
			"---",
			"",
			"# Note",
		].join("\n");

		expect(resolveEffectiveSettings(settings, "notes/special.md", markdown)).toEqual({
			depth: 5,
			bullet: "*",
		});
	});
});
