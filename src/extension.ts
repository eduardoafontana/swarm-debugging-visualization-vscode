import * as vscode from "vscode";
import * as path from "path";

export function activate(context: vscode.ExtensionContext) {

	const panel = vscode.window.createWebviewPanel("swarmWebview", "Swarm Visualization", vscode.ViewColumn.Two, { enableScripts: true });

    const cyStyle = panel.webview.asWebviewUri(vscode.Uri.file(
		path.join(context.extensionPath, "src", "webview", "style.css")
	));

    const cyMain = panel.webview.asWebviewUri(vscode.Uri.file(
		path.join(context.extensionPath, "src", "webview", "main.js")
	));

    const cyLayout = panel.webview.asWebviewUri(vscode.Uri.file(
		path.join(context.extensionPath, "src", "webview", "cytoscape", "layout-base.js")
	));

    const cyAvsdf = panel.webview.asWebviewUri(vscode.Uri.file(
		path.join(context.extensionPath, "src", "webview", "cytoscape", "avsdf-base.js")
	));

    const cyCytoscape = panel.webview.asWebviewUri(vscode.Uri.file(
		path.join(context.extensionPath, "src", "webview", "cytoscape", "cytoscape.min.js")
	));

    const cyCytoscapeAvsdf = panel.webview.asWebviewUri(vscode.Uri.file(
		path.join(context.extensionPath, "src", "webview", "cytoscape", "cytoscape-avsdf.js")
	));

	panel.webview.html = getWebviewContent(cyStyle, cyMain, cyLayout, cyAvsdf, cyCytoscape, cyCytoscapeAvsdf);

	// panel.onDidDispose(
    //     () => {
    //       // When the panel is closed, cancel any future updates to the webview content
    //       clearInterval(interval);
    //     },
    //     null,
    //     context.subscriptions
    // );

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
		//console.log(session);
	}),
	vscode.debug.onDidTerminateDebugSession(session => {
		//console.log(session);
	}),
	vscode.debug.registerDebugAdapterTrackerFactory("*", {
		createDebugAdapterTracker: session => {
			//console.log(session);
			return {
				onDidSendMessage: async msg => {
					// console.log(msg);

					if(msg.type === "response" && msg.command && msg.command === "variables"){
						console.log(msg);
					}

					if (msg.type === "event") {
						if (msg.event === "stopped") {
							const threadId = msg.body.threadId;

							const stackTraceResponse = (await session.customRequest("stackTrace", {
								threadId: threadId,
								levels: 1,
								startFrame: 0,
							}));

							// console.log("Response stackframe:");
							// console.log(stackTraceResponse);

							const sourcePath = stackTraceResponse.stackFrames[0].source.path;
							const sourceReference = stackTraceResponse.stackFrames[0].sourceReference;

							// const sourceResponse = (await session.customRequest("source", {
							//	sourceReference: 1,
							// }));

							// console.log("Response source:");
							// console.log(sourceResponse);
						}
					}

					//panel.webview.postMessage({ command: "addNode" });
				},
			};
		},
	});
}

export function deactivate() {}

function getWebviewContent(cyStyle: vscode.Uri, cyMain: vscode.Uri, cyLayout: vscode.Uri, cyAvsdf: vscode.Uri, cyCytoscape: vscode.Uri, cyCytoscapeAvsdf: vscode.Uri) {
	return `<!DOCTYPE html>
	<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Swarm Visualization</title>

			<link href="${cyStyle}" rel="stylesheet" />

			<script src="${cyCytoscape}"></script>

			<script src="${cyLayout}"></script>
			<script src="${cyAvsdf}"></script>

			<script src="${cyCytoscapeAvsdf}"></script>
		</head>
		<body>
			<h1>cytoscape-avsdf demo</h1>
			<a data-toggle="tooltip" data-placement="auto" title="Add new node and auto reorganize">
				<button id="addButton" type="button">Add Node</button>
			</a>

			<div id="cy"></div>

			<script src="${cyMain}"></script>

			<!--<h1 id="lines-of-code-counter">0</h1>-->
			<script>
				// (function() {
				// 	const vscode = acquireVsCodeApi();
				// 	const counter = document.getElementById('lines-of-code-counter');

				// 	let count = 0;
				// 	setInterval(() => {
				// 		counter.textContent = count++;

				// 		// Alert the extension when our cat introduces a bug
				// 		if (Math.random() < 0.001 * count) {
				// 			vscode.postMessage({
				// 				command: 'alert',
				// 				text: '🐛  on line ' + count
				// 			})
				// 		}
				// 	}, 100);
				// }())
			</script>
		</body>
	</html>`;
}
