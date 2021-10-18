import * as vscode from "vscode";
import * as path from "path";
import { DebugMessageProcessor } from "./DebugMessageProcessor";

export function activate(context: vscode.ExtensionContext): void {

	const panel: vscode.WebviewPanel = vscode.window.createWebviewPanel(
		"swarmWebview", "Swarm Visualization", vscode.ViewColumn.Two, { enableScripts: true }
	);

    const scriptStyle: vscode.Uri = panel.webview.asWebviewUri(vscode.Uri.file(
		path.join(context.extensionPath, "src", "webview", "style.css")
	));

    const scriptMain: vscode.Uri = panel.webview.asWebviewUri(vscode.Uri.file(
		path.join(context.extensionPath, "src", "webview", "main.js")
	));

    const scriptForceGraph: vscode.Uri = panel.webview.asWebviewUri(vscode.Uri.file(
		path.join(context.extensionPath, "src", "webview", "force-graph", "force-graph.min.js")
	));

	panel.webview.html = getWebviewContent(scriptStyle, scriptMain, scriptForceGraph);

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

export function deactivate(): void { return; }

function getWebviewContent(scriptStyle: vscode.Uri, scriptMain: vscode.Uri, scriptForceGraph: vscode.Uri): string {
	return `<!DOCTYPE html>
	<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Swarm Visualization</title>

			<link href="${scriptStyle}" rel="stylesheet" />

			<script src="${scriptForceGraph}"></script>
		</head>
		<body>

			<div class="control-button">
				Node:
				<input type="radio" id="nodeSymbolRadio" name="nodePresentationMode" value="Symbol">
				<label for="nodeSymbolRadio">Symbol</label>
				<input type="radio" id="nodeTextRadio" name="nodePresentationMode" value="Text" checked="true">
				<label for="nodeTextRadio">Text</label>
			</div>

			<div class="control-button">
				Edge text:
				<input type="radio" id="edgeTextShowRadio" name="edgePresentationMode" value="Show" checked="true">
				<label for="edgeTextShowRadio">Show</label>
				<input type="radio" id="edgeTextHideRadio" name="edgePresentationMode" value="Hide">
				<label for="edgeTextHideRadio">Hide</label>
			</div>

			<div class="control-button">
				Show arrow:
				<input type="radio" id="edgeArrowShowRadio" name="edgeArrowMode" value="Show" checked="true">
				<label for="edgeArrowShowRadio">Show</label>
				<input type="radio" id="edgeArrowHideRadio" name="edgeArrowMode" value="Hide">
				<label for="edgeArrowHideRadio">Hide</label>
			</div>

			<div class="control-button">
				Show particles:
				<input type="radio" id="edgeParticleShowRadio" name="edgeParticleMode" value="Show">
				<label for="edgeParticleShowRadio">Show</label>
				<input type="radio" id="edgeParticleHideRadio" name="edgeParticleMode" value="Hide" checked="true">
				<label for="edgeParticleHideRadio">Hide</label>
			</div>

			<div id="graph"></div>

			<script src="${scriptMain}"></script>
		</body>
	</html>`;
}
