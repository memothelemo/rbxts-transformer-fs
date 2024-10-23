import ts from "typescript";
import { assert } from "./util/assert";

export abstract class BaseFileSymbol {
    public abstract file: ts.SourceFile;
    protected abstract symbol: ts.Symbol;

    public get(name: string) {
        return this.symbol.exports?.get(name as ts.__String);
    }

    public expect(name: string) {
        const symbol = this.get(name);
        assert(symbol, `Could not find symbol of ${name} from ${this.file.fileName}`);
        return symbol;
    }
}

export abstract class BaseNamespaceSymbol {
    protected readonly symbol: ts.Symbol;

    public constructor(
        protected readonly fileSymbol: BaseFileSymbol,
        protected readonly name: string,
    ) {
        this.symbol = fileSymbol.expect(name);
    }

    public expect(name: string) {
        const symbol = this.symbol.exports?.get(name as ts.__String);
        assert(symbol, `Could not find symbol of ${name} from ${this.fileSymbol.file.fileName}`);
        return symbol;
    }
}
