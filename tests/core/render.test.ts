import { describe, expect, it } from "vitest";

import { renderTocBody } from "../../src/core/render";

describe("renderTocBody", () => {
	it("renders a blockquoted nested Markdown list with wikilinks", () => {
		const body = renderTocBody([
			{ depth: 2, text: "A", offset: 0 },
			{ depth: 3, text: "B", offset: 1 },
			{ depth: 2, text: "C", offset: 2 },
		], { depth: 3, bullet: "-" });

		expect(body).toBe([
			"> - [[#A|A]]",
			">   - [[#B|B]]",
			"> - [[#C|C]]",
		].join("\n"));
	});

	it("uses the configured bullet character", () => {
		expect(renderTocBody([
			{ depth: 1, text: "A", offset: 0 },
		], { depth: 1, bullet: "*" })).toBe("> * [[#A|A]]");
	});

	it("returns an empty body when there are no headings", () => {
		expect(renderTocBody([], { depth: 3, bullet: "-" })).toBe("");
	});
});
