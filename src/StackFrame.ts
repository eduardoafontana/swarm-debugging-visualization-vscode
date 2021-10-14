import { StackFramePrevious } from "./StackFramePrevious";
import { Variable } from "./Variable";

export class StackFrame {
    private _id: number;
    private _identifier: string;
    private _line: number;
    private _name: string;
    private _sourceName: string;
    private _sourcePath: string;
    private _previousStackFrame: StackFramePrevious;
    private _variables: Array<Variable>;

    public constructor(id: number, identifier:string, line: number, name: string, sourceName: string, sourcePath: string) {
        this._id = id;
        this._identifier = identifier;
        this._line = line;
        this._name = name;
        this._sourceName = sourceName;
        this._sourcePath = sourcePath;
        this._previousStackFrame = new StackFramePrevious(0, "", "", "");
        this._variables = [];
    }

    public get id(): number {
        return this._id;
    }

    public get identifier(): string {
        return this._identifier;
    }

    public get line(): number {
        return this._line;
    }

    public set line(value: number) {
        this._line = value;
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

    public get variables(): Array<Variable> {
        return this._variables;
    }

    public set variables(value: Array<Variable>) {
        this._variables = value;
    }

    public isEqual(frame: any): boolean {
        let nameEqual: boolean = this.name === frame.name;
        let sourceNameEqual: boolean = this.sourceName === frame.source.name;
        let sourcePathEqual: boolean = this.sourcePath === frame.source.path;

        return nameEqual === sourceNameEqual === sourcePathEqual === true;
    }
}