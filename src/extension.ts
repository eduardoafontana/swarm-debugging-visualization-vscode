import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {

	const panel = vscode.window.createWebviewPanel("catCoding", "Cat Coding", vscode.ViewColumn.Two, { enableScripts: true });

	panel.webview.html = getWebviewContent();

	// panel.onDidDispose(
    //     () => {
    //       // When the panel is closed, cancel any future updates to the webview content
    //       clearInterval(interval);
    //     },
    //     null,
    //     context.subscriptions
    // );

	// ver se precisa do context.subscriptions.push(, acho que é só para adicionar o comand no context.

	context.subscriptions.push(
		vscode.commands.registerCommand("catCoding.doRefactor", () => {
		  panel.webview.postMessage({ command: "refactor" });
		})
	);

	// handle messages from the webview
	panel.webview.onDidReceiveMessage(
		message => {
			switch (message.command) {
			case "alert":
				vscode.window.showErrorMessage(message.text);
				return;
			}
		},
		undefined,
		context.subscriptions
	);

	vscode.debug.onDidStartDebugSession(session => {
		console.log(session);
	}),
	vscode.debug.onDidTerminateDebugSession(session => {
		console.log(session);
	}),
	vscode.debug.registerDebugAdapterTrackerFactory("*", {
		createDebugAdapterTracker: session => {
			console.log(session);
			return {
				onDidSendMessage: async msg => {
					console.log(msg);
				},
			};
		},
	});
}

export function deactivate() {}

function getWebviewContent() {
	return `<!DOCTYPE html>
	<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Cat Coding</title>
		</head>
		<body>
			<img src="https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif" width="300" />

			<h1 id="lines-of-code-counter">0</h1>

			<script>
				(function() {
					const vscode = acquireVsCodeApi();
					const counter = document.getElementById('lines-of-code-counter');

					let count = 0;
					setInterval(() => {
						counter.textContent = count++;

						// Alert the extension when our cat introduces a bug
						if (Math.random() < 0.001 * count) {
							vscode.postMessage({
								command: 'alert',
								text: '🐛  on line ' + count
							})
						}
					}, 100);
				}())
			</script>
		</body>
	</html>`;
}
