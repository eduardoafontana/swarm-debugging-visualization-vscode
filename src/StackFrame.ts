import { StackFramePrevious } from "./StackFramePrevious";

export class StackFrame {
    private _line: number;
    private _name: string;
    private _sourceName: string;
    private _sourcePath: string;
    private _previousStackFrame: StackFramePrevious;

    public constructor(line: number, name: string, sourceName: string, sourcePath: string) {
        this._line = line;
        this._name = name;
        this._sourceName = sourceName;
        this._sourcePath = sourcePath;
        this._previousStackFrame = new StackFramePrevious(0, "", "", "");
    }

    public get line(): number {
        return this._line;
    }

    public get name(): string {
        return this._name;
    }

    public get sourceName(): string {
        return this._sourceName;
    }

    public get sourcePath(): string {
        return this._sourcePath;
    }

    public get previousStackFrame(): StackFramePrevious {
        return this._previousStackFrame;
    }

    public set previousStackFrame(value: StackFramePrevious) {
        this._previousStackFrame = value;
    }

    public isEqual(frame: any): boolean {
        let nameEqual: boolean = this.name === frame.name;
        let sourceNameEqual: boolean = this.sourceName === frame.source.name;
        let sourcePathEqual: boolean = this.sourcePath === frame.source.path;

        return nameEqual === sourceNameEqual === sourcePathEqual === true;
    }
}