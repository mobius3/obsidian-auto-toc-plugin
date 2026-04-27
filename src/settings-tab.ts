import { AbstractInputSuggest, App, PluginSettingTab, Setting } from "obsidian";
import type { Plugin } from "obsidian";

import { AutoTocSettings, Bullet, PathOverride } from "./core/types";
import { normalizeSettings } from "./settings";

export class AutoTocSettingTab extends PluginSettingTab {
	private plugin: Plugin;
	private settings: AutoTocSettings;

	constructor(app: App, plugin: Plugin, settings: AutoTocSettings) {
		super(app, plugin);
		this.plugin = plugin;
		this.settings = settings;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.addClass("auto-toc-settings");

		new Setting(containerEl)
			.setName("Depth")
			.setDesc("Maximum heading depth to include (1–6).")
			.addText((text) =>
				text
					.setPlaceholder("3")
					.setValue(String(this.settings.rendering.depth))
					.onChange(async (value) => {
						this.settings.rendering.depth = this.parseInteger(value, this.settings.rendering.depth);
						await this.save();
					}),
			);

		new Setting(containerEl)
			.setName("Bullet")
			.setDesc("List bullet character for table of contents entries.")
			.addDropdown((dropdown) =>
				dropdown
					.addOptions({ "-": "-  (dash)", "*": "*  (asterisk)", "+": "+  (plus)" })
					.setValue(this.settings.rendering.bullet)
					.onChange(async (value) => {
						this.settings.rendering.bullet = value as Bullet;
						await this.save();
					}),
			);

		new Setting(containerEl)
			.setName("Auto-update")
			.setDesc("Automatically update tables of contents when editing notes.")
			.addToggle((toggle) =>
				toggle
					.setValue(this.settings.autoUpdate)
					.onChange(async (value) => {
						this.settings.autoUpdate = value;
						await this.save();
					}),
			);

		new Setting(containerEl)
			.setName("Update delay")
			.setDesc("Seconds to wait after a stop editing before updating (minimum 1).")
			.addText((text) =>
				text
					.setPlaceholder("10")
					.setValue(String(Math.round(this.settings.updateDelay / 1000)))
					.onChange(async (value) => {
						this.settings.updateDelay = this.parseInteger(value, Math.round(this.settings.updateDelay / 1000)) * 1000;
						await this.save();
					}),
			);

		this.addOverrideSection(
			"Folder overrides",
			this.settings.folderOverridesEnabled,
			this.settings.folderOverrides,
			"notes/",
			"Folder path",
			async (enabled) => {
				this.settings.folderOverridesEnabled = enabled;
				await this.save();
				this.display();
			},
			async (overrides) => {
				this.settings.folderOverrides = overrides;
				await this.save();
			},
			(inputEl, onChoose) => new FolderSuggest(this.app, inputEl, onChoose),
		);

		this.addOverrideSection(
			"File overrides",
			this.settings.fileOverridesEnabled,
			this.settings.fileOverrides,
			"notes/example.md",
			"File path",
			async (enabled) => {
				this.settings.fileOverridesEnabled = enabled;
				await this.save();
				this.display();
			},
			async (overrides) => {
				this.settings.fileOverrides = overrides;
				await this.save();
			},
			(inputEl, onChoose) => new MarkdownFileSuggest(this.app, inputEl, onChoose),
		);
	}

	private addOverrideSection(
		name: string,
		enabled: boolean,
		overrides: PathOverride[],
		pathPlaceholder: string,
		pathLabel: string,
		onToggle: (enabled: boolean) => Promise<void>,
		onChange: (overrides: PathOverride[]) => Promise<void>,
		addSuggest: (inputEl: HTMLInputElement, onChoose: (value: string) => void | Promise<void>) => void,
	): void {
		const { containerEl } = this;

		new Setting(containerEl)
			.setName(name)
			.setHeading()
			.addToggle((toggle) =>
				toggle
					.setValue(enabled)
					.onChange(onToggle),
			);

		if (!enabled) {
			return;
		}

		for (let index = 0; index < overrides.length; index++) {
			const override = overrides[index];
			if (!override) {
				continue;
			}

			new Setting(containerEl)
				.setClass("auto-toc-override-setting")
				.setName(`${pathLabel} ${index + 1}`)
				.setDesc("Vault-relative path.")
				.addText((text) => {
					addSuggest(text.inputEl, async (value) => {
						override.path = value;
						await onChange(overrides);
					});

					return text
						.setPlaceholder(pathPlaceholder)
						.setValue(override.path)
						.onChange(async (value) => {
							override.path = value;
							await onChange(overrides);
						});
				})
				.addDropdown((dropdown) =>
					dropdown
						.addOptions({
							"": "Depth: default",
							"1": "Depth: 1",
							"2": "Depth: 2",
							"3": "Depth: 3",
							"4": "Depth: 4",
							"5": "Depth: 5",
							"6": "Depth: 6",
						})
						.setValue(override.rendering.depth === undefined ? "" : String(override.rendering.depth))
						.onChange(async (value) => {
							if (value === "") {
								delete override.rendering.depth;
							} else {
								override.rendering.depth = Number(value);
							}
							await onChange(overrides);
						}),
				)
				.addDropdown((dropdown) =>
					dropdown
						.addOptions({ "": "Bullet: default", "-": "Bullet: -", "*": "Bullet: *", "+": "Bullet: +" })
						.setValue(override.rendering.bullet ?? "")
						.onChange(async (value) => {
							if (value === "-" || value === "*" || value === "+") {
								override.rendering.bullet = value;
							} else {
								delete override.rendering.bullet;
							}
							await onChange(overrides);
						}),
				)
				.addButton((button) =>
					button.setIcon("trash").onClick(async () => {
						overrides.splice(index, 1);
						await onChange(overrides);
						this.display();
					}),
				);
		}

		new Setting(containerEl)
			.addButton((button) =>
				button.setButtonText("Add").onClick(() => {
					overrides.push({ path: "", rendering: {} });
					this.display();
				}),
			);
	}

	private parseInteger(value: string, fallback: number): number {
		const parsed = Number(value);
		return Number.isInteger(parsed) ? parsed : fallback;
	}

	private async save(): Promise<void> {
		const normalized = normalizeSettings(this.settings);
		Object.assign(this.settings, normalized);
		await this.plugin.saveData(this.settings);
	}
}

class FolderSuggest extends AbstractInputSuggest<string> {
	private onChoose: (value: string) => void | Promise<void>;

	constructor(app: App, inputEl: HTMLInputElement, onChoose: (value: string) => void | Promise<void>) {
		super(app, inputEl);
		this.onChoose = onChoose;
	}

	protected getSuggestions(query: string): string[] {
		const normalizedQuery = query.toLowerCase();
		return this.app.vault
			.getAllFolders(false)
			.map((folder) => `${folder.path}/`)
			.filter((path) => path.toLowerCase().includes(normalizedQuery))
			.slice(0, 20);
	}

	renderSuggestion(value: string, el: HTMLElement): void {
		el.setText(value);
	}

	selectSuggestion(value: string): void {
		this.setValue(value);
		void this.onChoose(value);
		this.close();
	}
}

class MarkdownFileSuggest extends AbstractInputSuggest<string> {
	private onChoose: (value: string) => void | Promise<void>;

	constructor(app: App, inputEl: HTMLInputElement, onChoose: (value: string) => void | Promise<void>) {
		super(app, inputEl);
		this.onChoose = onChoose;
	}

	protected getSuggestions(query: string): string[] {
		const normalizedQuery = query.toLowerCase();
		return this.app.vault
			.getMarkdownFiles()
			.map((file) => file.path)
			.filter((path) => path.toLowerCase().includes(normalizedQuery))
			.slice(0, 20);
	}

	renderSuggestion(value: string, el: HTMLElement): void {
		el.setText(value);
	}

	selectSuggestion(value: string): void {
		this.setValue(value);
		void this.onChoose(value);
		this.close();
	}
}
