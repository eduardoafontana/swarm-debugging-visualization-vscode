import * as vscode from "vscode";
import { StackFrame } from "./StackFrame";
import { StackFramePrevious } from "./StackFramePrevious";
import { Variable } from "./Variable";
import * as fs from "fs";

export class DebugMessageProcessor {

    private webviewPanel: vscode.WebviewPanel;

    constructor(webviewPanel: vscode.WebviewPanel) {
        this.webviewPanel = webviewPanel;
    }

    public clearDebugState(): void {
        this.stackFrames = [];
        this.stackFramesWaitingLink = [];
        this.currentStackFrame = null;

        this.webviewPanel.webview.postMessage({ clear: true });
    }

    private stackFrames: Array<StackFrame> = [];
    private stackFramesWaitingLink: Array<StackFrame> = [];
    private currentStackFrame: StackFrame | null = null;

    // todo: create json validator thats return the json for identifies...

    public identifyVariables(message: any, session: vscode.DebugSession): void {
        if(message.type !== "response") { return; }

        if(message.command === undefined) { return; }

        if(message.command !== "variables") { return; }

        console.log(message);

        // todo: search for well structured object variables, on click get response or doing request

        message.body.variables.forEach((element: any) => {
            if(this.currentStackFrame === null) { return; }

            let variableExist: Variable | undefined = this.currentStackFrame.variables.find(o => o.isEqual(element));

            if(variableExist === undefined) {
                let identifier:string = this.currentStackFrame.identifier + "." + (this.currentStackFrame.variables.length + 1).toString();
                let variable: Variable = new Variable(identifier, element.name);

                let parentNode: any = { identifier: this.currentStackFrame.identifier, name: this.currentStackFrame.name, parent: null };

                this.currentStackFrame.variables.push(variable);
                this.webviewPanel.webview.postMessage(
                    { node: { identifier: variable.identifier, name: variable.name, parent: parentNode } }
                );


                // ---=====
                // let linkedStackFrame: StackFrame | undefined = this.stackFrames.find(o =>
                //     o.previousStackFrame.line === this.currentStackFrame?.line
                //     && o.previousStackFrame.name === this.currentStackFrame?.name
                //     && o.previousStackFrame.sourceName === this.currentStackFrame.sourceName
                //     && o.previousStackFrame.sourcePath === this.currentStackFrame.sourcePath);

                // if(linkedStackFrame !== undefined) {
                //     variable.stackFrameLinked = linkedStackFrame;

                //     this.webviewPanel.webview.postMessage(
                //         { edge: { source: variable.identifier, target: linkedStackFrame.identifier } }
                //     );
                // }
                // ---=====

                // const variableResponse = (await session.customRequest("variables", {
                //     variablesReference: element.variablesReference
                // }));

                // console.log(variableResponse);

                //a partir do current stackframe, pesquisar qual ?? o stackframe cujo o previous tem a mesma linha e source do current

                //---------------
                //verificar se existe a necessidade de atualizar uma edge de um nodo, significa atualizar o parent de um frame e postar o update da node/edge

                //se sabe do previous o numero da linha e a source name
                //quando cria a vari??vel

                //buscar a vari??vel que bate com o previous
            }
        });

        // ---====
        let stackFrameWaitingLink: StackFrame | undefined = this.stackFramesWaitingLink.find(o =>
            o.previousStackFrame.name === this.currentStackFrame?.name
            && o.previousStackFrame.sourceName === this.currentStackFrame.sourceName
            && o.previousStackFrame.sourcePath === this.currentStackFrame.sourcePath);

        if(stackFrameWaitingLink !== undefined) {

            let lineOfCode: string = "";

            // todo: review this way to read specific line of a file
            const data: string = fs.readFileSync(stackFrameWaitingLink.previousStackFrame.sourcePath, { encoding: "utf8" });

            const arr: Array<string> = data.toString().replace(/\r\n/g, "\n").split("\n");

            const linePosition: number = stackFrameWaitingLink !== undefined ? stackFrameWaitingLink.previousStackFrame.line : 0;
            lineOfCode = arr[linePosition - 1];

            const linkedVariable: Variable | undefined = this.currentStackFrame?.variables.find(o => lineOfCode.indexOf(o.name + ".") > -1);

            if(linkedVariable !== undefined) {
                // todo: vincular a vari??vel com esse stackFramesWaitingLink
                this.webviewPanel.webview.postMessage(
                    { edge: { source: linkedVariable.identifier, target: stackFrameWaitingLink.identifier } }
                );
            } else {
                // todo: vincular o current stackFrame com o stackFramesWaitingLink e fazer o post.
                // para isso criar a vari??vel _stackFrameLinked dentro do StackFrame
                this.webviewPanel.webview.postMessage(
                    { edge: { source: this.currentStackFrame?.identifier, target: stackFrameWaitingLink.identifier } }
                );
            }

            // cen??rio do pp2 ainda n??o ta funcionando, n??o pega v??nculo ao dar f5 direto

            // verificar se existe alguma vari??vel que bate com a linha de c??digo
            // se existe, vincular a vari??vel com esse stackFramesWaitingLink e fazer post:
                // this.webviewPanel.webview.postMessage(
                //     { edge: { source: variable.identifier, target: stackFramesWaitingLink.identifier } }
                // );
            // se n??o existe, vincular o current stackFrame com o stackFramesWaitingLink e fazer o post. Para isso criar a vari??vel _stackFrameLinked dentro do StackFrame

            const foundIndex: number = this.stackFramesWaitingLink.indexOf(stackFrameWaitingLink);
            if (foundIndex > -1) {
                this.stackFramesWaitingLink.splice(foundIndex, 1);
            }
        }
        // ---====
    }

    public identifyStackFrame(message: any): void {
        if(message.type !== "response") { return; }

        if(message.command === undefined) { return; }

        if(message.command !== "stackTrace") { return; }

        if(message.body.stackFrames.length !== message.body.totalFrames) { return; }

        console.log(message);

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
            this.createStackFrameAndPost(frame, framePrevious);

            return;
        }

        let stackFrameExists: Array<StackFrame> = this.stackFrames.filter(o => o.isEqual(frame));

        if(stackFrameExists.length === 0) {
            this.createStackFrameAndPost(frame, framePrevious);

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
            this.currentStackFrame.line = frame.line;

            return;
        }

        let stackFrameExistsWithPrevious: Array<StackFrame> = stackFrameExists.filter(o => o.previousStackFrame.isEqual(framePrevious));

        if(stackFrameExistsWithPrevious.length === 0) {
            this.createStackFrameAndPost(frame, framePrevious);

            return;
        }

        if(stackFrameExistsWithPrevious.length > 1) {
            throw Error("Something wrong! There are repeated stack frames on the list.");
        }

        this.currentStackFrame = stackFrameExistsWithPrevious[0];
        this.currentStackFrame.line = frame.line;
	}

    public createStackFrameAndPost(frame: any, framePrevious: any): void {
        let identifier: string = (this.stackFrames.length + 1).toString();
        let stackFrame: StackFrame = new StackFrame(identifier, frame.line, frame.name, frame.source.name, frame.source.path);

        if(framePrevious !== null) {
            stackFrame.previousStackFrame = new StackFramePrevious(
                framePrevious.line, framePrevious.name, framePrevious.source.name, framePrevious.source.path);

            this.stackFramesWaitingLink.push(stackFrame);
        }

        this.stackFrames.push(stackFrame);

        this.currentStackFrame = stackFrame;
        this.webviewPanel.webview.postMessage({ node: { identifier: stackFrame.identifier, name: stackFrame.name, parent: null } });
    }
}
