import { Heading, RenderingSettings } from "./types";

export function renderTocBody(headings: Heading[], settings: RenderingSettings): string {
	if (headings.length === 0) {
		return "";
	}

	const rootDepth = Math.min(...headings.map((heading) => heading.depth));

	return headings
		.map((heading) => {
			const indent = "  ".repeat(Math.max(0, heading.depth - rootDepth));
			return `> ${indent}${settings.bullet} [[#${heading.text}|${heading.text}]]`;
		})
		.join("\n");
}
