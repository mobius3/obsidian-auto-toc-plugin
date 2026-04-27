import { describe, expect, it } from "vitest";

import { updateMarkdown } from "../../src/core/update";

describe("updateMarkdown", () => {
	it("updates all TOC callout bodies and preserves first lines", () => {
		const input = [
			"# Note",
			"",
			"> [!toc] Contents",
			"> old",
			"",
			"## A",
			"### B",
			"",
			"> [!toc#master?depth=2&bullet=*] Master",
			"> old",
			"",
			"# Other",
		].join("\n");

		const result = updateMarkdown(input);

		expect(result.changed).toBe(true);
		expect(result.found).toBe(2);
		expect(result.count).toBe(2);
		expect(result.markdown).toBe([
			"# Note",
			"",
			"> [!toc] Contents",
			"> - [[#A|A]]",
			">   - [[#B|B]]",
			"",
			"## A",
			"### B",
			"",
			"> [!toc#master?depth=2&bullet=*] Master",
			"> * [[#Note|Note]]",
			">   * [[#A|A]]",
			"> * [[#Other|Other]]",
			"",
			"# Other",
		].join("\n"));
	});

	it("is idempotent", () => {
		const input = [
			"# Note",
			"",
			"> [!toc] Contents",
			"> - [[#A|A]]",
			"",
			"## A",
		].join("\n");

		expect(updateMarkdown(input)).toEqual({
			changed: false,
			markdown: input,
			count: 0,
			found: 1,
		});
	});

	it("keeps the following paragraph outside the generated callout", () => {
		const input = [
			"# Note",
			"",
			"> [!toc] Contents",
			"> old",
			"## A",
			"",
			"Paragraph after heading.",
		].join("\n");

		expect(updateMarkdown(input).markdown).toBe([
			"# Note",
			"",
			"> [!toc] Contents",
			"> - [[#A|A]]",
			"",
			"## A",
			"",
			"Paragraph after heading.",
		].join("\n"));
	});

	it("keeps an adjacent paragraph outside the generated callout", () => {
		const input = [
			"# Note",
			"",
			"> [!toc] Contents",
			"> old",
			"Paragraph directly after the callout.",
			"",
			"## A",
		].join("\n");

		expect(updateMarkdown(input).markdown).toBe([
			"# Note",
			"",
			"> [!toc] Contents",
			"> - [[#A|A]]",
			"",
			"Paragraph directly after the callout.",
			"",
			"## A",
		].join("\n"));
	});

	it("does nothing when no TOC callout exists", () => {
		const input = "# Note\n\n## A";

		expect(updateMarkdown(input)).toEqual({
			changed: false,
			markdown: input,
			count: 0,
			found: 0,
		});
	});

	it("handles callouts and headings with leading whitespace", () => {
		const input = [
			"# My Note",
			"",
			"  > [!toc] Contents",
			"  > old content",
			"",
			"  ## First Section",
			"",
			"  ### Child Section",
			"",
			"  ## Second Section",
		].join("\n");

		const result = updateMarkdown(input);

		expect(result.changed).toBe(true);
		expect(result.found).toBe(1);
		expect(result.count).toBe(1);
		expect(result.markdown).toBe([
			"# My Note",
			"",
			"  > [!toc] Contents",
			"  > - [[#First Section|First Section]]",
			"  >   - [[#Child Section|Child Section]]",
			"  > - [[#Second Section|Second Section]]",
			"",
			"  ## First Section",
			"",
			"  ### Child Section",
			"",
			"  ## Second Section",
		].join("\n"));
	});

	it("uses document-wide duplicate heading slugs for local TOCs", () => {
		const input = [
			"# First",
			"## Repeated",
			"",
			"# Second",
			"",
			"> [!toc]",
			"> old",
			"",
			"## Repeated",
		].join("\n");

		expect(updateMarkdown(input).markdown).toBe([
			"# First",
			"## Repeated",
			"",
			"# Second",
			"",
			"> [!toc]",
			"> - [[#Repeated|Repeated]]",
			"",
			"## Repeated",
		].join("\n"));
	});
});
