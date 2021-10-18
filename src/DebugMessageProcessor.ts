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
    private idCounter: number = 0;

    // todo: create json validator thats return the json for identifies...

    public identifyVariables(message: any, session: vscode.DebugSession): void {
        if(message.type !== "response") { return; }

        if(message.command === undefined) { return; }

        if(message.command !== "variables") { return; }

        // console.log(message);

        // todo: search for well structured object variables, on click get response or doing request

        message.body.variables.forEach((element: any) => {
            if(this.currentStackFrame === null) { return; }

            let variableExist: Variable | undefined = this.currentStackFrame.variables.find(o => o.isEqual(element));

            if(variableExist === undefined) {
                let id:number = this.idCounter;
                let sequence:string = this.currentStackFrame.sequence + "." + (this.currentStackFrame.variables.length + 1).toString();
                let variable: Variable = new Variable(id, sequence, element.name);

                let parentNode: any = {
                    id: this.currentStackFrame.id,
                    sequence: this.currentStackFrame.sequence,
                    name: this.currentStackFrame.name,
                    parent: null,
                    type: "method" // todo review method
                };

                this.currentStackFrame.variables.push(variable);
                this.webviewPanel.webview.postMessage({ node: {
                        id: variable.id,
                        sequence: variable.sequence,
                        name: variable.name,
                        linkName: this.getLinkName(variable.name),
                        parent: parentNode,
                        type: "method" // todo review method
                    } }
                );

                this.idCounter++;

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

                // a partir do current stackframe, pesquisar qual é o stackframe cujo o previous tem a mesma linha e source do current

                // ---------------
                // verificar se existe a necessidade de atualizar uma edge de um nodo,
                // significa atualizar o parent de um frame e postar o update da node/edge

                // se sabe do previous o numero da linha e a source name
                // quando cria a variável

                // buscar a variável que bate com o previous
            }
        });

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
                // todo: vincular a variável com esse stackFramesWaitingLink
                this.webviewPanel.webview.postMessage(
                    { edge: {
                        source: linkedVariable.id,
                        target: stackFrameWaitingLink.id,
                        sequence: linkedVariable.sequence,
                        linkName: this.getLinkName(linkedVariable.name)
                    } }
                );
            } else {
                // todo: vincular o current stackFrame com o stackFramesWaitingLink e fazer o post.
                // para isso criar a variável _stackFrameLinked dentro do StackFrame
                this.webviewPanel.webview.postMessage(
                    { edge: {
                        source: this.currentStackFrame?.id,
                        target: stackFrameWaitingLink.id,
                        sequence: this.currentStackFrame?.sequence,
                        linkName: this.getLinkName(this.currentStackFrame !== null ? this.currentStackFrame.name : "")
                    } }
                );
            }

            // cenário do pp2 ainda não ta funcionando, não pega vínculo ao dar f5 direto

            // verificar se existe alguma variável que bate com a linha de código
            // se existe, vincular a variável com esse stackFramesWaitingLink e fazer post:
                // this.webviewPanel.webview.postMessage(
                //     { edge: { source: variable.identifier, target: stackFramesWaitingLink.identifier } }
                // );
            // se não existe, vincular o current stackFrame com o stackFramesWaitingLink e fazer o post.
            // para isso criar a variável _stackFrameLinked dentro do StackFrame

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

        // console.log(message);

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
        let id: number = this.idCounter;
        let sequence: string = (this.stackFrames.length + 1).toString();
        let stackFrame: StackFrame = new StackFrame(id, sequence, frame.line, frame.name, frame.source.name, frame.source.path);

        if(framePrevious !== null) {
            stackFrame.previousStackFrame = new StackFramePrevious(
                framePrevious.line, framePrevious.name, framePrevious.source.name, framePrevious.source.path);

            this.stackFramesWaitingLink.push(stackFrame);
        }

        this.stackFrames.push(stackFrame);

        this.currentStackFrame = stackFrame;
        this.webviewPanel.webview.postMessage({
            node: {
                id: stackFrame.id,
                sequence: stackFrame.sequence,
                name: stackFrame.name,
                linkName: this.getLinkName(stackFrame.name),
                parent: null,
                type: "stackframe" // todo review stackframe
            }
        });

        this.idCounter++;
    }

    private getLinkName(name : string): string {
        let linkName : string = "";
        const names : string[] = name.split(".");
        linkName = names[names.length - 1];

        return linkName;
    }
}
