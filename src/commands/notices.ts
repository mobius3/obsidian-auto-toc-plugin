export function createUpdatedNoticeFragment(
	openFile: (filePath: string) => void,
	message: string,
	filePath: string,
): DocumentFragment {
	const fragment = document.createDocumentFragment();
	const index = message.indexOf(filePath);

	if (index < 0) {
		fragment.append(message);
		return fragment;
	}

	fragment.append(message.slice(0, index));

	const link = document.createElement("a");
	link.href = "#";
	link.textContent = filePath;
	link.addEventListener("click", (event) => {
		event.preventDefault();
		openFile(filePath);
	});
	fragment.append(link);

	fragment.append(message.slice(index + filePath.length));
	return fragment;
}
