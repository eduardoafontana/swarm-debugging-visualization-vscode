import { StackFrame } from "./StackFrame";

export class Variable {
    private _id: number;
    private _sequence: string;
    private _name: string;
    private _stackFrameLinked: StackFrame | null;

    public constructor(id: number, sequence:string, name: string) {
        this._id = id;
        this._sequence = sequence;
        this._name = name;
        this._stackFrameLinked = null;
    }

    public get id(): number {
        return this._id;
    }

    public get sequence(): string {
        return this._sequence;
    }

    public get name(): string {
        return this._name;
    }

    public get stackFrameLinked(): StackFrame | null {
        return this._stackFrameLinked;
    }
    public set stackFrameLinked(value: StackFrame | null) {
        this._stackFrameLinked = value;
    }

    public isEqual(element: any): boolean {
        let nameEqual: boolean = this.name === element.name;

        return nameEqual === true;
    }
}