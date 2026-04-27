import { describe, expect, it } from "vitest";

import { findTocCallouts } from "../../src/core/callouts";

describe("findTocCallouts", () => {
	it("detects base, folded, titled, query, and master TOC callouts", () => {
		const markdown = [
			"> [!toc]",
			"> old",
			"",
			"> [!toc]+ Contents",
			"> old",
			"",
			"> [!toc?depth=2&bullet=*] Query",
			"> old",
			"",
			"> [!toc#master?depth=3&bullet=+] Master",
			"> old",
		].join("\n");

		const callouts = findTocCallouts(markdown);

		expect(callouts).toHaveLength(4);
		expect(callouts.map((callout) => callout.firstLine)).toEqual([
			"> [!toc]",
			"> [!toc]+ Contents",
			"> [!toc?depth=2&bullet=*] Query",
			"> [!toc#master?depth=3&bullet=+] Master",
		]);
		expect(callouts.map((callout) => callout.mode)).toEqual([
			"local",
			"local",
			"local",
			"master",
		]);
		expect(callouts[2]?.query).toEqual({ depth: 2, bullet: "*" });
		expect(callouts[3]?.query).toEqual({ depth: 3, bullet: "+" });
	});

	it("preserves the first line and owns the following contiguous blockquote body", () => {
		const markdown = [
			"# Note",
			"",
			"> [!toc] Contents",
			"> old item",
			"> old item 2",
			"",
			"## Heading",
		].join("\n");

		const [callout] = findTocCallouts(markdown);

		expect(callout?.firstLine).toBe("> [!toc] Contents");
		expect(markdown.slice(callout?.bodyStart, callout?.bodyEnd)).toBe("> old item\n> old item 2");
	});

	it("ignores non-toc callouts and invalid query values", () => {
		const markdown = [
			"> [!summary] Summary",
			"> ignored",
			"",
			"> [!toc?depth=9&bullet=1] Contents",
		].join("\n");

		const callouts = findTocCallouts(markdown);

		expect(callouts).toHaveLength(1);
		expect(callouts[0]?.query).toEqual({});
	});
});
