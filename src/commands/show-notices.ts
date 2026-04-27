import { Notice, Plugin } from "obsidian";

import { createUpdatedNoticeFragment } from "./notices";

export function showNotice(message: string): void {
	new Notice(message);
}

export function showUpdatedNotice(plugin: Plugin, message: string, filePath: string): void {
	new Notice(createUpdatedNoticeFragment((path) => {
		void plugin.app.workspace.openLinkText(path, "", false);
	}, message, filePath));
}
