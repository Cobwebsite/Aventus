

// Script run within the webview itself.
(function () {

	console.log("iniiit");
	// Get a reference to the VS Code webview api.
	// We use this API to post messages back to our extension.

	// @ts-ignore
	const vscode = acquireVsCodeApi();




	// vscode.postMessage({
	// 	type: 'add'
	// });

	function generateBlocks(data) {
		let blocks = [];
		document.body.innerHTML = "";
		if (data.main) {
			for (let i = 0; i < data.main.length; i++) {
				let current = data.main[i];
				let el = new RkBlock();
				el.data = current;
				document.body.appendChild(el);
				blocks.push(el);
			}
		}


		for(let i = 0;i<blocks.length;i++){
			blocks[i].loadLinks();
		}
	}

	/**
	 * Render the document in the webview.
	 */
	function updateContent(/** @type {string} */ text) {
		console.log(text);
		// let json;
		// try {
		// 	if (!text) {
		// 		text = '{}';
		// 	}
		// 	json = JSON.parse(text);
		// 	console.log(json);
		// 	generateBlocks(json);
		// } catch {
		// 	return;
		// }

	}

	// Handle messages sent from the extension to the webview
	window.addEventListener('message', event => {
		const message = event.data; // The json data that the extension sent
		switch (message.type) {
			case 'update':
				const text = message.text;

				// Update our webview's content
				updateContent(text);

				// Then persist state information.
				// This state is returned in the call to `vscode.getState` below when a webview is reloaded.
				vscode.setState({ text });

				return;
		}
	});

	// Webviews are normally torn down when not visible and re-created when they become visible again.
	// State lets us save information across these re-loads
	const state = vscode.getState();
	if (state) {
		updateContent(state.text);
	}
}());
