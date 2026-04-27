import { TFile } from "obsidian";

import { createAutoUpdateController, AutoUpdateController } from "./auto-update";
import { showUpdatedNotice } from "./show-notices";
import type AutoTocPlugin from "../main";

export class AutoTocAutoUpdater {
	private controller: AutoUpdateController;

	constructor(private plugin: AutoTocPlugin) {
		this.controller = createAutoUpdateController({
			getSettings: () => this.plugin.settings,
			read: async (file) => {
				const vaultFile = this.plugin.app.vault.getFileByPath(file.path);
				if (vaultFile === null) {
					return "";
				}
				return this.plugin.app.vault.read(vaultFile);
			},
			write: async (file, markdown) => {
				const vaultFile = this.plugin.app.vault.getFileByPath(file.path);
				if (vaultFile !== null) {
					await this.plugin.app.vault.modify(vaultFile, markdown);
				}
			},
			notify: (file, message) => {
				showUpdatedNotice(this.plugin, message, file.path);
			},
			setTimer: (callback, delay) => window.setTimeout(() => {
				void callback();
			}, delay),
			clearTimer: (timer) => window.clearTimeout(timer as ReturnType<typeof window.setTimeout>),
		});
	}

	register(): void {
		this.plugin.registerEvent(
			this.plugin.app.vault.on("modify", (file) => {
				if (file instanceof TFile) {
					this.controller.handleModify(file);
				}
			}),
		);

		this.plugin.register(() => this.controller.clearAll());
	}

	cancelPending(path: string): void {
		this.controller.cancelPending(path);
	}
}
