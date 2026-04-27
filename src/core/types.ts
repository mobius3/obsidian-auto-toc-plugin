export interface Range {
	start: number;
	end: number;
}

export type TocMode = "local" | "master";

export type Bullet = "-" | "*" | "+";

export interface RenderingSettings {
	depth: number;
	bullet: Bullet;
}

export interface PathOverride {
	path: string;
	rendering: Partial<RenderingSettings>;
}

export const DEFAULT_RENDERING_SETTINGS: RenderingSettings = {
	depth: 3,
	bullet: "-",
};

export interface AutoTocSettings {
	autoUpdate: boolean;
	updateDelay: number;
	rendering: RenderingSettings;
	folderOverridesEnabled: boolean;
	folderOverrides: PathOverride[];
	fileOverridesEnabled: boolean;
	fileOverrides: PathOverride[];
}

export const DEFAULT_AUTO_TOC_SETTINGS: AutoTocSettings = {
	autoUpdate: false,
	updateDelay: 10000,
	rendering: { ...DEFAULT_RENDERING_SETTINGS },
	folderOverridesEnabled: true,
	folderOverrides: [],
	fileOverridesEnabled: true,
	fileOverrides: [],
};

export interface TocCalloutRange extends Range {
	firstLine: string;
	bodyStart: number;
	bodyEnd: number;
	indent: string;
	mode: TocMode;
	query: Partial<RenderingSettings>;
}

export interface Heading {
	depth: number;
	text: string;
	offset: number;
}

export interface UpdateResult {
	changed: boolean;
	markdown: string;
	count: number;
	found: number;
}
