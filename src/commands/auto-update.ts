import { resolveEffectiveSettings } from "../core/effective-settings";
import { AutoTocSettings } from "../core/types";
import { updateMarkdown } from "../core/update";
import { formatUpdatedNotice } from "./update-current-note-content";

export interface AutoUpdateFile {
	path: string;
	extension: string;
}

type TimerHandle = ReturnType<typeof window.setTimeout> | number;

interface AutoUpdateControllerDeps {
	getSettings: () => AutoTocSettings;
	read: (file: AutoUpdateFile) => Promise<string>;
	write: (file: AutoUpdateFile, markdown: string) => Promise<void>;
	notify?: (file: AutoUpdateFile, message: string) => void;
	setTimer: (callback: () => void | Promise<void>, delay: number) => TimerHandle;
	clearTimer: (timer: TimerHandle) => void;
}

export interface AutoUpdateController {
	handleModify: (file: AutoUpdateFile) => void;
	cancelPending: (path: string) => void;
	clearAll: () => void;
	hasPending: (path: string) => boolean;
	isWriting: (path: string) => boolean;
	markWriting: (path: string) => void;
}

export function createAutoUpdateController(deps: AutoUpdateControllerDeps): AutoUpdateController {
	const pendingTimers = new Map<string, TimerHandle>();
	const writingPaths = new Set<string>();

	function handleModify(file: AutoUpdateFile): void {
		const settings = deps.getSettings();
		if (!settings.autoUpdate || file.extension !== "md" || writingPaths.has(file.path)) {
			return;
		}

		cancelPending(file.path);
		const timer = deps.setTimer(() => runUpdate(file), settings.updateDelay);
		pendingTimers.set(file.path, timer);
	}

	function cancelPending(path: string): void {
		const pending = pendingTimers.get(path);
		if (pending === undefined) {
			return;
		}

		deps.clearTimer(pending);
		pendingTimers.delete(path);
	}

	async function runUpdate(file: AutoUpdateFile): Promise<void> {
		pendingTimers.delete(file.path);

		const markdown = await deps.read(file);
		const settings = resolveEffectiveSettings(deps.getSettings(), file.path, markdown);
		const update = updateMarkdown(markdown, settings);
		if (!update.changed) {
			return;
		}

		writingPaths.add(file.path);
		try {
			await deps.write(file, update.markdown);
			deps.notify?.(file, formatUpdatedNotice(update, file.path));
		} finally {
			writingPaths.delete(file.path);
		}
	}

	function clearAll(): void {
		for (const timer of pendingTimers.values()) {
			deps.clearTimer(timer);
		}
		pendingTimers.clear();
		writingPaths.clear();
	}

	return {
		handleModify,
		cancelPending,
		clearAll,
		hasPending: (path) => pendingTimers.has(path),
		isWriting: (path) => writingPaths.has(path),
		markWriting: (path) => {
			writingPaths.add(path);
		},
	};
}
