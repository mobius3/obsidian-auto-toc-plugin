import { describe, expect, it, vi } from "vitest";

import { createAutoUpdateController } from "../../src/commands/auto-update";
import { DEFAULT_AUTO_TOC_SETTINGS } from "../../src/core/types";

describe("createAutoUpdateController", () => {
	const settings = {
		...DEFAULT_AUTO_TOC_SETTINGS,
		autoUpdate: true,
		updateDelay: 25,
	};

	it("ignores non-markdown files", () => {
		const controller = createAutoUpdateController({
			getSettings: () => settings,
			read: vi.fn(),
			write: vi.fn(),
			setTimer: vi.fn(),
			clearTimer: vi.fn(),
		});

		controller.handleModify({ path: "image.png", extension: "png" });

		expect(controller.hasPending("image.png")).toBe(false);
	});

	it("does not schedule when auto-update is disabled", () => {
		const controller = createAutoUpdateController({
			getSettings: () => ({ ...settings, autoUpdate: false }),
			read: vi.fn(),
			write: vi.fn(),
			setTimer: vi.fn(),
			clearTimer: vi.fn(),
		});

		controller.handleModify({ path: "note.md", extension: "md" });

		expect(controller.hasPending("note.md")).toBe(false);
	});

	it("replaces an existing pending timer for the same file", () => {
		const clearTimer = vi.fn();
		let nextTimer = 1;
		const controller = createAutoUpdateController({
			getSettings: () => settings,
			read: vi.fn(),
			write: vi.fn(),
			setTimer: vi.fn(() => nextTimer++),
			clearTimer,
		});

		controller.handleModify({ path: "note.md", extension: "md" });
		controller.handleModify({ path: "note.md", extension: "md" });

		expect(clearTimer).toHaveBeenCalledWith(1);
		expect(controller.hasPending("note.md")).toBe(true);
	});

	it("cancelPending clears an existing timer", () => {
		const clearTimer = vi.fn();
		const controller = createAutoUpdateController({
			getSettings: () => settings,
			read: vi.fn(),
			write: vi.fn(),
			setTimer: vi.fn(() => 10),
			clearTimer,
		});

		controller.handleModify({ path: "note.md", extension: "md" });
		controller.cancelPending("note.md");

		expect(clearTimer).toHaveBeenCalledWith(10);
		expect(controller.hasPending("note.md")).toBe(false);
	});

	it("ignores modify events while a plugin write is active", () => {
		const controller = createAutoUpdateController({
			getSettings: () => settings,
			read: vi.fn(),
			write: vi.fn(),
			setTimer: vi.fn(),
			clearTimer: vi.fn(),
		});

		controller.markWriting("note.md");
		controller.handleModify({ path: "note.md", extension: "md" });

		expect(controller.hasPending("note.md")).toBe(false);
	});

	it("writes changed markdown and skips unchanged markdown", async () => {
		const write = vi.fn(async (_file, _markdown: string) => undefined);
		const notify = vi.fn();
		const callbacks: Array<() => void | Promise<void>> = [];
		const controller = createAutoUpdateController({
			getSettings: () => ({ ...settings, updateDelay: 1 }),
			read: vi
				.fn()
				.mockResolvedValueOnce("# Project\n\n> [!toc]\n\n## Alpha\n")
				.mockResolvedValueOnce("# Project\n\n> [!toc]\n> - [[#Alpha|Alpha]]\n\n## Alpha\n"),
			write,
			notify,
			setTimer: vi.fn((fn: () => void | Promise<void>) => {
				callbacks.push(fn);
				return callbacks.length;
			}),
			clearTimer: vi.fn(),
		});

		controller.handleModify({ path: "note.md", extension: "md" });
		await callbacks[0]?.();
		controller.handleModify({ path: "note.md", extension: "md" });
		await callbacks[1]?.();

		expect(write).toHaveBeenCalledTimes(1);
		expect(notify).toHaveBeenCalledTimes(1);
		expect(notify).toHaveBeenCalledWith(
			{ path: "note.md", extension: "md" },
			"Updated 1 table of contents in note.md.",
		);
		const firstWrite = write.mock.calls[0];
		expect(firstWrite?.[1]).toContain("> - [[#Alpha|Alpha]]");
	});

	it("clearAll clears all pending timers and writing guards", () => {
		const clearTimer = vi.fn();
		const controller = createAutoUpdateController({
			getSettings: () => settings,
			read: vi.fn(),
			write: vi.fn(),
			setTimer: vi.fn(() => 99),
			clearTimer,
		});

		controller.handleModify({ path: "one.md", extension: "md" });
		controller.handleModify({ path: "two.md", extension: "md" });
		controller.markWriting("three.md");

		controller.clearAll();

		expect(clearTimer).toHaveBeenCalledTimes(2);
		expect(controller.hasPending("one.md")).toBe(false);
		expect(controller.hasPending("two.md")).toBe(false);
		expect(controller.isWriting("three.md")).toBe(false);
	});
});
