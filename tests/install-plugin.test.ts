import { describe, expect, it } from "vitest";

import {
	createInstallPlan,
	parseInstallArgs,
	RELEASE_FILES,
} from "../scripts/install-plugin.mjs";

describe("install plugin helper", () => {
	it("plans the release files under the vault plugin folder", () => {
		const plan = createInstallPlan({
			repoRoot: "/repo/auto-toc",
			vaultPath: "/vaults/Notes",
		});

		expect(plan.pluginDir).toBe("/vaults/Notes/.obsidian/plugins/auto-toc");
		expect(plan.files).toEqual([
			{
				source: "/repo/auto-toc/main.js",
				destination: "/vaults/Notes/.obsidian/plugins/auto-toc/main.js",
			},
			{
				source: "/repo/auto-toc/manifest.json",
				destination: "/vaults/Notes/.obsidian/plugins/auto-toc/manifest.json",
			},
			{
				source: "/repo/auto-toc/styles.css",
				destination: "/vaults/Notes/.obsidian/plugins/auto-toc/styles.css",
			},
		]);
	});

	it("reads the vault path from a command-line flag", () => {
		expect(parseInstallArgs(["--vault", "/vaults/Notes"], {})).toBe("/vaults/Notes");
	});

	it("falls back to OBSIDIAN_VAULT", () => {
		expect(parseInstallArgs([], { OBSIDIAN_VAULT: "/vaults/Notes" })).toBe("/vaults/Notes");
	});

	it("requires a vault path", () => {
		expect(() => {
			parseInstallArgs([], {});
		}).toThrow("Missing vault path");
	});

	it("keeps the install artifact list explicit", () => {
		expect(RELEASE_FILES).toEqual(["main.js", "manifest.json", "styles.css"]);
	});
});
