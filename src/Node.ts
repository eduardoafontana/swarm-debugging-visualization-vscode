// export class Node {
//     private _identifier: string;
//     private _name: string;
//     private _parentNode: Node | null;

//     public constructor(identifier:string, name: string) {
//         this._name = name;
//         this._identifier = identifier;
//         this._parentNode = null;
//     }

//     public get name(): string {
//         return this._name;
//     }

//     public get identifier(): string {
//         return this._identifier;
//     }

//     public get parentNode(): Node | null {
//         return this._parentNode;
//     }

//     public set parentNode(value: Node | null) {
//         this._parentNode = value;
//     }

//     public isEqual(element: any): boolean {
//         let nameEqual: boolean = this.name === element.name;

//         return nameEqual === true;
//     }
// }