import { describe, expect, it } from "vitest";

import { findTocCallouts } from "../../src/core/callouts";
import { extractHeadings, selectHeadingsForCallout } from "../../src/core/headings";

describe("extractHeadings", () => {
	it("extracts ATX headings and ignores frontmatter, fenced code, blockquotes, and TOC bodies", () => {
		const markdown = [
			"---",
			"# Ignored frontmatter",
			"---",
			"# Title",
			"",
			"> # Ignored quote",
			"",
			"```",
			"## Ignored code",
			"```",
			"",
			"> [!toc]",
			"> ## Ignored TOC body",
			"",
			"## Section ##",
			"### Child",
		].join("\n");
		const callouts = findTocCallouts(markdown);

		expect(extractHeadings(markdown, callouts)).toMatchObject([
			{ depth: 1, text: "Title" },
			{ depth: 2, text: "Section" },
			{ depth: 3, text: "Child" },
		]);
	});
});

describe("selectHeadingsForCallout", () => {
	it("selects local descendant headings until the next sibling or parent", () => {
		const markdown = [
			"# First",
			"",
			"> [!toc?depth=2]",
			"",
			"## A",
			"### A child",
			"#### Too deep",
			"## B",
			"# Second",
			"## Ignored",
		].join("\n");
		const [callout] = findTocCallouts(markdown);
		const headings = extractHeadings(markdown, [callout!]);

		expect(selectHeadingsForCallout(headings, callout!, { depth: 2, bullet: "-" })).toMatchObject([
			{ depth: 2, text: "A" },
			{ depth: 3, text: "A child" },
			{ depth: 2, text: "B" },
		]);
	});

	it("falls back to master behavior when a local TOC has no previous heading", () => {
		const markdown = [
			"> [!toc?depth=2]",
			"",
			"# A",
			"## B",
			"### C",
		].join("\n");
		const [callout] = findTocCallouts(markdown);
		const headings = extractHeadings(markdown, [callout!]);

		expect(selectHeadingsForCallout(headings, callout!, { depth: 2, bullet: "-" })).toMatchObject([
			{ depth: 1, text: "A" },
			{ depth: 2, text: "B" },
		]);
	});

	it("selects master headings by absolute depth", () => {
		const markdown = [
			"# A",
			"> [!toc#master?depth=2]",
			"## B",
			"### C",
		].join("\n");
		const [callout] = findTocCallouts(markdown);
		const headings = extractHeadings(markdown, [callout!]);

		expect(selectHeadingsForCallout(headings, callout!, { depth: 2, bullet: "-" })).toMatchObject([
			{ depth: 1, text: "A" },
			{ depth: 2, text: "B" },
		]);
	});
});
