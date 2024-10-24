import Diagnostics from "@shared/services/diagnostics";
import { State } from "@transform/state";
import ts from "typescript";
import { transformStatementList } from "./transformStatementList";
import { f } from "@transform/factory";

export function transformFile(state: State, file: ts.SourceFile): ts.SourceFile {
    const statements = transformStatementList(state, file.statements);
    for (const diagnostic of Diagnostics.flush()) {
        state.addDiagnostic(diagnostic);
    }

    // bringing imports in
    const imports = state.fileImports.get(file.fileName);
    if (imports) {
        const firstStatement = file.statements[0];
        const importStatements = imports.map(info => {
            return f.stmt.importDeclaration(
                info.path,
                info.entries.map(x => [x.name, x.identifier]),
            );
        });
        statements.unshift(...importStatements);

        // steal comments from original first statement so that comment directives work properly
        if (firstStatement && statements[0]) {
            const original = ts.getParseTreeNode(firstStatement);
            ts.moveSyntheticComments(statements[0], firstStatement);

            if (original) {
                ts.copyComments(original, statements[0]);
                ts.removeAllComments(original);
            }
        }
    }

    return f.update.sourceFile(file, statements);
}
