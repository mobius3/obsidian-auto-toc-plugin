import { MarkdownView, Plugin, TFile } from "obsidian";

import { resolveEffectiveSettings } from "../core/effective-settings";
import { AutoTocSettings } from "../core/types";
import { showNotice, showUpdatedNotice } from "./show-notices";
import { updateCurrentNoteContent } from "./update-current-note-content";

interface PendingUpdateCanceller {
	cancelPending(path: string): void;
}

export async function updateCurrentNote(
	plugin: Plugin,
	settings: AutoTocSettings,
	autoUpdater?: PendingUpdateCanceller,
): Promise<void> {
	const activeView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
	const file = activeView?.file;

	if (!(file instanceof TFile) || file.extension !== "md") {
		showNotice("No active Markdown note.");
		return;
	}

	autoUpdater?.cancelPending(file.path);

	try {
		const markdown = await plugin.app.vault.read(file);
		const rendering = resolveEffectiveSettings(settings, file.path, markdown);
		const update = updateCurrentNoteContent(markdown, rendering, file.path);

		if (update.shouldWrite) {
			await plugin.app.vault.modify(file, update.markdown);
		}

		if (update.shouldWrite) {
			showUpdatedNotice(plugin, update.notice, file.path);
		} else {
			showNotice(update.notice);
		}
	} catch (error) {
		console.error(error);
		showNotice("Failed to update table of contents.");
	}
}
