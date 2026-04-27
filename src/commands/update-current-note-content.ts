import { updateMarkdown } from "../core/update";
import { RenderingSettings, UpdateResult } from "../core/types";

interface UpdateCurrentNoteContentResult {
	markdown: string;
	notice: string;
	shouldWrite: boolean;
}

export function updateCurrentNoteContent(
	markdown: string,
	settings: RenderingSettings,
	filePath?: string,
): UpdateCurrentNoteContentResult {
	const result = updateMarkdown(markdown, settings);

	if (result.found === 0) {
		return {
			markdown,
			notice: "No TOC callout found.",
			shouldWrite: false,
		};
	}

	if (!result.changed) {
		return {
			markdown,
			notice: "Table of contents already up to date.",
			shouldWrite: false,
		};
	}

	return {
		markdown: result.markdown,
		notice: formatUpdatedNotice(result, filePath),
		shouldWrite: true,
	};
}

export function formatUpdatedNotice(result: Pick<UpdateResult, "count">, filePath?: string): string {
	const subject = result.count === 1 ? "table of contents" : "tables of contents";
	const suffix = filePath ? ` in ${filePath}` : "";
	return `Updated ${result.count} ${subject}${suffix}.`;
}
