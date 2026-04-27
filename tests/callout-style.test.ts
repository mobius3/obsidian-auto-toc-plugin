import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

describe("TOC callout styles", () => {
	it("targets every supported TOC callout marker family", async () => {
		const css = await readFile("styles.css", "utf8");

		expect(css).toContain('.callout[data-callout="toc"]');
		expect(css).toContain('.callout[data-callout^="toc?"]');
		expect(css).toContain('.callout[data-callout="toc#master"]');
		expect(css).toContain('.callout[data-callout^="toc#master?"]');
	});
});
