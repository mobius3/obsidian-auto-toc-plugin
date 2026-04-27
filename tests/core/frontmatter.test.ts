import { describe, expect, it } from "vitest";

import { parseFrontmatterRendering } from "../../src/core/frontmatter";

describe("parseFrontmatterRendering", () => {
	it("returns empty overrides when there is no frontmatter", () => {
		expect(parseFrontmatterRendering("# Note\n\n> [!toc]\n")).toEqual({});
	});

	it("parses canonical dotted kebab-case keys", () => {
		const markdown = [
			"---",
			"auto-toc.depth: 2",
			"auto-toc.bullet: \"*\"",
			"---",
			"",
			"# Note",
		].join("\n");

		expect(parseFrontmatterRendering(markdown)).toEqual({
			depth: 2,
			bullet: "*",
		});
	});

	it("parses canonical keys regardless of quote style", () => {
		const markdown = [
			"---",
			"auto-toc.depth: '4'",
			"auto-toc.bullet: '+'",
			"---",
			"",
		].join("\n");

		expect(parseFrontmatterRendering(markdown)).toEqual({
			depth: 4,
			bullet: "+",
		});
	});

	it("ignores invalid canonical values", () => {
		const markdown = [
			"---",
			"auto-toc.depth: 0",
			"auto-toc.bullet: 1",
			"---",
			"",
		].join("\n");

		expect(parseFrontmatterRendering(markdown)).toEqual({});
	});

	it("accepts nested auto-toc aliases", () => {
		const markdown = [
			"---",
			"auto-toc:",
			"  depth: 5",
			"  bullet: -",
			"---",
			"",
		].join("\n");

		expect(parseFrontmatterRendering(markdown)).toEqual({
			depth: 5,
			bullet: "-",
		});
	});

	it("accepts nested autoToc aliases", () => {
		const markdown = [
			"---",
			"autoToc:",
			"  depth: 1",
			"  bullet: +",
			"---",
			"",
		].join("\n");

		expect(parseFrontmatterRendering(markdown)).toEqual({
			depth: 1,
			bullet: "+",
		});
	});
});
