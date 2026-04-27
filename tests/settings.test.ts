import { describe, expect, it } from "vitest";

import { DEFAULT_AUTO_TOC_SETTINGS } from "../src/core/types";
import { normalizeSettings } from "../src/settings";

describe("normalizeSettings", () => {
	it("returns defaults when input is empty", () => {
		expect(normalizeSettings({})).toEqual(DEFAULT_AUTO_TOC_SETTINGS);
	});

	it("preserves valid settings", () => {
		const input = {
			autoUpdate: true,
			updateDelay: 5000,
			rendering: { depth: 2, bullet: "*" as const },
			folderOverridesEnabled: false,
			folderOverrides: [],
			fileOverridesEnabled: false,
			fileOverrides: [],
		};
		expect(normalizeSettings(input)).toEqual(input);
	});

	it("clamps depth to 1..6", () => {
		expect(normalizeSettings({ rendering: { depth: 0, bullet: "-" } }).rendering.depth).toBe(1);
		expect(normalizeSettings({ rendering: { depth: 9, bullet: "-" } }).rendering.depth).toBe(6);
	});

	it("falls back to default bullet for invalid values", () => {
		expect(normalizeSettings({ rendering: { depth: 3, bullet: "1" as unknown as "-" } }).rendering.bullet).toBe("-");
	});

	it("clamps updateDelay to a minimum of 1000", () => {
		expect(normalizeSettings({ updateDelay: 0 }).updateDelay).toBe(1000);
		expect(normalizeSettings({ updateDelay: 500 }).updateDelay).toBe(1000);
	});

	it("coerces string depth to number", () => {
		expect(normalizeSettings({ rendering: { depth: "4" as unknown as number, bullet: "-" } }).rendering.depth).toBe(4);
	});

	it("preserves autoUpdate false when explicitly set", () => {
		expect(normalizeSettings({ autoUpdate: false }).autoUpdate).toBe(false);
	});

	it("normalizes folder and file overrides", () => {
		expect(normalizeSettings({
			folderOverrides: [
				{ path: "notes\\", rendering: { depth: "2" as unknown as number, bullet: "*" } },
				{ path: "", rendering: { depth: 1 } },
			],
			fileOverrides: [
				{ path: "notes/special.md", rendering: { depth: 9, bullet: "1" as unknown as "-" } },
			],
		})).toMatchObject({
			folderOverrides: [
				{ path: "notes/", rendering: { depth: 2, bullet: "*" } },
			],
			fileOverrides: [
				{ path: "notes/special.md", rendering: { depth: 6 } },
			],
		});
	});
});
