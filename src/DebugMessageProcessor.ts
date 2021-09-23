import * as vscode from "vscode";
import { StackFrame } from "./StackFrame";
import { StackFramePrevious } from "./StackFramePrevious";

export class DebugMessageProcessor {

    private webviewPanel: vscode.WebviewPanel;

    constructor(webviewPanel: vscode.WebviewPanel) {
        this.webviewPanel = webviewPanel;
    }

    public clearDebugState(): void {
        this.variables = [];
        this.stackFrames = [];
        this.currentStackFrame = null;

        this.webviewPanel.webview.postMessage({ clear: true });
    }

    private variables: Array<String> = [];
    private stackFrames: Array<StackFrame> = [];
    private currentStackFrame: StackFrame | null = null;

    // todo: create json validator thats return the json for identifies...

    public identifyVariables(message: any): void {
        console.log(message);

        if(message.type !== "response") { return; }

        if(message.command === undefined) { return; }

        if(message.command !== "variables") { return; }

        // todo: search for well structured object variables, on click get response or doing request

        message.body.variables.forEach((element: { name: String; }) => {
            if(!this.variables.includes(element.name)) {
                this.variables.push(element.name);
                this.webviewPanel.webview.postMessage({ node: element.name });
            }
        });
    }

    public identifyStackFrame(message: any): void {
        console.log(message);

        if(message.type !== "response") { return; }

        if(message.command === undefined) { return; }

        if(message.command !== "stackTrace") { return; }

        if(message.body.stackFrames.length !== message.body.totalFrames) { return; }

        let frame: any | null = null;
        if(message.body.stackFrames.length > 0) {
            frame = message.body.stackFrames[0];
        }

        if(frame === null) {
            throw new Error("Something wrong! StackTrace frame not returned by Debugger Adapter!");
        }

        let framePrevious: any | null = null;
        if(message.body.stackFrames.length > 1) {
            framePrevious = message.body.stackFrames[1];
        }

        if(this.currentStackFrame === null) {
            let stackFrame: StackFrame = new StackFrame(frame.line, frame.name, frame.source.name, frame.source.path);

            if(framePrevious !== null) {
                stackFrame.previousStackFrame = new StackFramePrevious(
                    framePrevious.line, framePrevious.name, framePrevious.source.name, framePrevious.source.path);
            }

            this.stackFrames.push(stackFrame);

            this.currentStackFrame = stackFrame;
            this.webviewPanel.webview.postMessage({ node: stackFrame.name });

            return;
        }

        let stackFrameExists: Array<StackFrame> = this.stackFrames.filter(o => o.isEqual(frame));

        if(stackFrameExists.length === 0) {
            let stackFrame: StackFrame = new StackFrame(frame.line, frame.name, frame.source.name, frame.source.path);

            if(framePrevious !== null) {
                stackFrame.previousStackFrame = new StackFramePrevious(
                    framePrevious.line, framePrevious.name, framePrevious.source.name, framePrevious.source.path);
            }

            this.stackFrames.push(stackFrame);

            this.currentStackFrame = stackFrame;
            this.webviewPanel.webview.postMessage({ node: stackFrame.name });

            return;
        }

        if(framePrevious === null) {
            let stackFrameWithPreviousDefault: StackFrame | undefined = stackFrameExists.find(o => o.previousStackFrame.isEqual(
                    {line: 0, name : "", source: { name: "", path: ""}}
            ));

            if(stackFrameWithPreviousDefault === undefined) {
                throw Error("Something wrong! Not found a stackFrame with default previous frame.");
            }

            this.currentStackFrame = stackFrameWithPreviousDefault;

            return;
        }

        let stackFrameExistsWithPrevious: Array<StackFrame> = stackFrameExists.filter(o => o.previousStackFrame.isEqual(framePrevious));

        if(stackFrameExistsWithPrevious.length === 0) {
            let stackFrame: StackFrame = new StackFrame(frame.line, frame.name, frame.source.name, frame.source.path);

            stackFrame.previousStackFrame = new StackFramePrevious(
                framePrevious.line, framePrevious.name, framePrevious.source.name, framePrevious.source.path);

            this.stackFrames.push(stackFrame);

            this.currentStackFrame = stackFrame;
            this.webviewPanel.webview.postMessage({ node: stackFrame.name });

            return;
        }

        if(stackFrameExistsWithPrevious.length > 1) {
            throw Error("Something wrong! There are repeated stack frames on the list.");
        }

        this.currentStackFrame = stackFrameExistsWithPrevious[0];
	}
}