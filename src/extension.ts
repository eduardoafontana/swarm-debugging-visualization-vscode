import * as vscode from "vscode";
import * as path from "path";
import { DebugMessageProcessor } from "./DebugMessageProcessor";

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

	const debugMessageProcessor: DebugMessageProcessor = new DebugMessageProcessor(panel);

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
		// console.log(session);
	}),
	vscode.debug.onDidTerminateDebugSession(session => {
		// console.log(session);

		debugMessageProcessor.clearDebugState();
	}),
	vscode.debug.registerDebugAdapterTrackerFactory("*", {
		createDebugAdapterTracker: session => {
			// console.log(session);
			return {
				onDidSendMessage: async msg => {
					// console.log(msg);

					debugMessageProcessor.identifyStackFrame(msg);
					debugMessageProcessor.identifyVariables(msg, session);
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
		</body>
	</html>`;
}
