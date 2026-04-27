import { describe, expect, it } from "vitest";

import { DEFAULT_RENDERING_SETTINGS } from "../../src/core/types";
import { updateCurrentNoteContent } from "../../src/commands/update-current-note-content";

describe("updateCurrentNoteContent", () => {
	const settings = DEFAULT_RENDERING_SETTINGS;

	it("reports when no TOC callout is found", () => {
		expect(updateCurrentNoteContent("# Note", settings)).toEqual({
			markdown: "# Note",
			notice: "No TOC callout found.",
			shouldWrite: false,
		});
	});

	it("reports when content is already current", () => {
		const markdown = [
			"# Note",
			"",
			"> [!toc]",
			"> - [[#A|A]]",
			"",
			"## A",
		].join("\n");

		expect(updateCurrentNoteContent(markdown, settings)).toEqual({
			markdown,
			notice: "Table of contents already up to date.",
			shouldWrite: false,
		});
	});

	it("returns updated markdown and a concise notice", () => {
		const markdown = [
			"# Note",
			"",
			"> [!toc]",
			"> old",
			"",
			"## A",
		].join("\n");

		expect(updateCurrentNoteContent(markdown, settings)).toEqual({
			markdown: [
				"# Note",
				"",
				"> [!toc]",
				"> - [[#A|A]]",
				"",
				"## A",
			].join("\n"),
			notice: "Updated 1 table of contents.",
			shouldWrite: true,
		});
	});

	it("includes the file path in updated notices when available", () => {
		const markdown = [
			"# Note",
			"",
			"> [!toc]",
			"> old",
			"",
			"## A",
		].join("\n");

		expect(updateCurrentNoteContent(markdown, settings, "Projects/Plan.md").notice).toBe(
			"Updated 1 table of contents in Projects/Plan.md.",
		);
	});
});
