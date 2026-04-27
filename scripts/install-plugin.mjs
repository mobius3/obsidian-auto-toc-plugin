import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const PLUGIN_ID = "auto-toc";
export const RELEASE_FILES = ["main.js", "manifest.json", "styles.css"];

export function parseInstallArgs(args, env) {
	const vaultFlagIndex = args.indexOf("--vault");
	const vaultFlag = args.find((arg) => arg.startsWith("--vault="));

	if (vaultFlag) {
		const [, value] = vaultFlag.split("=", 2);
		if (value) {
			return value;
		}
	}

	if (vaultFlagIndex >= 0 && args[vaultFlagIndex + 1]) {
		return args[vaultFlagIndex + 1];
	}

	if (env.OBSIDIAN_VAULT) {
		return env.OBSIDIAN_VAULT;
	}

	throw new Error("Missing vault path. Use --vault /path/to/Vault or set OBSIDIAN_VAULT.");
}

export function createInstallPlan({ repoRoot, vaultPath }) {
	const pluginDir = path.join(vaultPath, ".obsidian", "plugins", PLUGIN_ID);

	return {
		pluginDir,
		files: RELEASE_FILES.map((fileName) => ({
			source: path.join(repoRoot, fileName),
			destination: path.join(pluginDir, fileName),
		})),
	};
}

export async function installPlugin({ repoRoot, vaultPath }) {
	const plan = createInstallPlan({ repoRoot, vaultPath });

	await fs.mkdir(plan.pluginDir, { recursive: true });

	for (const file of plan.files) {
		await fs.copyFile(file.source, file.destination);
	}

	return plan;
}

const isCli = process.argv[1] === fileURLToPath(import.meta.url);

if (isCli) {
	const vaultPath = parseInstallArgs(process.argv.slice(2), process.env);
	const plan = await installPlugin({
		repoRoot: process.cwd(),
		vaultPath,
	});

	console.log(`Installed ${PLUGIN_ID} to ${plan.pluginDir}`);
}
