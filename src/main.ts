import { Plugin } from "obsidian";

import { AutoTocAutoUpdater } from "./commands/register-auto-update";
import { updateCurrentNote } from "./commands/update-current-note";
import { AutoTocSettings } from "./core/types";
import { normalizeSettings } from "./settings";
import { AutoTocSettingTab } from "./settings-tab";

export default class AutoTocPlugin extends Plugin {
	settings!: AutoTocSettings;
	autoUpdater!: AutoTocAutoUpdater;

	async onload(): Promise<void> {
		await this.loadSettings();
		this.autoUpdater = new AutoTocAutoUpdater(this);
		this.autoUpdater.register();

		this.addCommand({
			id: "update-table-of-contents",
			name: "Update table of contents in current note",
			callback: () => {
				void updateCurrentNote(this, this.settings, this.autoUpdater);
			},
		});

		this.addSettingTab(new AutoTocSettingTab(this.app, this, this.settings));
	}

	onunload(): void {
	}

	async loadSettings(): Promise<void> {
		const raw: unknown = await this.loadData();
		this.settings = normalizeSettings((raw ?? {}) as Partial<AutoTocSettings>);
	}
}
